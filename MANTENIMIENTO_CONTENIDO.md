# Manual de mantenimiento — Base Operativa Policía Local

Este es el manual práctico principal para mantener la aplicación sin modificar React, TypeScript ni el motor. Ejecuta los comandos desde la carpeta raíz del proyecto y, en Windows, usa una terminal compatible con los scripts Bash del proyecto (por ejemplo, Git Bash). La versión de Node requerida es `>= 22.13.0`.

## Mapa rápido: qué archivo tengo que tocar

| Quiero modificar… | Archivo o carpeta editable |
| --- | --- |
| Una fuente jurídica | `contenido/juridico/fuentes.json` |
| Mover una fuente en Biblioteca | `contenido/juridico/fuentes.json` → cambiar `grupoBiblioteca` |
| Nombre, icono, orden o visibilidad de un grupo de fuentes | `contenido/biblioteca/grupos-fuentes.json` |
| Añadir o sustituir un PDF | `public/documentos/` y `contenido/biblioteca/metadatos.json` |
| Título, descripción o relación de un PDF | `contenido/biblioteca/metadatos.json` |
| Un caso operativo | El JSON correspondiente en `contenido/**/casos/` |
| Crear un caso | `contenido/_plantillas/caso-operativo.json` y la carpeta `casos/` de la materia |
| Un módulo | `contenido/estructura/modulos.json` |
| Una categoría o su icono | `contenido/estructura/categorias.json` |
| Una imagen publicada | El archivo correspondiente bajo `public/` |
| El original de una imagen | `recursos/imagenes-originales/` |

## Regla de trabajo diario

1. Haz una copia del archivo antes de un cambio importante o trabaja en una rama de Git.
2. Edita únicamente el archivo de contenido que corresponde.
3. Guarda el JSON con sintaxis válida.
4. Ejecuta `npm run contenido:sincronizar` cuando hayas añadido, eliminado o cambiado archivos de caso o PDF.
5. Ejecuta siempre `npm run validar:contenido`.
6. Revisa el resultado en local. Para una comprobación amplia o antes de publicar, ejecuta también `npm test`.

`npm run contenido:sincronizar` **sí modifica archivos**: regenera índices técnicos a partir del contenido editable. `npm run validar:contenido` solo comprueba coherencia y no modifica archivos.

## Biblioteca: fuente y documento no son lo mismo

Una **fuente** es el registro jurídico u operativo: nombre de una norma, organismo, URL oficial, estado de vigencia y grupo de Biblioteca. Por ejemplo, el Código Penal.

Un **documento** es un archivo físico local, normalmente un PDF. Por ejemplo, un manual de intervención.

Una fuente puede tener URL oficial sin PDF, PDF sin URL oficial o ambas cosas. La relación entre un PDF y una fuente se hace con `fuenteId` en `contenido/biblioteca/metadatos.json`.

### Modificar una fuente

Edita `contenido/juridico/fuentes.json`. Busca primero por `id` o por nombre, conserva el `id` salvo necesidad real y valida al guardar.

| Campo | Para qué sirve |
| --- | --- |
| `id` | Identificador único que usan los casos y las reglas. |
| `nombre` | Nombre completo visible de la fuente. |
| `nombreCorto` | Nombre abreviado, si procede. |
| `tipo` | Clase de fuente, por ejemplo `Ley` u `Ordenanza municipal`. |
| `ambito` | Ámbito territorial o material. |
| `organismo` | Organismo que publica o gestiona la fuente. |
| `grupoBiblioteca` | Carpeta principal visible en Biblioteca. |
| `urlOficial` | Enlace oficial preferente. |
| `estado_vigencia_auditoria` | Estado comprobado de vigencia o auditoría. |
| `preceptos`, `uso`, `referencias` | Información jurídica y de trazabilidad ya registrada. |

Después de modificarla, ejecuta:

```bash
npm run validar:contenido
```

### Cambiar una fuente de grupo

En la misma entrada cambia una sola línea, por ejemplo:

```json
"grupoBiblioteca": "seguridad_publica"
```

Los identificadores permitidos se consultan en `contenido/biblioteca/grupos-fuentes.json`. La Biblioteca usa ese campo para archivar la fuente; el apartado **Utilizada en** se calcula aparte a partir de los casos y reglas que la referencian.

Toda fuente de tipo `Ordenanza` u `Ordenanza municipal` debe usar:

