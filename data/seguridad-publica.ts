import operativaJson from "../contenido/seguridad_publica/operativa.json";
import { type RegimenPenas } from "./gravedad-penal";
import { consecuenciasComunesPenales, seleccionarSupuestoPenal, type SupuestoPenalId, type ProcedibilidadPenal } from "./catalogo-penal";
import type { UsoReferenciaProcesal } from "./referencias-procesales";
import { resolverSituacionProcesal, type ProcessualDecision, type ProcessualInput, type RazonamientoProcesal } from "./procesal-penal";
export { redactarRazonamientoProcesal, resolveMinorOffenceProcessualDecision, resolvePenalProcessualDecision, type ProcessualDecision, type ProcessualInput, type RazonamientoProcesal } from "./procesal-penal";

export type PublicConcept = {
  id: string;
  bloque: "Drogas" | "Autoridad y agentes" | "Armas y objetos peligrosos" | "Violencia de género y doméstica" | "Agresiones y lesiones" | "Agresiones sexuales" | "Peleas y riñas" | "Amenazas y coacciones" | "Delitos contra el patrimonio";
  titulo: string;
  icono: string;
  sinonimos: string[];
  resultado: string;
  norma: string;
  calificacion?: string;
  rango?: string;
  comprobar: string[];
  frontera: string;
  actuacion?: string[];
  competencia?: string;
  fuentes?: string[];
  detalle?: string[];
};
export type PublicSecurityBlock = PublicConcept["bloque"];

/** Traducción exclusivamente de interfaz: conserva las claves de contenido existentes. */
export const seguridadPublicaBlockLabel = (block: PublicSecurityBlock) => block === "Autoridad y agentes" ? "Hechos contra los agentes" : block;
export const seguridadPublicaBlockDescription: Record<PublicSecurityBlock, string> = {
  "Drogas": "Consumo, tenencia y posible tráfico.",
  "Autoridad y agentes": "Respeto, desobediencia, identificación, resistencia, amenazas y atentado.",
  "Armas y objetos peligrosos": "Armas blancas y objetos utilizados como medio ofensivo.",
  "Violencia de género y doméstica": "Relación protegida y hechos que pueden coexistir.",
  "Agresiones y lesiones": "Agresión física, resultado asistencial y alertas de gravedad.",
  "Agresiones sexuales": "Actuación inmediata, preservación y derivaciones necesarias.",
  "Peleas y riñas": "Enfrentamientos individuales, recíprocos y tumultuarios.",
  "Amenazas y coacciones": "Anuncio de mal, imposición y conducta reiterada.",
  "Delitos contra el patrimonio": "Hurto, robos, apropiaciones y daños a partir de hechos observables.",
};
const publicSecurityCategoryByBlock: Record<PublicSecurityBlock, string> = {
  "Drogas": "seguridad_publica_drogas",
  "Autoridad y agentes": "seguridad_publica_agentes",
  "Armas y objetos peligrosos": "seguridad_publica_armas",
  "Violencia de género y doméstica": "seguridad_publica_violencia_relacional",
  "Agresiones y lesiones": "seguridad_publica_agresiones_lesiones",
  "Agresiones sexuales": "seguridad_publica_agresiones_sexuales",
  "Peleas y riñas": "seguridad_publica_peleas_rinas",
  "Amenazas y coacciones": "seguridad_publica_amenazas_coacciones",
  "Delitos contra el patrimonio": "seguridad_publica_patrimonio",
};
export const seguridadPublicaCategoryId = (block: PublicSecurityBlock) => publicSecurityCategoryByBlock[block];
export const seguridadPublicaBlockFromCategoryId = (categoryId: string): PublicSecurityBlock | undefined => Object.entries(publicSecurityCategoryByBlock).find(([, value]) => value === categoryId)?.[0] as PublicSecurityBlock | undefined;
export type PenalSelection = { supuestoPenalId?: SupuestoPenalId; marcoPenas?: RegimenPenas; procedibilidadPenal?: ProcedibilidadPenal; alternativasPenales?: SupuestoPenalId[]; incertidumbre?: string };
export type DrugOutcome = PenalSelection & {
  kind: "administrativa" | "indicios_no_concluyentes" | "penal";
  titulo: string;
  norma: string;
  clasificacion?: string;
  situacion: ProcessualDecision["situacion"] | "DILIGENCIAS DE PREVENCIÓN";
  detencion: ProcessualDecision["detencion"];
  fundamentoDetencion?: string;
  razonamientoProcesal?: RazonamientoProcesal;
  escenarioProcesal?: ProcessualDecision["escenarioProcesal"];
  referenciasProcesales?: UsoReferenciaProcesal[];
  porQue: string;
  actuacion: string[];
};
export type AuthorityOutcome = PenalSelection & {
  titulo: string;
  norma: string;
  clasificacion?: string;
  situacion?: ProcessualDecision["situacion"];
  detencion?: ProcessualDecision["detencion"];
  fundamentoDetencion?: string;
  razonamientoProcesal?: RazonamientoProcesal;
  escenarioProcesal?: ProcessualDecision["escenarioProcesal"];
  referenciasProcesales?: UsoReferenciaProcesal[];
  porQue: string;
  frontera: string;
  actuacion: string[];
};

/** Adaptador técnico: los textos operativos se mantienen en contenido/seguridad_publica/. */
export const seguridadPublica = operativaJson as {
  titulo: string;
  subtitulo: string;
  fuentes: string[];
  comunes: typeof operativaJson.comunes;
  conceptos: PublicConcept[];
};
export const seguridadPublicaConceptos = seguridadPublica.conceptos;
export const seguridadPublicaSearchEntries = seguridadPublicaConceptos.map((concept) => ({
  ...concept,
  modulo: "seguridad_publica",
  categoria: seguridadPublicaCategoryId(concept.bloque),
}));

const penalSelection = (id: SupuestoPenalId, alternativasPenales: SupuestoPenalId[] = []) => {
  const supuesto = seleccionarSupuestoPenal(id);
  const comunes = consecuenciasComunesPenales(alternativasPenales);
  const pendiente = supuesto.penas.tipo === "pendiente";
  return { supuestoPenalId: id, marcoPenas: supuesto.penas, alternativasPenales,
    procedibilidadPenal: pendiente ? comunes.procedibilidad : supuesto.procedibilidad,
    clasificacion: pendiente ? comunes.gravedad : supuesto.gravedad,
    ...(pendiente ? { incertidumbre: supuesto.descripcion } : {}),
  };
};
const processForSelection = (id: SupuestoPenalId, input: ProcessualInput, alternativasPenales: SupuestoPenalId[] = []) => {
  const supuesto = penalSelection(id, alternativasPenales);
  return resolverSituacionProcesal({ ...input, alternativasPenales, gravedad: supuesto.clasificacion, procedibilidad: supuesto.procedibilidadPenal });
};

export type SustanciaObservada = "cocaina" | "heroina" | "mdma" | "anfetamina" | "lsd" | "cannabis" | "desconocida";
export function resolveDrugOutcome(input: { ventaObservada: boolean; indiciosSuficientes: boolean; sustancia: SustanciaObservada | "grave_dano" | "resto" } & ProcessualInput): DrugOutcome {
  if (input.ventaObservada || input.indiciosSuficientes) {
    if (input.sustancia === "desconocida") return {
      kind: "penal", titulo: "POSIBLE TRÁFICO DE DROGAS", norma: "Código Penal · art. 368",
      ...penalSelection("368.pendiente", ["368.grave", "368.resto"]),
      ...processForSelection("368.pendiente", input, ["368.grave", "368.resto"]),
      porQue: "Constan actos de entrega o indicios objetivos de tráfico; la naturaleza de la sustancia está pendiente de confirmación.",
      incertidumbre: "El análisis de la sustancia determinará el subtipo y su pena. No se presume su composición ni su gravedad penal.",
      actuacion: ["Documentar los actos de tráfico y su atribución individual.", "Aprehender la sustancia, preservar la cadena de custodia y solicitar análisis.", "Asegurar efectos, testigos y comunicaciones obtenidas legítimamente; coordinar con CNP."],
    };
    const grave = ["grave_dano", "cocaina", "heroina", "mdma", "anfetamina", "lsd"].includes(input.sustancia);
    const id = grave ? "368.grave" : "368.resto";
    const processual = processForSelection(id, input);
    return {
      kind: "penal", titulo: "POSIBLE DELITO", norma: "Código Penal · art. 368",
      ...penalSelection(id), ...processual,
      porQue: input.ventaObservada ? "Se observa venta, entrega o suministro a tercero." : "Existen indicios objetivos suficientes de tráfico valorados conjuntamente.",
      actuacion: processual.situacion === "DETENIDO"
        ? ["Documentar venta e indicios, asegurar pruebas y efectos objetivamente vinculados.", "Presentar al detenido, actuaciones y efectos en CNP."]
        : ["Documentar venta e indicios, asegurar pruebas y efectos objetivamente vinculados.", "Informar de hechos y derechos; coordinar continuación y citación con CNP."],
    };
  }
  return {
    ...penalSelection("368.pendiente"), kind: "indicios_no_concluyentes", titulo: "INDICIOS DE POSIBLE TRÁFICO, NO CONCLUYENTES", norma: "Coordinación con CNP", ...resolverSituacionProcesal({ ...input, atribucionPendiente: true }),
    porQue: "Hay elementos que generan duda, pero no se ha cerrado una atribución individualizada suficiente de tráfico.",
    actuacion: ["Identificar y documentar los indicios concretos presentes.", "Asegurar pruebas, efectos y datos de testigos cuando proceda.", "Comunicar o comparecer ante CNP para continuación."],
  };
}

function penalAuthorityOutcome(base: Omit<AuthorityOutcome, "situacion" | "detencion" | "fundamentoDetencion" | "escenarioProcesal">, input?: ProcessualInput): AuthorityOutcome {
  return { ...base, ...(base.supuestoPenalId?.startsWith("551.") ? { norma: "Código Penal · arts. 550 y 551" } : {}), ...(base.supuestoPenalId ? processForSelection(base.supuestoPenalId, input ?? {}, base.alternativasPenales) : resolverSituacionProcesal(input)) };
}

