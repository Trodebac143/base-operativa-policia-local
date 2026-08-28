import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const notes = [];

const load = (relative) => {
  const full = path.join(root, relative);
  try { return JSON.parse(fs.readFileSync(full, "utf8")); }
  catch (error) { errors.push(`${relative}: JSON no válido (${error.message})`); return []; }
};
const reqArray = (relative) => {
  const value = load(relative);
  if (!Array.isArray(value)) errors.push(`${relative}: debe contener una lista JSON []`);
  return Array.isArray(value) ? value : [];
};
const duplicateIds = (items, label) => {
  const seen = new Set();
  for (const item of items) {
    if (!item?.id) { errors.push(`${label}: elemento sin id`); continue; }
    if (seen.has(item.id)) errors.push(`${label}: ID duplicado ${item.id}`);
    seen.add(item.id);
  }
  return seen;
};

const modules = reqArray("contenido/estructura/modulos.json");
const categories = reqArray("contenido/estructura/categorias.json");
const sources = reqArray("contenido/juridico/fuentes.json");
const penal = reqArray("contenido/juridico/articulos_penales.json");
const rules = reqArray("contenido/juridico/reglas_generales_y_comunes.json");
const documents = reqArray("contenido/biblioteca/documentos.json");
const animals = reqArray("contenido/animales/casos.json");
const itv = reqArray("contenido/seguridad_vial/itv/casos.json");
const seguro = reqArray("contenido/seguridad_vial/seguro/casos.json");
const itvMeasures = reqArray("contenido/seguridad_vial/itv/medidas.json");
const seguroMeasures = reqArray("contenido/seguridad_vial/seguro/medidas.json");
const itvTree = load("contenido/seguridad_vial/itv/arbol.json");
const seguroTree = load("contenido/seguridad_vial/seguro/arbol.json");

const moduleIds = duplicateIds(modules, "Módulos");
const categoryIds = duplicateIds(categories, "Categorías");
const sourceIds = duplicateIds(sources, "Fuentes");
duplicateIds(rules, "Reglas");
const penalIds = duplicateIds(penal, "Preceptos penales");
const measureIds = duplicateIds([...itvMeasures, ...seguroMeasures], "Medidas");
const cases = [...animals, ...itv, ...seguro];
const caseIds = duplicateIds(cases, "Casos");

for (const category of categories) if (!moduleIds.has(category.modulo)) errors.push(`Categoría ${category.id}: módulo desconocido ${category.modulo}`);

const requiredCaseFields = ["id", "modulo", "categoria", "titulo", "que_comprobar", "resultado", "norma", "articulo", "actuacion", "competencia_denuncia", "competencia_resuelve", "fuentes"];
for (const item of cases) {
  for (const field of requiredCaseFields) if (item[field] === undefined || item[field] === null || item[field] === "") errors.push(`${item.id ?? "caso sin id"}: falta ${field}`);
  if (!moduleIds.has(item.modulo)) errors.push(`${item.id}: módulo desconocido ${item.modulo}`);
  if (!categoryIds.has(item.categoria)) errors.push(`${item.id}: categoría desconocida ${item.categoria}`);
  if (!Array.isArray(item.que_comprobar) || !item.que_comprobar.length) errors.push(`${item.id}: que_comprobar debe ser una lista no vacía`);
  if (!Array.isArray(item.actuacion) || !item.actuacion.length) errors.push(`${item.id}: actuacion debe ser una lista no vacía`);
  if (!Array.isArray(item.fuentes)) errors.push(`${item.id}: fuentes debe ser una lista`);
  else for (const id of item.fuentes) if (!sourceIds.has(id)) errors.push(`${item.id}: fuente inexistente ${id}`);
  if (item.medidas) for (const id of item.medidas) if (!measureIds.has(id)) errors.push(`${item.id}: medida inexistente ${id}`);
  const penalId = item.penal_article_id;
  if (penalId && !penalIds.has(penalId)) errors.push(`${item.id}: precepto penal inexistente ${penalId}`);
  const conditionalPenalId = item.datos_adicionales?.relevancia_penal_condicional?.penal_article_id;
  if (conditionalPenalId && !penalIds.has(conditionalPenalId)) errors.push(`${item.id}: precepto penal condicional inexistente ${conditionalPenalId}`);
}

for (const precept of penal) if (precept.fuente_id && !sourceIds.has(precept.fuente_id)) errors.push(`${precept.id}: fuente penal inexistente ${precept.fuente_id}`);

function validateTree(tree, label) {
  if (!tree || Array.isArray(tree) || !Array.isArray(tree.nodes) || !tree.outcomes) { errors.push(`${label}: estructura de árbol no válida`); return; }
  const nodeIds = new Set(tree.nodes.map((node) => node.id));
  const outcomeIds = new Set(Object.keys(tree.outcomes));
  const targets = new Set([...nodeIds, ...outcomeIds]);
  for (const node of tree.nodes) {
    if (!targets.has(node.si)) errors.push(`${label}/${node.id}: destino SÍ inexistente ${node.si}`);
    if (!targets.has(node.no)) errors.push(`${label}/${node.id}: destino NO inexistente ${node.no}`);
  }
  for (const [id, outcome] of Object.entries(tree.outcomes)) if (outcome.caseId && !caseIds.has(outcome.caseId)) errors.push(`${label}/${id}: caso inexistente ${outcome.caseId}`);
}
validateTree(itvTree, "Árbol ITV");
validateTree(seguroTree, "Árbol Seguro");

for (const doc of documents) {
  if (!doc.titulo || !doc.archivo) errors.push(`Biblioteca: documento incompleto (${doc.titulo ?? "sin título"})`);
  else if (!fs.existsSync(path.join(root, "public", "documentos", doc.archivo))) errors.push(`Biblioteca: no existe public/documentos/${doc.archivo}`);
}

notes.push(`${cases.length} casos: ${animals.length} Animales + ${itv.length} ITV + ${seguro.length} Seguro`);
notes.push(`${sources.length} fuentes jurídicas · ${documents.length} documentos de biblioteca`);

if (errors.length) {
  console.error("\n❌ CONTENIDO NO VÁLIDO\n");
  for (const error of errors) console.error(`- ${error}`);
  console.error(`\n${errors.length} incidencia(s). No publiques hasta corregirlas.\n`);
  process.exit(1);
}
console.log("\n✅ CONTENIDO VÁLIDO");
for (const note of notes) console.log(`- ${note}`);
console.log("- Referencias, IDs, árboles, medidas y biblioteca: correctos\n");
