# CONTENIDO EDITABLE — Base Operativa Policía Local

Esta carpeta es la **zona de mantenimiento de datos**.

Si solo vas a corregir o mantener contenido jurídico/operativo, trabaja aquí. No necesitas tocar `app/`, `components/`, `worker/` ni la lógica de `data/`.

## Dónde cambiar cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Un caso de Animales | un JSON en `animales/casos/` |
| Un caso de ITV | un JSON en `seguridad_vial/itv/casos/` |
| Una medida de ITV | `seguridad_vial/itv/medidas.json` |
| El árbol de ITV | `seguridad_vial/itv/arbol.json` |
| Un caso de Seguro | un JSON en `seguridad_vial/seguro/casos/` |
| Un caso de Permisos | un JSON en `seguridad_vial/permisos/casos/` |
| Las medidas de Seguro | `seguridad_vial/seguro/medidas.json` |
| La regla común visible de circulación, inmovilización y depósito por Seguro | `seguridad_vial/medidas_por_caso.json` → `_por_categoria.seguridad_vial_seguro` |
| El árbol de Seguro | `seguridad_vial/seguro/arbol.json` |
| Una fuente jurídica | `juridico/fuentes.json` |
| La política obligatoria de fuentes | `juridico/POLITICA_FUENTES.md` |
| Un texto penal literal validado | `juridico/articulos_penales.json` |
| Reglas comunes | `juridico/reglas_generales_y_comunes.json` |
| Título o descripción de un PDF | `biblioteca/metadatos.json` |
| Módulos/categorías | `estructura/` — mejor con asistencia técnica si afecta navegación |

## Regla práctica

- **Texto, artículo, cuantía, advertencia, actuación, fuente, medida o ficha:** puedes mantenerlo aquí.
- **Menús, botones, navegación, diseño, nuevas pantallas o comportamiento:** zona técnica; conviene usar ChatGPT/Codex.

## Antes de probar

Después de editar casos o PDF, ejecuta:

```bash
npm run contenido:sincronizar
npm run validar:contenido
```

Si devuelve `CONTENIDO VÁLIDO`, levanta la copia local y revisa visualmente el cambio.

## Importante

Toda fuente jurídica nueva debe cumplir `juridico/POLITICA_FUENTES.md`: registro central, visibilidad en Biblioteca → Fuentes, enlace consultable, ausencia de duplicados y validación de todas las referencias.

Por ahora el Site publicado sigue siendo la referencia pública. Esta copia local sirve para probar el mantenimiento autónomo. Cuando un cambio esté validado, el mismo contenido podrá trasladarse a Sites.
