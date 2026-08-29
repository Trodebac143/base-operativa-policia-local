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
6. Solo después traslada el cambio a la versión de Sites/publicación.

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
