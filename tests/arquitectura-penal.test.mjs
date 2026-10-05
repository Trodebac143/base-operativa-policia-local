import assert from "node:assert/strict";
import test, { after } from "node:test";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

const { catalogoPenal, gravedadDe, seleccionarSupuestoPenal } = await vite.ssrLoadModule("/data/catalogo-penal.ts");
const { referenciasProcesales } = await vite.ssrLoadModule("/data/referencias-procesales.ts");

const PENAL_GRAVITIES = new Set(["DELITO LEVE", "DELITO MENOS GRAVE", "DELITO GRAVE"]);
const PROCESSUAL_COMMON = new Set(["data/procesal-penal.ts", "data/referencias-procesales.ts"]);
const ARCHITECTURE_EXEMPT = new Set(["data/catalogo-penal.ts", "data/gravedad-penal.ts", ...PROCESSUAL_COMMON]);
const activeRoots = ["app/page.tsx", "app/layout.tsx", "app/seguridad-publica.tsx", "app/alcoholemia.tsx", "app/derivacion-penal.tsx"];
const normalize = (file) => file.replaceAll("\\", "/");

function sourceFiles() {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".git", "dist", ".next"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) found.push(full);
    }
  };
  walk(path.join(root, "app")); walk(path.join(root, "data")); walk(path.join(root, "components")); walk(path.join(root, "scripts"));
  return found;
}

const files = new Map(sourceFiles().map((file) => [normalize(path.relative(root, file)), file]));
function resolveImport(from, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return undefined;
  const base = specifier.startsWith("@/") ? path.join(root, specifier.slice(2)) : path.resolve(path.dirname(from), specifier);
  for (const suffix of ["", ".ts", ".tsx", ".js", ".jsx", ".mjs"]) {
    const candidate = normalize(path.relative(root, base + suffix));
    if (files.has(candidate)) return candidate;
  }
  for (const ext of [".ts", ".tsx", ".js", ".jsx", ".mjs"]) {
    const candidate = normalize(path.relative(root, path.join(base, `index${ext}`)));
    if (files.has(candidate)) return candidate;
  }
  return undefined;
}

function reachableFiles() {
  const seen = new Set(); const queue = [...activeRoots];
  while (queue.length) {
    const rel = queue.shift(); if (seen.has(rel) || !files.has(rel)) continue;
    seen.add(rel);
    const text = fs.readFileSync(files.get(rel), "utf8");
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, rel.endsWith(".tsx") ? ts.ScriptKind.TSX : rel.endsWith(".js") || rel.endsWith(".jsx") || rel.endsWith(".mjs") ? ts.ScriptKind.JS : ts.ScriptKind.TS);
    sf.forEachChild((node) => {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) { const target = resolveImport(files.get(rel), node.moduleSpecifier.text); if (target) queue.push(target); }
      if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) { const target = resolveImport(files.get(rel), node.moduleSpecifier.text); if (target) queue.push(target); }
    });
    for (const specifier of [...text.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)|from\s*["']([^"']+)["']/g)].map((m) => m[1] ?? m[2])) { const target = resolveImport(files.get(rel), specifier); if (target) queue.push(target); }
  }
  return [...seen].filter((rel) => rel.startsWith("data/"));
}

function astFor(text, file = "snippet.ts") {
  return ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}
