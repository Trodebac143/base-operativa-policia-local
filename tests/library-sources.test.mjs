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
  assert.match(html, /Reglamento General de Vehículos/);
});

test("4 · una fuente con documento local muestra Abrir documento", () => {
  const html = render(library.LibrarySourcesPanel, { initialQuery: "Manual de Intervención VMP" });
  assert.match(html, />Abrir documento /);
});

test("5 · SANC conserva el PDF y señala la publicación oficial pendiente sin enviar al cotejo CSV", () => {
  const html = render(library.LibrarySourcesPanel, { initialQuery: "SANC 2026/13" });
  assert.match(html, />Abrir documento /);
  assert.match(html, /Publicación oficial pendiente de localizar/);
  assert.doesNotMatch(html, /run\.gob\.es|>Consultar fuente oficial /);
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

test("13 · la agrupación de Biblioteca es exhaustiva, exclusiva y declarada por cada fuente", async () => {
  const grouped = usageData.groupSourcesByLibraryMatter(sourceData.sources);
  const groupedIds = Object.values(grouped).flatMap((group) => group.map((source) => source.id));
  assert.equal(groupedIds.length, sourceData.sources.length);
  assert.equal(new Set(groupedIds).size, sourceData.sources.length);
  assert.deepEqual(new Set(groupedIds), new Set(sourceData.sources.map((source) => source.id)));

  const groupRegistry = JSON.parse(await readFile(new URL("../contenido/biblioteca/grupos-fuentes.json", import.meta.url), "utf8"));
  assert.deepEqual(usageData.sourceLibraryGroups.map((group) => group.id), groupRegistry.map((group) => group.id));
  const groupIds = new Set(groupRegistry.map((group) => group.id));
  for (const source of sourceData.sources) assert.ok(groupIds.has(source.grupoBiblioteca), `${source.id}: grupo inexistente`);
});

test("14 · Código Penal y ordenanzas tienen una carpeta editorial independiente de sus usos", () => {
  assert.equal(usageData.sourceLibraryGroupForSource("AN-SRC-007"), "seguridad_publica");
  assert.ok(usageData.sourceUsage("AN-SRC-007").length > 1, "el Código Penal conserva sus usos cruzados");

  const ordinances = sourceData.sources.filter((source) => /^(Ordenanza|Ordenanza municipal)$/i.test(source.tipo ?? ""));
  assert.deepEqual(ordinances.map((source) => source.id).sort(), [
    "OCC-TORRENT",
    "ORL-TORRENT",
    "OTA-TORRENT",
    "PA-URB-SRC-ZANJAS-CALAS-TORRENT",
    "TER-TORRENT",
    "TR-MOV-SRC-001",
    "VNS-TORRENT",
  ]);
  for (const source of ordinances) assert.equal(source.grupoBiblioteca, "ordenanzas_municipales", source.id);
});

test("15 · Fuentes se pliega por grupo activo con fuentes, ordena alfabéticamente y la búsqueda conserva una lista plana", () => {
  const grouped = usageData.groupSourcesByLibraryMatter(sourceData.sources);
  for (const group of usageData.sourceLibraryGroups) {
    const labels = grouped[group.id].map((source) => source.nombreCorto ?? source.nombre);
    assert.deepEqual(labels, [...labels].sort((left, right) => left.localeCompare(right, "es")), group.id);
  }

  const groupedHtml = render(library.LibrarySourcesPanel);
  assert.match(groupedHtml, /data-source-results="grouped"/);
  const visibleGroups = usageData.activeSourceLibraryGroups.filter((group) => grouped[group.id].length);
  assert.equal((groupedHtml.match(/<summary>/g) ?? []).length, visibleGroups.length);
  for (const group of visibleGroups) {
    assert.match(groupedHtml, new RegExp(`${group.icono}[\\s\\S]*${group.nombre}[\\s\\S]*${grouped[group.id].length} fuentes`));
  }
  assert.doesNotMatch(groupedHtml, /Fuentes transversales \/ comunes/);
  assert.doesNotMatch(groupedHtml, /Otras fuentes/);

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

test("19 · toda fuente utilizada ofrece consulta o comunica expresamente el documento pendiente", () => {
  for (const reference of usageData.allSourceReferences()) {
    const source = sourceData.resolveSourceReference(reference);
    const document = documentsData.documentForSource(source.id);
    assert.ok(source.urlOficial || document || source.consultaPendiente?.trim(), `${source.id} carece de consulta o motivo visible`);
    if (!source.urlOficial && !document) {
      const html = render(library.LibrarySourcesPanel, { initialQuery: source.nombre });
      assert.match(html, /Documento pendiente de localizar/);
      assert.match(render(sourceLinks.SourceLinks, { sourceIds: [source.id] }), /documento pendiente de localizar/);
    }
  }
});

test("21 · los PDF operativos no se hacen pasar por Consulta FGE 1/2026 ni Instrucción 12/C-105", () => {
  for (const id of ["TR-PERM-SRC-003", "TR-PERM-SRC-004"]) {
    assert.equal(documentsData.documentForSource(id), undefined);
    assert.doesNotMatch(render(sourceLinks.SourceLinks, { sourceIds: [id] }), /\/documentos\//);
  }
});

test("22 · la ficha de SSTS permite abrir las dos resoluciones concretas", () => {
  const source = sourceData.sources.find((s) => s.nombreCorto === "SSTS 788/2023 y 789/2023");
  assert.ok(source);
  for (const html of [render(library.LibrarySourcesPanel, { initialQuery: source.nombreCorto }), render(sourceLinks.SourceLinks, { sourceIds: [source.id] })]) {
    assert.match(html, /c1742cf11d548706/);
    assert.match(html, /7f5addb0f7223ea0/);
    assert.doesNotMatch(html, /indexAN\.jsp/);
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
