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

test("Convivencia V1 contiene exactamente los diez casos, tres grupos y fuentes centrales", async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  const items = cases.filter((item) => item.categoria === "policia_administrativa_convivencia");
  assert.deepEqual(items.map((item) => item.id).sort(), Array.from({ length: 10 }, (_, index) => `CONV-OP-${String(index + 1).padStart(3, "0")}`));
  assert.ok(items.every((item) => item.modulo === "policia_administrativa" && item.estado === "validado" && item.competencia_resuelve === "Ayuntamiento de Torrent."));
  assert.deepEqual([...new Set(items.map((item) => item.datos_adicionales.convivencia.grupo))], ["Convivencia y molestias", "Limpieza y uso del espacio público", "Riesgos / incidencias"]);
  const sources = await readJson("contenido/juridico/fuentes.json");
  for (const id of ["OCC-TORRENT", "ORL-TORRENT"]) assert.match(sources.find((source) => source.id === id)?.urlOficial ?? "", /^https:\/\//);
});

test("las cuantías, artículos, horarios y escalones de residuos respetan el contenido validado", async () => {
  const cases = await readJson("contenido/_generado/casos.json"); const byId = new Map(cases.map((item) => [item.id, item]));
  assert.equal(byId.get("CONV-OP-001").importe_fijo, 90.15);
  assert.equal(byId.get("CONV-OP-004").importe_fijo, 60.10);
  assert.equal(byId.get("CONV-OP-002").datos_adicionales.convivencia.salidas[1].articulo, "8.h");
  const works = byId.get("CONV-OP-003").datos_adicionales.convivencia.salidas;
  assert.ok(works.some((item) => /Octubre–marzo/.test(JSON.stringify(item)) || item.cuando.situacion === "invierno_fuera"));
  assert.ok(works.some((item) => item.cuando.situacion === "verano_fuera"));
  assert.ok(works.filter((item) => !item.sinInfraccion).every((item) => item.sancion === "150 €"));
  for (const id of ["CONV-OP-005", "CONV-OP-006", "CONV-OP-007", "CONV-OP-008"]) assert.equal(byId.get(id).articulo, "23");
  const waste = byId.get("CONV-OP-009").datos_adicionales.convivencia.salidas;
  assert.deepEqual(waste.filter((item) => !item.sinInfraccion).map((item) => [item.articulo, item.calificacion, item.sancion]), [["23", "LEVE", "hasta 600 €"], ["22", "GRAVE", "601–900 €"], ["24", "MUY GRAVE", "901–6.000 €"]]);
  assert.ok(waste.some((item) => item.sinInfraccion && /Faltan datos/.test(item.resultado)));
  const fire = byId.get("CONV-OP-010").datos_adicionales.convivencia.salidas;
  assert.deepEqual(fire.filter((item) => !item.sinInfraccion).map((item) => [item.articulo, item.sancion]), [["7.b", "250 €"], ["7.c", "500 €"]]);
});

test("las derivaciones no penalizan automáticamente y la interfaz incorpora iconografía", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { ConvivenciaCategoryView, ConvivenciaCaseSheet } = await vite.ssrLoadModule("/app/convivencia.tsx");
  const items = cases.filter((item) => item.categoria === "policia_administrativa_convivencia");
  const catalogue = renderToStaticMarkup(React.createElement(ConvivenciaCategoryView, { cases: items, onOpenCase() {} }));
  assert.equal((catalogue.match(/conv-card-icon/g) ?? []).length, 10);
  assert.equal((catalogue.match(/conv-group-icon/g) ?? []).length, 3);
  assert.doesNotMatch(catalogue, /CONV-OP-00/);
  const sheet = renderToStaticMarkup(React.createElement(ConvivenciaCaseSheet, { item: items.find((item) => item.id === "CONV-OP-006") }));
  assert.match(sheet, /QUÉ COMPROBAR/); assert.match(sheet, /Fuentes jurídicas/); assert.match(sheet, /target="_blank"/); assert.doesNotMatch(sheet, /CONV-OP-006/);
  for (const id of ["CONV-OP-001", "CONV-OP-004", "CONV-OP-006", "CONV-OP-010"]) assert.match(JSON.stringify(items.find((item) => item.id === id).datos_adicionales.convivencia), /otraVia/);
});

test("Venta no sedentaria / Mercados sustituye la categoría Mercados independiente", async () => {
  const categories = await readJson("contenido/estructura/categorias.json");
  const vns = categories.find((item) => item.id === "policia_administrativa_venta_no_sedentaria");
  assert.equal(vns.nombre, "🛒 Venta no sedentaria / Mercados");
  assert.equal(categories.some((item) => item.id === "policia_administrativa_mercados"), false);
});
