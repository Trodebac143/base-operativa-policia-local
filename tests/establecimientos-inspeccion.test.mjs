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
  const resolution = engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["reclamaciones"], incidencia_informacion: "No se facilitan hojas" }) });
  assert.equal(resolution.grupos[0].documento, "ACTA L + ANEXO");
  assert.equal(resolution.grupos[0].incidencias[0].clasificacion, "LEVE");
});

test("4 · una única grave resuelve Acta G + ANEXO", () => {
  const resolution = engine.resolveEstablishmentInspection({ licencia_actividad: irregular({ existencia_titulo: "consta", actividad_coincide: "no", actividad_autorizada: "Café", actividad_observada: "Discoteca" }) });
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
    licencia_actividad: irregular({ existencia_titulo: "no_consta", actividad_observada: "Discoteca" }),
    carteleria: irregular({ elemento_informacion: ["horario"], incidencia_informacion: "Cartel ausente" }),
  };
  const resolution = engine.resolveEstablishmentInspection(state);
  assert.equal(resolution.grupos.length, 1);
  assert.equal(resolution.grupos[0].incidencias.length, 2);
  assert.equal(resolution.grupos[0].documento, "ACTA G + ANEXO");
});

test("7 · varias leves de Ley 14/2010 se agrupan en Acta L + ANEXO", () => {
  const state = {
    higiene: irregular({ zona_higiene: ["aseos"], hechos_higiene: "Suciedad observable" }),
    carteleria: irregular({ elemento_informacion: ["reclamaciones"], incidencia_informacion: "Hoja no disponible" }),
  };
  const resolution = engine.resolveEstablishmentInspection(state);
  assert.equal(resolution.grupos.length, 1);
  assert.equal(resolution.grupos[0].documento, "ACTA L + ANEXO");
});

test("8 · la vía autonómica y la municipal conservan resultados separados", () => {
  const state = {
    aforo: irregular({ aforo_autorizado: "50", personas_contabilizadas: "60" }),
    ruido: irregular({ fuente_ruido: "Equipo musical", resultado_medicion: "exceso_acreditado", datos_medicion: "Acta de medición" }),
  };
  const resolution = engine.resolveEstablishmentInspection(state);
  assert.deepEqual(resolution.grupos.map((group) => group.via), ["LEY_14_2010", "MUNICIPAL"]);
  assert.equal(resolution.grupos[1].documento, "PENDIENTE DE VALIDACIÓN JURÍDICA");
});

test("9 · el filtro Todas incluye también normativa específica", () => {
  const controls = engine.controlsForFilter("TODAS");
  assert.equal(controls.length, 15);
  assert.ok(controls.some((control) => control.id === "tabaco" && control.origen === "MIXTA"));
});

test("10 · el filtro Autonómica solo muestra controles autonómicos", () => {
  const controls = engine.controlsForFilter("AUTONÓMICA");
  assert.ok(controls.length > 0 && controls.every((control) => ["AUTONÓMICA", "MIXTA"].includes(control.origen)));
});

test("11 · el filtro Municipal solo muestra controles municipales", () => {
  const controls = engine.controlsForFilter("MUNICIPAL");
  assert.ok(controls.some((control) => control.id === "ruido"));
  assert.ok(controls.every((control) => ["MUNICIPAL", "MIXTA"].includes(control.origen)));
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
  const state = { licencia_actividad: { estado: "correcto", respuestas: { actividad_coincide: "no" } } };
  assert.equal(engine.resolveEstablishmentInspection(state).incidencias.length, 0);
});

test("16 · el borrador del ANEXO usa solo valores introducidos y no inventa datos", () => {
  const resolution = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "80", personas_contabilizadas: "95" }) });
  const draft = engine.buildAnnexDraft(resolution);
  assert.match(draft, /Aforo autorizado: 80 personas/);
  assert.match(draft, /Personas contabilizadas: 95 personas/);
  assert.doesNotMatch(draft, /Método de recuento|Hora del recuento|undefined|null|__ horas|__ personas/);
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
    licencia_actividad: irregular({ existencia_titulo: "no_consta", actividad_observada: "Discoteca" }),
    ruido: irregular({ fuente_ruido: "Equipo", resultado_medicion: "exceso_acreditado", datos_medicion: "Acta técnica 4/2026" }),
  };
  assert.equal(engine.controlsForFilter("MIXTA").some((control) => control.id === "licencia_actividad"), false);
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

