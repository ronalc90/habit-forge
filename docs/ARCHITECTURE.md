# Arquitectura de HabitForge

## Vision General

HabitForge sigue una **arquitectura modular por capas** basada en los principios de NestJS. Cada dominio funcional esta encapsulado en un modulo independiente con sus propios controladores, servicios y entidades.

## Modulos del Sistema

### AppModule (Raiz)

Modulo raiz que orquesta la configuracion global:

- **ConfigModule** - Variables de entorno con `.env` (global)
- **TypeOrmModule** - Conexion a base de datos (SQLite dev / PostgreSQL prod)
- **ScheduleModule** - Soporte para tareas programadas (cron)

### AuthModule

Responsable de autenticacion y autorizacion:

- **AuthController** - Endpoints: `POST /register`, `POST /login`, `GET /profile`
- **AuthService** - Hash con bcrypt (12 rounds), validacion de credenciales, generacion JWT
- **JwtStrategy** - Extraccion de token desde `Authorization: Bearer <token>`
- **LocalStrategy** - Validacion de email/password para login
- **Guards** - `JwtAuthGuard` y `LocalAuthGuard`

**Dependencias**: `User` entity, `@nestjs/jwt`, `@nestjs/passport`

### HabitsModule

CRUD completo de habitos con soporte para reordenamiento:

- **HabitsController** - CRUD + endpoint de reorder
- **HabitsService** - Logica de negocio, auto-asignacion de `sortOrder`, creacion automatica de `Streak` al crear habito

**Dependencias**: `Habit` entity, `Streak` entity

### CheckInsModule

Registro y gestion de check-ins diarios:

- **CheckInsController** - Check-in individual, batch, undo, consultas por rango y estado
- **CheckInsService** - Validacion de ownership, prevencion de duplicados, delegacion a `StreaksService` para actualizacion de rachas

**Dependencias**: `CheckIn` entity, `Habit` entity, `StreaksModule`

### StreaksModule

Motor de calculo de rachas (streaks):

- **StreaksService** - Algoritmo incremental para check-in + recalculo completo para undo
- Sin controller (modulo de servicio puro)

**Dependencias**: `Streak` entity, `CheckIn` entity

### DashboardModule

Agregaciones y estadisticas:

- **DashboardController** - Resumen diario, calendario, stats por periodo
- **DashboardService** - Calculos de completion rate, consistency rate, desglose por habito

**Dependencias**: `Habit` entity, `CheckIn` entity, `Streak` entity

### NotificationsModule

Notificaciones programadas:

- **NotificationsService** - Recordatorios diarios (cron 9 AM), mock de push notifications
- Preparado para integracion futura con Firebase Cloud Messaging

**Dependencias**: `Habit` entity

### Common (Shared)

Utilidades transversales sin modulo propio:

- **HttpExceptionFilter** - Filtro global que estandariza errores: `{ success: false, statusCode, message, timestamp, path }`
- **TransformInterceptor** - Envuelve respuestas exitosas: `{ success: true, data, timestamp }`
- **@CurrentUser** - Decorador de parametro para obtener el usuario autenticado del request

## Entidades TypeORM

### User

```
users
├── id: UUID (PK)
├── email: VARCHAR(255) UNIQUE
├── display_name: VARCHAR(100)
├── password_hash: VARCHAR(255)
├── avatar_url: VARCHAR(500) nullable
├── timezone: VARCHAR(50) default 'UTC'
└── created_at: TIMESTAMP
```

**Relaciones**: `OneToMany -> Habit`, `OneToMany -> CheckIn`

### Habit

```
habits
├── id: UUID (PK)
├── user_id: UUID (FK -> users) CASCADE
├── name: VARCHAR(200)
├── icon: VARCHAR(50) nullable
├── frequency: VARCHAR(20) default 'daily'
├── preferred_time: TIME nullable
├── target_days_per_week: INT default 7
├── sort_order: INT default 0
├── is_active: BOOLEAN default true
└── created_at: TIMESTAMP
```

**Indices**: `(user_id, is_active)`
**Relaciones**: `ManyToOne -> User`, `OneToMany -> CheckIn`, `OneToOne -> Streak`

### CheckIn

```
check_ins
├── id: UUID (PK)
├── habit_id: UUID (FK -> habits) CASCADE
├── user_id: UUID (FK -> users) CASCADE
├── check_date: DATE
└── completed_at: TIMESTAMP
```

**Indices**: `(habit_id, check_date) UNIQUE`, `(user_id, check_date)`

### Streak

