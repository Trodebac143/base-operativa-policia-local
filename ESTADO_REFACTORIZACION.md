# Estado de refactorización mantenible

Base de partida: V15 fuente completa.

## Cambios realizados

- Separado el contenido editable en `contenido/`.
- Conservada la API técnica de `data/` mediante adaptadores.
- Consolidado el estado final de los 19 casos de Animales, eliminando la necesidad de editar parches históricos para mantenerlos.
- ITV y Seguro separados en casos, medidas, reglas, fichas y árboles editables.
- Fuentes, reglas comunes, preceptos penales y biblioteca trasladados a JSON editables.
- Eliminado del componente visual de Seguro el contenido jurídico fijo; ahora se obtiene de `contenido/seguridad_vial/seguro/medidas.json`.
- Añadido `npm run validar:contenido`.
- Añadida carpeta reservada para `permisos_conducir`.
- Añadidas guías de mantenimiento y técnica.

## Verificaciones realizadas

- Validador de contenido: correcto.
- 32 casos: 19 Animales + 7 ITV + 6 Seguro.
- 25 fuentes jurídicas.
- 7 documentos de biblioteca presentes.
- Reconstrucción técnica de adaptadores: correcta.
- 15 reglas reconstruidas como en V15.
- Auditoría de advertencias pendientes: 0.
- Auditoría de mensajes penales ambiguos: 0.
- Contenido final migrado de Animales, ITV, Seguro, fuentes, penal y biblioteca: idéntico al estado efectivo de V15.

## Pendiente en el equipo local

Instalar dependencias y ejecutar la batería completa:

```bash
npm install
npm run probar:contenido
npm run dev
```

Después, realizar una modificación pequeña de prueba en un JSON de `contenido/` y verificar que aparece en la interfaz sin tocar código.
