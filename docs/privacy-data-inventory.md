# Inventario de datos y privacidad — Semana 9

Este inventario describe los datos que la aplicación permite capturar y dónde los procesa el código actual. El proyecto y sus pruebas están diseñados para usar datos sintéticos; esa regla académica no impide técnicamente que alguien escriba datos reales en el formulario.

La referencia normativa es la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados (LGPDPPSO). Se menciona como marco orientativo, no como dictamen ni afirmación de cumplimiento legal.

## 1. Principios aplicados

- **Finalidad:** los campos del formulario se utilizan para registrar una inspección y sincronizarla con la API de demostración.
- **Minimización:** los campos se validan en el servidor, la ubicación se redondea y el listado omite fotografías y el identificador interno del propietario.
- **Datos sintéticos:** los fixtures y pruebas usan ejemplos ficticios. El formulario no bloquea la entrada de información real; si se usaran datos reales, harían falta decisiones de privacidad y controles adicionales.
- **Transparencia sobre los límites:** no hay autenticación real, retención automática ni borrado remoto. Las pruebas respaldan comportamientos concretos, no el cumplimiento legal general.

## 2. Inventario de datos

La columna de acceso describe la política implementada, no una autenticación efectiva: los roles provienen de cabeceras de demostración que cualquier cliente puede enviar. En el dispositivo, cualquier persona con acceso al perfil del navegador puede acceder a la aplicación y su `localStorage`.