test("22 · Terrazas, Convivencia y Establecimientos mantienen la estructura administrativa", async () => {
  const categories = await readJson("contenido/estructura/categorias.json");
  assert.ok(categories.some((item) => item.id === "policia_administrativa_terrazas" && item.nombre === "☕ Terrazas"));
  assert.deepEqual(categories.filter((item) => item.modulo === "policia_administrativa").map((item) => item.orden), [10, 20, 30, 40, 60]);
  assert.equal(categories.some((item) => item.id === "policia_administrativa_mercados"), false);
});

test("23 · las fuentes están registradas, enlazadas y visibles desde la inspección", async () => {
  const sources = await readJson("contenido/juridico/fuentes.json");
  for (const id of data.fuentes) {
    const source = sources.find((item) => item.id === id);
    assert.match(source?.urlOficial ?? "", /^https:\/\/(?:www\.boe\.es\/eli\/|dogv\.gva\.es\/es\/eli\/|www\.torrent\.es\/)/);
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
  const license = engine.resolveEstablishmentInspection({ licencia_actividad: irregular({ existencia_titulo: "consta", actividad_coincide: "no", actividad_autorizada: "Café", actividad_observada: "Discoteca" }) });
  const capacity = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "10", personas_contabilizadas: "11" }) });
  assert.deepEqual(license.incidencias.map((item) => item.id), ["actividad_distinta"]);
  assert.deepEqual(capacity.incidencias.map((item) => item.id), ["exceso_aforo"]);
});

test("27 · una clasificación pendiente no se degrada automáticamente a Acta L", () => {
  const resolution = engine.resolveEstablishmentInspection({ horario: irregular({ incidencia_horario: ["supuesto_especial"] }) });
  assert.equal(resolution.grupos[0].documento, "PENDIENTE DE VALIDACIÓN JURÍDICA");
  assert.equal(resolution.grupos[0].destino, "PENDIENTE DE VALIDACIÓN JURÍDICA");
});

test("28 · la regla del art. 56.6 y la competencia validada quedan visibles", () => {
  const html = render(view.EstablishmentsInspectionView);
  assert.match(html, /art\. 56\.6/);
  assert.match(html, /Torrent no tiene delegadas/);
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
    licencia_actividad: irregular({ existencia_titulo: "consta", actividad_coincide: "no", actividad_autorizada: "Café", actividad_observada: "Discoteca" }),
    ruido: irregular({ fuente_ruido: "Equipo musical", resultado_medicion: "exceso_acreditado", datos_medicion: "Acta técnica" }),
    tabaco: irregular({ hecho_tabaco: ["persona_fuma"], interior_prohibido_tabaco: "si", lugar_tabaco: "Zona interior" }),
  });
  assert.deepEqual(resolution.grupos.map((group) => group.via), ["LEY_14_2010", "MUNICIPAL", "ESPECIFICA"]);
  assert.deepEqual(resolution.grupos.map((group) => group.incidencias.length), [1, 1, 1]);
});

test("33 · la salida de normativa específica avisa que corresponde a otra vía", () => {
  const resolution = engine.resolveEstablishmentInspection({
    tabaco: irregular({ hecho_tabaco: ["persona_fuma"], interior_prohibido_tabaco: "si", lugar_tabaco: "Zona interior" }),
  });
  const html = render(view.InspectionResult, { resolution, draft: "", showDraft: false, onShowDraft() {} });
  assert.match(html, /Otra vía \/ materia relacionada/i);
  assert.match(html, /regulación propia/);
  assert.doesNotMatch(html, /Ley 14\/2010[\s\S]*Otra vía \/ materia relacionada[\s\S]*Ley 14\/2010/);
});

const incidentIds = (state) => engine.resolveEstablishmentInspection(state).incidencias.map((item) => item.id);

