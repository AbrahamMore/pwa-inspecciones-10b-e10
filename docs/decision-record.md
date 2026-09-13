# ADR-001 — Decisión sobre la estrategia de aplicación

## Estado

Propuesta y aceptada por el equipo — corrección aplicada el 13 de septiembre de 2026 para alinear con el proyecto oficial (inspecciones y mantenimiento de laboratorios UTT).

## Contexto y restricciones

El proyecto registra inspecciones y mantenimiento de laboratorios de la UTT (Usuarios y Escenarios, sección 2 de `requirements.md`), realizadas por técnicos dentro de las instalaciones, donde la conectividad puede ser intermitente (Escenario 2). El proyecto usa exclusivamente datos sintéticos (sección 5 de `requirements.md`) y dispositivos móviles/tablet en campo. El curso fija Next.js como stack base, por lo que la decisión se evalúa dentro de ese margen, no como elección libre de tecnología.

## Alternativas consideradas

| Criterio | PWA | Web tradicional | App nativa | Multiplataforma |
|---|---|---|---|---|
| Instalación | Instalable desde el navegador, sin tienda de apps | No instalable, solo acceso por URL | Requiere tienda de apps (Play Store/App Store) | Requiere tienda de apps |
| Offline | Soporta guardado local y sincronización posterior | No funciona sin conexión | Soporta offline de forma nativa | Soporta offline, con configuración adicional |
| Distribución | Un solo enlace/instalación, multiplataforma | Un solo enlace, sin instalación | Publicación separada por tienda, con revisión | Un solo código, build separado por plataforma |
| Costo de desarrollo | Bajo, un solo código base (Next.js) | Bajo | Alto, código separado por plataforma | Medio, un código base con capas nativas |
| Mantenimiento | Bajo, un solo proyecto | Bajo | Alto, dos proyectos independientes | Medio |
| Acceso al dispositivo | Limitado (cámara, almacenamiento local, notificaciones básicas) | Muy limitado | Completo | Amplio, mediante plugins |
| Riesgos | Limitaciones de acceso a hardware avanzado | Inutilizable sin conexión, riesgo directo para el caso de uso | Sobrecostoso para el alcance del curso | Complejidad de configuración para un equipo de 3 en un cuatrimestre |

La operación offline requiere diseñar almacenamiento local y lógica de sincronización; esta capacidad no aparece automáticamente por usar Next.js, debe construirse explícitamente como parte del producto (ver RF-04, `requirements.md`).

## Decisión

Se mantiene la estrategia PWA fijada para el curso. Es la opción que mejor responde a las restricciones del proyecto de inspecciones de laboratorio: instalación sin fricción para el personal técnico, capacidad de funcionar (con trabajo adicional) sin conexión dentro de zonas del plantel con señal inestable, y continuidad con el starter Next.js ya provisto. Si en el futuro el proyecto requiriera acceso profundo y constante a hardware del dispositivo (por ejemplo, escaneo de códigos QR de equipo con cámara en segundo plano), una app nativa sería preferible; por ahora esa necesidad no está identificada en los escenarios definidos. Se conserva el stack Next.js para esta entrega.

## Consecuencias y riesgos

Conservar los registros de inspección en el dispositivo permite continuidad del trabajo sin conexión, pero exige diseñar más adelante el manejo de conflictos al reconectar (por ejemplo, si dos técnicos registran hallazgos del mismo laboratorio el mismo día). Elegir PWA reduce el costo de mantenimiento frente a una app nativa, a cambio de aceptar límites de acceso a funciones avanzadas del dispositivo que, por ahora, el proyecto no necesita.

## Validación

En una semana posterior se probará, con un dispositivo real en modo avión, que un registro de inspección creado sin conexión (RF-04) se guarda localmente y se sincroniza correctamente al recuperar señal. Hasta ese momento, no se afirma que la sincronización offline ya esté validada ni implementada.b