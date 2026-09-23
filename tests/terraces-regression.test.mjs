import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { APP_VERSION } from "../data/version.ts";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const vite = await createServer({ appType: "custom", configFile: false, root: rootPath, resolve: { alias: { "@": rootPath } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("Terrazas publica quince bloques JSON sobre el ID real de Policía Administrativa", async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  const terraces = cases.filter((item) => item.categoria === "policia_administrativa_terrazas");
  assert.equal(terraces.length, 15);
  assert.deepEqual(terraces.map((item) => item.id).sort(), Array.from({ length: 15 }, (_, index) => `TER-OP-${String(index + 1).padStart(3, "0")}`));
  assert.ok(terraces.every((item) => item.modulo === "policia_administrativa" && item.estado === "validado"));
  assert.ok(terraces.every((item) => item.fuentes.length === 1 && item.fuentes[0] === "TER-TORRENT"));
  assert.ok(terraces.every((item) => Array.isArray(item.advertencias)));
  assert.ok(terraces.every((item) => item.datos_adicionales?.terrazas?.fields?.length && item.datos_adicionales?.terrazas?.outcomes?.length));
  assert.ok(terraces.every((item) => item.datos_adicionales.terrazas.information?.length), "todas las fichas incluyen referencia operativa");
});

test("las variantes sancionadoras preservan artículos, importes y límites literales", async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  const byId = new Map(cases.map((item) => [item.id, item]));
  const variants = (id) => byId.get(id).datos_adicionales.terrazas.outcomes.filter((item) => item.classification).map((item) => [item.classification, item.article, item.amount]);
  assert.deepEqual(variants("TER-OP-001"), [["MUY GRAVE", "27.3.b", 600], ["MUY GRAVE", "27.3.b", 600]]);
  assert.deepEqual(variants("TER-OP-002"), [["LEVE", "27.1.b", 150], ["GRAVE", "27.2.b", 300], ["MUY GRAVE", "27.3.j", 600]]);
  assert.deepEqual(variants("TER-OP-003"), [["LEVE", "27.1.c", 150], ["GRAVE", "27.2.i", 300]]);
  assert.deepEqual(variants("TER-OP-004"), [["GRAVE", "27.2.d", 300], ["MUY GRAVE", "27.3.d", 600]]);
  assert.deepEqual(variants("TER-OP-005"), [["GRAVE", "27.2.h", 300], ["MUY GRAVE", "27.3.h", 600]]);
  assert.match(byId.get("TER-OP-005").datos_adicionales.terrazas.final_note, /10 %.*25 %/);
  assert.match(byId.get("TER-OP-009").articulo, /14\.6/);
});

test("el motor impide degradaciones y conclusiones automáticas no respaldadas", async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  const byId = new Map(cases.map((item) => [item.id, item]));
  const protection = byId.get("TER-OP-006").datos_adicionales.terrazas;
  assert.equal(protection.fields.find((field) => field.id === "rastrillo_valla").type, "choice");
  assert.ok(protection.outcomes.find((item) => item.id === "ausente_rastrillo").when.some((condition) => condition.equals === "no"));
  const insurance = byId.get("TER-OP-007").datos_adicionales.terrazas;
  assert.equal(insurance.outcomes.find((item) => item.id === "pendiente").status, "pendiente");
  assert.equal(insurance.outcomes.find((item) => item.id === "estufas").article, "27.1.f");
  const nuisances = byId.get("TER-OP-010").datos_adicionales.terrazas;
  assert.equal(nuisances.outcomes.find((item) => item.id === "grave").unless.length, 3);
  const residual = byId.get("TER-OP-015").datos_adicionales.terrazas;
  assert.equal(residual.fields.some((field) => field.id === "hechos_especificos"), false);
  assert.equal(residual.fields.some((field) => field.type === "text"), false);
  assert.equal(nuisances.fields.some((field) => field.type === "text"), false);
  assert.equal(byId.get("TER-OP-012").datos_adicionales.terrazas.fields.some((field) => field.type === "text"), false);
  assert.doesNotMatch(cases.filter((item) => item.categoria === "policia_administrativa_terrazas").map((item) => item.titulo).join(" "), /ocultación|tres infracciones/i);
});

test("la fuente central abre directamente el PDF oficial y la versión publicada usa la fuente canónica", async () => {
  const sources = await readJson("contenido/juridico/fuentes.json");
  const source = sources.find((item) => item.id === "TER-TORRENT");
  assert.match(source.urlOficial, /^https:\/\/www\.torrent\.es\/.+\.pdf$/i);
  const packageMetadata = await readJson("package.json");
  assert.equal(packageMetadata.version, APP_VERSION);
});