test("34 · carecer de título habilitante resuelve art. 51.1 grave", () => {
  const resolution = engine.resolveEstablishmentInspection({ licencia_actividad: irregular({ existencia_titulo: "no_consta", actividad_observada: "Discoteca" }) });
  assert.deepEqual(resolution.incidencias.map(({ articulo, clasificacion }) => [articulo, clasificacion]), [["51.1", "GRAVE"]]);
  assert.equal(resolution.grupos[0].documento, "ACTA G + ANEXO");
});

test("35 · actividad distinta exige ambas actividades y comparación documental", () => {
  assert.deepEqual(incidentIds({ licencia_actividad: irregular({ actividad_coincide: "no" }) }), []);
  assert.deepEqual(incidentIds({ licencia_actividad: irregular({ existencia_titulo: "consta", actividad_coincide: "no", actividad_autorizada: "Café", actividad_observada: "Discoteca" }) }), ["actividad_distinta"]);
});

test("36 · modificación sustancial solo se activa con valoración y hechos", () => {
  assert.deepEqual(incidentIds({ licencia_actividad: irregular({ valoracion_cambio: "sustancial_acreditada" }) }), []);
  const resolution = engine.resolveEstablishmentInspection({ licencia_actividad: irregular({ valoracion_cambio: "sustancial_acreditada", hechos_cambio_condiciones: "Se documenta ampliación de zona" }) });
  assert.equal(resolution.incidencias[0].articulo, "51.2");
});

test("37 · condiciones no sustanciales y falta de exposición conservan sus artículos sin duplicar controles", () => {
  const resolution = engine.resolveEstablishmentInspection({
    licencia_actividad: irregular({ valoracion_cambio: "no_sustancial_acreditada", hechos_cambio_condiciones: "Cambio documentado" }),
    carteleria: irregular({ elemento_informacion: ["licencia"], documento_exponible: "consta", incidencia_informacion: "No se encuentra expuesta" }),
  });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["51.34", "50.8"]);
  assert.equal(resolution.grupos[0].documento, "ACTA G + ANEXO");
});

test("38 · el exceso ordinario de aforo es grave", () => {
  const resolution = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "100", personas_contabilizadas: "101", metodo_recuento: "recuento_directo" }) });
  assert.deepEqual(resolution.incidencias.map(({ articulo, clasificacion }) => [articulo, clasificacion]), [["51.6", "GRAVE"]]);
});

test("39 · el grave riesgo de aforo acreditado sustituye la variante ordinaria", () => {
  const resolution = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "100", personas_contabilizadas: "140", valoracion_riesgo_aforo: "grave_riesgo_acreditado", soporte_riesgo_aforo: "Informe técnico 12/2026", circunstancias_aforo: "Dos salidas obstaculizadas" }) });
  assert.deepEqual(resolution.incidencias.map(({ articulo, clasificacion }) => [articulo, clasificacion]), [["52.4", "MUY GRAVE"]]);
});

test("40 · el motor no deduce grave riesgo por el porcentaje de exceso", () => {
  const resolution = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "10", personas_contabilizadas: "1000" }) });
  assert.equal(resolution.incidencias[0].articulo, "51.6");
  assert.equal(resolution.incidencias[0].clasificacion, "GRAVE");
});

test("41 · incumplimiento horario general resuelve 51.18 grave", () => {
  const resolution = engine.resolveEstablishmentInspection({ horario: irregular({ incidencia_horario: ["cierre_superado"], tipo_establecimiento: "Café-bar", hora_comprobacion: "03:00", funcionamiento_horario: ["sirviendo"] }) });
  assert.equal(resolution.incidencias[0].articulo, "51.18");
  assert.equal(resolution.grupos[0].destino.startsWith("Generalitat Valenciana"), true);
});

test("42 · cartel horario ausente resuelve 50.10 leve", () => {
  const resolution = engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["horario"], incidencia_informacion: "No se observa cartel en el acceso" }) });
  assert.equal(resolution.incidencias[0].articulo, "50.10");
  assert.equal(resolution.grupos[0].documento, "ACTA L + ANEXO");
});

test("43 · música no autorizada y trascendencia exterior se separan por vía", () => {
  const resolution = engine.resolveEstablishmentInspection({ musica: irregular({ equipos_sonido: "Dos altavoces", equipos_funcionando: "si", autorizacion_musical: "no", sonido_exterior: "si" }) });
  assert.deepEqual(resolution.grupos.map((group) => group.via), ["LEY_14_2010", "MUNICIPAL"]);
  assert.equal(resolution.grupos[0].incidencias[0].articulo, "51.30");
  assert.equal(resolution.grupos[1].incidencias[0].clasificacion, "PENDIENTE");
});

