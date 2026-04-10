<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js 18" />
  <img src="https://img.shields.io/badge/NestJS-10-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS 10" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Jest-29-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">HabitForge</h1>

<p align="center">
  <strong>Forja habitos que transforman tu vida</strong><br/>
  Tracker de habitos con accountability social, streaks inteligentes y UI neomorfica
</p>

<p align="center">
  <a href="#sobre-el-proyecto">Sobre el Proyecto</a> &bull;
  <a href="#caracteristicas">Caracteristicas</a> &bull;
  <a href="#arquitectura">Arquitectura</a> &bull;
  <a href="#stack-tecnologico">Stack</a> &bull;
  <a href="#instalacion">Instalacion</a> &bull;
  <a href="#api-documentation">API</a> &bull;
  <a href="#testing">Testing</a> &bull;
  <a href="#despliegue">Despliegue</a>
</p>

---

## Sobre el Proyecto

**HabitForge** es una aplicacion full-stack para el seguimiento de habitos personales con un enfoque unico en **accountability social**. Permite a los usuarios crear habitos, registrar su progreso diario, mantener rachas (streaks) y compartir su avance con un partner de responsabilidad.

El proyecto nacio de la necesidad de una herramienta que no solo rastree habitos, sino que incorpore mecanismos de presion social positiva para mantener la consistencia. A diferencia de otras apps de habitos, HabitForge pone el foco en la relacion entre dos personas que se comprometen mutuamente a cumplir sus metas.

### Problema que resuelve

- Las apps de habitos convencionales dependen solo de la voluntad individual
- La mayoria no ofrece mecanismos de accountability social
- Los algoritmos de streaks suelen ser basicos y no manejan edge cases (limites de mes/anio)
- Falta de APIs bien documentadas para integraciones futuras

## Caracteristicas

### MVP Implementado

- **Autenticacion completa** - Registro, login y perfil con JWT + Passport
- **CRUD de habitos** - Crear, listar, actualizar, eliminar y reordenar habitos
- **Sistema de check-ins** - Check-in individual, batch y undo con validacion de duplicados
- **Algoritmo de streaks** - Calculo inteligente con soporte para limites de mes y anio
- **Dashboard analitico** - Resumen diario, calendario de completado y estadisticas por periodo
- **Accountability Partners** - Sistema de invitaciones por codigo unico
- **Notificaciones programadas** - Recordatorios diarios via cron job (9 AM)
- **UI Neomorfica** - Frontend single-page con Tailwind CSS y Alpine.js
- **API RESTful versionada** - Prefijo `/api/v1` con respuestas estandarizadas

### Detalles Tecnicos

- Validacion declarativa con `class-validator` y `class-transformer`
- Manejo centralizado de excepciones con filtro global
- Interceptor de transformacion para respuestas consistentes (`{ success, data, timestamp }`)
- Decorador personalizado `@CurrentUser` para acceso al usuario autenticado
- Indices de base de datos optimizados para consultas frecuentes
- Constraint UNIQUE en check-ins para prevenir duplicados a nivel de DB

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        AppModule (Root)                         │
│  ConfigModule.forRoot() | TypeOrmModule.forRoot() | Schedule    │
└──────────┬──────────┬──────────┬──────────┬──────────┬──────────┘
           │          │          │          │          │
    ┌──────┴──┐ ┌─────┴───┐ ┌───┴────┐ ┌───┴───┐ ┌───┴────────┐
    │  Auth   │ │ Habits  │ │CheckIns│ │Streaks│ │ Dashboard  │
    │ Module  │ │ Module  │ │ Module │ │Module │ │  Module    │
    ├─────────┤ ├─────────┤ ├────────┤ ├───────┤ ├────────────┤
    │Controller│ │Controller│ │Controller│ │       │ │ Controller │
    │ Service │ │ Service │ │ Service│ │Service│ │  Service   │
    │JWT Strat│ │         │ │        │ │       │ │            │
    │Local St.│ │         │ │        │ │       │ │            │
    └────┬────┘ └────┬────┘ └───┬────┘ └───┬───┘ └─────┬──────┘
         │          │          │          │           │
    ┌────┴────┐ ┌───┴────┐ ┌───┴───┐ ┌───┴───┐ ┌────┴─────┐
    │  User   │ │ Habit  │ │CheckIn│ │Streak │ │ Habit    │
    │ Entity  │ │ Entity │ │Entity │ │Entity │ │ CheckIn  │
    └─────────┘ └────────┘ └───────┘ └───────┘ │ Streak   │
                                                └──────────┘
    ┌───────────────────┐  ┌───────────────────────────────┐
    │  Notifications    │  │         Common                │
    │  Module           │  │  HttpExceptionFilter          │
    │  (Cron: 9 AM)     │  │  TransformInterceptor         │
    └───────────────────┘  │  @CurrentUser Decorator       │
                           └───────────────────────────────┘
