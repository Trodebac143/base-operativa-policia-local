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

export type RazonamientoProcesal = {
  hechosConfirmados: string[];
  encajeLegal: string;
  consecuencia: string;
};

export const redactarRazonamientoProcesal = (razonamiento: RazonamientoProcesal) => [
  ...razonamiento.hechosConfirmados,
  razonamiento.encajeLegal,
  razonamiento.consecuencia,
].filter(Boolean).join(" ");

export type ProcessualDecision = {
  situacion: "DETENIDO" | "INVESTIGADO NO DETENIDO" | "NO DETENER TODAVÍA — INVESTIGAR" | "RUTA DE RESPONSABILIDAD PENAL DE MENORES";
  detencion: "SÍ" | "NO" | "NO APLICAR MOTOR ADULTO";
  fundamentoDetencion: string;
  escenarioProcesal: "FLAGRANCIA" | "NO FLAGRANTE" | "DELITO LEVE" | "INDICIOS INSUFICIENTES" | "AUTOR MENOR";
  hechosDeterminantes?: string[];
  referenciasProcesales?: UsoReferenciaProcesal[];
  razonamientoProcesal: RazonamientoProcesal;
};

const decisionConRazonamiento = (decision: Omit<ProcessualDecision, "fundamentoDetencion">): ProcessualDecision => ({
  ...decision,
  fundamentoDetencion: redactarRazonamientoProcesal(decision.razonamientoProcesal),
});

const concreteDetentionFacts = (input: ProcessualInput) => [
  input.intentoFugaElusion && "Consta un intento actual de fuga o elusión de la actuación.",
  input.identidadODomicilioNoVerificables && "No han podido verificarse la identidad o el domicilio y existe un riesgo objetivo de incomparecencia.",
  input.riesgoOcultacionPruebas && "Concurre un riesgo concreto de ocultación, alteración o destrucción de pruebas.",
  input.riesgoConcretoVictimaTestigos && "Concurre un riesgo concreto y actual para la víctima o los testigos.",
].filter((item): item is string => Boolean(item));

const enlazarCircunstancias = (circunstancias: string[]) => circunstancias.length === 0
  ? ""
  : `Además, ${circunstancias.join(" ").replace(/^./, (initial) => initial.toLocaleLowerCase("es"))}`;

const enumerar = (elementos: string[]) => elementos.length < 2
  ? (elementos[0] ?? "")
  : `${elementos.slice(0, -1).join(", ")} y ${elementos.at(-1)}`;

const circunstanciasQueDescartanDetencion = (input: ProcessualInput) => [
  input.intentoFugaElusion === false && "no consta un intento de fuga o elusión de la actuación",
  input.identidadODomicilioNoVerificables === false && "la identidad o el domicilio han podido verificarse",
  input.riesgoOcultacionPruebas === false && "no consta riesgo concreto de ocultación, alteración o destrucción de pruebas",
  input.riesgoConcretoVictimaTestigos === false && "no consta riesgo concreto y actual para la víctima o los testigos",
].filter((item): item is string => Boolean(item));

const flagrancyDecision = (): ProcessualDecision => decisionConRazonamiento({
  situacion: "DETENIDO",
  detencion: "SÍ",
  escenarioProcesal: "FLAGRANCIA",
  hechosDeterminantes: ["Persona sorprendida durante la comisión del hecho o inmediatamente después."],
  razonamientoProcesal: {
    hechosConfirmados: ["La persona ha sido sorprendida durante la comisión del hecho o inmediatamente después."],
    encajeLegal: "Estos hechos encajan en el supuesto de flagrancia del art. 490.2 LECrim y activan para la Policía Judicial la regla del art. 492.1 LECrim.",
    consecuencia: "Por ello, procede la detención.",
  },
  referenciasProcesales: [
    { id: "lecrim-490-2", aplicacionAlCaso: "La persona ha sido sorprendida durante la comisión del hecho o inmediatamente después. Este hecho permite apreciar el supuesto de flagrancia.", conclusion: "El hecho queda comprendido en el supuesto del art. 490.2 LECrim." },
    { id: "lecrim-492-1", aplicacionAlCaso: "Apreciada la flagrancia prevista en el art. 490.2, resulta aplicable a la Policía Judicial la regla de detención del art. 492.1.", conclusion: "La concurrencia conjunta de ambos preceptos justifica la detención." },
  ],
});

