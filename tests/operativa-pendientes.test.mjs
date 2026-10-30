import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false } });
after(() => vite.close());
const { catalogoPenal, consecuenciasComunesPenales, gravedadDe } = await vite.ssrLoadModule("/data/catalogo-penal.ts");
const { resolverSituacionProcesal } = await vite.ssrLoadModule("/data/procesal-penal.ts");
const { resolvePublicSafetyOutcome, resolveAuthorityFromFacts, resolveAuthorityOutcome, resolveDrugOutcome, resolveWeaponOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
const { resolverDerivacionPenal } = await vite.ssrLoadModule("/data/derivaciones-penales.ts");
const { resolvePatrimonyOutcome } = await vite.ssrLoadModule("/data/patrimonio.ts");
const adultoFlagrante = { autorMayorEdad: true, flagrante: true, indiciosHechoSuficientes: true, indiciosParticipacionSuficientes: true };
const sinRelacion = { parejaExpareja: "no", relacionFamiliar: "no", convivencia: "no" };
const lesionVisible = { agresionFisica: true, lesion: true, signosLesion: "perdida_traumatica" };

test("A · hechos suficientes: supuesto exacto, situación y explicación jurídica", () => {
  const result = resolvePublicSafetyOutcome("agresiones_lesiones", { ...sinRelacion, agresionFisica: true, lesion: true, resultadoAsistencial: "tratamiento_posterior" }, adultoFlagrante);
  assert.equal(result.resultados[0].supuestoPenalId, "147.1");
  assert.equal(result.procesal.detencion, "SÍ");
  assert.match(result.procesal.fundamentoDetencion, /490\.2.*492\.1/);
});

test("B/D/F · pérdida corporal visible: 149/150 pendiente, gravedad común y detención fundada", () => {
  const result = resolvePublicSafetyOutcome("agresiones_lesiones", lesionVisible, adultoFlagrante);
  const penal = result.resultados[0];
  assert.equal(penal.supuestoPenalId, "149-150.pendiente");
  assert.equal(penal.marcoPenas.tipo, "pendiente");
  assert.equal(gravedadDe(penal.supuestoPenalId), undefined);
  assert.equal(penal.clasificacion, "DELITO GRAVE");
  assert.equal(penal.procedibilidadPenal, "oficio");
  assert.equal(result.procesal.situacion, "DETENIDO");
  assert.ok(penal.actuacion.length >= 3);
  assert.match(penal.incertidumbre, /valoración médica\/forense y judicial posterior/);
  assert.match(result.procesal.fundamentoDetencion, /todos los subtipos/);
  assert.deepEqual(result.procesal.referenciasProcesales.map((ref) => ref.id), ["lecrim-490-2", "lecrim-492-1"]);
});

test("C · información insuficiente no inventa delito y siempre ofrece actuación", () => {
  const result = resolvePublicSafetyOutcome("agresiones_lesiones", {}, adultoFlagrante);
  assert.ok(result.resultados.every((item) => !item.supuestoPenalId && !item.clasificacion));
  assert.ok(result.resultados.every((item) => item.actuacion.length > 0));
  assert.match(result.resultados[0].texto, /golpe|agresión/);
});

test("E · alternativas con regímenes distintos no permiten escoger la detención más intensa", () => {
  const result = resolverSituacionProcesal({ ...adultoFlagrante, denunciaOQuerella: true, domicilioConocido: true, alternativasPenales: ["147.1", "147.2"] });
  assert.equal(result.situacion, "DILIGENCIAS DE PREVENCIÓN");
  assert.equal(result.detencion, "NO");
  assert.match(result.fundamentoDetencion, /consecuencias procesales distintas/);
  const comunes = consecuenciasComunesPenales(["147.1", "147.2"]);
  assert.equal(comunes.gravedad, undefined);
  assert.equal(comunes.procedibilidad, undefined);
});

test("E · riesgo vital o función aparentemente perdida no equivalen a secuelas confirmadas", () => {
  for (const signosLesion of ["riesgo_vital", "perdida_funcion", "deformidad_evidente"]) {
    const result = resolvePublicSafetyOutcome("agresiones_lesiones", { ...lesionVisible, signosLesion }, adultoFlagrante);
    assert.equal(result.resultados[0].clasificacion, undefined);
    assert.equal(result.procesal.detencion, "NO");
    assert.match(result.resultados[0].incertidumbre, /no acreditan por sí solos/);
    const conocido = resolvePublicSafetyOutcome("agresiones_lesiones", { ...lesionVisible, signosLesion, resultadoAsistencial: "tratamiento_posterior" }, adultoFlagrante);
    assert.equal(conocido.resultados[0].clasificacion, undefined);
    assert.equal(conocido.procesal.detencion, "SÍ");
  }
});

test("F · no flagrante con 149/150 pendiente aplica la misma base independiente", () => {
  const input = { ...adultoFlagrante, flagrante: false, intentoFugaElusion: false, identidadODomicilioNoVerificables: false, riesgoConcretoIncomparecencia: false, riesgoOcultacionPruebas: false, riesgoConcretoVictimaTestigos: false };
  const libre = resolvePublicSafetyOutcome("agresiones_lesiones", lesionVisible, input);
  const riesgo = resolvePublicSafetyOutcome("agresiones_lesiones", lesionVisible, { ...input, riesgoConcretoVictimaTestigos: true });
  assert.equal(libre.procesal.situacion, "INVESTIGADO NO DETENIDO");
  assert.equal(riesgo.procesal.detencion, "SÍ");
  assert.match(riesgo.procesal.fundamentoDetencion, /492\.4/);
  assert.equal(riesgo.resultados[0].supuestoPenalId, "149-150.pendiente");
});

test("ninguna alternativa permite omitir edad, atribución o denuncia confirmadas", () => {
  for (const [patch, expected] of [[{ autorMayorEdad: undefined }, "EDAD PENDIENTE"], [{ indiciosHechoSuficientes: false }, "INDICIOS INSUFICIENTES"], [{ indiciosParticipacionSuficientes: false }, "INDICIOS INSUFICIENTES"], [{ atribucionPendiente: true }, "INDICIOS INSUFICIENTES"]]) {
    const result = resolverSituacionProcesal({ ...adultoFlagrante, alternativasPenales: ["149.1", "150"], ...patch });
    assert.equal(result.detencion, "NO");
    assert.equal(result.escenarioProcesal, expected);
  }
  assert.equal(resolverSituacionProcesal({ ...adultoFlagrante, alternativasPenales: ["178.1", "178.3"] }).escenarioProcesal, "PROCEDIBILIDAD PENDIENTE");
  assert.equal(consecuenciasComunesPenales(["149.1", "149-150.pendiente"]).gravedad, undefined);
});

test("550/551 y 169 conservan marco pendiente con consecuencias comunes derivadas", () => {
  const ataque = resolveAuthorityFromFacts("atentado", { ...adultoFlagrante, conductaObservada: "ataque", enFunciones: true, victimaAtentado: "autoridad" });
  assert.equal(ataque.supuestoPenalId, "550-551.pendiente");
  assert.equal(ataque.clasificacion, undefined);
  assert.equal(ataque.detencion, "SÍ");
  const amenaza = resolveAuthorityOutcome("amenazas", "art169", adultoFlagrante);
  assert.equal(amenaza.supuestoPenalId, "169.pendiente");
  assert.equal(amenaza.clasificacion, "DELITO MENOS GRAVE");
  assert.equal(amenaza.detencion, "SÍ");
});

test("368 distingue sustancia desconocida de ausencia de atribución de tráfico", () => {
  const venta = resolveDrugOutcome({ ...adultoFlagrante, ventaObservada: true, indiciosSuficientes: true, sustancia: "desconocida" });
  const duda = resolveDrugOutcome({ ...adultoFlagrante, ventaObservada: false, indiciosSuficientes: false, sustancia: "desconocida" });
  assert.equal(venta.supuestoPenalId, "368.pendiente");
  assert.equal(venta.clasificacion, undefined);
  assert.equal(venta.detencion, "SÍ");
  assert.equal(duda.detencion, "NO");
  assert.ok(duda.actuacion.length);
});

test("248/264, 563 y 183 bis no inventan alternativas y conservan protección e investigación", () => {
  for (const facts of [{ hechoPrincipal: "recepcion", titularidad: "ajena", posesionPrevia: "autor_entrega_legitima", gradoEjecucion: "consumado", enganoPrevioActoDisposicion: true }, { hechoPrincipal: "danos", titularidad: "ajena", intencionalidadDano: "deliberado", danoInformatico: true }]) {
    const result = resolvePatrimonyOutcome(facts, adultoFlagrante, sinRelacion);
    assert.match(result.supuestoPenalId, /^(248|264)\.pendiente$/);
    assert.equal(result.gravedad, undefined);
    assert.equal(result.procesal.detencion, "NO");
    assert.ok(result.actuacion.length);
  }
  const arma = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "automatico" }, { comportamiento: "manipula", contexto: "otras", ...adultoFlagrante });
  assert.equal(arma.supuestoPenalId, "563.pendiente");
  assert.equal(arma.detencion, "NO");
  assert.ok(arma.actuacion.length);
  const sexual = resolvePublicSafetyOutcome("agresiones_sexuales", { actoSexualNoConsentido: true, menorDieciseis: true, conductaSexual: "acto_fisico", penetracion: false, violenciaIntimidacion: false, voluntadAnulada: false, posibleExcepcion183Bis: true }, adultoFlagrante);
  assert.ok(sexual.resultados.some((item) => item.supuestoPenalId === "183bis.pendiente" && item.actuacion.length));
  assert.equal(sexual.procesal.detencion, "NO");
});

