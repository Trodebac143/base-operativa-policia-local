import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("integra exactamente siete casos ITV desde datos comunes", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const itv = cases.filter((item) => item.categoria === "seguridad_vial_itv");
  assert.equal(itv.length, 7);
  assert.deepEqual(itv.map((item) => item.id), ["TR-ITV-OP-001", "TR-ITV-OP-002", "TR-ITV-OP-003", "TR-ITV-OP-004", "TR-ITV-OP-005", "TR-ITV-OP-006", "TR-ITV-OP-007"]);
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /TR-ITV-OP-00[1-7]/);
});

test("ARCI, importes, responsable y competencia son los validados", async () => {
  const { itvCases } = await vite.ssrLoadModule("/data/itv.ts");
  const expected = { "TR-ITV-OP-001": ["VEH 10.1 5A", "grave", 200, 100], "TR-ITV-OP-002": ["VEH 10.1 5A", "grave", 200, 100], "TR-ITV-OP-005": ["VEH 10.1 5B", "muy grave", 500, 250], "TR-ITV-OP-006": ["VEH 10.1 5F", "grave", 200, 100] };
  for (const item of itvCases) {
    assert.equal(item.responsable, "Titular o arrendatario a largo plazo inscrito");
    assert.equal(item.competencia_resuelve, "Jefatura Provincial de Tráfico de Valencia");
    assert.match(item.competencia_denuncia, /Policía Local de Torrent.*formulador/);
  }
  for (const [id, values] of Object.entries(expected)) { const item = itvCases.find((candidate) => candidate.id === id); assert.deepEqual([item.codificado, item.calificacion, item.importe_fijo, item.importe_reducido], values); }
  const op3 = itvCases.find((item) => item.id.endsWith("003")).datos_adicionales.encaje_condicional;
  assert.equal(op3[0].calificacion, "sin infracción ITV"); assert.deepEqual([op3[1].codificado, op3[1].importe_fijo, op3[1].importe_reducido], ["VEH 10.1 5C", 200, 100]);
  const op4 = itvCases.find((item) => item.id.endsWith("004")).datos_adicionales.encaje_condicional;
  assert.deepEqual(op4.map((branch) => [branch.codificado, branch.calificacion, branch.importe_fijo, branch.importe_reducido]), [["VEH 10.1 5D", "muy grave", 500, 250], ["VEH 10.1 5E", "grave", 200, 100]]);
});

