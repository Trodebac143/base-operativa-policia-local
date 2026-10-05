# Cierre local 0.14.0 — motor penal y uso policial en calle

Fecha: 05/10/2026. Estado al cerrar la validación local: sin commit, push ni publicación; este informe documenta el estado previo a publicar.

## 1. Arquitectura confirmada

El circuito activo conserva hechos → catálogo penal → marco de penas → gravedad → motor procesal común → actuación → explicación. `data/catalogo-penal.ts` aloja los marcos; `data/gravedad-penal.ts` calcula gravedad; `data/procesal-penal.ts` decide la situación procesal. Seguridad Pública, Patrimonio y derivaciones consumen esas capas. Se añadió el cálculo de consecuencias comunes para alternativas cerradas sin asignar pena o gravedad propia a una entrada pendiente.

## 2. Prueba arquitectónica

Se creó `tests/arquitectura-penal.test.mjs` con siete pruebas. Recorre el grafo de datos alcanzable desde las vistas activas y analiza sintaxis TypeScript para detectar clasificación manual, decisiones locales de detención, marcos de pena duplicados, procedibilidad paralela y referencias procesales fuera de la capa común. Además comprueba integridad, referencias y fuentes del catálogo.

## 3. Invariantes comprobados

Los 145 IDs son únicos, las referencias de salida existen, los 136 marcos clasificados están completos y los nueve pendientes no reciben gravedad propia. Las referencias LECrim son únicas y se usan por la vía común. La prueba permite comparaciones y renderizado de resultados para evitar falsos positivos. `tests/interfaz-operativa.test.mjs` inspecciona controles visibles mediante AST y rechaza preguntas forenses, de selección de artículo, de calificación y de gravedad jurídica.

## 4. Búsqueda global

Se revisaron `data/`, `app/`, `components/`, `contenido/` y `scripts/` con búsquedas de literales de gravedad, penas, procedibilidad, detención, art. 495 LECrim y lenguaje interno. Los literales de gravedad activos están en el catálogo/cálculo/motor común o en comparaciones de interfaz para mostrar la rama calculada. Los marcos temporales están en catálogo y gravedad; `transformarMarcoPenal` en la vista solo presenta un marco ya definido. La referencia al art. 495 está en el motor y sus fuentes. Se eliminó la calificación manual de atentado del JSON operativo. Se mantuvieron textos históricos o informativos que no deciden el caso.

## 5. Derivaciones penales

`data/derivaciones-penales.ts` sigue siendo un adaptador: selecciona un ID existente, usa consecuencias comunes y llama al motor procesal. No define penas, gravedad, procedibilidad o detención propias. La vista de animales pregunta por especie vertebrada, estado observado, asistencia conocida y control humano; ya no pide una agravante jurídica agregada. Muerte comprobada o tratamiento veterinario documentado permiten orientar alternativas compatibles, con subtipo pendiente.

## 6. Preguntas eliminadas

Se retiraron de lesiones las preguntas por informe que identifique el art. 149/150, órgano o miembro jurídicamente calificado, deformidad grave declarada y diagnóstico definitivo. Se retiró el bloque de cómputo judicial de condenas anteriores en Patrimonio y la pregunta agregada sobre agravante animal. La vista procesal de delito leve deja de pedir al agente si una fianza es jurídicamente bastante; en ausencia de ese dato confirmado mantiene la solución segura de no detener.

## 7. Preguntas simplificadas

Se sustituyeron elecciones jurídicas por signos de lesión observados o referidos, conducta concreta frente al agente, sustancia identificada mediante comprobación disponible, hechos de fuerza o apropiación, actos de amenaza y coacción, y conductas coexistentes en violencia relacional. Las opciones desconocidas no se convierten en respuestas negativas. Los riesgos procesales se preguntan mediante actos observables de ocultación, destrucción o amenaza, manteniendo la evaluación en el motor.

## 8. Preguntas que permanecen

Permanecen edad conocida, relación y función de las personas, golpe, lesión, signos, asistencia ya recibida o indicada, medio usado, intercambio observado, contenido de una amenaza, titularidad, cuantía con soporte, domicilio verificable, flagrancia, fuentes de indicios y conducta de fuga u obstaculización. Cada una puede cambiar el encaje, la protección, la procedibilidad o la actuación. La asistencia y documentos pueden quedar desconocidos sin bloquear medidas inmediatas.

## 9. Lesiones 149/150

La pérdida traumática visible conduce a «POSIBLE LESIÓN DE ESPECIAL GRAVEDAD · Arts. 149–150 CP», conserva la pena y el subtipo pendientes, y obtiene la gravedad común solo desde las alternativas cerradas 149.1 y 150. Otros signos de alarma no presumen secuela permanente ni gravedad común. Con edad adulta y flagrancia confirmadas, el motor puede proponer detención sin escoger entre 149 y 150; si faltan los hechos procesales, mantiene diligencias y comprobaciones.

## 10. Las otras ocho entradas pendientes