const nonFlagrancyDecision = (input: ProcessualInput): ProcessualDecision => {
  const hechoDescartado = input.indiciosHechoSuficientes === false;
  if (input.indiciosHechoSuficientes !== true) return decisionConRazonamiento({
    situacion: "NO DETENER TODAVÍA — INVESTIGAR",
    detencion: "NO",
    escenarioProcesal: "INDICIOS INSUFICIENTES",
    hechosDeterminantes: hechoDescartado ? ["No constan indicios racionales suficientes del hecho delictivo."] : [],
    razonamientoProcesal: {
      hechosConfirmados: [hechoDescartado ? "Se ha descartado que existan actualmente indicios racionales suficientes de la existencia de un hecho delictivo." : "La suficiencia de los indicios sobre la existencia del hecho delictivo todavía no está confirmada."],
      encajeLegal: "Falta el primero de los presupuestos exigidos por el art. 492.4 LECrim.",
      consecuencia: "Por ello, la detención no queda justificada y deben continuar las comprobaciones.",
    },
    referenciasProcesales: [{ id: "lecrim-492-4", aplicacionAlCaso: hechoDescartado ? "Se ha descartado que existan actualmente indicios racionales suficientes de la existencia de un hecho delictivo, por lo que falta el primero de los dos presupuestos del precepto." : "La suficiencia de los indicios sobre la existencia del hecho delictivo todavía no está confirmada, por lo que no puede darse por cumplido el primero de los dos presupuestos del precepto.", conclusion: "Mientras falte este presupuesto, el art. 492.4 LECrim no justifica la detención." }],
  });
  const participacionDescartada = input.indiciosParticipacionSuficientes === false;
  if (input.indiciosParticipacionSuficientes !== true) return decisionConRazonamiento({
    situacion: "NO DETENER TODAVÍA — INVESTIGAR",
    detencion: "NO",
    escenarioProcesal: "INDICIOS INSUFICIENTES",
    hechosDeterminantes: participacionDescartada ? ["Constan indicios del hecho, pero no de participación de esta persona."] : ["Constan indicios suficientes del hecho."],
    razonamientoProcesal: {
      hechosConfirmados: [participacionDescartada ? "Constan indicios racionales suficientes del hecho delictivo, pero se ha descartado que existan indicios suficientes de la participación de esta persona." : "Constan indicios racionales suficientes del hecho delictivo; la suficiencia de los indicios de participación de esta persona todavía no está confirmada."],
      encajeLegal: "Falta el segundo de los presupuestos exigidos por el art. 492.4 LECrim.",
      consecuencia: "Por ello, la detención no queda justificada y deben continuar las comprobaciones.",
    },
    referenciasProcesales: [{ id: "lecrim-492-4", aplicacionAlCaso: participacionDescartada ? "Constan indicios del hecho, pero se ha descartado que existan indicios racionales suficientes de participación de esta persona, por lo que falta el segundo presupuesto del precepto." : "Constan indicios del hecho, pero la suficiencia de los indicios de participación de esta persona todavía no está confirmada, por lo que no puede darse por cumplido el segundo presupuesto del precepto.", conclusion: "Mientras falte este presupuesto, el art. 492.4 LECrim no justifica la detención." }],
  });
  const concreteFacts = concreteDetentionFacts(input);
  const confirmedNoDetentionFacts = circunstanciasQueDescartanDetencion(input);
  if (concreteFacts.length === 0) return decisionConRazonamiento({
    situacion: "INVESTIGADO NO DETENIDO",
    detencion: "NO",
    escenarioProcesal: "NO FLAGRANTE",
    hechosDeterminantes: ["Indicios suficientes de hecho y participación.", ...confirmedNoDetentionFacts.map((fact) => `${fact[0].toLocaleUpperCase("es")}${fact.slice(1)}.`)],
    razonamientoProcesal: {
      hechosConfirmados: ["Constan indicios racionales suficientes del hecho y de la participación de esta persona.", confirmedNoDetentionFacts.length > 0 ? `Además, ${enumerar(confirmedNoDetentionFacts)}.` : "No se ha confirmado todavía ninguna circunstancia concreta adicional que justifique la privación de libertad."],
      encajeLegal: "En estas condiciones, no procede la detención por el art. 492.4 y resulta aplicable la identificación prevista en el art. 493 LECrim.",
      consecuencia: "Por ello, procede continuar la actuación como investigado no detenido.",
    },
    referenciasProcesales: [
      { id: "lecrim-492-4", aplicacionAlCaso: confirmedNoDetentionFacts.length > 0 ? `Constan indicios racionales suficientes del hecho y de la participación. Además, ${enumerar(confirmedNoDetentionFacts)}.` : "Constan indicios racionales suficientes del hecho y de la participación, pero no se ha confirmado todavía ninguna circunstancia concreta adicional que justifique la privación de libertad.", conclusion: "Con los hechos disponibles, no procede la detención por el art. 492.4 LECrim." },
      { id: "lecrim-493", aplicacionAlCaso: "Al no proceder la detención, deben recogerse los datos bastantes de identificación y domicilio para documentarlos y trasladarlos al órgano competente.", conclusion: "Procede continuar la actuación como investigado no detenido conforme al art. 493 LECrim." },
    ],
  });
  return decisionConRazonamiento({
    situacion: "DETENIDO",
    detencion: "SÍ",
    escenarioProcesal: "NO FLAGRANTE",
    hechosDeterminantes: ["Indicios suficientes de hecho y participación.", ...concreteFacts],
    razonamientoProcesal: {
      hechosConfirmados: ["De los hechos indicados resultan indicios racionales suficientes de la existencia del delito y de la participación de esta persona.", enlazarCircunstancias(concreteFacts)],
      encajeLegal: "Estos hechos permiten encuadrar la actuación en el art. 492.4 LECrim.",
      consecuencia: "Por ello, la detención queda justificada. La ausencia de flagrancia no impide por sí sola detener.",
    },
    referenciasProcesales: [{ id: "lecrim-492-4", aplicacionAlCaso: `Constan indicios racionales suficientes del hecho y de la participación. ${enlazarCircunstancias(concreteFacts)}`, conclusion: "Al concurrir estos presupuestos, la detención encuentra cobertura en el art. 492.4 LECrim." }],
  });
};

