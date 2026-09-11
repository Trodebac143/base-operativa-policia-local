import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CONTENT_ROOT = path.join(ROOT, "contenido");
export const DOCUMENTS_DIRECTORY = path.join(ROOT, "public", "documentos");
export const DOCUMENT_METADATA = path.join(CONTENT_ROOT, "biblioteca", "metadatos.json");
export const GENERATED_DOCUMENTS = path.join(CONTENT_ROOT, "biblioteca", "documentos.json");
export const GENERATED_CASES = path.join(CONTENT_ROOT, "_generado", "casos.json");

export const CASE_DIRECTORY_PRIORITY = [
  "contenido/animales/casos",
  "contenido/seguridad_vial/itv/casos",
  "contenido/seguridad_vial/seguro/casos",
  "contenido/seguridad_vial/permisos/casos",
];

export function relativePath(fullPath) {
  return path.relative(ROOT, fullPath).replaceAll(path.sep, "/");
}

export function readJson(fullPath) {
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

export function writeJson(fullPath, value) {
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function findCaseDirectories(directory, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    const child = path.join(directory, entry.name);
    if (entry.name === "casos") output.push(child);
    else findCaseDirectories(child, output);
  }
  return output;
}

export function caseDirectories() {
  const priority = new Map(CASE_DIRECTORY_PRIORITY.map((item, index) => [item, index]));
  return findCaseDirectories(CONTENT_ROOT).sort((left, right) => {
    const leftRelative = relativePath(left);
    const rightRelative = relativePath(right);
    const leftPriority = priority.get(leftRelative) ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = priority.get(rightRelative) ?? Number.MAX_SAFE_INTEGER;
    return leftPriority - rightPriority || leftRelative.localeCompare(rightRelative, "es", { numeric: true });
  });
}

export function caseFiles() {
  return caseDirectories().flatMap((directory) => fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json") && !entry.name.startsWith("_"))
    .map((entry) => path.join(directory, entry.name))
    .sort((left, right) => path.basename(left).localeCompare(path.basename(right), "es", { numeric: true })));
}
