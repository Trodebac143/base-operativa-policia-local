import test, { after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const vite = await createServer({ appType: "custom", configFile: false, root: rootPath, resolve: { alias: { "@": rootPath } }, server: { middlewareMode: true } });
after(async () => vite.close());

const convivencia = async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  return new Map(cases.filter((item) => item.categoria === "policia_administrativa_convivencia").map((item) => [item.id, item]));
};
const condition = (item, id) => item.datos_adicionales.convivencia.condiciones.find((entry) => entry.id === id);
const outcomes = (item) => item.datos_adicionales.convivencia.salidas;
const outcome = (item, expected) => outcomes(item).find((entry) => Object.entries(expected).every(([key, value]) => entry.cuando[key] === value));

test("Convivencia conserva los diez IDs iniciales, admite nuevos casos y mantiene tres grupos", async () => {
  const items = await convivencia();
  const firstTen = Array.from({ length: 10 }, (_, index) => `CONV-OP-${String(index + 1).padStart(3, "0")}`);
  assert.ok(items.size >= 10); assert.ok(firstTen.every((id) => items.has(id)));
  assert.deepEqual([...new Set([...items.values()].map((item) => item.datos_adicionales.convivencia.grupo))].sort(), ["Convivencia, molestias y actividades", "Limpieza, ornato y publicidad", "Uso y seguridad del espacio público"].sort());
  assert.ok([...items.values()].every((item) => item.estado === "validado" && item.competencia_resuelve === "Ayuntamiento de Torrent."));
  const sources = await readJson("contenido/juridico/fuentes.json");
  for (const id of ["OCC-TORRENT", "ORL-TORRENT", "AN-SRC-007", "SP-SRC-LO-4-2015"]) assert.match(sources.find((source) => source.id === id)?.urlOficial ?? "", /^https:\/\//);
});

test("CONV-OP-003 aplica el horario general de sábado y el supuesto exacto de fiesta", async () => {
  const works = (await convivencia()).get("CONV-OP-003");
  const serial = JSON.stringify(works.datos_adicionales.convivencia);
  assert.match(condition(works, "festivo").ayuda, /sábados se aplica el horario general/i);
  assert.match(serial, /08:00 y 18:00/); assert.match(serial, /08:00 y 20:00/);
  assert.match(serial, /fiesta local oficial o día festivo tradicional/i);
  assert.match(serial, /casco urbano/i); assert.match(serial, /perturbación/i);
  assert.match(serial, /autorización excepcional específica/i);
  assert.doesNotMatch(serial, /domingos prohibido|prohibición especial de sábado|todos los festivos/i);
  assert.equal(outcomes(works).filter((entry) => entry.sancion?.texto === "150 €").length, 5);
});

test("CONV-OP-004 conserva el art. 8.f para objetos particulares y deriva terraza y obra a destinos concretos", async () => {
  const obstacle = (await convivencia()).get("CONV-OP-004");
  const serial = JSON.stringify(obstacle.datos_adicionales.convivencia);
  assert.equal(obstacle.titulo, "Bultos u objetos que impiden la libre circulación");
  assert.match(condition(obstacle, "impide").etiqueta, /impide realmente la libre circulación/i);
  assert.deepEqual(condition(obstacle, "vinculo").opciones.map((entry) => entry.valor), ["particular", "terraza", "obra", "actividad", "indeterminado"]);
  assert.doesNotMatch(serial, /"No consta"/);
  assert.match(serial, /No se acredita el supuesto del art\. 8\.f/i);
  const particular = outcome(obstacle, { impide: "si", vinculo: "particular" });
  assert.equal(particular.articulo, "8.f"); assert.equal(particular.sancion.texto, "60,10 €");
  const terrace = outcome(obstacle, { impide: "si", vinculo: "terraza" });
  assert.equal(terrace.sinInfraccion, undefined);
  assert.match(terrace.regulacionEspecifica.nombre, /Ordenanza de terrazas de Torrent/);
  assert.deepEqual(terrace.regulacionEspecifica.destino, { tipo: "caso", caseId: "TER-OP-005" });
  const works = outcome(obstacle, { impide: "si", vinculo: "obra" });
  assert.equal(works.sinInfraccion, undefined);
  assert.deepEqual(works.regulacionEspecifica.destino, { tipo: "urbanismo", routeId: "via_publica" });
  assert.match(serial, /180,00 €/);
});

test("CONV-OP-005 usa el título y las palabras de búsqueda acordadas sin cambiar su encaje", async () => {
  const item = (await convivencia()).get("CONV-OP-005");
  assert.equal(item.titulo, "Miccionar, defecar, escupir o realizar necesidades fisiológicas en espacios públicos");
  assert.deepEqual(item.palabras_clave, ["miccionar", "orinar", "orina", "mear", "defecar", "escupir", "necesidades fisiológicas", "vía pública"]);
  assert.equal(item.datos_adicionales.convivencia.grupo, "Limpieza, ornato y publicidad");
  assert.equal(item.articulo, "23"); assert.equal(item.rango_max, 600);
});

test("las salidas pendientes o sin infracción no muestran sanción y usan norma y fuentes de salida", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { ConvivenciaCaseSheet } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const base = cases.find((item) => item.id === "CONV-OP-001");
  for (const flag of ["pendiente", "sinInfraccion"]) {
    const item = { ...base, datos_adicionales: { convivencia: { grupo: "Convivencia, molestias y actividades", orden: 1, condiciones: [], salidas: [{ cuando: {}, [flag]: true, resultado: "Comprobación pendiente", norma: "Norma indicada por la salida", fuentes: ["ORL-TORRENT"], sancion: { tipo: "fija", texto: "999 €" } }] } } };
    const html = renderToStaticMarkup(React.createElement(ConvivenciaCaseSheet, { item, onNavigate() {} }));
    assert.match(html, /Comprobación pendiente/); assert.match(html, /Norma indicada por la salida/);
    assert.doesNotMatch(html, /999 €|Sanción prevista/); assert.match(html, /Ordenanza Municipal de Residuos Urbanos y Limpieza Viaria de Torrent/);
  }
});

