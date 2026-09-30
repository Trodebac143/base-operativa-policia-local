# Biblioteca

- `contenido/juridico/fuentes.json`: catálogo editable de fuentes jurídicas y operativas.
- `grupos-fuentes.json`: grupos editables visibles en Biblioteca; define nombre, icono, orden y estado.
- `metadatos.json`: títulos, descripciones y relación opcional `fuenteId` de los documentos locales.
- `documentos.json`: índice generado; no se edita a mano.
- `public/documentos/`: ubicación física de los PDF.

Después de cambiar casos o PDFs, ejecuta `npm run contenido:sincronizar`; después de cualquier cambio, ejecuta `npm run validar:contenido`.

Consulta [MANTENIMIENTO_CONTENIDO.md](../../MANTENIMIENTO_CONTENIDO.md) para el manual principal completo.
