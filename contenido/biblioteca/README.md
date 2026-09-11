# Biblioteca documental

- `metadatos.json`: editable; contiene título, descripción y la relación opcional `fuenteId`.
- `documentos.json`: técnico y generado; no se edita a mano.
- Los PDF físicos viven únicamente en `public/documentos/`.

Después de cualquier cambio ejecuta `npm run contenido:sincronizar` y `npm run validar:contenido`.