export type AuthorityFacts = ProcessualInput & {
  conductaObservada?: "insulto" | "negativa" | "oposicion" | "forcejeo" | "ataque" | "amenaza_concreta" | "expresion_intimidatoria";
  ordenConcretaComprendida?: boolean;
  negativaPersistente?: boolean;
  servicioImpedido?: boolean;
  enFunciones?: boolean;
  victimaAtentado?: "agente" | "funcionario" | "docente_sanitario" | "autoridad" | "autoridad_5503";
  armaUsada551?: boolean;
  violenciaPeligrosa551?: boolean;
  vehiculoMotor551?: boolean;
  incidentePenitenciario551?: boolean;
  condicionAmenaza?: boolean;
  propositoConseguido?: boolean;
};
const atentadoId = (facts: AuthorityFacts): SupuestoPenalId => {
  const circunstancias = [facts.armaUsada551, facts.violenciaPeligrosa551, facts.vehiculoMotor551, facts.incidentePenitenciario551];
  if (!facts.victimaAtentado || (!circunstancias.some((v) => v === true) && circunstancias.some((v) => v === undefined))) return "550-551.pendiente";
  const victima = facts.victimaAtentado === "autoridad_5503" ? "especial" : facts.victimaAtentado === "autoridad" ? "autoridad" : "agente";
  const agravado = facts.armaUsada551 || facts.violenciaPeligrosa551 || facts.vehiculoMotor551 || facts.incidentePenitenciario551;
  return `${agravado ? "551" : "550"}.${victima}` as SupuestoPenalId;
};
const threatId = (facts: AuthorityFacts): SupuestoPenalId => facts.condicionAmenaza === true
  ? facts.propositoConseguido === true ? "169.1.logrado" : facts.propositoConseguido === false ? "169.1.no_logrado" : "169.pendiente"
  : facts.condicionAmenaza === false ? "169.2" : "169.pendiente";
const threatAlternatives: SupuestoPenalId[] = ["169.1.logrado", "169.1.no_logrado", "169.2"];
const atentadoAlternatives = (facts: AuthorityFacts): SupuestoPenalId[] => {
  if (!facts.victimaAtentado) return [];
  const victima = facts.victimaAtentado === "autoridad_5503" ? "especial" : facts.victimaAtentado === "autoridad" ? "autoridad" : "agente";
  return [`550.${victima}`, `551.${victima}`] as SupuestoPenalId[];
};
/** Encaje de autoridad desde conductas; la interfaz no elige artículos ni gravedad. */
export function resolveAuthorityFromFacts(conceptId: string, facts: AuthorityFacts): AuthorityOutcome | null {
  if (!facts.conductaObservada || facts.enFunciones !== true) return null;
  let level: string;
  let rama = conceptId;
  switch (facts.conductaObservada) {
    case "ataque": level = "atentado"; rama = "resistencia"; break;
    case "amenaza_concreta": level = "art169"; rama = "amenazas"; break;
    case "expresion_intimidatoria": level = "leve"; rama = "amenazas"; break;
    case "insulto": level = "admin"; rama = "amenazas"; break;
    case "negativa":
      if ([facts.ordenConcretaComprendida, facts.negativaPersistente, facts.servicioImpedido].some((value) => value === undefined)) return null;
      if (!facts.ordenConcretaComprendida) return null;
      level = facts.negativaPersistente && facts.servicioImpedido ? "penal" : "admin"; rama = "desobediencia"; break;
    case "forcejeo": level = "penal"; rama = "resistencia"; break;
    case "oposicion": level = "admin"; rama = "resistencia"; break;
  }
  return resolveAuthorityOutcome(rama, level, facts);
}
export function resolveAuthorityOutcome(conceptId: string, level: string, input: AuthorityFacts = {}): AuthorityOutcome | null {
  const admin = (titulo: string, norma: string, porQue: string, frontera: string): AuthorityOutcome => ({ titulo, norma, porQue, frontera, actuacion: ["Documentar los hechos, requerimientos y respuesta de la persona.", "Formular denuncia administrativa."] });
  if (conceptId === "desobediencia") return level === "penal" ? penalAuthorityOutcome({
    titulo: "POSIBLE DELITO", norma: "Código Penal · art. 556.1", ...penalSelection("556.1"),
    porQue: "Constan orden legítima, expresa, concreta y terminante, dirigida al interesado y conocida o comprendida; negativa consciente, oposición persistente o contumaz y gravedad penal suficiente.",
    frontera: "Permanece en el art. 36.6 LO 4/2015 cuando falta una orden expresa, concreta y terminante dentro de las competencias legales del agente, su comunicación y conocimiento efectivo, una negativa consciente y tenaz o gravedad penal suficiente atendiendo a la trascendencia de la orden, las consecuencias del incumplimiento y el conjunto de circunstancias.",
    actuacion: ["Documentar literalmente la orden, su competencia, comunicación y conocimiento, la negativa y persistencia.", "Aplicar el régimen procesal mostrado y coordinar con CNP cuando no proceda la detención."],
  }, input) : admin("INFRACCIÓN ADMINISTRATIVA", "LO 4/2015 · art. 36.6", "No concurren conjuntamente los requisitos de una desobediencia grave del art. 556.1 CP.", "Permanece en el art. 36.6 LO 4/2015 cuando no existe una orden expresa, concreta y terminante dentro de las competencias legales del agente, no consta su conocimiento efectivo, falta negativa consciente y persistente o no alcanza gravedad penal suficiente.");
  if (conceptId === "resistencia") {
    if (level === "atentado") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 550", ...penalSelection(atentadoId(input), atentadoId(input).endsWith("pendiente") ? atentadoAlternatives(input) : []),
      porQue: "Existe agresión, acometimiento o resistencia grave mediante violencia o intimidación grave.",
      frontera: "La resistencia pasiva grave o activa de entidad penal que no incluya agresión, acometimiento ni resistencia grave mediante violencia o intimidación grave se encuadra en el art. 556.1 CP. La resistencia pasiva leve, la oposición de escasa entidad y la dificultad menor se mantienen en el art. 36.6 LO 4/2015.",
      actuacion: ["Documentar violencia, intimidación, lesiones, medios y testigos.", "Presentar al detenido y actuaciones en CNP."],
    }, input);
    if (level === "penal") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 556.1", ...penalSelection("556.1"),
      porQue: "Hay resistencia pasiva grave o resistencia activa de intensidad inferior a atentado, con entidad penal suficiente.",
      frontera: "La resistencia pasiva leve, la oposición de escasa entidad y la dificultad menor se mantienen en el art. 36.6 LO 4/2015. La agresión, el acometimiento o la resistencia grave mediante violencia o intimidación grave abren la rama del art. 550 CP.",
      actuacion: ["Documentar la intensidad y secuencia de la oposición física.", "Aplicar el régimen procesal mostrado y coordinar con CNP cuando no proceda la detención."],
    }, input);
    return admin("INFRACCIÓN ADMINISTRATIVA", "LO 4/2015 · art. 36.6", "Oposición de escasa entidad, resistencia pasiva leve o dificultad menor.", "Permanece en el art. 36.6 LO 4/2015 mientras la oposición sea pasiva leve, de escasa entidad o una dificultad menor. La resistencia pasiva grave o activa con entidad penal abre el art. 556.1 CP; la agresión, acometimiento o resistencia grave mediante violencia o intimidación grave abren el art. 550 CP.");
  }
  if (conceptId === "amenazas") {
    if (level === "leve") return {
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 171.7", ...penalSelection("171.7.general"), ...processForSelection("171.7.general", input),
      porQue: "Amenaza de carácter leve fuera de los restantes supuestos.",
      frontera: "Una frase airada sin anuncio serio de mal penalmente relevante permanece en el art. 37.4 LO 4/2015. Una amenaza de mal futuro con entidad suficiente abre la rama del art. 169 CP; la intimidación grave integrada en resistencia grave o inicio inmediato de ataque abre la rama del art. 550 CP.",
      actuacion: ["Identificar y documentar literalmente las expresiones y el contexto.", "Informar de hechos y derechos; coordinar continuación y citación con CNP."],
    };
    if (level === "art169") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 169", ...penalSelection(threatId(input), threatId(input).endsWith("pendiente") ? threatAlternatives : []),
      porQue: "Amenaza de causar los males trabajados en el art. 169 CP, con entidad apreciada por el contenido, seriedad, firmeza, medios, proximidad, reiteración y conducta acompañante.",
      frontera: "No es atentado cuando se anuncia un mal futuro sin resistencia grave ni inicio inmediato de ataque. La intimidación grave integrada en resistencia grave o inicio inmediato de ataque se encuadra en el art. 550 CP.",
      actuacion: ["Documentar expresiones, seriedad, medios, proximidad, reiteración y conducta acompañante.", "Aplicar el régimen procesal mostrado y coordinar con CNP cuando no proceda la detención."],
    }, input);
    if (level === "atentado") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 550", ...penalSelection(atentadoId(input), atentadoId(input).endsWith("pendiente") ? atentadoAlternatives(input) : []),
      porQue: "La intimidación grave se integra en resistencia grave o inicio inmediato de ataque.",
      frontera: "La amenaza de un mal futuro sin resistencia grave ni inicio inmediato de ataque se encuadra en amenazas.",
      actuacion: ["Documentar el medio empleado, disposición inmediata de ataque y finalidad de impedir la actuación.", "Presentar al detenido y actuaciones en CNP."],
    }, input);
    return { titulo: "INFRACCIÓN ADMINISTRATIVA", norma: "LO 4/2015 · art. 37.4", porQue: "Insulto, expresión despectiva o frase airada sin anuncio serio de mal penalmente relevante.", frontera: "Permanece en el art. 37.4 LO 4/2015 cuando no hay anuncio serio de un mal penalmente relevante, agresión, acometimiento, resistencia grave mediante violencia o intimidación grave.", actuacion: ["Documentar literalmente conducta y contexto.", "Formular denuncia administrativa."] };
  }
  return null;
}

