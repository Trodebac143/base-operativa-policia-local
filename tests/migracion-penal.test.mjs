import assert from "node:assert/strict";
import { checkedPatrimony } from "./helpers/checked-facts.mjs";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

const { transformarMarcoPenal, clasificarDelitoPorPenas, penaEnMeses } = await vite.ssrLoadModule("/data/gravedad-penal.ts");
const { seleccionarSupuestoPenal } = await vite.ssrLoadModule("/data/catalogo-penal.ts");
const { resolverSituacionProcesal } = await vite.ssrLoadModule("/data/procesal-penal.ts");
const { resolverDerivacionPenal, supuestoDeDerivacion } = await vite.ssrLoadModule("/data/derivaciones-penales.ts");
const { resolveAuthorityOutcome, resolvePublicSafetyOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");

test("transforma mitades superiores y grado superior conservando el día indivisible", () => {
  const half = transformarMarcoPenal(penaEnMeses("prision", 12, 24), "mitad_superior");
  assert.deepEqual(half.pena.minimo, { unidad: "meses", valor: 18, diasAdicionales: 1 });
  assert.deepEqual(half.pena.maximo, { unidad: "meses", valor: 24 });

  const upper = transformarMarcoPenal(penaEnMeses("prision", 12, 48), "superior_grado");
  assert.deepEqual(upper.pena.minimo, { unidad: "meses", valor: 48, diasAdicionales: 1 });
  assert.deepEqual(upper.pena.maximo, { unidad: "meses", valor: 72 });
  assert.equal(clasificarDelitoPorPenas(half), "DELITO MENOS GRAVE");
  assert.equal(clasificarDelitoPorPenas(upper), "DELITO GRAVE");
});

test("las amenazas mantienen subtipo pendiente y utilizan solo las consecuencias comunes", () => {
  const pending = resolveAuthorityOutcome("amenazas", "art169", { autorMayorEdad: true, flagrante: true });
  const achieved = resolveAuthorityOutcome("amenazas", "art169", { autorMayorEdad: true, flagrante: true, condicionAmenaza: true, propositoConseguido: true });
  const notAchieved = resolveAuthorityOutcome("amenazas", "art169", { autorMayorEdad: true, flagrante: true, condicionAmenaza: true, propositoConseguido: false });
  const unconditional = resolveAuthorityOutcome("amenazas", "art169", { autorMayorEdad: true, flagrante: true, condicionAmenaza: false });
  assert.equal(pending.supuestoPenalId, "169.pendiente");
  assert.equal(pending.clasificacion, "DELITO MENOS GRAVE");
  assert.equal(pending.detencion, "SÍ");
  assert.deepEqual([achieved.supuestoPenalId, achieved.clasificacion], ["169.1.logrado", "DELITO MENOS GRAVE"]);
  assert.deepEqual([notAchieved.supuestoPenalId, notAchieved.clasificacion], ["169.1.no_logrado", "DELITO MENOS GRAVE"]);
  assert.deepEqual([unconditional.supuestoPenalId, unconditional.clasificacion], ["169.2", "DELITO MENOS GRAVE"]);
});

test("los subtipos de denuncia esperan procedibilidad y niegan detención sin ella", () => {
  const facts = { parejaExpareja: "no", relacionFamiliar: "no", convivencia: "no", agresionFisica: true, lesion: false };
  const pending = resolvePublicSafetyOutcome("agresiones_lesiones", facts, { autorMayorEdad: true, flagrante: true });
  const confirmed = resolvePublicSafetyOutcome("agresiones_lesiones", facts, { autorMayorEdad: true, flagrante: true, denunciaOQuerella: true });
  assert.deepEqual([pending.resultados[0].supuestoPenalId, pending.procesal.situacion, pending.procesal.detencion], ["147.3", "DILIGENCIAS DE PREVENCIÓN", "NO"]);
  assert.deepEqual([confirmed.resultados[0].supuestoPenalId, confirmed.procesal.escenarioProcesal, confirmed.procesal.detencion], ["147.3", "DELITO LEVE", "NO"]);

  const bruise = resolvePublicSafetyOutcome("agresiones_lesiones", { ...facts, lesion: true, resultadoAsistencial: "primera_asistencia" }, { autorMayorEdad: true, flagrante: true, denunciaOQuerella: true });
  assert.deepEqual([bruise.resultados[0].supuestoPenalId, bruise.procesal.escenarioProcesal], ["147.2", "DELITO LEVE"]);

  const minorThreatFacts = { parejaExpareja: "no", relacionFamiliar: "no", convivencia: "no", conductaLibertad: "amenaza", malAnunciado: "menor_entidad" };
  const threatPending = resolvePublicSafetyOutcome("amenazas_coacciones", minorThreatFacts, { autorMayorEdad: true, flagrante: true });
  const threatConfirmed = resolvePublicSafetyOutcome("amenazas_coacciones", minorThreatFacts, { autorMayorEdad: true, flagrante: true, denunciaOQuerella: true });
  assert.deepEqual([threatPending.procesal.situacion, threatPending.procesal.detencion], ["DILIGENCIAS DE PREVENCIÓN", "NO"]);
  assert.deepEqual([threatConfirmed.resultados[0].supuestoPenalId, threatConfirmed.procesal.escenarioProcesal], ["171.7.general", "DELITO LEVE"]);

  const negativeIndicia = resolvePublicSafetyOutcome("agresiones_lesiones", { ...facts, lesion: true, resultadoAsistencial: "tratamiento_posterior" }, { autorMayorEdad: true, flagrante: false, indiciosHechoSuficientes: false });
  assert.deepEqual([negativeIndicia.resultados[0].supuestoPenalId, negativeIndicia.procesal.situacion, negativeIndicia.procesal.detencion], ["147.1", "NO DETENER TODAVÍA — INVESTIGAR", "NO"]);
});

test("un supuesto de oficio continúa aunque concurra otro pendiente de denuncia", () => {
  const sharedFacts = {
    autorMayorEdad: true,
    flagrante: false,
    indiciosHechoSuficientes: true,
    indiciosParticipacionSuficientes: true,
    intentoFugaElusion: false,
    identidadODomicilioNoVerificables: false,
    riesgoConcretoIncomparecencia: false, riesgoOcultacionPruebas: false,
    riesgoConcretoVictimaTestigos: false,
    supuestosConcurrentes: [
      { gravedad: "DELITO MENOS GRAVE", procedibilidad: "oficio" }, // art. 153
      { gravedad: "DELITO LEVE", procedibilidad: "denuncia" }, // art. 173.4
    ],
  };
  const mixed = resolverSituacionProcesal(sharedFacts);
  const onlyComplaint = resolverSituacionProcesal({ ...sharedFacts, supuestosConcurrentes: [{ gravedad: "DELITO LEVE", procedibilidad: "denuncia" }] });
  assert.deepEqual([mixed.escenarioProcesal, mixed.situacion, mixed.detencion], ["NO FLAGRANTE", "INVESTIGADO NO DETENIDO", "NO"]);
  assert.deepEqual([onlyComplaint.escenarioProcesal, onlyComplaint.situacion, onlyComplaint.detencion], ["PROCEDIBILIDAD PENDIENTE", "DILIGENCIAS DE PREVENCIÓN", "NO"]);
});

test("los supuestos domésticos leves quedan separados de VG y de la vía general", () => {
  const domestic = { parejaExpareja: "no", relacionFamiliar: "si", convivencia: "si", medioPeligroso: false };
  const threat = resolvePublicSafetyOutcome("amenazas_coacciones", { ...domestic, conductaLibertad: "amenaza", malAnunciado: "menor_entidad" }, { autorMayorEdad: true });
  const coaction = resolvePublicSafetyOutcome("amenazas_coacciones", { ...domestic, conductaLibertad: "coaccion", coaccionEntidad: "leve" }, { autorMayorEdad: true });
  assert.equal(threat.resultados[0].supuestoPenalId, "171.7.domestica");
  assert.equal(threat.resultados[0].procedibilidadPenal, "oficio");
  assert.equal(coaction.resultados[0].supuestoPenalId, "172.3.domestica");
  assert.equal(coaction.resultados[0].procedibilidadPenal, "oficio");
});

test("lesiones 149/150 mantienen subtipo pendiente y una pérdida corporal visible permite actuación común", () => {
  const facts = { agresionFisica: true, lesion: true, signosLesion: "perdida_traumatica" };
  const result = resolvePublicSafetyOutcome("agresiones_lesiones", facts, { autorMayorEdad: true, flagrante: true });
  assert.equal(result.resultados[0].supuestoPenalId, "149-150.pendiente");
  assert.equal(result.resultados[0].marcoPenas.tipo, "pendiente");
  assert.equal(result.resultados[0].clasificacion, "DELITO GRAVE");
  assert.equal(result.procesal.detencion, "SÍ");
  assert.match(result.resultados[0].incertidumbre, /posterior/);
});

test("atentado agravado del art. 551 aplica grado superior al subtipo y víctima seleccionados", () => {
  const agent = resolveAuthorityOutcome("resistencia", "atentado", { autorMayorEdad: true, armaUsada551: true, victimaAtentado: "agente", flagrante: true });
  const authority = resolveAuthorityOutcome("resistencia", "atentado", { autorMayorEdad: true, armaUsada551: true, victimaAtentado: "autoridad", flagrante: true });
  assert.deepEqual([agent.supuestoPenalId, agent.clasificacion], ["551.agente", "DELITO MENOS GRAVE"]);
  assert.deepEqual([authority.supuestoPenalId, authority.clasificacion], ["551.autoridad", "DELITO GRAVE"]);
});

test("atentado no presume víctima ni circunstancias agravadas desconocidas", () => {
  const unknownVictim = resolveAuthorityOutcome("resistencia", "atentado", { autorMayorEdad: true, flagrante: true });
  const unknown551Facts = resolveAuthorityOutcome("resistencia", "atentado", { autorMayorEdad: true, victimaAtentado: "agente", flagrante: true });
  assert.equal(unknownVictim.supuestoPenalId, "550-551.pendiente");
  assert.equal(unknown551Facts.supuestoPenalId, "550-551.pendiente");
  assert.equal(unknownVictim.detencion, "NO");
  assert.equal(unknown551Facts.detencion, "SÍ");
  assert.equal(unknown551Facts.marcoPenas.tipo, "pendiente");
});

test("art. 266 conserva los marcos base, agravado y de peligro añadido como subtipos distintos", () => {
  const base = seleccionarSupuestoPenal("266.1");
  const aggravated = seleccionarSupuestoPenal("266.2");
  const special = seleccionarSupuestoPenal("266.3");
  const addedDangerBase = seleccionarSupuestoPenal("266.4.base");
  const addedDangerAggravated = seleccionarSupuestoPenal("266.4.agravado");
  const addedDangerSpecial = seleccionarSupuestoPenal("266.4.especial");
  assert.equal(base.gravedad, "DELITO MENOS GRAVE");
  assert.equal(aggravated.gravedad, "DELITO MENOS GRAVE");
  assert.equal(special.gravedad, "DELITO GRAVE");
  assert.equal(addedDangerBase.gravedad, "DELITO MENOS GRAVE");
  assert.equal(addedDangerAggravated.gravedad, "DELITO MENOS GRAVE");
  assert.equal(addedDangerSpecial.gravedad, "DELITO GRAVE");
  assert.notDeepEqual(addedDangerBase.penas, base.penas);
  assert.notDeepEqual(addedDangerAggravated.penas, aggravated.penas);
  assert.notDeepEqual(addedDangerSpecial.penas, special.penas);
});

test("edad desconocida deja el proceso pendiente; la edad acreditada separa adulto y menores", () => {
  const facts = { gravedad: "DELITO MENOS GRAVE", flagrante: true, indiciosHechoSuficientes: true, indiciosParticipacionSuficientes: true };
  const unknown = resolverSituacionProcesal(facts);
  const adult = resolverSituacionProcesal({ ...facts, autorMayorEdad: true });
  const minor = resolverSituacionProcesal({ ...facts, edadAutor: "de_14_a_17" });
  assert.deepEqual([unknown.escenarioProcesal, unknown.situacion, unknown.detencion], ["EDAD PENDIENTE", "DILIGENCIAS DE PREVENCIÓN", "NO"]);
  assert.deepEqual([adult.escenarioProcesal, adult.situacion, adult.detencion], ["FLAGRANCIA", "DETENIDO", "SÍ"]);
  assert.deepEqual([minor.escenarioProcesal, minor.situacion, minor.detencion], ["AUTOR MENOR", "RUTA DE RESPONSABILIDAD PENAL DE MENORES", "NO APLICAR MOTOR ADULTO"]);
});

test("las derivaciones animales conservan el supuesto seleccionado y su gravedad", () => {
  const pending = supuestoDeDerivacion("CP-340-BIS");
  const minor = resolverDerivacionPenal("CP-340-BIS", { autorMayorEdad: true }, { resultado: "sin_tratamiento_maltrato_grave" });
  const domestic = resolverDerivacionPenal("CP-340-BIS", { autorMayorEdad: true }, { bajoControlHumano: true, resultado: "tratamiento", agravanteDocumentada: false });
  const other = resolverDerivacionPenal("CP-340-BIS", { autorMayorEdad: true }, { bajoControlHumano: false, resultado: "tratamiento", agravanteDocumentada: false });
  const aggravated = resolverDerivacionPenal("CP-340-BIS", { autorMayorEdad: true }, { bajoControlHumano: true, resultado: "muerte", agravanteDocumentada: true });
  assert.equal(pending, "340bis.pendiente");
  assert.deepEqual([minor.supuesto.id, minor.supuesto.gravedad], ["340bis.4", "DELITO LEVE"]);
  assert.deepEqual([domestic.supuesto.id, domestic.supuesto.gravedad], ["340bis.1.domestico", "DELITO MENOS GRAVE"]);
  assert.deepEqual([other.supuesto.id, other.supuesto.gravedad], ["340bis.1.vertebrado", "DELITO MENOS GRAVE"]);
  assert.equal(aggravated.supuesto.id, "340bis.3.domestico.agravado");
  assert.equal(aggravated.supuesto.gravedad, "DELITO MENOS GRAVE");
});


test("la mitad del maltrato doméstico se clasifica sin inventar días para una fracción de mes",()=>{
  assert.equal(transformarMarcoPenal(penaEnMeses("prision",3,12),"mitad_superior"),undefined);
  assert.equal(seleccionarSupuestoPenal("153.2.3").gravedad,"DELITO MENOS GRAVE");
});

test("lesiones de persona vulnerable conviviente aplican el subtipo protegido fuera de pareja",()=>{
  const facts={parejaExpareja:"no",relacionFamiliar:"no",convivencia:"no",personaEspecialmenteVulnerableConvive:true,agresionFisica:true,lesion:false};
  const result=resolvePublicSafetyOutcome("agresiones_lesiones",facts,{autorMayorEdad:true,flagrante:true});
  assert.equal(result.resultados[0].supuestoPenalId,"153.1");
  assert.equal(result.procesal.detencion,"SÍ");
});

test("266.3 exige la entidad del daño militar y la afección del servicio, no solo su titularidad",async()=>{
  const {resolvePatrimonyOutcome}=await vite.ssrLoadModule("/data/patrimonio.ts");
  const facts={...checkedPatrimony,hechoPrincipal:"danos",titularidad:"ajena",intencionalidadDano:"deliberado",danoInformatico:false,cuantiaAcreditada:true,cuantia:2000,medioDestructivoOPeligroPersonas:true,medioDano:"explosion",peligroVidaIntegridad:false,bienEspecial266:"militar_265"};
  assert.equal(resolvePatrimonyOutcome(facts).estado,"pendiente");
  assert.equal(resolvePatrimonyOutcome({...facts,danoGraveOInutilizacionMilitar:true}).supuestoPenalId,"266.3");
  assert.equal(resolvePatrimonyOutcome({...facts,cuantia:1000,danoGraveOInutilizacionMilitar:true}).supuestoPenalId,"266.1");
  assert.equal(resolvePatrimonyOutcome({...facts,bienEspecial266:"servicio_560"}).estado,"pendiente");
  assert.equal(resolvePatrimonyOutcome({...facts,bienEspecial266:"servicio_560",interrupcionObstaculizacionServicio:true}).supuestoPenalId,"266.3");
});


test("181.2 incluye el abuso de superioridad sin duplicarlo como la misma agravación relacional",()=>{
  const result=resolvePublicSafetyOutcome("agresiones_sexuales",{actoSexualNoConsentido:true,menorDieciseis:true,conductaSexual:"acto_fisico",penetracion:false,violenciaIntimidacion:false,voluntadAnulada:false,abusoSuperioridad:"si",prevalimientoRelacion:true,parejaExpareja:"no",relacionFamiliar:"no",convivencia:"no",procedibilidadSexual:"ministerio_fiscal"},{autorMayorEdad:true});
  const ids=result.resultados.flatMap(row=>row.supuestoPenalId?[row.supuestoPenalId]:[]);
  assert.deepEqual(ids,["181.2"]);
});
