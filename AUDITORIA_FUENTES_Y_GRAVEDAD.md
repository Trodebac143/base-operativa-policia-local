# Revisión de fuentes y gravedad penal

Fecha: 1 de octubre de 2026. Cambios realizados en la copia local.

## Fuentes

Se han revisado las 66 entradas del catálogo y sus asociaciones con los ocho documentos locales. Los enlaces publicados se han comprobado por HTTPS, incluyendo las dos resoluciones de la entrada conjunta SSTS 788/2023 y 789/2023. La respuesta HTTP acredita acceso; la identidad de los documentos señalados por el usuario se ha contrastado además con su publicación oficial. No se ha realizado una auditoría integral de vigencia de las 66 fuentes.

| Fuente señalada | Resultado |
| --- | --- |
| SANC 2026/13 | Conserva el PDF local. Retirado el enlace al cotejo CSV; publicación DGT directa pendiente. |
| SSTS 788/2023 y 789/2023 | Dos acciones separadas a las resoluciones concretas del CENDOJ. |
| STS 210/2017 | Enlace a la resolución concreta del CENDOJ. |
| Dictamen 2/2021 | Retirado el enlace: el fichero era una nota de prensa, no el dictamen íntegro, y el usuario documentó una redirección a identificación. Original pendiente. |
| Instrucción 14/S-134 | PDF oficial DGT directo, comprobado. |
| Guía ARCI de infracciones | Retirado el portal genérico. Documento de la versión indicada pendiente; la DGT remite al acceso de administraciones. |
| Consulta FGE 1/2026 | PDF BOE directo. Desvinculado el documento interno sobre pérdida de vigencia y suspensión judicial. |
| Instrucción 12/C-105 | Desvinculada el acta de notificación, que no es la instrucción. Original oficial pendiente. |
| Orden de 25/09/1996 | Retirado el ELI defectuoso. Identificada como DOGV 2850, de 17/10/1996, referencia 2661/1996; original pendiente. |
| STC 24/2004 y STC 51/2005 | Enlaces a las resoluciones completas del Tribunal Constitucional. |
| STS 312/2003 | Enlace a la resolución concreta del CENDOJ. |
| Orden 3/2025 | PDF oficial DOGV, CVE DOGV-C-2025-48041, comprobado. |
| Residuos urbanos y limpieza viaria | Detectado además un HTTP 404: corregido el nombre físico del PDF siguiendo el enlace de la ficha municipal oficial. |
| Ordenanzas municipales | Las siete ya estaban en el grupo correcto en esta copia. Nombre visible ajustado a ORDENANZAS MUNICIPALES. |
| Instrucción SES 10/2025 | Incidencia adicional: retirado el índice genérico de instrucciones. Texto oficial directo pendiente. |

Los PDF internos conservan su presencia en Documentos. Las seis incidencias sin original o publicación directa muestran `consultaPendiente` en Biblioteca y en las fichas. La validación estructural no las presenta como fuentes verificadas. El verificador de enlaces termina con incidencias mientras sigan pendientes.

La agrupación municipal comprende tenencia de animales, convivencia, residuos, terrazas, venta no sedentaria, movilidad y zanjas/calas. El apartado «Utilizada en» conserva sus relaciones con las materias operativas.

## Motor penal

La gravedad se decidía mediante etiquetas literales en los resolvedores de `data/seguridad-publica.ts` y `data/patrimonio.ts`, con algún texto guardado en `contenido/seguridad_publica/operativa.json`. No existía un modelo común de las penas. `data/penal.ts` resuelve preceptos y audita ramas; `data/procesal-penal.ts` decide actuaciones procesales. Las vistas presentan las etiquetas recibidas, sin calcular penas.

Se ha inspeccionado el catálogo completo de 89 casos y los 16 conceptos de Seguridad Pública. Los campos «grave» o «muy grave» de los casos administrativos no son clasificaciones penales y se han conservado. Las ramas penales de Animales y Seguridad Vial remiten a preceptos o publican una vía penal sin calcular automáticamente su gravedad desde las penas.

