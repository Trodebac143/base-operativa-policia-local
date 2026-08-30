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
const permisos = reqArray("contenido/seguridad_vial/permisos/casos.json");
const permisosRules = reqArray("contenido/seguridad_vial/permisos/reglas.json");
const permisosSheets = reqArray("contenido/seguridad_vial/permisos/fichas_juridicas.json");
const permisosHelps = reqArray("contenido/seguridad_vial/permisos/ayudas.json");
const permisosGroups = reqArray("contenido/seguridad_vial/permisos/subgrupos.json");
const itvMeasures = reqArray("contenido/seguridad_vial/itv/medidas.json");
const seguroMeasures = reqArray("contenido/seguridad_vial/seguro/medidas.json");
const trafficMeasures = reqArray("contenido/seguridad_vial/medidas.json");
const trafficMeasurePlans = load("contenido/seguridad_vial/medidas_por_caso.json");
const itvTree = load("contenido/seguridad_vial/itv/arbol.json");
const seguroTree = load("contenido/seguridad_vial/seguro/arbol.json");

const moduleIds = duplicateIds(modules, "Módulos");
const categoryIds = duplicateIds(categories, "Categorías");
const sourceIds = duplicateIds(sources, "Fuentes");
duplicateIds([...rules, ...permisosRules], "Reglas");
duplicateIds(permisosSheets, "Fichas jurídicas Permisos");
const permitHelpIds = duplicateIds(permisosHelps, "Ayudas Permisos");
const permitGroupIds = duplicateIds(permisosGroups, "Subgrupos Permisos");
const penalIds = duplicateIds(penal, "Preceptos penales");
const measureIds = duplicateIds([...trafficMeasures, ...itvMeasures, ...seguroMeasures], "Medidas");
const cases = [...animals, ...itv, ...seguro, ...permisos];
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
  if (item.ayudas) for (const id of item.ayudas) if (!permitHelpIds.has(id)) errors.push(`${item.id}: ayuda inexistente ${id}`);
  const penalId = item.penal_article_id;
  if (penalId && !penalIds.has(penalId)) errors.push(`${item.id}: precepto penal inexistente ${penalId}`);
  const conditionalPenalId = item.datos_adicionales?.relevancia_penal_condicional?.penal_article_id;
  if (conditionalPenalId && !penalIds.has(conditionalPenalId)) errors.push(`${item.id}: precepto penal condicional inexistente ${conditionalPenalId}`);
}

for (const group of permisosGroups) {
  if (!group.nombre || !group.descripcion || !Number.isFinite(group.orden)) errors.push(`${group.id}: subgrupo incompleto`);
  if (!Array.isArray(group.casos) || !group.casos.length) errors.push(`${group.id}: debe contener casos`);
  else for (const id of group.casos) {
    const item = permisos.find((candidate) => candidate.id === id);
    if (!item) errors.push(`${group.id}: caso inexistente ${id}`);
    else if (item.subgrupo !== group.id) errors.push(`${id}: no declara el subgrupo ${group.id}`);
  }
  if (group.ayudas) for (const id of group.ayudas) if (!permitHelpIds.has(id)) errors.push(`${group.id}: ayuda inexistente ${id}`);
}
for (const item of permisos) if (item.subgrupo && !permitGroupIds.has(item.subgrupo)) errors.push(`${item.id}: subgrupo inexistente ${item.subgrupo}`);
const foreignCases = permisos.filter((item) => item.subgrupo === "permisos_extranjeros");
if (foreignCases.length !== 6) errors.push(`Permisos extranjeros: se esperaban 6 casos y hay ${foreignCases.length}`);
for (const item of foreignCases) if (item.ayudas || item.enlaces_operativos) errors.push(`${item.id}: enlaces o ayudas deben estar en el subgrupo, no en el caso`);

if (!trafficMeasurePlans || Array.isArray(trafficMeasurePlans) || typeof trafficMeasurePlans !== "object") errors.push("medidas_por_caso: debe contener un objeto JSON");
else {
  const trafficCases = [...itv, ...seguro];
  for (const item of trafficCases) {
    const plan = trafficMeasurePlans[item.id];
    if (!plan?.inmovilizacion || !["SÍ", "NO", "CONDICIONADA"].includes(plan.inmovilizacion.estado)) errors.push(`${item.id}: plan de inmovilización inválido`);
    if (plan?.inmovilizacion?.estado !== "NO" && !/104\.1\.[a-z].*72\.2\.[a-z]/i.test(plan.inmovilizacion.fundamento ?? "")) errors.push(`${item.id}: inmovilización sin doble fundamento exacto 104.1/72.2`);
    if (plan?.inmovilizacion?.estado !== "NO") {
      if (!/105\.1\.c.*73\.1\.c/i.test(plan.retirada_sin_lugar?.fundamento ?? "")) errors.push(`${item.id}: falta la rama independiente 105.1.c/73.1.c`);
      if (!/sin lugar adecuado/i.test(plan.retirada_sin_lugar?.detalle ?? "")) errors.push(`${item.id}: la rama c no está limitada a la falta de lugar adecuado`);
      if (!/105\.1\.d.*73\.1\.d/i.test(plan.retirada_persistencia?.fundamento ?? "")) errors.push(`${item.id}: falta la rama independiente 105.1.d/73.1.d`);
      if (!/causa no cesa/i.test(plan.retirada_persistencia?.detalle ?? "") || !/aunque exista lugar adecuado/i.test(plan.retirada_persistencia?.detalle ?? "")) errors.push(`${item.id}: la rama d no acredita persistencia independiente del lugar`);
      if (!plan.levantamiento) errors.push(`${item.id}: falta condición de levantamiento`);
    }
    const serializedPlan = JSON.stringify(plan);
    if (/depósito municipal.*(?:ordinario|automático)|104\.5.*(?:retirada|depósito)/i.test(serializedPlan)) errors.push(`${item.id}: criterio anterior de lugar o retirada todavía presente`);
  }
}
const trafficRules = rules.filter((rule) => rule.id === "TR-GEN-R-104-105-001" && rule.activo);
if (trafficRules.length !== 1) errors.push("Debe existir una única regla transversal activa TR-GEN-R-104-105-001");
for (const rule of rules) if (rule.fuentes) for (const id of rule.fuentes) if (!sourceIds.has(id)) errors.push(`${rule.id}: fuente inexistente ${id}`);
const torrentSource = sources.find((source) => source.id === "TR-MOV-SRC-001");
if (!torrentSource || torrentSource.estado_vigencia_auditoria !== "validado") errors.push("Falta la Ordenanza de Torrent como fuente activa validada");

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

notes.push(`${cases.length} casos: ${animals.length} Animales + ${itv.length} ITV + ${seguro.length} Seguro + ${permisos.length} Permisos`);
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
