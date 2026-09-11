# Cómo usar la plantilla

1. Copia `caso-operativo.json` en la carpeta `casos/` de la materia correspondiente.
2. Nombra el archivo exactamente como el ID: por ejemplo, `AN-OP-020.json`.
3. Sustituye todos los textos de ejemplo. Usa un `modulo`, una `categoria` y fuentes que ya existan.
4. Conserva `estado: "borrador"` hasta que el contenido esté validado para publicación.
5. Ejecuta `npm run contenido:sincronizar` y después `npm run validar:contenido`.

El archivo es JSON estricto: no admite comentarios, comas finales ni texto fuera de las llaves.