export type PersonSex = "hombre" | "mujer" | "otro" | "no_determinado";
export type RelationalAnswer = "si" | "no" | "no_determinado";
export type PublicSafetyRelation = "vg" | "domestica" | "ninguna" | "pendiente";
export type RelationalContext = {
  relation: PublicSafetyRelation;
  isViogenLO12004: boolean;
  isPartnerOrExPartner: boolean;
  hasFamilyRelationship: boolean;
  hasCohabitation: boolean;
  hasSuperiorityRelationship: boolean;
  femaleSexualOffenceVSMJurisdiction: boolean;
};
export type PublicSafetyFacts = {
  sexoAutor?: PersonSex;
  sexoVictima?: PersonSex;
  parejaExpareja?: RelationalAnswer;
  relacionFamiliar?: RelationalAnswer;
  convivencia?: RelationalAnswer;
  hechosRelacion?: Array<"agresion" | "amenazas" | "coacciones" | "sexual" | "quebrantamiento" | "acoso" | "vejaciones">;
  episodiosPrevios?: boolean;
  noDeseaDenunciar?: boolean;
  agresionFisica?: boolean;
  lesion?: boolean;
  resultadoAsistencial?: "sin_asistencia" | "primera_asistencia" | "tratamiento_posterior" | "desconocido";
  medioPeligroso?: boolean;
  personaEspecialmenteVulnerableConvive?: boolean;
  signosLesion?: "perdida_traumatica" | "perdida_funcion" | "deformidad_evidente" | "riesgo_vital" | "sin_signos" | "no_determinado";
  peligroConcretoLesion?: boolean;
  ensanamientoAlevosiaDocumentado?: boolean;
  victimaMenorCatorce?: boolean;
  discapacidadEspecialProteccion?: boolean;
  presenciaMenores?: boolean;
  armaUtilizada?: boolean;
  domicilioComunOVictima?: boolean;
  medidaQuebrantada?: boolean;
  denunciaOQuerella?: boolean;
  propositoConseguido?: boolean;
  condicionConductaDebida?: boolean;
  acosoReiterado?: boolean;
  alteracionVidaCotidiana?: boolean;
  conductaAcoso?: "vigilancia" | "contacto" | "datos" | "libertad_patrimonio";
  medidaVigenteConocida?: boolean;
  incumplimientoMedida?: boolean;
  medidaRelacion1732?: boolean;
  privadoLibertad?: boolean;
  dispositivoControlManipulado?: boolean;
  habitualidadDocumentada?: boolean;
  vejacionInjuriaLeve?: boolean;
  prevalimientoRelacion?: boolean;
  actosPresenciadosDelictivos?: boolean;
  propuestaEncuentroYAcercamiento?: boolean;
  embaucarMaterialPornografico?: boolean;
  resultadoEspecialGravedad?: boolean;
  indiciosFinalidadMatar?: boolean;
  contextoSexual?: boolean;
  tipoRina?: "una_agrede" | "reciproca" | "grupal_confusa" | "grupal_individualizable";
  lesionIndividualizable?: boolean;
  victimaAgente?: boolean;
  actoSexualNoConsentido?: boolean;
  penetracion?: boolean;
  violenciaIntimidacion?: boolean;
  dificultadDecidir?: boolean;
  variasPersonas?: boolean;
  posibleSumisionQuimica?: boolean;
  menorDieciseis?: boolean;
  autorMayorEdad?: boolean;
  conductaSexual?: "acto_fisico" | "hacer_presenciar" | "contacto_tic";
  estadoConsentimiento?: "ausencia_manifestada" | "actos_claros_consentimiento" | "violencia_intimidacion" | "voluntad_anulada" | "informacion_insuficiente";
  voluntadAnulada?: boolean;
  abusoSuperioridad?: RelationalAnswer;
  vulnerabilidadEspecial?: boolean;
  violenciaExtremaDegradante?: boolean;
  sustanciasAdministradas?: boolean;
  organizacionCriminal?: boolean;
  posibleExcepcion183Bis?: boolean;
  amenazasAutonomas?: boolean;
  tiempoTranscurridoSuperior72h?: boolean;
  procedibilidadSexual?: "denuncia_victima" | "denuncia_representante" | "ministerio_fiscal" | "pendiente";
  conductaLibertad?: "amenaza" | "coaccion" | "acoso";
  malAnunciado?: "entidad_delictiva" | "menor_entidad" | "no_delictivo" | "no_precisado";
  condicionImpuesta?: boolean;
  coaccionEntidad?: "general" | "leve" | "no_precisada";
  soportes?: boolean;
};
export type PublicSafetyResult = PenalSelection & {
  titulo: string;
  norma: string;
  clasificacion?: string;
  texto: string;
  actuacion: string[];
  destacado?: "warning" | "danger" | "neutral";
  referenciasProcesales?: UsoReferenciaProcesal[];
};
export type PublicSafetyConnection = { conceptId: string; etiqueta: string; motivo: string };
export type PublicSafetyOutcome = {
  resultados: PublicSafetyResult[];
  conexiones: PublicSafetyConnection[];
  procesal?: ProcessualDecision;
  contextoRelacional?: RelationalContext;
  procedibilidad?: { estado: "CUMPLIDA" | "PENDIENTE / COORDINAR"; fundamento: string };
};

export function deriveRelationalContext(facts: PublicSafetyFacts): RelationalContext {
  const partner = facts.parejaExpareja === "si";
  const family = facts.relacionFamiliar === "si";
  const cohabitation = facts.convivencia === "si" || facts.personaEspecialmenteVulnerableConvive === true;
  const isViogenLO12004 = facts.sexoAutor === "hombre" && facts.sexoVictima === "mujer" && partner;
  const sexesDetermined = facts.sexoAutor !== undefined && facts.sexoAutor !== "no_determinado" && facts.sexoVictima !== undefined && facts.sexoVictima !== "no_determinado";
  let relation: PublicSafetyRelation = "pendiente";
  if (isViogenLO12004) relation = "vg";
  else if (facts.personaEspecialmenteVulnerableConvive === true) relation = "domestica";
  else if (facts.parejaExpareja === "si" && sexesDetermined) relation = "domestica";
  else if (facts.parejaExpareja === "si") relation = "pendiente";
  else if (family) relation = "domestica";
  else if (facts.parejaExpareja === "no" && facts.relacionFamiliar === "no" && facts.convivencia === "si") relation = "domestica";
  else if (facts.parejaExpareja === "no" && facts.relacionFamiliar === "no" && facts.convivencia === "no") relation = "ninguna";
  return {
    relation,
    isViogenLO12004,
    isPartnerOrExPartner: partner,
    hasFamilyRelationship: family,
    hasCohabitation: cohabitation,
    hasSuperiorityRelationship: facts.abusoSuperioridad === "si",
    femaleSexualOffenceVSMJurisdiction: facts.sexoVictima === "mujer",
  };
}

const incidentResult = (titulo: string, norma: string, texto: string, actuacion: string[], clasificacion?: string, destacado?: PublicSafetyResult["destacado"]): PublicSafetyResult => ({ titulo, norma, texto, actuacion, clasificacion, destacado });
const basicIncidentAction = ["Proteger y separar cuando proceda.", "Identificar a las personas implicadas.", "Recoger hechos relevantes, testigos e indicios disponibles."];
const relationConnection = (relation: PublicSafetyRelation): PublicSafetyConnection | undefined => relation === "vg" || relation === "domestica" ? { conceptId: "violencia_relacional", etiqueta: relation === "vg" ? "Violencia de género" : "Violencia doméstica", motivo: "Los hechos relacionales ya recogidos se conservan en la intervención." } : undefined;
const addConnection = (connections: PublicSafetyConnection[], connection: PublicSafetyConnection | undefined) => { if (connection && !connections.some((item) => item.conceptId === connection.conceptId)) connections.push(connection); };
const conAgravacionRelacional = (id: SupuestoPenalId, facts: PublicSafetyFacts): SupuestoPenalId => {
  const contextual = facts.presenciaMenores || facts.domicilioComunOVictima || facts.medidaQuebrantada;
  const armas = facts.armaUtilizada && ["153.1", "153.2", "173.2"].includes(id);
  if (!contextual && !armas) return id;
  const map: Partial<Record<SupuestoPenalId, SupuestoPenalId>> = { "153.1": "153.1.3", "153.2": "153.2.3", "171.4": "171.4.agravada", "171.5": "171.5.agravada", "172.2": "172.2.agravada", "173.2": "173.2.agravada" };
  return map[id] ?? id;
};
const penalIncident = (id: SupuestoPenalId, titulo: string, norma: string, texto: string, actuacion: string[], destacado?: PublicSafetyResult["destacado"], alternativas: SupuestoPenalId[] = []): PublicSafetyResult => ({ ...incidentResult(titulo, norma, texto, actuacion, undefined, destacado), ...penalSelection(id, alternativas) });
const withIncidentProcessual = (outcome: PublicSafetyOutcome, input: ProcessualInput): PublicSafetyOutcome => {
  const seleccionados = outcome.resultados.filter((result) => result.supuestoPenalId);
  if (!seleccionados.length) return outcome;
  return { ...outcome, procesal: resolverSituacionProcesal({ ...input, supuestosConcurrentes: seleccionados.map((result) => ({ gravedad: seleccionarSupuestoPenal(result.supuestoPenalId!).gravedad, procedibilidad: result.procedibilidadPenal, alternativasPenales: result.alternativasPenales })) }) };
};

