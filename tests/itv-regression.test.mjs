import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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

test("biblioteca y actualización conservan el modo seguro", async () => {
  const files = await Promise.all(["app/page.tsx", "worker/index.ts", "data/itv.ts"].map((name) => readFile(new URL(`../${name}`, import.meta.url), "utf8")));
  const surface = files.join("\n");
  assert.doesNotMatch(surface, /reindexar|reindexación|ejecutar.*python|subir documento|eliminar documento|sustituir archivo/i);
  assert.doesNotMatch(surface, /localStorage\.(?:clear|removeItem)/);
  assert.match(files[1], /no-store, no-cache, must-revalidate/);
});