function literalText(node) { return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : undefined; }
function line(sf, node) { return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1; }
function isTypeNode(node) { return Boolean(node && (ts.isTypeNode(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node))); }
function isRenderContext(node) {
  for (let current = node.parent; current; current = current.parent) {
    if ((ts.isFunctionDeclaration(current) || ts.isMethodDeclaration(current)) && current.name && /^(render|format|describe|label|text|display)/i.test(current.name.getText())) return true;
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name) && /^(render|format|describe|label|text|display)/i.test(current.name.text)) return true;
  }
  return false;
}
function architectureFindings(text, file = "snippet.ts") {
  const sf = astFor(text, file); const findings = [];
  const visit = (node) => {
      if (isTypeNode(node)) return;
      const value = literalText(node);
      if (PENAL_GRAVITIES.has(value) && !isTypeNode(node.parent) && !isRenderContext(node)) {
        const property = ts.isPropertyAssignment(node.parent) ? node.parent.name.getText(sf) : "comparison";
        if (!ts.isBinaryExpression(node.parent) || ![ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(node.parent.operatorToken.kind)) findings.push({ kind: "gravedad-literal", line: line(sf, node), text: value, property });
      }
      if ((value === "DETENIDO" || value === "INVESTIGADO NO DETENIDO" || value === "NO DETENER TODAVÍA — INVESTIGAR") && ts.isPropertyAssignment(node.parent) && /^(situacion|detencion|escenarioProcesal)$/.test(node.parent.name.getText(sf))) findings.push({ kind: "processual-literal", line: line(sf, node), text: value });
      if (/^(SÍ|NO|NO APLICAR MOTOR ADULTO)$/.test(value) && ts.isPropertyAssignment(node.parent) && /^(detencion)$/.test(node.parent.name.getText(sf))) findings.push({ kind: "detention-literal", line: line(sf, node), text: value });
      if ((value === "SÍ" || value === "NO" || value === "NO APLICAR MOTOR ADULTO") && ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name) && /^(detencion|situacion|escenarioProcesal)$/.test(node.parent.name.text)) findings.push({ kind: "detention-variable", line: line(sf, node), text: value });
      if (value && /^(oficio|denuncia|sexual_191)$/.test(value) && ts.isPropertyAssignment(node.parent) && /procedibilidad/.test(node.parent.name.getText(sf))) findings.push({ kind: "procedibility-literal", line: line(sf, node), text: value });
      if (value && /^(lecrim-(?!105(?:-|$)))/i.test(value) && !PROCESSUAL_COMMON.has(normalize(file))) findings.push({ kind: "lecrim-reference", line: line(sf, node), text: value });
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["penaEnMeses", "transformarMarcoPenal"].includes(node.expression.text) && !ARCHITECTURE_EXEMPT.has(normalize(file))) findings.push({ kind: "local-penalty-frame", line: line(sf, node), text: node.expression.text });
      if (ts.isPropertyAssignment(node) && node.name.getText(sf) === "tipo" && literalText(node.initializer) === "pena" && !ARCHITECTURE_EXEMPT.has(normalize(file))) findings.push({ kind: "local-penalty-frame", line: line(sf, node), text: "tipo: pena" });
      if (ts.isIfStatement(node) && /\b(?:input|facts|context|process)\.(?:flagrante|indicios|riesgo|domicilio|fianza|autorMayorEdad|procedibilidad)/.test(node.expression.getText(sf)) && /\b(?:detencion|situacion|escenarioProcesal)\b/.test(node.thenStatement.getText(sf)) && !/resolverSituacionProcesal|processForSelection|resolvePenalProcessualDecision/.test(node.thenStatement.getText(sf))) findings.push({ kind: "processual-branch", line: line(sf, node), text: node.expression.getText(sf) });
      ts.forEachChild(node, visit);
    };
  visit(sf);
  return findings;
}

test("el grafo activo alcanza los resolvers penales y no usa fuentes locales duplicadas", () => {
  const reachable = reachableFiles();
  for (const expected of ["data/seguridad-publica.ts", "data/patrimonio.ts", "data/alcoholemia.ts", "data/derivaciones-penales.ts", "data/catalogo-penal.ts", "data/procesal-penal.ts"]) assert.ok(reachable.includes(expected), `${expected} no está en el grafo activo`);
  const findings = reachable.filter((rel) => !ARCHITECTURE_EXEMPT.has(rel)).flatMap((rel) => architectureFindings(fs.readFileSync(files.get(rel), "utf8"), rel).map((item) => ({ ...item, file: rel })));
  assert.deepEqual(findings, [], findings.map((item) => `${item.file}:${item.line} ${item.kind} ${item.text}`).join("\n"));
});

