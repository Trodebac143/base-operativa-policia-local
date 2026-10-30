# Informe de corrección integral · 30/10/2026

La aplicación incorpora las correcciones funcionales E01–E16 y el tratamiento documental D01–D02. Se conservan materias, diseño general y cambios anteriores de la rama. La validación técnica pasa; cinco referencias documentales siguen pendientes de localización íntegra o publicación oficial directa y se muestran como tales. Este informe no constituye una certificación jurídica integral.

Rama: `codex/correccion-integral-verificada-20261029`. Base revisada: `4ca6f99ce918c5c65bfcf680fe0cba25328a171f`. La autorización posterior del usuario incluye actualizar GitHub, publicar Pages, comprobar su funcionamiento y apagar el equipo después de esa comprobación. El resultado remoto del despliegue se registra en la PR única, después de su ejecución.

## Incidencias y resultado

| ID | Resultado y comportamiento comprobado | Implementación y evidencia |
| --- | --- | --- |
| E01 | Corregida. Entrada por conducta sexual y edad de la víctima. La vía de menores de 16 no exige declarar falta de consentimiento. Se distinguen acto físico, hacer presenciar y contacto por TIC; el consentimiento desconocido de una persona de 16 o más sigue pendiente. La posible excepción del art. 183 bis no utiliza una diferencia de edad inventada. | `data/seguridad-publica.ts`, `app/seguridad-publica.tsx`; regresiones sexuales y comprobación real en escritorio/móvil. CP 178–183 bis. |
| E02 | Corregida. Domicilio, fianza y procedibilidad conservan el estado pendiente. Sin domicilio, una fianza suficiente evita aplicar automáticamente la excepción del art. 495; sin comprobación de fianza no se cierra como no detenido. | `data/procesal-penal.ts`; matriz de 27 combinaciones y comprobación real de las tres respuestas de fianza. LECrim 495. |
| E03 | Corregida. La oposición sin requisitos penales no produce por defecto una infracción del art. 36.6. Se comprueban orden legítima, requerimiento y conducta; la explicación y el contenido canónico siguen esa misma frontera. | `data/seguridad-publica.ts`, `contenido/seguridad_publica/operativa.json`; pruebas de autoridad y pendientes. CP 550/556; LO 4/2015, 36.6. |
| E04 | Corregida. Las amenazas distinguen mal, condición y finalidad; las razones solo describen lo contestado, sin añadir una condición, propósito cumplido o obligación debida desconocidos. Cambiar la conducta limpia circunstancias subordinadas. | `data/seguridad-publica.ts`, `data/fact-transitions.ts`; regresiones de amenazas y copia de las respuestas. CP 169–171. |
| E05 | Corregida. Identidad o domicilio no verificables no se transforman por sí solos en riesgo de incomparecencia. Se piden hechos concretos de fuga, pruebas, víctima o testigos y se conserva la insuficiencia de datos. | `data/procesal-penal.ts`, controles procesales; pruebas de falta de identificación frente a riesgos comprobados. LECrim 490–495. |
| E06 | Corregida. Se separa ejercicio actual de funciones de hechos cometidos con ocasión o por razón de ellas. El art. 37.4 exige funciones de protección de la seguridad y su contexto propio. | Resolutor y controles de autoridad; con y sin funciones de protección en escritorio/móvil. CP 550/556; LO 4/2015, 37.4. |
| E07 | Corregida. Selector de autor menor de 14, de 14 a 17, de 18 o más y edad todavía desconocida. Se distinguen protección, régimen de menores y comprobación de edad; las garantías incluyen el límite policial de 24 horas para menores. | `data/procesal-penal.ts`, controles de edad y explicaciones; pruebas y navegador. LO 5/2000, 1, 3 y 17. |
| E08 | Corregida. Identificación con presupuesto legal, imposibilidad de otros medios, finalidad, límite de seis horas, información, registro, comunicación y volante; trato no discriminatorio. No se usa como detención por riesgo supuesto. | Contenido operativo, referencias y regresiones. LO 4/2015, 16. |
| E09 | Corregida. Robo violento distingue otro lugar, morada/local/dependencia y presencia frente a uso del arma. Lugar o uso desconocidos no se convierten en respuestas negativas. Cambiar presencia del arma limpia su uso anterior. | `data/patrimonio.ts`, `data/patrimony-review.ts`, formulario; art. 242.1, 242.2 y 242.3 comprobados en escritorio/móvil. |
| E10 | Corregida. Se exponen las entradas funcionales existentes de patrimonio, condenas, agravaciones, apropiación, administración y daños. Los datos decisivos omitidos impiden cerrar gravedad o situación procesal. Se limpian dependencias y se documentan entradas derivadas o antiguas sin efecto. | [Mapa de 168 entradas](mapa-entradas-correccion-2026-10-30.md); regresiones de todas las ramas existentes y recorrido real de agravaciones, fuerza, condenas y daños. |
| E11 | Corregida. Residuos distingue datos pendientes, ausencia de infracción constatada, remisión a regulación específica y clasificación sin verificar. La falta de datos no se presenta como inexistencia definitiva de infracción. | `app/convivencia.tsx`, `CONV-OP-009.json` y pruebas integrales. |
| E12 | Corregida. La búsqueda global incorpora las siete herramientas: alcohol, VMP, permisos, ITV, seguro, establecimientos y urbanismo. Normaliza acentos y mayúsculas y abre el destino funcional correspondiente. | `data/operational-tools.ts`, `app/page.tsx`; catorce aperturas reales: siete en escritorio y siete en móvil. |
| E13 | Corregida. Alcohol comienza vacío y exige confirmación explícita. Vaciar, introducir texto inválido o cambiar un dato de contexto elimina el resultado anterior. Una lectura de 0,65 mg/l no se etiqueta automáticamente como delito; no sustituye el procedimiento completo de prueba. | `app/alcoholemia.tsx`, regresiones y navegador. Se conservaron el cálculo metrológico y los importes; 0,65 corregido muestra 0,60125 y el resultado administrativo en el supuesto confirmado. |
| E14 | Corregida. Selector de hechos hasta 09/04/2026, desde 10/04/2026, continuados que atraviesan la reforma y fecha desconocida. No se extienden consecuencias desfavorables de la LO 1/2026 a hechos anteriores sin comparación jurídica. | `data/patrimonio.ts`, formulario y pruebas de fecha/condenas. LO 1/2026 y reglas temporales del CP. |
| E15 | Corregida. Razones y enlaces se refieren al supuesto y sus datos, con artículos concretos. La copia incluye respuestas seleccionadas, cifras reales, pendientes y enlaces; excluye alternativas sin marcar. | `data/legal-links.ts`, `app/security-summary.ts` y prueba real de copia con importe 100 y fianza pendiente. |
| E16 | Corregida. Se explicita el ámbito Torrent/Comunitat Valenciana. Ordenanzas, trámites y destinos municipales se presentan sujetos a ese ámbito; no se universalizan las rutas locales. | Inicio, contenido, fichas y fuentes; validación de destinos y contenido canónico. |
| D01 | Resuelta parcialmente en documentación. Se obtuvo ARCI íntegro y se cotejaron códigos e importes existentes. Se conservaron cinco consultas pendientes, sus dependencias y los fundamentos normativos independientes. No se atribuye texto íntegro a una referencia parcial. | Tabla documental inferior; 72 fuentes registradas. `verificar:fuentes` informa de los pendientes y un HTTP 403, sin ocultarlos. |
| D02 | Corregida. El estado de validación editorial/estructural se diferencia de una revisión jurídica completa. No se inventan revisor, fecha ni certificación. | `app/page.tsx`, `app/library-view.tsx`, `app/source-links.tsx`; pruebas de contenido y avisos visibles. |

