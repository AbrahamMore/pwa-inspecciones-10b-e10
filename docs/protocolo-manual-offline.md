# Protocolo de prueba manual — uso sin conexión

Propósito: comprobar a mano, en un navegador real, que la app abre sin conexión, que lo capturado sin red no se pierde y que se sincroniza una sola vez al volver la red. Complementa las pruebas automatizadas (`tests/e2e/flujo-critico.spec.ts`), que lo verifican de forma repetible.

## Entorno

- Fecha de preparación: 2026-10-25
- Persona que la preparó: Josmar
- Sistema operativo y versión: Windows 11 Home
- Navegador y versión: Chrome visible en las capturas; versión pendiente.
- Identificador de la versión probada: Pendiente de verificación; no se dispone de un identificador confirmado.
- Preparación: las dependencias ya estaban instaladas antes de esta revisión. `npm run build` terminó correctamente; `npm start` respondió HTTP 200 en `http://localhost:3000`.

Se encontraron diez capturas en `docs/evidencia-semana8/`.

## Pasos

| # | Acción | Resultado esperado | Resultado observado | Captura |
|---|---|---|---|---|
| 1 | Abrir `http://localhost:3000` con conexión. | Portada con la barra *Inicio · Inspecciones · Nueva inspección*, el botón *Registrar inspección* y el indicador *Con conexión*. | Comprobado visualmente: la captura muestra la portada y el indicador *Con conexión*. | Esperado: `01-portada.png`; archivo existente: `01-portada.png` |
| 2 | En DevTools (F12) → *Application* → *Manifest*. | El manifest se carga y no muestra errores; los íconos aparecen. | Manifest e íconos visibles. DevTools muestra dos advertencias de screenshots faltantes para la UI de instalación enriquecida; no se interpreta como ausencia de errores/advertencias. | Esperado: `02-manifest.png`; archivo existente: `02-manifest.png` |
| 3 | En *Application* → *Service Workers*. | El service worker `/sw.js` figura como *activated and running*. Recargar la página una vez. | Comprobado visualmente: `/sw.js` figura como *activated and is running*. La captura no acredita la recarga indicada en la acción. | Esperado: `03-service-worker.png`; archivo existente: `03-service-worker.png` |
| 4 | Ir a *Nueva inspección*. En DevTools → *Network*, marcar **Offline**. | El indicador cambia a *Sin conexión* y el formulario sigue disponible. | Comprobado visualmente: formulario disponible, indicador *Sin conexión* y modo Offline seleccionado. | Esperado: `04-offline.png`; archivo existente: `04-offline.png` |
| 5 | Con Offline activo, llenar laboratorio, responsable y hallazgos, y pulsar *Guardar inspección*. | Mensaje de guardado en el dispositivo; el estado es *Pendiente de enviar* y la barra muestra *1 por enviar*. | Comprobado visualmente: mensaje de guardado local, registro con estado *Pendiente de enviar* y *1 por enviar*. | Esperado: `05-pendiente.png`; archivo existente: `05-pendiente.png` |
| 6 | Pulsar *Inspecciones* en la barra. | El listado muestra el registro en *Capturadas en este dispositivo* como *Pendiente de enviar*. | Comprobado visualmente: listado con registros locales, incluyendo uno *Pendiente de enviar*, mientras el indicador dice *Sin conexión*. | Esperado: `06-listado.png`; archivo existente: `06-listado.png` |
| 7 | Con Offline activo, recargar la página. | La app abre sin conexión y el registro sigue ahí. | La captura muestra el listado offline con registros, incluido uno pendiente; la imagen por sí sola no demuestra que se recargó después de quedar offline. Recarga y persistencia tras recarga siguen pendientes de confirmación. | Esperado: `07-recarga-offline.png`; archivo existente: `07-recarga-offline.png` |
| 8 | Quitar la marca **Offline**. | En unos segundos el registro pasa a *Sincronizada* y desaparece *1 por enviar*, sin volver al formulario. | La captura muestra conexión activa y un registro *Sincronizada*, pero también otro registro *Pendiente de enviar* y el indicador *1 por enviar*. Se acredita un registro sincronizado, no que desaparecieran todos los pendientes ni la sincronización del mismo registro del paso 5. | Esperado: `08-sincronizada.png`; archivo existente: `08-sincronizada.png` |
| 9 | Abrir `http://localhost:3000/api/inspecciones`. | La respuesta JSON queda visible y contiene las inspecciones recibidas. | Comprobado visualmente: la respuesta JSON está visible y contiene tres inspecciones, incluidas dos de Laboratorio de Electrónica con fechas y hallazgos distintos. La captura no demuestra de forma concluyente la ausencia de duplicados. | Esperado: `09-api.png`; archivo existente: `09-api.png` |
| 10 | Recargar la app y volver a abrir el listado. | Verificar qué registros aparecen en el listado; la ausencia de duplicados en el servidor requiere además comparar la respuesta de la API antes y después. | La captura muestra dos registros diferentes de Laboratorio de Electrónica: 2026-10-28, `falla sincronizar`, y 2026-10-25, `fallo sin conexion`; ambos aparecen como *Sincronizada*. Son distintos por fecha y hallazgo. La captura por sí sola no permite afirmar que no haya duplicados en la API. | Esperado: `10-sin-duplicados.png`; archivo existente: `10-sin-duplicados.png` |

## Pruebas adicionales (opcionales)

| # | Acción | Resultado esperado | Resultado observado |
|---|---|---|---|
| A | Pulsar *Tomar foto* y aceptar el permiso; capturar. | La foto aparece como vista previa y la cámara se apaga. | no se realizó |
| B | Pulsar *Usar mi ubicación* y aceptar el permiso. | Aparece *Ubicación aproximada* con coordenadas. | no se realizó |
| C | Negar el permiso de la cámara y pulsar *Tomar foto*. | Aparece un aviso y sigue disponible *Adjuntar foto*. | no se realizó |
| D | Activar los recordatorios y guardar una inspección con Offline activo. | Aparece una notificación *Inspección guardada sin conexión*. | no se realizó |
| E | Modificar la versión de caché en `public/sw.js` (`v3` → `v4`), reconstruir, y en *Application* → *Service Workers* pulsar *Update*. | Aparece el aviso *Hay una versión nueva de la app* con *Actualizar*; al pulsarlo la página se recarga y los registros guardados siguen ahí. | no se realizó |

## Resultado

- ¿Todos los pasos obligatorios (1 a 10) se comportaron como se esperaba? No verificable en conjunto: las capturas acreditan parte de los pasos 1–6, muestran estado offline en el paso 7 y un registro sincronizado en el paso 8; la persistencia tras recarga y la ausencia de duplicados no se confirman concluyentemente.
- Problemas encontrados y cómo se resolvieron: La captura del manifest muestra dos advertencias sobre screenshots faltantes para la UI de instalación enriquecida. Los nombres de las diez capturas no coinciden exactamente con los nombres esperados; no se renombraron.
- Qué no se probó (otros navegadores, dispositivo móvil físico, etc.): Confirmación de que el paso 7 fue después de recargar offline, sincronización vinculada al mismo registro del paso 5, ausencia concluyente de duplicados mediante comparación API antes/después, pruebas opcionales A–E, otros navegadores y dispositivos físicos.

## Limitaciones

- La evidencia manual es parcial y no sustituye pruebas en otros navegadores ni en un dispositivo móvil físico.
- El servidor es en memoria: al reiniciarlo se pierden los registros del paso 9.
- Si se realiza la prueba E, anotar el cambio temporal de `public/sw.js` y restaurar manualmente el valor original de la versión de caché (`v3`) al terminar.
