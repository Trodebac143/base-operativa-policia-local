import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());
const { clasificarPenaAbstracta: classify, clasificarDelitoPorPenas: crime, penaEnMeses } = await vite.ssrLoadModule("/data/gravedad-penal.ts");
const { resolveDrugOutcome, resolvePublicSafetyOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
const { resolvePatrimonyOutcome } = await vite.ssrLoadModule("/data/patrimonio.ts");
const duration = (valor, unidad = "meses", diasAdicionales = 0) => ({ valor, unidad, diasAdicionales });
const penalty = (tipo, minimo, maximo = minimo, unidad = "meses") => ({ tipo, minimo: duration(minimo, unidad), maximo: duration(maximo, unidad) });
const L = "DELITO LEVE", M = "DELITO MENOS GRAVE", G = "DELITO GRAVE";

for (const [name, pena, expected] of [
  ["prisión exactamente 5 años", penalty("prision", 5, 5, "anios"), M],
  ["prisión 5 años y 1 día", { tipo: "prision", minimo: duration(5, "anios", 1), maximo: duration(5, "anios", 1) }, G],
  ["art. 13.4: prisión 2–6 años cruza menos grave/grave", penalty("prision", 2, 6, "anios"), G],
  ["prisión 3 meses", penalty("prision", 3), M],
  ["multa exactamente 3 meses", penalty("multa", 3), L],
  ["multa 3 meses y 1 día", { tipo: "multa", minimo: duration(3, "meses", 1), maximo: duration(3, "meses", 1) }, M],
  ["art. 13.4: multa 1–6 meses cruza leve/menos grave", penalty("multa", 1, 6), L],
  ["multa 3–6 meses incluye extremo leve", penalty("multa", 3, 6), L],
  ["multa 90 días equivale a 3 meses, art. 50.4", penalty("multa", 90, 90, "dias"), L],
  ["multa 91 días", penalty("multa", 91, 91, "dias"), M],
  ["TBC 30 días", penalty("tbc", 30, 30, "dias"), L],
  ["TBC 31 días", penalty("tbc", 31, 31, "dias"), M],
  ["TBC 1–90 días, art. 13.4", penalty("tbc", 1, 90, "dias"), L],
  ["TBC 1 año", penalty("tbc", 1, 1, "anios"), M],
  ["TBC 31 días–1 año", { tipo: "tbc", minimo: duration(31, "dias"), maximo: duration(1, "anios") }, M],
  ["TBC fuera del máximo legal", penalty("tbc", 400, 400, "dias"), undefined],
  ["localización 1 día", penalty("localizacion", 1, 1, "dias"), L],
  ["localización 3 meses", penalty("localizacion", 3), L],
  ["localización más de 3 meses no figura en art. 33", penalty("localizacion", 4), undefined],
  ["prisión inferior a 3 meses no se convierte en pena leve", penalty("prision", 2), undefined],
]) test(name, () => assert.equal(classify(pena), expected));

for (const tipo of ["conduccion", "armas", "animales"]) {
  test(`${tipo}: 3 meses, 1 año, 1 año y 1 día`, () => {
    assert.equal(classify(penalty(tipo, 3)), L);
    assert.equal(classify(penalty(tipo, 1, 1, "anios")), L);
    assert.equal(classify({ tipo, minimo: duration(1, "anios", 1), maximo: duration(1, "anios", 1) }), M);
    assert.equal(classify(penalty(tipo, 3, 24)), L);
    assert.equal(classify(penalty(tipo, 2)), undefined);
  });
  test(`${tipo}: límite superior menos grave y siguiente día`, () => {
    const years = tipo === "animales" ? 5 : 8;
    assert.equal(classify(penalty(tipo, years, years, "anios")), M);
    assert.equal(classify({ tipo, minimo: duration(years, "anios"), maximo: duration(years, "anios", 1) }), G);
  });
}
for (const tipo of ["residencia", "aproximacion", "comunicacion"]) test(`${tipo}: 6 meses inclusive, 5 años inclusive y siguiente día`, () => {
  assert.equal(classify(penalty(tipo, 5)), L);
  assert.equal(classify(penalty(tipo, 6)), M);
  assert.equal(classify(penalty(tipo, 5, 5, "anios")), M);
  assert.equal(classify({ tipo, minimo: duration(5, "anios"), maximo: duration(5, "anios", 1) }), G);
  assert.equal(classify(penalty(tipo, 1, 6)), L);
});
for (const tipo of ["inhabilitacion_especial", "suspension"]) test(`${tipo}: 5 años y siguiente día`, () => {
  assert.equal(classify(penalty(tipo, 1)), M);
  assert.equal(classify(penalty(tipo, 5, 5, "anios")), M);
  assert.equal(classify({ tipo, minimo: duration(5, "anios"), maximo: duration(5, "anios", 1) }), G);
});
test("penas graves por naturaleza, multa proporcional y responsabilidad subsidiaria", () => {
  for (const tipo of ["prision_permanente_revisable", "inhabilitacion_absoluta", "privacion_patria_potestad", "persona_juridica"]) assert.equal(classify({ tipo }), G);
  assert.equal(classify({ tipo: "multa_proporcional" }), M);
  assert.equal(classify({ tipo: "responsabilidad_subsidiaria", multa: penalty("multa", 1, 6) }), L);
  assert.equal(classify({ tipo: "responsabilidad_subsidiaria", multa: penalty("multa", 6, 12) }), M);
  assert.equal(classify({ tipo: "responsabilidad_subsidiaria", multa: { tipo: "prision_permanente_revisable" } }), undefined);
});
test("no redondea ni convierte duraciones ambiguas en una conclusión penal", () => {
  for (const value of [NaN, Infinity, -1, 0, 3.01, Number.MAX_SAFE_INTEGER]) assert.equal(classify(penalty("multa", value)), undefined);
  assert.equal(classify({ tipo: "prision" }), undefined);
  assert.equal(classify(penalty("prision", 60, 3)), undefined);
  assert.equal(classify(penalty("conduccion", 366, 366, "dias")), undefined);
  assert.equal(classify(penalty("aproximacion", 180, 180, "dias")), undefined);
  assert.equal(classify(penalty("tbc", 365, 365, "dias")), M);
  assert.equal(classify(penalty("tbc", 366, 366, "dias")), undefined);
  assert.equal(classify({ tipo: "medida_cautelar" }), undefined);
});
test("penas conjuntas: art. 405, multa 3–8 meses Y suspensión 1–3 años = menos grave", () => {
  assert.equal(crime({ tipo: "conjuntas", penas: [penaEnMeses("multa", 3, 8), penaEnMeses("suspension", 12, 36)] }), M);
});
test("penas alternativas: art. 244.1, multa 2–12 meses O TBC 31–90 días = menos grave", () => {
  assert.equal(crime({ tipo: "alternativas", penas: [penaEnMeses("multa", 2, 12), { tipo: "pena", pena: penalty("tbc", 31, 90, "dias") }] }), M);
});
test("art. 340 ter: alternativas + inhabilitación animal conjunta; no analizar solo multa", () => {
  const regimen = { tipo: "conjuntas", penas: [
    { tipo: "alternativas", penas: [penaEnMeses("multa", 1, 6), { tipo: "pena", pena: penalty("tbc", 31, 90, "dias") }] },
    penaEnMeses("animales", 12, 36),
  ] };
  assert.equal(crime(regimen), M);
});
test("penas incompletas y accesorias sin tratamiento jurídico expreso quedan pendientes", () => {
  assert.equal(crime({ tipo: "conjuntas", penas: [] }), undefined);
  assert.equal(crime({ tipo: "alternativas", penas: [penaEnMeses("multa", 1, 3), { tipo: "pendiente" }] }), undefined);
  assert.equal(crime({ tipo: "conjuntas", penas: [penaEnMeses("prision", 12, 72), { tipo: "accesoria" }] }), undefined);
});
test("regresión activa: art. 368, prisión y multa proporcional", () => {
  assert.equal(resolveDrugOutcome({ ventaObservada: true, indiciosSuficientes: true, sustancia: "grave_dano" }).clasificacion, G);
  assert.equal(resolveDrugOutcome({ ventaObservada: true, indiciosSuficientes: true, sustancia: "resto" }).clasificacion, M);
});
test("regresión activa: art. 254, subtipos y art. 267 mantienen gravedad y régimen procesal", () => {
  const facts = { hechoPrincipal: "recepcion", titularidad: "ajena", posesionPrevia: "tercero", viaApropiacionFuera253: true, gradoEjecucion: "consumado", cuantiaAcreditada: true };
  for (const cuantia of [400, 401]) assert.equal(resolvePatrimonyOutcome({ ...facts, cuantia }).gravedad, L);
  assert.equal(resolvePatrimonyOutcome({ ...facts, cuantia: 100, valorArtisticoHistoricoCulturalCientifico: true }).gravedad, M);
  const imprudent = { hechoPrincipal: "danos", titularidad: "ajena", intencionalidadDano: "imprudente_accidental", imprudenciaGrave: true, cuantiaAcreditada: true };
  assert.equal(resolvePatrimonyOutcome({ ...imprudent, cuantia: 80000 }).gravedad, undefined);
  const o = resolvePatrimonyOutcome({ ...imprudent, cuantia: 80001 });
  assert.equal(o.gravedad, L);
  assert.equal(o.procesal.escenarioProcesal, "DELITO LEVE");
});
test("regresión activa: marco abstracto de modalidades sexuales adultas y menores", () => {
  const base = { actoSexualNoConsentido: true, conductaSexual: "acto_fisico", violenciaIntimidacion: false, voluntadAnulada: false, penetracion: false, parejaExpareja: "no", relacionFamiliar: "no", convivencia: "no" };
  for (const [facts, article, expected] of [
    [{ menorDieciseis: false }, "178.1", M],
    [{ menorDieciseis: false, violenciaIntimidacion: true }, "178.3", M],
    [{ menorDieciseis: false, penetracion: true }, "179.1", G],
    [{ menorDieciseis: false, penetracion: true, violenciaIntimidacion: true }, "179.2", G],
    [{ menorDieciseis: true }, "181.1", G],
    [{ menorDieciseis: true, violenciaIntimidacion: true }, "181.2", G],
  ]) assert.equal(resolvePublicSafetyOutcome("agresiones_sexuales", { ...base, ...facts }).resultados.find((r) => r.norma.endsWith(article))?.clasificacion, expected);
});
