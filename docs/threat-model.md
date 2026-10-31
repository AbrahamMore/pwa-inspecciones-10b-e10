# Modelo de amenazas — Semana 9

Este modelo describe los controles que se pueden localizar en el repositorio en la rama de documentación de Semana 9. Las pruebas utilizan datos sintéticos. Que una prueba pase demuestra el comportamiento cubierto por esa prueba; no demuestra que la aplicación sea segura frente a todos los ataques ni convierte la identidad de demostración en autenticación real.

## 1. Alcance y supuestos

Se revisan la captura de inspecciones, su cola offline en el navegador, el service worker, las rutas `/api/inspecciones` y el almacén temporal en memoria. Los datos del registro pueden incluir laboratorio, fecha, responsable, resumen, hallazgos, fotografía y ubicación aproximada.

El cliente y sus peticiones se consideran no confiables: un usuario puede modificar JavaScript, saltarse el formulario y enviar HTTP directamente. Por eso la API vuelve a validar los datos y realiza las decisiones de acceso en el servidor.

La identidad no es real. `obtenerActor()` obtiene un identificador y un rol de las cabeceras `x-demo-actor`, `x-demo-rol` y, para supervisores, `x-demo-alcance`. Como el cliente puede enviar o falsificar esas cabeceras, este mecanismo sirve para demostrar la política de autorización con datos sintéticos, no para proteger registros reales.

Quedan fuera de este modelo la autenticación y las sesiones reales, el rate limiting, una base de datos durable, la operación de una infraestructura de producción y una evaluación legal. El middleware configura cabeceras de seguridad; el repositorio no demuestra por sí solo un despliegue HTTPS.

## 2. Activos y fronteras de confianza

| Activo | Ubicación | Motivo de protección |
|---|---|---|
| Laboratorio, fecha, responsable, resumen y hallazgos | Cola del navegador y almacén del servidor | Describen inspecciones y pueden incluir información sensible si se reemplazan los datos sintéticos. |
| Fotografía | Campo opcional de la cola y del registro del servidor | Puede aportar evidencia visual y revelar más información que el texto. |
| Ubicación | Campo opcional `geo` de la cola y del registro | Las coordenadas se redondean antes de guardarse; aun así indican una ubicación aproximada. |
| Identificador `clientId` y propietario `ownerId` | `clientId` en cliente y servidor; `ownerId` en el almacén del servidor | El primero identifica reintentos; el segundo participa en la autorización. |
| Identidad de demostración | Cabeceras de cada petición | Selecciona el actor que usa la política de acceso, pero no prueba quién envía la petición. |
| Cola de sincronización y su estado | `localStorage` del perfil del navegador | Conserva registros, fotos, ubicación y estados de sincronización. |
| Service worker y Cache Storage | Perfil del navegador | Mantienen recursos y páginas disponibles sin conexión. |
| Rutas API y almacén temporal | Proceso servidor | Validan solicitudes y aplican la política antes de responder o guardar datos. |

```text
Perfil del navegador (no confiable)      Frontera HTTP       Proceso servidor
┌──────────────────────────────────┐                         ┌──────────────────────────┐
│ Interfaz y permisos del navegador│                         │ Middleware: CSP/headers │
│ localStorage: cola de inspección │ ─── peticiones API ───▶ │ API: actor, permiso,     │
│ Cache Storage: páginas/recursos  │                         │ validación y almacén     │
└──────────────────────────────────┘                         └──────────────────────────┘
```

La autorización se comprueba en las rutas del servidor, no solamente ocultando controles de la interfaz. Sin embargo, la política solo puede distinguir los actores simulados que recibe en las cabeceras; no autentica a la persona que las envió.

## 3. Preguntas del análisis

1. **¿Qué protegemos?** Registros de inspección, fotografías, ubicación aproximada, cola local e integridad de los registros.
2. **¿Quién interactúa?** Un actor con rol de inspector o supervisor de demostración, un visitante sin identidad válida y cualquier cliente capaz de enviar peticiones directas.
3. **¿Qué podría pasar?** Lectura o sobrescritura de registros ajenos, entrada manipulada, ejecución de contenido no deseado, exposición innecesaria y persistencia de datos en un dispositivo compartido.
4. **¿Cómo reducimos el riesgo?** Validación y autorización del lado servidor, respuesta mínima en los listados, CSP y cabeceras, permisos iniciados por el usuario y borrado explícito de la cola local.
5. **¿Cómo comprobamos los controles?** Con las aserciones de `tests/security.spec.ts`, los escenarios de navegador en `tests/e2e/seguridad.spec.ts` y las pruebas de comportamiento del service worker en `tests/integration/pwa-integration.spec.ts`. Cada prueba cubre un alcance limitado, descrito en la tabla siguiente.

