```
 _   _       _     _ _   _____                    
| | | | __ _| |__ (_) |_|  ___|__  _ __ __ _  ___ 
| |_| |/ _` | '_ \| | __| |_ / _ \| '__/ _` |/ _ \
|  _  | (_| | |_) | | |_|  _| (_) | | | (_| |  __/
|_| |_|\__,_|_.__/|_|\__|_|  \___/|_|  \__, |\___|
                                        |___/      
```

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)
![Tests](https://img.shields.io/badge/Tests-52%20passing-brightgreen?style=flat-square)

---

## Descripcion

**HabitForge** es un tracker de habitos con accountability social. Forja habitos que duran mediante el seguimiento diario, rachas motivacionales y un dashboard interactivo con diseno neomorfista calido.

> *Construye habitos de acero, un dia a la vez.*

---

## Caracteristicas

- [x] Autenticacion JWT con Passport (registro + login)
- [x] CRUD completo de habitos (diarios / semanales)
- [x] Sistema de check-ins con check-in individual y por lote
- [x] Calculo automatico de rachas (streaks)
- [x] Dashboard con resumen del dia, calendario y estadisticas
- [x] Reordenamiento de habitos por drag & drop
- [x] Filtrado por rango de fechas
- [x] Interfaz neomorfista con tema calido
- [x] API versionada (`/api/v1`)
- [x] Validacion declarativa con `class-validator`
- [x] Manejo centralizado de excepciones
- [x] 52 tests unitarios pasando

---

## Tech Stack

| Componente | Tecnologia |
|---|---|
| **Framework** | NestJS 10 |
| **Lenguaje** | TypeScript 5.3 |
| **ORM** | TypeORM 0.3 |
| **Base de datos** | SQLite (dev) / PostgreSQL (prod) |
| **Autenticacion** | Passport + JWT |
| **Validacion** | class-validator + class-transformer |
| **Testing** | Jest + Supertest |
| **Runtime** | Node.js 18+ |

---

## Arquitectura

```
Cliente (UI Neomorfista)
        |
        v
   NestJS API (/api/v1)
        |
   +---------+---------+-----------+
   |         |         |           |
  Auth    Habits   Check-ins   Dashboard
   |         |         |           |
   +---------+---------+-----------+
        |
     TypeORM
        |
   SQLite / PostgreSQL
```

La aplicacion sigue una arquitectura modular por capas:

- **Controllers** - Manejo de HTTP requests y validacion de entrada
- **Services** - Logica de negocio, calculo de rachas, agregaciones
- **Entities** - Modelos de datos con TypeORM (User, Habit, CheckIn, Streak)
- **DTOs** - Objetos de transferencia con validacion declarativa
- **Guards** - Proteccion de rutas con JWT
- **Filters** - Manejo centralizado de excepciones HTTP
- **Interceptors** - Transformacion estandarizada de respuestas

---

## Ejecutar localmente

### Prerequisitos

- Node.js 18+
- npm 9+

### Instalacion

```bash
# Clonar el repositorio
git clone https://github.com/ronalc90/habit-forge.git
cd habit-forge

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en modo desarrollo
npm run start:dev
```

La API estara disponible en `http://localhost:3000/api/v1`

### Con Docker

```bash
docker-compose up -d
```

---

## Endpoints de la API

Todos los endpoints usan el prefijo `/api/v1`.

### Autenticacion

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Registrar nuevo usuario | No |
| `POST` | `/auth/login` | Iniciar sesion | No |
| `GET` | `/auth/profile` | Obtener perfil del usuario | JWT |

### Habitos

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `POST` | `/habits` | Crear nuevo habito | JWT |
| `GET` | `/habits` | Listar habitos del usuario | JWT |
| `GET` | `/habits/:id` | Obtener habito por ID | JWT |
| `PATCH` | `/habits/:id` | Actualizar habito | JWT |
| `DELETE` | `/habits/:id` | Eliminar habito | JWT |
| `POST` | `/habits/reorder` | Reordenar habitos | JWT |

### Check-ins

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `POST` | `/check-ins` | Registrar check-in | JWT |
| `POST` | `/check-ins/batch` | Check-in por lote | JWT |
| `DELETE` | `/check-ins/:habitId` | Deshacer check-in | JWT |
| `GET` | `/check-ins/range` | Check-ins por rango de fechas | JWT |
| `GET` | `/check-ins/today` | Check-ins de hoy | JWT |
| `GET` | `/check-ins/status/:habitId` | Estado de check-in de un habito | JWT |

### Dashboard

| Metodo | Endpoint | Descripcion | Auth |
|--------|----------|-------------|------|
| `GET` | `/dashboard/today` | Resumen del dia | JWT |
| `GET` | `/dashboard/calendar` | Vista de calendario | JWT |
| `GET` | `/dashboard/stats` | Estadisticas generales | JWT |

---

## Estructura del proyecto

```
src/
├── auth/                    # Modulo de autenticacion
│   ├── dto/                 # DTOs de login y registro
│   ├── guards/              # JWT y Local auth guards
│   ├── strategies/          # Passport strategies
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── habits/                  # Modulo de habitos
│   ├── dto/                 # Create, Update, Reorder DTOs
│   ├── habits.controller.ts
│   ├── habits.service.ts
│   └── habits.module.ts
├── check-ins/               # Modulo de check-ins
│   ├── dto/                 # Create, Batch, DateRange DTOs
│   ├── check-ins.controller.ts
│   ├── check-ins.service.ts
│   └── check-ins.module.ts
├── dashboard/               # Modulo de dashboard
│   ├── dto/                 # Dashboard query DTO
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dashboard.module.ts
├── streaks/                 # Modulo de rachas
│   ├── streaks.service.ts
│   └── streaks.module.ts
├── notifications/           # Modulo de notificaciones
│   ├── notifications.service.ts
│   └── notifications.module.ts
├── database/                # Configuracion de base de datos
│   ├── entities/            # Entidades TypeORM
│   ├── migrations/          # Migraciones
│   └── data-source.ts
├── common/                  # Utilidades compartidas
│   ├── decorators/          # @CurrentUser decorator
│   ├── filters/             # HttpExceptionFilter
│   ├── interceptors/        # TransformInterceptor
│   └── dto/                 # PaginationDto
├── app.module.ts
└── main.ts
```

---

## Variables de entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=habitforge
DB_PASSWORD=habitforge_secret
DB_DATABASE=habitforge

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# Aplicacion
PORT=3000
NODE_ENV=development
```

---

## Tests

```bash
# Ejecutar tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests e2e
npm run test:e2e
```

---

## Autor

Desarrollado por **Ronald**.

## Licencia

Este proyecto esta bajo la licencia [MIT](LICENSE).
