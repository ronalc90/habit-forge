# HabitForge - Observabilidad

> Autor: Ronald | Ultima actualizacion: Abril 2026

---

## Tabla de Contenidos

1. [Resumen](#resumen)
2. [Metricas (Prometheus)](#metricas-prometheus)
3. [Dashboards (Grafana)](#dashboards-grafana)
4. [Logs (Loki)](#logs-loki)
5. [Alertas](#alertas)
6. [Endpoints de la Aplicacion](#endpoints-de-la-aplicacion)

---

## Resumen

La observabilidad de HabitForge esta basada en los tres pilares:

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Metricas   │   │    Logs     │   │   Traces    │
│ (Prometheus)│   │   (Loki)    │   │  (futuro)   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────────┬────┘─────────────────┘
                    │
              ┌─────▼─────┐
              │  Grafana   │
              │ Dashboards │
              └────────────┘
```

**Stack de monitoreo:**

| Herramienta | Puerto | Funcion |
|-------------|--------|---------|
| Prometheus | 9090 | Recoleccion de metricas |
| Grafana | 3001 | Visualizacion y alertas |
| Loki | 3100 | Agregacion de logs |
| Promtail | - | Recoleccion de logs |
| Node Exporter | 9100 | Metricas del host |
| cAdvisor | 8080 | Metricas de contenedores |

---

## Metricas (Prometheus)

### Configuracion

El archivo `monitoring/prometheus.yml` define los targets de scraping:

| Job | Target | Intervalo | Descripcion |
|-----|--------|-----------|-------------|
| `habitforge-api` | `app:3002/api/v1/metrics` | 10s | Metricas de la aplicacion |
| `habitforge-health` | `app:3002/api/v1` | 30s | Health check |
| `prometheus` | `localhost:9090` | 15s | Auto-monitoreo |
| `node-exporter` | `node-exporter:9100` | 15s | Metricas del host |
| `cadvisor` | `cadvisor:8080` | 15s | Metricas de contenedores |

### Metricas recomendadas para NestJS

Para exponer metricas de la aplicacion, se recomienda integrar `prom-client`:

```bash
npm install prom-client
```

Metricas sugeridas:

| Metrica | Tipo | Descripcion |
|---------|------|-------------|
| `http_requests_total` | Counter | Total de requests HTTP |
| `http_request_duration_seconds` | Histogram | Duracion de requests |
| `http_request_errors_total` | Counter | Total de errores HTTP |
| `active_connections` | Gauge | Conexiones activas |
| `db_query_duration_seconds` | Histogram | Duracion de queries DB |
| `habits_created_total` | Counter | Habitos creados |
| `checkins_completed_total` | Counter | Check-ins completados |

### Queries utiles de PromQL

```promql
# Request rate (requests por segundo)
rate(http_requests_total[5m])

# Latencia P99
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Error rate porcentual
sum(rate(http_request_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100

# Uso de memoria del contenedor
container_memory_usage_bytes{name="habitforge-app"}

# CPU del contenedor
rate(container_cpu_usage_seconds_total{name="habitforge-app"}[5m])
```

---

## Dashboards (Grafana)

### Acceso

- **URL:** http://localhost:3001
- **Usuario:** admin
- **Password:** admin (cambiar en produccion via `GRAFANA_PASSWORD`)

### Configurar datasources

1. Ir a Configuration > Data Sources
2. Agregar **Prometheus**: URL `http://prometheus:9090`
3. Agregar **Loki**: URL `http://loki:3100`

### Dashboards recomendados

Importar desde Grafana.com (por ID):

| Dashboard | ID | Descripcion |
|-----------|-----|-------------|
| Node Exporter Full | 1860 | Metricas del host |
| Docker Container Monitoring | 893 | Metricas de contenedores |
| Prometheus Stats | 3662 | Estado de Prometheus |

### Paneles sugeridos para HabitForge

**Panel 1 - Resumen de API:**
- Request rate total
- Latencia P50/P95/P99
- Error rate
- Codigo de estado HTTP

**Panel 2 - Recursos:**
- CPU por contenedor
- Memoria por contenedor
- Network I/O
- Disk I/O

**Panel 3 - Base de datos:**
- Conexiones activas
- Query duration
- Tamano de la base de datos

**Panel 4 - Negocio:**
- Usuarios activos
- Habitos creados por hora
- Check-ins completados
- Streaks activos

---

## Logs (Loki)

### Levantar stack de logs

```bash
docker compose -f docker-compose.monitoring.yml up -d loki promtail
```

### Consultar logs en Grafana

1. Ir a Explore > Seleccionar Loki
2. Usar LogQL para consultas:

```logql
# Todos los logs de habitforge
{container_name="habitforge-app"}

# Solo errores
{container_name="habitforge-app"} |= "error"

# Filtrar por nivel
{container_name="habitforge-app"} | json | level="error"

# Logs de PostgreSQL
{container_name="habitforge-db"}

# Rate de errores por minuto
count_over_time({container_name="habitforge-app"} |= "error" [1m])
```

### Logs estructurados

Se recomienda configurar NestJS para emitir logs en formato JSON:

```typescript
// main.ts - ejemplo de logger estructurado
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'],
});
```

---

## Alertas

### Alertas recomendadas

| Alerta | Condicion | Severidad | Accion |
|--------|-----------|-----------|--------|
| API Down | health check falla 3 veces | Critica | Reiniciar + investigar |
| Alta latencia | P99 > 2 segundos | Warning | Investigar queries |
| Alto error rate | > 5% en 5 minutos | Critica | Investigar + posible rollback |
| CPU alto | > 80% sostenido 5 min | Warning | Escalar |
| Memoria alta | > 90% | Critica | Investigar leaks + escalar |
| Disco lleno | > 85% | Warning | Limpiar + expandir |
| DB conexiones | > 80% del max | Warning | Revisar pool |

### Configurar alertas en Grafana

1. Ir a Alerting > Alert Rules
2. Crear regla basada en las metricas de Prometheus
3. Configurar canal de notificacion (Slack, email, PagerDuty)

---

## Endpoints de la Aplicacion

### Health check

```
GET /api/v1
```

Respuesta exitosa (200):
```json
{
  "status": "ok",
  "timestamp": "2026-04-10T12:00:00.000Z"
}
```

### Metricas (requiere integracion con prom-client)

```
GET /api/v1/metrics
```

Formato: Prometheus text exposition format

### Iniciar stack completo de observabilidad

```bash
# Opcion 1: Stack completo (app + infra + monitoreo)
docker compose up -d

# Opcion 2: Solo monitoreo (conectar a app existente)
docker compose -f docker-compose.monitoring.yml up -d

# Verificar que todos los servicios estan corriendo
docker compose ps

# Acceder a los servicios
# Prometheus: http://localhost:9090
# Grafana:    http://localhost:3001
# Loki:       http://localhost:3100
```
