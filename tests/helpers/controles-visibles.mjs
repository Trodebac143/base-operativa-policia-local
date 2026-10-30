import ts from "typescript";

const HARD_FIELDS = new Map([
  ["valoracionForense", "campo de valoración forense"],
  ["informeForense", "campo de informe forense"],
  ["resultadoMedico", "campo de resultado diagnóstico médico"],
  ["organoMiembroDocumentado", "campo de hallazgo orgánico documentado"],
  ["deformidadGraveDocumentada", "campo de gravedad médico-forense"],
  ["estadoCondenasPrevias", "campo de antecedentes/condenas judiciales"],
  ["numeroCondenasEjecutorias", "campo de cómputo de condenas ejecutorias"],
  ["condenasMismaNaturaleza", "campo de cómputo jurídico de condenas"],
  ["algunaCondenaLeve", "campo de cómputo jurídico de condenas"],
  ["todasCondenasMenosGravesOGraves", "campo de cómputo jurídico de condenas"],
  ["condenasCanceladasOCancelables", "campo de cancelabilidad judicial"],
  ["requisitosCondenasCompletos", "campo de conclusión jurídica sobre condenas"],
]);

const CONTROL_COMPONENTS = new Set(["ChoiceQuestion", "ToggleQuestion", "TriStateQuestion"]);
const INPUT_ELEMENTS = new Set(["input", "select", "textarea"]);
const RELEVANT_ELEMENTS = new Set(["fieldset", "label", "legend", "option", ...INPUT_ELEMENTS]);

const RULES = [
  ["C_FORENSE_DIAGNOSTICO", /\b(?:forense|m[eé]dico[- ]forense|diagn[oó]stic[oa](?: definitivo)?|resultado diagn[oó]stico|informe (?:m[eé]dico|forense)|seg[uú]n informe|secuela(?:s)?|pericial(?:es)?)\b/i],
  ["D_ARTICULO", /\b(?:art(?:[íi]culo)?s?\.?\s*\d{1,3}(?:\s*\.\s*\d+)?(?:\s*(?:bis|ter|qu[aá]ter))?(?:\s*(?:cp|c[oó]digo penal))?|(?:aplicar|procede|concurre|identifica|encaja|corresponde).{0,45}\bart(?:[íi]culo)?\b|(?:qu[eé]|cu[aá]l)\s+art(?:[íi]culo)?\b.{0,45}\b(?:aplica|aplicar|corresponde|procede))\b/i],
  ["D_TIPO_GRAVEDAD", /\b(?:tipo penal|tipo agravado|subtipo(?: penal)?|calificaci[oó]n (?:penal|jur[ií]dica)|delito (?:grave|leve|menos grave)|gravedad (?:especial|delictiva|jur[ií]dica)|especial gravedad|agravant(?:e|es)|mal constitutivo de delito|menor entidad|amenaza leve|coacci[oó]n leve|habitualidad|imprudencia grave|ens[aá]ñamiento|alevos[ií]a|voluntad anulada|prevalimiento)\b/i],
  ["C_JUDICIAL", /\b(?:sentencia(?:s)?|condena(?:s)? (?:ejecutoria(?:s)?|computable(?:s)?|cancelada(?:s)?|cancelable(?:s)?|cancelables)|antecedentes (?:computables|cancelables)|cancelabilidad)\b/i],
];

function literalValue(node) {
  if (!node) return undefined;
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) return literalValue(node.expression);
  return undefined;
}

function elementName(node) {
  const tag = ts.isJsxElement(node) ? node.openingElement.tagName : node.tagName;
  if (!tag) return undefined;
  return ts.isIdentifier(tag) ? tag.text : undefined;
}

function property(node, name) {
  return node.attributes?.properties?.find((attribute) => ts.isJsxAttribute(attribute) && attribute.name.getText() === name);
}

function propExpression(node, name) {
  const attr = property(node, name);
  return attr && ts.isJsxAttribute(attr) && attr.initializer && ts.isJsxExpression(attr.initializer) ? attr.initializer.expression : undefined;
}

function collectStrings(node, out = []) {
  if (!node) return out;
  if (ts.isJsxText(node)) {
    const text = node.text.replace(/\s+/g, " ").trim();
    if (text) out.push(text);
  } else if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    out.push(node.text);
  }
  ts.forEachChild(node, (child) => { collectStrings(child, out); });
  return out;
}

function collectVisibleText(node, sourceFile, out = []) {
  if (!node) return out;
  if (ts.isJsxText(node)) {
    const text = node.text.replace(/\s+/g, " ").trim();
    if (text) out.push(text);
    return out;
  }
  if (ts.isJsxElement(node)) {
    for (const child of node.children) collectVisibleText(child, sourceFile, out);
    return out;
  }
  if (ts.isJsxSelfClosingElement(node)) return out;
  if (ts.isJsxExpression(node)) {
    const expression = node.expression;
    const literal = literalValue(expression);
    if (literal) out.push(literal);
    else if (expression && ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === "map") {
      resolveOptionExpression(sourceFile, expression.expression.expression, out);
    }
    return out;
  }
  ts.forEachChild(node, (child) => { collectVisibleText(child, sourceFile, out); });
  return out;
}

function identifiers(node, out = new Set()) {
  if (!node) return out;
  if (ts.isIdentifier(node)) out.add(node.text);
  ts.forEachChild(node, (child) => { identifiers(child, out); });
  return out;
}

function findConstInitializer(sourceFile, name) {
  let found;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) found = node.initializer;
    if (!found) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return found;
}

