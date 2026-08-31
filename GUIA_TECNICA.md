# Guía técnica — arquitectura mantenible

## Principio

`contenido/` es la fuente editable de datos. `data/` actúa como capa de adaptación tipada para conservar la API interna de la V15 y minimizar regresiones.

## Compatibilidad

La aplicación sigue importando:

- `data/cases.ts`
- `data/itv.ts`
- `data/seguro.ts`
- `data/sources.ts`
- `data/rules.ts`
- `data/modules.ts`
- `data/categories.ts`
- `data/documents.ts`
- `data/penal.ts`

Estos archivos ya no deben contener el contenido operativo principal; importan los JSON de `contenido/` y mantienen las funciones técnicas.

## Entornos

### Actualmente

- **GitHub Pages**: versión pública desplegada desde la rama `main`.
- **Copia local**: entorno para probar cambios de contenido de forma autónoma.

### Futuro

La carpeta `contenido/` no depende de GitHub Pages. Puede mantenerse igual si el proyecto se despliega en otro servidor, siempre que se conserve la misma capa de carga/adaptación.

## Comandos

```bash
npm run validar:contenido
npm run dev
npm run probar:contenido
```

`probar:contenido` ejecuta primero el validador y después la batería completa de pruebas existente.

## Criterio de evolución

Los nuevos bloques, empezando por Permisos de conducir, deben nacer directamente dentro de `contenido/` y exponerse al motor mediante adaptadores técnicos. Evitar volver a introducir textos jurídicos directamente en `app/`.
