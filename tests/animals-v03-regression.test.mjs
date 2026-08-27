import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});

after(async () => vite.close());

const expectedSources = {
  "AN-OP-001": ["AN-SRC-018", "AN-SRC-023"],
  "AN-OP-002": ["OTA-TORRENT"],
  "AN-OP-003": ["AN-SRC-004", "AN-SRC-005", "AN-SRC-027"],
  "AN-OP-004": ["AN-SRC-004", "AN-SRC-005", "AN-SRC-027"],
  "AN-OP-005": ["AN-SRC-004", "AN-SRC-005", "AN-SRC-027"],
  "AN-OP-006": ["AN-SRC-004", "AN-SRC-005", "AN-SRC-027"],
  "AN-OP-007": ["AN-SRC-004", "AN-SRC-005", "AN-SRC-027"],
  "AN-OP-008": ["AN-SRC-004", "AN-SRC-005", "AN-SRC-027"],
  "AN-OP-009": ["AN-SRC-004", "AN-SRC-005", "AN-SRC-027"],
  "AN-OP-010": ["AN-SRC-018", "AN-SRC-026"],
  "AN-OP-011": ["AN-SRC-018", "AN-SRC-026"],
  "AN-OP-012": ["AN-SRC-018", "AN-SRC-007"],
  "AN-OP-013": ["OCC-TORRENT"],
  "AN-OP-014": ["OTA-TORRENT", "AN-SRC-018"],
  "AN-OP-015": ["OTA-TORRENT", "AN-SRC-001", "AN-SRC-016"],
  "AN-OP-016": ["OTA-TORRENT", "AN-SRC-018", "AN-SRC-007"],
  "AN-OP-017": ["AN-SRC-018"],
  "AN-OP-018": ["AN-SRC-018"],
  "AN-OP-019": ["AN-SRC-018"],
};

const escapeHtml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#x27;");

test("conserva los 19 casos y solo modifica las advertencias auditadas", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { warningReplacements } = await vite.ssrLoadModule("/data/warnings.ts");
  const v02 = JSON.parse(await readFile(path.join(root, "data/paquete_animales_v0_2_validado.json"), "utf8"));
  assert.equal(v02.casos.length, 16);
  assert.equal(cases.length, 19);
  assert.deepEqual(cases.slice(16).map((item) => item.id), ["AN-OP-017", "AN-OP-018", "AN-OP-019"]);
  const changedIds = Object.keys(warningReplacements);
  assert.deepEqual(changedIds, ["AN-OP-002", "AN-OP-003", "AN-OP-006", "AN-OP-007", "AN-OP-010", "AN-OP-012", "AN-OP-013", "AN-OP-014", "AN-OP-015", "AN-OP-016", "AN-OP-018", "AN-OP-019"]);
  assert.deepEqual(cases.filter((item) => !changedIds.includes(item.id)).map((item) => item.id), ["AN-OP-001", "AN-OP-004", "AN-OP-005", "AN-OP-008", "AN-OP-009", "AN-OP-011", "AN-OP-017"]);
  for (const item of cases) {
    if (Object.hasOwn(warningReplacements, item.id)) assert.deepEqual(item.advertencias, warningReplacements[item.id], item.id);
  }
  for (const original of v02.casos) {
    const current = cases.find((item) => item.id === original.id);
    const originalSubstance = structuredClone(original);
    const currentSubstance = structuredClone(current);
    delete originalSubstance.advertencias;
    delete currentSubstance.advertencias;
    assert.deepEqual(currentSubstance, originalSubstance, `${original.id}: cambió un dato distinto de advertencias`);
  }
});

test("audita caso por caso que las fuentes coinciden y se resuelven sin fallback", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { resolveCaseSources } = await vite.ssrLoadModule("/data/sources.ts");
  for (const item of cases) {
    assert.deepEqual(item.fuentes, expectedSources[item.id], item.id);
    assert.deepEqual(resolveCaseSources(item.fuentes).map((source) => source.id), expectedSources[item.id], item.id);
  }
});

