# Evidencia individual del equipo

> Un solo archivo compartido. Repitan la sección siguiente por cada integrante; cada persona escribe y explica su propia evidencia. Se aceptan evidencias previas equivalentes. El SHA final se entrega en Classroom después del último commit, para evitar modificar el commit que se está identificando.

- Grupo y equipo: "B" - Equipo 10
- Repositorio del equipo: https://github.com/AbrahamMore/pwa-inspecciones-10b-e10.git

## Integrante: Abraham Moreno Vasquez

Mi contribución concreta y enlace a archivo, commit anterior o revisión: Creación y configuración inicial del repositorio, redacción completa de `docs/requirements.md` y `docs/decision-record.md`. Enlace: [pega aquí el link al commit donde subiste esos archivos]
- **Decisión que puedo explicar y por qué:** Elegí PWA como estrategia sobre app nativa o multiplataforma porque el caso de uso central del proyecto (un técnico registrando hallazgos de inspección sin conexión dentro de un laboratorio) se resuelve con una app instalable y con capacidad offline, sin el costo de desarrollo duplicado que exige una app nativa por plataforma.
- **Comando o prueba proporcionada que ejecuté:** `npm run verify`
- **Resultado real que observé:** `starter.spec.mjs: PASS`; build de Next.js 14.2.35 compilado exitosamente, generando 4/4 páginas estáticas sin errores; el comando terminó con "Verificación técnica: pass" y generó `reports/verification.json`.
- **Qué verifica esa prueba y qué no verifica:** Verifica que el proyecto instala correctamente sus dependencias, que la prueba proporcionada por el starter pasa, y que el build de Next.js compila sin errores. No verifica la calidad ni coherencia del análisis en `requirements.md` o `decision-record.md` — eso requiere revisión humana del contenido, no un resultado técnico automático.
- **Limitación, dificultad o riesgo que identifiqué:** El requisito RF-04 (guardado offline y sincronización) todavía no está implementado, solo documentado como meta futura; aún no se ha probado en un dispositivo real sin conexión.
- **Uso de IA:** Usé Claude para estructurar y redactar el contenido de `docs/requirements.md` y `docs/decision-record.md` a partir de las decisiones que yo tomé (definición del problema de inspecciones y mantenimiento de laboratorios UTT, escenario de conectividad intermitente, elección de PWA sobre las otras alternativas). Revisé el contenido generado antes de subirlo al repositorio.
#### 
### Semana 2

Mi contribución concreta y enlace a archivo, commit anterior o revisión: Construcción del shell instalable de la aplicación: creé `public/manifest.webmanifest`, actualicé `src/app/layout.tsx` para enlazarlo, extraje `src/components/app-shell.tsx` como componente de navegación reutilizable, y reescribí `src/app/page.tsx` para manejar estados de carga, error y vacío en vez de mostrar los datos directo. También corregí una advertencia de build moviendo `themeColor` del export `metadata` al export `viewport`, como lo requiere Next.js 14. Enlace: [pega aquí el link a tu commit]

- **Decisión que puedo explicar y por qué:** Separé la navegación fija (`app-shell.tsx`) del contenido de la pantalla (`page.tsx`) en vez de dejar todo junto como en la Semana 1. Esto permite reutilizar el shell en futuras pantallas del proyecto sin duplicar el header y footer, y aísla la lógica de estados (carga/error/vacío) en el componente que realmente cambia semana a semana.
- **Comando o prueba proporcionada que ejecuté:** `npm ci`, `npm run dev`, `npm run verify`.
- **Resultado real que observé:** `npm ci` instaló correctamente (2 vulnerabilidades reportadas en la auditoría, no resueltas para no modificar dependencias sin decisión del equipo). `npm run verify` terminó con `starter.spec.mjs: PASS`, `manifest.spec.ts: PASS`, build de Next.js compilado exitosamente sin advertencias de `themeColor`, y `Verificación técnica: pass`.
- **Qué verifica esa prueba y qué no verifica:** Verifica que el shell compila, que el manifest tiene los campos mínimos y que las pruebas proporcionadas y agregadas por el equipo pasan. No verifica que la app sea instalable de verdad en un dispositivo real, ni que los íconos referenciados en el manifest existan como archivos físicos todavía.
- **Limitación, dificultad o riesgo que identifiqué:** Los íconos (`/icons/icon-192.png`, etc.) están referenciados en el manifest pero aún no existen como archivos PNG reales; el manifest es válido como documento, pero el navegador no podrá mostrar el ícono de instalación hasta agregarlos. El estado de "error" en `page.tsx` está implementado pero no se puede disparar todavía, porque los datos son locales y no dependen de una fuente que pueda fallar.
- **Uso de IA:** Usé Claude para estructurar `app-shell.tsx`, `page.tsx` (con los tres estados) y el manifest, y para explicarme la corrección del warning de `themeColor`. Revisé y ejecuté yo mismo cada comando antes de subir los cambios.


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