test("al cambiar una respuesta elimina las respuestas de preguntas que quedan ocultas", async () => {
  const { pruneHiddenConvivenciaAnswers } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const conditions = [
    { id: "root", etiqueta: "Inicio", opciones: [] },
    { id: "branch", etiqueta: "Rama", mostrarSi: [{ root: "a" }], opciones: [] },
    { id: "child", etiqueta: "Subrama", mostrarSi: [{ branch: "yes" }], opciones: [] },
    { id: "always", etiqueta: "Siempre", opciones: [] },
  ];
  assert.deepEqual(pruneHiddenConvivenciaAnswers(conditions, { root: "b", branch: "yes", child: "stale", always: "ok" }), { root: "b", always: "ok" });
});

test("CONV-OP-008 distingue Convivencia, limpieza viaria, rótulos y salidas pendientes", async () => {
  const posters = (await convivencia()).get("CONV-OP-008");
  const serial = JSON.stringify(posters.datos_adicionales.convivencia);
  assert.deepEqual(condition(posters, "tipo").opciones.map((entry) => entry.valor), ["comercial", "orl", "especial", "rotulo", "pendiente"]);
  const commercial = outcome(posters, { tipo: "comercial" });
  assert.equal(commercial.articulo, "16.6"); assert.equal(commercial.sancion.texto, "350,00 €");
  assert.equal(commercial.norma, "Ordenanza de Convivencia de Torrent"); assert.deepEqual(commercial.fuentes, ["OCC-TORRENT"]);
  const litter = outcome(posters, { tipo: "orl" });
  assert.equal(litter.articulo, "23"); assert.equal(litter.sancion.texto, "Hasta 600,00 €"); assert.deepEqual(litter.fuentes, ["ORL-TORRENT"]);
  const sign = outcome(posters, { tipo: "rotulo" });
  assert.equal(sign.articulo, "12.1"); assert.deepEqual(sign.fuentes, ["OCC-TORRENT"]);
  for (const value of ["especial", "pendiente"]) {
    const result = outcome(posters, { tipo: value });
    assert.equal(result.pendiente, true); assert.equal(result.sancion, undefined); assert.equal(result.articulo, undefined);
  }
  assert.match(serial, /no aplicar automáticamente el régimen comercial/i);
});

