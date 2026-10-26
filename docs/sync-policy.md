# Política de sincronización — persistencia local, idempotencia y conflictos

Código principal: `src/lib/storage/schema.ts`, `src/lib/sync/` y `src/app/api/inspecciones/route.ts`.

## 1. Qué se guarda localmente

Cada inspección capturada se guarda como una entrada de la cola de sincronización (`QueuedInspection`), en `localStorage`, bajo la clave `inspecciones-sync-queue-v1`:

```ts
export interface QueuedInspection {
  clientId: string;
  payload: {
    location: string;
    date: string;
    summary: string;
    inspector: string;
    findings: string;
    photo?: string;                                   // foto comprimida (data URL)
    geo?: { lat: number; lon: number; precisionM: number }; // ubicación aproximada
  };
  createdAt: string;
  updatedAt: string;
  status: "pending" | "syncing" | "synced" | "error";
  attempts: number;
  lastError?: string;
}
```

- `clientId`: identificador único del registro, base de la idempotencia.
- `payload`: los datos de la inspección. `photo` y `geo` son opcionales.
- `createdAt` / `updatedAt`: marcas de tiempo; `updatedAt` decide los conflictos.
- `status`, `attempts`, `lastError`: seguimiento de la sincronización.

## 2. Almacenamiento: localStorage, no IndexedDB

La cola se lee y se escribe con `readQueue()`, `writeQueue()` y `clearQueue()`.

Se eligió `localStorage` porque el alcance es un flujo con datos sintéticos y una cola pequeña, y su API síncrona es simple. Limitaciones reales:

- es síncrono y puede bloquear el hilo principal con mucho volumen;
- su capacidad es limitada (del orden de unos pocos MB), por lo que las fotos la llenan rápido; por eso se comprimen a 800 px y el formulario avisa si ya no hay espacio para guardar;
- los registros sincronizados **no se eliminan** de la cola: se conservan para mostrar su estado, de modo que el uso de espacio crece con el tiempo.

Si el dato guardado está dañado o no es una lista, `readQueue()` devuelve una cola vacía en vez de lanzar un error, para que la app siga abriendo (la cola se reconstruye al volver a guardar).

`IndexedDB` sería más robusto para volúmenes mayores o fotos; no se usó en este alcance.

## 3. Cuándo se sincroniza

La sincronización (`syncQueue`) corre:

- justo después de guardar una inspección;
- al abrir la aplicación, para enviar lo que haya quedado pendiente;
- cuando el navegador avisa que volvió la red (evento `online`);
- cuando la persona pulsa **Sincronizar ahora**.

Es global: está en un proveedor (`SyncProvider`) de toda la app, así que un registro pendiente se envía desde cualquier pantalla. Reglas del sincronizador (`src/lib/sync/runner.ts`): **sin red no intenta enviar** y **solo corre una sincronización a la vez**.

## 4. Idempotencia: cómo se evitan duplicados

- El `clientId` se genera una sola vez, con `crypto.randomUUID()`, al encolar el registro.
- No cambia en los reintentos: cada intento reenvía exactamente el mismo `clientId`.
- El servidor (`recibir()` en `src/lib/server/inspections-store.ts`) usa el `clientId` como llave. Si ya existe, **no crea otro registro**.

Casos cubiertos por pruebas: reenviar el mismo registro varias veces, perder la respuesta del servidor y reintentar, y enviar seis veces a la vez el mismo registro (por ejemplo, desde dos pestañas): en todos los casos queda **un solo registro**.

## 5. Reintentos

Implementados en `src/lib/sync/queue.ts`:

- Antes de cada envío el registro pasa a `syncing` y `attempts` aumenta en 1.
- Si el envío termina bien (`ok: true`) pasa a `synced`.
- Si falla (respuesta no válida o excepción de red), se guarda el mensaje en `lastError`. Si `attempts` es menor que `MAX_ATTEMPTS` (3), vuelve a `pending`; al llegar a 3 queda en `error`.
- Los registros `synced` se omiten.
- **Un registro en `error` sí se vuelve a intentar** en la siguiente sincronización (al volver la red, al abrir la app o con el botón), y los intentos siguen contando. `error` indica "falló 3 veces o más", no "se dejó de intentar". `getPendingItems()` devuelve los registros `pending` y `error`.
- Un fallo en un registro no impide enviar los demás.

En la interfaz, cada estado tiene su texto: *Pendiente de enviar*, *Enviando…*, *Sincronizada* y *Error: toca «Sincronizar ahora»*.

## 6. API de sincronización

`POST /api/inspecciones` recibe `{ clientId, payload, createdAt, updatedAt }`:

| Respuesta | Cuándo |
|---|---|
| 201 | Registro nuevo. |
| 200 | Reenvío del mismo registro (duplicado) o actualización con una versión más reciente. |
| 400 | El cuerpo no es JSON válido. |
| 422 | La validación falló (la devuelve con la lista de errores). |

`GET /api/inspecciones` devuelve los registros recibidos.

Validación (la usan el formulario y la API, `src/lib/sync/validation.ts`): laboratorio y responsable obligatorios (hasta 80 caracteres), hallazgos obligatorios (hasta 1000), resumen opcional (hasta 300), fecha `AAAA-MM-DD`, `clientId` de 8 a 64 caracteres, foto solo si es una imagen `data:image/` de hasta 600 000 caracteres, y ubicación con latitud entre -90 y 90 y longitud entre -180 y 180.

## 7. Política de conflictos

Está en `src/lib/sync/conflict-policy.ts` y **el servidor la usa**: `recibir()` llama a `resolveConflict()`.

Política: *last write wins* por `updatedAt`.

- Si el registro que llega es más reciente que el guardado, gana el que llega y el servidor responde "actualizado".
- Si es más viejo o igual, se conserva lo guardado y se responde "duplicado": un reenvío tardío no sobrescribe una versión más nueva.
- `resolveConflict` devuelve `"local"`, `"remote"` o `"merge-not-needed"`, y lanza un error si se intenta comparar registros con `clientId` distinto.

Trade-off: es simple y predecible, pero depende de los relojes de los dispositivos; si dos dispositivos editan el mismo registro, el cambio de uno puede perderse.

## 8. Cómo se verifica

- Unitarias: `sync.spec.ts`, `queue-retries.spec.ts`, `storage-schema.spec.ts`, `runner.spec.ts`, `inspections-store.spec.ts`, `validation.spec.ts`.
- Integración: `sync-integration.spec.ts` (cola → API real, respuesta perdida) y `conflict-integration.spec.ts` (envíos simultáneos y reenvío tardío).
- E2E: `flujo-critico.spec.ts` (captura sin conexión, una sola sincronización, recargar no duplica) y `datos-danados.spec.ts`.

## 9. Limitaciones

- **El servidor guarda en memoria** (datos sintéticos): se reinicia con el servidor y no se comparte entre instancias en un despliegue sin estado. Las pruebas validan la lógica de idempotencia, no una base de datos real.
- No hay autenticación ni sincronización multiusuario real.
- `localStorage` y el crecimiento de la cola (ver sección 2).
- Las pruebas solo se ejecutan en Chromium.
