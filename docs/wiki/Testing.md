# Testing

## Resumen

HabitForge cuenta con **78 tests** distribuidos en:

| Tipo | Cantidad | Descripcion |
|------|----------|-------------|
| Unit | 57 | Controladores y servicios aislados |
| E2E | 21 | Flujo completo de la aplicacion |
| **Total** | **78** | |

## Ejecutar Tests

```bash
# Tests unitarios
npm test

# Tests con cobertura
npm run test:cov

# Tests en modo watch
npm run test:watch

# Tests E2E (requiere PostgreSQL)
npm run test:e2e

# Tests en modo debug
npm run test:debug
```

## Distribucion por Modulo

### AuthController (6 tests)

- Registro exitoso con respuesta de auth
- Rechazo de email duplicado (ConflictException)
- Login exitoso con credenciales validas
- Obtencion de perfil sin passwordHash
- Rechazo de usuario invalido (UnauthorizedException)
- Verificacion de que el controlador esta definido

### HabitsController (10 tests)

- Creacion de nuevo habito
- Listar todos los habitos
- Listar solo habitos activos (filter active=true)
- Obtener habito por ID
- Error 404 cuando habito no existe
- Error 403 al acceder habito de otro usuario
- Actualizacion de habito
- Eliminacion de habito
- Reordenamiento de habitos
- Verificacion de que el controlador esta definido

### CheckInsService (13 tests)

- Check-in exitoso para hoy
- Check-in para fecha especifica
- Error 404 cuando habito no existe
- Error 403 cuando habito es de otro usuario
- Error 409 para check-in duplicado
- Undo de check-in con recalculo de streak
- Error 404 al deshacer check-in inexistente
- Error 403 al deshacer check-in de otro usuario
- Batch check-in con multiples habitos
- Batch check-in omite duplicados silenciosamente
- Consulta por rango de fechas
- Filtrado por habitId en rango
- Verificacion de que el servicio esta definido

### StreaksService (17 tests)

- Nueva racha cuando no hay check-ins previos
- Incremento de racha consecutiva
- Reset de racha cuando hay gap
- Actualizacion de best streak
- Sin cambio para check-in duplicado en mismo dia
- Creacion de registro streak si no existe
- Transicion correcta de limite de mes (enero -> febrero)
- Transicion correcta de limite de anio (2023 -> 2024)
- Recalculo: reset cuando no hay check-ins
- Recalculo: error si streak no existe
- Recalculo: calculo correcto desde historial
- Obtencion de streak existente
- Error 404 cuando streak no existe
- Verificacion de que el servicio esta definido

### DashboardService (11 tests)

- Resumen correcto cuando todos los habitos estan completados
- Resumen correcto cuando algunos estan completados
- 0% cuando ningun habito esta completado
- 0 para todo cuando no hay habitos
- Inclusion de datos de streak por habito
- Datos de calendario para rango de fechas
- Estadisticas semanales
- 0 consistency cuando no hay check-ins
- Manejo de periodo mensual
- Verificacion de que el servicio esta definido

### E2E Flow (21 tests)

Flujo completo secuencial:

1. **Auth Flow**: Registro, rechazo de duplicado, login, rechazo de credenciales invalidas, perfil, rechazo sin token
2. **Habit CRUD**: Crear habito, listar habitos, obtener por ID, actualizar
3. **Check-In + Streak**: Check-in, prevencion de duplicado, check-ins de hoy, verificacion de streak en dashboard, undo, verificacion de reset
4. **Dashboard**: Stats semanales, calendario
5. **Cleanup**: Eliminacion de habito

## Estrategia de Mocking

### Unit Tests

Cada test unitario mockeea las dependencias externas:

```typescript
// Mock de repositorios
{
  provide: getRepositoryToken(Entity),
  useValue: {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  },
}

// Mock de servicios
{
  provide: StreaksService,
  useValue: {
    updateStreakOnCheckIn: jest.fn(),
    recalculateStreak: jest.fn(),
  },
}
```

### E2E Tests

Los tests E2E usan el modulo real con una base de datos real:

```typescript
const moduleFixture = await Test.createTestingModule({
  imports: [AppModule],
}).compile();

app = moduleFixture.createNestApplication();
// Configuracion identica a main.ts
```

## Configuracion de Jest

```json
{
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": { "^.+\\.(t|j)s$": "ts-jest" },
  "testEnvironment": "node",
  "moduleNameMapper": { "^src/(.*)$": "<rootDir>/$1" }
}
```

## Agregar Tests Nuevos

Al agregar funcionalidad nueva, seguir este patron:

1. Crear archivo `.spec.ts` junto al archivo que se esta testeando
2. Usar `Test.createTestingModule` para configurar el modulo de test
3. Mockear todas las dependencias del servicio/controller
4. Cubrir: caso feliz, validaciones, excepciones, edge cases
5. Nombrar tests descriptivamente: `should <accion esperada> when <condicion>`