test("44 · menor en actividad con prohibición documentada resuelve 51.14", () => {
  const resolution = engine.resolveEstablishmentInspection({ menores: irregular({ edad_menor: "16", presencia_menor: ["permanencia"], tipo_local_menor: "Actividad con prohibición", prohibicion_menores: "prohibida" }) });
  assert.equal(resolution.incidencias[0].articulo, "51.14");
});

test("45 · sesión para menores con incumplimiento documentado resuelve 51.15", () => {
  const resolution = engine.resolveEstablishmentInspection({ menores: irregular({ sesion_menores: "si", condiciones_sesion_menores: "incumplimiento_documentado", edad_menor: "16", presencia_menor: ["participacion"], tipo_local_menor: "Sala de fiestas", hecho_sesion_menores: "Participa en actividad no prevista en las condiciones documentadas" }) });
  assert.equal(resolution.incidencias[0].articulo, "51.15");
});

test("46 · alcohol solo resuelve 51.12 cuando la edad es inferior a 18", () => {
  const minor = engine.resolveEstablishmentInspection({ alcohol_menores: irregular({ hecho_alcohol: ["venta"], edad_alcohol: "17", modo_comprobacion_alcohol: "Venta observada" }) });
  const adult = engine.resolveEstablishmentInspection({ alcohol_menores: irregular({ hecho_alcohol: ["venta"], edad_alcohol: "18", modo_comprobacion_alcohol: "Venta observada" }) });
  assert.equal(minor.incidencias[0].articulo, "51.12");
  assert.equal(adult.incidencias.length, 0);
});

test("47 · venta o suministro de tabaco a menor usa Ley 14/2010", () => {
  const resolution = engine.resolveEstablishmentInspection({ tabaco: irregular({ hecho_tabaco: ["venta_menor"], edad_tabaco: "17", lugar_tabaco: "Barra" }) });
  assert.equal(resolution.incidencias[0].via, "LEY_14_2010");
  assert.equal(resolution.incidencias[0].articulo, "51.13");
});

test("48 · persona fumando en interior usa la vía sanitaria específica", () => {
  const resolution = engine.resolveEstablishmentInspection({ tabaco: irregular({ hecho_tabaco: ["persona_fuma"], interior_prohibido_tabaco: "si", lugar_tabaco: "Sala interior" }) });
  assert.equal(resolution.incidencias[0].articulo, "19.2.a");
  assert.equal(resolution.grupos[0].via, "ESPECIFICA");
  assert.match(resolution.grupos[0].destino, /Direcciones Territoriales de Sanidad/);
});

test("49 · titular que permite fumar usa art. 19.3.b y no Acta G de Ley 14", () => {
  const resolution = engine.resolveEstablishmentInspection({ tabaco: irregular({ hecho_tabaco: ["titular_permite"], interior_prohibido_tabaco: "si", lugar_tabaco: "Sala interior" }) });
  assert.equal(resolution.incidencias[0].articulo, "19.3.b");
  assert.equal(resolution.grupos[0].documento, "No consta modelo físico específico de denuncia de tabaquismo en el repositorio");
});

test("50 · seguro no acreditable no equivale a carencia", () => {
  assert.equal(engine.resolveEstablishmentInspection({ seguro: irregular({ estado_obligacion_seguro: "no_acreditable" }) }).incidencias.length, 0);
  const resolution = engine.resolveEstablishmentInspection({ seguro: irregular({ estado_obligacion_seguro: "carencia_acreditada" }) });
  assert.equal(resolution.incidencias[0].articulo, "51.28");
});

test("51 · extintores no escalan a muy grave sin valoración técnica", () => {
  const ordinary = engine.resolveEstablishmentInspection({ extintores: irregular({ incidencia_extintor: ["inaccesible"] }) });
  const serious = engine.resolveEstablishmentInspection({ extintores: irregular({ incidencia_extintor: ["inaccesible"], valoracion_riesgo_extintor: "grave_riesgo_acreditado", soporte_riesgo_extintor: "Informe técnico 7/2026" }) });
  assert.deepEqual(ordinary.incidencias.map((item) => item.articulo), ["51.7"]);
  assert.deepEqual(serious.incidencias.map((item) => item.articulo), ["52.3"]);
});

