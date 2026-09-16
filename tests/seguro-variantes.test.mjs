import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

const vehicles = [
  ["Ciclomotor", "(CICLOMOTORES.)"],
  ["Motocicleta", "(MOTOCICLETAS.)"],
  ["Turismo", "(TURISMOS.)"],
  ["Vehículo de tercera categoría", "(VEHÍCULOS DE TERCERA CATEGORÍA.)"],
];
const expected = {
  "TR-SOA-OP-001": {
    base: "CIRCULAR EL VEHÍCULO RESEÑADO SIN QUE CONSTE QUE SU PROPIETARIO TENGA SUSCRITO Y MANTENGA EN VIGOR UN CONTRATO DE SEGURO QUE CUBRA LA RESPONSABILIDAD CIVIL DERIVADA DE SU CIRCULACIÓN.",
    rows: [["SOA 2.1 5F", 1000, 500], ["SOA 2.1 5G", 1250, 625], ["SOA 2.1 5H", 1500, 750], ["SOA 2.1 5I", 2800, 1400]],
  },
  "TR-SOA-OP-002": {
    base: "INCUMPLIR EL PROPIETARIO DEL VEHÍCULO RESEÑADO LA OBLIGACIÓN DE SUSCRIBIR Y MANTENER EN VIGOR UN CONTRATO DE SEGURO QUE CUBRA LA RESPONSABILIDAD CIVIL DERIVADA DE SU CIRCULACIÓN.",
    rows: [["SOA 2.1 5J", 650, 325], ["SOA 2.1 5K", 700, 350], ["SOA 2.1 5L", 800, 400], ["SOA 2.1 5M", 1500, 750]],
  },
};

test("los dos casos convencionales conservan sus ocho ARCI y textos finales exactos", async () => {
  const { seguroCases, insuranceBulletinText } = await vite.ssrLoadModule("/data/seguro.ts");
  const { CaseSheet } = await vite.ssrLoadModule("/app/page.tsx");
  for (const [id, snapshot] of Object.entries(expected)) {
    const item = seguroCases.find((entry) => entry.id === id);
    const variants = item.datos_adicionales.variantes_arci;
    assert.equal(item.textoDenuncia, snapshot.base);
    assert.equal(variants.length, 4);
    assert.equal(item.datos_adicionales.encaje_condicional, undefined);
    assert.deepEqual(variants.map(({ codificado, importe_fijo, importe_reducido }) => [codificado, importe_fijo, importe_reducido]), snapshot.rows);
    for (const [index, variant] of variants.entries()) {
      assert.deepEqual([variant.tipo_vehiculo, variant.sufijo_boletin], vehicles[index]);
      assert.deepEqual(Object.keys(variant).sort(), ["tipo_vehiculo", "sufijo_boletin", "codificado", "importe_fijo", "importe_reducido"].sort());
      assert.equal(insuranceBulletinText(item, variant), `${snapshot.base} ${vehicles[index][1]}`);
    }
    assert.equal(item.articulo_infringido, "2.1");
    assert.equal(item.tipificacion_articulo, "3");
    const html = renderToStaticMarkup(React.createElement(CaseSheet, { item, copied: false, onCopy() {} }));
    assert.equal(html.split(snapshot.base).length - 1, 1);
    assert.equal(html.split("TEXTO BASE PARA EL BOLETÍN").length - 1, 1);
    assert.equal(html.split("VARIANTES ARCI").length - 1, 1);
    for (const [code] of snapshot.rows) assert.match(html, new RegExp(code.replaceAll(" ", "\\s*")));
    assert.equal(html.split("Copiar texto</button>").length - 1, 4);
    const withoutWarnings = { ...item, advertencias: [] };
    assert.doesNotMatch(renderToStaticMarkup(React.createElement(CaseSheet, { item: withoutWarnings, copied: false, onCopy() {} })), /<summary>Advertencias<\/summary>/);
  }
  assert.equal(seguroCases.length, 6);
  assert.ok(seguroCases.slice(2).every((item) => !item.datos_adicionales?.variantes_arci));
});

test("las preguntas positivas invierten Sí/No sin cambiar la salida operativa", async () => {
  const { invertBooleanAnswer } = await vite.ssrLoadModule("/data/boolean-answer.ts");
  const { resolvePenalProcessualDecision } = await vite.ssrLoadModule("/data/procesal-penal.ts");
  const { resolvePatrimonyOutcome } = await vite.ssrLoadModule("/data/patrimonio.ts");
  assert.equal(invertBooleanAnswer(undefined), undefined);
  const baseProcess = { flagrante: false, indiciosHechoSuficientes: true, indiciosParticipacionSuficientes: true, intentoFugaElusion: false, riesgoOcultacionPruebas: false, riesgoConcretoVictimaTestigos: false };
  const basePatrimony = { hechoPrincipal: "apoderamiento", titularidad: "ajena", gradoEjecucion: "consumado", intencionApropiacionBeneficio: true, violenciaFisica: false, intimidacion: false, fuerza: "ninguna", cuantia: 100, cuantiaAcreditada: true };
  for (const oldNegativeAnswer of [true, false]) {
    const visiblePositiveAnswer = invertBooleanAnswer(oldNegativeAnswer);
    assert.equal(visiblePositiveAnswer, !oldNegativeAnswer);
    assert.deepEqual(resolvePenalProcessualDecision({ ...baseProcess, identidadODomicilioNoVerificables: !visiblePositiveAnswer }), resolvePenalProcessualDecision({ ...baseProcess, identidadODomicilioNoVerificables: oldNegativeAnswer }));
    assert.deepEqual(resolvePatrimonyOutcome({ ...basePatrimony, sinConsentimiento: !visiblePositiveAnswer }), resolvePatrimonyOutcome({ ...basePatrimony, sinConsentimiento: oldNegativeAnswer }));
  }
  const ui = await readFile(new URL("../app/seguridad-publica.tsx", import.meta.url), "utf8");
  assert.match(ui, /¿La identidad o el domicilio han podido verificarse\?/);
  assert.match(ui, /¿Se actúa con consentimiento del titular\?/);
  assert.doesNotMatch(ui, /¿La identidad o el domicilio no han podido verificarse\?|¿Se actúa sin consentimiento del titular\?/);
  assert.match(ui, /value=\{invertBooleanAnswer\(facts\.identidadODomicilioNoVerificables\)\} onChange=\{\(value\) => set\("identidadODomicilioNoVerificables", !value\)\}/);
  assert.match(ui, /value=\{invertBooleanAnswer\(patrimony\.sinConsentimiento\)\} onChange=\{\(value\) => set\("sinConsentimiento", !value\)\}/);
});