test("el formato común de tráfico separa obligación, tipificación, literal y medida principal", async () => {
  const { itvCases } = await vite.ssrLoadModule("/data/itv.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  const sanctionable = itvCases.filter((item) => item.es_infraccion_autonoma !== false);
  for (const item of sanctionable) {
    assert.equal(item.norma_infringida, "Reglamento General de Vehículos");
    assert.equal(item.articulo_infringido, "10.1");
    assert.ok(["SÍ", "NO", "CONDICIONADA"].includes(item.inmovilizacion));
    assert.ok(item.motivo_inmovilizacion);
    const variants = item.datos_adicionales?.encaje_condicional?.filter((entry) => entry.calificacion !== "sin infracción ITV") ?? [];
    if (variants.length) for (const entry of variants) {
      assert.ok(entry.textoDenuncia); assert.ok(entry.codificado); assert.ok(entry.tipificacion_articulo);
    } else {
      assert.ok(item.textoDenuncia); assert.ok(item.codificado); assert.ok(item.tipificacion_articulo);
    }
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    assert.match(html, /INFRACCIÓN OBSERVADA/); assert.match(html, /NORMA INFRINGIDA/); assert.match(html, /INMOVILIZACIÓN — (?:SÍ|NO|CONDICIONADA)/);
  }
  const safetyMeasure = itvCases.find((item) => item.id.endsWith("007"));
  assert.equal(safetyMeasure.es_infraccion_autonoma, false);
  assert.equal(safetyMeasure.articulo, "104.1.b");
  const source = await readFile(new URL("../data/itv.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /tipo técnico específico/);
});

test("Seguro Obligatorio integra seis casos y las doce variantes ARCI validadas", async () => {
  const { seguroCases, seguroDecisionTree } = await vite.ssrLoadModule("/data/seguro.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  assert.equal(seguroCases.length, 6);
  const codes = seguroCases.flatMap((item) => item.datos_adicionales?.encaje_condicional?.map((entry) => entry.codificado) ?? [item.codificado]);
  assert.deepEqual(codes, ["SOA 2.1 5F", "SOA 2.1 5G", "SOA 2.1 5H", "SOA 2.1 5I", "SOA 2.1 5J", "SOA 2.1 5K", "SOA 2.1 5L", "SOA 2.1 5M", "SOA 2.1 5N", "SOA 2.1 5O", "SDA DA1 5A", "SDA DA1 5B"]);
  for (const item of seguroCases) {
    assert.match(item.competencia_denuncia, /Policía Local de Torrent/); assert.equal(item.competencia_instruye, "Jefatura Provincial de Tráfico de Valencia — receptor e instructora"); assert.equal(item.competencia_resuelve, "Jefe Provincial de Tráfico de Valencia");
    assert.equal(item.inmovilizacion, "SÍ");
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    assert.match(html, /TEXTO LITERAL PARA EL BOLETÍN/); assert.doesNotMatch(html, /MUY GRAVE|PENDING_|TR-SOA-/);
  }
  assert.ok(Object.keys(seguroDecisionTree.outcomes).includes("SO-NS-04"));
  const source = await readFile(new URL("../data/seguro.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /PENDIENTE_COTEJO_ARCI|pending_arci_row_check|titular; si no inscrito, conductor/i);
});

test("Seguro usa títulos operativos y la matriz común de medidas", async () => {
  const { seguroCases, seguroMeasures } = await vite.ssrLoadModule("/data/seguro.ts");
  const titles = seguroCases.map((item) => item.titulo);
  assert.deepEqual(titles, ["Vehículos convencionales — circulando sin seguro", "Vehículos convencionales — carece de seguro", "VMP que requiere SOA (VMP >25 Kg y Velocidad hasta 25 km/h) — circulando sin seguro", "VMP que requiere SOA (VMP >25 Kg y Velocidad hasta 25 km/h) — carece de seguro", "VPL que requiere SOA (Peso < 25 kg y velocidad hasta 25 km/h O peso > de 25 kg y velocidad hasta 14 km/h) — circulando sin seguro", "VPL que requiere SOA (Peso < 25 kg y velocidad hasta 25 km/h O peso > de 25 kg y velocidad hasta 14 km/h) — carece de seguro"]);
  assert.deepEqual(seguroCases.flatMap((item) => item.medidas), ["TR-MED-SOA-OPERATIVE", "TR-MED-SOA-OPERATIVE", "TR-MED-SOA-OPERATIVE", "TR-MED-SOA-OPERATIVE", "TR-MED-SOA-OPERATIVE", "TR-MED-SOA-OPERATIVE"]);
  const operational = seguroMeasures.find((item) => item.id === "TR-MED-SOA-OPERATIVE");
  assert.match(operational.fundamento, /104\.1\.e/);
  assert.match(operational.fundamento, /105\.1\.d/);
  assert.match(operational.levantamiento, /acreditarse la existencia de un seguro obligatorio en vigor/);
  assert.ok(seguroCases.every((item) => item.medida_operativa?.inmovilizacion.estado === "SÍ"));
  assert.ok(seguroCases.every((item) => item.medida_operativa?.circulacion?.estado === "PROHIBIDA"));
  assert.ok(seguroCases.every((item) => item.medida_operativa?.traslado_deposito?.estado === "SÍ"));
  assert.ok(seguroCases.every((item) => /Art\. 104\.1\.e LSV/.test(item.motivo_inmovilizacion ?? "")));
  const source = await readFile(new URL("../data/seguro.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /vehículo convencional sujeto|VPL sujeto|sin seguro y sin circulación efectiva/i);
});

test("medidas y riesgo grave conservan presupuestos separados", async () => {
  const { itvCases, itvMeasures } = await vite.ssrLoadModule("/data/itv.ts");
  assert.equal(itvMeasures.length, 6);
  assert.deepEqual(itvMeasures.map((item) => item.titulo), ["Comprobación documental ITV", "Advertencia de prohibición o limitación de circulación", "Transporte por medios ajenos", "Inmovilización por riesgo especialmente grave", "Retirada de la vía", "Depósito administrativo"]);
  assert.ok(itvMeasures.every((item) => item.automatica === false));
  for (const id of ["001", "002", "003", "004"]) assert.doesNotMatch(JSON.stringify(itvCases.find((item) => item.id.endsWith(id)).medidas), /IMMOB/);
  assert.match(JSON.stringify(itvCases.find((item) => item.id.endsWith("005"))), /transporte.*medios ajenos/i);
  assert.deepEqual(itvCases.find((item) => item.id.endsWith("007")).medidas, ["TR-MED-IMMOB-104B", "TR-MED-REMOVE-105", "TR-MED-DEPOSIT-105"]);
});

test("cada ficha muestra solo sus fuentes y oculta identificadores internos", async () => {
  const { itvCases } = await vite.ssrLoadModule("/data/itv.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  for (const item of itvCases) {
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    assert.match(html, new RegExp(`Fuentes jurídicas \\(${item.fuentes.length}\\)`));
    assert.doesNotMatch(html, /TR-(?:ITV|MED)-|PENDING_|dataset|comentario técnico/i);
  }
});

test("el árbol resuelve todas sus ramas y enlaza solo casos existentes", async () => {
  const { itvCases, itvDecisionTree } = await vite.ssrLoadModule("/data/itv.ts");
  const targets = new Set([...itvDecisionTree.nodes.map((node) => node.id), ...Object.keys(itvDecisionTree.outcomes)]);
  for (const node of itvDecisionTree.nodes) { assert.ok(targets.has(node.si)); assert.ok(targets.has(node.no)); }
  const caseIds = new Set(itvCases.map((item) => item.id));
  for (const outcome of Object.values(itvDecisionTree.outcomes)) if (outcome.caseId) assert.ok(caseIds.has(outcome.caseId));
});

test("el árbol histórico no tiene acceso, navegación ni componente visible", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/itv.css", import.meta.url), "utf8");
  assert.doesNotMatch(page, /Árbol de decisión|DecisionTreeView|tree-launch|view\.tree|itvDecisionTree|seguroDecisionTree/);
  assert.doesNotMatch(css, /tree-launch|decision-card|reset-tree/);
});

test("biblioteca y actualización conservan el modo seguro", async () => {
  const files = await Promise.all(["app/page.tsx", "worker/index.ts", "data/itv.ts", "data/seguro.ts"].map((name) => readFile(new URL(`../${name}`, import.meta.url), "utf8")));
  const surface = files.join("\n");
  assert.doesNotMatch(surface, /reindexar|reindexación|ejecutar.*python|subir documento|eliminar documento|sustituir archivo/i);
  assert.doesNotMatch(surface, /localStorage\.(?:clear|removeItem)/);
  assert.match(files[1], /no-store, no-cache, must-revalidate/);
});

test("biblioteca documental visible, consultable y sin controles de gestión", async () => {
  const { libraryDocuments } = await vite.ssrLoadModule("/data/documents.ts");
  assert.equal(libraryDocuments.length, 7);
  for (const document of libraryDocuments) await access(new URL(`../public/documentos/${document.archivo}`, import.meta.url));
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /Biblioteca documental/); assert.match(page, /Buscar por título o nombre de archivo/); assert.match(page, /Abrir PDF/);
  assert.doesNotMatch(page, /subir documento|eliminar documento|sustituir archivo|reindexar|ejecutar.*python/i);
});

test("la carencia comprobada de seguro resuelve circulación prohibida, inmovilización y depósito", async () => {
  const { seguroCases } = await vite.ssrLoadModule("/data/seguro.ts");
  const { itvCases } = await vite.ssrLoadModule("/data/itv.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  const seguro = renderToStaticMarkup(React.createElement(CaseSheet, { item: seguroCases[0], copied: false, onCopy() {} }));
  const caducada = renderToStaticMarkup(React.createElement(CaseSheet, { item: itvCases[0], copied: false, onCopy() {} }));
  const negativa = renderToStaticMarkup(React.createElement(CaseSheet, { item: itvCases[4], copied: false, onCopy() {} }));
  assert.match(seguro, /MEDIDA SOBRE EL VEHÍCULO/); assert.match(seguro, /CIRCULACIÓN — PROHIBIDA/); assert.match(seguro, /Art\. 3\.1\.a del Real Decreto Legislativo 8\/2004/); assert.match(seguro, /INMOVILIZACIÓN — SÍ/); assert.match(seguro, /Art\. 104\.1\.e LSV y art\. 72\.2\.e/); assert.match(seguro, /LUGAR DE INMOVILIZACIÓN/); assert.match(seguro, /Art\. 104\.5 LSV y art\. 72\.4/); assert.match(seguro, /TRASLADO A DEPÓSITO — SÍ/); assert.match(seguro, /Art\. 105\.1\.d LSV y art\. 73\.1\.d/); assert.match(seguro, /ADEMÁS, SI NO EXISTE LUGAR ADECUADO/); assert.match(seguro, /Art\. 105\.1\.c LSV y art\. 73\.1\.c/); assert.match(seguro, /RÉGIMEN ESPECÍFICO DEL SEGURO/); assert.match(seguro, /Art\. 3\.1\.b del Real Decreto Legislativo 8\/2004/);
  assert.doesNotMatch(seguro, /INMOVILIZACIÓN — CONDICIONADA|régimen sectorial específico|normativa sectorial/i);
  assert.match(caducada, /INMOVILIZACIÓN — NO/); assert.match(caducada, /No procede inmovilización por el mero hecho de tener la ITV caducada/); assert.doesNotMatch(caducada, /105\.1\.[cd]/);
  assert.match(negativa, /transporte mediante medios ajenos/); assert.match(negativa, /no es por sí solo retirada administrativa/);
  for (const item of [...itvCases, ...seguroCases]) {
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    assert.doesNotMatch(html, /valorar inmovilización/i);
  }
});

test("las siete salidas de control contienen la conclusión operativa exigida", async () => {
  const { itvCases } = await vite.ssrLoadModule("/data/itv.ts");
  const { seguroCases } = await vite.ssrLoadModule("/data/seguro.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  const render = (item) => renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
  const outputs = [
    render(itvCases.find((item) => item.id === "TR-ITV-OP-001")),
    render(itvCases.find((item) => item.id === "TR-ITV-OP-003")),
    render(itvCases.find((item) => item.id === "TR-ITV-OP-005")),
    render(seguroCases.find((item) => item.id === "TR-SOA-OP-001")),
    render(seguroCases.find((item) => item.id === "TR-SOA-OP-002")),
    render(seguroCases.find((item) => item.id === "TR-SOA-OP-001")),
    render(itvCases.find((item) => item.id === "TR-ITV-OP-007"))
  ];
  assert.match(outputs[0], /No procede inmovilización por el mero hecho de tener la ITV caducada/);
  assert.match(outputs[1], /ITV desfavorable.*no equivale por sí sola a inmovilización/);
  assert.match(outputs[2], /ITV negativa.*prohibida la circulación autopropulsada.*transporte mediante medios ajenos/);
  assert.match(outputs[3], /CIRCULACIÓN — PROHIBIDA.*INMOVILIZACIÓN — SÍ.*TRASLADO A DEPÓSITO — SÍ/s);
  assert.match(outputs[4], /Art\. 3\.1\.b del Real Decreto Legislativo 8\/2004/);
  assert.match(outputs[5], /La medida se levanta al acreditarse seguro obligatorio en vigor y cesar la causa/);
  assert.match(outputs[6], /Si la causa no cesa: retirada y depósito, aunque exista lugar adecuado/);
});
