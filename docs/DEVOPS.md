# HabitForge - Guia DevOps

> Autor: Ronald | Ultima actualizacion: Abril 2026

---

## Tabla de Contenidos

1. [Resumen de Arquitectura](#resumen-de-arquitectura)
2. [Desarrollo Local](#desarrollo-local)
3. [Docker](#docker)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Kubernetes](#kubernetes)
6. [Terraform (AWS ECS Fargate)](#terraform-aws-ecs-fargate)
7. [Seguridad](#seguridad)
8. [Variables de Entorno](#variables-de-entorno)

---

## Resumen de Arquitectura

```
                    ┌─────────────────────────────────────────┐
                    │              GitHub Actions              │
                    │  lint → test → build → docker → deploy  │
                    └─────────────┬───────────────────────────┘
                                  │
                    ┌─────────────▼───────────────┐
                    │      Container Registry      │
                    │        ghcr.io/ronalc90      │
                    └─────────────┬───────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼──────┐  ┌────────▼────────┐  ┌──────▼───────┐
    │  Kubernetes     │  │  AWS ECS        │  │  Docker      │
    │  (Produccion)   │  │  Fargate        │  │  Compose     │
    └────────────────┘  └─────────────────┘  └──────────────┘
```

**Stack tecnologico:**
- **Runtime:** Node.js 18 (Alpine)
- **Framework:** NestJS 10 + TypeScript
- **Base de datos:** PostgreSQL 16
- **Cache:** Redis 7
- **CI/CD:** GitHub Actions
- **Container:** Docker multi-stage
- **Orquestacion:** Kubernetes / AWS ECS Fargate
- **Monitoreo:** Prometheus + Grafana + Loki

---

## Desarrollo Local

### Requisitos

- Node.js 18+
- Docker y Docker Compose
- Git

### Inicio rapido

```bash
# Clonar repositorio
git clone https://github.com/ronalc90/habit-forge.git
cd habit-forge

# Instalar dependencias
npm ci

# Configurar variables de entorno
cp .env.example .env

# Levantar servicios de infraestructura
docker compose up -d postgres redis

# Ejecutar migraciones
npm run migration:run

# Iniciar en modo desarrollo
npm run start:dev
```

### Comandos utiles

| Comando | Descripcion |
|---------|-------------|
| `npm run start:dev` | Iniciar en modo desarrollo con watch |
| `npm run build` | Compilar para produccion |
| `npm test` | Ejecutar tests unitarios |
| `npm run test:cov` | Tests con reporte de cobertura |
| `npm run lint` | Ejecutar linter |
| `npm run migration:generate` | Generar migracion |
| `npm run migration:run` | Ejecutar migraciones |

---

## Docker

### Dockerfile (Multi-stage)

El Dockerfile utiliza un build multi-stage para optimizar el tamano de la imagen:

1. **Stage build:** Instala dependencias y compila TypeScript
2. **Stage production:** Solo copia artefactos necesarios, usa usuario no-root

### Construir imagen

```bash
# Build local
docker build -t habitforge:latest .

# Ejecutar contenedor
docker run -p 3002:3002 --env-file .env habitforge:latest
```

### Docker Compose - Stack completo

```bash
# Levantar todo el stack (app + postgres + redis + prometheus + grafana)
docker compose up -d

# Ver logs
docker compose logs -f app

# Detener
docker compose down

# Detener y eliminar volumenes
docker compose down -v
```

### Docker Compose - Solo monitoreo

```bash
# Levantar stack de monitoreo
docker compose -f docker-compose.monitoring.yml up -d
```

**Servicios disponibles:**

| Servicio | URL | Descripcion |
|----------|-----|-------------|
| HabitForge API | http://localhost:3002 | API principal |
| PostgreSQL | localhost:5432 | Base de datos |
| Redis | localhost:6379 | Cache |
| Prometheus | http://localhost:9090 | Metricas |
| Grafana | http://localhost:3001 | Dashboards |
| Loki | http://localhost:3100 | Logs centralizados |

---

## CI/CD Pipeline

### Pipeline principal (`.github/workflows/ci.yml`)

```
push/PR a main
    │
    ├── lint-and-test ──── Lint + Tests (52) + Cobertura
    │
    ├── build ─────────── Compilacion TypeScript + Verificacion
    │
    ├── security-audit ── npm audit
    │
    ├── docker-build ──── Build + Push a ghcr.io + Trivy scan
    │
    ├── deploy-staging ── Deploy a staging (con environment protection)
    │
    └── deploy-production ── Deploy a produccion (approval requerido)
```

### Pipeline de seguridad (`.github/workflows/security.yml`)

Se ejecuta en cada push, PR y semanalmente (lunes 6:00 UTC):

- **npm audit:** Auditoria de dependencias
- **Trivy:** Escaneo de filesystem e imagen Docker
- **CodeQL:** Analisis estatico de codigo
- **TruffleHog:** Deteccion de secretos en el repositorio

---

## Kubernetes

### Archivos disponibles

```
infra/kubernetes/
├── namespace.yml     # Namespace habitforge
├── configmap.yml     # Configuracion no sensible
├── secret.yml        # Secretos (usar External Secrets en prod)
├── deployment.yml    # Deployment con 2 replicas
├── service.yml       # ClusterIP Service
├── ingress.yml       # Ingress con TLS
└── hpa.yml           # HorizontalPodAutoscaler (2-8 pods)
```

### Despliegue

```bash
# Aplicar todos los manifiestos
kubectl apply -f infra/kubernetes/

# Verificar estado
kubectl get all -n habitforge

# Ver logs
kubectl logs -f deployment/habitforge-api -n habitforge

# Escalar manualmente
kubectl scale deployment/habitforge-api --replicas=4 -n habitforge
```

### Secretos en produccion

No usar el archivo `secret.yml` con valores hardcodeados. Opciones recomendadas:

```bash
# Opcion 1: kubectl create secret
kubectl create secret generic habitforge-secrets \
  --from-literal=DB_PASSWORD=<password-real> \
  --from-literal=JWT_SECRET=<jwt-secret-real> \
  -n habitforge

# Opcion 2: External Secrets Operator (recomendado)
# Configurar con AWS Secrets Manager o HashiCorp Vault
```

---

## Terraform (AWS ECS Fargate)

### Estructura

```
infra/terraform/
├── main.tf                    # Recursos principales
├── variables.tf               # Definicion de variables
├── outputs.tf                 # Outputs del despliegue
└── terraform.tfvars.example   # Ejemplo de variables
```

### Recursos creados

- **VPC** con subnets publicas y privadas
- **ALB** (Application Load Balancer)
- **ECS Cluster** con Fargate
- **Auto Scaling** basado en CPU y memoria
- **IAM Roles** para ejecucion de tareas
- **CloudWatch Logs** con retencion de 30 dias
- **SSM Parameters** para secretos

### Despliegue

```bash
cd infra/terraform

# Configurar variables
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con valores reales

# Inicializar
terraform init

# Planificar cambios
terraform plan

# Aplicar
terraform apply

# Destruir (con precaucion)
terraform destroy
```

---

## Seguridad

### Medidas implementadas

1. **Imagen Docker:**
   - Base Alpine (superficie minima)
   - Usuario no-root (`app`)
   - Multi-stage build (sin herramientas de desarrollo)

2. **Pipeline:**
   - npm audit en cada build
   - Trivy scan de imagen Docker
   - CodeQL para analisis estatico
   - TruffleHog para deteccion de secretos

3. **Kubernetes:**
   - `runAsNonRoot: true`
   - Limites de recursos CPU/memoria
   - NetworkPolicies (implementar segun necesidad)
   - Ingress con TLS y rate limiting

4. **AWS:**
   - Tareas en subnets privadas
   - Security groups restrictivos
   - Secretos en SSM Parameter Store
   - Logs encriptados en CloudWatch

---

## Variables de Entorno

| Variable | Descripcion | Default | Requerida |
|----------|-------------|---------|-----------|
| `NODE_ENV` | Ambiente de ejecucion | `development` | No |
| `PORT` | Puerto de la aplicacion | `3000` | No |
| `DB_HOST` | Host de PostgreSQL | `localhost` | Si |
| `DB_PORT` | Puerto de PostgreSQL | `5432` | No |
| `DB_USERNAME` | Usuario de PostgreSQL | - | Si |
| `DB_PASSWORD` | Password de PostgreSQL | - | Si |
| `DB_DATABASE` | Nombre de la base de datos | - | Si |
| `JWT_SECRET` | Secreto para tokens JWT | - | Si |
| `JWT_EXPIRATION` | Duracion de tokens JWT | `7d` | No |
| `REDIS_HOST` | Host de Redis | `localhost` | No |
| `REDIS_PORT` | Puerto de Redis | `6379` | No |