/** Motor común para incidentes personales: utiliza los mismos hechos entre bloques. */
export function resolvePublicSafetyOutcome(conceptId: string, facts: PublicSafetyFacts, input: ProcessualInput = {}): PublicSafetyOutcome {
  const results: PublicSafetyResult[] = [];
  const connections: PublicSafetyConnection[] = [];
  const contextoRelacional = deriveRelationalContext(facts);
  const relation = contextoRelacional.relation;
  const protectedRelation = relation === "vg" || relation === "domestica";
  const relationLink = relationConnection(relation);
  const pending = (text: string) => ({ resultados: [incidentResult("ORIENTACIÓN PENDIENTE", "Datos de la intervención", text, basicIncidentAction, undefined, "neutral")], conexiones: [] });
  const addComplaintNotice = (sexual = false) => {
    if (!facts.noDeseaDenunciar) return;
    if (!sexual && !protectedRelation) return;
    results.push({ ...incidentResult(
      "DENUNCIA DE LA VÍCTIMA",
      sexual ? "Código Penal · art. 191; LECrim · art. 105" : "LECrim · art. 105",
      sexual
        ? "No paraliza la protección ni las primeras diligencias. Para proceder: denuncia de la víctima o querella del Ministerio Fiscal."
        : "No es necesaria para continuar. Informar a la víctima y actuar de oficio.",
      ["Documentar su manifestación e informar de sus derechos.", sexual ? "Mantener protección, asistencia, actuaciones urgentes, preservación de indicios y coordinación con CNP/unidad especializada/Ministerio Fiscal." : "Continuar la actuación policial."],
      undefined,
      "danger",
    ), referenciasProcesales: [{
      id: sexual ? "lecrim-105-2" : "lecrim-105-1",
      aplicacionAlCaso: sexual
        ? "La persona agraviada no desea denunciar o la vía de procedibilidad permanece pendiente. Esta circunstancia no impide practicar las diligencias a prevención."
        : "La víctima ha manifestado que no desea denunciar, pero el hecho se encuentra en un ámbito perseguible de oficio.",
      conclusion: sexual
        ? "Deben mantenerse la protección, la asistencia, la preservación de indicios y las diligencias urgentes mientras se coordina la vía de procedibilidad."
        : "La actuación debe continuar de oficio, dejando constancia de la manifestación de la víctima.",
    }] });
  };

  if (conceptId === "violencia_relacional") {
    if (relation === "pendiente") return pending("Completa los hechos mínimos sobre pareja o expareja, relación familiar o convivencia antes de orientar los hechos.");
    const relationFacts = facts.hechosRelacion ?? [];
    results.push(incidentResult(relation === "vg" ? "ÁMBITO DE VIOLENCIA DE GÉNERO" : relation === "domestica" ? "ÁMBITO DE VIOLENCIA DOMÉSTICA" : "SIN RELACIÓN PROTEGIDA", relation === "vg" ? "LO 1/2004 · art. 1" : "Código Penal · art. 173.2", relation === "vg" ? "Hombre frente a esposa, exesposa o mujer ligada o anteriormente ligada por relación análoga de afectividad, aun sin convivencia." : relation === "domestica" ? "Persona incluida en el círculo familiar o de convivencia del art. 173.2. Una mera convivencia de piso no basta." : "Derivar cada hecho a los bloques generales correspondientes.", relation === "vg" ? ["Coordinar continuación y valoración de riesgo mediante CNP / Sistema VioGén conforme al protocolo operativo aplicable."] : basicIncidentAction, undefined, relation === "ninguna" ? "neutral" : "warning"));
    for (const fact of relationFacts) {
      const target = fact === "agresion" ? "agresiones_lesiones" : fact === "sexual" ? "agresiones_sexuales" : "amenazas_coacciones";
      if (["amenazas", "coacciones", "acoso", "sexual"].includes(fact)) {
        const child = resolvePublicSafetyOutcome(target, { ...facts, ...(fact === "sexual" ? {} : { conductaLibertad: fact === "amenazas" ? "amenaza" : fact === "coacciones" ? "coaccion" : "acoso" }) }, input);
        results.push(...child.resultados.filter((result) => result.supuestoPenalId));
        if (!child.resultados.some((result) => result.supuestoPenalId)) results.push(incidentResult("CONCRETAR EL HECHO " + fact.toLocaleUpperCase("es"), "Datos de la intervención", "Describir la conducta concreta, sus circunstancias y los indicios disponibles.", basicIncidentAction));
      } else if (fact === "agresion" && protectedRelation) {
        // Es una orientación inicial a golpe/maltrato. El resultado asistencial se
        // completa en Lesiones para evitar mantener 153 si concurre 147.1/149/150.
        if (facts.resultadoAsistencial === "tratamiento_posterior" || facts.resultadoEspecialGravedad || facts.signosLesion && !["sin_signos", "no_determinado"].includes(facts.signosLesion)) {
          const child = resolvePublicSafetyOutcome("agresiones_lesiones", { ...facts, agresionFisica: true, lesion: true }, input);
          results.push(...child.resultados);
        } else results.push(penalIncident(conAgravacionRelacional(relation === "vg" || facts.personaEspecialmenteVulnerableConvive ? "153.1" : "153.2", facts), "POSIBLE MALTRATO EN RELACIÓN PROTEGIDA", "Código Penal · art. " + (relation === "vg" || facts.personaEspecialmenteVulnerableConvive ? "153.1" : "153.2"), "El golpe o maltrato, aun sin lesión, tiene trascendencia penal; concretar el resultado asistencial.", basicIncidentAction, "warning"));
      } else if (fact === "quebrantamiento") {
        if (facts.medidaVigenteConocida !== true || facts.incumplimientoMedida !== true || (!facts.dispositivoControlManipulado && (facts.medidaRelacion1732 === undefined || (facts.medidaRelacion1732 === false && facts.privadoLibertad === undefined)))) results.push(incidentResult("QUEBRANTAMIENTO PENDIENTE DE CONCRETAR", "Código Penal · art. 468", "Comprobar contenido, vigencia, conocimiento e incumplimiento concreto de la pena o medida.", ["Proteger y separar.", "Recabar resolución y documentar notificación e incumplimiento."], undefined, "warning"));
        else {
          const id = facts.dispositivoControlManipulado ? "468.3" : facts.medidaRelacion1732 ? "468.2" : facts.privadoLibertad ? "468.1.libertad" : "468.1.otros";
          results.push(penalIncident(id, "POSIBLE QUEBRANTAMIENTO", "Código Penal · art. " + (id === "468.3" ? "468.3" : id === "468.2" ? "468.2" : "468.1"), "Constan medida vigente conocida e incumplimiento concreto. El consentimiento de la víctima no deja sin efecto una resolución judicial.", basicIncidentAction, "warning"));
        }
      } else if (fact === "vejaciones" && protectedRelation) {
        if (facts.vejacionInjuriaLeve) results.push(penalIncident("173.4", "POSIBLE INJURIA O VEJACIÓN LEVE", "Código Penal · art. 173.4", "La injuria o vejación leve en relación protegida requiere denuncia de la persona agraviada o representante; no se aplica la excepción de amenazas/coacciones domésticas.", basicIncidentAction));
        else results.push(incidentResult("CONCRETAR VEJACIÓN O INJURIA", "Código Penal · art. 173.4", "Recoger expresiones, conducta, destinatario y contexto; no atribuir automáticamente una vejación leve.", basicIncidentAction));
      }
      if (fact !== "quebrantamiento" && fact !== "vejaciones") addConnection(connections, { conceptId: target, etiqueta: fact === "agresion" ? "Agresiones y lesiones" : fact === "sexual" ? "Agresiones sexuales" : "Amenazas, coacciones y acoso", motivo: "Completar la conducta conservando el contexto relacional." });
    }
    if (facts.episodiosPrevios && protectedRelation) {
      if (facts.habitualidadDocumentada) results.push(penalIncident(conAgravacionRelacional("173.2", facts), "POSIBLE VIOLENCIA HABITUAL", "Código Penal · art. 173.2", "Se documentan actos y proximidad temporal conforme al art. 173.3; se analizan además los episodios concretos.", ["Documentar actos, fechas, víctimas e indicios.", "Mantener el análisis de cada hecho concreto."], "warning"));
      else results.push(incidentResult("VALORAR ADEMÁS POSIBLE VIOLENCIA HABITUAL", "Código Penal · art. 173.2", "La referencia a episodios anteriores no permite presumir habitualidad. Recabar actos acreditados, número y proximidad temporal.", basicIncidentAction, undefined, "warning"));
    }
    if (results.some((result) => result.supuestoPenalId)) addComplaintNotice(relationFacts.includes("sexual"));
    return withIncidentProcessual({ resultados: results, conexiones: connections, contextoRelacional }, { ...input, denunciaOQuerella: facts.denunciaOQuerella ?? input.denunciaOQuerella });
  }

  if (conceptId === "agresiones_lesiones") {
    if (facts.agresionFisica === undefined) return pending("Indica si ha existido golpe o agresión física.");
    if (!facts.agresionFisica) return { resultados: [incidentResult("SIN AGRESIÓN FÍSICA REFERIDA", "Datos de la intervención", "Valora el bloque que corresponda si existen amenazas, coacciones u otro hecho.", basicIncidentAction, undefined, "neutral")], conexiones: [] };
    if (facts.lesion === undefined) return pending("Indica si existe o se refiere alguna lesión.");
    if ((facts.lesion === false || facts.resultadoAsistencial === "primera_asistencia") && relation === "pendiente" && (!facts.signosLesion || ["sin_signos", "no_determinado"].includes(facts.signosLesion)) && !facts.resultadoEspecialGravedad) return pending("Completa el contexto relacional porque puede cambiar la clasificación de la agresión.");
    if (facts.lesion === true && (facts.signosLesion && !["sin_signos", "no_determinado"].includes(facts.signosLesion) || facts.resultadoEspecialGravedad)) {
      // Solo una pérdida corporal visible permite acotar aquí 149/150: una pérdida
      // aparente de función o un riesgo vital no acreditan por sí solos secuelas.
      const perdidaVisible = facts.signosLesion === "perdida_traumatica";
      const alternativas: SupuestoPenalId[] = perdidaVisible ? ["149.1", "150"] : facts.resultadoAsistencial === "tratamiento_posterior" ? ["147.1", "148.1", "149.1", "150"] : [];
      results.push({ ...penalIncident("149-150.pendiente", "POSIBLE LESIÓN DE ESPECIAL GRAVEDAD", "Arts. 149–150 CP", "Consta agresión física y lesión con signos de alarma. Con los hechos disponibles puede apreciarse una posible lesión de especial gravedad.", ["Priorizar asistencia sanitaria urgente y protección de la víctima.", "Documentar signos visibles, manifestaciones y mecanismo de la agresión; preservar indicios, testigos y cámaras.", "Identificar al presunto autor y coordinar las diligencias con CNP."], "danger", alternativas),
        incertidumbre: "La determinación definitiva del subtipo dependerá de la valoración médica/forense y judicial posterior." + (perdidaVisible ? " La pérdida traumática visible permite una orientación común a los arts. 149–150, sin decidir cuál corresponde." : " La función aparentemente perdida, la deformidad inicial o el riesgo vital no acreditan por sí solos una secuela permanente; pueden seguir siendo aplicables otras modalidades de lesiones."),
      });
    } else if (!facts.lesion || facts.resultadoAsistencial === "primera_asistencia") {
      const id = protectedRelation ? relation === "vg" || facts.personaEspecialmenteVulnerableConvive ? "153.1" : "153.2" : facts.lesion ? "147.2" : "147.3";
      results.push(penalIncident(conAgravacionRelacional(id, facts), protectedRelation ? "POSIBLE DELITO EN RELACIÓN PROTEGIDA" : facts.lesion ? "POSIBLE LESIÓN" : "MALTRATO DE OBRA SIN LESIÓN", "Código Penal · art. " + id, protectedRelation ? "El golpe, maltrato o lesión de menor entidad tiene trascendencia penal de oficio en esta relación." : "En régimen general requiere denuncia de la persona agraviada o representante. La asistencia hospitalaria por sí sola no determina el art. 147.1.", basicIncidentAction, protectedRelation ? "warning" : undefined));
    } else if (facts.resultadoAsistencial === "tratamiento_posterior") {
      const agravado: SupuestoPenalId | undefined = facts.medioPeligroso && facts.peligroConcretoLesion === true ? "148.1" : facts.ensanamientoAlevosiaDocumentado ? "148.2" : facts.victimaMenorCatorce || facts.discapacidadEspecialProteccion ? "148.3" : relation === "vg" ? "148.4" : facts.personaEspecialmenteVulnerableConvive ? "148.5" : undefined;
      results.push(penalIncident(agravado ?? "147.1", agravado ? "POSIBLE LESIÓN AGRAVADA" : "POSIBLE LESIÓN", "Código Penal · art. " + (agravado ?? "147.1"), agravado ? "Existe lesión con tratamiento y una circunstancia específica documentada del art. 148. El art. 148 permite valorar el resultado o riesgo producido; no se activa por mera presencia del objeto." : "Existe necesidad objetiva de tratamiento médico o quirúrgico posterior. Sus penas alternativas se clasifican conforme a los arts. 13 y 33 CP.", ["Recabar asistencia o parte médico y circunstancias completas de la agresión.", "Documentar mecanismo, zona afectada y evolución conocida."]));
      if (facts.medioPeligroso && !agravado) results.push(incidentResult("COMPROBAR PELIGRO CONCRETO DEL MEDIO", "Código Penal · art. 148.1", "El uso de un objeto no activa automáticamente el art. 148.1: documentar el peligro concreto para vida o salud y el resultado.", basicIncidentAction, undefined, "warning"));
    } else results.push(incidentResult("CLASIFICACIÓN PROVISIONAL", "Resultado médico pendiente", "No es posible distinguir todavía entre art. 147.1 y 147.2. Recabar asistencia o parte médico y circunstancias completas de la agresión.", basicIncidentAction, undefined, "warning"));
    if (facts.indiciosFinalidadMatar) results.push(incidentResult("⚠️ NO VALORAR ÚNICAMENTE COMO LESIONES", "Posible tentativa de homicidio/asesinato", "Los hechos pueden ser compatibles con tentativa de homicidio/asesinato. Recoger especialmente medio empleado, zona atacada, número e intensidad de acciones, expresiones y forma de finalización; subtipo pendiente de investigación.", basicIncidentAction, undefined, "danger"));
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "El medio empleado se conserva como dato de la intervención." });
    if (facts.contextoSexual) addConnection(connections, { conceptId: "agresiones_sexuales", etiqueta: "Agresiones sexuales", motivo: "La lesión puede coexistir con el hecho sexual." });
    addConnection(connections, relationLink);
    if (results.some((result) => result.procedibilidadPenal === "oficio")) addComplaintNotice(false);
    return withIncidentProcessual({ resultados: results, conexiones: connections, contextoRelacional }, { ...input, denunciaOQuerella: facts.denunciaOQuerella ?? input.denunciaOQuerella });
  }

  if (conceptId === "agresiones_sexuales") {
    const sexualScopeResult = incidentResult(
      contextoRelacional.isViogenLO12004 ? "ÁMBITO: VIOLENCIA DE GÉNERO LO 1/2004" : "ÁMBITO: VIOLENCIA SEXUAL",
      contextoRelacional.isViogenLO12004 ? "LO 1/2004 · art. 1" : "Código Penal · Título VIII",
      contextoRelacional.isViogenLO12004 ? "La relación de pareja o expareja se deduce de los hechos; la convivencia no es necesaria." : "La violencia sexual puede existir cualquiera que sea la relación entre autor y víctima.",
      contextoRelacional.isViogenLO12004 ? ["Activar protección y valoración de riesgo mediante VioGén 2 / Protocolo 2025; esta valoración no decide por sí sola la detención."] : [],
      undefined,
      contextoRelacional.isViogenLO12004 ? "warning" : "neutral",
    );
    const sexualPending = (text: string): PublicSafetyOutcome => {
      const pendingOutcome = pending(text);
      return { ...pendingOutcome, resultados: [sexualScopeResult, ...pendingOutcome.resultados], contextoRelacional };
    };
    if (facts.actoSexualNoConsentido === undefined) return sexualPending("Indica si se refiere un acto de contenido sexual no consentido.");
    if (!facts.actoSexualNoConsentido) return { resultados: [incidentResult("SIN ACTO SEXUAL NO CONSENTIDO REFERIDO", "Datos de la intervención", "Valora otros bloques si existen lesiones, amenazas o coacciones.", basicIncidentAction, undefined, "neutral")], conexiones: [], contextoRelacional };
    if (facts.menorDieciseis === undefined) return sexualPending("Indica si la víctima es menor de 16 años antes de seleccionar la rama penal.");
    if (facts.menorDieciseis && facts.conductaSexual === undefined) return sexualPending("Distingue acto sexual físico, hacer presenciar actos sexuales o contacto mediante TIC.");
    const selectedConduct = facts.conductaSexual ?? "acto_fisico";
    if (selectedConduct === "acto_fisico" && facts.penetracion === undefined) return sexualPending("Indica los hechos sobre acceso carnal o introducción antes de distinguir los arts. 178, 179 o 181.4.");
    if (selectedConduct === "acto_fisico" && (facts.violenciaIntimidacion === undefined || facts.voluntadAnulada === undefined)) return sexualPending("Completa los hechos sobre violencia, intimidación y voluntad anulada antes de cerrar la modalidad típica.");
    const sexualActions = ["Proteger y separar víctima y presunto autor.", "Obtener únicamente el relato inicial mínimo necesario; evitar repeticiones innecesarias.", "Priorizar asistencia sanitaria/forense cuando proceda; el tiempo transcurrido no excluye automáticamente la valoración.", "Preservar indicios y cadena de custodia conforme al protocolo aplicable.", "Identificar o localizar al presunto autor y posibles testigos, cámaras, mensajes u otros indicios.", "Coordinar con CNP, unidad especializada, servicios sanitarios/forenses y Ministerio Fiscal cuando corresponda."];
    const coercive = facts.violenciaIntimidacion || facts.voluntadAnulada || facts.estadoConsentimiento === "violencia_intimidacion" || facts.estadoConsentimiento === "voluntad_anulada";
    const modalidadMenor1782 = coercive || facts.abusoSuperioridad === "si";
    const conduct = selectedConduct;
    const aggravations: string[] = [];
    if (facts.variasPersonas) aggravations.push("actuación conjunta de dos o más personas");
    if (facts.violenciaExtremaDegradante) aggravations.push("violencia extrema o actos degradantes/vejatorios");
    if (facts.vulnerabilidadEspecial) aggravations.push("especial vulnerabilidad");
    if (facts.menorDieciseis ? contextoRelacional.isPartnerOrExPartner : contextoRelacional.isViogenLO12004) aggravations.push("pareja o expareja");
    if (facts.prevalimientoRelacion === true && !(facts.menorDieciseis && !coercive && facts.abusoSuperioridad === "si")) aggravations.push("prevalimiento de convivencia, parentesco o superioridad");
    if (facts.medioPeligroso) aggravations.push("armas u otros medios peligrosos");
    if (facts.sustanciasAdministradas && facts.voluntadAnulada) aggravations.push("sustancias administradas para anular la voluntad");

    results.push(sexualScopeResult);
    if (contextoRelacional.femaleSexualOffenceVSMJurisdiction) results.push(incidentResult("COMPETENCIA JUDICIAL DIFERENCIADA", "LO 1/2025 · competencia de la Sección de Violencia sobre la Mujer", "Víctima mujer en delito del Título VIII: conservar esta capa separada de VioGén LO 1/2004.", [], undefined, "neutral"));

    if (conduct === "hacer_presenciar") {
      if (facts.actosPresenciadosDelictivos === undefined) return sexualPending("Recoger el relato sobre los actos presenciados y si la persona afectada refiere fuerza, amenazas o que fueron contra su voluntad.");
      results.push(penalIncident(facts.actosPresenciadosDelictivos ? "182.2" : "182.1", "HACER PRESENCIAR ACTOS SEXUALES A MENOR DE 16", "Código Penal · art. 182", "Rama diferenciada de una agresión sexual física consumada; conservar finalidad sexual y actos que se hicieron presenciar.", sexualActions, "warning"));
    } else if (conduct === "contacto_tic") {
      if (facts.propuestaEncuentroYAcercamiento !== true && facts.embaucarMaterialPornografico !== true) return sexualPending("El mero contacto por TIC no basta: concretar propuesta de encuentro y actos de acercamiento, o actos para embaucar y obtener material pornográfico.");
      results.push(penalIncident(facts.propuestaEncuentroYAcercamiento ? "183.1" : "183.2", "CONTACTO SEXUAL MEDIANTE TIC CON MENOR DE 16", "Código Penal · art. 183", "Rama diferenciada de una agresión sexual física consumada. Conservar los mensajes y actos materiales del subtipo.", sexualActions, "warning"));
    } else if (facts.menorDieciseis && facts.posibleExcepcion183Bis && !modalidadMenor1782) {
      results.push(penalIncident("183bis.pendiente", "REQUIERE VALORACIÓN JURÍDICA ESPECÍFICA", "Código Penal · art. 183 bis", "No existe una diferencia numérica automática de edad. Deben valorarse proximidad de edad, desarrollo, madurez física y psicológica y consentimiento libre; la excepción no opera con circunstancias del art. 178.2.", sexualActions, "danger"));
    } else if (facts.menorDieciseis) {
      const minorId: SupuestoPenalId = facts.penetracion ? modalidadMenor1782 ? "181.4.coerciva" : "181.4.base" : modalidadMenor1782 ? "181.2" : "181.1";
      const minorNorm = facts.penetracion ? "Código Penal · art. 181.4" : modalidadMenor1782 ? "Código Penal · art. 181.2" : "Código Penal · art. 181.1";
      results.push(penalIncident(minorId, facts.penetracion ? "AGRESIÓN SEXUAL A MENOR DE 16 CON PENETRACIÓN" : "AGRESIÓN SEXUAL A MENOR DE 16", minorNorm, modalidadMenor1782 ? "Concurren modalidades de violencia, intimidación, voluntad anulada o abuso de superioridad; se aplica la rama específica de menor." : "Se aplica la rama específica del art. 181, no el flujo adulto 178/179.", sexualActions, "danger"));
      const minorAggravations = [...aggravations, ...(facts.organizacionCriminal ? ["organización o grupo criminal"] : [])];
      if (minorAggravations.length) results.push(penalIncident(`${minorId}.${minorAggravations.length > 1 ? "1816" : "1815"}` as SupuestoPenalId, "AGRAVACIONES ESPECÍFICAS DEL MENOR", "Código Penal · art. 181.5", minorAggravations.join("; ") + ". Se aplica la mitad superior sobre el marco específico del menor; no se duplican circunstancias ya valoradas.", [], "warning"));
    } else {
      const baseNorm = facts.penetracion ? (coercive ? "179.2" : "179.1") : (coercive ? "178.3" : "178.1");
      const aggravated = aggravations.length > 0;
      const sexualId = aggravated ? `180.${baseNorm.replace(".", "")}${aggravations.length > 1 ? ".multiple" : ""}` as SupuestoPenalId : baseNorm as SupuestoPenalId;
      results.push(penalIncident(sexualId, facts.penetracion ? "POSIBLE VIOLACIÓN" : "POSIBLE AGRESIÓN SEXUAL", `Código Penal · art. ${baseNorm}`, facts.penetracion ? "Consta acceso carnal o introducción típica en los términos aportados." : "Consta un acto contra la libertad sexual sin consentimiento; no se exige resistencia física.", sexualActions, "warning"));
      if (aggravated) results.push(penalIncident(sexualId, "AGRAVACIÓN SEXUAL", contextoRelacional.isViogenLO12004 ? "Código Penal · arts. 180.1 y 180.1.4" : "Código Penal · art. 180.1", `${aggravations.join("; ")}. ${aggravations.length > 1 ? "Concurren varias agravaciones; conservar cada hecho para el resultado jurídico." : "La circunstancia se conserva para la calificación."}`, [], "danger"));
    }
    if (facts.posibleSumisionQuimica) results.push(incidentResult("POSIBLE SUMISIÓN O VULNERABILIDAD QUÍMICA", "Atención sanitaria/forense urgente", "Posible sumisión o vulnerabilidad química. Atención sanitaria/forense urgente y comunicar expresamente la sospecha.", ["Comunicar pérdida de memoria, somnolencia, desorientación, pérdida de conciencia o sospecha de sustancias.", "Priorizar asistencia sanitaria y forense."], undefined, "danger"));
    if (facts.lesion) addConnection(connections, { conceptId: "agresiones_lesiones", etiqueta: "Lesiones", motivo: "Existen lesiones que deben valorarse en su bloque." });
    if (facts.amenazasAutonomas) addConnection(connections, { conceptId: "amenazas_coacciones", etiqueta: "Amenazas y coacciones", motivo: "Solo se analizan por separado si los hechos son autónomos respecto de la intimidación del delito sexual." });
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "El medio empleado es información complementaria." });
    addConnection(connections, relationLink);
    const procedurePending = !["denuncia_victima", "denuncia_representante", "ministerio_fiscal"].includes(facts.procedibilidadSexual ?? "");
    const procedibilidad = procedurePending
      ? { estado: "PENDIENTE / COORDINAR" as const, fundamento: "Art. 191 CP: falta por ahora denuncia de la persona agraviada o representante, o querella/actuación del Ministerio Fiscal. Esto no elimina el delito ni paraliza protección, asistencia o diligencias urgentes." }
      : { estado: "CUMPLIDA" as const, fundamento: "Art. 191 CP: consta la vía de procedibilidad indicada. La denuncia puede ser oral y documentarse conforme al procedimiento legal." };
    addComplaintNotice(true);
    const outcome = withIncidentProcessual({ resultados: results, conexiones: connections, contextoRelacional, procedibilidad }, { ...input, denunciaOQuerella: !procedurePending, autorMayorEdad: facts.autorMayorEdad ?? input.autorMayorEdad });
    return outcome;
  }

  if (conceptId === "peleas_rinas") {
    if (!facts.tipoRina) return pending("Indica cómo se desarrolla el enfrentamiento físico.");
    const riñaTumultuaria = facts.tipoRina === "grupal_confusa" && facts.medioPeligroso;
    results.push(riñaTumultuaria
      ? penalIncident("154", "POSIBLE RIÑA TUMULTUARIA", "Código Penal · art. 154", "Existe enfrentamiento recíproco y confuso entre varias personas y utilización de medios o instrumentos peligrosos.", ["Separar y hacer cesar la agresión.", "Identificar participantes, víctimas y testigos.", "Asegurar armas u objetos peligrosos.", "Individualizar conductas siempre que sea posible."], "warning")
      : incidentResult("INDIVIDUALIZAR CONDUCTAS", "Actuación operativa", "No clasificar automáticamente como art. 154. Una pelea a puñetazos entre varias personas no basta por sí sola.", ["Separar y hacer cesar la agresión.", "Identificar participantes, víctimas y testigos.", "Individualizar agresiones y lesiones siempre que sea posible."], undefined, "neutral"));
    if (facts.lesion) addConnection(connections, { conceptId: "agresiones_lesiones", etiqueta: "Lesiones", motivo: facts.lesionIndividualizable ? "Puede identificarse quién causó una lesión concreta." : "Hay personas lesionadas que deben valorarse." });
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "Asegurar el medio empleado y describirlo." });
    if (facts.victimaAgente) addConnection(connections, { conceptId: "atentado", etiqueta: "Hechos contra los agentes", motivo: "La víctima puede ser agente; revisar el bloque específico." });
    addConnection(connections, relationLink);
    return withIncidentProcessual({ resultados: results, conexiones: connections }, input);
  }

  if (conceptId === "amenazas_coacciones") {
    if (!facts.conductaLibertad) return pending("Indica qué está haciendo la persona.");
    let id: SupuestoPenalId | undefined;
    if (facts.conductaLibertad === "acoso") {
      if (!facts.conductaAcoso || facts.acosoReiterado !== true || facts.alteracionVidaCotidiana !== true) return pending("Concretar vigilancia, persecución, contactos, uso de datos o ataques a libertad/patrimonio; insistencia y reiteración sin autorización y alteración del normal desarrollo de la vida cotidiana.");
      if (relation === "pendiente") return pending("Completa la relación antes de seleccionar el subtipo de acoso.");
      id = protectedRelation ? "172ter.2" : facts.vulnerabilidadEspecial ? "172ter.1.vulnerable" : "172ter.1";
    } else if (facts.conductaLibertad === "amenaza") {
      if (facts.malAnunciado === "entidad_delictiva") id = threatId({ condicionAmenaza: facts.condicionImpuesta, propositoConseguido: facts.propositoConseguido });
      else if (facts.malAnunciado === "menor_entidad") {
        if (relation === "pendiente") return pending("Completa el contexto relacional porque puede cambiar el régimen de la amenaza de menor entidad.");
        id = relation === "vg" || facts.personaEspecialmenteVulnerableConvive ? "171.4" : protectedRelation ? facts.medioPeligroso === true ? "171.5" : facts.medioPeligroso === false ? "171.7.domestica" : undefined : "171.7.general";
        if (!id) return pending("Indica si la amenaza doméstica leve se realizó con arma u otro instrumento peligroso: puede cambiar entre 171.5 y 171.7.");
      } else if (facts.malAnunciado === "no_delictivo" && facts.condicionImpuesta === true && facts.condicionConductaDebida === false) {
        if (facts.propositoConseguido === undefined) return pending("Comprobar si se consiguió el propósito de la condición antes de seleccionar el marco del art. 171.1.");
        id = facts.propositoConseguido ? "171.1.logrado" : "171.1";
      }
      else return pending("Recoger literalmente el mal anunciado, la condición y el contexto.");
    } else if (facts.coaccionEntidad === "general") id = "172.1";
    else if (facts.coaccionEntidad === "leve") {
      if (relation === "pendiente") return pending("Completa el contexto relacional porque puede cambiar el régimen de la coacción de menor entidad.");
      id = relation === "vg" || facts.personaEspecialmenteVulnerableConvive ? "172.2" : protectedRelation ? "172.3.domestica" : "172.3.general";
    } else return pending("Documentar la acción que obliga o impide actuar, los medios y su entidad.");
    id = conAgravacionRelacional(id, facts);
    const supuesto = seleccionarSupuestoPenal(id);
    const article = id.startsWith("172ter") ? "172 ter" : id.startsWith("169") ? "169" : id.startsWith("171.7") ? "171.7" : id.startsWith("172.3") ? "172.3" : id.match(/^\d+(?:\.\d+)?/)?.[0] ?? supuesto.articulo;
    results.push(penalIncident(id, "POSIBLE " + (facts.conductaLibertad === "acoso" ? "ACOSO REITERADO" : facts.conductaLibertad === "amenaza" ? "DELITO DE AMENAZAS" : "COACCIÓN"), "Código Penal · art. " + article, supuesto.descripcion + (supuesto.procedibilidad === "oficio" ? " No se exige denuncia de la víctima para continuar." : " Requiere denuncia de la persona agraviada o representante."), ["Recoger literalmente expresiones, conductas, fechas y contexto.", "Conservar mensajes, audios, llamadas, testigos y demás indicios."], protectedRelation ? "warning" : undefined, id === "169.pendiente" ? threatAlternatives : []));
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "Se exhibe o utiliza como medio de intimidación." });
    addConnection(connections, relationLink);
    if (supuesto.procedibilidad === "oficio") addComplaintNotice(false);
    return withIncidentProcessual({ resultados: results, conexiones: connections, contextoRelacional }, { ...input, denunciaOQuerella: facts.denunciaOQuerella ?? input.denunciaOQuerella });
  }

  return pending("No hay una orientación dinámica definida para esta situación.");
}