```json
"grupoBiblioteca": "ordenanzas_municipales"
```

La validación avisará si una ordenanza está archivada en otro grupo.

### Crear una fuente

Añade un objeto al array de `contenido/juridico/fuentes.json`, separado del anterior por una coma. Modelo mínimo copiable:

```json
{
  "id": "EJEMPLO-SRC-001",
  "nombre": "Nombre completo de la norma",
  "nombreCorto": "Nombre corto",
  "tipo": "Ley",
  "ambito": "Estatal",
  "organismo": "Organismo competente",
  "grupoBiblioteca": "seguridad_publica",
  "urlOficial": "https://...",
  "estado_vigencia_auditoria": "vigente"
}
```

El ID debe ser único, el grupo debe existir y la URL debe apuntar preferentemente a un organismo oficial. Si la fuente se va a usar en un caso o regla, referencia después su `id` desde ese contenido. Consulta también `contenido/juridico/POLITICA_FUENTES.md` antes de dar de alta una fuente nueva.

### Eliminar una fuente

Antes de borrarla, busca su ID en `contenido/` y comprueba dónde se utiliza. Borra solo la entrada que ya no sea necesaria y ejecuta `npm run validar:contenido`: el validador detectará las referencias que hayan quedado rotas.

### Gestionar grupos de Biblioteca

Edita `contenido/biblioteca/grupos-fuentes.json`. Cada grupo contiene:

```json
{
  "id": "seguridad_publica",
  "nombre": "Seguridad Pública",
  "icono": "🛡️",
  "orden": 30,
  "activo": true
}
```

- `id`: identificador estable que se escribe en `grupoBiblioteca`. No lo cambies si ya hay fuentes asignadas sin actualizar también esas fuentes.
- `nombre`: texto visible.
- `icono`: icono visible del grupo.
- `orden`: posición de menor a mayor.
- `activo`: `true` permite mostrarlo; `false` lo oculta. Los grupos activos sin fuentes no se muestran para evitar ruido.

Puedes crear un grupo nuevo sin modificar código: añade su objeto, asígnalo desde `grupoBiblioteca` y valida. Dentro de cada grupo las fuentes se ordenan automáticamente por `nombreCorto` o `nombre`, con orden español.

## PDFs y documentos locales

### Añadir un PDF

1. Copia el PDF a `public/documentos/`.
2. Ejecuta `npm run contenido:sincronizar`.
3. Revisa o completa su entrada en `contenido/biblioteca/metadatos.json`.
4. Ejecuta `npm run validar:contenido`.

La sincronización crea una entrada básica para un PDF nuevo y actualiza `contenido/biblioteca/documentos.json`. Después puedes mejorar título y descripción en `metadatos.json`.

### Vincular un PDF con una fuente

En la entrada del documento en `contenido/biblioteca/metadatos.json`, usa el ID exacto de la fuente:

```json
{
  "id": "DOC-001",
  "titulo": "Manual de intervención VMP",
  "archivo": "Manual de intervencion VMP.pdf",
  "descripcion": "Documento de consulta operativa.",
  "fuenteId": "ID-DE-LA-FUENTE"
}
```

### Sustituir o eliminar un PDF

Si conserva el mismo nombre, sustituye el archivo físico y valida. Si cambia de nombre, copia el PDF nuevo, actualiza `archivo` en `metadatos.json`, retira el anterior cuando proceda, sincroniza y valida.

Para eliminarlo, borra el PDF de `public/documentos/`, ejecuta `npm run contenido:sincronizar` y después valida. Para cambiar solo título o descripción, edita `metadatos.json`; **no edites** `contenido/biblioteca/documentos.json`, porque se genera automáticamente.

## Casos operativos

Los casos viven como un JSON por archivo dentro de las carpetas `contenido/**/casos/`. Para crear uno:

1. Copia `contenido/_plantillas/caso-operativo.json` en la carpeta `casos/` de la materia correspondiente.
2. Nombra el archivo exactamente como su ID, por ejemplo `AN-OP-020.json`.
3. Completa todos los textos de ejemplo, usa un `modulo`, una `categoria` y fuentes existentes.
4. Mantén `"estado": "borrador"` hasta que esté preparado para validación.
5. Ejecuta `npm run contenido:sincronizar` y `npm run validar:contenido`.

