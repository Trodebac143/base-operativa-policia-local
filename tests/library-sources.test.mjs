import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

const sourceData = await vite.ssrLoadModule("/data/sources.ts");
const usageData = await vite.ssrLoadModule("/data/source-usage.ts");
const library = await vite.ssrLoadModule("/app/library-view.tsx");
const documentsData = await vite.ssrLoadModule("/data/documents.ts");
const render = (component, props = {}) => renderToStaticMarkup(React.createElement(component, props));

test("1 · Biblioteca diferencia 📄 Documentos y 🔗 Fuentes", () => {
  const html = render(library.LibraryView, { onBack() {} });
  assert.match(html, /📄 Documentos/);
  assert.match(html, /🔗 Fuentes/);
});

test("2 · Fuentes consume el registro jurídico central", async () => {
  const central = JSON.parse(await readFile(new URL("../contenido/juridico/fuentes.json", import.meta.url), "utf8"));
  assert.equal(sourceData.sources.length, central.length);
  assert.deepEqual(sourceData.sources.map((source) => source.id), central.map((source) => source.id));
});

test("3 · una fuente con URL muestra Consultar fuente oficial", () => {
  const html = render(library.LibrarySourcesPanel, { initialQuery: "Reglamento General de Vehículos" });
  assert.match(html, />Consultar fuente oficial /);
});

test("4 · una fuente con documento local muestra Abrir documento", () => {
  const html = render(library.LibrarySourcesPanel, { initialQuery: "Manual de Intervención VMP" });
  assert.match(html, />Abrir documento /);
});

test("5 · una fuente con URL y documento ofrece ambas acciones", () => {
  const html = render(library.LibrarySourcesPanel, { initialQuery: "SANC 2026/13" });
  assert.match(html, />Abrir documento /);
  assert.match(html, />Consultar fuente oficial /);
});

test("6 · una norma extensa puede existir sin PDF local", () => {
  const source = sourceData.sources.find((item) => item.id === "AN-SRC-007");
  assert.ok(source.urlOficial);
  assert.equal(source.documentoLocal, undefined);
});

test("7 · todos los sourceId activos resuelven en el catálogo", () => {
  const references = usageData.allSourceReferences();
  assert.ok(references.length > 100);
  for (const reference of references) assert.ok(sourceData.resolveSourceReference(reference), `No resuelve: ${reference}`);
});

test("8 · no hay referencias rotas ni IDs de fuente duplicados", () => {
  const ids = sourceData.sources.map((source) => source.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(usageData.allSourceReferences().filter((reference) => !sourceData.resolveSourceReference(reference)).length, 0);
});

test("9 · todos los documentos locales de fuentes existen", async () => {
  const localSources = sourceData.sources.filter((source) => source.documentoLocal);
  assert.ok(localSources.length >= 3);
  for (const source of localSources) await access(path.join(root, "public", "documentos", source.documentoLocal));
});

test("10 · el Manual VMP sigue disponible en Documentos y Fuentes", () => {
  assert.ok(documentsData.libraryDocuments.some((document) => document.archivo === "Manual Intervención VMP.pdf"));
  const source = sourceData.sources.find((item) => item.id === "TR-VMP-SRC-001");
  assert.equal(source.documentoLocal, "Manual Intervención VMP.pdf");
});

test("11 · los enlaces externos abren otra pestaña con aislamiento", () => {
  const html = render(library.LibrarySourcesPanel, { initialQuery: "Código Penal" });
  assert.match(html, /href="https:\/\/www\.boe\.es\//);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test("12 · Buscar fuente encuentra por nombre, norma y organismo", () => {
  assert.ok(sourceData.filterSources("Código Penal").some((source) => source.id === "AN-SRC-007"));
  assert.ok(sourceData.filterSources("Real Decreto 1428/2003").some((source) => source.id === "ALC-SRC-RGC"));
  assert.ok(sourceData.filterSources("Dirección General de Tráfico").length >= 5);
});

test("13 · Biblioteca conserva una composición de escritorio", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const html = render(library.LibrarySourcesPanel);
  assert.match(html, /class="source-library-list"/);
  assert.match(css, /\.source-library-list\s*\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/i);
});

test("14 · Biblioteca incluye estilos responsive para navegación y fichas", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@media\(max-width:700px\)\{\.library-tabs\{grid-template-columns:1fr\}\.source-library-list\{grid-template-columns:1fr\}/i);
  assert.match(css, /\.source-library-actions\{display:grid\}/i);
});
