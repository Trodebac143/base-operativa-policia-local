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
| Delitos sexuales | Contrastadas ramas 178, 179, 180 y 181. Las derivaciones 182/183 mantienen «no leve» sin cerrar subtipos. |
| Patrimonio | Contrastados hurtos, robos, apropiaciones y daños; se mantiene la gravedad abstracta separada de tentativa, multirreincidencia y excusa absolutoria. |
| Animales y Seguridad Vial | Conservadas las derivaciones por precepto; no transformar etiquetas administrativas en gravedad penal. |

Las referencias genéricas 149/150, 182/183, 266, los subtipos no cerrados de atentado y las variantes domésticas pendientes no proporcionan un régimen completo de penas en el modelo actual. Se mantienen sus derivaciones o avisos. No se ha creado una clasificación automática para ellas.

El nuevo evaluador devuelve `undefined` si falta una rama o se declara una accesoria sin tratamiento jurídico expreso. No deduce penas del texto libre. Compara meses/años y días adicionales sin redondeo; la multa usa la equivalencia expresa del artículo 50.4. Para TBC se admite la representación en días hasta 365; 366 requiere contexto calendario y devuelve `undefined`. El extremo legal de un año también puede declararse directamente en años o meses. Ese límite de representación no establece una equivalencia jurídica fija de año a 365 días. Las restantes duraciones en días que necesitan una conversión calendario no especificada quedan pendientes. El evaluador clasifica marcos legales, no determina ni individualiza una condena.

## Validación

- 40 pruebas nuevas de gravedad: ambas reglas del artículo 13.4, prisión, multa, TBC, conducción, armas, animales, residencia, aproximación, comunicación, inhabilitaciones, suspensión, localización, penas por naturaleza, responsabilidad subsidiaria, penas conjuntas/alternativas y datos incompletos. Incluyen regresiones de los resolvedores activos.
- Pruebas de fuentes: PDF interno incorrectamente asociado, conservación de SANC, ambas SSTS, pendientes visibles y detección de buscadores, identificación, errores HTTP 200 y falsos PDF.
- Suite completa: **370 pruebas, 370 correctas, 0 fallos**.
- Validación de contenido, TypeScript y lint de todos los archivos técnicos modificados: correctos.
- Compilación de producción con `npx vinext build`: correcta. El envoltorio Bash de `npm run build` falla en este entorno Windows; se ejecutó directamente el mismo compilador.
- Acceso a enlaces: los 59 destinos publicados responden HTTP 200 y no presentan los errores detectados por el verificador; seis consultas pendientes. El verificador no declara el catálogo íntegramente verificado mientras existan pendientes.

## Archivos

Contenido: `contenido/juridico/fuentes.json`, `contenido/juridico/POLITICA_FUENTES.md`, `contenido/biblioteca/grupos-fuentes.json`, `contenido/biblioteca/metadatos.json`, índice generado `contenido/biblioteca/documentos.json`, `contenido/seguridad_publica/operativa.json`.

Código: `data/gravedad-penal.ts`, `data/patrimonio.ts`, `data/seguridad-publica.ts`, `data/types.ts`, `app/library-view.tsx`, `app/source-links.tsx`, `scripts/validar-contenido.mjs`, `scripts/verificar-enlaces-fuentes.mjs`, `scripts/diagnosticar-destino-fuente.mjs`.

Pruebas: `tests/gravedad-penal.test.mjs`, `tests/source-destinations.test.mjs`, `tests/library-sources.test.mjs`, `tests/establecimientos-inspeccion.test.mjs`. Informe: este archivo.