| Dato | Finalidad | Dónde queda almacenado | Quién puede acceder | Conservación comprobable | Decisión de privacidad |
|---|---|---|---|---|---|
| Laboratorio | Asociar el registro con el lugar inspeccionado. | Cola de `localStorage` y registro en el `Map` del servidor tras sincronizar. | En el dispositivo, quien acceda al perfil. En la API, actores que la política permita según las cabeceras recibidas. | No hay caducidad automática en la cola. En el servidor, permanece en memoria hasta que el proceso se reinicia; no existe plazo definido. | Campo necesario para identificar la inspección; usar nombres ficticios en datos de prueba. |
| Fecha | Indicar la fecha del registro. | Cola local y registro en memoria del servidor. | Igual que el resto del registro. | Sin vencimiento local implementado; en memoria del proceso en servidor. | Validar formato y usar solo la precisión necesaria para la inspección. |
| Responsable (`inspector`) | Registrar quién aparece como responsable de la inspección. | Cola local y registro del servidor. | Igual que el resto del registro. La lista del servidor aplica la política por actor. | Sin vencimiento local; en memoria del proceso en servidor. | Es texto libre y podría identificar a una persona; utilizar nombres sintéticos y no asumir que el formulario lo impide. |
| Resumen y hallazgos | Describir la observación o tarea de mantenimiento. | Cola local y registro del servidor. | Igual que el resto del registro; quien tenga el dispositivo puede leer la cola. | La cola no se elimina al sincronizar; el servidor no tiene retención formal. | Se limitan longitudes y se eliminan ciertos caracteres de control en la API. No incluir información personal innecesaria. |
| Fotografía | Adjuntar evidencia visual opcional. El cliente la reduce a JPEG; el validador del servidor admite JPEG, PNG o WebP en base64. | Data URL dentro de la cola local y del registro del servidor. | En local, quien acceda al perfil; en la API, solo mediante detalle autorizado según el actor simulado. El listado omite la foto. | Sin vencimiento local; el servidor la conserva en memoria mientras exista el proceso. | Revisar el contenido antes de usar datos reales: una imagen puede mostrar personas u otros datos no previstos. |
| Ubicación (`lat`, `lon`, `precisionM`) | Añadir contexto aproximado a la inspección, de manera opcional. | Se solicita al navegador y, si el usuario la incorpora, se redondea y se guarda en la cola y el registro del servidor. | Quien acceda a la cola local; en servidor, actores permitidos por la política de demostración. | Sin vencimiento local; en memoria del proceso en servidor. | `geolocation.ts` redondea latitud/longitud a tres decimales y no usa seguimiento continuo. La lectura original del navegador existe transitoriamente en memoria antes del redondeo. |
| `clientId` | Identificar un registro al reintentar la sincronización y evitar duplicados. | Cola local y `Map` del servidor. | Cliente y servidor; el campo forma parte del registro que se devuelve según la ruta autorizada. | Permanece con el registro; no hay vencimiento local ni plazo formal en servidor. | Se valida como identificador de formato limitado; no es una credencial ni sustituye autenticación. |
| `ownerId` | Aplicar reglas de visibilidad y evitar que otro actor simulado sobrescriba el registro. | Solo en el objeto del `Map` del servidor. | Lo usa el código servidor; `proyectarListado()` y `proyectarDetalle()` lo omiten de las respuestas. | Mientras el registro exista en el almacén en memoria. | Es el ID declarado por la cabecera de demostración, no una identidad verificada. |
| Actor de demostración (`x-demo-actor`, `x-demo-rol`, `x-demo-alcance`) | Seleccionar el rol y alcance que usa la política de autorización. | Se envía en cabeceras HTTP; el código no lo persiste como campo del registro. | API y middleware reciben la petición; cualquier cliente puede construir estas cabeceras. | No se implementa almacenamiento del actor como sesión. | No es autenticación. No enviar ni tratar estos valores como credenciales seguras. |
| Estado, intentos y último error de sincronización | Mostrar y reintentar el estado de cada elemento. | En el objeto de cada elemento de la cola local de `localStorage`. | Quien acceda al perfil y la aplicación. | Permanece junto al elemento hasta el borrado manual o la limpieza del almacenamiento del navegador. | El estado de error puede contener texto del error; no se debe suponer que la cola desaparece al sincronizar. |
| Permisos de cámara, ubicación y notificaciones | Habilitar funciones opcionales del navegador. | La concesión/revocación la administra el navegador; el código consulta o solicita el permiso cuando corresponde. | El usuario puede gestionarlos en la configuración del navegador; la aplicación usa las capacidades concedidas. | Según la gestión del navegador; no se establece plazo en la aplicación. | Las solicitudes se inician desde botones. Cámara pide video sin audio; ubicación es de una sola lectura; notificaciones son locales y opcionales. |
| Cache Storage del service worker | Mantener la aplicación y recursos disponibles offline. | Cache Storage del origen del navegador, con caché vigente `inspecciones-lab-v4`. | Quien tenga acceso al perfil/origen del navegador. | No hay TTL. El service worker elimina entradas de otros nombres al activarse; el navegador también puede gestionar su almacenamiento. El botón de borrado no elimina estas cachés. | `public/sw.js` excluye `/api/`, pero guarda navegaciones y recursos GET del mismo origen. No describir toda la caché como si contuviera exclusivamente el shell. |
| Token de sesión | No hay finalidad implementada: el proyecto no tiene sesiones reales. | No existe en el código de autenticación revisado. | No aplica. | No aplica. | No afirmar que existe token ni que las cabeceras de demostración lo sustituyen. |

## 3. Datos que no deben incorporarse a esta entrega

- **Credenciales reales, claves o tokens:** no son necesarios para el proyecto ni deben añadirse al repositorio o a ejemplos.
- **Datos reales de personas o instalaciones:** las pruebas y evidencias deben seguir usando datos ficticios. El formulario acepta texto libre, así que esta es una regla de trabajo y no una restricción técnica del producto.
- **Audio:** `abrirCamara()` solicita `{ audio: false }` y `Permissions-Policy` desactiva el micrófono. No se describe el sistema como una grabadora de audio.
- **Ubicación GPS exacta persistida:** el cliente guarda la lectura redondeada a tres decimales, no las coordenadas originales. La API de geolocalización entrega primero coordenadas al navegador; por tanto, no se debe afirmar que nunca se reciben transitoriamente coordenadas exactas.
- **Fotografías identificables en evidencia académica:** la función de foto es opcional, pero antes de utilizar datos reales deben revisarse personas, pantallas, etiquetas y otros detalles que la imagen pudiera revelar.

