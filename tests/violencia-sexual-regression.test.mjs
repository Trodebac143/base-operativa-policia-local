import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());
const { deriveRelationalContext, resolvePublicSafetyOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
const resolve = (facts, process = { flagrante: true }) => resolvePublicSafetyOutcome("agresiones_sexuales", { actoSexualNoConsentido: true, autorMayorEdad: true, procedibilidadSexual: "denuncia_victima", violenciaIntimidacion: false, voluntadAnulada: false, penetracion: false, conductaSexual: "acto_fisico", ...facts }, process);
const norms = (outcome) => outcome.resultados.map((item) => item.norma).join(" | ");
const titles = (outcome) => outcome.resultados.map((item) => item.titulo).join(" | ");
const crime = (outcome, article) => outcome.resultados.find((item) => item.norma.includes(article));

test("1 · adulto, penetración sin violencia: 179.1 grave", () => assert.equal(crime(resolve({ menorDieciseis: false, penetracion: true }), "179.1").clasificacion, "DELITO GRAVE"));
test("2 · adulto, penetración y violencia: 179.2 grave", () => assert.equal(crime(resolve({ menorDieciseis: false, penetracion: true, violenciaIntimidacion: true }), "179.2").clasificacion, "DELITO GRAVE"));
test("3 · violación no flagrante con indicios y necesidad: detener", () => {
  const outcome = resolve({ menorDieciseis: false, penetracion: true }, { flagrante: false, indiciosHechoSuficientes: true, indiciosParticipacionSuficientes: true, intentoFugaElusion: true });
  assert.deepEqual([outcome.procesal.situacion, outcome.procesal.detencion], ["DETENIDO", "SÍ"]);
  assert.match(outcome.procesal.fundamentoDetencion, /ausencia de flagrancia no impide/i);
});
test("4 · autoría insuficiente: no detener todavía e investigar", () => assert.equal(resolve({ menorDieciseis: false }, { flagrante: false, indiciosHechoSuficientes: true, indiciosParticipacionSuficientes: false }).procesal.situacion, "NO DETENER TODAVÍA — INVESTIGAR"));
test("5 · hombre y esposa mujer: VioGén y 180.1.4", () => {
  const outcome = resolve({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "esposa", menorDieciseis: false, penetracion: true });
  assert.equal(outcome.contextoRelacional.isViogenLO12004, true); assert.match(norms(outcome), /180\.1\.4/);
});
test("6 · expareja sin convivencia sigue siendo VioGén", () => assert.equal(deriveRelationalContext({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "expareja", convivencia: false }).isViogenLO12004, true));
test("7 · amiga mujer: violencia sexual, no VioGén", () => {
  const outcome = resolve({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "amigo", menorDieciseis: false, penetracion: true }); assert.equal(outcome.contextoRelacional.isViogenLO12004, false); assert.match(titles(outcome), /VIOLENCIA SEXUAL/);
});
test("8 · desconocido y víctima mujer: competencia separada, no VioGén", () => {
  const outcome = resolve({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "desconocido", menorDieciseis: false, penetracion: true }); assert.equal(outcome.contextoRelacional.isViogenLO12004, false); assert.match(titles(outcome), /COMPETENCIA JUDICIAL DIFERENCIADA/);
});
test("9 · 178.1 es menos grave y no usa el art. 495", () => { const outcome = resolve({ menorDieciseis: false, penetracion: false }); assert.equal(crime(outcome, "178.1").clasificacion, "DELITO MENOS GRAVE"); assert.doesNotMatch(JSON.stringify(outcome), /495/); });
test("10 · 178.3 es menos grave y no fuerza investigado no detenido", () => { const outcome = resolve({ menorDieciseis: false, penetracion: false, voluntadAnulada: true }, { flagrante: false, indiciosHechoSuficientes: true, indiciosParticipacionSuficientes: true, intentoFugaElusion: true }); assert.equal(crime(outcome, "178.3").clasificacion, "DELITO MENOS GRAVE"); assert.equal(outcome.procesal.situacion, "DETENIDO"); });
test("11 · 178 con agravación del 180 pasa a grave", () => { const outcome = resolve({ menorDieciseis: false, penetracion: false, variasPersonas: true }); assert.equal(crime(outcome, "180.1").clasificacion, "DELITO GRAVE"); });
test("12 · menor de 16 con acto sexual: 181.1 grave", () => assert.equal(crime(resolve({ menorDieciseis: true, penetracion: false }), "181.1").clasificacion, "DELITO GRAVE"));
test("13 · menor de 16 con penetración: 181.4 grave", () => assert.equal(crime(resolve({ menorDieciseis: true, penetracion: true }), "181.4").clasificacion, "DELITO GRAVE"));
test("14 · menor de 16 y pareja: comprueba 181.5", () => assert.match(norms(resolve({ menorDieciseis: true, tipoRelacion: "pareja", penetracion: true })), /181\.5/));
test("15 · art. 183 bis no usa diferencia numérica automática", () => { const outcome = resolve({ menorDieciseis: true, posibleExcepcion183Bis: true }); assert.match(titles(outcome), /VALORACIÓN JURÍDICA ESPECÍFICA/); assert.doesNotMatch(JSON.stringify(outcome), /diferencia.*\d+ años/i); });
test("16 · víctima adulta que no denuncia: procedibilidad pendiente sin negar delito", () => { const outcome = resolve({ menorDieciseis: false, noDeseaDenunciar: true, procedibilidadSexual: "pendiente" }); assert.equal(outcome.procedibilidad.estado, "PENDIENTE / COORDINAR"); assert.equal(outcome.procesal, undefined); assert.doesNotMatch(titles(outcome), /NO HAY DELITO/); });
test("17 · denuncia oral formalizable cubre procedibilidad", () => { const outcome = resolve({ menorDieciseis: false, procedibilidadSexual: "denuncia_victima" }); assert.equal(outcome.procedibilidad.estado, "CUMPLIDA"); assert.match(outcome.procedibilidad.fundamento, /oral/); });
test("18 · presunto autor menor no usa motor adulto", () => { const outcome = resolve({ menorDieciseis: false, autorMayorEdad: false }); assert.equal(outcome.procesal.situacion, "RUTA DE RESPONSABILIDAD PENAL DE MENORES"); });
test("19 · agresión sexual y lesión autónoma conectan con lesiones", () => assert.ok(resolve({ menorDieciseis: false, lesion: true }).conexiones.some((item) => item.conceptId === "agresiones_lesiones")));
test("20 · amenaza autónoma conecta sin duplicar la intimidación típica", () => assert.ok(resolve({ menorDieciseis: false, amenazasAutonomas: true }).conexiones.some((item) => item.conceptId === "amenazas_coacciones")));
test("21 · entrada VioGén conserva el contexto en agresión sexual", () => assert.equal(resolve({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "pareja", hechosRelacion: ["sexual"] }).contextoRelacional.isViogenLO12004, true));
test("22 · agresiones sexuales calcula relación antes de cerrar", () => { const outcome = resolve({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "pareja" }); assert.ok(outcome.contextoRelacional); assert.match(titles(outcome), /VIOLENCIA DE GÉNERO/); });
test("23 · cambiar pareja a amigo elimina VioGén y 180.1.4", () => { const outcome = resolve({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "amigo" }); assert.equal(outcome.contextoRelacional.isViogenLO12004, false); assert.doesNotMatch(norms(outcome), /180\.1\.4/); });
test("24 · cambiar amigo a pareja recalcula VioGén", () => assert.equal(resolve({ sexoAutor: "hombre", sexoVictima: "mujer", tipoRelacion: "pareja" }).contextoRelacional.isViogenLO12004, true));
test("25 · más de 72 horas no excluye valoración forense", () => assert.match(JSON.stringify(resolve({ menorDieciseis: false, tiempoTranscurridoSuperior72h: true })), /tiempo transcurrido no excluye automáticamente/i));
test("26 · caso original no flagrante ya no produce detención no automática", () => { const outcome = resolve({ menorDieciseis: false, penetracion: true }, { flagrante: false, indiciosHechoSuficientes: true, indiciosParticipacionSuficientes: true, intentoFugaElusion: true }); assert.equal(outcome.procesal.detencion, "SÍ"); assert.notEqual(outcome.procesal.situacion, "INVESTIGADO NO DETENIDO"); });

test("182 y 183 permanecen separados de la agresión física consumada", () => { assert.match(norms(resolve({ menorDieciseis: true, conductaSexual: "hacer_presenciar" })), /182/); assert.match(norms(resolve({ menorDieciseis: true, conductaSexual: "contacto_tic" })), /183/); });
