# Algoritmo de Streaks

## Introduccion

Las rachas (streaks) son el corazon motivacional de HabitForge. Una racha representa el numero de dias consecutivos que un usuario ha completado un habito.

## Doble Estrategia

El algoritmo usa dos enfoques segun la operacion:

### 1. Incremental (O(1)) - Al hacer check-in

Cuando se registra un check-in, solo necesitamos comparar la fecha del check-in con `lastCheckDate`:

```
Dado: habitId, checkDate
  streak = buscar streak del habito
  yesterday = dia anterior a checkDate

  Caso 1 - Primera vez (lastCheckDate es null):
    currentStreak = 1

  Caso 2 - Dia consecutivo (lastCheckDate == yesterday):
    currentStreak += 1

  Caso 3 - Mismo dia (lastCheckDate == checkDate):
    Sin cambio (idempotente)

  Caso 4 - Gap (cualquier otro caso):
    currentStreak = 1 (reset)

  bestStreak = max(currentStreak, bestStreak)
  lastCheckDate = checkDate
```

**Complejidad**: O(1) - Solo una lectura y una escritura, sin importar el historial.

### 2. Recalculo Completo (O(n)) - Al deshacer check-in

Cuando se deshace un check-in, no podemos usar la estrategia incremental porque el check-in eliminado puede estar en cualquier posicion de la racha. Se recalcula desde cero:

```
Dado: habitId (despues de eliminar el check-in)
  checkIns = todos los check-ins del habito, ordenados DESC
  
  Si no hay check-ins:
    currentStreak = 0, lastCheckDate = null
    return

  // Calcular best streak historico
  bestStreak = 1, tempStreak = 1
  Para cada par de fechas consecutivas:
    Si son dias consecutivos: tempStreak++
    Si no: tempStreak = 1
    bestStreak = max(bestStreak, tempStreak)

  // Calcular current streak
  Si la fecha mas reciente es hoy o ayer:
    currentStreak = 1
    Contar dias consecutivos hacia atras
  Si no:
    currentStreak = 0 (la racha ya se rompio)
```

**Complejidad**: O(n) donde n = numero total de check-ins del habito.

## Edge Cases

### Transicion de Mes

```
lastCheckDate: 2024-01-31
checkDate:     2024-02-01
Resultado:     currentStreak += 1 (dia consecutivo)
```

### Transicion de Anio

```
lastCheckDate: 2023-12-31
checkDate:     2024-01-01
Resultado:     currentStreak += 1 (dia consecutivo)
```

### Anio Bisiesto

```
lastCheckDate: 2024-02-28
checkDate:     2024-02-29
Resultado:     currentStreak += 1

lastCheckDate: 2024-02-29
checkDate:     2024-03-01
Resultado:     currentStreak += 1
```

### Duplicado en Mismo Dia

```
lastCheckDate: 2024-01-15
checkDate:     2024-01-15
Resultado:     sin cambio (el constraint UNIQUE en DB previene esto, pero el algoritmo lo maneja gracefully)
```

### Eliminacion del Unico Check-in

```
Antes:  currentStreak = 1, lastCheckDate = "2024-01-15"
Accion: undo check-in del 2024-01-15
Despues: currentStreak = 0, lastCheckDate = null
```

## Funcion getPreviousDay

Clave del algoritmo: calcula correctamente el dia anterior usando objetos Date UTC:

```typescript
private getPreviousDay(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00Z');
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().split('T')[0];
}
```

Se usa `T12:00:00Z` (mediodia UTC) para evitar problemas con horario de verano.

## Cobertura de Tests

El modulo de streaks tiene **17 tests unitarios**:

- Inicio de nueva racha
- Incremento de racha consecutiva
- Reset por gap
- Actualizacion de best streak
- Duplicado en mismo dia
- Creacion de streak si no existe
- Transicion de mes (enero -> febrero)
- Transicion de anio (2023 -> 2024)
- Recalculo con historial vacio
- Recalculo con historial de 3 dias consecutivos
- NotFoundException cuando streak no existe
- Obtencion de streak existente

## Diagrama de Flujo

```
Check-in nuevo
      │
      ▼
┌─────────────┐
│ Buscar habit │──> 404 si no existe
└──────┬──────┘
       │
┌──────┴──────┐
│ Validar     │──> 403 si otro usuario
│ ownership   │──> 409 si duplicado
└──────┬──────┘
       │
┌──────┴──────┐
│ Guardar     │
│ check-in    │
└──────┬──────┘
       │
┌──────┴──────────────┐
│ updateStreakOnCheckIn │
│ (O(1) incremental)   │
└─────────────────────┘


Undo check-in
      │
      ▼
┌─────────────┐
│ Buscar      │──> 404 si no existe
│ check-in    │──> 403 si otro usuario
└──────┬──────┘
       │
┌──────┴──────┐
│ Eliminar    │
│ check-in    │
└──────┬──────┘
       │
┌──────┴──────────────┐
│ recalculateStreak    │
│ (O(n) completo)      │
└─────────────────────┘
```
