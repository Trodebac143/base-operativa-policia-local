# Actualización estructural · revisión local · 04/10/2026

Trabajo terminado en local, pendiente de revisión del usuario. Sin commit, push ni publicación. Versión propuesta: **0.14.0**; la versión visible y `package.json` siguen en **0.13.0** hasta aprobar la actualización.

## Arquitectura y alcance

El circuito común queda: hechos observados → selección del catálogo → marco abstracto → gravedad calculada → motor procesal → actuación y explicación. `data/catalogo-penal.ts` reúne artículos, subtipos, condiciones, penas alternativas/conjuntas, procedibilidad, relación protegida, fuentes y advertencias. Los resolvedores seleccionan entradas; no reproducen penas ni deciden la detención.

`data/gravedad-penal.ts` aplica las reglas de los arts. 13 y 33 CP, incluidos multa, multa proporcional, prisión, TBC, localización permanente y privaciones/inhabilitaciones relevantes. Representa mitad superior y superior en grado conforme a los arts. 50 y 70. Conserva unidades y días indivisibles; no convierte meses de prisión en treinta días. Cuando una fracción de mes calendario no puede materializarse sin inventar una duración, conserva el marco simbólico y solo clasifica si sus límites legales permiten cerrar la categoría. Las facultades de individualización y rebaja no se convierten automáticamente en una pena concreta.

`data/procesal-penal.ts` es la única capa decisora: indicios, edad, flagrancia, gravedad, denuncia/querella cuando corresponde, identificación/domicilio y riesgos concretos. Edad desconocida, encaje incompleto o procedibilidad pendiente no producen detención automática. El menor queda fuera del motor adulto. La concurrencia de un hecho perseguible de oficio y otro pendiente de denuncia permite continuar por el primero. La ayuda «¿Por qué?» conserva artículo, materia, qué establece, aplicación al caso, conclusión y enlace oficial mediante las siete referencias comunes LECrim.

Se migraron las familias activas de drogas; autoridad/agentes; armas; violencia de género y doméstica; agresiones/lesiones; delitos sexuales; riñas; amenazas/coacciones/acoso; patrimonio; y derivaciones de otros módulos. Permisos tiene cuatro alertas activas del art. 384; Animales, dos alertas condicionales; Alcoholemia reutiliza el catálogo para los arts. 379.2 y 383. Los adaptadores procesales históricos permanecen exclusivamente en la capa común por compatibilidad; las rutas activas llaman al motor único.

**Medición:** 145 supuestos centralizados, 136 con marco clasificable y 9 expresamente pendientes. Este número incluye nuevos subtipos y no equivale al número de caminos combinatorios del árbol anterior. Se eliminaron **45 ocurrencias** de etiquetas de gravedad en los resolvedores: 26 en Seguridad Pública y 19 en Patrimonio. No son 45 tipos penales distintos.

La auditoría previa está en `auditoria-penal-2026-10-04.md`; `salidas-penales-previas.json` conserva la extracción de objetos y asignaciones del código anterior. La matriz `matriz-migracion-penal.json` incluye los 145 supuestos, sus condiciones, penas, gravedad calculada, procedibilidad, fuentes y seis escenarios procesales por supuesto, además de las derivaciones activas y el baseline anterior. Los 26 vectores ejecutados antes de la migración son representativos: no se presentan como una enumeración exhaustiva de todas las combinaciones previas. La cobertura de regresión se completa con las suites existentes y las pruebas nuevas.

En `MANTENIMIENTO_DATOS.md` se incorpora literalmente el principio de infraestructura estable pedido. Una ampliación debe añadir catálogo, hechos, encaje y fuentes; cambiar el núcleo exige justificar una regla jurídica general que el modelo no represente.

## Cambios jurídicos concretos

**Violencia doméstica:** distingue relación protegida doméstica, violencia de género y régimen general antes de seleccionar el tipo. Completa agresión/maltrato, amenaza con y sin arma, coacción, acoso con reiteración y alteración de la vida cotidiana, violencia habitual documentada, vejaciones y quebrantamiento. Distingue denuncia y actuación de oficio. Habitualidad no se presume por el simple número de episodios; medidas requieren vigencia y hechos de incumplimiento. Las agravaciones relacionales se seleccionan por hechos acreditados, incluidos presencia de menores, domicilio, armas cuando corresponda y quebrantamiento de medida.

