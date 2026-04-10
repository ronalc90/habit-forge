# Arquitectura

## Vision General

HabitForge sigue una arquitectura modular por capas basada en NestJS. Cada dominio esta encapsulado en un modulo independiente.

## Diagrama de Modulos

```
┌──────────────────────────────────────────────────┐
│                   AppModule                      │
│  ConfigModule | TypeOrmModule | ScheduleModule   │
└───────┬──────┬──────┬──────┬──────┬──────────────┘
        │      │      │      │      │
   ┌────┴─┐ ┌─┴──┐ ┌─┴──┐ ┌┴───┐ ┌┴─────────┐
   │ Auth │ │Hab.│ │C-In│ │Str.│ │ Dashboard │
   └──────┘ └────┘ └────┘ └────┘ └───────────┘
                                  ┌─────────────┐
                                  │Notifications│
                                  └─────────────┘
```

## Modulos

### AuthModule

- **Responsabilidad**: Registro, login, gestion de perfil
- **Componentes**: AuthController, AuthService, JwtStrategy, LocalStrategy
- **Entidades**: User
- **Dependencias externas**: `@nestjs/jwt`, `@nestjs/passport`, `bcrypt`

### HabitsModule

- **Responsabilidad**: CRUD de habitos, reordenamiento
- **Componentes**: HabitsController, HabitsService
- **Entidades**: Habit, Streak
- **Detalle**: Al crear un habito, se crea automaticamente un registro Streak asociado

### CheckInsModule

- **Responsabilidad**: Registro de completado diario, undo, consultas
- **Componentes**: CheckInsController, CheckInsService
- **Entidades**: CheckIn, Habit
- **Dependencias internas**: StreaksModule (para actualizar rachas)

### StreaksModule

- **Responsabilidad**: Calculo y mantenimiento de rachas
- **Componentes**: StreaksService (sin controller)
- **Entidades**: Streak, CheckIn
- **Detalle**: Modulo de servicio puro, consumido por CheckInsModule

### DashboardModule

- **Responsabilidad**: Agregaciones y estadisticas
- **Componentes**: DashboardController, DashboardService
- **Entidades**: Habit, CheckIn, Streak (solo lectura)

### NotificationsModule

- **Responsabilidad**: Recordatorios programados
- **Componentes**: NotificationsService (con @Cron)
- **Detalle**: Actualmente mock; preparado para Firebase Cloud Messaging

### Common (Shared)

No es un modulo NestJS, sino utilidades compartidas:

- **HttpExceptionFilter**: Filtro global para respuestas de error
- **TransformInterceptor**: Envuelve respuestas exitosas en formato estandar
- **@CurrentUser**: Decorador de parametro para acceso al usuario autenticado

## Entidades y Relaciones

```
User (1) ──── (*) Habit (1) ──── (1) Streak
  │                  │
  │                  │
  └──── (*) CheckIn (*) ────┘

User (1) ──── (*) AccountabilityPartner (*) ──── (1) User
```

### Indices de Base de Datos

- `users.email` - UNIQUE
- `habits (user_id, is_active)` - Compuesto
- `check_ins (habit_id, check_date)` - UNIQUE (previene duplicados)
- `check_ins (user_id, check_date)` - Compuesto (consultas de hoy)
- `streaks.habit_id` - UNIQUE
- `accountability_partners (user1_id, user2_id)` - UNIQUE
- `accountability_partners.invite_code` - UNIQUE

## Pipeline de Request

1. CORS middleware
2. Global prefix `/api/v1`
3. **ValidationPipe** (whitelist, transform)
4. **Guards** (JwtAuthGuard / LocalAuthGuard)
5. **Controller** (rutas, decoradores)
6. **Service** (logica de negocio)
7. **Repository** (acceso a datos)
8. **TransformInterceptor** (formato de respuesta)
9. **HttpExceptionFilter** (en caso de error)

## Configuracion de Base de Datos

### Desarrollo (SQLite)

```typescript
TypeOrmModule.forRoot({
  type: 'better-sqlite3',
  database: 'habitforge.sqlite',
  synchronize: true,  // Auto-crear tablas
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
})
```

### Produccion (PostgreSQL)

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,  // Usar migraciones
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
})
```
