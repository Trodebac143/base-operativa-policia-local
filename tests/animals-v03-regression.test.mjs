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
  const animalCases = cases.filter((item) => item.modulo === "animales");
  assert.equal(animalCases.length, 19);
  assert.deepEqual(animalCases.slice(16).map((item) => item.id), ["AN-OP-017", "AN-OP-018", "AN-OP-019"]);
  const changedIds = Object.keys(warningReplacements);
  assert.deepEqual(changedIds, ["AN-OP-002", "AN-OP-003", "AN-OP-006", "AN-OP-007", "AN-OP-010", "AN-OP-012", "AN-OP-013", "AN-OP-014", "AN-OP-015", "AN-OP-016", "AN-OP-018", "AN-OP-019"]);
  assert.deepEqual(animalCases.filter((item) => !changedIds.includes(item.id)).map((item) => item.id), ["AN-OP-001", "AN-OP-004", "AN-OP-005", "AN-OP-008", "AN-OP-009", "AN-OP-011", "AN-OP-017"]);
  for (const item of animalCases) {
    if (Object.hasOwn(warningReplacements, item.id) && item.id !== "AN-OP-012") assert.deepEqual(item.advertencias, warningReplacements[item.id], item.id);
  }
  for (const original of v02.casos) {
    const current = cases.find((item) => item.id === original.id);
    for (const field of ["norma", "articulo", "calificacion", "rango_min", "rango_max", "competencia_denuncia", "competencia_resuelve", "fuentes", "fichas_juridicas", "estado"]) {
      assert.deepEqual(current[field], original[field], `${original.id}: cambió ${field}`);
    }
  }
});

test("audita caso por caso que las fuentes coinciden y se resuelven sin fallback", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { resolveCaseSources } = await vite.ssrLoadModule("/data/sources.ts");
  for (const item of cases.filter((candidate) => candidate.modulo === "animales")) {
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
  assert.match(render("AN-OP-016"), /no cierres la actuación con esta ficha/i);
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

test("mantiene Animales y añade los bloques validados de Seguridad Vial", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  assert.equal(cases.filter((item) => item.modulo === "animales").length, 19);
  assert.equal(cases.filter((item) => item.modulo === "seguridad_vial").length, 31);
  assert.ok(cases.every((item) => ["animales", "seguridad_vial"].includes(item.modulo)));
});

test("AN-OP-016 conserva el encaje administrativo y no activa relevancia penal en el supuesto base", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  const item = cases.find((candidate) => candidate.id === "AN-OP-016");
  const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
  assert.equal(item.alerta_penal, false);
  assert.equal(item.referencia_penal, null);
  assert.equal(item.competencia_resuelve, "Ayuntamiento de Torrent");
  assert.match(html, /Competencia administrativa \/ órgano sancionador/);
  assert.match(html, /Ayuntamiento de Torrent/);
  assert.match(html, /únicamente cuando las deficiencias higiénicas, olores o molestias no han causado una afectación grave/i);
  assert.match(html, /lesiones, enfermedad, deterioro relevante o signos compatibles con maltrato grave/i);
  assert.doesNotMatch(html, /<section class="penal">|Posible relevancia penal/i);
});

test("el dataset penal común existe y contiene los dos preceptos literales validados", async () => {
  const { cases, penalBranchStatus } = await vite.ssrLoadModule("/data/cases.ts");
  const { penalArticles, ANIMAL_MALTREATMENT_PENAL_DESTINATION } = await vite.ssrLoadModule("/data/penal.ts");
  const item = cases.find((candidate) => candidate.id === "AN-OP-016");
  const conditional = item.datos_adicionales.relevancia_penal_condicional;
  assert.equal(conditional.penal_article_id, "CP-340-BIS");
  assert.equal(item.destino_diligencias_penales, ANIMAL_MALTREATMENT_PENAL_DESTINATION);
  const animalPrecepts = penalArticles.filter((precept) => precept.id.startsWith("CP-340"));
  assert.equal(animalPrecepts.length, 2);
  assert.deepEqual(animalPrecepts.map((precept) => precept.id).sort(), ["CP-340-BIS", "CP-340-TER"]);
  for (const precept of animalPrecepts) {
    assert.equal(precept.estado, "validado");
    assert.equal(precept.fuente_id, "AN-SRC-007");
    assert.ok(precept.texto_literal.trim().length > 0);
  }
  assert.match(penalArticles.find((precept) => precept.id === "CP-340-BIS").texto_literal, /^1\. Será castigado[\s\S]*4\. Si las lesiones producidas[\s\S]*tenencia de animales\.$/);
  assert.deepEqual(penalBranchStatus.find((branch) => branch.caseId === "AN-OP-016"), {
    caseId: "AN-OP-016",
    type: "condicional",
    penalArticleId: "CP-340-BIS",
    status: "VALIDADA"
  });
});

