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

test("conserva íntegros los 16 casos V0.2 y añade solo 017/018/019", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const v02 = JSON.parse(await readFile(path.join(root, "data/paquete_animales_v0_2_validado.json"), "utf8"));
  assert.equal(v02.casos.length, 16);
  assert.deepEqual(cases.slice(0, 16), v02.casos);
  assert.equal(cases.length, 19);
  assert.deepEqual(cases.slice(16).map((item) => item.id), ["AN-OP-017", "AN-OP-018", "AN-OP-019"]);
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

test("las fichas muestran advertencias específicas y ocultan metadatos internos", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  for (const item of cases) {
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    for (const warning of item.advertencias) assert.ok(html.includes(escapeHtml(warning)), `${item.id}: advertencia ausente`);
    assert.doesNotMatch(html, /clasificacion_repositorio|estado_vigencia_auditoria|criterio_incorporacion|TRANSITORIA \/ CONDICIONADA|vigente con aplicación condicionada por normativa posterior|delta del art\. 17/i);
  }
});
