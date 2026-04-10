# API Documentation - HabitForge

## Informacion General

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **Autenticacion**: JWT Bearer Token (header `Authorization: Bearer <token>`)

### Formato de Respuesta

Todas las respuestas exitosas siguen este formato:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-04-10T12:00:00.000Z"
}
```

Las respuestas de error siguen este formato:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Descripcion del error",
  "timestamp": "2026-04-10T12:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

---

## Autenticacion

### POST /api/v1/auth/register

Registra un nuevo usuario.

**Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "displayName": "Mi Nombre",
  "password": "mipassword123",
  "timezone": "America/Santiago"
}
```

**Validaciones**:
- `email`: Email valido, requerido
- `displayName`: String, 2-100 caracteres
- `password`: String, 8-128 caracteres
- `timezone`: Opcional, max 50 caracteres

**Respuesta** (201):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@ejemplo.com",
      "displayName": "Mi Nombre",
      "timezone": "America/Santiago"
    }
  }
}
```

**Errores**:
- `409` - Email ya registrado

**curl**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "displayName": "Mi Nombre",
    "password": "mipassword123",
    "timezone": "America/Santiago"
  }'
```

### POST /api/v1/auth/login

Inicia sesion con credenciales existentes.

**Body**:
```json
{
  "email": "usuario@ejemplo.com",
  "password": "mipassword123"
}
```

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@ejemplo.com",
      "displayName": "Mi Nombre",
      "timezone": "America/Santiago"
    }
  }
}
```

**Errores**:
- `401` - Credenciales invalidas

**curl**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@ejemplo.com",
    "password": "mipassword123"
  }'
```

### GET /api/v1/auth/profile

Obtiene el perfil del usuario autenticado.

**Headers**: `Authorization: Bearer <token>`

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@ejemplo.com",
    "displayName": "Mi Nombre",
    "avatarUrl": null,
    "timezone": "America/Santiago",
    "createdAt": "2026-04-10T00:00:00.000Z"
  }
}
```

**Errores**:
- `401` - Token invalido o expirado

**curl**:
```bash
curl http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Habitos

Todos los endpoints de habitos requieren autenticacion JWT.

### POST /api/v1/habits

Crea un nuevo habito para el usuario autenticado.

**Body**:
```json
{
  "name": "Meditacion matutina",
  "icon": "meditation",
  "frequency": "daily",
  "preferredTime": "07:00",
  "targetDaysPerWeek": 7
}
```

**Validaciones**:
- `name`: Requerido, max 200 caracteres
- `icon`: Opcional, max 50 caracteres
- `frequency`: Opcional, enum: `daily`, `weekly`, `custom`
- `preferredTime`: Opcional, formato HH:mm
- `targetDaysPerWeek`: Opcional, entero 1-7

**Respuesta** (201):
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Meditacion matutina",
    "icon": "meditation",
    "frequency": "daily",
    "preferredTime": "07:00",
    "targetDaysPerWeek": 7,
    "sortOrder": 0,
    "isActive": true,
    "createdAt": "2026-04-10T00:00:00.000Z"
  }
}
```

**curl**:
```bash
curl -X POST http://localhost:3000/api/v1/habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Meditacion matutina",
    "icon": "meditation",
    "frequency": "daily",
    "preferredTime": "07:00",
    "targetDaysPerWeek": 7
  }'
```

### GET /api/v1/habits

Lista todos los habitos del usuario.

**Query params**:
- `active=true` - Filtra solo habitos activos

**Respuesta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "660e8400-...",
      "name": "Meditacion matutina",
      "icon": "meditation",
      "frequency": "daily",
      "preferredTime": "07:00",
      "targetDaysPerWeek": 7,
      "sortOrder": 0,
      "isActive": true,
      "streak": {
        "currentStreak": 5,
        "bestStreak": 10,
        "lastCheckDate": "2026-04-09"
      }
    }
  ]
}
```

**curl**:
```bash
# Todos los habitos
curl http://localhost:3000/api/v1/habits \
  -H "Authorization: Bearer $TOKEN"

# Solo activos
curl "http://localhost:3000/api/v1/habits?active=true" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/habits/:id

Obtiene un habito por ID (con datos de streak).

**curl**:
```bash
curl http://localhost:3000/api/v1/habits/660e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer $TOKEN"
```

**Errores**:
- `404` - Habito no encontrado
- `403` - El habito pertenece a otro usuario

### PATCH /api/v1/habits/:id

Actualiza un habito existente.

**Body** (todos los campos son opcionales):
```json
{
  "name": "Meditacion vespertina",
  "targetDaysPerWeek": 5,
  "isActive": false
}
```

**curl**:
```bash
curl -X PATCH http://localhost:3000/api/v1/habits/660e8400-... \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Meditacion vespertina", "targetDaysPerWeek": 5}'
```

### DELETE /api/v1/habits/:id

Elimina un habito y todos sus datos asociados (check-ins, streaks).

**Respuesta**: `204 No Content`

**curl**:
```bash
curl -X DELETE http://localhost:3000/api/v1/habits/660e8400-... \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/v1/habits/reorder

Reordena los habitos del usuario.

**Body**:
```json
{
  "habitIds": [
    "660e8400-...",
    "770e8400-...",
    "880e8400-..."
  ]
}
```

**curl**:
```bash
curl -X POST http://localhost:3000/api/v1/habits/reorder \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"habitIds": ["id-1", "id-2", "id-3"]}'
```

---

## Check-ins

Todos los endpoints de check-ins requieren autenticacion JWT.

### POST /api/v1/check-ins

Registra un check-in para un habito.