test("el motor resuelve porcentajes, poda respuestas y mantiene exclusiones jurídicas", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { resolveTerraceState, updateTerraceAnswer } = await vite.ssrLoadModule("/app/terraces.tsx");
  const byId = new Map(cases.map((item) => [item.id, item]));
  const outcomeIds = (id, answers) => resolveTerraceState(byId.get(id), answers).outcomes.map((item) => item.id);

  assert.deepEqual(outcomeIds("TER-OP-002", { horario_distinto: "no", tramo: "menos_media" }), []);
  assert.deepEqual(outcomeIds("TER-OP-002", { horario_distinto: "no", dia: "domingo_jueves", tramo: "menos_media" }), ["leve"]);
  assert.deepEqual(outcomeIds("TER-OP-002", { horario_distinto: "si", tramo: "mas_hora" }), []);
  assert.deepEqual(outcomeIds("TER-OP-002", { horario_distinto: "si", hora_limite: "23:30", tramo: "mas_hora" }), ["muy_grave"]);
  assert.deepEqual(outcomeIds("TER-OP-004", { superficie_autorizada: "100" }), []);
  assert.deepEqual(outcomeIds("TER-OP-004", { superficie_autorizada: "100", superficie_ocupada: "120" }), ["hasta_20"]);
  assert.deepEqual(outcomeIds("TER-OP-004", { superficie_autorizada: "100", superficie_ocupada: "120.01" }), ["mas_20"]);
  assert.deepEqual(outcomeIds("TER-OP-005", { anchura_autorizada: "2", anchura_libre: "1.8" }), ["limite"]);
  assert.deepEqual(outcomeIds("TER-OP-005", { anchura_autorizada: "2", anchura_libre: "1.5" }), ["limite"]);

  const protection = byId.get("TER-OP-006");
  let protectionAnswers = updateTerraceAnswer(protection, {}, "ubicacion", "rastrillo");
  protectionAnswers = updateTerraceAnswer(protection, protectionAnswers, "rastrillo_valla", "no");
  assert.deepEqual(resolveTerraceState(protection, protectionAnswers).outcomes.map((item) => item.id), ["ausente_rastrillo"]);
  protectionAnswers = updateTerraceAnswer(protection, protectionAnswers, "ubicacion", "fachada");
  assert.equal(protectionAnswers.rastrillo_valla, undefined);
  assert.deepEqual(resolveTerraceState(protection, protectionAnswers).outcomes, []);
  assert.deepEqual(outcomeIds("TER-OP-006", { ubicacion: "rastrillo", rastrillo_valla: "si", rastrillo_altura: "no" }), ["caracteristicas"]);

  assert.deepEqual(outcomeIds("TER-OP-007", { estado_poliza: "no_acreditada" }), ["pendiente"]);
  assert.deepEqual(outcomeIds("TER-OP-007", { estado_poliza: "completa", estufas: "no_cubiertas" }), ["estufas"]);
  assert.deepEqual(outcomeIds("TER-OP-015", { comparacion: "no_relevante", incumplimientos: ["mobiliario_homologado"] }), ["residual"]);

  const nuisanceBase = { comprobacion: "agentes", afectados: "vecinos", tipo_molestia: ["ruido"], especial_intensidad: "si" };
  assert.deepEqual(outcomeIds("TER-OP-010", { ...nuisanceBase, reiteracion: "no" }), ["grave"]);
  assert.deepEqual(outcomeIds("TER-OP-010", { ...nuisanceBase, actuaciones_previas: "si", reiteracion: "si" }), ["muy_grave"]);
});

test("la ficha muestra horario, referencia contextual y fuente directa sin textos internos", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { TerraceCaseSheet } = await vite.ssrLoadModule("/app/terraces.tsx");
  const schedule = cases.find((item) => item.id === "TER-OP-002");
  const html = renderToStaticMarkup(React.createElement(TerraceCaseSheet, { item: schedule, copied: false, onCopy() {} }));
  assert.match(html, /domingo a jueves, 08:00–24:00/);
  assert.match(html, /¿Consta en la placa, autorización o resolución un horario distinto\?/);
  assert.match(html, /Ordenanza reguladora de la instalación y funcionamiento de las terrazas/);
  assert.match(html, /target="_blank"/);
  assert.doesNotMatch(html, /BLOQUE GUIADO|Variantes del bloque|Referencia literal|Resultado orientativo|Actuación y trazabilidad/);
  assert.doesNotMatch(html, /Selecciona o introduce los hechos|El encaje aparece|funcionamiento interno|motor de decisión/);
});
