# Despliegue - HabitForge

## Desarrollo Local

### Con SQLite (por defecto)

```bash
# Instalar dependencias
npm ci

# Copiar variables de entorno
cp .env.example .env

# Editar JWT_SECRET en .env
# JWT_SECRET=mi-clave-secreta-para-dev

# Ejecutar en modo desarrollo
npm run start:dev
```

La app estara disponible en `http://localhost:3000`.
SQLite crea automaticamente el archivo `habitforge.sqlite` en la raiz.

### Con PostgreSQL + Redis (Docker Compose)

```bash
# Levantar servicios
docker-compose up -d

# Verificar que estan corriendo
docker-compose ps

# Configurar .env para PostgreSQL
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=habitforge
DB_PASSWORD=habitforge_secret
DB_DATABASE=habitforge
JWT_SECRET=mi-clave-secreta-para-dev
JWT_EXPIRATION=7d
PORT=3000
NODE_ENV=development
EOF

# Ejecutar la app
npm run start:dev
```

## Docker

### Build de la imagen

```bash
# Build multi-stage
docker build -t habitforge:latest .

# Verificar la imagen
docker images habitforge
```

### Ejecutar el contenedor

```bash
# Con SQLite (desarrollo)
docker run -p 3000:3000 \
  -e JWT_SECRET=clave-secreta-produccion \
  -e DB_DATABASE=habitforge.sqlite \
  -e NODE_ENV=production \
  habitforge:latest

# Con PostgreSQL (produccion)
docker run -p 3000:3000 \
  -e JWT_SECRET=clave-secreta-produccion \
  -e DB_HOST=tu-host-postgresql \
  -e DB_PORT=5432 \
  -e DB_USERNAME=habitforge \
  -e DB_PASSWORD=tu-password-seguro \
  -e DB_DATABASE=habitforge \
  -e NODE_ENV=production \
  habitforge:latest
```

### Docker Compose completo

El archivo `docker-compose.yml` incluye PostgreSQL 16 y Redis 7:

```bash
# Levantar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down

# Detener y eliminar volumenes
docker-compose down -v
```

## Railway

### Prerequisitos

- Cuenta en [Railway](https://railway.app)
- Railway CLI instalado

### Pasos

```bash
# 1. Instalar CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Inicializar proyecto
railway init

# 4. Agregar PostgreSQL
railway add --plugin postgresql

# 5. Configurar variables de entorno
railway variables set JWT_SECRET=tu-clave-secreta-produccion
railway variables set NODE_ENV=production
railway variables set JWT_EXPIRATION=7d

# 6. Deploy
railway up

# 7. Abrir la app
railway open
```

Railway automaticamente:
- Detecta el Dockerfile
- Configura el puerto desde la variable PORT
- Proporciona una URL publica

### Variables de entorno en Railway

Railway inyecta automaticamente las variables de PostgreSQL cuando agregas el plugin:
- `DATABASE_URL` (o `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`)

Solo necesitas configurar manualmente:
- `JWT_SECRET`
- `NODE_ENV=production`

## Variables de Entorno de Produccion

| Variable | Descripcion | Obligatoria |
|----------|-------------|-------------|
| `JWT_SECRET` | Clave secreta para firmar tokens JWT. Usar un valor aleatorio largo | Si |
| `DB_HOST` | Host de PostgreSQL | Si |
| `DB_PORT` | Puerto de PostgreSQL | Si |
| `DB_USERNAME` | Usuario de PostgreSQL | Si |
| `DB_PASSWORD` | Password de PostgreSQL | Si |
| `DB_DATABASE` | Nombre de la base de datos | Si |
| `NODE_ENV` | Debe ser `production` | Si |
| `PORT` | Puerto de la app (Railway lo configura automaticamente) | No |
| `CORS_ORIGIN` | Dominio del frontend (ej: `https://habitforge.app`) | Recomendada |
| `JWT_EXPIRATION` | Tiempo de expiracion del token | No (default: 7d) |

### Generar un JWT_SECRET seguro

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Consideraciones de Produccion

### Base de datos

- Usar PostgreSQL 16+ en produccion (SQLite es solo para desarrollo)
- Configurar `synchronize: false` en produccion (usar migraciones)
- Ejecutar migraciones antes del deploy: `npm run migration:run`

### Seguridad

- Cambiar `JWT_SECRET` a un valor aleatorio largo (minimo 64 caracteres)
- Configurar `CORS_ORIGIN` con el dominio especifico del frontend
- Usar HTTPS
- No exponer la base de datos a internet

### Monitoreo

- Los logs de la app se envian a stdout/stderr
- Railway y Docker capturan estos logs automaticamente
- El filtro global de excepciones registra errores no manejados con stack trace

## Estructura del Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

**Ventajas del multi-stage build**:
- Imagen final sin devDependencies ni codigo fuente
- Menor tamano de imagen
- Mejor seguridad (menos superficie de ataque)