test("el catálogo conserva 145 supuestos, 136 clasificados y 9 pendientes", () => {
  const entries = Object.entries(catalogoPenal);
  assert.equal(entries.length, 145);
  assert.equal(entries.filter(([id]) => gravedadDe(id)).length, 136);
  assert.equal(entries.filter(([id]) => !gravedadDe(id)).length, 9);
  assert.equal(new Set(entries.map(([, item]) => item.id)).size, entries.length);
  for (const [key, item] of entries) {
    assert.equal(key, item.id); assert.ok(item.fuentesOficiales.length, key);
    assert.ok(item.fuentesOficiales.every((url) => /^https:\/\/www\.boe\.es\/buscar\/act\.php\?id=BOE-A-1995-25444#a/.test(url)), key);
  }
});

test("los IDs penales consumidos por módulos activos existen en el catálogo", () => {
  const ids = new Set(Object.keys(catalogoPenal));
  for (const rel of reachableFiles().filter((item) => item.startsWith("data/"))) {
    const sf = astFor(fs.readFileSync(files.get(rel), "utf8"), rel);
    const visit = (node) => {
      if (ts.isPropertyAssignment(node) && node.name.getText(sf) === "supuestoPenalId") {
        const id = literalText(node.initializer);
        if (id) assert.ok(ids.has(id), `${rel}:${line(sf, node)} referencia catálogo inexistente ${id}`);
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
});

test("las referencias LECrim son únicas, válidas y solo se consumen desde la vía común", () => {
  const ids = Object.keys(referenciasProcesales); assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(ids.sort(), ["lecrim-105-1", "lecrim-105-2", "lecrim-490-2", "lecrim-492-1", "lecrim-492-4", "lecrim-493", "lecrim-495"]);
  for (const [id, ref] of Object.entries(referenciasProcesales)) { assert.match(ref.articulo, /^Art\. \d+(?:\.\d+)? LECrim$/); assert.match(ref.fuenteOficial, /^https:\/\/www\.boe\.es\/buscar\/act\.php\?id=BOE-A-1882-6036#a\d+$/); assert.ok(ref.fragmentoLegal && ref.version, id); }
  const active = reachableFiles().filter((rel) => !PROCESSUAL_COMMON.has(rel));
  const findings = active.flatMap((rel) => architectureFindings(fs.readFileSync(files.get(rel), "utf8"), rel).filter((item) => item.kind === "lecrim-reference"));
  assert.deepEqual(findings, []);
});

test("el detector AST detecta infracciones reales y permite comparación, render y forwarding", () => {
  const bad = `function resolveBad(input) { if (input.flagrante) return { gravedad: "DELITO GRAVE", detencion: "SÍ", penas: { tipo: "pena", pena: { tipo: "prision" } }, procedibilidad: "denuncia" }; }`;
  const findings = architectureFindings(bad);
  assert.deepEqual(findings.map((item) => item.kind).sort(), ["detention-literal", "gravedad-literal", "local-penalty-frame", "procedibility-literal", "processual-branch"]);
  const allowed = `function resolveGood(input) { const result = motor(input); return { gravedad: result.gravedad, detencion: result.detencion, procedibilidad: result.procedibilidad }; } function render(x) { return x === "DELITO GRAVE" ? "DELITO GRAVE" : x; }`;
  assert.deepEqual(architectureFindings(allowed), []);
});

test("los marcos activos están completos y los pendientes no cierran gravedad", () => {
  const validTypes = new Set(["pena", "conjuntas", "alternativas", "mitad_superior", "superior_grado", "pendiente", "accesoria"]);
  const duration = (value) => value && ["dias", "meses", "anios"].includes(value.unidad) && Number.isSafeInteger(value.valor) && value.valor > 0;
  const walk = (regime, where) => {
    assert.ok(regime && validTypes.has(regime.tipo), `${where}: tipo de marco inválido`);
    if (["conjuntas", "alternativas"].includes(regime.tipo)) { assert.ok(Array.isArray(regime.penas) && regime.penas.length > 0, `${where}: familia vacía`); regime.penas.forEach((item, index) => walk(item, `${where}.penas[${index}]`)); }
    if (["mitad_superior", "superior_grado"].includes(regime.tipo)) walk(regime.base, `${where}.base`);
    if (regime.tipo !== "pena") return;
    const pena = regime.pena; assert.ok(pena && typeof pena.tipo === "string", `${where}: pena incompleta`);
    if (["multa_proporcional", "prision_permanente_revisable", "inhabilitacion_absoluta", "privacion_patria_potestad", "persona_juridica"].includes(pena.tipo)) return;
    if (pena.tipo === "responsabilidad_subsidiaria") return walk({ tipo: "pena", pena: pena.multa }, `${where}.multa`);
    assert.ok(duration(pena.minimo) && duration(pena.maximo), `${where}: marco temporal incompleto`);
  };
  for (const [id, item] of Object.entries(catalogoPenal)) {
    assert.ok(item.penas && ["pena", "conjuntas", "alternativas", "mitad_superior", "superior_grado", "pendiente"].includes(item.penas.tipo), id);
    walk(item.penas, id);
    if (item.penas.tipo === "pendiente") assert.equal(seleccionarSupuestoPenal(id).gravedad, undefined, id);
  }
});

test("la clasificación penal manual no entra desde JSON operativo", () => {
  const file = path.join(root, "contenido", "seguridad_publica", "operativa.json");
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  const findings = (payload.conceptos ?? []).filter((item) => PENAL_GRAVITIES.has(item.calificacion));
  assert.deepEqual(findings, [], findings.map((item) => `${item.id}: calificacion=${item.calificacion}`).join("\n"));
});