## Defectos derivados corregidos durante la revisión

| Hallazgo | Corrección y límite |
| --- | --- |
| Condenas sin verificar producían una calificación leve cerrada. | Se distingue ausencia de condenas computables judicialmente comprobada de falta de comprobación, antecedentes policiales o documentación incompleta. El número debe ser entero no negativo. |
| Violencia ajena al apoderamiento llevaba directamente a hurto. | Se permite comprobar fuerza para distinguir hurto y robo con fuerza; se conserva la posible infracción autónoma. La cuantía sigue accesible en el recorrido correspondiente. |
| Parentesco desconocido o respuestas de un vínculo anterior podían cerrar la excusa familiar. | Se pide relación, parentesco, convivencia o separación cuando procede. Datos ocultos de un vínculo anterior no activan el art. 268. |
| La copia de la ficha incluía todas las opciones y perdía valores de campos. | Lectura de controles reales seleccionados, cantidades y enlaces, con los datos pendientes expresos. Verificación en el navegador y portapapeles. |
| Permiso 007 clasificaba genéricamente el recurso como vía administrativa con multa fija. | Se mantiene comprobación pendiente de firmeza/ejecutividad, conocimiento y suspensión; no se asignan automáticamente 500/250 euros ni se descarta el art. 384. |
| Permiso 006 confundía notificación edictal con falta de conocimiento y retirada inmediata. | Se comprueban otros medios de conocimiento y la ejecutividad administrativa. La retirada material se condiciona a orden de la Jefatura conforme al art. 37.2 RGCond. |
| El contenido estático de respeto/desobediencia no seguía las condiciones del resolutor. | Se alinean ficha, resumen y explicación con las funciones de protección y los requisitos del requerimiento legítimo. |

