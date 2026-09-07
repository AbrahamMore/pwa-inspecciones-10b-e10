# Requisitos del producto — documento del equipo

## 1. Problema y contexto

Los coordinadores de brigadas comunitarias, de salud o eventos institucionales necesitan registrar la asistencia de participantes y evidencia del lugar (notas, fotos) durante el evento. Sin embargo, muchos de estos sitios no cuentan con conexión estable, lo que provoca que el registro se haga en papel, se pierda información o se tenga que capturar dos veces al regresar a la oficina. BitacoraLab busca resolver el registro de asistencia y evidencia directamente en campo, funcionando incluso sin conexión. Queda fuera del alcance de esta semana: autenticación de usuarios, notificaciones push y sincronización real entre dispositivos.

## 2. Usuarios y escenarios

**Usuarios:** Coordinador de brigada/evento (registra asistencia y evidencias en campo) y Administrador (revisa y consolida reportes después del evento).

**Escenario 1 (con conexión):** Antes de salir al evento, el coordinador abre la app desde la oficina con conexión disponible; consulta la lista de asistentes esperados, la cual carga correctamente.

**Escenario 2 (conectividad intermitente):** Ya en el lugar del evento, sin señal, el coordinador registra la asistencia de un participante y agrega una nota de evidencia; espera que el registro quede conservado en el dispositivo para conservarlo, aunque no exista conexión en ese momento. Es una capacidad futura (RF-04), no una función exigida en Semana 1.

## 3. Requisitos funcionales

| ID | Acción del producto | Condición observable de aceptación | Ahora o futuro |
|---|---|---|---|
| RF-01 | Registrar asistencia de un participante (nombre, hora, estado) | Al guardar un registro válido, aparece en la lista de asistencia del evento activo | Semana 4 |
| RF-02 | Guardar evidencia asociada a un evento (nota y/o foto) | La evidencia queda ligada al evento y visible al consultarlo | Semana 5 |
| RF-03 | Consultar la lista de asistentes esperados antes de salir al evento | Con conexión, la lista se carga y coincide con la fuente del coordinador | Semana 6 |
| RF-04 | Guardar localmente registros sin conexión y sincronizarlos al recuperar señal | Un registro creado offline aparece sincronizado al recuperar conexión | Futuro |
| RF-05 | Consolidar el reporte de asistencia y evidencias de un evento | El reporte muestra todos los registros del evento seleccionado, incluyendo registros duplicados si dos coordinadores registraron el mismo evento (no se descartan automáticamente) | Semana 9 |

## 4. Requisitos no funcionales

- **Reproducibilidad (ahora):** En una copia limpia, con las versiones declaradas de Node y npm, `npm ci` y `npm run verify` terminan con código 0. Se comprueba cada vez que alguien nuevo configura su entorno.
- **Accesibilidad (ahora):** Los formularios de registro son usables con teclado y tienen etiquetas legibles por lector de pantalla. Se comprueba con revisión manual antes de cada entrega.
- **Seguridad (ahora):** Ningún dato sensible ni credenciales se suben al repositorio (`.env`, secretos). Se comprueba con revisión antes de cada push.
- **Privacidad (ahora):** Solo se usan datos sintéticos de participantes, nunca datos reales de personas. Se comprueba revisando el set de datos usado en pruebas.
- **Rendimiento (meta futura, ilustrativa):** Con 100 registros sintéticos en el dispositivo de prueba declarado, el listado de asistencia aparece en menos de 2 segundos; se medirá en cinco ejecuciones bajo la conexión definida. Esta cifra es ilustrativa, no un umbral impuesto ni un resultado ya medido.
- **Operación offline (futuro):** La app debe poder guardar datos localmente sin conexión, con sincronización automática al recuperar señal. Se documenta ahora (RF-04); se validará en la semana correspondiente con un dispositivo real en modo avión.

## 5. Datos sintéticos y límites

Los campos ficticios que usará BitacoraLab son: nombre de participante (inventado), hora de registro, estado de asistencia, y nombre de evento de ejemplo (ej. "Brigada de salud comunitaria - Zona Norte"). Se excluye cualquier dato real de participantes, ubicaciones exactas reales, fotos reales de personas o credenciales. La identificación académica de los integrantes se registra únicamente en el repositorio privado y en Classroom.

## 6. Criterios de aceptación 

- Starter ejecutable: se comprueba con `npm test` (prueba proporcionada) y `npm run build` (build exitoso).
- Requisitos verificables: se comprueba con revisión de este documento (`docs/requirements.md`).
- Comparación de alternativas justificada: se comprueba con revisión de `docs/decision-record.md`.
- `npm run verify` confirma que los archivos y estructura están completos y que build/prueba pasan, pero no evalúa la calidad del análisis — eso se revisa leyendo el contenido de los documentos.