```

### Flujo de Datos

```
Cliente HTTP
    │
    ▼
ValidationPipe (whitelist + transform)
    │
    ▼
Controller (rutas, guards, decoradores)
    │
    ▼
Service (logica de negocio)
    │
    ▼
TypeORM Repository (acceso a datos)
    │
    ▼
SQLite / PostgreSQL
```

> Para documentacion detallada de la arquitectura, ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Stack Tecnologico

| Capa | Tecnologia | Proposito |
|------|-----------|-----------|
| **Runtime** | Node.js 18 | Entorno de ejecucion |
| **Framework** | NestJS 10 | Framework backend modular |
| **Lenguaje** | TypeScript 5.3 | Tipado estatico |
| **ORM** | TypeORM 0.3 | Mapeo objeto-relacional |
| **DB (dev)** | SQLite (better-sqlite3) | Base de datos local |
| **DB (prod)** | PostgreSQL 16 | Base de datos produccion |
| **Auth** | Passport + JWT | Autenticacion stateless |
| **Validacion** | class-validator | Validacion declarativa |
| **Scheduler** | @nestjs/schedule | Cron jobs |
| **Frontend** | Tailwind CSS + Alpine.js | UI neomorfica reactiva |
| **Testing** | Jest + Supertest | Unit + E2E tests |
| **Contenedor** | Docker | Despliegue |

## Instalacion

### Prerrequisitos

- Node.js >= 18
- npm >= 9
- Docker y Docker Compose (opcional, para PostgreSQL y Redis)

### Configuracion rapida

```bash
# 1. Clonar el repositorio
git clone https://github.com/ronalc90/habit-forge.git
cd habit-forge

# 2. Instalar dependencias
npm ci

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Ejecutar en modo desarrollo (SQLite por defecto)
npm run start:dev

# 5. Abrir el frontend
open http://localhost:3000
```

### Con Docker (PostgreSQL + Redis)

```bash
# Levantar servicios de infraestructura
docker-compose up -d

# Configurar .env para apuntar a PostgreSQL
# DB_HOST=localhost, DB_PORT=5432, etc.

# Ejecutar la app
npm run start:dev
```

## Variables de Entorno

| Variable | Descripcion | Default | Requerida |
|----------|-------------|---------|-----------|
| `DB_HOST` | Host de PostgreSQL | `localhost` | No* |
| `DB_PORT` | Puerto de PostgreSQL | `5432` | No* |
| `DB_USERNAME` | Usuario de PostgreSQL | `habitforge` | No* |
| `DB_PASSWORD` | Password de PostgreSQL | - | No* |
| `DB_DATABASE` | Nombre de la base de datos | `habitforge.sqlite` | No |
| `JWT_SECRET` | Clave secreta para tokens JWT | - | **Si** |
| `JWT_EXPIRATION` | Tiempo de expiracion del token | `7d` | No |
| `PORT` | Puerto de la aplicacion | `3000` | No |
| `NODE_ENV` | Entorno de ejecucion | `development` | No |
| `REDIS_HOST` | Host de Redis | `localhost` | No |
| `REDIS_PORT` | Puerto de Redis | `6379` | No |
| `CORS_ORIGIN` | Origen permitido para CORS | `*` | No |

> *En modo desarrollo se usa SQLite y no se requiere PostgreSQL.

## API Documentation

Todos los endpoints usan el prefijo `/api/v1`. Las respuestas siguen el formato estandarizado:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-10T12:00:00.000Z"
}
```

