# Mantenimiento de datos — Base Operativa Policía Local

## Objetivo

Este proyecto separa el contenido operativo de la parte técnica para que los cambios ordinarios de datos puedan hacerse sin modificar React, navegación ni lógica interna.

## Tu zona de trabajo

**`contenido/`**

Empieza siempre por `contenido/LEEME_PRIMERO.md`.

### Mapa rápido

- Animales → `contenido/animales/casos.json`
- ITV → `contenido/seguridad_vial/itv/`
- Seguro → `contenido/seguridad_vial/seguro/`
- Medidas comunes de Tráfico → `contenido/seguridad_vial/medidas.json`
- Aplicación de medidas por ficha de Tráfico → `contenido/seguridad_vial/medidas_por_caso.json`
- Permisos de conducir → `contenido/seguridad_vial/permisos_conducir/` (reservado)
- Fuentes jurídicas → `contenido/juridico/fuentes.json`
- Preceptos penales → `contenido/juridico/articulos_penales.json`
- Reglas comunes → `contenido/juridico/reglas_generales_y_comunes.json`
- Biblioteca documental → `contenido/biblioteca/documentos.json`
- Módulos y categorías → `contenido/estructura/` (pueden afectar navegación; preferible asistencia técnica)

## Seguro obligatorio: circulación, inmovilización y depósito

La regla visible y común para todos los casos de Seguro está en:

`contenido/seguridad_vial/medidas_por_caso.json`

Ruta de la regla: `_por_categoria.seguridad_vial_seguro`.

- Para modificar la prohibición de circulación: edita `circulacion`.
- Para modificar inmovilización, su artículo y su texto: edita `inmovilizacion`.
- Para modificar el lugar señalado por los agentes: edita `lugar_inmovilizacion`.
- Para modificar el traslado a depósito por persistencia: edita `traslado_deposito`.
- Para el supuesto adicional de falta de lugar adecuado: edita `retirada_sin_lugar`.
- Para el régimen específico de seguro y su artículo: edita `regimen_especifico`.

La ficha descriptiva de la misma medida se mantiene en `contenido/seguridad_vial/seguro/medidas.json`, campo con `id` `TR-MED-SOA-OPERATIVE`. No copies la regla en los seis casos de `seguridad_vial/seguro/casos.json`.

## Flujo de trabajo local recomendado

1. Haz una copia del archivo que vas a tocar o trabaja con control de versiones.
2. Edita solo el JSON correspondiente dentro de `contenido/`.
3. Guarda el archivo.
4. Ejecuta `npm run validar:contenido`.
5. Si es válido, abre/levanta la aplicación local y comprueba visualmente el caso modificado.
6. Solo después publica el cambio mediante el flujo existente de GitHub Pages.

## Qué puedes modificar normalmente sin ayuda técnica

- títulos y descripciones;
- artículos y normas;
- textos de denuncia;
- importes y rangos ya validados;
- comprobaciones;
- actuaciones;
- advertencias;
- responsable y competencias;
- referencias a fuentes existentes;
- medidas y textos de levantamiento;
- para Tráfico, los cuatro bloques de medida: inmovilización, lugar/traslado, retirada/depósito y levantamiento;
- contenido de casos nuevos cuando ya exista la estructura necesaria.

## Cuándo pedir ayuda técnica

- añadir un nuevo menú o módulo visible;
- cambiar navegación o árbol de interfaz;
- crear nuevos tipos de campos;
- modificar botones, diseño o comportamiento;
- cambiar almacenamiento local;
- crear nuevas funcionalidades;
- modificar la forma en que se renderizan los datos.

## Regla de seguridad

No edites `app/`, `components/`, `worker/`, `db/` ni los adaptadores de `data/` para una corrección ordinaria de contenido.

## Validación

`npm run validar:contenido` detecta, entre otros:

- JSON mal formado;
- IDs duplicados;
- módulos/categorías inexistentes;
- fuentes inexistentes;
- medidas inexistentes;
- referencias penales inexistentes;
- ramas de árboles que apuntan a destinos inexistentes;
- documentos de biblioteca que no están en `public/documentos/`.

## Presentación de Alcoholemia

Los textos de presentación de Alcoholemia se mantienen en:

`contenido/seguridad_vial/alcoholemia.json`

Para cambios visuales sencillos, edita únicamente los apartados `selector_vehiculo` y `presentacion`. No cambies el resto del archivo sin una revisión jurídica.

### Cambiar tipos de vehículo

Busca `selector_vehiculo.opciones`. Cada opción tiene este aspecto:

```json
{
  "id": "motor_ciclomotor",
  "label": "Motor / ciclomotor",
  "icono": "🚗",
  "orden": 1,
  "visible": true,
  "descripcion": "..."
}
```

- `id`: valor interno usado por el motor. **No lo cambies.**
- `label`: nombre que ve el usuario.
- `icono`: icono que aparece junto al nombre.
- `orden`: posición de la opción; los números menores aparecen primero.
- `visible`: usa `true` para mostrarla y `false` para ocultarla.
- `descripcion`: ayuda descriptiva de la opción.

No es necesario editar React para cambiar `label`, `icono`, `orden` o `visible`. Una categoría jurídica realmente nueva solo puede añadirse cuando su `id` y sus reglas ya existan en el motor; ese cambio requiere revisión técnica y jurídica.

