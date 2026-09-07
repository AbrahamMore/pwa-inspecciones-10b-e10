# Evidencia individual del equipo

> Un solo archivo compartido. Repitan la sección siguiente por cada integrante; cada persona escribe y explica su propia evidencia. Se aceptan evidencias previas equivalentes. El SHA final se entrega en Classroom después del último commit, para evitar modificar el commit que se está identificando.

- Grupo y equipo: "B" - Equipo 10
- Repositorio del equipo: https://github.com/AbrahamMore/pwa-inspecciones-10b-e10.git

## Integrante: Abraham Moreno Vasquez

Mi contribución concreta y enlace a archivo, commit anterior o revisión: Creación y configuración inicial del repositorio, redacción completa de `docs/requirements.md` y `docs/decision-record.md`. Enlace: [pega aquí el link al commit donde subiste esos archivos]
- **Decisión que puedo explicar y por qué:** Elegí PWA como estrategia sobre app nativa o multiplataforma porque el caso de uso central de BitacoraLab (un coordinador registrando asistencia sin conexión en campo) se resuelve con una app instalable y con capacidad offline, sin el costo de desarrollo duplicado que exige una app nativa por plataforma.
- **Comando o prueba proporcionada que ejecuté:** `npm run verify`
- **Resultado real que observé:** `starter.spec.mjs: PASS`; build de Next.js 14.2.35 compilado exitosamente, generando 4/4 páginas estáticas sin errores; el comando terminó con "Verificación técnica: pass" y generó `reports/verification.json`.
- **Qué verifica esa prueba y qué no verifica:** Verifica que el proyecto instala correctamente sus dependencias, que la prueba proporcionada por el starter pasa, y que el build de Next.js compila sin errores. No verifica la calidad ni coherencia del análisis en `requirements.md` o `decision-record.md` — eso requiere revisión humana del contenido, no un resultado técnico automático.
- **Limitación, dificultad o riesgo que identifiqué:** El requisito RF-04 (guardado offline y sincronización) todavía no está implementado, solo documentado como meta futura; aún no se ha probado en un dispositivo real sin conexión.
- **Uso de IA:** Usé Claude para estructurar y redactar el contenido de `docs/requirements.md` y `docs/decision-record.md` a partir de las decisiones que yo tomé (definición del problema, nombre del proyecto BitacoraLab, escenario de conectividad intermitente, elección de PWA sobre las otras alternativas). Revisé el contenido generado antes de subirlo al repositorio.
##


## Integrante: Josmar Olivera Perez

 Grupo y equipo: "B" - Equipo 10
- Repositorio del equipo: https://github.com/AbrahamMore/pwa-inspecciones-10b-e10.git

Mi contribución concreta y enlace a archivo, commit anterior o revisión: Validación del funcionamiento del proyecto en mi entorno local. Verifiqué las versiones requeridas de Node.js y npm, instalé las dependencias con `npm ci`, ejecuté el proyecto con `npm run dev` y comprobé visualmente que la aplicación mostrara las tres inspecciones sintéticas. Posteriormente ejecuté `npm run verify` para comprobar la prueba proporcionada y la compilación del proyecto. Enlace: [pega aquí el link al commit donde subiste esta evidencia]

- **Decisión que puedo explicar y por qué:** Decidí validar primero que el starter pudiera instalarse, ejecutarse y pasar la verificación técnica en mi entorno antes de realizar cambios adicionales. Esto permite comprobar que la versión base del proyecto funciona correctamente y mantener separadas las verificaciones de la Semana 1 de las funcionalidades PWA que se implementarán posteriormente.

- **Comando o prueba proporcionada que ejecuté:** `node -v`, `npm -v`, `npm ci`, `npm run dev` y `npm run verify`.

- **Resultado real que observé:** Node.js `v20.20.2` y npm `10.8.2`, cumpliendo con las versiones requeridas. `npm ci` terminó correctamente con 28 paquetes agregados y 29 paquetes auditados. Al ejecutar `npm run dev`, la aplicación abrió correctamente en `http://localhost:3000` y mostró las tres inspecciones sintéticas: Laboratorio de Redes, Laboratorio de Electrónica y Laboratorio de Software. Finalmente, `npm run verify` terminó con `starter.spec.mjs: PASS`, el build de Next.js 14.2.35 compiló exitosamente y el resultado final fue `Verificación técnica: pass`, generando `reports/verification.json`.

