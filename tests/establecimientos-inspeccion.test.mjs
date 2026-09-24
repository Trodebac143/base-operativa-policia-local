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

const engine = await vite.ssrLoadModule("/data/establishments.ts");
const view = await vite.ssrLoadModule("/app/establishments.tsx");
const data = engine.establishmentsInspection;
const irregular = (respuestas = {}) => ({ estado: "irregular", respuestas });
const correct = { estado: "correcto", respuestas: {} };
const notChecked = { estado: "no_comprobado", respuestas: {} };
const render = (component, props = {}) => renderToStaticMarkup(React.createElement(component, props));

function fixtureData(classifications) {
  return {
    ...data,
    controles: classifications.map(({ id, via = "LEY_14_2010", clasificacion, documento, destino }) => ({
      id,
      icono: "•",
      titulo: id,
      origen: via === "MUNICIPAL" ? "MUNICIPAL" : "AUTONÓMICA",
      referencia: "Referencia de prueba",
      resumen: "Control de prueba",
      preguntas: [{ id: "hecho", etiqueta: "Hecho", tipo: "texto", anexo: "Hecho observado" }],
      resultados: [{ id: `${id}-resultado`, titulo: `Resultado ${id}`, via, norma: "Norma", articulo: "1", clasificacion, documento, destino, cuando: [{ campo: "_irregular", igual: "si" }], anexo_campos: ["hecho"], recordatorios: ["Describir el hecho."] }],
    })),
  };
}

test("1 · el bloque reutiliza la categoría real y contiene quince controles", () => {
  assert.equal(data.categoria, "policia_administrativa_establecimientos_actividades");
  assert.equal(data.controles.length, 15);
  assert.equal(new Set(data.controles.map((control) => control.id)).size, 15);
});

test("2 · una inspección sin irregularidades no genera resultados", () => {
  const resolution = engine.resolveEstablishmentInspection({ aforo: correct, ruido: notChecked });
  assert.deepEqual(resolution.grupos, []);
  assert.deepEqual(resolution.incidencias, []);
});

test("3 · una única leve de Ley 14/2010 resuelve Acta L + ANEXO", () => {
  const resolution = engine.resolveEstablishmentInspection({ carteleria: irregular({ incidencia_informacion: "No se exhibe el cartel comprobado" }) });
  assert.equal(resolution.grupos[0].documento, "ACTA L + ANEXO");
  assert.equal(resolution.grupos[0].incidencias[0].clasificacion, "LEVE");
});

test("4 · una única grave resuelve Acta G + ANEXO", () => {
  const resolution = engine.resolveEstablishmentInspection({ licencia_actividad: irregular({ actividad_distinta: "si", actividad_autorizada: "Café", actividad_observada: "Discoteca" }) });
  assert.equal(resolution.grupos[0].documento, "ACTA G + ANEXO");
  assert.equal(resolution.grupos[0].incidencias[0].articulo, "51.3");
});

test("5 · una muy grave usa el modelo G sin que el motor dependa de un caso hardcodeado", () => {
  const fixture = fixtureData([{ id: "muy_grave", clasificacion: "MUY GRAVE" }]);
  const resolution = engine.resolveEstablishmentInspection({ muy_grave: irregular({ hecho: "Hecho comprobado" }) }, fixture);
  assert.equal(resolution.grupos[0].documento, "ACTA G + ANEXO");
});

test("6 · leve y grave de Ley 14/2010 se agrupan en una única Acta G", () => {
  const state = {
    licencia_actividad: irregular({ actividad_distinta: "si" }),
    carteleria: irregular({ incidencia_informacion: "Cartel ausente" }),
  };
  const resolution = engine.resolveEstablishmentInspection(state);
  assert.equal(resolution.grupos.length, 1);
  assert.equal(resolution.grupos[0].incidencias.length, 2);
  assert.equal(resolution.grupos[0].documento, "ACTA G + ANEXO");
});

test("7 · varias leves de Ley 14/2010 se agrupan en Acta L + ANEXO", () => {
  const state = {
    higiene: irregular({ hechos_higiene: "Suciedad observable" }),
    carteleria: irregular({ incidencia_informacion: "Hoja no disponible" }),
  };
  const resolution = engine.resolveEstablishmentInspection(state);
  assert.equal(resolution.grupos.length, 1);
  assert.equal(resolution.grupos[0].documento, "ACTA L + ANEXO");
});

test("8 · la vía autonómica y la municipal conservan resultados separados", () => {
  const state = {
    aforo: irregular({ aforo_autorizado: "50", personas_contabilizadas: "60" }),
    ruido: irregular({ fuente_ruido: "Equipo musical" }),
  };
  const resolution = engine.resolveEstablishmentInspection(state);
  assert.deepEqual(resolution.grupos.map((group) => group.via), ["LEY_14_2010", "MUNICIPAL"]);
  assert.equal(resolution.grupos[1].documento, "PENDIENTE DE VALIDACIÓN JURÍDICA");
});

test("9 · el filtro Todas incluye también normativa específica", () => {
  const controls = engine.controlsForFilter("TODAS");
  assert.equal(controls.length, 15);
  assert.ok(controls.some((control) => control.origen === "NORMATIVA ESPECÍFICA"));
});

