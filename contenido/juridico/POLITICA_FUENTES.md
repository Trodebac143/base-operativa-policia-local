# Política permanente de fuentes jurídicas

Toda fuente jurídica o normativa nueva utilizada por una ficha, regla, criterio, caso operativo, árbol de decisión, deducción o fundamentación debe incorporarse simultáneamente al registro central `fuentes.json`.

La secuencia obligatoria es:

`fuente utilizada → registrada en el repositorio → visible en Biblioteca / Fuentes → enlazada para consulta`.

## Reglas de incorporación

1. Reutiliza una entrada existente cuando la norma o fuente ya esté registrada. No crees otra entrada equivalente.
2. Toda referencia del contenido debe resolverse mediante el `id`, nombre, nombre corto o alias de una única entrada del registro central.
3. La entrada debe incluir `urlOficial` HTTP(S) o estar vinculada desde `biblioteca/metadatos.json` mediante `fuenteId`. Las fuentes no contienen nombres físicos de PDF. Se prefiere siempre BOE, DOGV, BOP, DGT, ministerio u organismo oficial competente.
4. Si una fuente modifica o sustituye otra, conserva ambas cuando sea necesario para la trazabilidad y actualiza `estado_vigencia_auditoria`.
5. No se admite una fuente utilizada únicamente por el motor y ausente de Biblioteca / Fuentes.

## Fuentes existentes con incidencias documentales

Si la revisión demuestra que un enlace conduce a un buscador, un formulario, un error o un documento distinto, retira ese enlace o la asociación incorrecta al PDF. Conserva la fuente y sus referencias para no perder la trazabilidad del contenido existente. Usa `consultaPendiente` con el motivo concreto cuando no se haya localizado el documento primario; Biblioteca y las fichas mostrarán la limitación. Esto no equivale a dar por verificada la fuente. Las fuentes nuevas deben seguir cumpliendo las reglas de incorporación anteriores.

Una entrada que reúne varios documentos puede declarar `enlacesAdicionales` como una lista de objetos con `titulo` y `url`; las acciones de consulta mostrarán cada documento por separado. `referencias` contiene alias para resolver la fuente, no enlaces que deban mostrarse.

`verificar:fuentes` comprueba los enlaces principales y adicionales, detecta determinados buscadores, formularios y errores con HTTP 200, y termina con incidencias cuando existen consultas pendientes. La validación estructural permite pendientes documentados del catálogo existente; no acredita su acceso ni su identidad documental.

## Comprobación obligatoria antes de publicar

- Identificar las fuentes añadidas por la actualización.
- Verificar que cada una aparece en Biblioteca / Fuentes y ofrece una acción de consulta.
- Comprobar que sus enlaces responden y que no existen duplicados de nombre, alias o URL.
- Ejecutar `npm run validar:contenido` para detectar referencias ausentes o ambiguas.
- Ejecutar las pruebas de `tests/library-sources.test.mjs`.

Si una fuente nueva no supera todas estas comprobaciones, la actualización no está terminada.
