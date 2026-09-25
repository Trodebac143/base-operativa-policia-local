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

test("Venta no sedentaria publica exactamente los catorce casos y la fuente central", async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  const vns = cases.filter((item) => item.categoria === "policia_administrativa_venta_no_sedentaria");
  assert.equal(vns.length, 14);
  assert.deepEqual(vns.map((item) => item.id).sort(), Array.from({ length: 14 }, (_, index) => `VNS-OP-${String(index + 1).padStart(3, "0")}`));
  assert.ok(vns.every((item) => item.modulo === "policia_administrativa" && item.estado === "validado" && item.competencia_resuelve === "Ayuntamiento de Torrent."));
  assert.ok(vns.every((item) => item.fuentes.length === 1 && item.fuentes[0] === "VNS-TORRENT"));
  const sources = await readJson("contenido/juridico/fuentes.json");
  assert.equal(sources.find((source) => source.id === "VNS-TORRENT").urlOficial, "https://torrent.es/wp-content/uploads/2023/08/SECR-Ordenanza-venta-no-sedentaria-Torrent.pdf");
});

test("las calificaciones, medidas y cruces operativos se conservan en contenido", async () => {
  const cases = await readJson("contenido/_generado/casos.json");
  const byId = new Map(cases.map((item) => [item.id, item]));
  assert.equal(byId.get("VNS-OP-001").calificacion, "MUY GRAVE");
  assert.match(byId.get("VNS-OP-001").actuacion.join(" "), /cese inmediato/i);
  assert.equal(byId.get("VNS-OP-002").calificacion, "LEVE");
  for (const id of ["VNS-OP-003", "VNS-OP-004", "VNS-OP-005", "VNS-OP-006", "VNS-OP-010", "VNS-OP-011", "VNS-OP-013"]) assert.equal(byId.get(id).calificacion, "GRAVE");
  assert.equal(byId.get("VNS-OP-009").datos_adicionales.venta_no_sedentaria.salidas[0].medida.length, 1);
  assert.match(byId.get("VNS-OP-012").datos_adicionales.venta_no_sedentaria.salidas[0].otraVia, /órgano autonómico competente/i);
  const illicit = byId.get("VNS-OP-014").datos_adicionales.venta_no_sedentaria.salidas[0];
  assert.equal(byId.get("VNS-OP-014").calificacion, "MUY GRAVE");
  assert.match(illicit.medida.join(" "), /Revocación definitiva.*cese/i);
  assert.match(illicit.advertencia.join(" "), /POSIBLE VÍA PENAL/);
});

test("el catálogo no adelanta artículos y la ficha muestra solo bloques operativos", async () => {
  const { cases } = await vite.ssrLoadModule("/data/cases.ts");
  const { VentaNoSedentariaCategoryView, VentaNoSedentariaCaseSheet } = await vite.ssrLoadModule("/app/non-sedentary-sales.tsx");
  const vns = cases.filter((item) => item.categoria === "policia_administrativa_venta_no_sedentaria");
  const categoryHtml = renderToStaticMarkup(React.createElement(VentaNoSedentariaCategoryView, { cases: vns, onOpenCase() {} }));
  assert.match(categoryHtml, /Autorización y condiciones del puesto/);
  assert.match(categoryHtml, /Documentación y obligaciones/);
  assert.match(categoryHtml, /Inspección e incidencias/);
  assert.doesNotMatch(categoryHtml, /39\.4\.b|401 a 700/);
  const html = renderToStaticMarkup(React.createElement(VentaNoSedentariaCaseSheet, { item: vns.find((item) => item.id === "VNS-OP-001") }));
  for (const title of ["QUÉ COMPROBAR", "RESULTADO", "ACTUACIÓN", "MEDIDA", "COMPETENCIA"]) assert.match(html, new RegExp(title));
  assert.match(html, /Ordenanza reguladora de la Venta No Sedentaria/);
  assert.match(html, /target="_blank"/);
  assert.doesNotMatch(html, /VNS-OP-001/);
});