test("audita los 19 casos y deja AN-OP-012 y AN-OP-016 como relevancia condicional", async () => {
  const { cases, penalMessagesPendingReview, penalBranchStatus } = await vite.ssrLoadModule("/data/cases.ts");
  const { rules } = await vite.ssrLoadModule("/data/rules.ts");
  assert.equal(cases.filter((item) => item.modulo === "animales").length, 19);
  const animalCases = cases.filter((item) => item.modulo === "animales");
  assert.deepEqual(animalCases.filter((item) => item.alerta_penal).map((item) => item.id), []);
  assert.deepEqual(animalCases.filter((item) => item.datos_adicionales?.relevancia_penal_condicional?.activa).map((item) => item.id), ["AN-OP-012", "AN-OP-016"]);
  const abandonment = cases.find((item) => item.id === "AN-OP-012");
  assert.equal(abandonment.penal_article_id, null);
  assert.equal(abandonment.alerta_penal, false);
  assert.equal(abandonment.datos_adicionales.relevancia_penal_condicional.penal_article_id, "CP-340-TER");
  assert.ok(rules.some((rule) => rule.id === "GEN-JUR-001" && /non bis in idem/i.test(rule.nombre)));
  assert.ok(rules.some((rule) => rule.id === "GEN-PEN-002" && rule.aplica_a === "todos los módulos" && rule.activo));
  assert.deepEqual(penalMessagesPendingReview, []);
  assert.deepEqual(penalBranchStatus.find((branch) => branch.caseId === "AN-OP-012"), {
    caseId: "AN-OP-012",
    type: "condicional",
    penalArticleId: "CP-340-TER",
    status: "VALIDADA"
  });
});

test("las dos ramas penales activadas muestran el bloque completo en el orden obligatorio", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { rules } = await vite.ssrLoadModule("/data/rules.ts");
  const { resolveValidatedPenalPrecept } = await vite.ssrLoadModule("/data/penal.ts");
  const { ConditionalPenalActivation } = await vite.ssrLoadModule("/app/page.tsx");
  const nonBis = rules.find((rule) => rule.id === "GEN-JUR-001");
  for (const [id, article] of [["AN-OP-012", "340 ter"], ["AN-OP-016", "340 bis"]]) {
    const item = cases.find((candidate) => candidate.id === id);
    const relevance = item.datos_adicionales.relevancia_penal_condicional;
    const precept = resolveValidatedPenalPrecept(relevance.penal_article_id);
    const html = renderToStaticMarkup(React.createElement(ConditionalPenalActivation, { relevance, active: true, onChange() {}, precept, destination: item.destino_diligencias_penales, rule: nonBis }));
    for (const text of ["POSIBLE RELEVANCIA PENAL", `artículo ${article}`, "TEXTO DEL ARTÍCULO", precept.texto_literal, "ACTUACIÓN PENAL", "Destino de las diligencias penales:", "Fiscalía Provincial de Valencia", "Preferencia de la vía penal y principio non bis in idem"]) assert.ok(html.includes(escapeHtml(text)), `${id}: falta ${text.slice(0, 50)}`);
    const ordered = ["POSIBLE RELEVANCIA PENAL", `artículo ${article}`, "TEXTO DEL ARTÍCULO", precept.texto_literal, "ACTUACIÓN PENAL", "Destino de las diligencias penales:", "Preferencia de la vía penal y principio non bis in idem"].map((text) => html.indexOf(escapeHtml(text)));
    assert.deepEqual([...ordered].sort((a, b) => a - b), ordered, `${id}: orden penal incorrecto`);
    assert.doesNotMatch(html, /CP-340-BIS|CP-340-TER|GEN-JUR-001|GEN-PEN-002/i);
    assert.doesNotMatch(html, /valorar (?:posible )?relevancia penal|valorar instrucci[oó]n de diligencias/i);
  }
});

test("la presentación penal es genérica y no expone IDs internos", async () => {
  const pageSource = await readFile(path.join(root, "app/page.tsx"), "utf8");
  assert.doesNotMatch(pageSource, /AN-OP-012|AN-OP-016/);
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  for (const item of cases) {
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    assert.doesNotMatch(html, /AN-(?:OP|JUR|SRC)-|GEN-(?:JUR|PEN|OP)-|CP-[A-Z0-9-]+/i);
  }
});

test("la barrera común impide mostrar identificadores e instrucciones internas", async () => {
  const { visibleTextList, containsInternalInterfaceLanguage } = await vite.ssrLoadModule("/data/visibility.ts");
  const internal = [
    "No mantener AN-OP-016 como encaje principal.",
    "Cambiar de rama y usar caso X.",
    "Resolver desde el dataset penalArticles.",
    "Aplicar CP-340-BIS como ID técnico.",
    "Aplicar GEN-JUR-001."
  ];
  assert.ok(internal.every(containsInternalInterfaceLanguage));
  assert.deepEqual(visibleTextList(["Documenta los hechos.", ...internal]), ["Documenta los hechos."]);
});

test("la rama penal de insalubridad muestra exclusivamente la actuación operativa validada", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { rules } = await vite.ssrLoadModule("/data/rules.ts");
  const { resolveValidatedPenalPrecept } = await vite.ssrLoadModule("/data/penal.ts");
  const { ConditionalPenalActivation } = await vite.ssrLoadModule("/app/page.tsx");
  const item = cases.find((candidate) => candidate.id === "AN-OP-016");
  const relevance = item.datos_adicionales.relevancia_penal_condicional;
  const html = renderToStaticMarkup(React.createElement(ConditionalPenalActivation, {
    relevance,
    active: true,
    onChange() {},
    precept: resolveValidatedPenalPrecept(relevance.penal_article_id),
    destination: item.destino_diligencias_penales,
    rule: rules.find((rule) => rule.id === "GEN-JUR-001")
  }));
  assert.match(html, /Documenta detalladamente el estado del animal y las condiciones en las que se encuentra, mediante fotografías, vídeo y descripción de los hechos/);
  assert.match(html, /Fiscalía Provincial de Valencia — Sección de Medio Ambiente \(protección\/maltrato animal\)/);
  assert.doesNotMatch(html, /No mantener|AN-OP-|cambiar de rama|pasa(?:r)? a la rama|usar caso|dataset|CP-[A-Z0-9-]+|GEN-(?:JUR|PEN|OP)-/i);
});