### Semana 2
Mi contribución concreta y enlace a archivo, commit anterior o revisión: Actualicé `README.md`, extendiendo el contenido de la Semana 1 (sin borrarlo) para documentar el avance de la Semana 2: mención del nuevo test `tests/manifest.spec.ts`, la carpeta `src/components/` con el shell instalable, el archivo `public/manifest.webmanifest`, y la aclaración de que offline y sincronización siguen pendientes para semanas posteriores. Enlace: [pega aquí el link a tu commit]

- **Decisión que puedo explicar y por qué:** Decidí extender el README en vez de reemplazarlo, porque el proyecto es acumulativo (un solo repositorio durante todo el cuatrimestre); borrar la documentación de la Semana 1 para dejar solo la Semana 2 habría ocultado avance real del equipo ya evaluado.
- **Comando o prueba proporcionada que ejecuté:** `npm ci`, `npm run dev`, para confirmar que las instrucciones del README siguen siendo correctas tras los cambios del shell.
- **Resultado real que observé:** El proyecto instaló y corrió sin errores en mi entorno, confirmando que las instrucciones de instalación y ejecución documentadas en el README siguen siendo válidas después de los cambios de esta semana.
- **Qué verifica esa prueba y qué no verifica:** Confirma que las instrucciones del README (instalación, ejecución) siguen funcionando en un entorno distinto. No verifica automáticamente que el contenido del README esté completo o bien redactado — eso requiere revisión humana del texto.
- **Limitación, dificultad o riesgo que identifiqué:** El README documenta el estado actual del proyecto, pero deberá actualizarse de nuevo en cada semana futura conforme se agreguen funcionalidades (offline, sincronización); si el equipo olvida extenderlo, quedaría desactualizado frente al código real.
- **Uso de IA:** Usé Claude para redactar la actualización del README a partir de los cambios reales que el equipo hizo esta semana (manifest, app-shell, estados de carga/error/vacío). Revisé el contenido y confirmé que las instrucciones siguen funcionando antes de hacer commit y push.



## Integrante: Diana Laura Olmos Antonio
### Semana 1

Mi contribución concreta y enlace a archivo, commit anterior o revisión: Validé que el proyecto funciona en mi entorno local (Node.js y npm, instalación de dependencias, ejecución del servidor de desarrollo) y aclaré el requisito de consolidación de reportes en `docs/requirements.md`, especificando qué debe pasar si dos técnicos registran hallazgos del mismo laboratorio (registros duplicados no se descartan automáticamente). Enlace al commit: https://github.com/AbrahamMore/pwa-inspecciones-10b-e10/commit/8439dab

