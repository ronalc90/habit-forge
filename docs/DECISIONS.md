# Decisiones Tecnicas (ADRs) - HabitForge

## ADR-001: NestJS sobre Express puro

**Estado**: Aceptada
**Fecha**: 2026-04-10

### Contexto

Se necesitaba un framework backend para construir una API REST con autenticacion, validacion, y una arquitectura mantenible.

### Alternativas consideradas

1. **Express puro** - Minimalista, maxima flexibilidad
2. **Fastify** - Alto rendimiento, esquema de validacion nativo
3. **NestJS** - Framework opinionado con arquitectura modular

### Decision

Se eligio **NestJS** por las siguientes razones:

- **Arquitectura modular**: Cada dominio (auth, habits, check-ins, streaks, dashboard) se encapsula en un modulo independiente con inyeccion de dependencias
- **Decoradores nativos**: `@Controller`, `@Injectable`, `@UseGuards` simplifican la estructura del codigo
- **Ecosistema**: Integracion directa con Passport (`@nestjs/passport`), TypeORM (`@nestjs/typeorm`), validacion (`class-validator`), y cron (`@nestjs/schedule`)
- **TypeScript first**: Soporte nativo de TypeScript, no es un wrapper sobre JS
- **Testabilidad**: El sistema de DI facilita el mocking de dependencias en tests

### Consecuencias

- Mayor curva de aprendizaje inicial que Express puro
- Mas boilerplate (modulos, decoradores, DTOs)
- A cambio: estructura predecible, facil de escalar y mantener

---

## ADR-002: TypeORM sobre Prisma

**Estado**: Aceptada
**Fecha**: 2026-04-10

### Contexto

Se necesitaba un ORM para manejar entidades y relaciones de la base de datos.

### Alternativas consideradas

1. **Prisma** - Schema declarativo, migraciones automaticas, type-safe client
2. **TypeORM** - Decoradores, Active Record + Data Mapper, integrado con NestJS
3. **Sequelize** - ORM maduro, mas orientado a JavaScript

### Decision

Se eligio **TypeORM** por las siguientes razones:

- **Integracion nativa con NestJS**: `@nestjs/typeorm` proporciona `forRoot()`, `forFeature()`, y `@InjectRepository()`
- **Decoradores para entidades**: `@Entity`, `@Column`, `@ManyToOne`, `@OneToOne` se sienten naturales en un proyecto NestJS
- **Patron Repository**: `Repository<Entity>` con metodos como `find`, `findOne`, `save`, `remove`
- **QueryBuilder**: Para consultas complejas como el calculo de `MAX(sortOrder)`
- **Soporte multi-DB**: SQLite para desarrollo, PostgreSQL para produccion, sin cambios de codigo

### Consecuencias

- TypeORM tiene algunos problemas conocidos con migraciones complejas
- Prisma tiene mejor type-safety en queries
- TypeORM permite `synchronize: true` para desarrollo rapido (desactivar en produccion)

---

## ADR-003: SQLite para desarrollo

**Estado**: Aceptada
**Fecha**: 2026-04-10

### Contexto

El entorno de desarrollo necesitaba una base de datos que no requiera instalacion adicional.

### Alternativas consideradas

1. **PostgreSQL local** - Requiere instalacion o Docker
2. **PostgreSQL en Docker** - Requiere Docker instalado y corriendo
3. **SQLite** - Archivo unico, zero-config

### Decision

Se eligio **SQLite (better-sqlite3)** para desarrollo:

- **Zero-config**: No requiere instalar, configurar ni iniciar ningun servicio
- **Archivo unico**: `habitforge.sqlite` se crea automaticamente
- **Compatible con TypeORM**: El mismo codigo funciona con SQLite y PostgreSQL
- **Rapido para desarrollo**: Sin latencia de red, lectura/escritura directa en disco

### Consecuencias

- Algunas features de PostgreSQL no estan disponibles en SQLite (ej: tipos avanzados, JSONB)
- Se usa `better-sqlite3` en lugar de `sqlite3` por mejor rendimiento
- PostgreSQL se usa en produccion via Docker Compose o Railway

---

## ADR-004: JWT con Passport para autenticacion

**Estado**: Aceptada
**Fecha**: 2026-04-10

### Contexto

La API necesitaba un mecanismo de autenticacion seguro y escalable.

### Alternativas consideradas

