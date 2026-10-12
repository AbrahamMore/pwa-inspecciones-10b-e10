# Capacidades del dispositivo — Semana 6

Principios: permiso mínimo, solicitud únicamente por acción del usuario, detección de soporte y fallback siempre disponible.

| Capacidad | Para qué se usa | Permiso | Cuándo se pide | Datos mínimos | Fallback |
|---|---|---|---|---|---|
| Cámara (`src/lib/device/camera.ts`) | Capturar una foto de evidencia de una inspección | Cámara, solo video y sin micrófono | Al invocar `abrirCamara`, previsto desde una acción explícita del usuario | El módulo abre un flujo de cámara; no captura ni almacena la imagen por sí solo. `cerrarCamara` detiene todas las pistas cuando se invoca | `<input type="file" accept="image/*" capture="environment">` o galería |
| Geolocalización (`src/lib/device/geolocation.ts`) | Sugerir en qué laboratorio se hace la inspección | Ubicación | Al invocar `obtenerUbicacion`, previsto desde una acción explícita del usuario | Una lectura, sin seguimiento continuo; baja precisión y coordenadas redondeadas a 3 decimales (aproximadamente 110 m) | Escribir el laboratorio manualmente |
| Notificaciones (`src/lib/notifications/client.ts`) | Mostrar un recordatorio local de inspección pendiente | Notificaciones | Al invocar `pedirPermiso`, previsto desde una acción explícita del usuario | El título y el cuerpo los proporciona quien llama al módulo; este no los filtra ni garantiza que sean genéricos. Sin push ni servidor | Aviso dentro de la app |

## Estados posibles

El tipo compartido `CapabilityResult` define los estados `ok`, `unsupported`, `denied` y `error`, con un mensaje para los resultados distintos de `ok`. Las funciones de estos módulos devuelven resultados tipados en vez de propagar los errores que manejan. Esto no confirma que una interfaz existente invoque las funciones o presente esos mensajes.

## Decisiones

- No se solicitan permisos al cargar la página. Las funciones están documentadas para invocarse por una acción explícita del usuario; los módulos por sí solos no implementan controles de interfaz.
- Si el permiso de notificaciones ya está denegado, `pedirPermiso` indica que puede activarse desde la configuración del sitio y no vuelve a solicitarlo.
- Las notificaciones son locales y utilizan el service worker para mostrarse. No implementan notificaciones push ni requieren un servidor en este módulo.
- La versión documentada utiliza datos sintéticos. El código inspeccionado no demuestra que fotos o coordenadas se transmitan o almacenen de una manera determinada.

## Pruebas

Existe `tests/capabilities.spec.ts`. Con objetos simulados comprueba resultados de geolocalización, incluida la ubicación ausente, permiso denegado, error y coordenadas redondeadas; que la cámara no solicite micrófono, que se detengan las pistas al llamar a `cerrarCamara` y que exista el fallback de entrada de archivo; y que las notificaciones no se muestren sin permiso, contemplando permiso denegado y falta de soporte.

Los objetos simulados no sustituyen las pruebas en dispositivos físicos ni en navegadores reales con los diálogos de permisos. Esta prueba tampoco comprueba todos los estados de error para cada capacidad ni una interacción real de interfaz.

## Limitaciones

- No se ha confirmado el funcionamiento en un dispositivo físico ni con los diálogos reales de permisos.
- La compatibilidad de notificaciones puede variar según el navegador y el sistema operativo.
- Cámara, geolocalización y service worker dependen de las condiciones de seguridad que exija el navegador, normalmente HTTPS o `localhost`.
- Los módulos de dispositivo existen, pero la revisión de `src/app/` no encontró controles de interfaz que los invoquen. No se afirma que haya una integración completa.
- El módulo de cámara no captura ni almacena una imagen automáticamente: abre un flujo y expone una función para detener sus pistas.
- El módulo de notificaciones muestra el título y el cuerpo recibidos del llamador; no garantiza que su contenido sea genérico ni que esté libre de datos personales.
