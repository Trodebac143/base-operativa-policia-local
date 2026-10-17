# Revisión operativa VMP/VPL — 17/10/2026

## Alcance y estado

Versión 0.14.1, rama `codex/revision-vmp-vpl-operativa`. Se han preparado mejoras de preguntas, ayudas, fecha local, imágenes oficiales y redacción operativa. El criterio de seguro descrito abajo se ha resuelto por indicación expresa del usuario conforme a la Instrucción DGT SANC 2026/13.

## Discrepancia sancionadora detectada y resuelta

Supuesto: VPL comercializado antes del 22/01/2024, inscrito en el RNV y con etiqueta DGT, que circula en 2026 sin certificado de circulación ni seguro. Antes de esta revisión, `resolveVmpInsurance` interpretaba la exención transitoria del certificado como cumplimiento de un requisito previo del seguro específico y producía `TR-SOA-OP-005` (SDA 5A, 300 €).

La disposición adicional primera.1 de la [Ley 5/2025](https://www.boe.es/buscar/act.php?id=BOE-A-2025-15424#da) supedita la obligación específica al certificado, la inscripción y la etiqueta. El apartado 4.1 (páginas 7–8) de la Instrucción DGT SANC 2026/13, conservada en `public/documentos/`, repite los tres requisitos y considera no denunciable por ese seguro al VPL que no reúna alguno. La disposición transitoria primera del [RD 52/2026](https://www.boe.es/buscar/doc.php?id=BOE-A-2026-2140) permite circular sin certificado a los VMP antiguos hasta el 22/01/2027 y ordena su inscripción temporal; esa excepción de circulación no resuelve expresamente la obligación sancionadora específica. La [DGT explica la inscripción y posible contratación de seguro de los no certificados](https://www.dgt.es/nuestros-servicios/tu-vehiculo/vehiculos-de-movilidad-personal-vmp/), pero esa información general tampoco elimina la discrepancia con el tenor legal y la instrucción sancionadora.

**Criterio aplicado:** se separa `certificateRequired` (exigibilidad documental para circular) de `hasCertificate` (requisito previo del seguro específico VPL). Para el supuesto anterior, el motor ya no propone SDA 5A; explica que la ausencia de certificado permite circular durante el período transitorio, pero impide denunciar por el seguro específico conforme al apartado 4.1 de la instrucción. Se comprueban inscripción y etiqueta por separado. El seguro de los VMP de categoría B, como vehículos a motor a estos efectos, continúa independiente de esos documentos. No se han alterado códigos, cuantías ni absorciones documentales.

La matrícula o identificación DGT **no empieza por Z**: mantiene el formato `M + cuatro cifras + tres letras` (ejemplo oficial `M 0088 CCC`). La Instrucción SANC 2026/13, apartado 2, indica que en el **certificado de inscripción** del VMP no certificado el número de certificación comienza por `Z` en lugar de `B`. La [revista de la DGT](https://revista.dgt.es/es/tramites/2026/0325-n277-tramite-registro-patinetes.shtml) muestra `Z000` como dato de ese campo. La interfaz distingue ambos números junto a la imagen oficial de la etiqueta.

## Criterios conservados

- 25,00 kg permanece en categoría A; la rama usa `mass <= 25` y no se ha modificado.
- Más de 25 kg y hasta 14 km/h permanece en A; más de 14 y hasta 25 km/h, en B.
- Certificado, inscripción, etiqueta y placa se comprueban por separado. La placa se exige en el formulario solo para vehículos certificados.
- Las infracciones documentales mantienen la absorción 5A → 5B → 5C.

## Fuentes aplicadas

- [Ley 5/2025, disposición adicional primera](https://www.boe.es/buscar/act.php?id=BOE-A-2025-15424#da).
- [RDL 8/2004, texto consolidado](https://www.boe.es/buscar/act.php?id=BOE-A-2004-18911).
- [RD 52/2026, artículo 22 bis y anexos XX y XXI; disposición transitoria primera](https://www.boe.es/buscar/doc.php?id=BOE-A-2026-2140).
- Instrucción DGT SANC 2026/13, PDF de la Biblioteca local, apartados 2 y 4.1 (páginas 5–9).
- [DGT, vehículos de movilidad personal](https://www.dgt.es/nuestros-servicios/tu-vehiculo/vehiculos-de-movilidad-personal-vmp/).

## Validación

- `node --test --test-concurrency=1 tests/*.test.mjs`: 443 pruebas superadas, 0 fallos.
- `npm run validar:contenido`: correcto; siete áreas VMP y ocho casos prácticos.
- `npx eslint . --ignore-pattern dist --ignore-pattern .next` y `npx tsc --noEmit`: correctos.
- `npx next build`, `scripts/build-verified.sh` y `npm run build:pages`: correctos; exportación estática generada.
- Revisión visual de móvil/tableta y escritorio en el servidor local: siete áreas, imágenes, fecha compartida, flujo documental y resultado de seguro transitorio comprobados. Se verificó el caso de VMP antiguo inscrito y etiquetado, sin certificado ni seguro durante el período transitorio: no sale denuncia por seguro VPL ni por certificado.
- `git diff --check`: sin errores de espacios; únicamente avisos de conversión de fin de línea LF/CRLF propios del checkout de Windows.
