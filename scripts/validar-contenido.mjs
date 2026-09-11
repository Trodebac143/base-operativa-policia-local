import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { caseFiles, readJson, relativePath } from "./contenido-config.mjs";

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

const loadCases = () => {
  const items = [];
  const filesById = new Map();
  for (const full of caseFiles()) {
    const relative = relativePath(full);
    let value;
    try { value = readJson(full); }
    catch (error) { errors.push(`CASO · ${relative}\n  Problema: JSON no válido (${error.message})\n  Qué hacer: corrige la sintaxis y vuelve a validar.`); continue; }
    if (!value || Array.isArray(value) || typeof value !== "object") {
      errors.push(`CASO · ${relative}\n  Problema: el archivo debe contener un único objeto JSON.\n  Qué hacer: deja un solo caso entre llaves { }.`);
      continue;
    }
    items.push(value);
    if (value.id) filesById.set(value.id, relative);
    if (value.id && path.basename(full, ".json") !== value.id) {
      errors.push(`CASO ${value.id}\n  Problema: el nombre del archivo no coincide con el ID.\n  Archivo: ${relative}\n  Qué hacer: renómbralo como ${value.id}.json.`);
    }
  }
  return { items, filesById };
};

const modules = reqArray("contenido/estructura/modulos.json");
const categories = reqArray("contenido/estructura/categorias.json");
const sources = reqArray("contenido/juridico/fuentes.json");
const penal = reqArray("contenido/juridico/articulos_penales.json");
const rules = reqArray("contenido/juridico/reglas_generales_y_comunes.json");
const documents = reqArray("contenido/biblioteca/documentos.json");
const documentMetadata = reqArray("contenido/biblioteca/metadatos.json");
const loadedCases = loadCases();
const cases = loadedCases.items;
const animals = cases.filter((item) => item.modulo === "animales");
const itv = cases.filter((item) => item.categoria === "seguridad_vial_itv");
const seguro = cases.filter((item) => item.categoria === "seguridad_vial_seguro");
const permisos = cases.filter((item) => item.categoria === "seguridad_vial_permisos");
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
const seguridadPublica = load("contenido/seguridad_publica/operativa.json");
const vmpGuide = load("contenido/seguridad_vial/vmp/guia.json");
const alcoholemia = load("contenido/seguridad_vial/alcoholemia.json");

const moduleIds = duplicateIds(modules, "Módulos");
const categoryIds = duplicateIds(categories, "Categorías");
const sourceIds = duplicateIds(sources, "Fuentes");
duplicateIds([...rules, ...permisosRules], "Reglas");
duplicateIds(permisosSheets, "Fichas jurídicas Permisos");
const permitHelpIds = duplicateIds(permisosHelps, "Ayudas Permisos");
const permitGroupIds = duplicateIds(permisosGroups, "Subgrupos Permisos");
const penalIds = duplicateIds(penal, "Preceptos penales");
const measureIds = duplicateIds([...trafficMeasures, ...itvMeasures, ...seguroMeasures], "Medidas");
const caseIds = duplicateIds(cases, "Casos");
const generatedCases = reqArray("contenido/_generado/casos.json");
if (JSON.stringify(generatedCases) !== JSON.stringify(cases)) errors.push("ÍNDICE DE CASOS\n  Problema: el índice técnico no coincide con los archivos editables.\n  Qué hacer: ejecuta npm run contenido:sincronizar y vuelve a validar.");