**149/150:** pregunta por resultado médico conocido/documentado, pérdida de sentido, inutilidad, deformidad, enfermedad y órgano/miembro afectado. La distinción que necesita valoración médico-forense se toma de un informe explícito; no se pide al agente decidir si un órgano es jurídicamente principal. Si falta esa información, muestra posible lesión de especial gravedad con subtipo pendiente.

**550/551:** distingue agente/funcionario/docente o sanitario protegido, autoridad y autoridades del art. 550.3. Pregunta las circunstancias del art. 551 y aplica superior en grado al marco de la víctima seleccionada. No presume víctima ni agravación ante respuestas desconocidas. En navegador se verificó el marco agravado contra autoridad: prisión de 48 meses y un día a 72 meses y multa de 181 a 270 días, con fuentes 550/551/70 y ayuda procesal.

**266:** diferencia medio empleado, peligro concreto para personas y bienes afectados; distingue base ordinaria, modalidad cualificada y mitad superior cuando procede. La modalidad de material militar o de fuerzas de seguridad exige entidad legal del daño y cuantía superior a 1.000 €; la de servicios exige la concreta interrupción, obstaculización o alteración prevista en el precepto. La simple titularidad del bien no basta. El incendio con peligro para personas se conecta con el art. 351.

También se cierran condiciones relevantes de amenazas 169/171, lesiones 148, stalking 172 ter y modalidades sexuales 178–183. En menores, abuso de superioridad puede determinar el art. 181.2 sin violencia/intimidación; no se cuenta de nuevo la misma circunstancia como agravación por prevalimiento. El marco animal incorpora su clase específica de inhabilitación del art. 33 y no la confunde con una inhabilitación general.

## Pendientes expresos

| Entrada | Motivo de reserva |
|---|---|
| `550-551.pendiente` | Tipo de víctima o circunstancias legales sin determinar. |
| `248.pendiente` | El indicio de estafa requiere encaje específico adicional; no hay árbol cerrado para todos sus subtipos. |
| `264.pendiente` | Daños informáticos requieren precisar modalidad y presupuestos del tipo. |
| `563.pendiente` | Falta acreditar prohibición, peligrosidad y circunstancias exigibles. |
| `368.pendiente` | Indicios todavía insuficientes para atribuir tráfico; no presume finalidad de venta. |
| `149-150.pendiente` | Resultado clínico o valoración documental insuficientes para distinguir el subtipo. |
| `169.pendiente` | Condición de la amenaza o consecución del propósito sin conocer. |
| `183bis.pendiente` | La proximidad de edad/madurez y consentimiento requieren valoración concreta; no se automatiza la excepción. |
| `340bis.pendiente` | Especie/control humano, resultado veterinario o agravaciones sin concretar. |

Otros hechos incompletos pueden mantener pendiente un resultado sin crear una entrada adicional. En Convivencia quedan expresamente pendientes, entre otros, regímenes especiales de publicidad del art. 16.8, la franja de riego 07–08 h cuando no se acredita el régimen estacional y señalización de tráfico con regulación específica no cerrada en esta ficha. No heredan la multa general. El validador mantiene seis fuentes antiguas con consulta pendiente de localizar; ninguna cuantía nueva se basa en ellas.

## Convivencia

Entrada inicial con solo tres tarjetas SVG: **Convivencia, molestias y actividades**, **Limpieza, ornato y publicidad**, **Uso y seguridad del espacio público**. Cada bloque abre únicamente sus casos; volver desde una ficha conserva el bloque. El bloque de limpieza/publicidad tiene dos encabezados internos: «Limpieza y cuidado del entorno» y «Publicidad», sin añadir otro nivel de navegación.

Se conservan y redistribuyen las diez fichas `CONV-OP-001` a `010`. Se actualiza `005` con el título completo y palabras de búsqueda solicitadas; «miccionar» devuelve una única ficha. `008` integra publicidad sobre mobiliario y distingue su régimen comercial municipal, rótulos y residuos, evitando mezclar fuentes o multas. Se mantienen las condiciones y derivaciones previas.

Se añaden trece fichas, con comprobaciones y salidas condicionadas:

| ID | Conducta | Cuantía de la salida municipal cerrada |
|---|---|---|
| 011 | Perturbar fiestas, procesiones, desfiles o actos públicos | 60,10 € |
| 012 | Fiestas/bailes públicos sin autorización o fuera de horario autorizado | 120,20 € |
| 013 | Sacudir alfombras, ropa u otros efectos sobre la vía pública | 30,05 € |
| 014 | Riego de plantas sobre vía pública fuera de franja permitida | 30,05 € |
| 015 | Daños en árboles, jardines, cultivos o plantaciones | 90,15 €, si no corresponde la vía penal |
| 016 | Reparto de publicidad comercial sin autorización | 350 € |
| 017 | Publicidad domiciliaria mal depositada o contra voluntad expresa | 350 € |
| 018 | Publicidad comercial en parabrisas de vehículos aparcados | 350 € |
| 019 | Vehículos/remolques dedicados esencialmente a publicidad | 350 €, cuando se acreditan los presupuestos |
| 020 | Macetas u objetos con riesgo de caída | 30,05 € |
| 021 | Deterioro de mobiliario urbano | 90,15 €, si no corresponde la vía penal |
| 022 | Placas de calle o numeración: retirar, deteriorar, ocultar u omitir | 60,10 € o 30,05 € según conducta |
| 023 | Obstaculizar caminos vecinales o sendas públicas | 60,10 € |

Las cuantías no se muestran antes de comprobar los hechos. Las salidas sin infracción, pendientes o derivadas no heredan el importe base. Las fichas remiten a Patrimonio, Agresiones/lesiones, Establecimientos, Urbanismo, Terrazas o Venta no sedentaria cuando procede. El mero logotipo empresarial de un vehículo no se trata como dedicación esencial a publicidad.

**Descartes:** no se duplican necesidades fisiológicas (005), grafitis (006), lavado de vehículos (007), carteles (008), residuos (009), fuego/pirotecnia (010) ni obstáculos (004). Venta ambulante, actividades en establecimientos y ocupaciones específicas continúan en sus módulos. No se añade una infracción con cuantía no confirmada ni una ficha adicional solo por existir un artículo.

Total final: **23 casos de Convivencia** y **102 casos operativos** en el índice técnico.

## Pruebas y validación

Dos suites nuevas: `catalogo-penal.test.mjs` (6 pruebas) y `migracion-penal.test.mjs` (15). Cubren integridad/IDs/fuentes, marcos y gravedad, transformaciones exactas, procedibilidad, concurrencia, edad, ramas domésticas, reservas clínicas, víctima/agravaciones de atentado, daños cualificados y derivaciones animales. Se amplían las suites existentes de Convivencia y Seguridad Pública; se actualizan los vectores patrimoniales y sexuales para proporcionar hechos antes implícitos. No se omiten ni deshabilitan pruebas.

| Comprobación | Resultado |
|---|---|
| Sincronización | Correcta: 102 casos, ocho PDF, cero referencias rotas detectadas. |
| Validación de contenido | Correcta: 66 fuentes, 23 fichas de Convivencia; IDs, referencias, árboles y biblioteca válidos. |
| Suite completa | **403/403**, cero fallos, omitidas, canceladas o TODO. |
| TypeScript | `tsc --noEmit`, correcto, sin diagnósticos. |
| ESLint | Ejecución directa, correcta, sin diagnósticos. |
| Producción | `npm run build:pages`, compilación y exportación estática correctas. |
| Escritorio real | Navegación, encabezados internos, marco penal, proceso y ayuda BOE comprobados. |
| Móvil real | Viewport CSS **390 × 844**; tres tarjetas de 84 px de alto, títulos completos y sin desbordamiento horizontal. Ficha, resultado, fuentes, buscador y vuelta al bloque comprobados. |
| Consola de producción | Sin errores ni advertencias en la pestaña final revisada. |
| Integridad del diff | `git diff --check`, correcto. |

En Windows no está disponible `bash`, utilizado por los wrappers `npm test`, `npm run build` y `npm run lint`. Se ejecutaron directamente las herramientas equivalentes disponibles y el script de producción Next ya existente:

```text
npm run contenido:sincronizar
npm run validar:contenido
node --test --test-concurrency=1 tests/*.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next --ignore-pattern work --ignore-pattern outputs
PAGES_BUILD=true PAGES_BASE_PATH='' npm run build:pages
```

