# Notas técnicas de datos — Base Operativa Policía Local

Para el mantenimiento cotidiano de fuentes, documentos, casos, módulos, categorías e imágenes, utiliza el manual único [MANTENIMIENTO_CONTENIDO.md](MANTENIMIENTO_CONTENIDO.md). Este documento conserva solo referencias técnicas que requieren revisión jurídica o de desarrollo.

## Límites de una edición ordinaria

El contenido editable vive principalmente en `contenido/`, `public/documentos/` y `recursos/`. No modifiques `app/`, `components/`, `data/`, `scripts/`, `contenido/_generado/` ni `contenido/biblioteca/documentos.json` para una corrección ordinaria.

Pide revisión técnica y jurídica antes de cambiar navegación, tipos de campos, árboles de decisión, almacenamiento, cálculos, sanciones, importes, codificados o decisiones operativas ya validadas.

## Fuentes y Biblioteca

El catálogo central es `contenido/juridico/fuentes.json`; los grupos editables son `contenido/biblioteca/grupos-fuentes.json`; la relación de PDFs y fuentes se mantiene en `contenido/biblioteca/metadatos.json`. La política de alta y trazabilidad jurídica está en `contenido/juridico/POLITICA_FUENTES.md`.

Después de cambios de contenido, usa el flujo descrito en el manual principal. El validador comprueba, entre otras cosas, JSON, IDs, módulos y categorías, fuentes referenciadas, documentos locales y coherencia de los índices generados.

## Configuraciones que requieren especial cuidado

### Alcoholemia

Los textos de presentación se encuentran en `contenido/seguridad_vial/alcoholemia.json`, en `selector_vehiculo` y `presentacion`. Los campos visuales `label`, `icono`, `orden`, `visible`, títulos y estado inicial de desplegables pueden ajustarse sin editar React siempre que se conserve su `id`.

No modifiques sin revisión jurídica y técnica `limites_por_vehiculo`, `salida_administrativa_v2_consolidada`, `emp.modos` ni sus reglas. La lógica de cálculo está en `data/alcoholemia.ts`: distingue la lectura impresa (`tasa_ticket`), el EMP exacto, el valor interno corregido y la tasa penal operativa redondeada. Las regresiones obligatorias están en `tests/alcoholemia.test.mjs`.

### Medidas y árboles de decisión

Las medidas de ITV y Seguro, las reglas comunes, los árboles de decisión y los asistentes especializados pueden contener referencias jurídicas y rutas internas validadas. Antes de cambiar su estructura o consecuencias operativas, pide revisión técnica y jurídica. Para cambios de texto ya autorizados, valida siempre el contenido y prueba la ruta afectada en local.

## Referencias técnicas útiles

### Infraestructura penal y procesal estable

El motor penal/procesal común constituye infraestructura estable.
La incorporación de nuevos delitos o supuestos debe realizarse mediante
catálogo, hechos, reglas de encaje y fuentes, sin crear motores paralelos
ni introducir lógica procesal dentro de los resolvedores específicos.

Una modificación futura del núcleo requiere justificar una regla jurídica general que el modelo común actual no pueda representar. El circuito es: hechos observables → selección de `data/catalogo-penal.ts` → marco abstracto → `data/gravedad-penal.ts` → `data/procesal-penal.ts` → actuación y explicación. Las referencias LECrim siguen en `data/referencias-procesales.ts`.

Los resolvedores de Seguridad Pública, Patrimonio y derivaciones seleccionan IDs del catálogo. No escriben penas ni etiquetas de gravedad. Los textos literales de `contenido/juridico/articulos_penales.json` son documentación de consulta; no constituyen otro clasificador ni otra decisión procesal.

No convertir meses de prisión en treinta días: esa equivalencia solo corresponde a la multa del art. 50.4 CP. Las transformaciones de grado/mitad conservan unidades exactas. Cuando no es posible materializar una fracción de mes calendario, se mantiene la expresión legal; la gravedad solo se cierra si la categoría resulta inequívoca sin esa conversión. Las reducciones facultativas del sentenciador no se aplican automáticamente al tipo abstracto. La tentativa conserva la referencia al art. 62 y exige valoración judicial; no calcula una pena individual.

La edad y la procedibilidad desconocidas impiden presumir el régimen adulto o una denuncia. En hechos concurrentes, el motor considera separadamente la procedibilidad de cada supuesto: otro delito de oficio puede continuar aunque uno requiera denuncia pendiente. Una entrada con subtipo pendiente conserva su pena y gravedad propias sin cerrar. Si los hechos permiten acotar alternativas cerradas, el catálogo calcula únicamente las consecuencias comunes y el motor procesal comprueba que todas conduzcan a la misma decisión. Si hay diferencias, se muestran protección, asistencia, identificación, preservación de indicios y coordinación, sin elegir arbitrariamente un subtipo. Los adaptadores históricos de consulta adulta conservan compatibilidad, pero los resolvedores activos usan la entrada común con datos comprobados.

### Regla permanente de interfaz policial

La interfaz solicita hechos observables o comprobables durante la intervención. Las conclusiones jurídicas corresponden al motor. La falta de información posterior necesaria para una calificación definitiva no impide obtener las conclusiones policiales que sí resulten jurídicamente seguras con los datos disponibles. Evitar preguntas sobre informe forense futuro, diagnóstico definitivo, artículo penal, gravedad, agravantes o computabilidad de condenas. La información ya disponible sobre asistencia sanitaria o medida judicial vigente puede recabarse si cambia la actuación inmediata.

Los nuevos delitos se incorporan mediante catálogo, hechos, encaje y fuentes. No se crean motores de detención, procedibilidad ni gravedad por módulo. `tests/arquitectura-penal.test.mjs` y `tests/interfaz-operativa.test.mjs` contienen las barreras para ampliar ese circuito sin devolver al agente preguntas de calificación.

Antes de ampliar el catálogo, añadir pruebas del marco, gravedad, procedibilidad, hechos de selección y ayudas LECrim. Consultar el inventario y matriz en `docs/auditoria-penal-2026-10-04.md` y `docs/matriz-migracion-penal.json`.

- Plantilla y guía de casos: `contenido/_plantillas/`.
- Índice generado de casos: `contenido/_generado/casos.json`.
- Sincronizador: `scripts/sincronizar-contenido.mjs`.
- Validador: `scripts/validar-contenido.mjs`.
- Pruebas de fuentes y Biblioteca: `tests/library-sources.test.mjs`.

No hay un segundo manual práctico aquí: las instrucciones de edición, validación y publicación segura están centralizadas en `MANTENIMIENTO_CONTENIDO.md`.