## 4. Datos guardados en el dispositivo

`src/lib/storage/schema.ts` guarda la cola bajo la clave `inspecciones-sync-queue-v1` de `localStorage`. Cada elemento puede contener el payload completo (incluidas foto y ubicación opcionales), `clientId`, fechas, estado de sincronización, contador de intentos y último error. `src/lib/sync/queue.ts` actualiza el estado al enviar el registro, pero no elimina los elementos que ya quedaron sincronizados. No hay un plazo automático de limpieza.

Si se pierde una tableta y otra persona obtiene acceso al mismo perfil del navegador, la cola puede exponer responsable, hallazgos, fotografía y ubicación aproximada, tanto de elementos pendientes como sincronizados. `localStorage` no está cifrado por esta función y es accesible al JavaScript del mismo origen.

El botón **“Borrar datos de este dispositivo”** de `/inspecciones` pide confirmación y llama a `borrarDatosLocales()` sin opciones. La función ejecuta `clearQueue()`, que reemplaza la cola por una lista vacía. La acción visible:

- elimina la cola local, incluso elementos ya sincronizados;
- no elimina Cache Storage ni datos que el navegador conserve fuera de esa cola;
- no elimina el almacén del servidor;
- no ofrece cierre de sesión, ya que no hay autenticación real.

La prueba unitaria del bloque J verifica la cola y, por separado, la opción programática de borrar cachés. Esa opción no se activa desde el botón. La prueba E2E verifica la acción visible sobre la cola.

## 5. Datos en el servidor

`src/lib/server/inspections-store.ts` mantiene los registros en un `Map` de memoria ligado a `globalThis`. No se encontró una base de datos durable ni un proceso de retención. El almacén se pierde al reiniciar el proceso servidor; no hay un plazo garantizado ni se puede deducir una política de retención de ese comportamiento temporal.

Las rutas de API consultan el actor simulado y aplican `authz.ts`. `GET /api/inspecciones` devuelve únicamente registros que pasan el filtro de visibilidad y usa `proyectarListado()`, que omite la fotografía y `ownerId`. `GET /api/inspecciones/[id]` devuelve el detalle, incluida la fotografía si existe, solo cuando la política permite ver ese registro. Para un actor no identificado devuelve 401; para un detalle inexistente o no visible devuelve 404. Como el actor se forma con cabeceras falsificables, estos controles no proporcionan separación de usuarios reales.

## 6. Permisos y caché

- **Cámara:** el botón “Tomar foto” activa `getUserMedia` con video trasero y `audio: false`; al capturar o cancelar se detienen las pistas. Adjuntar archivo es una alternativa.
- **Ubicación:** el botón “Usar mi ubicación” solicita una lectura, sin seguimiento continuo. Si se concede, la aplicación almacena coordenadas redondeadas y precisión informada por el navegador; si se deniega, permite continuar sin ubicación.
- **Notificaciones:** el usuario puede activar recordatorios desde su botón. La petición no se realiza al cargar la pantalla y los avisos se muestran localmente mediante el service worker; no se implementa push de servidor.
- **Permissions-Policy:** `src/lib/security/headers.ts` permite `camera` y `geolocation` en el mismo origen, y desactiva `microphone`, `payment` y `usb`. Esta cabecera no reemplaza el diálogo de permisos del navegador.
- **Service worker:** `public/sw.js` no intercepta las rutas `/api/` ni métodos distintos de GET. Sí puede cachear navegaciones y otros recursos GET del mismo origen; no hay una política de expiración por tiempo. El test de integración ejecuta el service worker en un entorno simulado y no verifica todos los casos de un navegador desplegado.