La última línea describe las variables del entorno; en PowerShell se establecieron con `$env:`. El build generado se sirvió solo en `http://127.0.0.1:3001/`. No se ejecutó un despliegue. Los logs y la captura móvil están en `work/`, excluido del control de versiones.

## Archivos de la intervención

**Creados:** `data/catalogo-penal.ts`, `data/derivaciones-penales.ts`, `data/convivencia.ts`, `app/derivacion-penal.tsx`, las trece fichas `CONV-OP-011.json` a `023.json`, las dos suites nuevas y los cuatro documentos de `docs/` (auditoría, salidas previas, matriz e informe).

**Modificados:** `data/gravedad-penal.ts`, `data/procesal-penal.ts`, `data/seguridad-publica.ts`, `data/patrimonio.ts`, `data/alcoholemia.ts`, `data/types.ts`; `app/seguridad-publica.tsx`, `app/alcoholemia.tsx`, `app/permit-case-sheet.tsx`, `app/page.tsx`, `app/convivencia.tsx`, `app/convivencia.css`; las diez fichas `CONV-OP-001.json` a `010.json`; `contenido/_generado/casos.json`; `scripts/validar-contenido.mjs`; `MANTENIMIENTO_DATOS.md`; las suites existentes `convivencia`, `gravedad-penal`, `patrimonio-regression`, `seguridad-publica` y `violencia-sexual-regression`.

En la revisión inicial se preservaron las dos imágenes de Terrazas modificadas por el usuario. En la ampliación posterior, autorizada expresamente, se optimizaron como se detalla a continuación.

## Ampliación: compresión de las imágenes nuevas de Terrazas

Se mantienen los nombres y rutas `public/imagenes/terrazas/anchura-libre-paso.webp` y `public/imagenes/terrazas/linea-rastrillo-valla-bordillo.webp`. Sus resoluciones siguen siendo 1536 × 1024 y 1774 × 887, respectivamente; no se recortan ni reescalan.

| Imagen | Peso recibido | Peso optimizado | Reducción |
|---|---:|---:|---:|
| Anchura libre de paso | 1.184.054 bytes | 268.758 bytes | 77,30 % |
| Línea de rastrillo: valla y bordillo | 1.313.498 bytes | 292.010 bytes | 77,77 % |

Las imágenes recibidas ya utilizaban WebP sin pérdida: la recomprensión estrictamente sin pérdida no ahorró bytes. Se compararon alternativas y se escogió WebP de calidad 95, esfuerzo 6 y submuestreo de alta calidad. Es compresión con pérdida, con revisión visual a resolución original de textos, cotas, flechas, líneas y detalles; no se afirma identidad de píxeles. Las copias exactas recibidas están conservadas en `work/terrazas-compresion/*-original.webp` como respaldo local.

También se corrigen las dimensiones declaradas de valla/bordillo en `app/terrace-visual-guides.tsx`, de 1672 × 941 a 1774 × 887, para reflejar su relación de aspecto real. Los dos WebP y este archivo deben incluirse en el futuro commit/push autorizado.

Validación posterior: ocho pruebas de Terrazas superadas; TypeScript, ESLint del componente y build de producción correctos. Las dos guías cargan en la ayuda visual de la producción local con sus dimensiones naturales correctas; revisión en escritorio y en móvil 390 × 844, sin desbordamiento, deformación ni errores/advertencias de consola. Evidencia en `work/terrazas-compresion-validada.png`. Continúa el estado **solo local, sin commit ni push**.

## Fuentes oficiales revisadas

- [Código Penal consolidado, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444): artículos y marcos penales de cada entrada; enlaces anclados en el catálogo.
- [LECrim consolidada, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1882-6036): referencias procesales comunes.
- [Ordenanza de Convivencia Ciudadana de Torrent](https://www.torrent.es/torrentPublic/docroot/repositorio/Serveis%20admin/Normativa/Ordenances/Ordenanca_C_Convivencia%20Ciudadana.pdf): articulado y anexo sancionador municipal.
- [Ordenanza de Residuos Urbanos y Limpieza Viaria de Torrent](https://www.torrent.es/torrentPublic/docroot/repositorio/Serveis%20admin/Normativa/Ordenances/Ordenanca_C_Residuos%20Urbanos%20y%20Limpieza%20Viaria.pdf): conservación del régimen de limpieza y separación de salidas del caso 008.

**Estado de entrega: revisión local. No commit. No push. No publicación.**