export const resolvePenalProcessualDecision = (input: ProcessualInput = {}): ProcessualDecision => {
  if (input.autorMayorEdad === false) return decisionConRazonamiento({
    situacion: "RUTA DE RESPONSABILIDAD PENAL DE MENORES",
    detencion: "NO APLICAR MOTOR ADULTO",
    escenarioProcesal: "AUTOR MENOR",
    razonamientoProcesal: {
      hechosConfirmados: ["El presunto autor es menor de 18 años."],
      encajeLegal: "No resulta aplicable directamente el régimen de detención de adultos de la LECrim.",
      consecuencia: "Debe activarse la ruta específica de responsabilidad penal de menores.",
    },
  });
  return input.flagrante === true ? flagrancyDecision() : nonFlagrancyDecision(input);
};

export const resolveMinorOffenceProcessualDecision = (input: ProcessualInput = {}): ProcessualDecision => {
  const exceptionalDetention = input.domicilioConocido === false && input.fianzaBastante === false;
  return exceptionalDetention ? decisionConRazonamiento({
    situacion: "DETENIDO",
    detencion: "SÍ",
    escenarioProcesal: "DELITO LEVE",
    hechosDeterminantes: ["No consta domicilio conocido.", "No presta fianza bastante."],
    razonamientoProcesal: {
      hechosConfirmados: ["El hecho está clasificado como delito leve.", "No consta domicilio conocido y no se presta fianza bastante."],
      encajeLegal: "Concurren conjuntamente las dos circunstancias excepcionales previstas en el art. 495 LECrim.",
      consecuencia: "Por ello, la detención excepcional queda justificada; deben documentarse ambos presupuestos.",
    },
    referenciasProcesales: [{ id: "lecrim-495", aplicacionAlCaso: "El hecho está clasificado como delito leve, no consta domicilio conocido y no se presta fianza bastante.", conclusion: "Al concurrir conjuntamente ambas circunstancias, la detención excepcional encuentra cobertura en el art. 495 LECrim." }],
  }) : decisionConRazonamiento({
    situacion: "INVESTIGADO NO DETENIDO",
    detencion: "NO",
    escenarioProcesal: "DELITO LEVE",
    hechosDeterminantes: input.domicilioConocido === true ? ["Domicilio conocido."] : input.fianzaBastante === true ? ["Fianza bastante."] : [],
    razonamientoProcesal: {
      hechosConfirmados: ["El hecho está clasificado como delito leve.", ...(input.domicilioConocido === true ? ["Consta domicilio conocido."] : input.fianzaBastante === true ? ["Consta fianza bastante."] : [])],
      encajeLegal: "No concurren conjuntamente la falta de domicilio conocido y la falta de fianza bastante exigidas para la excepción del art. 495 LECrim.",
      consecuencia: "Por ello, no procede la detención y debe continuarse la actuación como investigado no detenido.",
    },
    referenciasProcesales: [{ id: "lecrim-495", aplicacionAlCaso: input.domicilioConocido === true ? "El hecho está clasificado como delito leve y consta domicilio conocido; no concurre la excepción que permitiría detener." : input.fianzaBastante === true ? "El hecho está clasificado como delito leve y consta fianza bastante; no concurre la excepción que permitiría detener." : "El hecho está clasificado como delito leve y no constan conjuntamente las dos circunstancias excepcionales exigidas por el precepto.", conclusion: "Al no concurrir conjuntamente ambas circunstancias, el art. 495 LECrim impide la detención." }],
  });
};
