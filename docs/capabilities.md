# Capacidades del dispositivo — cámara, ubicación y notificaciones

Principios: **permiso mínimo**, **solicitud únicamente por acción del usuario**, detección de soporte y **alternativa siempre disponible**.

Módulos: `src/lib/device/camera.ts`, `src/lib/device/geolocation.ts`, `src/lib/device/image.ts` y `src/lib/notifications/client.ts`. Interfaz: `src/components/device-panel.tsx`, dentro del formulario *Nueva inspección*.

## Resumen

| Capacidad | Para qué se usa | Permiso | Cuándo se pide | Datos mínimos | Alternativa |
|---|---|---|---|---|---|
| Cámara | Foto de evidencia de la inspección | Cámara, solo video, sin micrófono | Al pulsar **Tomar foto** | Un fotograma, reducido a 800 px y comprimido como JPEG. La cámara se apaga al capturar o cancelar | **Adjuntar foto**: entrada de archivo con `capture="environment"` (cámara nativa o galería) |
| Ubicación | Registrar dónde se hizo la inspección | Ubicación | Al pulsar **Usar mi ubicación** | Una sola lectura, sin seguimiento, precisión baja, coordenadas redondeadas a 3 decimales (~110 m) | Continuar sin ubicación o escribir el laboratorio |
| Notificaciones | Recordatorio local de que quedó una inspección sin enviar | Notificaciones | Al pulsar **Activar recordatorios** | Texto genérico; notificación local por el service worker, sin push ni servidor | Aviso dentro de la app |

## Integración con la app

- El panel *Evidencia y avisos (opcional)* aparece en el formulario. **Nada se solicita al cargar la página.**
- La foto y la ubicación se incluyen en el registro (`photo` y `geo`), se guardan en la cola local, se ven en el listado y viajan al servidor al sincronizar.
- El botón **Activar recordatorios** solo se muestra mientras el permiso de notificaciones no esté concedido. Si se guarda una inspección **sin conexión** y hay permiso, se muestra una notificación local; si no hay permiso o soporte, el aviso se queda dentro de la app.
- Si ya no hay espacio en el almacenamiento local para guardar (por ejemplo, por una foto grande), el formulario lo avisa y sugiere quitar la foto.

## Estados posibles

Todas las funciones devuelven un resultado tipado (`CapabilityResult`) con cuatro estados, en vez de lanzar errores hacia la interfaz:

| Estado | Significado | Qué ve la persona |
|---|---|---|
| `ok` | La capacidad funcionó | El resultado (foto, coordenadas, permiso activado) |
| `unsupported` | El dispositivo o navegador no la ofrece | Mensaje y alternativa |
| `denied` | La persona negó el permiso | Mensaje y alternativa; el formulario sigue usable |
| `error` | Falló por otra causa | Mensaje para reintentar o continuar sin ella |

## Cámara y foto

- Se pide `getUserMedia` con video de la cámara trasera y **sin audio**.
- Al capturar se dibuja un fotograma en un canvas reducido a 800 px de lado mayor y se exporta como JPEG, bajando la calidad (0.7, 0.5, 0.35, 0.2) hasta que cabe en el límite de 600 000 caracteres que acepta la API. Si ni así cabe, se avisa.
- Si el permiso se niega o no hay cámara, se muestra un mensaje y queda disponible **Adjuntar foto**.

## Ubicación

- Una sola lectura (`getCurrentPosition`), sin `watchPosition`, con precisión baja, límite de 8 s y reutilización de una lectura de hasta 60 s.
- Las coordenadas se redondean a 3 decimales por minimización de datos.

## Notificaciones

- Si el permiso ya está denegado, no se vuelve a pedir; se indica que puede activarse en la configuración del sitio.
- Son locales y se muestran con `showNotification` del service worker. No hay push.
- Leer el permiso (`leerPermiso`) nunca abre el diálogo del navegador.

## Cómo se verifica

- Unitarias: `capabilities.spec.ts` (estados de cada capacidad con objetos simulados, sin micrófono, cierre de pistas, redondeo, no preguntar si ya está bloqueado), `image.spec.ts` (redimensionado y compresión) y `labels.spec.ts`.
- Integración: `device-integration.spec.ts` (el panel está en el formulario y nada se pide al cargar).
- E2E: `capacidades.spec.ts` (cámara y ubicación simuladas por el navegador de pruebas: la foto y la ubicación llegan al servidor) y `flujo-critico.spec.ts` (sin cámara hay alternativa).

## Limitaciones

- Cámara real y diálogos de permisos reales no se automatizan; se simulan o se prueban a mano.
- Solo se probó en Chromium. La compatibilidad de notificaciones varía según navegador y sistema operativo.
- Cámara, ubicación y service worker requieren HTTPS o `localhost`.
- Las fotos ocupan mucho de `localStorage` (capacidad limitada); los registros sincronizados no se eliminan de la cola.
- Las notificaciones no son push: solo avisan mientras el navegador o la app pueden mostrarlas.