export type WeaponObjectInput = {
  tipo: "navaja" | "hoja" | "cuchillo" | "machete" | "objeto";
  mecanismo?: "automatico" | "no_automatico" | "dudoso";
  automaticaConfirmada?: boolean;
  longitudNavaja?: "supera_11" | "no_supera_11" | "dudosa";
  hojaMenorOnce?: boolean;
  dosFilos?: boolean;
  puntiaguda?: boolean;
  armamento?: "aprobado" | "imitacion" | "no" | "dudoso";
  supuestoEspecifico?: boolean;
  circunstanciaTenencia?: "contemplacion" | "reparacion" | "transmision";
};
export type WeaponConduct = "porte" | "manipula" | "exhibe" | "intimidatoria" | "amenaza" | "intenta" | "usa";
export type WeaponContextInput = {
  disponibilidad?: "encima" | "efectos" | "accesible" | "vehiculo" | "sin_disponente";
  comportamiento: WeaponConduct;
  contexto?: "sin_incidente" | "altercado" | "violento" | "amenazas" | "otro_delito" | "otras";
  motivo?: "trabajo" | "actividad" | "trayecto" | "otro" | "ninguno" | "dudoso";
  transporte?: "funda" | "equipamiento" | "mochila" | "bolsillo" | "accesible" | "otro";
  lugar?: "trabajo" | "actividad" | "trayecto" | "via_publica" | "establecimiento" | "ocio" | "reunion" | "otro";
  momento?: "coherente" | "madrugada" | "otro" | "dudoso";
  consumo?: "si" | "no" | "dudoso";
  accesoRestringido?: "si" | "no" | "dudoso";
  motivoSeguridadFinalizado?: "si" | "no" | "dudoso";
} & ProcessualInput;
export type WeaponOutcome = PenalSelection & {
  kind: "sin_conclusion_automatica" | "porte_coherente" | "valoracion_porte" | "ocupacion_preventiva" | "valoracion_especifica" | "administrativa" | "posible_penal" | "derivacion_penal" | "penal";
  titulo: string;
  norma: string;
  clasificacion?: string;
  rango?: string;
  situacion?: ProcessualDecision["situacion"] | "DILIGENCIAS DE PREVENCIÓN";
  detencion?: ProcessualDecision["detencion"];
  fundamentoDetencion?: string;
  escenarioProcesal?: ProcessualDecision["escenarioProcesal"];
  porQue: string;
  frontera: string;
  actuacion: string[];
  hechosRelevantes?: string[];
  derivaOtroDelito?: boolean;
  clasificacionObjeto: string;
  conducta: string;
  salidaSubsidiaria?: string;
  dependenciaFutura?: string;
};

