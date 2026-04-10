# Guia Rapida

## Prerrequisitos

- Node.js >= 18
- npm >= 9

## Instalacion en 5 minutos

```bash
# 1. Clonar
git clone https://github.com/ronalc90/habit-forge.git
cd habit-forge

# 2. Instalar
npm ci

# 3. Configurar
cp .env.example .env
# Editar .env: cambiar JWT_SECRET por un valor seguro

# 4. Ejecutar
npm run start:dev
```

La app estara disponible en `http://localhost:3000`.

## Primer Uso

### 1. Registrar un usuario

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mi@email.com",
    "displayName": "Mi Nombre",
    "password": "mipassword123"
  }'
```

Guarda el `accessToken` de la respuesta.

### 2. Crear tu primer habito

```bash
export TOKEN="tu-access-token-aqui"

curl -X POST http://localhost:3000/api/v1/habits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ejercicio matutino",
    "frequency": "daily",
    "targetDaysPerWeek": 5
  }'
```

### 3. Registrar un check-in

```bash
curl -X POST http://localhost:3000/api/v1/check-ins \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"habitId": "el-id-del-habito"}'
```

### 4. Ver tu dashboard

```bash
curl http://localhost:3000/api/v1/dashboard/today \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Abrir el frontend

Navega a `http://localhost:3000` en tu navegador para acceder a la interfaz neomorfica.

## Scripts Disponibles

| Comando | Descripcion |
|---|---|
| `npm run start:dev` | Modo desarrollo con hot-reload |
| `npm run start:prod` | Modo produccion |
| `npm run build` | Compilar TypeScript |
| `npm test` | Ejecutar tests unitarios |
| `npm run test:cov` | Tests con reporte de cobertura |
| `npm run test:e2e` | Tests end-to-end |
| `npm run lint` | Ejecutar ESLint |
| `npm run format` | Formatear con Prettier |

## Variables de Entorno

Las variables mas importantes para empezar:

```env
JWT_SECRET=cambiar-por-valor-seguro
PORT=3000
NODE_ENV=development
DB_DATABASE=habitforge.sqlite
```

Para la lista completa, ver el archivo `.env.example`.

## Siguiente Paso

Lee la [Arquitectura](Arquitectura.md) para entender como esta organizado el proyecto.