## Fuentes documentales, dependencias y bloqueos reales

Se buscaron las publicaciones institucionales y se revisaron los documentos locales pertinentes. No se eludieron controles de acceso. Un enlace accesible, una memoria o un CSV de cotejo no sustituyen al documento íntegro.

| Fuente | Resultado de acceso | Dependencias y tratamiento |
| --- | --- | --- |
| AN-SRC-023 · Orden de 25/09/1996 | Texto oficial íntegro pendiente. Se localizó referencia oficial al DOGV 2850 de 17/10/1996, base 2661/1996; no se presenta como texto de la orden ni se conserva un ELI defectuoso. | Identificación canina y sus requisitos técnicos. Se mantienen los fundamentos independientes de la Ley valenciana 2/2023 y la necesidad de comprobar el hecho; no se añaden requisitos técnicos de la orden no leída. |
| TR-ITV-SRC-007 · ARCI | **Obtenido íntegro sin autenticación** desde la descarga pública DGT. Cabecera Madrid, 07/10/2026; hoja ARCI_20261007. Se conserva el XLS original y su huella. | Se cotejaron 20 casos de código fijo originales de ITV/permisos/seguro, incluidos los dos códigos SOA, y las opciones de alcohol. Los códigos e importes fijos cotejados coincidieron. El caso 007 pasa después a pendiente por sus presupuestos jurídicos. No se afirma una comparación exhaustiva de todas las filas o apartados SDA del fichero. |
| TR-PERM-SRC-004 · DGT 12/C-105 | Texto íntegro pendiente; no se identificó PDF DGT público verificable. | Permisos 006 y 007. El art. 384 CP, RGCond 1.1/37.2 y la Circular FGE 10/2011, apartado X/conclusión 13, permiten condiciones independientes sobre ejecutividad y conocimiento. No se reconstruye ni se atribuye contenido desconocido a 12/C-105. |
| SP-SRC-SES-10-2025 | Texto íntegro pendiente. Una resolución oficial de Interior confirma la instrucción de 15/09/2025 sobre detención policial; la comprobación HTTP automatizada de esa resolución devolvió 403. | Garantías y práctica de la detención. Las reglas incluidas se apoyan en LECrim y LO 5/2000. La resolución no se usa como protocolo íntegro ni como instrucción de VioGén. |
| ALC-SRC-FISCALIA-VMP · Dictamen FGE 2/2021 | Texto íntegro pendiente. El anterior enlace a una nota redirige a autenticación. La memoria institucional accesible confirma existencia y objeto, sin reproducir el dictamen completo. | Encaje penal de vehículos y VMP. Se conservan normativa y clasificación técnica independientes; no se incorporan conclusiones nuevas del dictamen desconocido. |
| TR-SOA-SRC-006 · SANC 2026/13 | Publicación oficial directa pendiente. Existe PDF local de 12 páginas; el CSV de cotejo no equivale al documento público. | Régimen operativo del seguro. La existencia del archivo local no se etiqueta como certificación de origen o vigencia. Se conservan referencias legales y el cotejo de códigos ARCI donde se ha realizado. |