Para modificar un caso, edita su JSON sin cambiar el ID ni el nombre del archivo. Para eliminarlo, borra ese único JSON, sincroniza y valida. No hace falta editar índices, arrays, componentes ni cargadores.

## Módulos, categorías e iconos

Los módulos se definen en `contenido/estructura/modulos.json` y las categorías en `contenido/estructura/categorias.json`. Sus campos principales son `id`, `modulo` (en categorías), `nombre`, `icono`, `descripcion`, `orden` y `activo`.

La iconografía está declarada en esos datos: para cambiar el icono visible de una categoría o módulo cambia su campo `icono`; no hace falta editar la interfaz. Al crear una categoría, usa el ID del módulo existente en `modulo`, asígnale un ID único y referencia esa categoría desde los casos que correspondan. Después sincroniza y valida. Cambios que alteren navegación, tipos de campo o comportamientos requieren revisión técnica.

## Imágenes

Guarda las imágenes de producción bajo `public/` en la ruta que ya utiliza la aplicación. Conserva los originales editables en `recursos/imagenes-originales/`, fuera de `public/`. Para raster de producción se prefiere WebP optimizado. No publiques masters innecesariamente pesados y revisa legibilidad tanto en móvil como en escritorio.

## Archivos que normalmente no debes editar

Para mantenimiento ordinario, no edites:

- `app/`, `data/`, `components/` ni `scripts/`;
- `contenido/_generado/`;
- `contenido/biblioteca/documentos.json`.

Son código o índices regenerables. También requieren revisión técnica los cambios de navegación, botones, diseño, almacenamiento, tipos de datos o reglas de cálculo y decisión ya validadas.

## Validar, probar y revisar en local

```bash
# Regenera índices después de cambios en casos o PDFs.
npm run contenido:sincronizar

# Comprueba JSON, IDs, fuentes, grupos, documentos y referencias sin escribir archivos.
npm run validar:contenido

# Compila y ejecuta toda la suite; úsalo antes de publicar cambios importantes.
npm test

# Revisa estilo y tipos cuando haya cambios estructurales o técnicos.
npm run lint
npx tsc --noEmit

# Genera la versión estática prevista para GitHub Pages.
npm run build:pages
```

Para una modificación menor de texto, `npm run validar:contenido` suele ser la comprobación inmediata necesaria; antes de publicar, ejecuta siempre `npm test` y revisa la aplicación en local.

## Flujo seguro de trabajo y publicación

```text
EDITAR
  ↓
GUARDAR
  ↓
npm run contenido:sincronizar (si cambiaste casos o PDFs)
  ↓
npm run validar:contenido
  ↓
npm test (antes de una publicación importante)
  ↓
REVISAR EN LOCAL
  ↓
git diff
  ↓
commit
  ↓
push
  ↓
COMPROBAR GITHUB ACTIONS Y LA WEB PUBLICADA
```

Antes de publicar, confirma que el diff contiene solo los cambios esperados. No automatices ni ejecutes `commit` o `push` por costumbre: primero valida, prueba y revisa la copia local.

## Errores habituales

| Mensaje o síntoma | Qué revisar |
| --- | --- |
| JSON no válido | Falta o sobra una coma, llave, corchete o comillas en el JSON editado. |
| ID duplicado | Busca el mismo `id` en el archivo de fuentes, documentos, módulos, categorías o casos. |
| `grupoBiblioteca` inexistente | Corrige el valor en `fuentes.json` o crea ese `id` en `grupos-fuentes.json`. |
| Ordenanza en grupo incorrecto | Usa `ordenanzas_municipales` en `grupoBiblioteca`. |
| Fuente eliminada todavía utilizada | Busca su ID en `contenido/` y sustituye o elimina las referencias. |
| `fuenteId` inexistente | Corrige el ID de `metadatos.json` o crea primero la fuente. |
| PDF huérfano | Ejecuta `npm run contenido:sincronizar` tras copiar el PDF. |
| PDF registrado que no existe | Revisa `public/documentos/`, corrige el nombre o sincroniza tras retirar el PDF. |
| Categoría o módulo inexistente | Corrige los IDs en el caso o créalos en `contenido/estructura/`. |
| Grupo vacío no aparece | Es normal: los grupos activos sin fuentes se conservan en JSON, pero no se muestran en Biblioteca. |

Para detalles técnicos que no forman parte del mantenimiento cotidiano, consulta `MANTENIMIENTO_DATOS.md`.