test("CONV-OP-008 resuelve fuentes separadas por salida y no mezcla las fuentes generales", async () => {
  const { sourceIdsForConvivenciaOutcome } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const posters = (await convivencia()).get("CONV-OP-008");
  const data = posters.datos_adicionales.convivencia;
  assert.deepEqual(sourceIdsForConvivenciaOutcome(posters.id, posters.fuentes, outcome(posters, { tipo: "comercial" })), ["OCC-TORRENT"]);
  assert.deepEqual(sourceIdsForConvivenciaOutcome(posters.id, posters.fuentes, outcome(posters, { tipo: "orl" })), ["ORL-TORRENT"]);
  assert.deepEqual(sourceIdsForConvivenciaOutcome(posters.id, posters.fuentes, outcome(posters, { tipo: "rotulo" })), ["OCC-TORRENT"]);
  assert.deepEqual(sourceIdsForConvivenciaOutcome(posters.id, posters.fuentes, outcome(posters, { tipo: "especial" })), []);
  assert.deepEqual(sourceIdsForConvivenciaOutcome(posters.id, posters.fuentes), posters.fuentes);
  assert.deepEqual(data.salidas.map((entry) => entry.fuentes ?? null), [["OCC-TORRENT"], ["ORL-TORRENT"], null, ["OCC-TORRENT"], null]);
});

test("los casos CONV-OP-011 a 023 conservan sus importes y las salidas pendientes no asignan multa", async () => {
  const items = await convivencia();
  const expected = {
    "CONV-OP-011": ["60,10 €"], "CONV-OP-012": ["120,20 €", "120,20 €"], "CONV-OP-013": ["30,05 €"],
    "CONV-OP-014": ["30,05 €", "30,05 €"], "CONV-OP-015": ["90,15 €"], "CONV-OP-016": ["350,00 €"],
    "CONV-OP-017": ["350,00 €"], "CONV-OP-018": ["350,00 €"], "CONV-OP-019": ["350,00 €", "350,00 €"],
    "CONV-OP-020": ["30,05 €"], "CONV-OP-021": ["90,15 €"], "CONV-OP-022": ["60,10 €", "60,10 €", "30,05 €"],
    "CONV-OP-023": ["60,10 €"],
  };
  for (const [id, fines] of Object.entries(expected)) {
    const item = items.get(id);
    assert.ok(item, `${id} debe estar presente`);
    assert.deepEqual(outcomes(item).flatMap((entry) => entry.sancion?.texto ? [entry.sancion.texto] : []), fines, id);
  }
  const additions = [...items.values()].filter((item) => item.id >= "CONV-OP-011" && item.id <= "CONV-OP-023");
  const pending = additions.flatMap((item) => outcomes(item).filter((entry) => entry.pendiente));
  assert.ok(pending.length > 0);
  assert.ok(pending.every((entry) => !entry.sancion && !entry.articulo && !entry.calificacion));
  assert.ok(additions.every((item) => item.datos_adicionales.convivencia.condiciones?.length && item.datos_adicionales.convivencia.salidas?.length));
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { ConvivenciaCaseSheet } = await vite.ssrLoadModule("/app/convivencia.tsx");
  for (const item of additions) for (const entry of outcomes(item).filter((result) => result.pendiente)) {
    const base = cases.find((caseItem) => caseItem.id === item.id);
    const fixture = { ...base, datos_adicionales: { convivencia: { ...base.datos_adicionales.convivencia, condiciones: [], salidas: [{ ...entry, cuando: {} }] } } };
    const html = renderToStaticMarkup(React.createElement(ConvivenciaCaseSheet, { item: fixture, onNavigate() {} }));
    assert.match(html, /RESULTADO/); assert.doesNotMatch(html, /Sanción prevista/);
  }
});