- **Qué verifica esa prueba y qué no verifica:** La ejecución comprueba que las dependencias pudieron instalarse, que el proyecto puede ejecutarse localmente, que la prueba proporcionada por el starter pasa y que el build de Next.js se completa correctamente. No comprueba que la aplicación tenga implementadas las funcionalidades PWA futuras, como manifest, service worker, funcionamiento offline o sincronización, ni sustituye la revisión humana de la documentación y de los criterios académicos de la actividad.

- **Limitación, dificultad o riesgo que identifiqué:** La verificación técnica terminó correctamente, pero el proyecto todavía corresponde al alcance inicial de la Semana 1 y las funcionalidades PWA futuras no están implementadas. Además, `npm ci` mostró dos vulnerabilidades de severidad alta durante la auditoría de dependencias; no ejecuté `npm audit fix --force` para evitar modificar las dependencias del starter sin una decisión del equipo.

- **Uso de IA:** Usé ChatGPT y Codex como apoyo para analizar la estructura del proyecto, comprender los requisitos de la actividad y organizar la evidencia. La ejecución de los comandos y la comprobación del funcionamiento de la aplicación fueron realizadas y verificadas directamente en mi entorno local.

## Integrante: Diana Laura Olmos Antonio

Mi contribución concreta y enlace a archivo, commit anterior o revisión: Validé que el proyecto funciona en mi entorno local (Node.js y npm, instalación de dependencias, ejecución del servidor de desarrollo) y aclaré el requisito RF-05 en `docs/requirements.md`, especificando qué debe pasar si dos coordinadores registran el mismo evento (registros duplicados no se descartan automáticamente). Enlace al commit: https://github.com/AbrahamMore/pwa-inspecciones-10b-e10/commit/8439dab

- **Decisión que puedo explicar y por qué:** El RF-05 original no especificaba qué pasaba si el reporte recibía registros duplicados de un mismo evento (por ejemplo, si dos coordinadores lo registraban por separado en campo). Como el escenario 2 ya contempla conectividad intermitente y trabajo en campo, aclaré la condición de aceptación para que el reporte muestre todos los registros sin descartarlos automáticamente, evitando pérdida de información aunque haya duplicados.
- **Comando o prueba que ejecuté:** `node -v`, `npm -v`, `npm ci`, `npm run dev`.
- **Resultado real que observé:** Node.js `v20.20.2` y npm `10.8.2`, cumpliendo las versiones requeridas. `npm ci` instaló 29 paquetes correctamente (2 vulnerabilidades de severidad alta reportadas en la auditoría, no resueltas para no modificar dependencias del starter sin decisión del equipo). `npm run dev` levantó el proyecto en `http://localhost:3000` con Next.js 14.2.35 en 2.8s, y confirmé visualmente las 3 inspecciones sintéticas: Laboratorio de Redes, Laboratorio de Electrónica y Laboratorio de Software.
- **Qué verifica esa prueba y qué no verifica:** Verifica que el proyecto puede instalarse y ejecutarse en un entorno distinto al de Abraham, confirmando que el starter es reproducible. No verifica la implementación de funcionalidades PWA futuras (offline, sincronización, manifest), ni sustituye una revisión técnica automatizada como `npm run verify`.
- **Limitación, dificultad o riesgo que identifiqué:** El ajuste al RF-05 aclara el criterio de aceptación, pero la lógica para manejar registros duplicados aún no está implementada ni probada; queda documentada como parte del alcance de la Semana 9.
- **Uso de IA:** Usé Claude como apoyo para entender los pasos de la actividad, organizar mi evidencia en el formato correcto y redactar la propuesta de aclaración del RF-05 a partir de la idea que yo identifiqué (el caso de registros duplicados cuando dos coordinadores registran el mismo evento). Verifiqué yo misma que el proyecto corriera en mi máquina, ejecuté y confirmé los comandos y resultados descritos arriba, y revisé el cambio en `requirements.md` antes de hacer commit y push.