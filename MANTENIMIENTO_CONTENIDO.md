# Mantenimiento de contenido

Esta guía es para el mantenimiento cotidiano. Ejecuta los comandos desde la carpeta raíz del proyecto.

## 1. Añadir un PDF

1. Copia el PDF en `public/documentos/`.
2. Ejecuta `npm run contenido:sincronizar`.
3. Ejecuta `npm run validar:contenido`.

Resultado esperado: el resumen indica un documento nuevo y la validación termina con `CONTENIDO VÁLIDO`.

## 2. Eliminar un PDF

1. Borra el PDF de `public/documentos/`.
2. Ejecuta `npm run contenido:sincronizar`.
3. Ejecuta `npm run validar:contenido`.

Resultado esperado: el resumen indica un documento retirado del índice y la validación termina correctamente.

## 3. Cambiar título o descripción de un PDF

Edita únicamente la entrada correspondiente de `contenido/biblioteca/metadatos.json`. No cambies `id`, `archivo` ni `fuenteId` salvo que quieras cambiar expresamente esa relación. Después ejecuta los dos comandos anteriores.

## 4. Añadir un caso

1. Copia `contenido/_plantillas/caso-operativo.json` en la carpeta `casos/` de la materia: `contenido/animales/casos/`, `contenido/seguridad_vial/itv/casos/`, `contenido/seguridad_vial/seguro/casos/` o `contenido/seguridad_vial/permisos/casos/`.
2. Nombra el archivo como su ID, por ejemplo `AN-OP-020.json`, y completa sus datos.
3. Ejecuta `npm run contenido:sincronizar`.
4. Ejecuta `npm run validar:contenido`.

No hay que añadirlo a ningún índice, array, componente ni cargador.

## 5. Eliminar un caso

Borra su único JSON de la carpeta `casos/`, ejecuta `npm run contenido:sincronizar` y después `npm run validar:contenido`.

## 6. Modificar un caso

Edita su JSON en la carpeta `casos/`, sin cambiar su ID ni el nombre de archivo. Después sincroniza y valida.

## 7. Crear una categoría nueva

Añade una sola definición a `contenido/estructura/categorias.json`. En el caso usa ese `id` en `categoria` y el módulo correspondiente en `modulo`. Después sincroniza y valida. Una categoría ya existente no requiere ninguna edición al añadir casos.

## 8. Validar

Ejecuta `npm run validar:contenido`. Es un comando de solo lectura: no cambia archivos. Si hay un problema, indica el archivo y qué corregir.

## 9. Qué no debe tocar el propietario

No edites `app/`, `data/`, `components/`, `scripts/`, `contenido/_generado/` ni `contenido/biblioteca/documentos.json`. Son motor o archivos técnicos regenerables.

Para cambios ordinarios sí se editan los PDF, `contenido/biblioteca/metadatos.json`, los JSON individuales de `casos/`, las fuentes y las definiciones reales de módulos o categorías.

## 10. Criterios permanentes de ficha operativa

- La ficha explica primero la regla imprescindible y su artículo exacto; después pregunta por hechos observables, no por conclusiones jurídicas.
- No se exige al agente recordar o deducir información que la aplicación ya puede mostrar.
- La referencia operativa debe ser breve y el recorrido autosuficiente, sin secciones vacías ni explicaciones sobre el motor, IDs o reutilización interna.
- Toda fuente resoluble se abre directamente desde la ficha mediante el identificador declarado en `fuentes`; las URL no se duplican en los casos.
- Se evita el texto libre si no alimenta una decisión o una salida operativa concreta.
- La parte común se presenta una sola vez y solo se separan variantes cuando cambia el resultado.
- Si un término como «homologado», «certificado», «autorizado» o «reglamentario» no puede verificarse en calle, se indica la comprobación documental y no se obliga a adivinar.