## 7. Comprobación de afirmaciones

| Afirmación | Código relacionado | Prueba existente | Alcance de la prueba | Limitación |
|---|---|---|---|---|
| El listado omite fotografía y propietario. | `src/lib/server/inspections-access.ts` | `tests/security.spec.ts`, bloque F. | Comprueba la proyección de listado y que el detalle autorizado puede incluir foto. | Prueba el código/ruta con datos sintéticos, no una política real de usuarios. |
| La API filtra registros y devuelve 404 para un detalle ajeno. | `src/lib/security/authz.ts`, rutas API. | `tests/security.spec.ts`, bloque C; `tests/e2e/seguridad.spec.ts`, caso de API. | Comprueba actores de prueba, filtro de listado y respuestas del detalle. | Las cabeceras usadas para distinguir actores pueden falsificarse. |
| Se rechazan entradas no válidas y se limita el cuerpo. | `src/lib/security/validation.ts`, `src/lib/sync/validation.ts`. | `tests/security.spec.ts`, bloque E. | Prueba casos seleccionados: campos, foto, ID, fechas, coordenadas, JSON y tamaño. | Sin `Content-Length` se lee el cuerpo completo antes de medirlo; la medición usa longitud de texto. |
| El botón elimina la cola local. | `src/lib/security/local-data.ts`, `src/components/borrar-datos-locales.tsx`. | Bloque J de `tests/security.spec.ts` y E2E “el usuario puede borrar los datos guardados en el dispositivo”. | La E2E comprueba la acción visible; el bloque J prueba también la opción separada de eliminar cachés. | El botón no habilita esa opción ni elimina el servidor. |
| Cámara y ubicación son opcionales; se reduce precisión y no se pide audio. | `src/lib/device/camera.ts`, `src/lib/device/geolocation.ts`, `src/components/device-panel.tsx`. | `tests/unit/capabilities.spec.ts`. | Prueba resultados mediante objetos simulados, redondeo, solicitud sin audio y cierre de pistas. | No prueba el diálogo real ni el comportamiento de todos los dispositivos. |
| La política de permisos restringe capacidades. | `src/lib/security/headers.ts`, `src/middleware.ts`. | Bloque G de `tests/security.spec.ts`; prueba de cabeceras E2E. | Comprueba directivas y cabeceras seleccionadas. | No demuestra que todos los recursos estáticos o todos los despliegues reciban las mismas cabeceras. |
| El service worker deja pasar `/api/` y proporciona fallback offline. | `public/sw.js`. | `tests/integration/pwa-integration.spec.ts`. | Ejecuta el archivo en un entorno simulado y comprueba API, precaché y navegación offline. | No mide la retención del navegador real ni cubre toda navegación y respuesta posible. |
| El repositorio no contiene secretos. | No hay escáner integrado en esta rama. | No existe `tests/unit/secrets.spec.ts` en el checkout revisado. | No se ha comprobado con una prueba automatizada existente. | El escáner está asignado a Diana según la guía del equipo; no declarar esta afirmación como verificada. |

## 8. Límites y mejoras futuras

- No hay autenticación real: el actor se basa en cabeceras falsificables.
- No se define cuánto tiempo deben conservarse los datos, ni existe eliminación automática de la cola local.
- Los datos sincronizados permanecen en `localStorage` hasta el borrado manual o la limpieza del navegador.
- El almacén servidor es temporal y en memoria; no es una estrategia durable de retención o eliminación.
- El botón de borrado solo limpia la cola local; no revoca permisos del navegador, no elimina cachés y no borra registros del servidor.
- Antes de migrar a persistencia o datos reales sería necesario establecer finalidades, acceso, plazos de conservación, borrado y medidas adecuadas para las fotografías y los datos de personas.
- La mención de la LGPDPPSO no constituye una evaluación de cumplimiento; no se revisaron avisos de privacidad ni obligaciones jurídicas concretas.