### Autenticacion

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/auth/register` | Registrar nuevo usuario | No |
| `POST` | `/api/v1/auth/login` | Iniciar sesion | No |
| `GET` | `/api/v1/auth/profile` | Obtener perfil del usuario | JWT |

### Habitos

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/habits` | Crear un habito | JWT |
| `GET` | `/api/v1/habits` | Listar todos los habitos | JWT |
| `GET` | `/api/v1/habits?active=true` | Listar habitos activos | JWT |
| `GET` | `/api/v1/habits/:id` | Obtener un habito por ID | JWT |
| `PATCH` | `/api/v1/habits/:id` | Actualizar un habito | JWT |
| `DELETE` | `/api/v1/habits/:id` | Eliminar un habito | JWT |
| `POST` | `/api/v1/habits/reorder` | Reordenar habitos | JWT |

### Check-ins

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/v1/check-ins` | Registrar check-in | JWT |
| `POST` | `/api/v1/check-ins/batch` | Check-in masivo | JWT |
| `DELETE` | `/api/v1/check-ins/:habitId` | Deshacer check-in | JWT |
| `GET` | `/api/v1/check-ins/today` | Check-ins de hoy | JWT |
| `GET` | `/api/v1/check-ins/range` | Check-ins por rango de fechas | JWT |
| `GET` | `/api/v1/check-ins/status/:habitId` | Estado de check-in | JWT |

### Dashboard

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/dashboard/today` | Resumen del dia | JWT |
| `GET` | `/api/v1/dashboard/calendar` | Datos de calendario | JWT |
| `GET` | `/api/v1/dashboard/stats` | Estadisticas por periodo | JWT |

> Para documentacion completa con ejemplos curl, ver [docs/API.md](docs/API.md)

## Estructura del Proyecto

```
habit-forge/
├── src/
│   ├── auth/                    # Modulo de autenticacion
│   │   ├── dto/                 # DTOs: RegisterDto, LoginDto, AuthResponseDto
│   │   ├── guards/              # JwtAuthGuard, LocalAuthGuard
│   │   ├── strategies/          # JwtStrategy, LocalStrategy (Passport)
│   │   ├── auth.controller.ts   # Rutas: register, login, profile
│   │   ├── auth.service.ts      # Logica: hashing, validacion, JWT
│   │   └── auth.module.ts
│   ├── habits/                  # Modulo de habitos
│   │   ├── dto/                 # CreateHabitDto, UpdateHabitDto, ReorderDto
│   │   ├── habits.controller.ts # CRUD + reorder
│   │   ├── habits.service.ts    # Logica de negocio
│   │   └── habits.module.ts
│   ├── check-ins/               # Modulo de check-ins
│   │   ├── dto/                 # CreateCheckInDto, BatchDto, DateRangeDto
│   │   ├── check-ins.controller.ts
│   │   ├── check-ins.service.ts # Check-in, undo, batch, consultas
│   │   └── check-ins.module.ts
│   ├── streaks/                 # Modulo de rachas
│   │   ├── streaks.service.ts   # Algoritmo de calculo de rachas
│   │   └── streaks.module.ts
│   ├── dashboard/               # Modulo de dashboard
│   │   ├── dto/                 # DashboardQueryDto (period, date)
│   │   ├── dashboard.controller.ts
│   │   ├── dashboard.service.ts # Resumen, calendario, estadisticas
│   │   └── dashboard.module.ts
│   ├── notifications/           # Modulo de notificaciones
│   │   ├── notifications.service.ts  # Cron diario + mock push
│   │   └── notifications.module.ts
│   ├── common/                  # Utilidades compartidas
│   │   ├── decorators/          # @CurrentUser
│   │   ├── filters/             # HttpExceptionFilter global
│   │   ├── interceptors/        # TransformInterceptor
│   │   └── dto/                 # PaginationDto
│   ├── database/
│   │   ├── entities/            # User, Habit, CheckIn, Streak, AccountabilityPartner
│   │   └── migrations/          # Migracion inicial
│   ├── app.module.ts            # Modulo raiz
│   └── main.ts                  # Bootstrap de la aplicacion
├── test/
│   └── app.e2e-spec.ts          # Tests E2E del flujo completo
├── public/
│   └── index.html               # Frontend neomorfico (SPA)
├── docs/                        # Documentacion tecnica
├── .github/workflows/           # CI/CD con GitHub Actions
├── Dockerfile                   # Build multi-stage
├── docker-compose.yml           # PostgreSQL + Redis
├── package.json
└── tsconfig.json
```

