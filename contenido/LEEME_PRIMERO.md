# CONTENIDO EDITABLE — Base Operativa Policía Local

Esta carpeta es la **zona de mantenimiento de datos**.

Si solo vas a corregir o mantener contenido jurídico/operativo, trabaja aquí. No necesitas tocar `app/`, `components/`, `worker/` ni la lógica de `data/`.

## Dónde cambiar cada cosa

| Quiero cambiar… | Archivo |
|---|---|
| Un caso de Animales | `animales/casos.json` |
| Un caso de ITV | `seguridad_vial/itv/casos.json` |
| Una medida de ITV | `seguridad_vial/itv/medidas.json` |
| El árbol de ITV | `seguridad_vial/itv/arbol.json` |
| Un caso de Seguro | `seguridad_vial/seguro/casos.json` |
| Las medidas de Seguro | `seguridad_vial/seguro/medidas.json` |
| El árbol de Seguro | `seguridad_vial/seguro/arbol.json` |
| Una fuente jurídica | `juridico/fuentes.json` |
| Un texto penal literal validado | `juridico/articulos_penales.json` |
| Reglas comunes | `juridico/reglas_generales_y_comunes.json` |
| Un documento de la biblioteca | `biblioteca/documentos.json` |
| Módulos/categorías | `estructura/` — mejor con asistencia técnica si afecta navegación |

## Regla práctica

- **Texto, artículo, cuantía, advertencia, actuación, fuente, medida o ficha:** puedes mantenerlo aquí.
- **Menús, botones, navegación, diseño, nuevas pantallas o comportamiento:** zona técnica; conviene usar ChatGPT/Codex.

## Antes de probar

Después de editar, ejecuta:

```bash
npm run validar:contenido
```

Si devuelve `CONTENIDO VÁLIDO`, levanta la copia local y revisa visualmente el cambio.

## Importante

Por ahora el Site publicado sigue siendo la referencia pública. Esta copia local sirve para probar el mantenimiento autónomo. Cuando un cambio esté validado, el mismo contenido podrá trasladarse a Sites.