El contraste usa el [Código Penal consolidado en el BOE, actualizado el 09/04/2026](https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444#a13) y la [Circular FGE 1/2015, apartado 3.3](https://www.boe.es/buscar/doc.php?id=FIS-C-2015-00001). La circular se ha incorporado al catálogo y a las fuentes de Seguridad Pública.

No se ha confirmado un error de frontera en las clasificaciones cerradas contrastadas. Había una explicación incorrecta en el artículo 254.2: se justificaba con multa de tres a seis meses un supuesto cuya multa es de uno a dos meses. Se ha corregido la explicación, conservando su clasificación leve.

Se ha añadido `data/gravedad-penal.ts` para representar naturaleza, mínimo, máximo, penas conjuntas y alternativas. Aplica las reglas del artículo 13.4 a cada pena y considera después el conjunto. Se usa ya en los artículos 254, 267 y 368. Las demás clasificaciones siguen siendo etiquetas manuales o reglas por supuesto: se han contrastado en esta revisión y conservan su comportamiento. Las pruebas acreditan el comportamiento cubierto, no la exhaustividad jurídica de todos los subtipos presentes o futuros.

| Ramas revisadas | Resultado |
| --- | --- |
| Drogas: art. 368 | Se consideran prisión y multa proporcional. Clasificaciones conservadas. |
| Autoridad, agentes y armas: 169, 550, 556, 563 | Clasificaciones de los supuestos trabajados conservadas; no extenderlas automáticamente a subtipos ajenos al flujo. |
| Lesiones, ámbito relacional, amenazas y coacciones | Conservadas las ramas cerradas de 147, 153, 154, 171, 172, 173 y 468. |
| Delitos sexuales | Contrastadas ramas 178 a 183. Los arts. 182 y 183 se clasifican como menos graves porque todos los marcos de pena representados en esas ramas pertenecen a esa categoría. |
| Patrimonio | Contrastados hurtos, robos, apropiaciones y daños; se mantiene la gravedad abstracta separada de tentativa, multirreincidencia y excusa absolutoria. |
| Animales y Seguridad Vial | Conservadas las derivaciones por precepto; no transformar etiquetas administrativas en gravedad penal. |

Las referencias genéricas 149/150, 266, los subtipos no cerrados de atentado y las variantes domésticas pendientes no proporcionan un régimen completo de penas en el modelo actual. Se mantienen sus derivaciones o avisos. No se ha creado una clasificación automática para ellas.

El nuevo evaluador devuelve `undefined` si falta una rama o se declara una accesoria sin tratamiento jurídico expreso. No deduce penas del texto libre. Compara meses/años y días adicionales sin redondeo; la multa usa la equivalencia expresa del artículo 50.4. Para TBC se admite la representación en días hasta 365; 366 requiere contexto calendario y devuelve `undefined`. El extremo legal de un año también puede declararse directamente en años o meses. Ese límite de representación no establece una equivalencia jurídica fija de año a 365 días. Las restantes duraciones en días que necesitan una conversión calendario no especificada quedan pendientes. El evaluador clasifica marcos legales, no determina ni individualiza una condena.

## Validación

- 40 pruebas nuevas de gravedad: ambas reglas del artículo 13.4, prisión, multa, TBC, conducción, armas, animales, residencia, aproximación, comunicación, inhabilitaciones, suspensión, localización, penas por naturaleza, responsabilidad subsidiaria, penas conjuntas/alternativas y datos incompletos. Incluyen regresiones de los resolvedores activos.
- Pruebas de fuentes: PDF interno incorrectamente asociado, conservación de SANC, ambas SSTS, pendientes visibles y detección de buscadores, identificación, errores HTTP 200 y falsos PDF.
- Suite completa: **373 pruebas, 373 correctas, 0 fallos**.
- Validación de contenido, TypeScript y lint de todos los archivos técnicos modificados: correctos.
- Compilación de producción con `npx vinext build`: correcta. El envoltorio Bash de `npm run build` falla en este entorno Windows; se ejecutó directamente el mismo compilador.
- Acceso a enlaces: los 59 destinos publicados responden HTTP 200 y no presentan los errores detectados por el verificador; seis consultas pendientes. El verificador no declara el catálogo íntegramente verificado mientras existan pendientes.

## Archivos

Contenido: `contenido/juridico/fuentes.json`, `contenido/juridico/POLITICA_FUENTES.md`, `contenido/biblioteca/grupos-fuentes.json`, `contenido/biblioteca/metadatos.json`, índice generado `contenido/biblioteca/documentos.json`, `contenido/seguridad_publica/operativa.json`.

Código: `data/gravedad-penal.ts`, `data/patrimonio.ts`, `data/seguridad-publica.ts`, `data/types.ts`, `app/library-view.tsx`, `app/source-links.tsx`, `scripts/validar-contenido.mjs`, `scripts/verificar-enlaces-fuentes.mjs`, `scripts/diagnosticar-destino-fuente.mjs`.

Pruebas: `tests/gravedad-penal.test.mjs`, `tests/source-destinations.test.mjs`, `tests/library-sources.test.mjs`, `tests/establecimientos-inspeccion.test.mjs`. Informe: este archivo.

## Mejora de clasificación y explicabilidad procesal (02/10/2026)

1. **Dónde se utilizaba «NO LEVE».** Aparecía como clasificación final en seis salidas de `data/seguridad-publica.ts`: amenazas y agresión sexual genéricas del bloque relacional, lesión del art. 147.1, conductas de los arts. 182 y 183 y amenazas del art. 169. Además aparecía en el fundamento procesal de flagrancia, en el régimen interno `leve | no_leve`, en la frontera descriptiva de `contenido/seguridad_publica/operativa.json` y en este informe de auditoría.

2. **Por qué se utilizaba.** El motor de incidentes solo necesitaba distinguir la excepción procesal de los delitos leves del régimen ordinario aplicable a delitos menos graves y graves. Esa distinción binaria se trasladó indebidamente a la etiqueta presentada al usuario, aunque varias ramas ya contenían datos suficientes para calcular la gravedad exacta.

3. **Cómo se sustituyó.** El régimen procesal interno se denomina ahora `leve | ordinario` y queda separado de la clasificación penal. Las ramas cerradas de los arts. 147.1, 169, 182 y 183 pasan sus marcos abstractos de pena al evaluador común de los arts. 13 y 33 CP y devuelven `DELITO MENOS GRAVE`. Las ramas sexuales ya concretadas siguen distinguiendo `DELITO MENOS GRAVE` y `DELITO GRAVE`. La entrada sexual genérica de los arts. 178 a 180 no inventa una categoría: omite la etiqueta y explica que debe concretarse penetración, violencia, intimidación y agravaciones antes de decidir entre menos grave y grave.

4. **Artículos LECrim realmente usados.** El inventario de decisiones ejecutables comprende los arts. **105.1, 105.2, 490.2, 492.1, 492.4, 493 y 495 LECrim**. El apartado 105.1 se usa para la actuación de oficio y el 105.2 para los delitos perseguibles a instancia de la persona agraviada y las diligencias a prevención. El art. 520.2 solo consta en contenido general de derechos y no interviene en una decisión del motor ni se muestra en estas fichas procesales. Los fragmentos se verificaron contra la [LECrim consolidada del BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1882-6036), cuya última actualización publicada es de 09/04/2026. La explicación del art. 492.4 conserva su remisión al supuesto precedente y separa el texto legal de los factores que valora la aplicación.

5. **Sistema de ayuda contextual.** `data/referencias-procesales.ts` centraliza norma, artículo/apartado, materia, fragmento legal, URL oficial y versión. Cada decisión aporta el identificador común, su aplicación específica al caso y la conclusión correspondiente. La interfaz muestra cada artículo y un control `ⓘ ¿Por qué?` cerrado por defecto; al abrirlo diferencia `Artículo y materia`, `Qué establece`, `Por qué se aplica en este caso` y `Conclusión`, y deja visible el enlace oficial del BOE. Se usan elementos HTML `details/summary`, por lo que abrir y cerrar la ayuda no escribe en el estado React del caso.

6. **Ejemplo antes/después.** Antes, una lesión del art. 147.1 con tratamiento posterior mostraba `DELITO NO LEVE` y, en flagrancia, una única frase con los arts. 490.2 y 492.1. Ahora muestra `DELITO MENOS GRAVE`; cada artículo tiene ayuda independiente con el fragmento del BOE y la conexión concreta `persona sorprendida durante o inmediatamente después → flagrancia apreciada → regla de Policía Judicial → resultado DETENER`.

7. **Archivos modificados en esta mejora.** `data/referencias-procesales.ts` (nuevo), `data/procesal-penal.ts`, `data/seguridad-publica.ts`, `app/seguridad-publica.tsx`, `app/seguridad-publica.css`, `contenido/seguridad_publica/operativa.json`, `tests/seguridad-publica.test.mjs` y este informe. Se reutilizan, sin modificar en esta mejora, `data/gravedad-penal.ts` y sus pruebas exhaustivas de límites.

8. **Pruebas añadidas.** Se cubren las antiguas ramas genéricas, el cálculo menos grave de 147.1/169/182/183, la decisión de no clasificar la entrada sexual aún ambigua, la correspondencia exacta entre regla ejecutada y artículos, la cobertura completa del catálogo sin referencias huérfanas, la presencia de explicación/fuente BOE, la ayuda cerrada por defecto, CSS de escritorio/móvil y la ausencia de mutación del resultado al renderizar. La validación real en navegador confirmó apertura/cierre en escritorio y móvil, identidad de inputs y resultado antes/después, viewport móvil de 390 × 844 sin desbordamiento y objetivos táctiles de 46 px. Evidencias locales: `outputs/ayuda-procesal-escritorio.png` y `outputs/ayuda-procesal-movil.png` (artefactos ignorados por Git).

9. **Validación final.** TypeScript (`tsc --noEmit`): correcto. ESLint: correcto. Contenido: válido (89 casos, 66 fuentes y 16 conceptos de Seguridad Pública). Pruebas focalizadas: 89/89. Suite completa: **373/373**, 0 fallos. Producción: `vinext build` correcto en sus cinco fases. `npm test` no puede ejecutar su envoltorio Bash en el sandbox Windows porque MSYS intenta crear rutas bajo `/c/Users/vifly`; se ejecutaron directamente, sin cambiar configuración, el mismo compilador y todos los archivos `tests/*.test.mjs`. El verificador general de enlaces no dispone de red desde el sandbox y además conserva seis consultas pendientes preexistentes; los nuevos enlaces de la LECrim se comprobaron de forma independiente contra el dominio oficial `boe.es` y los tests exigen URL oficial con ancla del artículo.

La última suite completa (373/373) incluye la separación de los apartados 105.1 y 105.2. Después del ajuste final para mostrar también sus ayudas en «Atención» se verificaron de nuevo Seguridad Pública (22/22), TypeScript, ESLint y la compilación de producción (5/5); no se repitió la suite completa una tercera vez.

## Razonamiento jurídico visible en Seguridad Pública (02/10/2026)

1. **Inventario previo.** La decisión procesal se genera en `data/procesal-penal.ts` y la reutilizan drogas, hechos contra agentes, armas, incidentes personales y patrimonio. `AuthorSituation`, en `app/seguridad-publica.tsx`, presenta todas esas decisiones. La ayuda contextual repetía una explicación general, la aplicación concreta y el fundamento principal, y mostraba expresiones propias de la implementación. El catálogo patrimonial histórico `contenido/seguridad_publica/patrimonio.json` también contiene una descripción técnica, pero no se importa ni se presenta en la ficha actual; se ha conservado para no alterar un conjunto de datos fuera del flujo visible.

2. **Arquitectura aplicada.** Se añadió el tipo común `RazonamientoProcesal`, con `hechosConfirmados`, `encajeLegal` y `consecuencia`, y una única función de redacción. Todas las ramas del resolvedor producen esa estructura y mantienen `fundamentoDetencion` como salida compatible. No se creó un segundo resolvedor ni se duplicó la lógica en cada ficha.

3. **Razonamiento principal.** La interfaz compone un párrafo breve que enlaza los hechos confirmados con los artículos aplicables y la consecuencia. La flagrancia explica conjuntamente los arts. 490.2 y 492.1; la no detención enlaza los arts. 492.4 y 493; el delito leve explica el límite y la excepción del art. 495. Cuando concurren varias circunstancias, se narran en una secuencia natural y solo se incluyen las que constan en la entrada.

4. **Ayuda contextual.** Cada `details`, cerrado por defecto, contiene `Artículo y materia`, `Qué establece`, `Por qué se aplica en este caso` y `Conclusión`. Se conserva sin cambios el fragmento legal y la fuente oficial del BOE. El catálogo común mantiene los datos estables del precepto; cada uso aporta la aplicación factual y la conclusión correspondiente. Los arts. 105.1 y 105.2 usan la misma estructura en los avisos de denuncia y diligencias a prevención.

5. **Antes y después.** Antes, una flagrancia mostraba una fórmula técnica y cada ayuda añadía una sección sobre el criterio interno. Ahora se lee, en esencia, `persona sorprendida durante el hecho → supuesto del art. 490.2 → regla del art. 492.1 → procede detener`. En un supuesto no flagrante con riesgo para la víctima se expresa únicamente ese riesgo; con cuatro respuestas negativas confirmadas se enumeran fuga, verificación de identidad o domicilio, riesgo para la prueba y riesgo para víctima o testigos antes de concluir `INVESTIGADO NO DETENIDO`. Si esos datos no se han respondido, se indica que la circunstancia adicional aún no está confirmada, sin afirmar su ausencia.

6. **Invariancia jurídica y límites de expresión.** No se modificaron clasificaciones, artículos, árboles ni condiciones de decisión. Una matriz automatizada fija las tuplas `situación / detención / escenario procesal / identificadores LECrim` para flagrancia, indicios insuficientes, no detención, detención no flagrante, autor menor y delito leve. Otra comprobación atraviesa Seguridad Pública y patrimonio y conserva también `gravedad`. Los hashes de `data/gravedad-penal.ts`, `data/patrimonio.ts` y los dos JSON de Seguridad Pública permanecen idénticos al estado anterior a esta mejora textual. No quedó ningún supuesto confirmado imposible de expresar sin cambiar la lógica. Las respuestas aún no informadas se presentan como datos pendientes, sin convertir `undefined` en una respuesta negativa; la ruta de menores conserva la incertidumbre propia de esa derivación y no añade criterios de adultos.

7. **Archivos de esta mejora.** Se modificaron `data/procesal-penal.ts`, `data/referencias-procesales.ts`, `data/seguridad-publica.ts`, `app/seguridad-publica.tsx`, `tests/seguridad-publica.test.mjs` y este informe. No fue necesario cambiar estilos, datos penales, árboles de decisión ni los resolvedores de patrimonio y gravedad.

8. **Validación final.** La prueba real cubrió escritorio y móvil de 390 × 844: ayuda cerrada inicialmente, apertura y cierre sin mutar inputs, resultado ni explicación, controles de 46 px y ausencia de desbordamiento horizontal, secciones vacías y lenguaje técnico. Se comprobaron flagrancia, detención no flagrante por riesgo concreto, no detención con cuatro respuestas negativas y delito leve con domicilio conocido. Evidencias locales ignoradas por Git: `outputs/razonamiento-juridico-escritorio.png` y `outputs/razonamiento-juridico-movil.png`. La validación automatizada final fue: contenido correcto; TypeScript correcto; ESLint global correcto; compilación `vinext build` correcta; suite completa **376/376**, 0 fallos. En Windows se ejecutaron directamente las CLI de Node equivalentes porque los scripts del proyecto envuelven estos pasos con Bash.