test("10 · el filtro Autonómica solo muestra controles autonómicos", () => {
  const controls = engine.controlsForFilter("AUTONÓMICA");
  assert.ok(controls.length > 0 && controls.every((control) => control.origen === "AUTONÓMICA"));
});

test("11 · el filtro Municipal solo muestra controles municipales", () => {
  assert.deepEqual(engine.controlsForFilter("MUNICIPAL").map((control) => control.id), ["ruido"]);
});

test("12 · el filtro Mixta solo muestra controles mixtos", () => {
  const controls = engine.controlsForFilter("MIXTA");
  assert.ok(controls.length > 0 && controls.every((control) => control.origen === "MIXTA"));
});

test("13 · los datos condicionales aparecen únicamente con estado Irregular", () => {
  const control = data.controles.find((item) => item.id === "aforo");
  const props = { control, number: 2, onStatus() {}, onAnswer() {} };
  const regularHtml = render(view.InspectionControlCard, { ...props, item: correct });
  const irregularHtml = render(view.InspectionControlCard, { ...props, item: irregular() });
  assert.doesNotMatch(regularHtml, /Aforo máximo que consta autorizado/);
  assert.match(irregularHtml, /Aforo máximo que consta autorizado/);
});

test("14 · No comprobado no genera infracción", () => {
  assert.equal(engine.resolveEstablishmentInspection({ licencia_actividad: notChecked }).incidencias.length, 0);
});

test("15 · Correcto no genera infracción aunque queden respuestas ajenas", () => {
  const state = { licencia_actividad: { estado: "correcto", respuestas: { actividad_distinta: "si" } } };
  assert.equal(engine.resolveEstablishmentInspection(state).incidencias.length, 0);
});

test("16 · el borrador del ANEXO usa solo valores introducidos y no inventa datos", () => {
  const resolution = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "80" }) });
  const draft = engine.buildAnnexDraft(resolution);
  assert.match(draft, /Aforo autorizado: 80 personas/);
  assert.doesNotMatch(draft, /Personas contabilizadas|undefined|null|__ horas|__ personas/);
});

test("17 · el ANEXO solo recoge materias con incidencia", () => {
  const resolution = engine.resolveEstablishmentInspection({
    aforo: irregular({ aforo_autorizado: "80", personas_contabilizadas: "95" }),
    extintores: correct,
  });
  const draft = engine.buildAnnexDraft(resolution);
  assert.match(draft, /Aforo/);
  assert.doesNotMatch(draft, /Extintores/);
});

test("18 · la categoría entra directamente en la inspección y conserva navegación atrás", async () => {
  const page = await read("app/page.tsx");
  assert.match(page, /selectedCategory\.id === "policia_administrativa_establecimientos_actividades"/);
  assert.match(page, /<EstablishmentsInspectionView \/>/);
  assert.match(page, /selectedCategory \? \{ moduleId: view\.moduleId \}/);
  assert.doesNotMatch(await read("app/establishments.tsx"), /¿Qué quieres hacer\?|normativa autonómica[\s\S]+inspección general/i);
});

test("19 · el estado completo se resuelve aunque un filtro oculte controles", () => {
  const state = {
    licencia_actividad: irregular({ actividad_distinta: "si" }),
    ruido: irregular({ fuente_ruido: "Equipo" }),
  };
  assert.equal(engine.controlsForFilter("AUTONÓMICA").some((control) => control.id === "ruido"), false);
  assert.equal(engine.resolveEstablishmentInspection(state).incidencias.length, 2);
});

test("20 · la hoja de estilos contiene composición móvil prioritaria", async () => {
  const css = await read("app/establishments.css");
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(css, /\.establishment-status \{ grid-template-columns: 1fr; \}/);
  assert.match(css, /\.establishment-resolve-bar \{ align-items: stretch; flex-direction: column/);
});

test("21 · la composición de escritorio mantiene filtros y resultados compactos", async () => {
  const css = await read("app/establishments.css");
  assert.match(css, /\.establishment-filters \{[^}]*grid-template-columns: repeat\(4/);
  assert.match(css, /\.establishment-result-group dl \{[^}]*grid-template-columns: 1fr 1fr/);
});

test("22 · Terrazas y el resto de Policía Administrativa mantienen sus categorías", async () => {
  const categories = await readJson("contenido/estructura/categorias.json");
  assert.ok(categories.some((item) => item.id === "policia_administrativa_terrazas" && item.nombre === "☕ Terrazas"));
  assert.deepEqual(categories.filter((item) => item.modulo === "policia_administrativa").map((item) => item.orden), [10, 20, 30, 40, 50, 60]);
});

test("23 · las fuentes están registradas, enlazadas y visibles desde la inspección", async () => {
  const sources = await readJson("contenido/juridico/fuentes.json");
  for (const id of data.fuentes) {
    const source = sources.find((item) => item.id === id);
    assert.match(source?.urlOficial ?? "", /^https:\/\/(?:www\.boe\.es\/eli\/|dogv\.gva\.es\/es\/eli\/)/);
  }
  const html = render(view.EstablishmentsInspectionView);
  assert.match(html, /Ley 14\/2010, de 3 de diciembre/);
  assert.match(html, /Decreto 143\/2015, de 11 de septiembre/);
  assert.match(html, /target="_blank"/);
});

test("24 · el render inicial no crea secciones jurídicas vacías", () => {
  const html = render(view.EstablishmentsInspectionView);
  assert.doesNotMatch(html, /Incidencias por vía documental|ANEXO — recuerda hacer constar|Borrador para revisar/);
  assert.match(html, /No comprobado/);
});

test("25 · la interfaz visible no expone IDs internos", () => {
  const html = render(view.EstablishmentsInspectionView);
  assert.doesNotMatch(html, />[^<]*(?:PA-EST-INSPECCION|policia_administrativa_establecimientos_actividades|licencia_actividad)[^<]*</);
});

test("26 · un resultado específico prevalece sobre el fallback pendiente", () => {
  const license = engine.resolveEstablishmentInspection({ licencia_actividad: irregular({ actividad_distinta: "si" }) });
  const capacity = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "10", personas_contabilizadas: "11" }) });
  assert.deepEqual(license.incidencias.map((item) => item.id), ["actividad_distinta"]);
  assert.deepEqual(capacity.incidencias.map((item) => item.id), ["exceso_aforo"]);
});