test("las derivaciones nuevas abren sus destinos y las salidas vacías no heredan multas base", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { ConvivenciaCaseSheet } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const items = await convivencia();
  const expected = [
    ["CONV-OP-011", { conducta: "penal" }, { tipo: "categoria", categoryId: "seguridad_publica_agresiones_lesiones" }],
    ["CONV-OP-012", { ambito: "local" }, { tipo: "categoria", categoryId: "policia_administrativa_establecimientos_actividades" }],
    ["CONV-OP-015", { hecho: "si", penal: "si" }, { tipo: "categoria", categoryId: "seguridad_publica_patrimonio" }],
    ["CONV-OP-021", { hecho: "si", penal: "si" }, { tipo: "categoria", categoryId: "seguridad_publica_patrimonio" }],
    ["CONV-OP-022", { hecho: "penal" }, { tipo: "categoria", categoryId: "seguridad_publica_patrimonio" }],
    ["CONV-OP-023", { hecho: "si", especifica: "obra" }, { tipo: "urbanismo", routeId: "via_publica" }],
  ];
  for (const [id, facts, destination] of expected) {
    const entry = outcome(items.get(id), facts);
    assert.deepEqual(entry.regulacionEspecifica.destino, destination, id);
    const base = cases.find((item) => item.id === id);
    const fixture = { ...base, datos_adicionales: { convivencia: { ...base.datos_adicionales.convivencia, condiciones: [], salidas: [{ ...entry, cuando: {} }] } } };
    const html = renderToStaticMarkup(React.createElement(ConvivenciaCaseSheet, { item: fixture, onNavigate() {} }));
    assert.match(html, /EXISTE REGULACIÓN ESPECÍFICA/); assert.doesNotMatch(html, /Sanción prevista/);
  }
});

test("CONV-OP-006 pregunta por intervención observable y solo advierte una posible vía penal", async () => {
  const graffiti = (await convivencia()).get("CONV-OP-006");
  const serial = JSON.stringify(graffiti.datos_adicionales.convivencia);
  assert.match(condition(graffiti, "intervencion").etiqueta, /intervención necesita la superficie/i);
  assert.match(condition(graffiti, "bien").etiqueta, /tipo de bien/i);
  assert.doesNotMatch(serial, /posible relevancia penal\?/i);
  assert.match(serial, /POSIBLE VÍA PENAL — DAÑOS/);
  assert.match(serial, /art\. 263\.2\.4 CP/); assert.match(serial, /400 € no determinan/i);
  assert.doesNotMatch(serial, /"Es delito"/);
});

test("CONV-OP-009 distingue poda admitida de depósito irregular sin pedir una calificación", async () => {
  const waste = (await convivencia()).get("CONV-OP-009");
  const serial = JSON.stringify(waste.datos_adicionales.convivencia);
  assert.deepEqual(condition(waste, "vinculo").opciones.map((entry) => entry.valor), ["terraza", "vns", "obra", "ninguno"]);
  assert.deepEqual(condition(waste, "tipo").mostrarSi, [{ vinculo: "ninguno" }]);
  assert.deepEqual(condition(waste, "tipo").opciones.map((entry) => entry.valor), ["poda", "muebles", "escombros", "otros", "peligroso", "indeterminado"]);
  for (const id of ["ramas_contenedor", "ramas_troceado", "ramas_hatillos", "ramas_longitud", "ramas_diametro", "ramas_cantidad", "cesped_bolsas", "cesped_contenedor", "cesped_volumen", "cesped_cantidad"]) assert.ok(condition(waste, id));
  assert.match(serial, /Entrega admitida por el servicio ordinario conforme al art\. 11/);
  assert.match(serial, /superan 1 metro|supera 1 metro/); assert.match(serial, /inferior a 50 cm/i); assert.match(serial, /dos hatillos/i);
  assert.match(serial, /bolsa supera 50 litros/i); assert.match(serial, /dos bolsas/i);
  assert.match(serial, /1\.000 litros o 25 kg/); assert.match(serial, /no asigna por sí sola una infracción/i);
  assert.doesNotMatch(waste.datos_adicionales.convivencia.condiciones.map((entry) => `${entry.etiqueta} ${entry.opciones.map((option) => option.etiqueta).join(" ")}`).join(" "), /entidad escasa|entidad mayor acreditada|leve.*grave/i);
  const referrals = outcomes(waste).filter((entry) => entry.regulacionEspecifica);
  assert.deepEqual(referrals.map((entry) => entry.regulacionEspecifica.destino), [
    { tipo: "caso", caseId: "TER-OP-008" },
    { tipo: "caso", caseId: "VNS-OP-011" },
    { tipo: "urbanismo", routeId: "via_publica" },
  ]);
  assert.ok(referrals.every((entry) => entry.sinInfraccion === undefined && entry.sancion === undefined));
  const generalOutcomes = outcomes(waste).filter((entry) => !entry.regulacionEspecifica);
  assert.ok(generalOutcomes.every((entry) => entry.cuando.vinculo === "ninguno"));
  assert.deepEqual(generalOutcomes.filter((entry) => entry.sancion).map((entry) => [entry.articulo, entry.calificacion, entry.sancion.tipo]), [["24", "MUY GRAVE", "rango"], ["24", "MUY GRAVE", "rango"], ["24", "MUY GRAVE", "rango"], ["24", "MUY GRAVE", "rango"], ["23", "LEVE", "maximo"], ["23", "LEVE", "maximo"], ["23", "LEVE", "maximo"], ["22", "GRAVE", "rango"], ["22", "GRAVE", "rango"], ["22", "GRAVE", "rango"]]);
});