### Cambiar los desplegables

Busca `presentacion.secciones_secundarias` en el mismo archivo. Ejemplo:

```json
{
  "id": "tasas",
  "titulo": "Tasas en aire espirado",
  "icono": "♎",
  "orden": 1,
  "abierto_por_defecto": false,
  "visible": true
}
```

- `titulo`: texto visible del desplegable.
- `icono`: símbolo situado junto al título.
- `orden`: posición del bloque en la pantalla.
- `abierto_por_defecto`: `false` lo deja cerrado; `true` lo abre al entrar.
- `visible`: `true` muestra el bloque; `false` lo oculta.

No cambies `id`: enlaza la configuración con el contenido existente. El bloque de fuentes utiliza además `mostrar_conteo: true` para añadir automáticamente el número de fuentes al título.

### Mantener el cálculo EMP y sus textos

Las reglas metrológicas están en `contenido/seguridad_vial/alcoholemia.json`, dentro de `emp.modos.<modo>.reglas`. Cada regla contiene:

- `desde`, `desde_exclusive` y `hasta_inclusive`: fronteras exactas de aplicación.
- `tipo`: `absoluto`, `porcentaje` o `formula`.
- `valor` o `formula`: dato matemático que usa el motor.
- `etiqueta_ui` y `explicacion_ui`: texto que explica al usuario qué EMP se ha aplicado.

Las etiquetas, ayudas y referencias del resultado operativo están en `presentacion.calculo_operativo`. En particular:

- `etiqueta_denuncia` y `ayuda_denuncia`: presentación de la tasa del ticket que debe consignarse.
- `etiqueta_penal` y `ayuda_penal`: presentación de la tasa penal operativa.
- `criterio_administrativo`: referencia a la Instrucción DGT 14/S-134.
- `criterio_penal`: referencia a las SSTS 788/2023 y 789/2023.
- `nota_tabla_correccion`: aclaración bajo el cuadro rápido.

El flujo matemático está implementado en `data/alcoholemia.ts` y mantiene conceptos separados:

1. `tasa_ticket`: lectura impresa por el etilómetro.
2. `emp_exacto`: EMP aplicable calculado sin pérdida de decimales.
3. `corregido_interno_exacto`: resta exacta usada para decidir si procede denuncia.
4. `tasa_penal_operativa`: único valor redondeado a dos decimales, mediante `roundPenalOperationalRate`, para comparar con el umbral objetivo de 0,60 mg/L.

La graduación administrativa de sanción y puntos compara la tasa del ticket con 0,30/0,31 o 0,50/0,51. No debe reutilizarse `tasa_penal_operativa` para ninguna decisión administrativa. La pantalla se limita a representar el objeto `calculo_operativo` que entrega `resolveAlcoholemiaOutcome`; no debe duplicarse esta lógica en `app/alcoholemia.tsx`.

- Regla administrativa: `data/alcoholemia.ts`, funciones `resolveAlcoholemiaOutcome` y `administrativeFinding`; tramos y salidas en `contenido/seguridad_vial/alcoholemia.json` → `limites_por_vehiculo` y `salida_administrativa_v2_consolidada.codificados`.
- Regla penal y comparación con 0,60: `data/alcoholemia.ts`, funciones `roundPenalOperationalRate`, `calculateAlcoholemia` y `resolveAlcoholemiaOutcome`.
- Texto del criterio del Tribunal Supremo: `contenido/seguridad_vial/alcoholemia.json` → `presentacion.calculo_operativo.criterio_penal`.
- Texto del criterio administrativo: `contenido/seguridad_vial/alcoholemia.json` → `presentacion.calculo_operativo.criterio_administrativo`.

Para cambios puramente visuales no edites `data/alcoholemia.ts`, `limites_por_vehiculo`, `salida_administrativa_v2_consolidada` ni `emp.modos`. Cambia las etiquetas de `presentacion.calculo_operativo` o los estilos de `app/alcoholemia.css`, según corresponda.

Las regresiones obligatorias están en `tests/alcoholemia.test.mjs`. Si se modifica cualquier regla, deben conservarse expresamente los casos 0,18/0,19, 0,28/0,29, 0,40/0,41, 0,50/0,51 y 0,64/0,65/0,66.

### Archivos técnicos relacionados

- `components/ui/collapsible.tsx`: componente común utilizado por los desplegables.
- `app/globals.css`: apariencia común del patrón de desplegable.
- `app/alcoholemia.tsx`: coloca los controles y contenidos en pantalla.
- `app/alcoholemia.css`: estilos específicos de la vista de Alcoholemia.

La lógica de cálculo y decisión jurídica está en `data/alcoholemia.ts`. Los datos jurídicos —tasas, EMP, artículos, codificados, importes, puntos y reglas— están en el resto de `contenido/seguridad_vial/alcoholemia.json`. **No deben tocarse para cambiar iconos, nombres, orden o estado inicial de los desplegables.**

### Regla común de interfaz

“Los bloques informativos secundarios de Base Operativa deben utilizar el componente común de desplegable. El contenido, título, iconos, orden y estado inicial deberán definirse mediante datos o configuración siempre que sea posible. No deben crearse implementaciones visuales específicas por caso operativo.”