ARCI original: [ARCI_20261007.xls](evidencias/correccion-integral-20261030/ARCI_20261007.xls), 664.064 bytes. SHA-256: `fe5f6dcb8cb75976e206a6bc1573d7f8a94933d00ea428b9cb54002c56c62f5a`.

Descarga oficial: [DGT · XLS ARCI](https://sede.dgt.gob.es/export/sites/dgt/.galleries/multas/ARCI/Guia-codificada-de-infracciones-actualizada-01-10-2026.xls). La fecha del nombre de descarga es 01/10/2026; la fecha de cabecera y de hoja del contenido es 07/10/2026. El archivo se conserva sin modificación.

Trazabilidad del cotejo de códigos (filas contadas desde 1 en la hoja): VEH 10.1 5A/5B/5F, filas 850/851/855; CON 12.4 5B, 655; CON 1.1 5A/5B/5C/5D/5E, 643/644/645/646/647; SOA 2.1 5N/5O, 830/831. Opciones de alcohol CIR 20.1 en 70–81 y CIR 21.1 5F en 82. La comparación no modificó tarifas ni el cálculo de alcoholemia.

Bloqueos agrupados: falta de cuatro textos íntegros pedidos inicialmente (orden canina, 12/C-105, SES y dictamen FGE), publicación directa adicional SANC 2026/13 y respuesta HTTP 403 de una referencia parcial. ARCI deja de ser un bloqueo. Ninguno de esos pendientes se oculta convirtiendo una comprobación técnica en certificación jurídica. El acceso pleno a los documentos pendientes permitiría completar su revisión específica.

## Verificación técnica

Entorno: Node 24.19.0 y npm 11.17.0. Sin nuevas dependencias de la aplicación ni modificaciones de su bloqueo de paquetes. Lectura del XLS antiguo mediante xlrd temporal, fuera de las dependencias de la aplicación.

| Comprobación | Resultado |
| --- | --- |
| `npm run contenido:sincronizar` | Correcto: 102 casos y 11 PDF. Artefacto generado sincronizado. |
| `npm run validar:contenido` | Correcto: 102 casos, 72 fuentes, 16 conceptos de Seguridad Pública, 7 áreas VMP/8 ejemplos/14 reglas, 15 controles de establecimientos y 5 rutas de urbanismo. Conserva 5 consultas documentales pendientes. |
| `npm run lint` | Correcto. |
| `tsc --noEmit --incremental false` | Correcto. |
| `npm test` | **512 pruebas correctas; 0 fallos, omitidas o canceladas.** Incluye la compilación de prueba. |
| Regresión adicional de permisos tras ajustar la retirada a orden de Jefatura | 4 correctas; 0 fallos. Contenido regenerado y vuelto a validar. |
| `npm run build:pages` con `PAGES_BUILD=true` y repositorio configurado | Correcto: exportación estática Next 16.2.6, tres páginas, prefijo del repositorio y recursos en `out/`. |
| `npm run verificar:fuentes` | **Salida 1 documentada:** 65 enlaces HTTP correctos, 5 consultas pendientes y un HTTP 403 en la referencia SES. No equivale a una prueba técnica totalmente satisfactoria ni se ha silenciado. |
| Revisión de cambios | `git diff --check` sin errores de espacios; no se incluyen dependencias temporales, compilaciones ni registros de trabajo. |

Los primeros intentos confinados de Bash/SWC y resolución de React fallaron por el entorno de Windows. Las ejecuciones completas fuera de ese confinamiento pasaron; no se alteraron las pruebas para ocultar ese problema ambiental. Las expectativas anteriores de texto se ajustaron a los nuevos límites y los casos cerrados utilizan hechos explícitamente comprobados; se mantienen regresiones específicas de datos desconocidos.

## Comprobación real de la interfaz

Se completaron 70 comprobaciones de navegador asistidas, con cero errores de consola: escritorio de 1367 × 900 CSS y móvil de 390 × 844 CSS, sin desbordamiento horizontal. Son comprobaciones de interfaz adicionales, no 70 pruebas automáticas nuevas.

- E01: menor de 16 con acto físico sin filtro de consentimiento; arts. 181, 182 y 183 según conducta; adulto con consentimiento pendiente; cambio de recorrido y limpieza.
- E02/E07: domicilio y tres estados de fianza; protección bajo 14, régimen 14–17, mayoría de edad y edad pendiente; lectura de las garantías de 24 horas.
- E06: ejercicio actual frente a razón de funciones y protección de la seguridad; ausencia de encaje automático en 37.4.
- E09/E10: lugares del robo, arma presente/uso pendiente/no/sí, limpieza; hurto, fuerza, apropiación 253, administración 252, apropiación 254 y daños 263/266/267, agravaciones y condenas comprobadas o pendientes.
- E12: siete destinos abiertos mediante búsqueda sin acentos y en mayúsculas tanto en escritorio como en móvil.
- E13: entrada vacía, inválida, confirmación, lectura 0,65, cambio de vehículo/conductor/metrología y eliminación de un resultado obsoleto.
- E14/E15: fecha de hechos y reforma; copia de selección real, importe y fianza desconocida sin alternativas no marcadas.

Capturas inspeccionadas: [alcohol móvil pendiente](evidencias/correccion-integral-20261030/alcohol-movil-pendiente.jpg), [alcohol escritorio](evidencias/correccion-integral-20261030/alcohol-escritorio.jpg), [patrimonio móvil pendiente](evidencias/correccion-integral-20261030/patrimonio-movil-pendiente.jpg).

## Referencias jurídicas y documentales principales

Se consultaron fuentes institucionales para las condiciones de las ramas modificadas, sin atribuir autenticidad plena a los documentos pendientes.

- [Código Penal consolidado](https://www.boe.es/eli/es/lo/1995/11/23/10/con): amenazas, libertad sexual, patrimonio, daños, excusa familiar y autoridad; artículos concretos enlazados por cada supuesto.
- [LECrim consolidada](https://www.boe.es/eli/es/rd/1882/09/14/(1)/con): arts. 490–495, 105 y 520.
- [LO 4/2015](https://www.boe.es/eli/es/lo/2015/03/30/4/con): arts. 16, 36.6 y 37.4.
- [LO 5/2000](https://www.boe.es/eli/es/lo/2000/01/12/5/con): arts. 1, 3 y 17.
- [LO 1/2026](https://www.boe.es/eli/es/lo/2026/04/08/1): entrada en vigor el 10/04/2026 y tratamiento temporal.
- [Circular FGE 10/2011](https://www.boe.es/buscar/doc.php?id=FIS-C-2011-00010): únicamente apartado X y conclusión 13 para conocimiento/ejecutividad en pérdida de vigencia. No se adoptan como actuales otros procedimientos históricos de la circular.
- [RGCond, RD 818/2009](https://www.boe.es/eli/es/rd/2009/05/08/818/con): arts. 1.1 y 37.2.
- [Ley valenciana 2/2023](https://www.boe.es/eli/es-vc/l/2023/03/13/2/con): deberes y régimen sancionador de identificación, con comprobación del hecho.
- [RGCirculación, RD 1428/2003](https://www.boe.es/eli/es/rd/2003/11/21/1428/con): comprobaciones de alcohol y límites del cálculo aislado.
- [DGT · página de descarga ARCI](https://www.dgt.es/nuestros-servicios/para-ayuntamientos-y-otras-administraciones/intermediacion-de-datos-y-descarga-de-ficheros/descarga-de-ficheros-move-padron-y-arci/index.html).
- [Interior · referencia SES 10/2025](https://www.interior.gob.es/opencms/documentacion/Portal-de-Transparencia/ResolucionesDenegatorias_2025/4T/001-108163.pdf): referencia parcial; HTTP 403 en la comprobación automatizada.
- [Fiscalía · memoria con referencia al Dictamen 2/2021](https://www.fiscal.es/memorias/memoria2022/FISCALIA_SITE/capitulo_III/cap_III_5_2.html): referencia parcial accesible.

## Publicación y cierre

La rama se entrega mediante una única PR con este informe y el mapa de entradas. La instrucción posterior del usuario autoriza su integración y publicación. El cierre exige: commit enviado, PR integrada, flujo de Pages terminado correctamente y comprobación de la URL pública con carga de recursos y funcionamiento de búsqueda y controles. Solo después se solicita el apagado normal del sistema, sin forzar el cierre de aplicaciones con datos pendientes. Los identificadores y resultados remotos finales se incorporan a la descripción de la PR.