**Body**:
```json
{
  "habitId": "660e8400-e29b-41d4-a716-446655440000",
  "checkDate": "2026-04-10"
}
```

**Validaciones**:
- `habitId`: UUID requerido
- `checkDate`: Opcional, formato ISO date (YYYY-MM-DD). Si se omite, usa la fecha actual

**Respuesta** (201):
```json
{
  "success": true,
  "data": {
    "id": "abc123-...",
    "habitId": "660e8400-...",
    "userId": "550e8400-...",
    "checkDate": "2026-04-10",
    "completedAt": "2026-04-10T15:30:00.000Z"
  }
}
```

**Errores**:
- `404` - Habito no encontrado
- `403` - El habito pertenece a otro usuario
- `409` - Ya existe un check-in para esa fecha

**curl**:
```bash
curl -X POST http://localhost:3000/api/v1/check-ins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"habitId": "660e8400-..."}'
```

### POST /api/v1/check-ins/batch

Registra check-ins para multiples habitos en una sola llamada.

**Body**:
```json
{
  "habits": [
    { "habitId": "660e8400-..." },
    { "habitId": "770e8400-..." }
  ],
  "checkDate": "2026-04-10"
}
```

**Nota**: Los duplicados se omiten silenciosamente.

**curl**:
```bash
curl -X POST http://localhost:3000/api/v1/check-ins/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "habits": [
      {"habitId": "660e8400-..."},
      {"habitId": "770e8400-..."}
    ]
  }'
```

### DELETE /api/v1/check-ins/:habitId

Deshace un check-in y recalcula la racha.

**Query params**:
- `date` - Fecha del check-in (YYYY-MM-DD). Si se omite, usa la fecha actual

**Respuesta**: `204 No Content`

**curl**:
```bash
# Deshacer check-in de hoy
curl -X DELETE http://localhost:3000/api/v1/check-ins/660e8400-... \
  -H "Authorization: Bearer $TOKEN"

# Deshacer check-in de fecha especifica
curl -X DELETE "http://localhost:3000/api/v1/check-ins/660e8400-...?date=2026-04-09" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/check-ins/today

Obtiene todos los check-ins del dia actual del usuario.

**curl**:
```bash
curl http://localhost:3000/api/v1/check-ins/today \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/check-ins/range

Obtiene check-ins dentro de un rango de fechas.

**Query params**:
- `startDate` - Fecha de inicio (YYYY-MM-DD), requerido
- `endDate` - Fecha de fin (YYYY-MM-DD), requerido
- `habitId` - Filtrar por habito, opcional

**curl**:
```bash
curl "http://localhost:3000/api/v1/check-ins/range?startDate=2026-04-01&endDate=2026-04-30" \
  -H "Authorization: Bearer $TOKEN"

# Filtrado por habito
curl "http://localhost:3000/api/v1/check-ins/range?startDate=2026-04-01&endDate=2026-04-30&habitId=660e8400-..." \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/check-ins/status/:habitId

Verifica si un habito tiene check-in para una fecha.

**Query params**:
- `date` - Fecha a verificar (YYYY-MM-DD). Si se omite, usa la fecha actual

**Respuesta** (200):
```json
{
  "success": true,
  "data": true
}
```

**curl**:
```bash
curl "http://localhost:3000/api/v1/check-ins/status/660e8400-...?date=2026-04-10" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Dashboard

Todos los endpoints de dashboard requieren autenticacion JWT.

### GET /api/v1/dashboard/today

Obtiene el resumen del dia actual.

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "totalHabits": 5,
    "completedToday": 3,
    "completionRate": 60,
    "currentStreaks": [
      {
        "habitId": "660e8400-...",
        "habitName": "Meditacion",
        "currentStreak": 15,
        "bestStreak": 30,
        "isCompletedToday": true
      }
    ]
  }
}
```

**curl**:
```bash
curl http://localhost:3000/api/v1/dashboard/today \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/dashboard/calendar

Obtiene datos de completado por dia para una vista de calendario.

**Query params**:
- `startDate` - Fecha de inicio (YYYY-MM-DD), requerido
- `endDate` - Fecha de fin (YYYY-MM-DD), requerido

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "dates": [
      {
        "date": "2026-04-01",
        "completedCount": 4,
        "totalHabits": 5,
        "completionRate": 80
      }
    ]
  }
}
```

**curl**:
```bash
curl "http://localhost:3000/api/v1/dashboard/calendar?startDate=2026-04-01&endDate=2026-04-30" \
  -H "Authorization: Bearer $TOKEN"
```

### GET /api/v1/dashboard/stats

Obtiene estadisticas por periodo (semana o mes).

**Query params**:
- `period` - `week` o `month` (default: `week`)
- `date` - Fecha de referencia (YYYY-MM-DD). Si se omite, usa la fecha actual

**Respuesta** (200):
```json
{
  "success": true,
  "data": {
    "period": "2026-04-07 to 2026-04-13",
    "totalCheckIns": 28,
    "totalPossible": 35,
    "consistencyRate": 80,
    "habitBreakdown": [
      {
        "habitId": "660e8400-...",
        "habitName": "Meditacion",
        "checkIns": 7,
        "possible": 7,
        "rate": 100
      }
    ]
  }
}
```

**curl**:
```bash
# Estadisticas semanales
curl "http://localhost:3000/api/v1/dashboard/stats?period=week" \
  -H "Authorization: Bearer $TOKEN"

# Estadisticas mensuales
curl "http://localhost:3000/api/v1/dashboard/stats?period=month&date=2026-04-15" \
  -H "Authorization: Bearer $TOKEN"
```