test("las regulaciones específicas se renderizan como botones y page resuelve casos, categorías y Urbanismo", async () => {
  const { SpecificRegulationCard } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const waste = (await convivencia()).get("CONV-OP-009");
  const referral = outcome(waste, { vinculo: "terraza" }).regulacionEspecifica;
  const html = renderToStaticMarkup(React.createElement(SpecificRegulationCard, { referral, onNavigate() {} }));
  assert.match(html, /<button type="button">Abrir «Limpieza y residuos»/);
  assert.match(html, /EXISTE REGULACIÓN ESPECÍFICA/);
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /destination\.tipo === "caso"[\s\S]*openCase\(target\)/);
  assert.match(page, /destination\.tipo === "urbanismo"[\s\S]*urbanismoRouteId: destination\.routeId/);
  assert.match(page, /categories\.find\(\(category\) => category\.id === destination\.categoryId\)[\s\S]*setView\(\{ moduleId: target\.modulo, categoryId: target\.id \}\)/);
  assert.match(page, /UrbanismoGuideView initialRouteId=\{view\.urbanismoRouteId\}/);
  assert.match(page, /onNavigate=\{openSpecificRegulation\}/);
  assert.match(page, /selectedGroup=\{view\.convivenciaGroup\} onSelectGroup=\{\(group\) => setView\(\{ moduleId: view\.moduleId, categoryId: selectedCategory\.id, convivenciaGroup: group \}\)\}/);
  assert.match(page, /selectedCase\.categoria === "policia_administrativa_convivencia" \? view\.convivenciaGroup : undefined/);
});

test("los casos modificados no conservan textos genéricos de derivación", async () => {
  const items = await convivencia();
  const text = ["CONV-OP-004", "CONV-OP-008", "CONV-OP-009"].map((id) => JSON.stringify(items.get(id))).join(" ");
  assert.doesNotMatch(text, /legislación sectorial|regulación sectorial|régimen sectorial|normativa correspondiente|módulo específico|valorar otra vía|otraVia/i);
});

test("la presentación diferencia cuantía fija, máximo, rango y régimen alternativo", async () => {
  const { SanctionPresentation } = await vite.ssrLoadModule("/app/sanction-presentation.tsx");
  const fixed = renderToStaticMarkup(React.createElement(SanctionPresentation, { fixed: 60.1 }));
  const maximum = renderToStaticMarkup(React.createElement(SanctionPresentation, { max: 600 }));
  const range = renderToStaticMarkup(React.createElement(SanctionPresentation, { min: 601, max: 900 }));
  const regime = renderToStaticMarkup(React.createElement(SanctionPresentation, { sanction: { tipo: "regimen", texto: "multa o suspensión" } }));
  const identifiedWithoutAmount = renderToStaticMarkup(React.createElement(SanctionPresentation, { sanction: { tipo: "sin_cuantia", articulo: "X", conducta: "conducta identificada" } }));
  assert.match(fixed, /Sanción prevista/); assert.match(maximum, /Máximo previsto por la norma/); assert.match(range, /Rango sancionador/); assert.match(regime, /Régimen sancionador previsto/);
  assert.match(`${maximum}${range}`, /La cuantía concreta corresponde al órgano sancionador/);
  assert.match(identifiedWithoutAmount, /Incumplimiento del art\. X — conducta identificada/);
  assert.match(identifiedWithoutAmount, /La ordenanza no establece un importe específico para este incumplimiento/);
  assert.match(identifiedWithoutAmount, /La sanción, en su caso, será determinada por el órgano sancionador competente/);
  assert.doesNotMatch(identifiedWithoutAmount, /sin importe automático validado|tramitar conforme al régimen sancionador aplicable/i);
});

