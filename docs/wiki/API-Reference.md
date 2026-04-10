# API Reference

## Informacion General

- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **Autenticacion**: JWT Bearer Token

### Formato de Respuesta Exitosa

```json
{ "success": true, "data": { ... }, "timestamp": "ISO 8601" }
```

### Formato de Error

```json
{ "success": false, "statusCode": 400, "message": "...", "timestamp": "ISO 8601", "path": "/api/v1/..." }
```

## Endpoints

### Auth

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/auth/register` | Registro de usuario | No |
| POST | `/auth/login` | Login con email/password | No |
| GET | `/auth/profile` | Perfil del usuario | JWT |

**POST /auth/register**

Body: `{ email, displayName, password, timezone? }`
Respuesta: `{ accessToken, user: { id, email, displayName, timezone } }`

**POST /auth/login**

Body: `{ email, password }`
Respuesta: `{ accessToken, user: { id, email, displayName, timezone } }`

**GET /auth/profile**

Respuesta: `{ id, email, displayName, avatarUrl, timezone, createdAt }`

### Habits

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/habits` | Crear habito | JWT |
| GET | `/habits` | Listar habitos | JWT |
| GET | `/habits?active=true` | Listar activos | JWT |
| GET | `/habits/:id` | Obtener por ID | JWT |
| PATCH | `/habits/:id` | Actualizar | JWT |
| DELETE | `/habits/:id` | Eliminar | JWT |
| POST | `/habits/reorder` | Reordenar | JWT |

**POST /habits**

Body: `{ name, icon?, frequency?, preferredTime?, targetDaysPerWeek? }`

- name: string, requerido, max 200
- icon: string, max 50
- frequency: "daily" | "weekly" | "custom"
- preferredTime: "HH:mm"
- targetDaysPerWeek: 1-7

**POST /habits/reorder**

Body: `{ habitIds: string[] }` (UUIDs en el orden deseado)

### Check-ins

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| POST | `/check-ins` | Check-in individual | JWT |
| POST | `/check-ins/batch` | Check-in masivo | JWT |
| DELETE | `/check-ins/:habitId` | Deshacer | JWT |
| GET | `/check-ins/today` | Check-ins de hoy | JWT |
| GET | `/check-ins/range` | Por rango de fechas | JWT |
| GET | `/check-ins/status/:habitId` | Estado de check-in | JWT |

**POST /check-ins**

Body: `{ habitId, checkDate? }` (checkDate default: hoy, formato YYYY-MM-DD)

**POST /check-ins/batch**

Body: `{ habits: [{ habitId }], checkDate? }`

**DELETE /check-ins/:habitId?date=YYYY-MM-DD**

Deshacer un check-in. Si no se especifica date, usa hoy.

**GET /check-ins/range?startDate=X&endDate=Y&habitId=Z**

- startDate: requerido
- endDate: requerido
- habitId: opcional (filtro)

### Dashboard

| Metodo | Ruta | Descripcion | Auth |
|--------|------|-------------|------|
| GET | `/dashboard/today` | Resumen del dia | JWT |
| GET | `/dashboard/calendar` | Datos de calendario | JWT |
| GET | `/dashboard/stats` | Estadisticas | JWT |

**GET /dashboard/today**

Respuesta: `{ totalHabits, completedToday, completionRate, currentStreaks: [...] }`

**GET /dashboard/calendar?startDate=X&endDate=Y**

Respuesta: `{ dates: [{ date, completedCount, totalHabits, completionRate }] }`

**GET /dashboard/stats?period=week|month&date=YYYY-MM-DD**

Respuesta: `{ period, totalCheckIns, totalPossible, consistencyRate, habitBreakdown: [...] }`

## Codigos de Error

| Codigo | Significado |
|--------|-------------|
| 400 | Bad Request - Validacion fallida |
| 401 | Unauthorized - Token invalido o expirado |
| 403 | Forbidden - Recurso de otro usuario |
| 404 | Not Found - Recurso no existe |
| 409 | Conflict - Duplicado (email o check-in) |
| 500 | Internal Server Error |