| Entrada | Elemento no cerrado | Salida policial disponible |
|---|---|---|
| `550-551.pendiente` | Función de la persona atacada y circunstancias agravatorias | Protección, documentación y orientación sobre atentado; alternativas 550/551 solo cuando son compatibles. |
| `248.pendiente` | Modalidad de estafa y cuantía | Documentar engaño, disposición y perjuicio; prevención e investigación sin pena inventada. |
| `264.pendiente` | Conducta informática, daño y requisitos específicos | Preservar dispositivos, datos y soportes; coordinación e investigación. |
| `563.pendiente` | Prohibición y peligrosidad concreta del arma | Seguridad, descripción, ocupación preventiva cuando proceda y comprobación técnica. |
| `368.pendiente` | Sustancia y/o atribución individual de tráfico | Preservar sustancia e indicios, identificar y coordinar; si se observa intercambio, alternativas de 368 sin presumir composición. |
| `169.pendiente` | Mal anunciado, condición y resultado exigido | Recoger expresiones literales, condición y soportes; alternativas de 169 si el mal ya se conoce. |
| `183bis.pendiente` | Edad próxima, desarrollo, madurez y consentimiento libre | Protección del menor y derivación especializada; la excepción no se presume. |
| `340bis.pendiente` | Especie, control humano, resultado y agravantes | Protección animal, asistencia y documentación; alternativas comunes cuando muerte o tratamiento están constatados. |

Todas mantienen su propio marco de pena pendiente. La gravedad o procedibilidad común solo se usa cuando las alternativas cerradas la comparten; si difieren, se limitan las conclusiones y se conservan las medidas de protección e investigación.

## 11. Subtipo pendiente con solución policial

Quedan cubiertos 149/150, 550/551, 169, 368 y 340 bis cuando existen alternativas compatibles conocidas. También 248, 264, 563 y 183 bis ofrecen pasos de protección, conservación de indicios o coordinación sin fingir un marco cerrado. Los escenarios A–F tienen pruebas específicas en `tests/operativa-pendientes.test.mjs`.

## 12. Explicación visible

La vista presenta primero el resultado provisional, la situación procesal y la actuación. Después ofrece `ⓘ ¿Por qué?`, el límite de determinación posterior y la fuente penal. Se retiraron de mensajes visibles referencias al «catálogo», a «seleccionar el subtipo» como operación interna y a pedir «una conclusión jurídica». La explicación de 149/150 describe hechos confirmados, límite médico/forense y base procesal.

## 13. Ejemplos procesales

Con lesión 149/150 y flagrancia adulta: arts. 490.2 y 492.1 LECrim, detención y entrega a CNP. Sin flagrancia ni indicios confirmados: art. 492.4 LECrim, no se justifica detención y siguen comprobaciones. En delito leve, el art. 495 LECrim solo permite la excepción si se confirman conjuntamente domicilio no conocido y falta de fianza bastante; la vista de calle no presupone esta última.

## 14. Conteos

145 supuestos penales; 136 con marco clasificable; nueve con marco pendiente. No se añadieron delitos al catálogo.

## 15. Pruebas

Suite completa: **426 pruebas, 426 correctas, cero fallidas**. Incluye arquitectura, interfaz, escenarios A–F, regresiones penales, Patrimonio, Seguridad Pública, Convivencia y contenido.

## 16. Herramientas

`npm run contenido:sincronizar`: correcto, 102 casos y ocho PDF. `npm run validar:contenido`: correcto, 102 casos y 66 fuentes. `npx tsc --noEmit`: correcto. `npx eslint . --ignore-pattern dist --ignore-pattern .next`: correcto. `npx vinext build`: correcto; emite avisos no bloqueantes de tamaño de chunk y clasificación de ruta. `git diff --check`: correcto.

## 17. Navegador

Se recorrieron lesiones 149/150, violencia doméstica, amenazas, atentado, drogas y Patrimonio en móvil y escritorio. En lesiones se verificaron flagrancia, ausencia de flagrancia y subtipo pendiente. Se comprobó una salida inicial sin datos y se corrigió que «Posible tráfico» atribuyera una infracción administrativa al abrirse. Se verificó el tamaño CSS real **390 × 844**, sin desbordamiento horizontal; también se revisó la vista de escritorio. La consola del navegador no mostró errores ni avisos. Las capturas de comprobación permanecen en `outputs/evidencias-0.14.0/`, fuera de Git.

## 18. Archivos previstos para COMMIT A

Cambios de catálogo, gravedad, procesal, Seguridad Pública, Patrimonio, derivaciones, Convivencia, contenido generado y operativo, pruebas, versión, documentación, y demás archivos de código/contenido actualmente modificados **salvo** las dos imágenes de Terrazas y sus ajustes exclusivos de dimensiones. Esto incluye `app/seguridad-publica.tsx`, `app/derivacion-penal.tsx`, `data/catalogo-penal.ts`, `data/procesal-penal.ts`, `data/seguridad-publica.ts`, `data/patrimonio.ts`, `data/derivaciones-penales.ts`, `data/convivencia.ts`, `MANTENIMIENTO_DATOS.md`, `tests/`, `docs/`, `contenido/`, `package.json` y `package-lock.json`.

## 19. Archivos previstos para COMMIT B

Solo `public/imagenes/terrazas/anchura-libre-paso.webp`, `public/imagenes/terrazas/linea-rastrillo-valla-bordillo.webp` y los ajustes de dimensiones en `app/terrace-visual-guides.tsx`. `app/permit-case-sheet.tsx` contiene una derivación penal y corresponde al commit A.

## 20. Riesgos y límites

Los nueve marcos pendientes requieren hechos, pericia o valoración posterior; no se cierran artificialmente. Los hechos procesales no confirmados no se suplen. La identificación de sustancias por apariencia no sustituye análisis. La suficiencia de fianza en delito leve queda fuera de la pantalla inmediata. La compilación conserva avisos no bloqueantes de empaquetado. La herramienta sigue siendo de apoyo y requiere verificar hechos, normativa vigente y competencia en cada intervención.