const normalizeSourceReference = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const sourceReferenceIndex = new Map();
const sourceUrlIndex = new Map();
duplicateIds(documents, "Documentos");
const documentsBySource = new Map();
for (const document of documents) {
  if (!document.fuenteId) continue;
  if (documentsBySource.has(document.fuenteId)) errors.push(`BIBLIOTECA · ${document.id}\n  Problema: más de un PDF está vinculado a la fuente ${document.fuenteId}.\n  Archivo: contenido/biblioteca/metadatos.json\n  Qué hacer: conserva un único fuenteId por fuente.`);
  else documentsBySource.set(document.fuenteId, document);
}
for (const source of sources) {
  if (!source.nombre) errors.push(`Fuente ${source.id}: falta nombre`);
  for (const reference of [source.id, source.nombre, source.nombreCorto, ...(source.referencias ?? [])]) {
    if (!reference) continue;
    const normalized = normalizeSourceReference(reference);
    const previous = sourceReferenceIndex.get(normalized);
    if (previous && previous !== source.id) errors.push(`Fuentes: referencia ambigua "${reference}" en ${previous} y ${source.id}`);
    else sourceReferenceIndex.set(normalized, source.id);
  }
  if (source.urlOficial) {
    try {
      const url = new URL(source.urlOficial);
      if (!["http:", "https:"].includes(url.protocol)) errors.push(`Fuente ${source.id}: urlOficial debe ser HTTP(S)`);
      const normalizedUrl = `${url.origin}${url.pathname.replace(/\/$/, "")}${url.search}`.toLowerCase();
      const previousUrl = sourceUrlIndex.get(normalizedUrl);
      if (previousUrl && previousUrl !== source.id) errors.push(`Fuentes: URL oficial duplicada en ${previousUrl} y ${source.id}`);
      else sourceUrlIndex.set(normalizedUrl, source.id);
    } catch {
      errors.push(`Fuente ${source.id}: urlOficial no válida`);
    }
  }
  if (Object.hasOwn(source, "documentoLocal")) errors.push(`FUENTE ${source.id}\n  Problema: todavía usa el campo antiguo documentoLocal.\n  Archivo: contenido/juridico/fuentes.json\n  Qué hacer: elimina ese campo y vincula el PDF desde biblioteca/metadatos.json mediante fuenteId.`);
}

const sourceReferenceKeys = new Set(["sourceId", "fuenteId", "source_id", "fuente_id", "sources", "fuentes", "fuente_manual", "fuentes_v3", "fuentes_juridicas_validadas"]);
const sourceReferenceUsage = new Map(sources.map((source) => [source.id, 0]));
function validateSourceReferences(value, label, key = "") {
  if (typeof value === "string") {
    if (sourceReferenceKeys.has(key)) {
      const resolvedId = sourceReferenceIndex.get(normalizeSourceReference(value));
      if (!resolvedId) errors.push(`${label}: fuente inexistente ${value}`);
      else sourceReferenceUsage.set(resolvedId, (sourceReferenceUsage.get(resolvedId) ?? 0) + 1);
    }
    return;
  }
  if (Array.isArray(value)) {
    if (sourceReferenceKeys.has(key)) {
      for (const reference of value) {
        if (typeof reference !== "string") errors.push(`${label}: la lista ${key} debe contener solo referencias de fuente`);
        else validateSourceReferences(reference, label, key);
      }
    } else {
      for (const entry of value) validateSourceReferences(entry, label, key);
    }
    return;
  }
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) validateSourceReferences(childValue, label, childKey);
  }
}

for (const [label, value] of [
  ["Animales", animals],
  ["Seguridad Vial/ITV", itv],
  ["Seguridad Vial/Seguro", seguro],
  ["Seguridad Vial/Permisos", permisos],
  ["Reglas comunes", rules],
  ["Reglas de permisos", permisosRules],
  ["Fichas de permisos", permisosSheets],
  ["Preceptos penales", penal],
  ["Seguridad Pública", seguridadPublica],
  ["VMP/VPL", vmpGuide],
  ["Alcoholemia", alcoholemia],
]) validateSourceReferences(value, label);

for (const source of sources) {
  if ((sourceReferenceUsage.get(source.id) ?? 0) > 0 && !source.urlOficial && !documentsBySource.has(source.id)) {
    errors.push(`FUENTE ${source.id}\n  Problema: está utilizada, pero no tiene URL oficial ni PDF vinculado.\n  Qué hacer: añade urlOficial a la fuente o fuenteId al documento en contenido/biblioteca/metadatos.json.`);
  }
}

for (const category of categories) if (!moduleIds.has(category.modulo)) errors.push(`Categoría ${category.id}: módulo desconocido ${category.modulo}`);

