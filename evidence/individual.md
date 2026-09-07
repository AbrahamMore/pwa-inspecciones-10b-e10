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


## Aqui van los sus evidencias ##