test("52 · salidas separa deficiencia, grave riesgo y evacuación gravemente afectada", () => {
  const base = { incidencia_salidas: ["obstaculos"], situacion_salidas: "Salida norte" };
  assert.equal(engine.resolveEstablishmentInspection({ seguridad_evacuacion: irregular(base) }).incidencias[0].articulo, "51.7");
  assert.equal(engine.resolveEstablishmentInspection({ seguridad_evacuacion: irregular({ ...base, valoracion_seguridad_salidas: "grave_riesgo_acreditado", soporte_seguridad_salidas: "Informe técnico 8/2026" }) }).incidencias[0].articulo, "52.3");
  assert.equal(engine.resolveEstablishmentInspection({ seguridad_evacuacion: irregular({ ...base, valoracion_seguridad_salidas: "evacuacion_gravemente_disminuida", soporte_seguridad_salidas: "Informe técnico 9/2026" }) }).incidencias[0].articulo, "52.8");
});

test("53 · limpieza de aseos es leve y otras zonas conservan un pendiente concreto", () => {
  const toilets = engine.resolveEstablishmentInspection({ higiene: irregular({ zona_higiene: ["aseos"], hechos_higiene: "Suciedad acumulada" }) });
  const other = engine.resolveEstablishmentInspection({ higiene: irregular({ zona_higiene: ["barra"], hechos_higiene: "Deficiencia visible" }) });
  assert.equal(toilets.incidencias[0].articulo, "50.2");
  assert.equal(other.incidencias[0].id, "otra_higiene_pendiente");
});

test("54 · cartelería puede recoger las cinco infracciones leves validadas", () => {
  const resolution = engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["reclamaciones", "contacto", "licencia", "menores", "horario"], documento_exponible: "consta", incidencia_informacion: "Elementos ausentes" }) });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["50.3", "50.4", "50.8", "50.9", "50.10"]);
  assert.equal(resolution.grupos[0].documento, "ACTA L + ANEXO");
});

test("55 · admisión y vigilancia resuelven 51.9, 51.10 y 51.11", () => {
  const resolution = engine.resolveEstablishmentInspection({ admision_vigilancia: irregular({ obligacion_personal: ["admision_exigida", "vigilancia_exigida"], hecho_personal: ["admision_arbitraria_discriminatoria", "falta_admision", "falta_vigilancia"], hecho_admision: "Hechos observados" }) });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["51.9", "51.10", "51.11"]);
});

test("56 · oír música fuera no acredita exceso acústico sin medición suficiente", () => {
  const heard = engine.resolveEstablishmentInspection({ ruido: irregular({ fuente_ruido: "Música", lugar_percepcion: "Calle", comprobacion_ruido: ["agentes"] }) });
  const measured = engine.resolveEstablishmentInspection({ ruido: irregular({ fuente_ruido: "Música", lugar_percepcion: "Calle", comprobacion_ruido: ["medicion"], datos_medicion: "Equipo, hora y resultado", resultado_medicion: "exceso_acreditado" }) });
  assert.equal(heard.incidencias.length, 0);
  assert.equal(measured.incidencias[0].id, "exceso_acustico_pendiente");
});

test("57 · Otros hechos no genera pendiente por defecto y solo resuelve supuestos validados", () => {
  assert.equal(engine.resolveEstablishmentInspection({ otros: irregular({ supuesto_otro: ["otro"], hecho_otro: "Hecho adicional" }) }).incidencias.length, 0);
  const resolution = engine.resolveEstablishmentInspection({ otros: irregular({ supuesto_otro: ["negativa_inspeccion", "armas_sin_autorizacion"], hecho_otro: "Hechos observados" }) });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["52.9", "51.24"]);
});

test("58 · una misma inspección conserva múltiples resultados concurrentes sin sancionar la exposición de un título inexistente", () => {
  const resolution = engine.resolveEstablishmentInspection({
    licencia_actividad: irregular({ existencia_titulo: "no_consta", actividad_observada: "Actividad abierta" }),
    carteleria: irregular({ elemento_informacion: ["horario"], incidencia_informacion: "Cartel ausente" }),
  });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["51.1", "50.10"]);
  assert.equal(resolution.grupos.length, 1);
});