1. **Session-based auth** - Cookies + session store (Redis)
2. **JWT stateless** - Token firmado, sin estado en servidor
3. **OAuth2 externo** - Delegacion a Google, GitHub, etc.

### Decision

Se eligio **JWT stateless con Passport** por las siguientes razones:

- **Stateless**: El servidor no necesita almacenar sesiones, ideal para escalar horizontalmente
- **Multiples estrategias**: `LocalStrategy` para login con email/password, `JwtStrategy` para validar tokens en rutas protegidas
- **Integracion con NestJS**: `@nestjs/passport` y `@UseGuards(JwtAuthGuard)` integran el flujo de auth con decoradores
- **Seguridad**: Hashing con bcrypt (12 rounds), tokens con expiracion configurable (default 7 dias)

### Implementacion

```
Registro: email + password -> bcrypt hash -> save User -> generar JWT
Login: email + password -> LocalStrategy valida -> generar JWT
Requests: Authorization: Bearer <token> -> JwtStrategy valida -> inyecta User en request
```

### Consecuencias

- No hay soporte para revocar tokens individuales (requeriria blacklist en Redis)
- El token contiene `sub` (userId) y `email`, suficiente para el MVP
- Se puede agregar refresh tokens en el futuro

---

## ADR-005: Algoritmo de streaks con doble estrategia

**Estado**: Aceptada
**Fecha**: 2026-04-10

### Contexto

El calculo de rachas (streaks) es una funcionalidad critica que afecta la experiencia del usuario. Necesitaba ser preciso, eficiente y correcto en todos los edge cases.

### Alternativas consideradas

1. **Recalculo completo siempre** - O(n) en cada check-in, simple pero ineficiente
2. **Incremental siempre** - O(1) pero puede desincronizarse
3. **Hibrido: incremental + recalculo** - O(1) para operaciones comunes, O(n) como fallback

### Decision

Se eligio la **estrategia hibrida**:

#### Check-in (O(1) - Incremental)

Al registrar un check-in, solo se evaluan 4 casos:
1. **Primera vez**: `currentStreak = 1`
2. **Dia consecutivo** (lastCheckDate == yesterday): `currentStreak += 1`
3. **Mismo dia**: Sin cambio (idempotente)
4. **Gap**: `currentStreak = 1` (reset)

#### Undo (O(n) - Recalculo completo)

Al deshacer un check-in, se recalcula desde el historial completo porque el check-in eliminado puede estar en medio de la racha.

### Edge cases cubiertos

- Transicion enero-febrero (31 -> 01)
- Transicion de anio (2023-12-31 -> 2024-01-01)
- Anio bisiesto (2024-02-29 -> 2024-03-01)
- Check-in duplicado en el mismo dia
- Eliminacion del unico check-in existente

### Tests

El modulo de streaks tiene **17 tests unitarios** cubriendo todos estos escenarios.

---

## ADR-006: Neomorfismo para la UI

**Estado**: Aceptada
**Fecha**: 2026-04-10

### Contexto

El frontend necesitaba una identidad visual que diferenciara a HabitForge de otras apps de habitos.

### Alternativas consideradas

1. **Material Design** - Estandar, familiar, ampliamente adoptado
2. **Bootstrap** - Rapido, funcional, pero generico
3. **Neomorfismo** - Innovador, tactil, diferenciador

### Decision

Se eligio **Neomorfismo (neumorphism)** con una paleta calida:

- **Diferenciacion**: Ninguna app de habitos popular usa neomorfismo
- **Sensacion tactil**: Los botones con sombras interiores/exteriores dan feedback visual de "presion"
- **Calidez**: La paleta `#f0e7db` (warm) con acentos violeta `#8b5cf6` transmite comfort
- **Implementacion ligera**: Solo CSS (box-shadow, gradientes), sin libreria de componentes

### Stack del frontend

- **Tailwind CSS** (CDN) - Utilidades para layout y responsive
- **Alpine.js** (CDN) - Reactividad ligera para interacciones (sin build step)
- **CSS personalizado** - Clases neomorficas: `.nm-flat`, `.nm-convex`, `.nm-pressed`, `.nm-input`, `.nm-btn`, `.nm-card`

### Consecuencias

- Mayor esfuerzo en CSS personalizado
- Accesibilidad requiere atencion extra (contraste de las sombras suaves)
- No todas las personas encuentran el neomorfismo intuitivo
- El diseno se ve mejor en pantallas de alta resolucion
