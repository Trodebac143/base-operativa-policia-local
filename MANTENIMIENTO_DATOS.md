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

- Plantilla y guía de casos: `contenido/_plantillas/`.
- Índice generado de casos: `contenido/_generado/casos.json`.
- Sincronizador: `scripts/sincronizar-contenido.mjs`.
- Validador: `scripts/validar-contenido.mjs`.
- Pruebas de fuentes y Biblioteca: `tests/library-sources.test.mjs`.

No hay un segundo manual práctico aquí: las instrucciones de edición, validación y publicación segura están centralizadas en `MANTENIMIENTO_CONTENIDO.md`.
