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
const sourceLinks = await vite.ssrLoadModule("/app/source-links.tsx");
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

test("9 · todos los documentos vinculados a fuentes existen", async () => {
  const linkedDocuments = documentsData.libraryDocuments.filter((document) => document.fuenteId);
  assert.ok(linkedDocuments.length >= 3);
  for (const document of linkedDocuments) await access(path.join(root, "public", "documentos", document.archivo));
});

test("10 · el Manual VMP sigue disponible en Documentos y Fuentes", () => {
  assert.ok(documentsData.libraryDocuments.some((document) => document.archivo === "Manual Intervención VMP.pdf"));
  const source = sourceData.sources.find((item) => item.id === "TR-VMP-SRC-001");
  assert.equal(documentsData.documentForSource(source.id)?.archivo, "Manual Intervención VMP.pdf");
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

test("13 · la agrupación de Biblioteca es exhaustiva, exclusiva y conserva los conteos", () => {
  const grouped = usageData.groupSourcesByLibraryMatter(sourceData.sources);
  const counts = Object.fromEntries(usageData.sourceLibraryGroups.map((group) => [group.id, grouped[group.id].length]));
  assert.deepEqual(counts, {
    animals: 9,
    traffic: 25,
    "public-security": 14,
    "administrative-police": 11,
    transversal: 4,
    other: 2,
  });

  const groupedIds = Object.values(grouped).flatMap((group) => group.map((source) => source.id));
  assert.equal(groupedIds.length, sourceData.sources.length);
  assert.equal(new Set(groupedIds).size, sourceData.sources.length);
  assert.deepEqual(new Set(groupedIds), new Set(sourceData.sources.map((source) => source.id)));
});

test("14 · los usos multi-módulo, reglas transversales y fuentes sin uso terminan en su grupo único", () => {
  for (const id of ["AN-SRC-007", "OCC-TORRENT", "TR-ITV-SRC-001", "TR-MOV-SRC-001"]) {
    assert.equal(usageData.sourceLibraryGroupForSource(id), "transversal", id);
  }
  for (const id of ["ORL-TORRENT", "VNS-TORRENT"]) {
    assert.equal(usageData.sourceLibraryGroupForSource(id), "other", id);
  }
  assert.equal(usageData.sourceLibraryGroupFromUsage(["Uso no identificable"]), "other");
});

test("15 · Fuentes se pliega por materia sin búsqueda y la búsqueda conserva una lista plana", () => {
  const groupedHtml = render(library.LibrarySourcesPanel);
  assert.match(groupedHtml, /data-source-results="grouped"/);
  assert.equal((groupedHtml.match(/<summary>/g) ?? []).length, 6);
  for (const [icon, label, count] of [["🐾", "Animales", 9], ["🚦", "Seguridad Vial", 25], ["🛡️", "Seguridad Pública", 14], ["🏛️", "Policía Administrativa", 11], ["🔄", "Fuentes transversales \/ comunes", 4], ["📚", "Otras fuentes", 2]]) {
    assert.match(groupedHtml, new RegExp(`${icon}[\\s\\S]*${label}[\\s\\S]*${count} fuentes`));
  }

  const searchHtml = render(library.LibrarySourcesPanel, { initialQuery: "Manual de Intervención VMP" });
  assert.match(searchHtml, /data-source-results="search"/);
  assert.doesNotMatch(searchHtml, /<details/);
  assert.match(searchHtml, /🚦<\/span> Seguridad Vial/);
  assert.equal((searchHtml.match(/class="source-library-card"/g) ?? []).length, 1);
});

test("16 · Biblioteca conserva una composición de escritorio", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const html = render(library.LibrarySourcesPanel);
  assert.match(html, /class="source-library-list"/);
  assert.match(css, /\.source-library-list\s*\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/i);
});

test("17 · Biblioteca incluye estilos responsive para navegación y fichas", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /@media\(max-width:700px\)\{\.library-tabs\{grid-template-columns:1fr\}\.source-library-list\{grid-template-columns:1fr\}/i);
  assert.match(css, /\.source-library-actions\{display:grid\}/i);
});

test("18 · las fuentes de la intervención penal están registradas, visibles y enlazadas", () => {
  for (const id of ["AN-SRC-007", "SP-SRC-LECRIM", "SP-SRC-LO-1-2004", "SP-SRC-LO-10-2022", "SP-SRC-LO-1-2025", "SP-SRC-LO-1-2026", "SP-SRC-VIOGEN-2"]) {
    const source = sourceData.sources.find((item) => item.id === id);
    assert.ok(source, `Falta ${id}`);
    assert.ok(source.urlOficial || documentsData.documentForSource(source.id), `${id} no tiene enlace consultable`);
    const html = render(library.LibrarySourcesPanel, { initialQuery: source.nombreCorto ?? source.nombre });
    assert.match(html, /Consultar fuente oficial|Abrir documento/);
  }
});

test("19 · toda fuente utilizada por contenido activo ofrece consulta en Biblioteca", () => {
  for (const reference of usageData.allSourceReferences()) {
    const source = sourceData.resolveSourceReference(reference);
    assert.ok(source.urlOficial || documentsData.documentForSource(source.id), `${source.id} carece de enlace visible`);
  }
});

test("20 · las fichas resuelven fuentes externas, documentos locales y referencias desconocidas", () => {
  const external = render(sourceLinks.SourceLinks, { sourceIds: ["TER-TORRENT"] });
  assert.match(external, /href="https:\/\/www\.torrent\.es\/.+\.pdf"/i);
  assert.match(external, /target="_blank"/);
  assert.match(external, /rel="noopener noreferrer"/);

  const localSource = documentsData.libraryDocuments.find((document) => document.fuenteId);
  assert.ok(localSource);
  const local = render(sourceLinks.SourceLinks, { sourceIds: [localSource.fuenteId] });
  assert.match(local, /\/documentos\//);
  assert.equal(render(sourceLinks.SourceLinks, { sourceIds: ["FUENTE-INEXISTENTE"] }), "");
});
