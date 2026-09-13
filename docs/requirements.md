# Requisitos del producto — documento del equipo

- Grupo y equipo: "B" - Equipo 10
- Repositorio del equipo: https://github.com/AbrahamMore/pwa-inspecciones-10b-e10

## 1. Problema y contexto

El personal técnico de la Universidad Tecnológica de Tehuacán realiza inspecciones periódicas de mantenimiento en los laboratorios (por ejemplo, Laboratorio de Redes, Laboratorio de Electrónica y Laboratorio de Software), registrando el estado del equipo y los hallazgos encontrados. Muchos laboratorios se ubican en zonas del plantel con conectividad inestable, lo que provoca que el registro se retrase, se pierda o se tenga que capturar dos veces al recuperar señal. El proyecto busca resolver el registro de inspecciones y mantenimiento directamente en el lugar, incluso sin conexión estable. Queda fuera del alcance de esta semana: autenticación de usuarios, notificaciones push y sincronización real entre dispositivos.

## 2. Usuarios y escenarios

**Usuarios:** Técnico de mantenimiento (realiza la inspección y registra hallazgos en el laboratorio) y Coordinador de laboratorios (revisa y da seguimiento a los hallazgos reportados).

**Escenario 1 (con conexión):** Antes de iniciar su ronda, el técnico abre la app desde una zona con conexión y consulta la lista de laboratorios pendientes de inspección; la lista carga correctamente.

**Escenario 2 (conectividad intermitente):** Ya dentro del Laboratorio de Redes, sin señal, el técnico registra un hallazgo (por ejemplo, un equipo dañado) con fecha y descripción; espera que el registro se conserve en el dispositivo para sincronizarlo después, aunque no haya conexión en ese momento. Es una capacidad futura (RF-04), no una función exigida en Semana 1.

## 3. Requisitos funcionales

| ID | Acción del producto | Condición observable de aceptación | Ahora o futuro |
|---|---|---|---|
| RF-01 | Mostrar los registros sintéticos del starter (las tres inspecciones de laboratorio proporcionadas) | Al abrir la página se ven las tres inspecciones sintéticas (Redes, Electrónica, Software) | Semana 1 |
| RF-02 | Registrar una inspección con laboratorio, fecha y hallazgo | Al guardar datos válidos aparece un registro con esos mismos valores | Futuro |
| RF-03 | Consultar la lista de laboratorios pendientes de inspección | Con conexión, la lista se carga y coincide con la fuente del coordinador | Futuro |
| RF-04 | Guardar localmente los registros hechos sin conexión y sincronizarlos al recuperar señal | Un registro creado offline aparece sincronizado al recuperar conexión | Futuro |
| RF-05 | Consolidar el reporte de inspecciones y hallazgos para el coordinador | El reporte muestra todos los registros del laboratorio seleccionado | Futuro |

## 4. Requisitos no funcionales

- **Reproducibilidad (ahora):** En una copia limpia, con las versiones declaradas de Node y npm, `npm ci` y `npm run verify` terminan con código 0. Se comprueba cada vez que alguien nuevo configura su entorno.
- **Accesibilidad (ahora):** Los formularios de registro son usables con teclado y con etiquetas legibles por lector de pantalla. Se comprueba con revisión manual antes de cada entrega.
- **Seguridad (ahora):** Ningún dato sensible ni credenciales se suben al repositorio (`.env`, secretos). Se comprueba con revisión antes de cada push.
- **Privacidad (ahora):** Solo se usan datos sintéticos de laboratorios e inspecciones, nunca datos reales de la UTT. Se comprueba revisando el set de datos usado en pruebas.
- **Rendimiento (meta futura, ilustrativa):** Con 100 registros sintéticos en el dispositivo de prueba declarado, el listado de inspecciones aparece en menos de 2 segundos; se medirá en cinco ejecuciones bajo la conexión definida. Esta cifra es ilustrativa, no un umbral impuesto ni un resultado ya medido.
- **Operación offline (futuro):** La app debe poder guardar datos localmente sin conexión, con sincronización automática al recuperar señal. Se documenta ahora (RF-04); se validará en la semana correspondiente con un dispositivo real en modo avión.

## 5. Datos sintéticos y límites

Los campos ficticios que usa el proyecto son: nombre de laboratorio (ej. "Laboratorio de Redes"), fecha de inspección, hallazgo o descripción del estado del equipo. Se excluye cualquier dato real de instalaciones, equipos o personal de la UTT, así como credenciales o información institucional real. La identificación académica de los integrantes se registra únicamente en el repositorio privado y en Classroom.

## 6. Criterios de aceptación de la Semana 1

- Starter ejecutable: se comprueba con `npm test` (prueba proporcionada) y `npm run build` (build exitoso).
- Requisitos verificables: se comprueba con revisión de este documento (`docs/requirements.md`).
- Comparación de alternativas justificada: se comprueba con revisión de `docs/decision-record.md`.
- `npm run verify` confirma que los archivos y estructura están completos y que build/prueba pasan, pero no evalúa la calidad del análisis — eso se revisa leyendo el contenido de los documentos.