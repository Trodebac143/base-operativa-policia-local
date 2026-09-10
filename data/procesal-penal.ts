export type ProcessualInput = {
  flagrante?: boolean;
  plenamenteIdentificado?: boolean;
  localizable?: boolean;
  indiciosHechoSuficientes?: boolean;
  indiciosParticipacionSuficientes?: boolean;
  intentoFugaElusion?: boolean;
  identidadODomicilioNoVerificables?: boolean;
  riesgoOcultacionPruebas?: boolean;
  riesgoConcretoVictimaTestigos?: boolean;
  domicilioConocido?: boolean;
  fianzaBastante?: boolean;
  autorMayorEdad?: boolean;
};

export type ProcessualDecision = {
  situacion: "DETENIDO" | "INVESTIGADO NO DETENIDO" | "NO DETENER TODAVÍA — INVESTIGAR" | "RUTA DE RESPONSABILIDAD PENAL DE MENORES";
  detencion: "SÍ" | "NO" | "NO APLICAR MOTOR ADULTO";
  fundamentoDetencion: string;
  escenarioProcesal: "FLAGRANCIA" | "NO FLAGRANTE" | "DELITO LEVE" | "INDICIOS INSUFICIENTES" | "AUTOR MENOR";
  hechosDeterminantes?: string[];
};

const concreteDetentionFacts = (input: ProcessualInput) => [
  input.intentoFugaElusion && "Intento actual de fuga o elusión de la actuación.",
  input.identidadODomicilioNoVerificables && "Identidad o domicilio no verificables con riesgo objetivo de incomparecencia.",
  input.riesgoOcultacionPruebas && "Riesgo concreto de ocultación, alteración o destrucción de pruebas.",
  input.riesgoConcretoVictimaTestigos && "Riesgo concreto y actual para la víctima o los testigos.",
].filter((item): item is string => Boolean(item));

const flagrancyDecision = (): ProcessualDecision => ({
  situacion: "DETENIDO",
  detencion: "SÍ",
  escenarioProcesal: "FLAGRANCIA",
  fundamentoDetencion: "DELITO NO LEVE + FLAGRANCIA → DETENCIÓN: SÍ. Arts. 490.2 y 492.1 LECrim.",
  hechosDeterminantes: ["Persona sorprendida durante la comisión del hecho o inmediatamente después."],
});

const nonFlagrancyDecision = (input: ProcessualInput): ProcessualDecision => {
  if (input.indiciosHechoSuficientes !== true) return {
    situacion: "NO DETENER TODAVÍA — INVESTIGAR",
    detencion: "NO",
    escenarioProcesal: "INDICIOS INSUFICIENTES",
    fundamentoDetencion: "NO DETENER. No existen actualmente indicios racionales suficientes de un hecho delictivo. Art. 492.4 LECrim.",
    hechosDeterminantes: ["No constan indicios racionales suficientes del hecho delictivo."],
  };
  if (input.indiciosParticipacionSuficientes !== true) return {
    situacion: "NO DETENER TODAVÍA — INVESTIGAR",
    detencion: "NO",
    escenarioProcesal: "INDICIOS INSUFICIENTES",
    fundamentoDetencion: "NO DETENER. No existen actualmente indicios racionales suficientes de participación de esta persona. Art. 492.4 LECrim.",
    hechosDeterminantes: ["Constan indicios del hecho, pero no de participación de esta persona."],
  };
  const concreteFacts = concreteDetentionFacts(input);
  if (concreteFacts.length === 0) return {
    situacion: "INVESTIGADO NO DETENIDO",
    detencion: "NO",
    escenarioProcesal: "NO FLAGRANTE",
    fundamentoDetencion: "Existen indicios suficientes de hecho y participación, pero no consta actualmente un presupuesto concreto que justifique la privación de libertad. Arts. 492.4 y 493 LECrim. Estar identificado o ser localizable no decide por sí solo.",
    hechosDeterminantes: ["Indicios suficientes de hecho y participación.", "No consta riesgo concreto de fuga, incomparecencia, ocultación de pruebas ni riesgo actual para víctima o testigos."],
  };
  return {
    situacion: "DETENIDO",
    detencion: "SÍ",
    escenarioProcesal: "NO FLAGRANTE",
    fundamentoDetencion: "DETENER. Concurren indicios racionales suficientes de hecho y participación y circunstancias concretas que justifican la detención. Art. 492.4 LECrim. La ausencia de flagrancia no impide por sí sola detener.",
    hechosDeterminantes: ["Indicios suficientes de hecho y participación.", ...concreteFacts],
  };
};

export const resolvePenalProcessualDecision = (input: ProcessualInput = {}): ProcessualDecision => {
  if (input.autorMayorEdad === false) return {
    situacion: "RUTA DE RESPONSABILIDAD PENAL DE MENORES",
    detencion: "NO APLICAR MOTOR ADULTO",
    escenarioProcesal: "AUTOR MENOR",
    fundamentoDetencion: "El presunto autor es menor de 18 años: no se aplica directamente el motor adulto de detención de la LECrim. Activar la ruta específica de responsabilidad penal de menores.",
  };
  return input.flagrante === true ? flagrancyDecision() : nonFlagrancyDecision(input);
};

export const resolveMinorOffenceProcessualDecision = (input: ProcessualInput = {}): ProcessualDecision => {
  const exceptionalDetention = input.domicilioConocido === false && input.fianzaBastante === false;
  return exceptionalDetention ? {
    situacion: "DETENIDO",
    detencion: "SÍ",
    escenarioProcesal: "DELITO LEVE",
    fundamentoDetencion: "DETENER EXCEPCIONALMENTE. Delito leve, sin domicilio conocido y sin fianza bastante. Art. 495 LECrim. Documentar ambos presupuestos.",
    hechosDeterminantes: ["No consta domicilio conocido.", "No presta fianza bastante."],
  } : {
    situacion: "INVESTIGADO NO DETENIDO",
    detencion: "NO",
    escenarioProcesal: "DELITO LEVE",
    fundamentoDetencion: "NO DETENER. Delito leve: no concurren conjuntamente la falta de domicilio conocido y la falta de fianza bastante exigidas para la excepción. Art. 495 LECrim.",
    hechosDeterminantes: input.domicilioConocido === true ? ["Domicilio conocido."] : input.fianzaBastante === true ? ["Fianza bastante."] : [],
  };
};

