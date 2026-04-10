# HabitForge Wiki

Bienvenido a la wiki de HabitForge, el tracker de habitos con accountability social.

## Navegacion

- [Guia Rapida](Guia-Rapida.md) - Configuracion y primeros pasos
- [Arquitectura](Arquitectura.md) - Estructura del sistema y modulos
- [API Reference](API-Reference.md) - Documentacion completa de endpoints
- [Algoritmo de Streaks](Algoritmo-de-Streaks.md) - Como funciona el calculo de rachas
- [Sistema de Accountability](Sistema-de-Accountability.md) - Partners y responsabilidad social
- [Testing](Testing.md) - Estrategia de testing y cobertura

## Sobre el Proyecto

HabitForge es una aplicacion full-stack construida con NestJS y TypeScript que permite a los usuarios:

1. **Crear y gestionar habitos** con frecuencia personalizable
2. **Registrar check-ins diarios** de forma individual o masiva
3. **Mantener rachas (streaks)** con un algoritmo inteligente que maneja edge cases
4. **Visualizar progreso** con dashboard analitico y calendario
5. **Compartir responsabilidad** con un accountability partner

## Stack Tecnologico

| Componente | Tecnologia |
|---|---|
| Backend | NestJS 10 + TypeScript 5.3 |
| ORM | TypeORM 0.3 |
| Base de datos | SQLite (dev) / PostgreSQL (prod) |
| Autenticacion | JWT + Passport |
| Frontend | Tailwind CSS + Alpine.js |
| Testing | Jest + Supertest |
| CI/CD | GitHub Actions |
| Contenedor | Docker |

## Links Utiles

- [Repositorio en GitHub](https://github.com/ronalc90/habit-forge)
- [Documentacion de API](API-Reference.md)
- [Guia de contribucion](https://github.com/ronalc90/habit-forge/blob/main/CONTRIBUTING.md)