- **Decisión que puedo explicar y por qué:** El requisito de reporte consolidado no especificaba qué pasaba si se recibían registros duplicados de un mismo laboratorio (por ejemplo, si dos técnicos lo inspeccionaban por separado el mismo día). Como el escenario 2 ya contempla conectividad intermitente y trabajo en campo, aclaré la condición de aceptación para que el reporte muestre todos los registros sin descartarlos automáticamente, evitando pérdida de información aunque haya duplicados.
- **Comando o prueba que ejecuté:** `node -v`, `npm -v`, `npm ci`, `npm run dev`.
- **Resultado real que observé:** Node.js `v20.20.2` y npm `10.8.2`, cumpliendo las versiones requeridas. `npm ci` instaló 29 paquetes correctamente (2 vulnerabilidades de severidad alta reportadas en la auditoría, no resueltas para no modificar dependencias del starter sin decisión del equipo). `npm run dev` levantó el proyecto en `http://localhost:3000` con Next.js 14.2.35 en 2.8s, y confirmé visualmente las 3 inspecciones sintéticas: Laboratorio de Redes, Laboratorio de Electrónica y Laboratorio de Software.
- **Qué verifica esa prueba y qué no verifica:** Verifica que el proyecto puede instalarse y ejecutarse en un entorno distinto al de Abraham, confirmando que el starter es reproducible. No verifica la implementación de funcionalidades PWA futuras (offline, sincronización, manifest), ni sustituye una revisión técnica automatizada como `npm run verify`.
- **Limitación, dificultad o riesgo que identifiqué:** El ajuste al requisito aclara el criterio de aceptación, pero la lógica para manejar registros duplicados aún no está implementada ni probada; queda documentada como parte del alcance de una semana posterior.
- **Uso de IA:** Usé Claude como apoyo para entender los pasos de la actividad, organizar mi evidencia en el formato correcto y redactar la propuesta de aclaración del requisito a partir de la idea que yo identifiqué (el caso de registros duplicados cuando dos técnicos registran el mismo laboratorio). Verifiqué yo misma que el proyecto corriera en mi máquina, ejecuté y confirmé los comandos y resultados descritos arriba, y revisé el cambio en `requirements.md` antes de hacer commit y push.

### Semana 2

Mi contribución concreta y enlace a archivo, commit anterior o revisión: Corregí el nombre del archivo `manifest.webmanifest` (tenía un error de doble punto tras el pull), creé `tests/manifest.spec.ts` con la prueba proporcionada, instalé `tsx` como dependencia de desarrollo y actualicé el script `test` en `package.json` para ejecutarlo. También diagnostiqué y corregí dos fallos técnicos que bloqueaban la verificación: un error de "top-level await" (agregando `"type": "module"` en `package.json`) y una prueba desactualizada en `tests/starter.spec.mjs` que buscaba un texto solo en `page.tsx` cuando el shell de Abraham lo había movido a `app-shell.tsx`. Enlace al commit: https://github.com/AbrahamMore/pwa-inspecciones-10b-e10/commit/d806c23

- **Decisión que puedo explicar y por qué:** Al agregar `manifest.spec.ts`, la ejecución fallaba con `ERR_REQUIRE_ASYNC_MODULE` porque el archivo usa `await` a nivel superior y Node interpretaba el proyecto como CommonJS por defecto. Decidí agregar `"type": "module"` en `package.json` en vez de reescribir la prueba sin top-level await, porque es la solución estándar para este caso y no altera la lógica de la prueba proporcionada por el profesor.
- **Comando o prueba que ejecuté:** `npm install --save-dev tsx`, `npx tsx tests/manifest.spec.ts`, `npm run verify`.
- **Resultado real que observé:** `npx tsx tests/manifest.spec.ts` terminó con `manifest.spec.ts: PASS`. Al correr `npm run verify` completo, obtuve `starter.spec.mjs: PASS`, `manifest.spec.ts: PASS`, build de Next.js 14.2.35 compilado exitosamente (con advertencias no bloqueantes sobre `themeColor`), y el resultado final `Verificación técnica: pass`.
- **Qué verifica esa prueba y qué no verifica:** `manifest.spec.ts` verifica que el manifest declare los campos mínimos (`name`, `short_name`, `start_url`, `display: standalone`) y que existan íconos de 192x192 y 512x512, además de que `layout.tsx` lo referencie. No verifica que el manifest funcione realmente como instalación PWA en un dispositivo real, ni que los íconos existan físicamente como archivos válidos.
- **Limitación, dificultad o riesgo que identifiqué:** Corregí el bug de `starter.spec.mjs` para que buscara el texto también en `app-shell.tsx`, pero no verifiqué con Abraham antes de modificar su archivo de prueba por falta de tiempo; se lo notifiqué después del cambio. Aún no se ha probado la instalación real del manifest en un dispositivo móvil.
- **Uso de IA:** Usé Claude para diagnosticar los dos errores técnicos (top-level await y la prueba desactualizada), entender sus causas y decidir la solución más adecuada en cada caso. Ejecuté y verifiqué yo misma cada comando y resultado antes de aplicar los cambios y hacer commit.