test("340 bis mantiene subtipo pendiente pero la muerte comprobada permite consecuencia común", () => {
  const result = resolverDerivacionPenal("CP-340-BIS", adultoFlagrante, { resultado: "muerte", vertebrado: true });
  assert.equal(result.supuesto.id, "340bis.pendiente");
  assert.equal(result.supuesto.gravedad, undefined);
  assert.equal(result.procesal.detencion, "SÍ");
  assert.ok(result.actuacion.length);
  const incierto = resolverDerivacionPenal("CP-340-BIS", adultoFlagrante, { resultado: "lesion_pendiente" });
  assert.equal(incierto.procesal.detencion, "NO");
  assert.ok(incierto.actuacion.some((item) => /veterinaria/.test(item)));
});

test("siguen existiendo las mismas nueve entradas pendientes sin marco ni gravedad propios", () => {
  const expected = ["550-551.pendiente", "248.pendiente", "264.pendiente", "563.pendiente", "368.pendiente", "149-150.pendiente", "169.pendiente", "183bis.pendiente", "340bis.pendiente"];
  assert.deepEqual(Object.values(catalogoPenal).filter((item) => item.penas.tipo === "pendiente").map((item) => item.id).sort(), expected.sort());
  for (const id of expected) assert.equal(gravedadDe(id), undefined);
});