test("27 · una clasificación pendiente no se degrada automáticamente a Acta L", () => {
  const resolution = engine.resolveEstablishmentInspection({ seguro: irregular({ vigencia_seguro: "no_acreditable" }) });
  assert.equal(resolution.grupos[0].documento, "PENDIENTE DE VALIDACIÓN JURÍDICA");
  assert.equal(resolution.grupos[0].destino, "PENDIENTE DE VALIDACIÓN JURÍDICA");
});

test("28 · la regla del art. 56.6 y la competencia quedan visibles sin inventar delegación", () => {
  const html = render(view.EstablishmentsInspectionView);
  assert.match(html, /art\. 56\.6/);
  assert.match(html, /no consta validada para Torrent/);
});

test("29 · los quince títulos operativos y los tres estados solicitados están presentes", () => {
  const titles = data.controles.map((control) => `${control.icono} ${control.titulo}`).join(" | ");
  for (const icon of ["📄", "👥", "🕒", "🔊", "🧒", "🍺", "🚬", "🛡️", "🧯", "🚪", "🧼", "📋", "🚷", "🔇", "⚠️"]) assert.match(titles, new RegExp(icon, "u"));
  const html = render(view.EstablishmentsInspectionView);
  assert.match(html, /✅/);
  assert.match(html, /⚠️/);
  assert.match(html, /➖/);
});

test("30 · Otros hechos queda plegado inicialmente y es la única pregunta extensa", () => {
  const other = data.controles.find((control) => control.id === "otros");
  assert.equal(other.plegado, true);
  assert.equal(data.controles.flatMap((control) => control.preguntas).filter((question) => question.tipo === "texto_largo").length, 1);
  assert.match(render(view.EstablishmentsInspectionView), /<details class="establishment-control folded/);
});

test("31 · la inspección conserva estado en la sesión sin contaminar el estado inicial", async () => {
  const source = await read("app/establishments.tsx");
  assert.match(source, /sessionStorage\.getItem\(STORAGE_KEY\)/);
  assert.match(source, /storageReady\.current/);
  assert.match(source, /suppressEmptySave\.current/);
  assert.match(source, /sessionStorage\.setItem\(STORAGE_KEY, JSON\.stringify\(state\)\)/);
  assert.match(source, /sessionStorage\.removeItem\(STORAGE_KEY\)/);
});

test("32 · Ley 14/2010, normativa municipal y normativa específica se mantienen en tres grupos", () => {
  const resolution = engine.resolveEstablishmentInspection({
    licencia_actividad: irregular({ actividad_distinta: "si", actividad_autorizada: "Café", actividad_observada: "Discoteca" }),
    ruido: irregular({ fuente_ruido: "Equipo musical" }),
    tabaco: irregular({ hecho_tabaco: ["consumo"], lugar_tabaco: "Zona interior" }),
  });
  assert.deepEqual(resolution.grupos.map((group) => group.via), ["LEY_14_2010", "MUNICIPAL", "ESPECIFICA"]);
  assert.deepEqual(resolution.grupos.map((group) => group.incidencias.length), [1, 1, 1]);
});

test("33 · la salida de normativa específica avisa que corresponde a otra vía", () => {
  const resolution = engine.resolveEstablishmentInspection({
    tabaco: irregular({ hecho_tabaco: ["consumo"], lugar_tabaco: "Zona interior" }),
  });
  const html = render(view.InspectionResult, { resolution, draft: "", showDraft: false, onShowDraft() {} });
  assert.match(html, /Otra vía \/ materia relacionada/i);
  assert.match(html, /regulación propia/);
  assert.doesNotMatch(html, /Ley 14\/2010[\s\S]*Otra vía \/ materia relacionada[\s\S]*Ley 14\/2010/);
});