export function resolveWeaponOutcome(object: WeaponObjectInput, context: WeaponContextInput): WeaponOutcome {
  const punal = object.tipo === "hoja" && object.hojaMenorOnce === true && object.dosFilos === true && object.puntiaguda === true;
  const mecanismo = object.tipo === "navaja"
    ? object.mecanismo ?? (object.automaticaConfirmada === true ? "automatico" : "dudoso")
    : undefined;
  const automatica = mecanismo === "automatico";
  const prohibited = punal || automatica;
  const manualOverEleven = object.tipo === "navaja" && mecanismo === "no_automatico" && object.longitudNavaja === "supera_11";
  const approvedArmament = ["cuchillo", "machete"].includes(object.tipo) && object.armamento === "aprobado";
  const imitationArmament = ["cuchillo", "machete"].includes(object.tipo) && object.armamento === "imitacion";
  const clasificacionObjeto = punal
    ? "PUÑAL — ARMA PROHIBIDA"
    : automatica
      ? "NAVAJA AUTOMÁTICA — ARMA PROHIBIDA"
      : manualOverEleven
        ? "NAVAJA NO AUTOMÁTICA >11 CM — RÉGIMEN DEL ART. 5.3"
        : object.tipo === "navaja" && mecanismo === "no_automatico" && object.longitudNavaja === "no_supera_11"
          ? "NAVAJA NO AUTOMÁTICA ≤11 CM — VALORAR PORTE"
          : object.tipo === "navaja" && mecanismo === "no_automatico"
            ? "NAVAJA NO AUTOMÁTICA — LONGITUD NO DETERMINADA"
            : object.tipo === "navaja"
              ? "MECANISMO NO DETERMINADO — CLASIFICACIÓN ABIERTA"
              : approvedArmament
                ? "ARMA BLANCA INTEGRANTE DE ARMAMENTO APROBADO — RÉGIMEN ESPECÍFICO ART. 5.3"
                : imitationArmament
                  ? "IMITACIÓN DE CUCHILLO O MACHETE MILITAR — CATEGORÍA 5.ª.2"
                  : object.tipo === "cuchillo"
                    ? "CUCHILLO ORDINARIO — ARMA BLANCA REGLAMENTADA"
                    : object.tipo === "machete"
                      ? object.armamento === "dudoso" ? "MACHETE — CLASIFICACIÓN NO SEGURA" : "MACHETE ORDINARIO — NO CLASIFICADO AUTOMÁTICAMENTE COMO MILITAR"
                      : object.tipo === "hoja"
                        ? "NO SE CLASIFICA COMO PUÑAL EN ESTA RAMA"
                        : "OBJETO NO CLASIFICADO REGLAMENTARIAMENTE COMO ARMA";
  const observed = inferredWeaponContext(context);
  const facts = [...weaponFacts(observed), ...carryFacts(context)];
  const conducta = weaponConductLabel(observed.comportamiento);
  const directReferral = ["amenaza", "intenta", "usa"].includes(observed.comportamiento);
  const intimidating = observed.comportamiento === "intimidatoria";
  const relatedExhibition = observed.comportamiento === "exhibe";
  const relevantManipulation = observed.comportamiento === "manipula" && observed.contexto !== "sin_incidente";
  const relatedCrime = observed.contexto === "otro_delito";
  const derivesAnotherOffence = directReferral || intimidating || relatedExhibition || relatedCrime;
  const futureReferral = observed.comportamiento === "usa" || observed.comportamiento === "intenta"
    ? "Derivación preparada: Agresiones / lesiones. Referencia futura: art. 148.1 CP cuando unas lesiones del art. 147.1 se cometan utilizando armas, instrumentos, objetos, medios, métodos o formas concretamente peligrosas para la vida o la salud."
    : derivesAnotherOffence ? "Derivación preparada: análisis del posible delito cometido utilizando el objeto, sin cerrar todavía su calificación." : undefined;

  if (object.supuestoEspecifico && observed.comportamiento === "porte" && object.tipo !== "objeto") return {
    kind: "valoracion_especifica",
    titulo: "SUPUESTO QUE REQUIERE VALORACIÓN ESPECÍFICA",
    norma: prohibited ? "Real Decreto 137/1993 · art. 4.1.f" : "Continuación pendiente de armas blancas no prohibidas",
    clasificacionObjeto,
    conducta,
    porQue: `${clasificacionObjeto}. Se ha indicado ${object.circunstanciaTenencia === "reparacion" ? "reparación" : object.circunstanciaTenencia === "transmision" ? "simple transmisión a otra persona" : "mera contemplación o examen"}.`,
    frontera: "No se aplica una rama automática basada únicamente en la duración de la tenencia.",
    actuacion: ["Conservar los datos objetivos de la situación y coordinar la continuación con CNP."],
  };

  const clear563 = prohibited && (directReferral || intimidating || relatedExhibition || relatedCrime);
  const possible563 = prohibited && !clear563 && (relevantManipulation || observed.contexto === "otras");
  if (clear563) {
    const processual = processForSelection("563", observed);
    return {
      kind: "penal",
      titulo: "INDICIOS DE DELITO DE TENENCIA DE ARMA PROHIBIDA",
      norma: "Código Penal · art. 563",
      ...penalSelection("563"),
      clasificacionObjeto,
      conducta,
      ...processual,
      porQue: `${clasificacionObjeto}. ${facts.join(" ")}`,
      frontera: "La vía del art. 563 exige conjuntamente arma material, prohibición jurídicamente apta para integrar el tipo, especial potencialidad lesiva y circunstancias concretas especialmente peligrosas para la seguridad ciudadana.",
      hechosRelevantes: facts,
      derivaOtroDelito: derivesAnotherOffence,
      dependenciaFutura: futureReferral,
      actuacion: processual.situacion === "DETENIDO" ? ["Intervenir, ocupar y custodiar el arma como efecto o instrumento del delito.", "Presentar a la persona, actuaciones y efectos en CNP."] : ["Intervenir, ocupar y custodiar el arma como efecto o instrumento del delito.", "Informar de hechos y derechos; coordinar continuación y citación con CNP."],
    };
  }
  if (possible563) return {
    kind: "posible_penal",
    titulo: "POSIBLE RELEVANCIA PENAL — ART. 563 CP", ...penalSelection("563.pendiente"),
    norma: "Código Penal · art. 563",
    clasificacionObjeto,
    conducta,
    ...resolverSituacionProcesal(context),
    porQue: `${clasificacionObjeto}. Se han seleccionado circunstancias objetivas que requieren continuación: ${facts.join(" ")}`,
    frontera: "No se presenta una conclusión penal cerrada mientras no pueda apreciarse con seguridad el plus de peligrosidad concreto exigido para el art. 563.",
    hechosRelevantes: facts,
    derivaOtroDelito: derivesAnotherOffence,
    dependenciaFutura: futureReferral,
    actuacion: ["Intervenir, ocupar y custodiar el arma.", "Asegurar los datos objetivos de la disponibilidad, comportamiento y contexto.", "Comunicar o comparecer ante CNP para continuación."],
  };

  if (prohibited) return {
    kind: "administrativa",
    titulo: "VÍA ADMINISTRATIVA",
    norma: "Ley Orgánica 4/2015 · art. 36.10",
    clasificacion: "INFRACCIÓN GRAVE",
    rango: "601–30.000 €",
    clasificacionObjeto,
    conducta,
    porQue: `${clasificacionObjeto}. No se han seleccionado circunstancias que aporten el plus de peligrosidad concreto requerido para abrir el art. 563 CP.`,
    frontera: "Arma prohibida no equivale automáticamente a delito del art. 563 CP. La cuantía concreta corresponde al órgano sancionador competente.",
    hechosRelevantes: facts,
    actuacion: ["Intervenir el arma conforme al art. 18 LO 4/2015.", "Hacer constar la aprehensión en acta conforme al art. 19.2 LO 4/2015.", "Custodiar y tramitar el depósito como referencia del art. 148.2 del Reglamento de Armas.", "Formular denuncia administrativa."],
  };

  if (directReferral) return {
    kind: "derivacion_penal",
    titulo: "POSIBLE DELITO COMETIDO UTILIZANDO EL OBJETO",
    norma: "Continuar el análisis penal correspondiente",
    clasificacionObjeto,
    conducta,
    porQue: "La conducta contra la persona tiene prioridad sobre la clasificación del objeto.",
    frontera: "La clasificación negativa o dudosa del objeto no elimina la conducta violenta ni permite cerrar la actuación sin resultado. Un objeto ordinario utilizado contra una persona no activa automáticamente el art. 563 CP.",
    hechosRelevantes: facts,
    derivaOtroDelito: true,
    dependenciaFutura: futureReferral,
    actuacion: ["Proteger, identificar, asegurar el objeto y los datos inmediatos de la conducta.", "Derivar al análisis penal correspondiente y coordinar la continuación con CNP."],
  };

  if (intimidating || relatedExhibition || relevantManipulation || relatedCrime) {
    const ordinaryObject = object.tipo === "objeto";
    return {
      kind: "posible_penal",
      titulo: "POSIBLE DELITO COMETIDO UTILIZANDO EL OBJETO",
      norma: "Continuar primero el análisis penal correspondiente",
      clasificacionObjeto,
      conducta,
      ...resolverSituacionProcesal(context),
      porQue: "La intimidación, exhibición o relación con otro hecho exige analizar primero la vía penal.",
      frontera: "La vía penal se analiza antes que cualquier salida administrativa subsidiaria. No se aplica automáticamente el art. 563 CP a un objeto ordinario ni a un arma cuya prohibición no esté confirmada.",
      hechosRelevantes: facts,
      derivaOtroDelito: true,
      dependenciaFutura: futureReferral,
      salidaSubsidiaria: ordinaryObject && intimidating
        ? "Si los hechos no alcanzan delito ni infracción grave: LO 4/2015 · art. 37.2, por exhibición de objetos peligrosos para la vida e integridad física con ánimo intimidatorio."
        : !ordinaryObject ? "Si los hechos no constituyen delito, puede continuar el análisis del art. 36.10 LO 4/2015; la necesidad, ocasión, lugar y circunstancias del porte se desarrollarán en una rama posterior." : undefined,
      actuacion: ["Asegurar el objeto y los datos inmediatos de la conducta.", "Derivar al análisis penal correspondiente y coordinar la continuación con CNP."],
    };
  }

  if (manualOverEleven) return {
    kind: "administrativa",
    titulo: "VÍA ADMINISTRATIVA",
    norma: "Reglamento de Armas · art. 5.3 / LO 4/2015 · art. 36.10",
    clasificacion: "INFRACCIÓN GRAVE",
    rango: "601–30.000 €",
    clasificacionObjeto,
    conducta,
    porQue: "Navaja no automática con hoja superior a 11 cm portada fuera del domicilio.",
    frontera: "La longitud no convierte por sí sola el hecho en delito del art. 563 CP. La excepción domiciliaria de ornato o coleccionismo no ampara el porte en vía pública.",
    hechosRelevantes: facts,
    actuacion: ["Aprehender y documentar el arma y sus dimensiones.", "Aplicar la vía administrativa.", "La cuantía concreta corresponde al órgano sancionador competente."],
  };

  const simpleCarry = observed.comportamiento === "porte" && object.tipo !== "objeto";
  const legitimatePurpose = ["trabajo", "actividad", "trayecto"].includes(context.motivo ?? "");
  const protectedTransport = ["funda", "equipamiento"].includes(context.transporte ?? "");
  const coherentPlace = context.lugar === "trayecto"
    || (context.motivo === "trabajo" && context.lugar === "trabajo")
    || (context.motivo === "actividad" && context.lugar === "actividad");
  const coherentMoment = !context.momento || context.momento === "coherente" || context.momento === "dudoso";
  const coherentCarry = simpleCarry && legitimatePurpose && protectedTransport && coherentPlace && coherentMoment && context.consumo !== "si";
  const sensitivePlace = ["establecimiento", "ocio", "reunion"].includes(context.lugar ?? "");
  const exposedTransport = ["bolsillo", "accesible"].includes(context.transporte ?? "");
  const improperCarry = simpleCarry && context.motivo === "ninguno" && exposedTransport && (sensitivePlace || context.lugar === "via_publica");

  if (coherentCarry && context.accesoRestringido === "si") return {
    kind: "ocupacion_preventiva",
    titulo: "OCUPACIÓN TEMPORAL PREVENTIVA",
    norma: "Medida preventiva sin denuncia automática",
    clasificacionObjeto,
    conducta,
    porQue: "El porte está relacionado con una actividad legítima, pero existe una restricción concreta de seguridad en el acceso.",
    frontera: "La ocupación temporal preventiva se diferencia de la aprehensión por infracción. No genera denuncia automática.",
    hechosRelevantes: facts,
    actuacion: ["Ocupar temporalmente mientras subsista el motivo concreto de seguridad.", context.motivoSeguridadFinalizado === "si" ? "Ha cesado el motivo: devolver cuando jurídicamente proceda." : "Documentar el motivo y mantener separada la medida preventiva de una aprehensión sancionadora."],
  };

  if (improperCarry) return {
    kind: "administrativa",
    titulo: "PORTE INDEBIDO — VÍA ADMINISTRATIVA",
    norma: "LO 4/2015 · art. 36.10",
    clasificacion: "INFRACCIÓN GRAVE",
    rango: "601–30.000 €",
    clasificacionObjeto,
    conducta,
    porQue: "Sin motivo concreto, en forma inmediatamente accesible y en un lugar relevante.",
    frontera: "Valoración conjunta del Reglamento de Armas, arts. 146 y 147. El lugar de ocio o reunión no determina por sí solo la infracción.",
    hechosRelevantes: facts,
    actuacion: ["Aprehender y documentar el arma y las circunstancias del porte.", "Formular denuncia administrativa.", "La cuantía concreta corresponde al órgano sancionador competente."],
  };

  if (coherentCarry) return {
    kind: "porte_coherente",
    titulo: "SIN INFRACCIÓN AUTOMÁTICA POR EL MERO PORTE",
    norma: "Porte coherente con actividad legítima",
    clasificacionObjeto,
    conducta,
    porQue: "Objeto, actividad, lugar y transporte presentan una relación objetiva coherente.",
    frontera: "Poder adquirir o tener legalmente el arma no significa poder portarla libremente en cualquier lugar y circunstancia.",
    hechosRelevantes: facts,
    actuacion: ["Documentar brevemente las circunstancias comprobadas.", "No generar denuncia automática por el mero porte."],
  };

  if (simpleCarry) return {
    kind: "valoracion_porte",
    titulo: "VALORAR PORTE Y CIRCUNSTANCIAS",
    norma: "Reglamento de Armas · arts. 146 y 147",
    clasificacionObjeto,
    conducta,
    porQue: "La clasificación o la longitud no deciden por sí solas la licitud del porte.",
    frontera: "Debe existir una relación coherente entre objeto, actividad, lugar, momento y forma de transporte. Si el conjunto determina porte indebido, continúa por el art. 36.10 LO 4/2015.",
    hechosRelevantes: facts,
    actuacion: ["Completar únicamente los hechos relevantes del porte.", "No cerrar la actuación por la sola clasificación del objeto."],
  };

  return {
    kind: "sin_conclusion_automatica",
    titulo: object.tipo === "objeto" ? "SIN INFRACCIÓN AUTOMÁTICA POR EL MERO PORTE" : "CLASIFICACIÓN ABIERTA — CONTINUAR VALORACIÓN",
    norma: "Continuar según la conducta observada",
    clasificacionObjeto,
    conducta,
    porQue: object.tipo === "objeto"
      ? "El mero porte de un objeto ordinario no lo convierte en arma ni genera por sí solo una infracción de armas."
      : "La clasificación no es segura, pero la conducta continúa activa.",
    frontera: object.tipo === "objeto"
      ? "La relevancia puede surgir del uso concreto como medio de amenaza, intimidación o agresión."
      : "No se atribuye automáticamente carácter militar, prohibido ni relevancia del art. 563 por longitud, tamaño o apariencia.",
    hechosRelevantes: facts,
    actuacion: ["Mantener la descripción objetiva del objeto y continuar únicamente si aparecen hechos relevantes para otra rama."],
  };
}