```
streaks
├── id: UUID (PK)
├── habit_id: UUID (FK -> habits) UNIQUE CASCADE
├── current_streak: INT default 0
├── best_streak: INT default 0
├── last_check_date: DATE nullable
└── updated_at: TIMESTAMP
```

**Indice**: `(habit_id) UNIQUE`

### AccountabilityPartner

```
accountability_partners
├── id: UUID (PK)
├── user1_id: UUID (FK -> users) CASCADE
├── user2_id: UUID (FK -> users) nullable CASCADE
├── status: VARCHAR(20) default 'pending'
├── invite_code: VARCHAR(20) UNIQUE
└── created_at: TIMESTAMP
```

**Indices**: `(user1_id, user2_id) UNIQUE`, `(invite_code) UNIQUE`

## Diagrama de Relaciones

```
┌──────────┐       ┌──────────┐       ┌──────────┐
│   User   │──1:N──│  Habit   │──1:1──│  Streak  │
│          │       │          │       │          │
│  email   │       │  name    │       │ current  │
│  display │       │  freq    │       │ best     │
│  pwHash  │       │  active  │       │ lastDate │
└────┬─────┘       └────┬─────┘       └──────────┘
     │                  │
     │              ┌───┴────┐
     └──────1:N─────│CheckIn │
                    │        │
                    │  date  │
                    │ habitId│
                    └────────┘

┌──────────────────────────┐
│  AccountabilityPartner   │
│                          │
│  user1 ──> User          │
│  user2 ──> User (null)   │
│  inviteCode (unique)     │
│  status (pending/accept) │
└──────────────────────────┘
```

## Algoritmo de Streaks

El calculo de rachas usa dos estrategias:

### Estrategia Incremental (O(1)) - En check-in

```
function updateStreakOnCheckIn(habitId, checkDate):
  streak = findStreak(habitId)
  yesterday = getPreviousDay(checkDate)

  if streak.lastCheckDate == null:
    streak.currentStreak = 1          // Primera vez
  else if streak.lastCheckDate == yesterday:
    streak.currentStreak += 1          // Dia consecutivo
  else if streak.lastCheckDate == checkDate:
    return streak                      // Duplicado, sin cambio
  else:
    streak.currentStreak = 1           // Gap: reset

  streak.bestStreak = max(streak.currentStreak, streak.bestStreak)
  streak.lastCheckDate = checkDate
  save(streak)
```

### Estrategia de Recalculo Completo (O(n)) - En undo

```
function recalculateStreak(habitId):
  checkIns = findAll(habitId, orderBy: checkDate DESC)

  if checkIns.empty:
    streak.currentStreak = 0
    streak.lastCheckDate = null
    return

  // Calcular best streak historico
  bestStreak = 1, tempStreak = 1
  for i in 1..sortedDates.length:
    if sortedDates[i] == getPreviousDay(sortedDates[i-1]):
      tempStreak++
    else:
      tempStreak = 1
    bestStreak = max(bestStreak, tempStreak)

  // Calcular current streak (desde hoy hacia atras)
  if mostRecentDate == today OR mostRecentDate == yesterday:
    currentStreak = 1
    for i in 1..sortedDates.length:
      if sortedDates[i] == getPreviousDay(sortedDates[i-1]):
        currentStreak++
      else: break
  else:
    currentStreak = 0
```

### Manejo de Limites de Mes y Anio

La funcion `getPreviousDay` opera sobre objetos Date UTC, garantizando transiciones correctas:

- `2024-02-01` -> `2024-01-31` (limite de mes)
- `2024-01-01` -> `2023-12-31` (limite de anio)
- `2024-03-01` -> `2024-02-29` (anio bisiesto)

Esto esta cubierto por tests especificos.

## Pipeline de Request

```
HTTP Request
    │
    ├── CORS Middleware (configurable origin)
    │
    ├── Global Prefix: /api/v1
    │
    ├── ValidationPipe
    │   ├── whitelist: true (elimina props desconocidas)
    │   ├── forbidNonWhitelisted: true (rechaza props desconocidas)
    │   ├── transform: true (convierte tipos automaticamente)
    │   └── enableImplicitConversion: true
    │
    ├── Guards (JwtAuthGuard / LocalAuthGuard)
    │   └── Passport strategies validan token/credenciales
    │
    ├── Controller
    │   └── @CurrentUser extrae usuario del request
    │
    ├── Service (logica de negocio)
    │
    ├── TypeORM Repository
    │
    ├── TransformInterceptor
    │   └── { success: true, data: <result>, timestamp }
    │
    └── HttpExceptionFilter (en caso de error)
        └── { success: false, statusCode, message, timestamp, path }
```
