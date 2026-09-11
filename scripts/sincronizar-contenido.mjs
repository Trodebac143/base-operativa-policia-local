import fs from "node:fs";
import path from "node:path";
import {
  DOCUMENT_METADATA,
  DOCUMENTS_DIRECTORY,
  GENERATED_CASES,
  GENERATED_DOCUMENTS,
  ROOT,
  caseFiles,
  readJson,
  relativePath,
  writeJson,
} from "./contenido-config.mjs";

const failures = [];

function fail(message) {
  failures.push(message);
}

function synchronizeCases() {
  const records = [];
  for (const file of caseFiles()) {
    try {
      const value = readJson(file);
      if (!value || Array.isArray(value) || typeof value !== "object") {
        fail(`${relativePath(file)}: cada archivo debe contener un único caso JSON`);
        continue;
      }
      if (!value.id) {
        fail(`${relativePath(file)}: falta el campo id`);
        continue;
      }
      if (path.basename(file, ".json") !== value.id) {
        fail(`${relativePath(file)}: el archivo debe llamarse ${value.id}.json`);
        continue;
      }
      records.push(value);
    } catch (error) {
      fail(`${relativePath(file)}: JSON no válido (${error.message})`);
    }
  }
  return records;
}

function reasonableTitle(fileName) {
  const withoutExtension = fileName.replace(/\.pdf$/i, "").replaceAll("_", " ").replaceAll("-", " ").replace(/\s+/g, " ").trim();
  return withoutExtension.toLowerCase().replace(/(^|[\s/])\p{L}/gu, (letter) => letter.toUpperCase());
}

function nextDocumentId(records) {
  const used = new Set(records.map((record) => record.id));
  let next = records.reduce((maximum, record) => {
    const match = /^DOC-(\d+)$/.exec(record.id ?? "");
    return match ? Math.max(maximum, Number(match[1])) : maximum;
  }, 0) + 1;
  while (used.has(`DOC-${String(next).padStart(3, "0")}`)) next += 1;
  return `DOC-${String(next).padStart(3, "0")}`;
}

function synchronizeDocuments() {
  let metadata;
  try {
    metadata = readJson(DOCUMENT_METADATA);
  } catch (error) {
    fail(`contenido/biblioteca/metadatos.json: JSON no válido (${error.message})`);
    return { pdfCount: 0, added: 0, removed: 0, records: [] };
  }
  if (!Array.isArray(metadata)) {
    fail("contenido/biblioteca/metadatos.json: debe contener una lista JSON []");
    return { pdfCount: 0, added: 0, removed: 0, records: [] };
  }
  const pdfNames = fs.readdirSync(DOCUMENTS_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "es", { numeric: true }));
  const pdfSet = new Set(pdfNames);
  const byFile = new Map(metadata.filter((entry) => entry?.archivo).map((entry) => [entry.archivo, entry]));
  const removed = metadata.filter((entry) => entry?.archivo && !pdfSet.has(entry.archivo)).length;
  const active = metadata.filter((entry) => entry?.archivo && pdfSet.has(entry.archivo));
  let added = 0;
  for (const fileName of pdfNames) {
    if (byFile.has(fileName)) continue;
    const record = {
      id: nextDocumentId(active),
      titulo: reasonableTitle(fileName),
      archivo: fileName,
      descripcion: "Documento de consulta.",
    };
    active.push(record);
    added += 1;
  }
  const ids = new Set();
  const linkedSources = new Set();
  const sources = readJson(path.join(ROOT, "contenido", "juridico", "fuentes.json"));
  const sourceIds = new Set(sources.map((source) => source.id));
  for (const record of active) {
    if (!record.id) fail(`contenido/biblioteca/metadatos.json: el documento ${record.archivo} no tiene id`);
    else if (ids.has(record.id)) fail(`contenido/biblioteca/metadatos.json: ID de documento duplicado ${record.id}`);
    ids.add(record.id);
    if (record.fuenteId && !sourceIds.has(record.fuenteId)) fail(`contenido/biblioteca/metadatos.json: la fuente ${record.fuenteId} no existe`);
    if (record.fuenteId && linkedSources.has(record.fuenteId)) fail(`contenido/biblioteca/metadatos.json: la fuente ${record.fuenteId} está vinculada a más de un PDF`);
    if (record.fuenteId) linkedSources.add(record.fuenteId);
  }
  return { pdfCount: pdfNames.length, added, removed, records: active };
}

fs.mkdirSync(DOCUMENTS_DIRECTORY, { recursive: true });
const cases = synchronizeCases();
const documents = synchronizeDocuments();

if (failures.length) {
  console.error("\n❌ NO SE HA PODIDO SINCRONIZAR EL CONTENIDO\n");
  for (const message of failures) console.error(`- ${message}`);
  console.error("\nNo se han regenerado los índices. Corrige lo indicado y vuelve a ejecutar el comando.\n");
  process.exit(1);
}

writeJson(GENERATED_CASES, cases);
writeJson(DOCUMENT_METADATA, documents.records);
writeJson(GENERATED_DOCUMENTS, documents.records);

console.log("\n✅ CONTENIDO SINCRONIZADO\n");
console.log("BIBLIOTECA SINCRONIZADA");
console.log(`${documents.pdfCount} PDF encontrados`);
console.log(`+ ${documents.added} documento(s) nuevo(s) registrado(s)`);
console.log(`- ${documents.removed} documento(s) eliminado(s) del índice`);
console.log("0 referencias rotas detectadas durante la sincronización\n");
console.log("CASOS SINCRONIZADOS");
console.log(`${cases.length} archivo(s) de caso incluidos en el índice técnico`);
console.log(`Índice generado: ${relativePath(GENERATED_CASES)}\n`);