function carryFacts(context: WeaponContextInput): string[] {
  const facts: string[] = [];
  const purposeLabels: Record<NonNullable<WeaponContextInput["motivo"]>, string> = { trabajo: "Motivo: trabajo.", actividad: "Motivo: actividad deportiva, caza o pesca.", trayecto: "Motivo: traslado hacia o desde una actividad relacionada.", otro: "Se manifiesta otro motivo concreto.", ninguno: "No consta motivo concreto.", dudoso: "El motivo no puede determinarse." };
  const transportLabels: Record<NonNullable<WeaponContextInput["transporte"]>, string> = { funda: "Transporte en funda, caja o bolsa adecuada.", equipamiento: "Transporte junto con herramientas o equipamiento relacionado.", mochila: "Transporte en mochila o bolso.", bolsillo: "Porte en bolsillo, cintura o ropa.", accesible: "Objeto inmediatamente accesible.", otro: "Otra forma de transporte." };
  const placeLabels: Record<NonNullable<WeaponContextInput["lugar"]>, string> = { trabajo: "Lugar de trabajo relacionado.", actividad: "Lugar de actividad relacionada.", trayecto: "Trayecto directo hacia o desde la actividad.", via_publica: "Vía pública sin relación aparente con una actividad.", establecimiento: "Establecimiento público.", ocio: "Local o zona de ocio.", reunion: "Lugar de reunión, concentración o recreo.", otro: "Otro lugar." };
  const purpose = context.motivo ? purposeLabels[context.motivo] : undefined;
  const transport = context.transporte ? transportLabels[context.transporte] : undefined;
  const place = context.lugar ? placeLabels[context.lugar] : undefined;
  if (purpose) facts.push(purpose);
  if (transport) facts.push(transport);
  if (place) facts.push(place);
  if (context.momento === "madrugada") facts.push("Se observa en horario de madrugada sin actividad relacionada.");
  if (context.consumo === "si") facts.push("Se observan signos de consumo o influencia.");
  if (context.accesoRestringido === "si") facts.push("Intenta acceder a un espacio con restricción concreta de seguridad.");
  return facts;
}