test("el selector inicial muestra solo tres grupos y cada grupo solo sus casos", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { ConvivenciaCategoryView, ConvivenciaCaseSheet, convivenciaIconNames } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const { convivenciaGroups } = await vite.ssrLoadModule("/data/convivencia.ts");
  const items = cases.filter((item) => item.categoria === "policia_administrativa_convivencia");
  assert.deepEqual(convivenciaGroups.map((group) => [group.nombre, group.icono, group.tema]), [
    ["Convivencia, molestias y actividades", "people", "convivencia"],
    ["Limpieza, ornato y publicidad", "clean", "limpieza"],
    ["Uso y seguridad del espacio público", "street", "espacio-publico"],
  ]);
  const catalogue = renderToStaticMarkup(React.createElement(ConvivenciaCategoryView, { cases: items, onOpenCase() {} }));
  assert.equal((catalogue.match(/conv-group-card-icon/g) ?? []).length, 3); assert.doesNotMatch(catalogue, /conv-card-icon|Gritos, escándalos|CONV-OP-00/);
  for (const group of convivenciaGroups) {
    const count = items.filter((item) => item.datos_adicionales.convivencia.grupo === group.nombre).length;
    const view = renderToStaticMarkup(React.createElement(ConvivenciaCategoryView, { cases: items, selectedGroup: group.nombre, onSelectGroup() {}, onOpenCase() {} }));
    assert.equal((view.match(/conv-card-icon/g) ?? []).length, count);
    if (group.secciones) {
      assert.deepEqual(group.secciones.map((section) => section.casos.length), [6, 5]);
      assert.equal(new Set(group.secciones.flatMap((section) => section.casos)).size, count);
      for (const section of group.secciones) assert.ok(view.includes(section.nombre));
    }
    assert.match(view, /Volver a los grupos/); assert.match(view, new RegExp(`${count} casos?`)); assert.doesNotMatch(view, /CONV-OP-00/);
  }
  assert.ok(items.every((item) => item.datos_adicionales.convivencia.icono && item.datos_adicionales.convivencia.tema));
  assert.ok(items.every((item) => convivenciaIconNames.includes(item.datos_adicionales.convivencia.icono)));
  const searchedFixtures = [["CONV-OP-011", "procesión"], ["CONV-OP-014", "riego"], ["CONV-OP-017", "buzón"], ["CONV-OP-022", "numeración"], ["CONV-OP-023", "senda"]];
  for (const [id, term] of searchedFixtures) assert.ok(items.find((item) => item.id === id).palabras_clave.some((word) => word.toLocaleLowerCase("es").includes(term)), `${id} incluye ${term} para búsqueda`);
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  assert.match(page, /item\.palabras_clave/);
  const source = await readFile(new URL("app/convivencia.tsx", root), "utf8");
  for (const icon of ["party", "tree", "droplet", "balcony", "sign", "mailbox", "megaphone", "street", "furniture", "fire", "clean"]) assert.match(source, new RegExp(`\\n  ${icon}:`));
  const sheet = renderToStaticMarkup(React.createElement(ConvivenciaCaseSheet, { item: items.find((item) => item.id === "CONV-OP-009"), onNavigate() {} }));
  assert.match(sheet, /Fuentes jurídicas/); assert.match(sheet, /target="_blank"/); assert.doesNotMatch(sheet, /CONV-OP-009/);
});

test("Venta no sedentaria / Mercados sustituye la categoría Mercados independiente", async () => {
  const categories = await readJson("contenido/estructura/categorias.json");
  const category = categories.find((item) => item.id === "policia_administrativa_venta_no_sedentaria");
  assert.equal(category.nombre, "Venta no sedentaria / Mercados");
  assert.equal(category.icono, "🛒");
  assert.equal(categories.some((item) => item.id === "policia_administrativa_mercados"), false);
});
