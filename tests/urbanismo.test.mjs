import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const read = (path) => readFile(new URL(path, root), "utf8");
const readJson = async (path) => JSON.parse(await read(path));
const vite = await createServer({ appType: "custom", configFile: false, root: rootPath, resolve: { alias: { "@": rootPath } }, server: { middlewareMode: true } });
after(async () => vite.close());

const engine = await vite.ssrLoadModule("/data/urbanismo.ts");
const view = await vite.ssrLoadModule("/app/urbanismo.tsx");
const sourceLinks = await vite.ssrLoadModule("/app/source-links.tsx");
const data = engine.urbanismoData;
const render = (component, props = {}) => renderToStaticMarkup(React.createElement(component, props));
const serial = (value) => JSON.stringify(value);

test("1 · Urbanismo reutiliza la categoría existente y contiene cinco rutas en orden", async () => {
  const categories = await readJson("contenido/estructura/categorias.json");
  const category = categories.find((item) => item.id === "policia_administrativa_urbanismo");
  assert.ok(category?.activo);
  assert.match(category.descripcion, /Asistente policial/);
  assert.equal(data.categoria, category.id);
  assert.deepEqual(data.rutas.map((route) => route.id), ["obras_ejecucion", "via_publica", "riesgo", "queja", "orden_previa"]);
});

test("2 · Urbanismo no crea casos operativos ni altera el índice generado", async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  assert.equal(cases.some((item) => item.categoria === "policia_administrativa_urbanismo"), false);
});

test("3 · una queja vecinal no comprobable separa la manifestación de la observación", () => {
  const result = engine.resolveUrbanismoRoute("queja", { comprobacion_directa: "no" });
  assert.match(result.titulo, /NO COMPROBADA DIRECTAMENTE/);
  assert.match(serial(result), /no ha podido ser comprobada directamente por la patrulla/i);
  assert.doesNotMatch(serial(result), /obra ilegal/i);
});

test("4 · no acreditar la documentación en calle nunca resuelve obra ilegal o sin licencia", () => {
  const result = engine.resolveUrbanismoRoute("obras_ejecucion", {
    tipo_actuacion: "reforma_interior",
    trabajos_actuales: "si",
    personas_relacionadas: ["encargado_empresa"],
    documentacion_municipal: "no_comprobable",
    problemas_adicionales: ["ninguno"],
  });
  assert.equal(result.titulo, "ACTUACIÓN POLICIAL");
  assert.match(serial(result), /Remitir la actuación al departamento competente de Urbanismo/);
  assert.doesNotMatch(serial(result), /obra ilegal|obra sin licencia/i);
});

test("5 · el andamio que obliga a entrar en calzada activa seguridad inmediata y documentación administrativa", () => {
  const result = engine.resolveUrbanismoRoute("via_publica", {
    elementos_via: ["andamio", "acera"],
    paso_peatonal: "no",
    afeccion_trafico: "si",
    proteccion: "no",
    autorizacion_ocupacion: "no_comprobable",
  });
  assert.equal(result.tono, "priority");
  assert.deepEqual(result.secciones.map((section) => section.titulo), ["INCIDENCIA URBANÍSTICA / ADMINISTRATIVA", "SEGURIDAD INMEDIATA / VÍA PÚBLICA"]);
  assert.match(serial(result), /garantizar la seguridad de peatones y tráfico/i);
});

test("6 · un elemento de fachada con riesgo de caída prioriza seguridad sin diagnóstico técnico", () => {
  const result = engine.resolveUrbanismoRoute("riesgo", { riesgos_observados: ["caida", "fachada"], riesgo_inmediato: "si" });
  assert.equal(result.tono, "priority");
  assert.match(result.titulo, /PRIORIDAD: SEGURIDAD/);
  assert.doesNotMatch(serial(result), /edificio en ruina|demoler|diagnóstico estructural/i);
});

test("7 · continuar trabajos dentro del alcance de una orden conocida documenta un posible incumplimiento", () => {
  const result = engine.resolveUrbanismoRoute("orden_previa", {
    consta_orden: "si",
    trabajos_actuales: "si",
    afecta_orden: "si",
    existe_precinto: "no",
    personas_trabajos: "si",
  });
  assert.match(result.titulo, /POSIBLE INCUMPLIMIENTO DE ORDEN PREVIA/);
  assert.match(serial(result), /contenido concreto de la resolución/);
  assert.doesNotMatch(serial(result.secciones), /delito|detención/i);
});