function resolveOptionExpression(sourceFile, expression, strings, fields) {
  if (!expression) return;
  if (ts.isIdentifier(expression)) {
    const initializer = findConstInitializer(sourceFile, expression.text);
    if (initializer) resolveOptionExpression(sourceFile, initializer, strings, fields);
    return;
  }
  if (ts.isArrayLiteralExpression(expression)) {
    for (const item of expression.elements) {
      if (ts.isArrayLiteralExpression(item)) {
        const label = literalValue(item.elements[1]);
        if (label !== undefined) strings.push(label);
        else resolveOptionExpression(sourceFile, item.elements[1], strings, fields);
      } else resolveOptionExpression(sourceFile, item, strings, fields);
    }
    return;
  }
  if (ts.isCallExpression(expression) && expression.expression.kind === ts.SyntaxKind.PropertyAccessExpression) {
    // Inline arrays commonly use options.map(([value, label]) => ...).
    resolveOptionExpression(sourceFile, expression.expression.expression, strings, fields);
    return;
  }
  if (fields) identifiers(expression, fields);
  strings.push(...collectStrings(expression));
}

function getControlComponents(sourceFile, finding) {
  const visit = (node) => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const name = elementName(node);
      if (CONTROL_COMPONENTS.has(name)) {
        const legend = literalValue(propExpression(node, "legend")) ?? literalValue(property(node, "legend")?.initializer);
        if (legend) finding.texts.push(legend);
        const options = propExpression(node, "options");
        resolveOptionExpression(sourceFile, options, finding.texts, finding.fields);
        const value = propExpression(node, "value");
        identifiers(value, finding.fields);
      }
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "yesNo") {
      const legend = literalValue(node.arguments[0]);
      if (legend) finding.texts.push(legend);
      identifiers(node.arguments[1], finding.fields);
    }
    ts.forEachChild(node, visit);
  };
  visit(finding.node);
}

function makeFinding(node, kind, sourceFile) {
  const finding = { kind, line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1, texts: [], fields: new Set(), node };
  if (kind === "fieldset") {
    const readControlText = (child) => {
      if ((ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) && ["legend", "label", "option"].includes(elementName(child))) {
        finding.texts.push(...collectVisibleText(child, sourceFile));
        return;
      }
      if (ts.isJsxExpression(child) && child.expression && ts.isCallExpression(child.expression) && ts.isPropertyAccessExpression(child.expression.expression) && child.expression.expression.name.text === "map") {
        resolveOptionExpression(sourceFile, child.expression.expression.expression, finding.texts);
      }
      ts.forEachChild(child, readControlText);
    };
    readControlText(node);
  } else if (["label", "legend", "option"].includes(kind)) {
    finding.texts.push(...collectVisibleText(node, sourceFile));
  }
  identifiers(node, finding.fields);
  getControlComponents(sourceFile, finding);
  const attributesNode = ts.isJsxElement(node) ? node.openingElement : node;
  const aria = property(attributesNode, "aria-label");
  const ariaText = aria && ts.isJsxAttribute(aria) ? literalValue(aria.initializer) : undefined;
  if (ariaText) finding.texts.push(ariaText);
  return finding;
}

function findingsForFile(sourceFile) {
  const findings = [];
  const visit = (node) => {
    if ((ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) && RELEVANT_ELEMENTS.has(elementName(node))) {
      const name = elementName(node);
      if (name === "fieldset" || name === "label" || name === "legend" || name === "option" || INPUT_ELEMENTS.has(name)) {
        findings.push(makeFinding(node, name, sourceFile));
      }
    }
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      if (CONTROL_COMPONENTS.has(elementName(node))) findings.push(makeFinding(node, elementName(node), sourceFile));
    }
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "yesNo") findings.push(makeFinding(node, "yesNo", sourceFile));
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}

export function auditVisibleControls(source, fileName = "control.tsx") {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings = [];
  for (const control of findingsForFile(sourceFile)) {
    // E10 permite transcribir resoluciones verificadas en este bloque explícito.
    // No exime campos forenses ni controles judiciales fuera de él.
    let parent = control.node;
    let documentary = false;
    while (parent) {
      if (ts.isJsxElement(parent) && elementName(parent) === "fieldset" && property(parent.openingElement, "data-documentary-convictions")) documentary = true;
      parent = parent.parent;
    }
    const allText = [...new Set(control.texts)].join(" ").replace(/\s+/g, " ").trim();
    const hits = [];
    const explanatoryHeader = ["fieldset", "legend"].includes(control.kind) && !/[¿?]/.test(allText) && /\b(?:hechos para|queda pendiente|se determinar[aá]|valoraci[oó]n posterior|corresponder[aá])\b/i.test(allText);
    for (const [rule, pattern] of RULES) {
      if (documentary && rule === "C_JUDICIAL") continue;
      if (explanatoryHeader && rule !== "HARD_FIELD") continue;
      if (pattern.test(allText)) hits.push({ rule, matched: allText.match(pattern)?.[0] });
    }
    for (const field of control.fields) {
      if (documentary && ["estadoCondenasPrevias", "numeroCondenasEjecutorias", "condenasMismaNaturaleza", "algunaCondenaLeve", "todasCondenasMenosGravesOGraves", "condenasCanceladasOCancelables", "requisitosCondenasCompletos"].includes(field)) continue;
      const hard = HARD_FIELDS.get(field);
      if (hard) hits.push({ rule: "HARD_FIELD", field, matched: hard });
    }
    if (hits.length) findings.push({ kind: control.kind, line: control.line, text: allText, fields: [...control.fields].filter((field) => HARD_FIELDS.has(field)), hits });
  }
  return findings;
}

export function prohibitedControlFindings(files) {
  return Object.entries(files).flatMap(([file, source]) => auditVisibleControls(source, file).map((finding) => ({ file, ...finding })));
}