## 4. Amenazas, controles y pruebas

Impacto y probabilidad son valoraciones cualitativas para esta aplicación de demostración, no mediciones ni resultados de una evaluación externa. La prioridad considera la exposición de datos y la dependencia que los demás controles tienen de la identidad.

| ID | Amenaza y activo | Actor e impacto | Probabilidad | Control y ubicación | Evidencia existente | Estado |
|---|---|---|---|---|---|---|
| **T1** | Un inspector consulta el identificador de un registro ajeno (IDOR). Afecta registros y fotografías. | Actor que solicita un registro que no le corresponde. Impacto alto: divulgación de datos. | Alta si se usan datos reales, dado que la identidad es falsificable. | `puede()` y `filtrarVisibles()` en `src/lib/security/authz.ts`; filtros en `src/app/api/inspecciones/route.ts` y comprobación de detalle en `src/app/api/inspecciones/[id]/route.ts`. El detalle ajeno responde 404 igual que uno inexistente. | `tests/security.spec.ts`, bloque C: listado filtrado, detalle ajeno e inexistente indistinguibles; también prueba los alcances de supervisores. | **Parcialmente mitigada**: la regla de acceso se aplica y se prueba, pero se basa en cabeceras no autenticadas. |
| **T2** | Un actor reenvía el `clientId` de otra persona para sustituir su registro. Afecta la integridad del registro. | Cliente que intenta reutilizar un identificador ajeno. Impacto alto: modificación no autorizada. | Media con identidades distintas; la suplantación descrita en T12 puede anular esa separación. | `recibir()` compara `ownerId` en `src/lib/server/inspections-store.ts`; la API pasa el actor obtenido de la petición. | `tests/security.spec.ts`, bloque D: el reenvío de otro actor devuelve 403 y el registro original permanece intacto. | **Parcialmente mitigada**: funciona cuando los actores son distintos, pero `ownerId` depende de una identidad falsificable. |
| **T3** | Una petición sin identidad válida intenta listar, crear o consultar registros. Afecta todos los datos de la API. | Visitante o cliente directo. Impacto alto si el acceso no se deniega. | Alta como intento; el control responde a cabeceras ausentes o inválidas. | `obtenerActor()` produce el rol visitante en `src/lib/security/actor.ts`; las rutas API rechazan visitantes con 401. | `tests/security.spec.ts`, bloque A: cabeceras ausentes o inválidas y respuestas 401. | **Parcialmente mitigada**: se rechaza la petición sin cabeceras válidas, pero un cliente puede falsificar las cabeceras válidas. |
| **T4** | Un cliente manipula campos, coordenadas, foto, `clientId`, JSON o tamaño del cuerpo. Afecta integridad y disponibilidad. | Cualquier cliente que acceda a la API. Impacto medio. | Alta para entradas hostiles en una API accesible. | Lista blanca, saneamiento, límites de campos y validación de foto en `src/lib/security/validation.ts` y `src/lib/sync/validation.ts`. La API responde 400 para JSON mal formado, 413 para el límite de cuerpo y 422 para datos no válidos. | `tests/security.spec.ts`, bloque E: campos extra, foto SVG, IDs, coordenadas, longitudes, JSON y cuerpos grandes. | **Parcialmente mitigada**: los casos cubiertos se rechazan. Sin `Content-Length`, el cuerpo se lee completo antes de medirlo; además, el código compara `texto.length` (caracteres), no bytes codificados. |
| **T5** | Texto de hallazgos o contenido inyectado se interpreta como script. Afecta la sesión y los datos visibles. | Quien introduce texto o contenido malicioso. Impacto alto ante ejecución de script. | Media; el impacto depende de una ruta de renderizado vulnerable. | React escapa texto renderizado; `src/lib/security/headers.ts` construye la CSP con nonce y sin `'unsafe-inline'` en `script-src` de producción; el middleware la aplica a las rutas coincidentes. | `tests/security.spec.ts`, bloques G y H; `tests/e2e/seguridad.spec.ts`: prueba de script/manejador en línea bloqueado y recorrido de la app sin violaciones CSP. | **Parcialmente mitigada**: se prueban rutas concretas y patrones de código, no toda combinación de navegador, contenido y despliegue. |
| **T6** | El listado devuelve datos que no necesita mostrar, como la foto o el propietario. Afecta fotos e identificadores internos. | Actor autorizado para listar. Impacto medio. | Media. | `proyectarListado()` en `src/lib/server/inspections-access.ts` omite `photo` y `ownerId`; el detalle se limita mediante autorización. | `tests/security.spec.ts`, bloque F: listado sin foto ni propietario y detalle con foto para el actor autorizado. | **Mitigada en la respuesta de listado probada**; no significa que la foto se oculte del detalle autorizado. |
| **T7** | Una tableta compartida o extraviada conserva la cola local, incluidos registros ya sincronizados. Afecta nombres, hallazgos, fotos y ubicación guardados. | Persona con acceso al perfil del navegador. Impacto medio/alto si se usaran datos reales. | Media en dispositivos compartidos. | El botón de `src/components/borrar-datos-locales.tsx` confirma y llama a `borrarDatosLocales()`; `src/lib/security/local-data.ts` limpia la cola. | `tests/security.spec.ts`, bloque J, y `tests/e2e/seguridad.spec.ts`, caso “el usuario puede borrar los datos guardados en el dispositivo”. | **Parcialmente mitigada**: el usuario puede borrar la cola manualmente; no hay expiración, cifrado ni borrado automático. El botón no borra cachés ni datos del servidor. |
| **T8** | Una respuesta privada queda en Cache Storage y se muestra a otro usuario del mismo perfil. Afecta páginas y datos visibles offline. | Usuario posterior del navegador. Impacto medio. | Baja para las rutas API actuales, que se excluyen explícitamente; mayor si se añadieran datos privados a páginas cacheadas. | `public/sw.js` no intercepta métodos distintos de GET ni rutas `/api/`; las navegaciones y recursos GET del mismo origen sí pueden guardarse. | `tests/integration/pwa-integration.spec.ts`: simula la exclusión de GET/POST de API y escrituras, además del fallback offline. | **Parcialmente mitigada**: la API no se cachea por esta regla, pero otras navegaciones GET sí; la prueba ejecuta un entorno simulado y no acredita el comportamiento de cada ruta en producción. |
| **T9** | Un secreto o credencial se incorpora al repositorio. Afecta credenciales y cuentas asociadas. | Quien encuentre o use el secreto. Impacto alto. | No determinada por las pruebas disponibles. | No se encontró un escáner de secretos integrado en este checkout. La guía del equipo asigna `src/lib/security/secrets.ts` y `tests/unit/secrets.spec.ts` a Diana. | No existe `tests/unit/secrets.spec.ts` en esta rama. Las pruebas actuales no verifican ausencia de secretos. | **Pendiente de implementación o verificación**. No se afirma que el repositorio haya sido escaneado ni que esté libre de secretos. |
| **T10** | La aplicación solicita capacidades del dispositivo sin necesidad. Afecta privacidad y recursos del usuario. | La propia aplicación o un flujo que solicite permisos. Impacto medio. | Baja en los flujos comprobados. | `DevicePanel` solicita cámara, ubicación y notificaciones mediante acciones explícitas; cámara usa `audio: false`; la geolocalización realiza una lectura sin seguimiento; `Permissions-Policy` permite cámara/ubicación en el origen y deshabilita micrófono, pago y USB. | `tests/unit/capabilities.spec.ts` verifica permisos simulados, cámara sin audio, cierre de pistas y redondeo de coordenadas. `tests/security.spec.ts`, bloque G, comprueba parte de las cabeceras. | **Parcialmente mitigada**: el código limita las solicitudes; la prueba de capacidades usa dobles simulados, no permisos reales de cada navegador. |
| **T11** | Una página externa intenta enmarcar la aplicación o el navegador interpreta un tipo de contenido incorrecto. Afecta la interfaz y la confianza del navegador. | Sitio externo o contenido servido con un tipo incorrecto. Impacto bajo/medio. | Baja con las cabeceras configuradas. | CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY` y `X-Content-Type-Options: nosniff` en `src/lib/security/headers.ts` y `src/middleware.ts`. | `tests/security.spec.ts`, bloque G; `tests/e2e/seguridad.spec.ts`, caso “las respuestas llevan CSP con nonce y cabeceras de seguridad”. | **Mitigada en las respuestas y rutas cubiertas**; los recursos estáticos excluidos del matcher requieren consideración separada. |
| **T12** | Una persona falsifica `x-demo-actor`, `x-demo-rol` o `x-demo-alcance` para hacerse pasar por otro actor. Afecta todos los registros protegidos por la política. | Cualquier cliente con acceso a la API. Impacto alto. | Alta: las cabeceras proceden de la petición del cliente. | No existe un control de autenticación real. `src/lib/security/actor.ts` declara que el actor es de demostración y falsificable. | No hay prueba que demuestre resistencia a falsificación; las pruebas ejercitan la política con identidades sintéticas. | **No mitigada / riesgo aceptado únicamente para la demostración con datos sintéticos**. No es aceptable tratar este control como protección de datos reales. |

**Prioridad.** T1 y T2 afectan la confidencialidad e integridad de datos de otra persona, respectivamente. Sus controles se apoyan en la identidad que recibe el servidor; por eso T12 tiene prioridad crítica para cualquier uso real: al falsificar las cabeceras se puede invalidar la separación probada entre actores. Se priorizan estas amenazas por el tipo de impacto, no porque se haya medido su probabilidad en producción. La prioridad no cambia el hecho de que T12 queda sin mitigar.

## 5. Decisiones y compromisos

- **Actor aislado, pero simulado.** `obtenerActor()` centraliza la lectura de cabeceras, y `authz.ts` contiene la política por rol. Esto facilita probar reglas de acceso sin una infraestructura de sesiones; el costo es que cualquier cliente puede falsificar la identidad. El aislamiento del código no autentica al actor.
- **CSP con nonce.** `crearNonce()` produce un valor por respuesta y `construirCSP()` lo incluye en `script-src`. En producción esa directiva no habilita `'unsafe-inline'` ni `'unsafe-eval'`; el permiso de `'unsafe-eval'` se añade solo en desarrollo. Esto restringe scripts en línea, pero exige servir páginas con nonce por respuesta y mantener coherencia con la experiencia offline.
- **Sin `strict-dynamic`.** La política actual no incluye esa directiva; el comentario de `headers.ts` explica que se evita confiar indirectamente en scripts creados por código. No se afirma aquí que un fallo histórico concreto haya sido reproducido, porque el código actual y las pruebas no documentan por sí solos ese antecedente.
- **Estilos y recursos fuera del matcher.** En producción `style-src` no incluye `'unsafe-inline'`; en desarrollo sí. El middleware excluye, entre otros, `sw.js`, `offline.html`, iconos y recursos de Next. Por ello, no se debe generalizar que todas las respuestas estáticas reciben las mismas cabeceras.
- **`robots.txt` no autoriza.** `public/robots.txt` orienta a rastreadores que respetan la convención; no impide solicitudes. La protección real de la API se implementa en el servidor.
- **Respuestas HTTP diferenciadas.** La API usa 401 para actor no identificado, 403 para una operación no permitida, 404 para un registro inexistente o no visible, 400 para JSON mal formado, 413 para el límite del cuerpo y 422 para contenido que no pasa la validación. El 404 del detalle evita distinguir entre registro ajeno e inexistente para las solicitudes cubiertas por la prueba.

## 6. Endurecimiento integrado y antecedentes

El PR #22 integró cambios de seguridad en rutas API, política de acceso, validación, cabeceras, almacenamiento y pruebas. El código y las pruebas actuales permiten verificar esos controles, pero no demuestran que los problemas hubieran sido explotados ni describen por sí solos todos los defectos de una versión anterior. Por eso se documentan como **controles incorporados**, no como incidentes comprobados:

- La API filtra los registros por actor y el detalle oculta con 404 los registros no visibles.
- El almacén conserva `ownerId` y rechaza el reenvío de un `clientId` que pertenece a otro actor.
- La API normaliza los campos, limita longitudes y tipos de fotografía, y rechaza JSON inválido o excesivo según las comprobaciones implementadas.
- El listado omite la foto y el propietario interno.
- Se añadieron CSP y cabeceras de seguridad, además de una acción de borrado de la cola local.

Sigue pendiente resolver la identidad falsificable. También siguen siendo limitaciones el borrado manual de la cola, la ausencia de rate limiting y la falta de un escáner de secretos en esta rama.

## 7. Límites del modelo

- **No hay autenticación real.** Las cabeceras de demostración se pueden falsificar y debilitan T1, T2 y T3.
- **No hay rate limiting.** No se comprueba la resistencia a solicitudes repetidas o abuso de recursos.
- **El servidor usa memoria.** `src/lib/server/inspections-store.ts` no proporciona persistencia durable, recuperación ni un plazo formal de retención.
- **Las pruebas no cubren todos los entornos.** La CSP se prueba con el navegador configurado por Playwright y otras aserciones unitarias; no es una matriz exhaustiva de navegadores o despliegues.
- **Pruebas de fuente frágiles.** El bloque H busca ciertos patrones de XSS como texto en archivos de `src`; no demuestra ausencia de todas las vulnerabilidades.
- **Caché probada en simulación.** La prueba de integración ejecuta `sw.js` en un entorno simulado. El service worker excluye `/api/`, pero almacena recursos y navegaciones GET del mismo origen; no tiene TTL explícito.
- **Sin auditoría de accesos.** No se encontró un registro que documente quién consultó o modificó cada inspección.
- **No se demuestra la configuración de producción.** El repositorio configura middleware y declara Node 20 en README/CI, pero no demuestra HTTPS, controles de plataforma ni despliegue real.
- **Sin revisión legal.** Las referencias de privacidad son orientativas; este modelo no certifica cumplimiento normativo.