test("8 · un precinto intacto sin actividad no genera incumplimiento inexistente", () => {
  const result = engine.resolveUrbanismoRoute("orden_previa", {
    consta_orden: "si",
    trabajos_actuales: "no",
    existe_precinto: "si",
    estado_precinto: "intacto",
  });
  assert.match(result.titulo, /SIN ACTIVIDAD OBSERVADA/);
  assert.match(serial(result), /No afirmar un incumplimiento que no se observa/);
  assert.doesNotMatch(result.titulo, /POSIBLE INCUMPLIMIENTO/);
});

test("9 · una orden no comprobada es requisito insuficiente y deriva a obras en ejecución", () => {
  const result = engine.resolveUrbanismoRoute("orden_previa", { consta_orden: "no_comprobable" });
  assert.match(result.titulo, /NO CONSTA ORDEN PREVIA COMPROBADA/);
  assert.deepEqual(result.rutasRelacionadas, ["obras_ejecucion"]);
});

test("10 · no existe una salida policial genérica de paralización ni sanciones urbanísticas", () => {
  const outputs = data.rutas.flatMap((route) => Object.values(route.salidas)).flat().join(" ");
  assert.doesNotMatch(outputs, /PARALIZAR OBRA|€|importe|código de denuncia/i);
});

test("11 · las preguntas son cerradas, observables y no piden conclusiones técnicas", () => {
  const questions = data.rutas.flatMap((route) => route.preguntas);
  assert.ok(questions.every((question) => ["opcion", "multiple"].includes(question.tipo) && question.opciones.length > 0));
  assert.doesNotMatch(questions.map((question) => question.etiqueta).join(" | "), /¿Es (?:legal|ilegal)|¿Existe ruina|¿Es obra mayor|¿Procede sancionar/i);
});

test("12 · la búsqueda central de Urbanismo contiene todos los términos requeridos", () => {
  const searchable = engine.urbanismoSearchEntry.palabrasClave.join(" ").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  for (const term of ["urbanismo", "obra ilegal", "sin licencia", "declaracion responsable", "andamio", "contenedor", "zanja", "excavacion", "precinto", "paralizacion", "fachada", "desprendimiento", "queja obra"]) assert.match(searchable, new RegExp(term));
});

test("13 · las seis fuentes están centralizadas, visibles y resolubles", async () => {
  const sources = await readJson("contenido/juridico/fuentes.json");
  assert.equal(data.fuentes.length, 6);
  for (const id of data.fuentes) assert.match(sources.find((source) => source.id === id)?.urlOficial ?? "", /^https:\/\//);
  const html = render(sourceLinks.SourceLinks, { sourceIds: data.fuentes });
  assert.match(html, /Fuentes jurídicas \(6\)/);
  assert.equal((html.match(/target="_blank"/g) ?? []).length, 6);
});

test("14 · la vista inicial muestra cinco entradas, límites técnicos y checklist", () => {
  const html = render(view.UrbanismoGuideView);
  assert.match(html, /Intervención policial en incidencias urbanísticas/);
  assert.match(html, /La valoración técnica de la legalidad urbanística corresponde a Urbanismo/);
  assert.equal((html.match(/RECORRIDO GUIADO/g) ?? []).length, 0);
  const expectedDescriptions = [
    "Licencia o declaración responsable, horario, tipo de obra y otras incidencias observadas.",
    "Zanjas, andamios, contenedores, materiales, vallado, paso peatonal y afección al tráfico.",
    "Desprendimientos, fachadas, muros, excavaciones y situaciones que requieren protección.",
    "Avisos sobre obras que deben distinguirse de los hechos comprobados por la patrulla.",
    "Comprobación de trabajos pese a una orden previa o de un precinto existente.",
  ];
  assert.deepEqual(data.rutas.map((route) => route.descripcion_menu), expectedDescriptions);
  for (const route of data.rutas) {
    assert.match(html, new RegExp(route.titulo));
    assert.ok(html.includes(route.descripcion_menu));
  }
  assert.match(html, /QUÉ CONVIENE DOCUMENTAR/);
});

test("15 · la vista de ruta conserva volver, progresividad y adaptación móvil", async () => {
  const html = render(view.UrbanismoGuideView, { initialRouteId: "riesgo" });
  const css = await read("app/urbanismo.css");
  assert.match(html, /Volver a las situaciones/);
  assert.match(html, /Ver actuación policial/);
  assert.match(css, /@media\(max-width:520px\)/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /\.urbanismo-menu button\{min-height:76px/);
});

test("16 · page integra Urbanismo como herramienta específica y no como ficha de caso", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /policia_administrativa_urbanismo" \? <UrbanismoGuideView/);
  assert.match(page, /UrbanismoGuideView initialRouteId=\{view\.urbanismoRouteId\}/);
  assert.match(page, /kind: "urbanismo"/);
  assert.doesNotMatch(page, /item\.categoria === "policia_administrativa_urbanismo" \? <[A-Za-z]+CaseSheet/);
});