## Decisiones Tecnicas

| Decision | Alternativa | Razon |
|----------|-------------|-------|
| **NestJS** sobre Express puro | Express, Fastify | Arquitectura modular, DI nativa, decoradores, ecosistema de modulos |
| **TypeORM** sobre Prisma | Prisma, Sequelize | Decoradores nativos con NestJS, Active Record + Data Mapper, migraciones |
| **SQLite** para desarrollo | PostgreSQL local, Docker | Zero-config, archivo unico, ideal para desarrollo rapido |
| **JWT + Passport** | Session-based auth | Stateless, escalable, multiples estrategias (local + jwt) |
| **Neomorfismo** para UI | Material, Bootstrap | Diferenciacion visual, experiencia tactil, innovacion en UX |
| **Algoritmo incremental** para streaks | Recalculo completo | O(1) en check-in vs O(n), con recalculo completo como fallback en undo |

> Para ADRs detallados, ver [docs/DECISIONS.md](docs/DECISIONS.md)

## Testing

El proyecto cuenta con **57 tests unitarios** y **21 tests E2E** (78 tests en total):

```bash
# Ejecutar tests unitarios
npm test

# Ejecutar con cobertura
npm run test:cov

# Ejecutar tests E2E (requiere PostgreSQL)
npm run test:e2e

# Ejecutar en modo watch
npm run test:watch
```

### Distribucion de Tests

| Modulo | Tests | Tipo |
|--------|-------|------|
| AuthController | 6 | Unit |
| HabitsController | 10 | Unit |
| CheckInsService | 13 | Unit |
| StreaksService | 17 | Unit |
| DashboardService | 11 | Unit |
| App E2E Flow | 21 | E2E |
| **Total** | **78** | - |

### Estrategia de Testing

- **Unit tests**: Servicios y controladores aislados con mocks de repositorios
- **E2E tests**: Flujo completo auth -> habits -> check-ins -> streaks -> dashboard
- **Cobertura**: Caso feliz + validaciones + errores + edge cases (limites de mes/anio)

## Despliegue

### Docker

```bash
# Construir imagen
docker build -t habitforge .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e JWT_SECRET=tu-clave-secreta \
  -e DB_DATABASE=habitforge.sqlite \
  habitforge
```

### Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login y deploy
railway login
railway init
railway up
```

> Para instrucciones detalladas de despliegue, ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Roadmap

- [x] MVP: Auth + Habits + Check-ins + Streaks + Dashboard
- [x] Frontend neomorfico con Tailwind + Alpine.js
- [x] Sistema de accountability partners
- [x] Notificaciones programadas (cron)
- [x] Tests unitarios y E2E
- [ ] Notificaciones push reales (Firebase Cloud Messaging)
- [ ] Sistema de logros y gamificacion
- [ ] Exportacion de datos (CSV, PDF)
- [ ] App movil (React Native)
- [ ] Integracion con wearables (Apple Health, Google Fit)
- [ ] Modo oscuro en UI neomorfica

## Autor

Desarrollado por **Ronald** - [GitHub](https://github.com/ronalc90)

## Licencia

Este proyecto esta bajo la Licencia MIT. Ver [LICENSE](LICENSE) para mas detalles.