const requiredCaseFields = ["id", "modulo", "categoria", "titulo", "palabras_clave", "que_comprobar", "resultado", "norma", "articulo", "actuacion", "competencia_denuncia", "competencia_resuelve", "advertencias", "alerta_penal", "fuentes", "estado"];
for (const item of cases) {
  const caseFile = loadedCases.filesById.get(item.id) ?? "archivo de caso desconocido";
  for (const field of requiredCaseFields) if (item[field] === undefined || item[field] === null || item[field] === "") errors.push(`CASO ${item.id ?? "SIN ID"}\n  Problema: falta el campo obligatorio ${field}.\n  Archivo: ${caseFile}\n  Qué hacer: completa el campo siguiendo contenido/_plantillas/caso-operativo.json.`);
  if (!moduleIds.has(item.modulo)) errors.push(`${item.id}: módulo desconocido ${item.modulo}`);
  if (!categoryIds.has(item.categoria)) errors.push(`${item.id}: categoría desconocida ${item.categoria}`);
  const category = categories.find((candidate) => candidate.id === item.categoria);
  if (category && category.modulo !== item.modulo) errors.push(`CASO ${item.id}\n  Problema: la categoría ${item.categoria} pertenece al módulo ${category.modulo}, no a ${item.modulo}.\n  Archivo: ${caseFile}\n  Qué hacer: corrige modulo o categoria.`);
  if (!Array.isArray(item.que_comprobar) || !item.que_comprobar.length) errors.push(`${item.id}: que_comprobar debe ser una lista no vacía`);
  if (!Array.isArray(item.actuacion) || !item.actuacion.length) errors.push(`${item.id}: actuacion debe ser una lista no vacía`);
  if (!Array.isArray(item.palabras_clave)) errors.push(`${item.id}: palabras_clave debe ser una lista`);
  if (!Array.isArray(item.advertencias)) errors.push(`${item.id}: advertencias debe ser una lista`);
  if (item.fichas_juridicas !== undefined && !Array.isArray(item.fichas_juridicas)) errors.push(`${item.id}: fichas_juridicas debe ser una lista cuando se utilice`);
  if (typeof item.alerta_penal !== "boolean") errors.push(`${item.id}: alerta_penal debe ser true o false`);
  if (!["borrador", "revision", "validado", "bloqueado"].includes(item.estado)) errors.push(`${item.id}: estado no válido`);
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
  if (Object.hasOwn(group, "casos")) errors.push(`${group.id}: elimina la lista técnica casos; ahora se genera desde el campo subgrupo de cada caso`);
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
    const plan = trafficMeasurePlans[item.id] ?? trafficMeasurePlans._por_categoria?.[item.categoria];
    if (!plan?.inmovilizacion || !["SÍ", "NO", "CONDICIONADA"].includes(plan.inmovilizacion.estado)) errors.push(`${item.id}: plan de inmovilización inválido`);
    if (plan?.inmovilizacion?.estado !== "NO" && !/104\.1\.[a-z].*72\.2\.[a-z]/i.test(plan.inmovilizacion.fundamento ?? "")) errors.push(`${item.id}: inmovilización sin doble fundamento exacto 104.1/72.2`);
    if (plan?.inmovilizacion?.estado !== "NO") {
      if (!/105\.1\.c.*73\.1\.c/i.test(plan.retirada_sin_lugar?.fundamento ?? "")) errors.push(`${item.id}: falta la rama independiente 105.1.c/73.1.c`);
      if (!/(sin|no existe) lugar adecuado/i.test(plan.retirada_sin_lugar?.detalle ?? "")) errors.push(`${item.id}: la rama c no está limitada a la falta de lugar adecuado`);
      const persistencia = plan.traslado_deposito ?? plan.retirada_persistencia;
      if (!/105\.1\.d.*73\.1\.d/i.test(persistencia?.fundamento ?? "")) errors.push(`${item.id}: falta la rama independiente 105.1.d/73.1.d`);
      if (!/(causa no cesa|persistiendo la causa)/i.test(persistencia?.detalle ?? "")) errors.push(`${item.id}: la rama d no acredita persistencia independiente del lugar`);
      if (!plan.levantamiento) errors.push(`${item.id}: falta condición de levantamiento`);
    }
    if (item.categoria === "seguridad_vial_seguro") {
      if (plan?.circulacion?.estado !== "PROHIBIDA" || !/3\.1\.a/i.test(plan.circulacion.fundamento ?? "")) errors.push(`${item.id}: falta la prohibición de circulación por seguro`);
      if (plan?.inmovilizacion?.estado !== "SÍ") errors.push(`${item.id}: la carencia comprobada de seguro debe resolver inmovilización SÍ`);
      if (plan?.traslado_deposito?.estado !== "SÍ" || !/105\.1\.d.*73\.1\.d/i.test(plan.traslado_deposito.fundamento ?? "")) errors.push(`${item.id}: falta traslado a depósito por persistencia de seguro`);
      if (!/3\.1\.b/i.test(plan?.regimen_especifico?.fundamento ?? "")) errors.push(`${item.id}: falta el régimen específico de depósito o precinto por seguro`);
    }
    const serializedPlan = JSON.stringify(plan);
    if (/depósito municipal.*(?:ordinario|automático)|104\.5[^\"]*(?:retirada|depósito)/i.test(serializedPlan)) errors.push(`${item.id}: criterio anterior de lugar o retirada todavía presente`);
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

if (!seguridadPublica || Array.isArray(seguridadPublica) || !Array.isArray(seguridadPublica.conceptos)) errors.push("Seguridad Pública: estructura operativa no válida");
else {
  duplicateIds(seguridadPublica.conceptos, "Conceptos Seguridad Pública");
  for (const concept of seguridadPublica.conceptos) {
    for (const field of ["id", "bloque", "titulo", "resultado", "norma", "frontera"]) if (!concept[field]) errors.push(`Seguridad Pública/${concept.id ?? "sin id"}: falta ${field}`);
    if (!Array.isArray(concept.sinonimos) || !concept.sinonimos.length) errors.push(`Seguridad Pública/${concept.id}: faltan sinónimos`);
    if (!Array.isArray(concept.comprobar) || !concept.comprobar.length) errors.push(`Seguridad Pública/${concept.id}: faltan comprobaciones`);
  }
  if (!seguridadPublica.comunes?.registros || seguridadPublica.comunes.registros.length !== 4) errors.push("Seguridad Pública: faltan las cuatro chuletas de registro");
}

if (!vmpGuide || Array.isArray(vmpGuide) || !Array.isArray(vmpGuide.areas)) errors.push("VMP/VPL: estructura operativa no válida");
else {
  if (vmpGuide.categoria !== "seguridad_vial_vmp" || !categoryIds.has(vmpGuide.categoria)) errors.push("VMP/VPL: categoría no enlazada");
  const expectedVmpAreas = ["Identificar / clasificar vehículo", "Certificado, registro e identificación", "Seguro obligatorio", "Requisitos técnicos / modificaciones", "Normas de circulación", "Alcohol y drogas", "Menores de edad"];
  if (vmpGuide.areas.length !== 7) errors.push(`VMP/VPL: se esperaban 7 áreas y hay ${vmpGuide.areas.length}`);
  if (vmpGuide.areas.some((area) => area.id === "inmovilizacion")) errors.push("VMP/VPL: la inmovilización no puede ser un área de entrada");
  if (vmpGuide.areas.map((area) => area.titulo).join("|") !== expectedVmpAreas.join("|")) errors.push("VMP/VPL: títulos u orden de las siete áreas incorrectos");
  duplicateIds(vmpGuide.areas, "Áreas VMP/VPL");
  if (!sourceIds.has(vmpGuide.fuente_manual)) errors.push(`VMP/VPL: fuente inexistente ${vmpGuide.fuente_manual}`);
  if (vmpGuide.documentacion?.infracciones?.length !== 3) errors.push("VMP/VPL: catálogo documental incompleto");
  if (vmpGuide.tecnica?.infracciones?.length !== 3) errors.push("VMP/VPL: catálogo técnico incompleto");
  if (!Array.isArray(vmpGuide.circulacion?.infracciones) || vmpGuide.circulacion.infracciones.length < 15) errors.push("VMP/VPL: catálogo de circulación incompleto");
  if (!Array.isArray(vmpGuide.casos_practicos) || vmpGuide.casos_practicos.length !== 8) errors.push("VMP/VPL: deben existir exactamente 8 casos prácticos");
  else {
    duplicateIds(vmpGuide.casos_practicos, "Casos prácticos VMP/VPL");
    for (const item of vmpGuide.casos_practicos) {
      for (const field of ["situacion", "datos_clave", "que_comprobar", "por_que", "hechos"]) if (!item[field]) errors.push(`VMP/VPL/${item.id}: falta ${field}`);
      const stored = JSON.stringify(item.hechos);
      if (/"(?:codigo|articulo|importe|reducido|inmovilizacion|deposito)"\s*:/i.test(stored)) errors.push(`VMP/VPL/${item.id}: duplica sanciones o medidas fuera del motor común`);
    }
  }
  const referencedSeguroCases = Object.values(vmpGuide.seguro ?? {}).flatMap((value) => value && typeof value === "object" ? Object.values(value) : []).filter((value) => typeof value === "string" && value.startsWith("TR-SOA-OP-"));
  for (const caseId of referencedSeguroCases) if (!caseIds.has(caseId)) errors.push(`VMP/VPL: caso común de Seguro inexistente ${caseId}`);
}

if (JSON.stringify(documents) !== JSON.stringify(documentMetadata)) errors.push("BIBLIOTECA\n  Problema: el índice técnico no coincide con los metadatos editables.\n  Qué hacer: ejecuta npm run contenido:sincronizar y vuelve a validar.");
const documentFiles = new Set();
for (const doc of documents) {
  if (!doc.id || !doc.titulo || !doc.archivo || !doc.descripcion) errors.push(`BIBLIOTECA · ${doc.id ?? "documento sin ID"}\n  Problema: faltan id, titulo, archivo o descripcion.\n  Archivo: contenido/biblioteca/metadatos.json\n  Qué hacer: completa esos campos.`);
  if (doc.archivo && (path.basename(doc.archivo) !== doc.archivo || !/\.pdf$/i.test(doc.archivo))) errors.push(`BIBLIOTECA · ${doc.id}\n  Problema: archivo debe ser únicamente el nombre de un PDF.\n  Qué hacer: usa un valor como Documento.pdf, sin carpetas.`);
  if (documentFiles.has(doc.archivo)) errors.push(`BIBLIOTECA · ${doc.id}\n  Problema: el PDF ${doc.archivo} está registrado más de una vez.\n  Qué hacer: conserva un solo registro.`);
  documentFiles.add(doc.archivo);
  if (doc.fuenteId && !sourceIds.has(doc.fuenteId)) errors.push(`BIBLIOTECA · ${doc.id}\n  Problema: la fuente ${doc.fuenteId} no existe.\n  Archivo: contenido/biblioteca/metadatos.json\n  Qué hacer: corrige fuenteId o crea esa fuente.`);
  if (doc.archivo && !fs.existsSync(path.join(root, "public", "documentos", doc.archivo))) errors.push(`BIBLIOTECA · ${doc.id}\n  Problema: no existe el PDF public/documentos/${doc.archivo}.\n  Qué hacer: copia el PDF o ejecuta npm run contenido:sincronizar para retirar el registro eliminado.`);
}
for (const file of fs.readdirSync(path.join(root, "public", "documentos"))) {
  if (/\.pdf$/i.test(file) && !documentFiles.has(file)) errors.push(`BIBLIOTECA · PDF HUÉRFANO\n  Problema: ${file} no está incluido en el índice.\n  Qué hacer: ejecuta npm run contenido:sincronizar.`);
}

notes.push(`${cases.length} casos: ${animals.length} Animales + ${itv.length} ITV + ${seguro.length} Seguro + ${permisos.length} Permisos`);
notes.push(`${sources.length} fuentes jurídicas · ${documents.length} documentos de biblioteca`);
notes.push(`${[...sourceReferenceUsage.values()].filter(Boolean).length} fuentes referenciadas por contenido activo · ${sources.filter((source) => source.urlOficial).length} con URL oficial · ${documents.filter((document) => document.fuenteId).length} con documento local`);
notes.push(`Seguridad Pública: ${seguridadPublica?.conceptos?.length ?? 0} conceptos operativos`);
notes.push(`VMP/VPL: ${vmpGuide?.areas?.length ?? 0} áreas operativas · ${vmpGuide?.casos_practicos?.length ?? 0} casos prácticos · ${vmpGuide?.circulacion?.infracciones?.length ?? 0} reglas de circulación`);

if (errors.length) {
  console.error("\n❌ CONTENIDO NO VÁLIDO\n");
  for (const error of errors) console.error(`- ${error}`);
  console.error(`\n${errors.length} incidencia(s). No publiques hasta corregirlas.\n`);
  process.exit(1);
}
console.log("\n✅ CONTENIDO VÁLIDO");
for (const note of notes) console.log(`- ${note}`);
console.log("- Referencias, IDs, árboles, medidas y biblioteca: correctos\n");
