# Changelog

Todos los cambios notables en este proyecto se documentan en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.0.0] - 2026-04-10

### Agregado

- **Autenticacion**: Registro de usuarios con email/password, login con JWT, y perfil de usuario
- **Modulo de habitos**: CRUD completo con soporte para frecuencia diaria/semanal/custom, iconos, hora preferida y dias objetivo
- **Reordenamiento**: Endpoint para reordenar habitos por drag & drop
- **Sistema de check-ins**: Check-in individual con validacion de duplicados
- **Check-in masivo**: Endpoint batch para registrar multiples habitos en una llamada
- **Undo de check-in**: Deshacer check-in con recalculo automatico de racha
- **Algoritmo de streaks**: Calculo incremental O(1) en check-in con recalculo completo O(n) en undo
- **Manejo de edge cases**: Transiciones de mes (ene->feb), anio (dic->ene) y bisiesto en streaks
- **Dashboard - Resumen diario**: Total de habitos, completados hoy, tasa de completado y streaks actuales
- **Dashboard - Calendario**: Vista de completado por dia con tasa porcentual
- **Dashboard - Estadisticas**: Stats semanales y mensuales con desglose por habito
- **Accountability Partners**: Entidad y modelo para partners con sistema de invitacion por codigo
- **Notificaciones programadas**: Recordatorios diarios a las 9 AM via cron job
- **UI Neomorfica**: Frontend single-page con Tailwind CSS y Alpine.js
- **Validacion declarativa**: DTOs con class-validator para todos los endpoints
- **Filtro global de excepciones**: Respuestas de error estandarizadas
- **Interceptor de transformacion**: Respuestas exitosas con formato consistente
- **Decorador @CurrentUser**: Acceso simplificado al usuario autenticado
- **57 tests unitarios**: Cobertura de servicios y controladores
- **21 tests E2E**: Flujo completo de la aplicacion
- **Docker**: Dockerfile multi-stage y docker-compose con PostgreSQL + Redis
- **GitHub Actions**: Pipeline CI/CD con lint, test, build, audit y Docker build
- **Documentacion completa**: README, ARCHITECTURE, API, DEPLOYMENT, DECISIONS, CONTRIBUTING