test("AN-OP-006 renderiza exactamente sus tres fuentes y ninguna OTA", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  const item = cases.find((candidate) => candidate.id === "AN-OP-006");
  const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
  assert.match(html, /Fuentes jurídicas \(3\)/);
  assert.match(html, /Ley 50\/1999/);
  assert.match(html, /Real Decreto 287\/2002/);
  assert.match(html, /Decreto 145\/2000/);
  assert.doesNotMatch(html, /Ordenanza Municipal sobre Tenencia de Animales de Torrent/);
  assert.doesNotMatch(html, /vigente con aplicación condicionada por normativa posterior/i);
});

test("las fichas muestran advertencias operativas visibles y ocultan metadatos internos", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  const { visibleOperationalWarnings } = await vite.ssrLoadModule("/data/warnings.ts");
  for (const item of cases) {
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    for (const warning of visibleOperationalWarnings(item)) assert.ok(html.includes(escapeHtml(warning)), `${item.id}: advertencia ausente`);
    assert.doesNotMatch(html, /clasificacion_repositorio|estado_vigencia_auditoria|criterio_incorporacion|TRANSITORIA \/ CONDICIONADA|vigente con aplicación condicionada por normativa posterior|delta del art\. 17/i);
  }
});

test("cumple las comprobaciones operativas obligatorias V0.3.1", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  const render = (id) => renderToStaticMarkup(React.createElement(CaseSheet, { item: cases.find((item) => item.id === id), copied: false, onCopy() {} }));

  assert.match(render("AN-OP-006"), /Comprueba también la correa: debe ser no extensible y de menos de 2 metros/);
  assert.doesNotMatch(render("AN-OP-007"), />Evitar duplicidades[^<]*</i);
  assert.doesNotMatch(render("AN-OP-010"), /en lo compatible/i);
  assert.doesNotMatch(render("AN-OP-013"), /antiguo art\. 65\.1|cuantía municipal vigente/i);
  assert.match(render("AN-OP-016"), /no uses el art\. 65\.6 como encaje principal/i);
  assert.match(render("AN-OP-018"), /Encaje según el supuesto/);
  assert.doesNotMatch(render("AN-OP-019"), /valorar la especialidad/i);
});

test("renderiza los bloques condicionales de forma genérica y sin duplicarlos en Advertencias", async () => {
  const pageSource = await readFile(path.join(root, "app/page.tsx"), "utf8");
  assert.doesNotMatch(pageSource, /AN-OP-012|AN-OP-018/);
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  for (const id of ["AN-OP-012", "AN-OP-018"]) {
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item: cases.find((item) => item.id === id), copied: false, onCopy() {} }));
    const warningsBlock = html.match(/<section class="infosection"><h3><span>7<\/span>Advertencias<\/h3>[\s\S]*?<\/section>/)?.[0] ?? "";
    assert.doesNotMatch(warningsBlock, /GEN-JUR-001|42\.2\.e|42\.2\.f|42\.2\.t|muy grave/i);
  }
});

test("el control futuro marca expresiones ambiguas sin modificar el contenido", async () => {
  const { auditOperationalWarnings } = await vite.ssrLoadModule("/data/warnings.ts");
  const { warningsPendingReview } = await vite.ssrLoadModule("/data/cases.ts");
  assert.deepEqual(warningsPendingReview, []);
  const sample = { id: "FUT-001", advertencias: ["Valorar la especialidad."], datos_adicionales: undefined };
  const before = structuredClone(sample);
  const findings = auditOperationalWarnings([sample]);
  assert.equal(findings.length, 1);
  assert.deepEqual(sample, before);
  assert.equal(findings[0].warning, "Valorar la especialidad.");
});

test("no añade contenido a los otros módulos", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  assert.ok(cases.every((item) => item.modulo === "animales"));
});