type InferredWeaponContext = Required<Pick<WeaponContextInput, "disponibilidad" | "comportamiento" | "contexto">> & ProcessualInput;

function inferredWeaponContext(context: WeaponContextInput): InferredWeaponContext {
  const conclusive = ["intimidatoria", "amenaza", "intenta", "usa"].includes(context.comportamiento);
  const contexto = context.comportamiento === "intimidatoria" || context.comportamiento === "amenaza"
    ? "amenazas"
    : context.comportamiento === "intenta" || context.comportamiento === "usa"
      ? "violento"
      : context.comportamiento === "exhibe" && (!context.contexto || context.contexto === "sin_incidente")
        ? "altercado"
        : context.contexto ?? "sin_incidente";
  return { ...context, disponibilidad: conclusive || context.comportamiento === "exhibe" || context.comportamiento === "manipula" ? "accesible" : context.disponibilidad ?? "efectos", contexto };
}

function weaponConductLabel(conduct: WeaponConduct): string {
  return { porte: "SIMPLE PORTE", manipula: "MANIPULACIÓN", exhibe: "EXHIBICIÓN", intimidatoria: "EXHIBICIÓN INTIMIDATORIA", amenaza: "AMENAZA CON EL OBJETO", intenta: "INTENTO DE UTILIZACIÓN CONTRA OTRA PERSONA", usa: "USO EFECTIVO CONTRA OTRA PERSONA" }[conduct];
}

function weaponFacts(context: InferredWeaponContext): string[] {
  const disponibilidad = { encima: "El objeto se lleva encima.", efectos: "El objeto está en una mochila, bolso, caja u otros efectos.", accesible: "El objeto está inmediatamente accesible.", vehiculo: "El objeto se encuentra en un vehículo.", sin_disponente: "No puede determinarse claramente quién dispone del objeto." }[context.disponibilidad];
  const comportamiento = { porte: "La persona simplemente porta el objeto.", manipula: "La persona manipula el objeto.", exhibe: "La persona exhibe el objeto.", intimidatoria: "La persona exhibe el objeto de forma intimidatoria.", amenaza: "La persona amenaza con el objeto.", intenta: "La persona intenta utilizarlo contra otra persona.", usa: "La persona lo utiliza efectivamente contra otra persona." }[context.comportamiento];
  const contexto = { sin_incidente: "No se ha seleccionado otra conducta relacionada.", altercado: "Existe discusión o altercado.", violento: "Existe una situación violenta o interacción contra otra persona.", amenazas: "Existe una conducta de amenaza o intimidación.", otro_delito: "El objeto está relacionado con otro posible delito.", otras: "Existen otras circunstancias relevantes seleccionadas." }[context.contexto];
  return context.comportamiento === "porte" || context.comportamiento === "manipula" ? [disponibilidad, comportamiento, contexto] : [comportamiento, contexto];
}