test("59 · la competencia se determina por la infracción más grave del acta", () => {
  const light = engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["horario"] }) });
  const mixed = engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["horario"] }), seguro: irregular({ estado_obligacion_seguro: "carencia_acreditada" }) });
  assert.equal(light.grupos[0].destino, "Ayuntamiento de Torrent (infracciones leves de la Ley 14/2010).");
  assert.match(mixed.grupos[0].destino, /^Generalitat Valenciana/);
  assert.equal(mixed.grupos[0].documento, "ACTA G + ANEXO");
});

test("60 · las cinco fuentes del bloque están centralizadas y accesibles", async () => {
  const sources = await readJson("contenido/juridico/fuentes.json");
  assert.deepEqual(data.fuentes, ["PA-EST-SRC-LEY-14-2010", "PA-EST-SRC-DECRETO-143-2015", "PA-EST-SRC-ORDEN-3-2025", "PA-EST-SRC-LEY-28-2005", "OCC-TORRENT"]);
  for (const id of data.fuentes) assert.match(sources.find((item) => item.id === id)?.urlOficial ?? "", /^https:\/\//);
});

test("61 · solo permanecen pendientes jurídicos concretos y no fallbacks genéricos", () => {
  const pending = data.controles.flatMap((control) => control.resultados.filter((result) => result.clasificacion === "PENDIENTE").map((result) => result.id));
  assert.deepEqual(pending, ["horario_especial_pendiente", "trascendencia_acustica", "otra_higiene_pendiente", "otro_elemento_pendiente", "exceso_acustico_pendiente"]);
  assert.equal(data.controles.some((control) => control.resultados.some((result) => result.cuando.some((condition) => condition.campo === "_irregular"))), false);
});

test("62 · el ANEXO de aforo incluye hora y método solo cuando se introducen", () => {
  const resolution = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "40", personas_contabilizadas: "50", metodo_recuento: "recuento_directo", hora_aforo: "23:45" }) });
  const draft = engine.buildAnnexDraft(resolution);
  assert.match(draft, /Método de recuento: Recuento directo/);
  assert.match(draft, /Hora del recuento: 23:45/);
  assert.doesNotMatch(draft, /Circunstancias observadas/);
});

test("63 · ninguna pregunta pide al agente decidir si existe grave riesgo", () => {
  const labels = data.controles.flatMap((control) => control.preguntas.map((question) => question.etiqueta)).join(" | ");
  assert.doesNotMatch(labels, /¿Existe grave riesgo\?|¿Es infracción|¿Procede denunciar/i);
  assert.match(labels, /Constancia técnica o documental/);
});

test("64 · varias infracciones del mismo control no duplican el bloque ni el borrador del ANEXO", () => {
  const resolution = engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["reclamaciones", "contacto", "horario"], incidencia_informacion: "Tres elementos ausentes" }) });
  const sections = engine.buildAnnexSections(resolution);
  const draft = engine.buildAnnexDraft(resolution);
  assert.equal(resolution.incidencias.length, 3);
  assert.equal(sections.length, 1);
  assert.equal((draft.match(/Cartelería y documentación expuesta\./g) ?? []).length, 1);
});

test("65 · una persona de 18 años no activa la regla de menores", () => {
  const resolution = engine.resolveEstablishmentInspection({ menores: irregular({ edad_menor: "18", presencia_menor: ["permanencia"], tipo_local_menor: "Actividad con prohibición", prohibicion_menores: "prohibida" }) });
  assert.equal(resolution.incidencias.length, 0);
});

test("66 · las dos vías descriptivas del art. 51.34 producen una sola infracción", () => {
  const resolution = engine.resolveEstablishmentInspection({ licencia_actividad: irregular({ valoracion_cambio: "no_sustancial_acreditada", condiciones_titulo: "incumplimiento_documentado", hechos_cambio_condiciones: "Condición concreta incumplida" }) });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["51.34"]);
});

