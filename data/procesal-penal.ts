import type { UsoReferenciaProcesal } from "./referencias-procesales";

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
  referenciasProcesales?: UsoReferenciaProcesal[];
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
  fundamentoDetencion: "FLAGRANCIA → DETENCIÓN: SÍ. Arts. 490.2 y 492.1 LECrim.",
  hechosDeterminantes: ["Persona sorprendida durante la comisión del hecho o inmediatamente después."],
  referenciasProcesales: [
    { id: "lecrim-490-2", aplicacionAlCaso: "Se ha indicado que la persona fue sorprendida durante la comisión del hecho o inmediatamente después; la app valora ese dato como supuesto de flagrancia." },
    { id: "lecrim-492-1", aplicacionAlCaso: "Al haberse apreciado el supuesto de flagrancia del art. 490.2, el motor aplica la regla dirigida a la Autoridad o agente de Policía Judicial del art. 492.1." },
  ],
});

const nonFlagrancyDecision = (input: ProcessualInput): ProcessualDecision => {
  if (input.indiciosHechoSuficientes !== true) return {
    situacion: "NO DETENER TODAVÍA — INVESTIGAR",
    detencion: "NO",
    escenarioProcesal: "INDICIOS INSUFICIENTES",
    fundamentoDetencion: "NO DETENER. No existen actualmente indicios racionales suficientes de un hecho delictivo. Art. 492.4 LECrim.",
    hechosDeterminantes: ["No constan indicios racionales suficientes del hecho delictivo."],
    referenciasProcesales: [{ id: "lecrim-492-4", aplicacionAlCaso: "El usuario no ha confirmado indicios racionales suficientes de la existencia del hecho delictivo. Falta el primero de los dos presupuestos que comprueba el motor, por lo que la app no fundamenta la detención en este precepto." }],
  };
  if (input.indiciosParticipacionSuficientes !== true) return {
    situacion: "NO DETENER TODAVÍA — INVESTIGAR",
    detencion: "NO",
    escenarioProcesal: "INDICIOS INSUFICIENTES",
    fundamentoDetencion: "NO DETENER. No existen actualmente indicios racionales suficientes de participación de esta persona. Art. 492.4 LECrim.",
    hechosDeterminantes: ["Constan indicios del hecho, pero no de participación de esta persona."],
    referenciasProcesales: [{ id: "lecrim-492-4", aplicacionAlCaso: "Se han confirmado indicios del hecho, pero no indicios racionales suficientes de participación de esta persona. Falta el segundo presupuesto que comprueba el motor." }],
  };
  const concreteFacts = concreteDetentionFacts(input);
  if (concreteFacts.length === 0) return {
    situacion: "INVESTIGADO NO DETENIDO",
    detencion: "NO",
    escenarioProcesal: "NO FLAGRANTE",
    fundamentoDetencion: "Existen indicios suficientes de hecho y participación, pero no consta actualmente un presupuesto concreto que justifique la privación de libertad. Arts. 492.4 y 493 LECrim. Estar identificado o ser localizable no decide por sí solo.",
    hechosDeterminantes: ["Indicios suficientes de hecho y participación.", "No consta riesgo concreto de fuga, incomparecencia, ocultación de pruebas ni riesgo actual para víctima o testigos."],
    referenciasProcesales: [
      { id: "lecrim-492-4", aplicacionAlCaso: "Se han confirmado indicios racionales suficientes del hecho y de la participación. La app los incorpora al análisis, pero no ha detectado una circunstancia concreta adicional de las preguntadas que justifique la privación de libertad." },
      { id: "lecrim-493", aplicacionAlCaso: "Como el resultado operativo es no detener, la app indica identificar suficientemente a la persona y documentar esos datos para su remisión y citación." },
    ],
  };
  return {
    situacion: "DETENIDO",
    detencion: "SÍ",
    escenarioProcesal: "NO FLAGRANTE",
    fundamentoDetencion: "DETENER. Concurren indicios racionales suficientes de hecho y participación y circunstancias concretas que justifican la detención. Art. 492.4 LECrim. La ausencia de flagrancia no impide por sí sola detener.",
    hechosDeterminantes: ["Indicios suficientes de hecho y participación.", ...concreteFacts],
    referenciasProcesales: [{ id: "lecrim-492-4", aplicacionAlCaso: `Se han confirmado indicios racionales suficientes del hecho y de la participación. Además, la app ha detectado: ${concreteFacts.join(" ")}` }],
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
    referenciasProcesales: [{ id: "lecrim-495", aplicacionAlCaso: "El delito está clasificado como leve y se han marcado conjuntamente falta de domicilio conocido y falta de fianza bastante; la app activa la excepción legal." }],
  } : {
    situacion: "INVESTIGADO NO DETENIDO",
    detencion: "NO",
    escenarioProcesal: "DELITO LEVE",
    fundamentoDetencion: "NO DETENER. Delito leve: no concurren conjuntamente la falta de domicilio conocido y la falta de fianza bastante exigidas para la excepción. Art. 495 LECrim.",
    hechosDeterminantes: input.domicilioConocido === true ? ["Domicilio conocido."] : input.fianzaBastante === true ? ["Fianza bastante."] : [],
    referenciasProcesales: [{ id: "lecrim-495", aplicacionAlCaso: input.domicilioConocido === true ? "El delito está clasificado como leve y consta domicilio conocido; no concurre la excepción que permitiría detener." : input.fianzaBastante === true ? "El delito está clasificado como leve y consta fianza bastante; no concurre la excepción que permitiría detener." : "El delito está clasificado como leve y no se han confirmado conjuntamente falta de domicilio conocido y falta de fianza bastante; la app mantiene la regla general de no detener." }],
  };
};
