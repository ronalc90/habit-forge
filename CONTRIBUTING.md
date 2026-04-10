# Contribuir a HabitForge

Gracias por tu interes en contribuir a HabitForge. Este documento describe las guias y el proceso para contribuir al proyecto.

## Codigo de Conducta

Al participar en este proyecto, te comprometes a mantener un entorno respetuoso y colaborativo.

## Como Contribuir

### Reportar Bugs

1. Verifica que el bug no haya sido reportado previamente en [Issues](https://github.com/ronalc90/habit-forge/issues)
2. Crea un issue con el template de bug report
3. Incluye pasos para reproducir, comportamiento esperado vs actual, y contexto del entorno

### Sugerir Features

1. Abre un issue con el template de feature request
2. Describe el problema que resuelve y la solucion propuesta
3. Considera si el feature encaja con la vision del proyecto

### Pull Requests

1. Fork el repositorio
2. Crea una rama desde `main`: `git checkout -b feature/mi-feature`
3. Implementa tus cambios siguiendo las convenciones del proyecto
4. Escribe tests para la funcionalidad nueva
5. Ejecuta la suite de tests: `npm test`
6. Ejecuta el linter: `npm run lint`
7. Haz commit siguiendo las convenciones de commit
8. Abre un Pull Request hacia `main`

## Configuracion del Entorno de Desarrollo

```bash
# Clonar tu fork
git clone https://github.com/tu-usuario/habit-forge.git
cd habit-forge

# Instalar dependencias
npm ci

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en modo desarrollo
npm run start:dev

# Ejecutar tests
npm test
```

## Convenciones de Codigo

### Estructura

- Seguir la arquitectura modular de NestJS
- Un modulo por dominio funcional
- Separar controllers, services y DTOs
- Usar inyeccion de dependencias por constructor

### Estilo

- TypeScript estricto
- Prettier para formateo: `npm run format`
- ESLint para linting: `npm run lint`
- Nombres descriptivos en ingles para codigo, espanol para documentacion

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: agregar endpoint de estadisticas mensuales
fix: corregir calculo de streak en limite de mes
docs: actualizar documentacion de API
test: agregar tests para batch check-in
refactor: extraer logica de fechas a utilidad
```

### Tests

- Tests unitarios para cada servicio y controlador
- Usar mocks para dependencias externas (repositorios, otros servicios)
- Cubrir caso feliz, validaciones y edge cases
- Nombrar tests descriptivamente: `should throw NotFoundException when habit does not exist`

## Estructura de Archivos

Al crear un nuevo modulo:

```
src/
└── mi-modulo/
    ├── dto/
    │   ├── create-mi-modulo.dto.ts
    │   ├── update-mi-modulo.dto.ts
    │   └── index.ts
    ├── mi-modulo.controller.ts
    ├── mi-modulo.controller.spec.ts
    ├── mi-modulo.service.ts
    ├── mi-modulo.service.spec.ts
    └── mi-modulo.module.ts
```

## Preguntas

Si tienes dudas, abre un issue o inicia una [Discussion](https://github.com/ronalc90/habit-forge/discussions).
