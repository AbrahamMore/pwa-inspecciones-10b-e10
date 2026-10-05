# Política de sincronización — persistencia local e idempotencia

## 1. Qué se guarda localmente

Cada inspección creada sin conexión se guarda como una entrada de la cola de sincronización en `src/lib/storage/schema.ts`. El tipo real es `QueuedInspection` y se almacena con todos los campos necesarios para reintentar la entrega y mantener trazabilidad local.

La estructura real es esta:

```ts
export interface QueuedInspection {
  clientId: string;
  payload: {
    location: string;
    date: string;
    summary: string;
    inspector: string;
    findings: string;
  };
  createdAt: string;
  updatedAt: string;
  status: "pending" | "syncing" | "synced" | "error";
  attempts: number;
  lastError?: string;
}
```

Eso significa que la inspección se guarda con:

- `clientId`: identificador único del registro para evitar duplicados por reintentos.
- `payload`: datos del hallazgo o inspección (`location`, `date`, `summary`, `inspector`, `findings`).
- `createdAt`: marca de tiempo de creación local.
- `updatedAt`: marca de tiempo de la última actualización/resultado.
- `status`: estado de sincronización (`pending`, `syncing`, `synced`, `error`).
- `attempts`: número de intentos realizados.
- `lastError`: último error cuando la operación falla.

La cola se guarda como un arreglo de `QueuedInspection` y se persiste en `localStorage` bajo la clave `inspecciones-sync-queue-v1`.

## 2. Almacenamiento: localStorage, no IndexedDB

En esta semana el proyecto usa `localStorage` para persistir la cola de sincronización. La lógica real está en `src/lib/storage/schema.ts`:

- `readQueue()` lee la clave `inspecciones-sync-queue-v1`.
- `writeQueue()` guarda el arreglo usando `JSON.stringify(queue)`.
- `clearQueue()` reinicia la cola.

La decisión se justifica porque el alcance actual es un flujo local y sintético, con una cola pequeña y sin backend aún implementado. `localStorage` es síncrono y funciona bien para este tipo de persistencia simple; sin embargo, tiene limitaciones reales:

- es síncrono, por lo que puede bloquear más el hilo principal si se usa con mucho volumen;
- tiene capacidad de almacenamiento limitada en comparación con IndexedDB;
- no está pensado para objetos grandes o flujos intensivos de escritura.

`IndexedDB` sería una alternativa más robusta para colas de datos más grandes o cambios más frecuentes, pero en esta semana el proyecto acepta `localStorage` como solución adecuada al alcance y a los datos sintéticos. La decisión no implica que sea la mejor opción a futuro; solo que es la implementación real vigente del proyecto.

## 3. Idempotencia: cómo se evitan duplicados

El elemento clave es `clientId`.

- Se genera con `crypto.randomUUID()` al crear la inspección en `enqueueInspection()`.
- Se genera una sola vez al crear el registro.
- No se reemplaza en reintentos posteriores.
- Durante `syncQueue()`, el mismo `clientId` se reenvía sin cambios en cada intento.

Esto es la idempotencia de la comprobación local: si el backend real o la capa de sincronización recibe el mismo registro varias veces con el mismo `clientId`, no debería tratarse como un registro nuevo distinto. La intención es evitar duplicados cuando posteriormente exista un backend real que reciba la cola.

La lógica actual no crea un nuevo `clientId` en cada reintento; la reintentos reutiliza exactamente el mismo valor asociado al registro original.

## 4. Política de reintentos

La política real está implementada en `src/lib/sync/queue.ts`.

Estados:

- `pending`: el registro está listo para sincronizar.
- `syncing`: el registro está en proceso de sincronización.
- `synced`: la sincronización fue exitosa.
- `error`: el registro alcanzó el máximo de reintentos y quedó para revisión.

Regla de reintento:

- `MAX_ATTEMPTS` es `3`.
- Cada vez que se intenta sincronizar un elemento, antes de llamar a `syncFn(item)` se marca como `syncing` y se incrementa `attempts`.
- Si `syncFn(item)` devuelve `{ ok: true }`, el registro pasa a `synced` y `updatedAt` se actualiza con la fecha actual.
- Si `syncFn(item)` devuelve `{ ok: false }` o lanza un error, se captura en `catch`.
- Si `attempts >= MAX_ATTEMPTS`, el estado pasa a `error`.
- Si `attempts < MAX_ATTEMPTS`, el estado vuelve a `pending` para un nuevo intento.
- `lastError` se conserva con el mensaje del error capturado.

De esta forma:

- los fallos se registran; 
- la cola no se pierde;
- al producirse 3 errores consecutivos, el elemento queda en `error` y deja de reintentarse automáticamente.

La función `getPendingItems()` devuelve los registros con estado `pending` o `error`, para que puedan revisarse manualmente.

## 5. Política de conflictos

La resolución real de conflictos está en `src/lib/sync/conflict-policy.ts`.

La implementación usa `Last Write Wins`:

- compara `updatedAt` del local vs. `updatedAt` del remoto;
- si el remoto es más reciente, gana el remoto;
- si el local es más reciente, gana el local;
- si los dos timestamps son iguales, el resultado es `merge-not-needed`.

La función `resolveConflict(local, remote)` devuelve uno de estos valores:

- `"remote"`: el remoto es más reciente.
- `"local"`: el local es más reciente.
- `"merge-not-needed"`: ambos timestamps son iguales.

La comparación también valida identidad del registro:

- si `local.clientId !== remote.clientId`, se lanza un error porque no corresponde al mismo registro al que se quiere resolver conflicto.

Esto hace que la política de conflictos sea explícita y determinista, sin depender del orden en que se evaluen los registros.

## 6. Limitaciones

La implementación actual tiene limitaciones claras y reales:

- todavía no existe un backend real de sincronización;
- `syncFn` desacopla la cola del backend, pero no reemplaza la integración real con un servicio externo;
- los conflictos se prueban con datos sintéticos, no con estado real del sistema productivo;
- `localStorage` es suficiente para esta semana, pero tiene restricciones de capacidad y rendimiento frente a `IndexedDB`;
- la cola local está diseñada para fluidez operativa y recuperación ante desconexión, no para un volumen grande ni para sincronización multiusuario real.

En resumen, la política documentada refleja el comportamiento real del código: persistencia local simple, idempotencia por `clientId`, reintentos controlados con `MAX_ATTEMPTS = 3`, `lastError`, y `Last Write Wins` según `updatedAt`.
