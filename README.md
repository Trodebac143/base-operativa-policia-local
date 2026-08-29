# Base Operativa Policía Local

Aplicación de consulta operativa para Policía Local de Torrent / Comunitat Valenciana. Reúne casos validados, buscador, fichas operativas y una biblioteca documental de consulta.

## Ejecución local

Requiere Node.js `>=22.13.0`.

```bash
npm ci
npm run validar:contenido
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:3000`.

## Contenido y mantenimiento

Los datos editables se encuentran en `contenido/`. Antes de incorporar cambios:

```bash
npm run validar:contenido
npm test
npm run lint
```

Consulta `MANTENIMIENTO_DATOS.md` para la estructura y las reglas de mantenimiento. Los documentos públicos están en `public/documentos/`.

## Compilación

- `npm run build`: compilación del entorno local/Sites existente.
- `npm run build:pages`: exportación estática para GitHub Pages.

La exportación de Pages calcula automáticamente el subdirectorio desde `GITHUB_REPOSITORY`; en local no aplica `basePath`.

## GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` valida, prueba, compila y despliega automáticamente cada `push` a `main` mediante las acciones oficiales de GitHub Pages.

URL pública: <https://trodebac143.github.io/base-operativa-policia-local/>

## Alcance

Esta herramienta sirve como apoyo operativo. Deben verificarse siempre la normativa vigente y las circunstancias concretas de cada intervención.
