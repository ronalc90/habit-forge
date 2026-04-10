# HabitForge - Runbook de Operaciones

> Autor: Ronald | Ultima actualizacion: Abril 2026

---

## Tabla de Contenidos

1. [Informacion General](#informacion-general)
2. [Health Checks](#health-checks)
3. [Procedimientos Comunes](#procedimientos-comunes)
4. [Incidentes y Resolucion](#incidentes-y-resolucion)
5. [Escalamiento](#escalamiento)
6. [Mantenimiento Programado](#mantenimiento-programado)
7. [Rollback](#rollback)
8. [Contactos](#contactos)

---

## Informacion General

| Campo | Valor |
|-------|-------|
| **Aplicacion** | HabitForge API |
| **Stack** | NestJS + TypeScript |
| **Puerto** | 3002 |
| **Health endpoint** | `GET /api/v1` |
| **Base de datos** | PostgreSQL 16 |
| **Cache** | Redis 7 |
| **Repositorio** | github.com/ronalc90/habit-forge |

---

## Health Checks

### Verificar estado de la API

```bash
# Health check basico
curl -s http://localhost:3002/api/v1

# Con timeout
curl -s --max-time 5 http://localhost:3002/api/v1 || echo "API no responde"
```

### Verificar servicios Docker

```bash
# Estado de contenedores
docker compose ps

# Logs en tiempo real
docker compose logs -f app

# Health status
docker inspect --format='{{.State.Health.Status}}' habitforge-app
```

### Verificar Kubernetes

```bash
# Estado de pods
kubectl get pods -n habitforge

# Describir pod con problemas
kubectl describe pod <pod-name> -n habitforge

# Logs del pod
kubectl logs -f <pod-name> -n habitforge

# Estado del servicio
kubectl get svc -n habitforge
```

### Verificar AWS ECS

```bash
# Estado del servicio
aws ecs describe-services \
  --cluster habitforge-cluster \
  --services habitforge-api

# Tareas en ejecucion
aws ecs list-tasks --cluster habitforge-cluster --service-name habitforge-api

# Logs en CloudWatch
aws logs tail /ecs/habitforge --follow
```

---

## Procedimientos Comunes

### Reiniciar la aplicacion

**Docker Compose:**
```bash
docker compose restart app
```

**Kubernetes:**
```bash
kubectl rollout restart deployment/habitforge-api -n habitforge
```

**AWS ECS:**
```bash
aws ecs update-service \
  --cluster habitforge-cluster \
  --service habitforge-api \
  --force-new-deployment
```

### Escalar la aplicacion

**Docker Compose:**
```bash
docker compose up -d --scale app=3
```

**Kubernetes:**
```bash
# Manual
kubectl scale deployment/habitforge-api --replicas=4 -n habitforge

# Verificar HPA
kubectl get hpa -n habitforge
```

**AWS ECS:**
```bash
aws ecs update-service \
  --cluster habitforge-cluster \
  --service habitforge-api \
  --desired-count 4
```

### Ejecutar migraciones de base de datos

```bash
# En desarrollo
npm run migration:run

# En produccion (desde un contenedor temporal)
kubectl run migration --rm -it \
  --image=ghcr.io/ronalc90/habit-forge:latest \
  --env="DB_HOST=postgres-service" \
  --env="DB_PASSWORD=<password>" \
  -n habitforge \
  -- npx typeorm migration:run -d dist/database/data-source.js
```

### Acceder a la base de datos

```bash
# Docker Compose
docker compose exec postgres psql -U habitforge -d habitforge

# Kubernetes
kubectl exec -it <postgres-pod> -n habitforge -- psql -U habitforge -d habitforge

# Consultas utiles
SELECT count(*) FROM "user";
SELECT count(*) FROM habit;
SELECT pg_database_size('habitforge');
```

### Limpiar cache Redis

```bash
# Docker Compose
docker compose exec redis redis-cli FLUSHDB

# Verificar uso de memoria
docker compose exec redis redis-cli INFO memory
```

---

## Incidentes y Resolucion

### API no responde (HTTP 5xx)

**Diagnostico:**
1. Verificar logs de la aplicacion
2. Verificar conectividad con PostgreSQL y Redis
3. Verificar uso de recursos (CPU/memoria)
4. Verificar estado del health check

```bash
# Docker
docker compose logs --tail=100 app
docker stats habitforge-app

# Kubernetes
kubectl logs -f deployment/habitforge-api -n habitforge --tail=100
kubectl top pods -n habitforge
```

**Resolucion:**
1. Si es OOM (Out of Memory): aumentar limites de memoria
2. Si es error de conexion a DB: verificar estado de PostgreSQL
3. Si es error de aplicacion: revisar logs, considerar rollback
4. Reiniciar la aplicacion si es necesario

### Base de datos no disponible

**Diagnostico:**
```bash
# Verificar estado de PostgreSQL
docker compose exec postgres pg_isready -U habitforge

# Verificar conexiones activas
docker compose exec postgres psql -U habitforge -c "SELECT count(*) FROM pg_stat_activity;"

# Verificar espacio en disco
docker compose exec postgres df -h /var/lib/postgresql/data
```

**Resolucion:**
1. Reiniciar PostgreSQL: `docker compose restart postgres`
2. Si hay demasiadas conexiones: verificar pool de conexiones
3. Si no hay espacio: limpiar logs, expandir volumen

### Alto uso de CPU/Memoria

**Diagnostico:**
```bash
# Docker
docker stats

# Kubernetes
kubectl top pods -n habitforge
kubectl top nodes

# Verificar HPA
kubectl get hpa -n habitforge
kubectl describe hpa habitforge-hpa -n habitforge
```

**Resolucion:**
1. Verificar si hay queries lentos en PostgreSQL
2. Revisar si hay memory leaks en la aplicacion
3. Escalar horizontalmente (mas replicas)
4. Escalar verticalmente (mas CPU/memoria por pod)

### Redis no disponible

**Diagnostico:**
```bash
docker compose exec redis redis-cli ping
docker compose exec redis redis-cli INFO server
```

**Resolucion:**
1. Reiniciar Redis: `docker compose restart redis`
2. La aplicacion debe funcionar sin Redis (degradado)
3. Verificar que no se exceda `maxmemory`

---

## Escalamiento

### Limites recomendados

| Metrica | Threshold | Accion |
|---------|-----------|--------|
| CPU > 70% | Alerta | Escalar horizontalmente |
| CPU > 90% | Critico | Escalar + investigar |
| Memoria > 80% | Alerta | Revisar memory leaks |
| Memoria > 95% | Critico | Reiniciar + escalar |
| Latencia P99 > 2s | Alerta | Investigar queries |
| Error rate > 5% | Critico | Investigar + posible rollback |

### Auto-scaling configurado

**Kubernetes HPA:**
- Min: 2 replicas
- Max: 8 replicas
- CPU target: 70%
- Memoria target: 80%
- Scale up: maximo 2 pods cada 60s
- Scale down: maximo 1 pod cada 120s

**AWS ECS:**
- Min: 2 tareas
- Max: 6 tareas
- CPU target: 70%
- Memoria target: 80%

---

## Mantenimiento Programado

### Actualizacion de la aplicacion

1. Crear PR con los cambios
2. Verificar que CI pase (lint, tests, build, security)
3. Merge a main
4. CI automaticamente construye imagen Docker
5. Deploy a staging (automatico)
6. Verificar staging
7. Aprobar deploy a produccion

### Actualizacion de dependencias

```bash
# Verificar dependencias desactualizadas
npm outdated

# Actualizar dependencias patch/minor
npm update

# Verificar vulnerabilidades
npm audit

# Ejecutar tests despues de actualizar
npm test
```

### Backup de base de datos

```bash
# Crear backup
docker compose exec postgres pg_dump -U habitforge -d habitforge > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker compose exec -T postgres psql -U habitforge -d habitforge < backup_20260410.sql
```

---

## Rollback

### Rollback de imagen Docker

```bash
# Ver tags disponibles
# En GitHub: Packages > habit-forge > ver versiones

# Kubernetes
kubectl set image deployment/habitforge-api \
  habitforge-api=ghcr.io/ronalc90/habit-forge:<tag-anterior> \
  -n habitforge

# Verificar rollback
kubectl rollout status deployment/habitforge-api -n habitforge

# Rollback automatico al deployment anterior
kubectl rollout undo deployment/habitforge-api -n habitforge
```

### Rollback de AWS ECS

```bash
# Listar task definitions anteriores
aws ecs list-task-definitions --family-prefix habitforge-api --sort DESC

# Actualizar servicio con task definition anterior
aws ecs update-service \
  --cluster habitforge-cluster \
  --service habitforge-api \
  --task-definition habitforge-api:<revision-anterior>
```

### Rollback de migraciones

```bash
# Revertir ultima migracion
npm run migration:revert
```

---

## Contactos

| Rol | Nombre | Contacto |
|-----|--------|----------|
| **Desarrollador Principal** | Ronald | GitHub: @ronalc90 |
