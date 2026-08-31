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

### Archivos técnicos relacionados

- `components/ui/collapsible.tsx`: componente común utilizado por los desplegables.
- `app/globals.css`: apariencia común del patrón de desplegable.
- `app/alcoholemia.tsx`: coloca los controles y contenidos en pantalla.
- `app/alcoholemia.css`: estilos específicos de la vista de Alcoholemia.

La lógica de cálculo y decisión jurídica está en `data/alcoholemia.ts`. Los datos jurídicos —tasas, EMP, artículos, codificados, importes, puntos y reglas— están en el resto de `contenido/seguridad_vial/alcoholemia.json`. **No deben tocarse para cambiar iconos, nombres, orden o estado inicial de los desplegables.**

### Regla común de interfaz

“Los bloques informativos secundarios de Base Operativa deben utilizar el componente común de desplegable. El contenido, título, iconos, orden y estado inicial deberán definirse mediante datos o configuración siempre que sea posible. No deben crearse implementaciones visuales específicas por caso operativo.”
