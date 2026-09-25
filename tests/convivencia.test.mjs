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

test("Convivencia conserva exactamente diez casos, tres grupos y fuentes centrales", async () => {
  const items = await convivencia();
  assert.deepEqual([...items.keys()].sort(), Array.from({ length: 10 }, (_, index) => `CONV-OP-${String(index + 1).padStart(3, "0")}`));
  assert.deepEqual([...new Set([...items.values()].map((item) => item.datos_adicionales.convivencia.grupo))], ["Convivencia y molestias", "Limpieza y uso del espacio público", "Riesgos / incidencias"]);
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

test("CONV-OP-004 parte del impedimento real y deriva actividades sin sanción automática", async () => {
  const obstacle = (await convivencia()).get("CONV-OP-004");
  const serial = JSON.stringify(obstacle.datos_adicionales.convivencia);
  assert.equal(obstacle.titulo, "Bultos u objetos que impiden la libre circulación");
  assert.match(condition(obstacle, "impide").etiqueta, /impide realmente la libre circulación/i);
  assert.deepEqual(condition(obstacle, "vinculo").opciones.map((entry) => entry.valor), ["particular", "terraza", "obra", "actividad", "indeterminado"]);
  assert.doesNotMatch(serial, /"No consta"/);
  assert.match(serial, /No se acredita el supuesto del art\. 8\.f/i);
  assert.match(serial, /60,10 €/); assert.match(serial, /180,00 €/);
  assert.match(serial, /Terrazas/); assert.match(serial, /Urbanismo/);
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
  assert.deepEqual(condition(waste, "tipo").opciones.map((entry) => entry.valor), ["poda", "muebles", "escombros", "otros", "peligroso", "indeterminado"]);
  for (const id of ["ramas_contenedor", "ramas_troceado", "ramas_hatillos", "ramas_longitud", "ramas_diametro", "ramas_cantidad", "cesped_bolsas", "cesped_contenedor", "cesped_volumen", "cesped_cantidad"]) assert.ok(condition(waste, id));
  assert.match(serial, /Entrega admitida por el servicio ordinario conforme al art\. 11/);
  assert.match(serial, /superan 1 metro|supera 1 metro/); assert.match(serial, /inferior a 50 cm/i); assert.match(serial, /dos hatillos/i);
  assert.match(serial, /bolsa supera 50 litros/i); assert.match(serial, /dos bolsas/i);
  assert.match(serial, /1\.000 litros o 25 kg/); assert.match(serial, /no asigna por sí sola una infracción/i);
  assert.doesNotMatch(waste.datos_adicionales.convivencia.condiciones.map((entry) => `${entry.etiqueta} ${entry.opciones.map((option) => option.etiqueta).join(" ")}`).join(" "), /entidad escasa|entidad mayor acreditada|leve.*grave/i);
  assert.deepEqual(outcomes(waste).filter((entry) => entry.sancion).map((entry) => [entry.articulo, entry.calificacion, entry.sancion.tipo]), [["24", "MUY GRAVE", "rango"], ["24", "MUY GRAVE", "rango"], ["24", "MUY GRAVE", "rango"], ["24", "MUY GRAVE", "rango"], ["23", "LEVE", "maximo"], ["23", "LEVE", "maximo"], ["23", "LEVE", "maximo"], ["22", "GRAVE", "rango"], ["22", "GRAVE", "rango"], ["22", "GRAVE", "rango"]]);
});

test("la presentación diferencia cuantía fija, máximo, rango y régimen alternativo", async () => {
  const { SanctionPresentation } = await vite.ssrLoadModule("/app/sanction-presentation.tsx");
  const fixed = renderToStaticMarkup(React.createElement(SanctionPresentation, { fixed: 60.1 }));
  const maximum = renderToStaticMarkup(React.createElement(SanctionPresentation, { max: 600 }));
  const range = renderToStaticMarkup(React.createElement(SanctionPresentation, { min: 601, max: 900 }));
  const regime = renderToStaticMarkup(React.createElement(SanctionPresentation, { sanction: { tipo: "regimen", texto: "multa o suspensión" } }));
  assert.match(fixed, /Sanción prevista/); assert.match(maximum, /Máximo previsto por la norma/); assert.match(range, /Rango sancionador/); assert.match(regime, /Régimen sancionador previsto/);
  assert.match(`${maximum}${range}`, /La cuantía concreta corresponde al órgano sancionador/);
});

test("el catálogo mantiene iconografía, fuentes y no expone IDs internos", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { ConvivenciaCategoryView, ConvivenciaCaseSheet } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const items = cases.filter((item) => item.categoria === "policia_administrativa_convivencia");
  const catalogue = renderToStaticMarkup(React.createElement(ConvivenciaCategoryView, { cases: items, onOpenCase() {} }));
  assert.equal((catalogue.match(/conv-card-icon/g) ?? []).length, 10); assert.equal((catalogue.match(/conv-group-icon/g) ?? []).length, 3); assert.doesNotMatch(catalogue, /CONV-OP-00/);
  const sheet = renderToStaticMarkup(React.createElement(ConvivenciaCaseSheet, { item: items.find((item) => item.id === "CONV-OP-009") }));
  assert.match(sheet, /Fuentes jurídicas/); assert.match(sheet, /target="_blank"/); assert.doesNotMatch(sheet, /CONV-OP-009/);
});

test("Venta no sedentaria / Mercados sustituye la categoría Mercados independiente", async () => {
  const categories = await readJson("contenido/estructura/categorias.json");
  assert.equal(categories.find((item) => item.id === "policia_administrativa_venta_no_sedentaria").nombre, "🛒 Venta no sedentaria / Mercados");
  assert.equal(categories.some((item) => item.id === "policia_administrativa_mercados"), false);
});
