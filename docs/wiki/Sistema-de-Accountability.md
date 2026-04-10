# Sistema de Accountability

## Concepto

El sistema de accountability partners es el diferenciador principal de HabitForge frente a otras apps de habitos. Se basa en la premisa de que la responsabilidad compartida aumenta la consistencia en la formacion de habitos.

## Modelo de Datos

### Entidad AccountabilityPartner

```
accountability_partners
├── id: UUID (PK)
├── user1_id: UUID (FK -> users) - El que crea la invitacion
├── user2_id: UUID (FK -> users, nullable) - El que acepta
├── status: 'pending' | 'accepted' | 'declined'
├── invite_code: VARCHAR(20) UNIQUE
└── created_at: TIMESTAMP
```

### Estados de la Partnership

```
Creacion               Aceptacion           Activa
   │                      │                   │
   ▼                      ▼                   ▼
┌────────┐          ┌──────────┐        ┌──────────┐
│PENDING │ ──────>  │ACCEPTED  │ ────── │ Ambos    │
│user2=null│         │user2=set │        │ ven el   │
│inviteCode│         │          │        │ progreso │
└────────┘          └──────────┘        └──────────┘
     │
     ▼
┌──────────┐
│DECLINED  │
└──────────┘
```

## Flujo de Invitacion

### 1. Crear invitacion

El usuario 1 genera un codigo de invitacion unico:

```
POST /api/v1/accountability/invite
Authorization: Bearer <token-user1>

Respuesta:
{
  "inviteCode": "HF-A7X9K3",
  "status": "pending"
}
```

### 2. Compartir codigo

El usuario 1 comparte el codigo `HF-A7X9K3` con su partner por cualquier medio externo (WhatsApp, email, etc.).

### 3. Aceptar invitacion

El usuario 2 ingresa el codigo:

```
POST /api/v1/accountability/accept
Authorization: Bearer <token-user2>
Body: { "inviteCode": "HF-A7X9K3" }

Respuesta:
{
  "status": "accepted",
  "partner": {
    "displayName": "Nombre del User 1"
  }
}
```

### 4. Ver progreso mutuo

Ambos usuarios pueden ver el dashboard del partner:

```
GET /api/v1/accountability/partner-dashboard
Authorization: Bearer <token>

Respuesta:
{
  "partner": {
    "displayName": "...",
    "todaySummary": {
      "totalHabits": 5,
      "completedToday": 3,
      "completionRate": 60
    },
    "topStreak": {
      "habitName": "Ejercicio",
      "currentStreak": 15
    }
  }
}
```

## Reglas de Negocio

1. **Un partner a la vez**: Cada usuario solo puede tener un accountability partner activo
2. **Codigos unicos**: Cada invitacion genera un codigo aleatorio de 8 caracteres
3. **Expiracion**: Los codigos en estado `pending` expiran despues de 7 dias
4. **Visibilidad limitada**: El partner solo ve el resumen (no los nombres de los habitos individuales)
5. **Desvinculacion**: Cualquiera de los dos puede terminar la partnership

## Indices de Base de Datos

- `(user1_id, user2_id) UNIQUE` - Previene partnerships duplicadas
- `(invite_code) UNIQUE` - Busqueda rapida por codigo

## Estado Actual

La entidad `AccountabilityPartner` esta definida y lista en el modelo de datos. Los endpoints de la API estan en el roadmap como siguiente feature a implementar.

## Beneficios del Accountability

Segun investigaciones sobre formacion de habitos:

- La probabilidad de cumplir una meta aumenta al **65%** al comprometerse con otra persona
- Con check-ins regulares de accountability, la probabilidad sube al **95%**
- La presion social positiva es el motivador externo mas efectivo despues de las recompensas internas