test("67 · horario no resuelve sin tipo, hora y actividad observada", () => {
  assert.equal(engine.resolveEstablishmentInspection({ horario: irregular({ incidencia_horario: ["cierre_superado"], hora_comprobacion: "03:00" }) }).incidencias.length, 0);
});

test("68 · sesión de menores no resuelve sin edad, actividad y conducta concreta", () => {
  assert.equal(engine.resolveEstablishmentInspection({ menores: irregular({ sesion_menores: "si", condiciones_sesion_menores: "incumplimiento_documentado" }) }).incidencias.length, 0);
});

test("69 · seguro exige carencia acreditada o incumplimiento objetivo de una póliza identificada", () => {
  assert.equal(engine.resolveEstablishmentInspection({ seguro: irregular({ cobertura_seguro: "no_cubierta" }) }).incidencias.length, 0);
  const resolution = engine.resolveEstablishmentInspection({ seguro: irregular({ estado_obligacion_seguro: "poliza_exhibida", entidad_poliza: "Entidad · póliza 123", cobertura_seguro: "no_cubierta" }) });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["51.28"]);
});

test("70 · seleccionar una conclusión de riesgo sin identificar soporte no escala a muy grave", () => {
  const capacity = engine.resolveEstablishmentInspection({ aforo: irregular({ aforo_autorizado: "100", personas_contabilizadas: "140", valoracion_riesgo_aforo: "grave_riesgo_acreditado" }) });
  const extinguisher = engine.resolveEstablishmentInspection({ extintores: irregular({ incidencia_extintor: ["inaccesible"], valoracion_riesgo_extintor: "grave_riesgo_acreditado" }) });
  const exit = engine.resolveEstablishmentInspection({ seguridad_evacuacion: irregular({ incidencia_salidas: ["obstaculos"], valoracion_seguridad_salidas: "grave_riesgo_acreditado" }) });
  assert.deepEqual([capacity, extinguisher, exit].map((item) => item.incidencias[0].clasificacion), ["GRAVE", "GRAVE", "GRAVE"]);
});

test("71 · un supuesto pendiente concurrente queda separado del Acta G determinada", () => {
  const resolution = engine.resolveEstablishmentInspection({
    horario: irregular({ incidencia_horario: ["supuesto_especial"] }),
    seguro: irregular({ estado_obligacion_seguro: "carencia_acreditada" }),
  });
  assert.equal(resolution.grupos.length, 2);
  assert.equal(resolution.grupos[0].documento, "ACTA G + ANEXO");
  assert.equal(resolution.grupos[1].documento, "PENDIENTE DE VALIDACIÓN JURÍDICA");
  assert.deepEqual(resolution.grupos.map((group) => group.incidencias.map((item) => item.clasificacion)), [["GRAVE"], ["PENDIENTE"]]);
});

test("72 · licencia y horario no duplican las infracciones centralizadas en cartelería", () => {
  const license = data.controles.find((control) => control.id === "licencia_actividad");
  const schedule = data.controles.find((control) => control.id === "horario");
  const noise = data.controles.find((control) => control.id === "ruido");
  assert.equal(license.resultados.some((item) => item.articulo === "50.8"), false);
  assert.equal(schedule.resultados.some((item) => item.articulo === "50.10"), false);
  assert.equal(noise.resultados.some((item) => item.articulo === "51.30"), false);
});

test("73 · carecer de título excluye actividad distinta y falta de exposición", () => {
  const resolution = engine.resolveEstablishmentInspection({
    licencia_actividad: irregular({ existencia_titulo: "no_consta", actividad_autorizada: "Café", actividad_observada: "Discoteca", actividad_coincide: "no" }),
    carteleria: irregular({ elemento_informacion: ["licencia"], documento_exponible: "consta", incidencia_informacion: "No se observa expuesta" }),
  });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["51.1"]);
});

test("74 · la falta de exposición exige que conste un documento existente", () => {
  assert.equal(engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["licencia"], incidencia_informacion: "No se observa" }) }).incidencias.length, 0);
  const resolution = engine.resolveEstablishmentInspection({ carteleria: irregular({ elemento_informacion: ["licencia"], documento_exponible: "consta", incidencia_informacion: "No se observa" }) });
  assert.deepEqual(resolution.incidencias.map((item) => item.articulo), ["50.8"]);
});
