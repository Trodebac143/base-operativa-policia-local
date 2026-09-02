import operativaJson from "../contenido/seguridad_publica/operativa.json";

export type PublicConcept = {
  id: string;
  bloque: "Drogas" | "Autoridad y agentes" | "Armas y objetos peligrosos";
  titulo: string;
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
};
export type PublicSecurityBlock = PublicConcept["bloque"];
export type ProcessualInput = {
  flagrante?: boolean;
  plenamenteIdentificado?: boolean;
  localizable?: boolean;
  riesgoIncomparecencia?: boolean;
};
export type ProcessualDecision = {
  situacion: "DETENIDO" | "INVESTIGADO NO DETENIDO";
  detencion: "SÍ" | "NO";
  fundamentoDetencion: string;
  escenarioProcesal: "FLAGRANCIA" | "NO FLAGRANTE" | "DELITO LEVE";
};

/** Traducción exclusivamente de interfaz: conserva las claves de contenido existentes. */
export const seguridadPublicaBlockLabel = (block: PublicSecurityBlock) => block === "Autoridad y agentes" ? "Hechos contra los agentes" : block;
export type DrugOutcome = {
  kind: "administrativa" | "indicios_no_concluyentes" | "penal";
  titulo: string;
  norma: string;
  clasificacion?: string;
  situacion: "DETENIDO" | "INVESTIGADO NO DETENIDO" | "DILIGENCIAS DE PREVENCIÓN";
  detencion: "SÍ" | "NO";
  fundamentoDetencion?: string;
  escenarioProcesal?: ProcessualDecision["escenarioProcesal"];
  porQue: string;
  actuacion: string[];
};
export type AuthorityOutcome = {
  titulo: string;
  norma: string;
  clasificacion?: string;
  situacion?: "DETENIDO" | "INVESTIGADO NO DETENIDO";
  detencion?: "SÍ" | "NO";
  fundamentoDetencion?: string;
  escenarioProcesal?: ProcessualDecision["escenarioProcesal"];
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
  categoria: concept.bloque === "Drogas" ? "seguridad_publica_drogas" : concept.bloque === "Armas y objetos peligrosos" ? "seguridad_publica_armas" : "seguridad_publica_agentes",
}));

const flagrancyDecision = (): ProcessualDecision => ({
  situacion: "DETENIDO",
  detencion: "SÍ",
  escenarioProcesal: "FLAGRANCIA",
  fundamentoDetencion: "DELITO NO LEVE + FLAGRANCIA → DETENCIÓN: SÍ. Arts. 490.2 y 492.1 LECrim: la autoridad o agente de Policía Judicial tiene obligación de detener al delincuente sorprendido in fraganti.",
});

const nonFlagrancyDecision = (input: ProcessualInput): ProcessualDecision => {
  const favorable = input.plenamenteIdentificado !== false && input.localizable !== false && !input.riesgoIncomparecencia;
  if (favorable) return {
    situacion: "INVESTIGADO NO DETENIDO",
    detencion: "NO",
    escenarioProcesal: "NO FLAGRANTE",
    fundamentoDetencion: "DELITO NO FLAGRANTE → INVESTIGADO NO DETENIDO al estar identificado y localizable y no constar circunstancias objetivas de riesgo de incomparecencia. Arts. 492.3–4 y 493 LECrim.",
  };
  return {
    situacion: "DETENIDO",
    detencion: "SÍ",
    escenarioProcesal: "NO FLAGRANTE",
    fundamentoDetencion: "DELITO NO FLAGRANTE → DETENCIÓN: SÍ al concurrir los presupuestos legales y circunstancias objetivas de riesgo de incomparecencia. Arts. 492.3–4 y 493 LECrim.",
  };
};

export const resolvePenalProcessualDecision = (input: ProcessualInput = {}): ProcessualDecision => input.flagrante === false ? nonFlagrancyDecision(input) : flagrancyDecision();

const delitoLeveDecision = (): ProcessualDecision => ({
  situacion: "INVESTIGADO NO DETENIDO",
  detencion: "NO",
  escenarioProcesal: "DELITO LEVE",
  fundamentoDetencion: "DELITO LEVE → DETENCIÓN: NO, como regla general. Art. 495 LECrim: solo cabe la excepción cuando el presunto autor no tenga domicilio conocido y no dé fianza bastante a juicio de la autoridad o agente que intente detenerle.",
});

export function resolveDrugOutcome(input: { ventaObservada: boolean; indiciosSuficientes: boolean; sustancia: "grave_dano" | "resto" } & ProcessualInput): DrugOutcome {
  if (input.ventaObservada || input.indiciosSuficientes) {
    const grave = input.sustancia === "grave_dano";
    const processual = resolvePenalProcessualDecision(input);
    return {
      kind: "penal", titulo: "POSIBLE DELITO", norma: "Código Penal · art. 368",
      clasificacion: grave ? "DELITO GRAVE" : "DELITO MENOS GRAVE", ...processual,
      porQue: input.ventaObservada ? "Se observa venta, entrega o suministro a tercero." : "Existen indicios objetivos suficientes de tráfico valorados conjuntamente.",
      actuacion: processual.situacion === "DETENIDO"
        ? ["Documentar venta e indicios, asegurar pruebas y efectos objetivamente vinculados.", "Presentar al detenido, actuaciones y efectos en CNP."]
        : ["Documentar venta e indicios, asegurar pruebas y efectos objetivamente vinculados.", "Informar de hechos y derechos; coordinar continuación y citación con CNP."],
    };
  }
  return {
    kind: "indicios_no_concluyentes", titulo: "INDICIOS DE POSIBLE TRÁFICO, NO CONCLUYENTES", norma: "Coordinación con CNP", situacion: "DILIGENCIAS DE PREVENCIÓN", detencion: "NO",
    porQue: "Hay elementos que generan duda, pero no se ha cerrado una atribución individualizada suficiente de tráfico.",
    actuacion: ["Identificar y documentar los indicios concretos presentes.", "Asegurar pruebas, efectos y datos de testigos cuando proceda.", "Comunicar o comparecer ante CNP para continuación."],
  };
}

function penalAuthorityOutcome(base: Omit<AuthorityOutcome, "situacion" | "detencion" | "fundamentoDetencion" | "escenarioProcesal">, input?: ProcessualInput): AuthorityOutcome {
  return { ...base, ...resolvePenalProcessualDecision(input) };
}

export function resolveAuthorityOutcome(conceptId: string, level: string, input: ProcessualInput = {}): AuthorityOutcome | null {
  const admin = (titulo: string, norma: string, porQue: string, frontera: string): AuthorityOutcome => ({ titulo, norma, porQue, frontera, actuacion: ["Documentar los hechos, requerimientos y respuesta de la persona.", "Formular denuncia administrativa."] });
  if (conceptId === "desobediencia") return level === "penal" ? penalAuthorityOutcome({
    titulo: "POSIBLE DELITO", norma: "Código Penal · art. 556.1", clasificacion: "DELITO MENOS GRAVE",
    porQue: "Constan orden legítima, expresa, concreta y terminante, dirigida al interesado y conocida o comprendida; negativa consciente, oposición persistente o contumaz y gravedad penal suficiente.",
    frontera: "Permanece en el art. 36.6 LO 4/2015 cuando falta una orden expresa, concreta y terminante dentro de las competencias legales del agente, su comunicación y conocimiento efectivo, una negativa consciente y tenaz o gravedad penal suficiente atendiendo a la trascendencia de la orden, las consecuencias del incumplimiento y el conjunto de circunstancias.",
    actuacion: ["Documentar literalmente la orden, su competencia, comunicación y conocimiento, la negativa y persistencia.", "Aplicar el régimen procesal mostrado y coordinar con CNP cuando no proceda la detención."],
  }, input) : admin("INFRACCIÓN ADMINISTRATIVA", "LO 4/2015 · art. 36.6", "No concurren conjuntamente los requisitos de una desobediencia grave del art. 556.1 CP.", "Permanece en el art. 36.6 LO 4/2015 cuando no existe una orden expresa, concreta y terminante dentro de las competencias legales del agente, no consta su conocimiento efectivo, falta negativa consciente y persistente o no alcanza gravedad penal suficiente.");
  if (conceptId === "resistencia") {
    if (level === "atentado") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 550", clasificacion: "DELITO MENOS GRAVE",
      porQue: "Existe agresión, acometimiento o resistencia grave mediante violencia o intimidación grave.",
      frontera: "La resistencia pasiva grave o activa de entidad penal que no incluya agresión, acometimiento ni resistencia grave mediante violencia o intimidación grave se encuadra en el art. 556.1 CP. La resistencia pasiva leve, la oposición de escasa entidad y la dificultad menor se mantienen en el art. 36.6 LO 4/2015.",
      actuacion: ["Documentar violencia, intimidación, lesiones, medios y testigos.", "Presentar al detenido y actuaciones en CNP."],
    }, input);
    if (level === "penal") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 556.1", clasificacion: "DELITO MENOS GRAVE",
      porQue: "Hay resistencia pasiva grave o resistencia activa de intensidad inferior a atentado, con entidad penal suficiente.",
      frontera: "La resistencia pasiva leve, la oposición de escasa entidad y la dificultad menor se mantienen en el art. 36.6 LO 4/2015. La agresión, el acometimiento o la resistencia grave mediante violencia o intimidación grave abren la rama del art. 550 CP.",
      actuacion: ["Documentar la intensidad y secuencia de la oposición física.", "Aplicar el régimen procesal mostrado y coordinar con CNP cuando no proceda la detención."],
    }, input);
    return admin("INFRACCIÓN ADMINISTRATIVA", "LO 4/2015 · art. 36.6", "Oposición de escasa entidad, resistencia pasiva leve o dificultad menor.", "Permanece en el art. 36.6 LO 4/2015 mientras la oposición sea pasiva leve, de escasa entidad o una dificultad menor. La resistencia pasiva grave o activa con entidad penal abre el art. 556.1 CP; la agresión, acometimiento o resistencia grave mediante violencia o intimidación grave abren el art. 550 CP.");
  }
  if (conceptId === "amenazas") {
    if (level === "leve") return {
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 171.7", clasificacion: "DELITO LEVE", ...delitoLeveDecision(),
      porQue: "Amenaza de carácter leve fuera de los restantes supuestos.",
      frontera: "Una frase airada sin anuncio serio de mal penalmente relevante permanece en el art. 37.4 LO 4/2015. Una amenaza de mal futuro con entidad suficiente abre la rama del art. 169 CP; la intimidación grave integrada en resistencia grave o inicio inmediato de ataque abre la rama del art. 550 CP.",
      actuacion: ["Identificar y documentar literalmente las expresiones y el contexto.", "Informar de hechos y derechos; coordinar continuación y citación con CNP."],
    };
    if (level === "art169") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 169", clasificacion: "DELITO MENOS GRAVE",
      porQue: "Amenaza de causar los males trabajados en el art. 169 CP, con entidad apreciada por el contenido, seriedad, firmeza, medios, proximidad, reiteración y conducta acompañante.",
      frontera: "No es atentado cuando se anuncia un mal futuro sin resistencia grave ni inicio inmediato de ataque. La intimidación grave integrada en resistencia grave o inicio inmediato de ataque se encuadra en el art. 550 CP.",
      actuacion: ["Documentar expresiones, seriedad, medios, proximidad, reiteración y conducta acompañante.", "Aplicar el régimen procesal mostrado y coordinar con CNP cuando no proceda la detención."],
    }, input);
    if (level === "atentado") return penalAuthorityOutcome({
      titulo: "POSIBLE DELITO", norma: "Código Penal · art. 550", clasificacion: "DELITO MENOS GRAVE",
      porQue: "La intimidación grave se integra en resistencia grave o inicio inmediato de ataque.",
      frontera: "La amenaza de un mal futuro sin resistencia grave ni inicio inmediato de ataque se encuadra en amenazas.",
      actuacion: ["Documentar el medio empleado, disposición inmediata de ataque y finalidad de impedir la actuación.", "Presentar al detenido y actuaciones en CNP."],
    }, input);
    return { titulo: "INFRACCIÓN ADMINISTRATIVA", norma: "LO 4/2015 · art. 37.4", porQue: "Insulto, expresión despectiva o frase airada sin anuncio serio de mal penalmente relevante.", frontera: "Permanece en el art. 37.4 LO 4/2015 cuando no hay anuncio serio de un mal penalmente relevante, agresión, acometimiento, resistencia grave mediante violencia o intimidación grave.", actuacion: ["Documentar literalmente conducta y contexto.", "Formular denuncia administrativa."] };
  }
  return null;
}

export type WeaponObjectInput = {
  tipo: "navaja" | "hoja" | "objeto";
  mecanismo?: "automatico" | "no_automatico" | "dudoso";
  automaticaConfirmada?: boolean;
  hojaMenorOnce?: boolean;
  dosFilos?: boolean;
  puntiaguda?: boolean;
  supuestoEspecifico?: boolean;
  circunstanciaTenencia?: "contemplacion" | "reparacion" | "transmision";
};
export type WeaponConduct = "porte" | "manipula" | "exhibe" | "intimidatoria" | "amenaza" | "intenta" | "usa";
export type WeaponContextInput = {
  disponibilidad?: "encima" | "efectos" | "accesible" | "vehiculo" | "sin_disponente";
  comportamiento: WeaponConduct;
  contexto?: "sin_incidente" | "altercado" | "violento" | "amenazas" | "otro_delito" | "otras";
} & ProcessualInput;
export type WeaponOutcome = {
  kind: "sin_conclusion_automatica" | "valoracion_especifica" | "administrativa" | "posible_penal" | "derivacion_penal" | "penal";
  titulo: string;
  norma: string;
  clasificacion?: string;
  rango?: string;
  situacion?: "DETENIDO" | "INVESTIGADO NO DETENIDO" | "DILIGENCIAS DE PREVENCIÓN";
  detencion?: "SÍ" | "NO";
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
  const clasificacionObjeto = punal ? "PUÑAL — ARMA PROHIBIDA" : automatica ? "NAVAJA AUTOMÁTICA — ARMA PROHIBIDA" : mecanismo === "no_automatico" ? "NAVAJA NO AUTOMÁTICA — CONTINUAR VALORACIÓN DE ARMA BLANCA NO PROHIBIDA" : object.tipo === "navaja" ? "NO PUEDE CONFIRMARSE COMO NAVAJA AUTOMÁTICA" : object.tipo === "hoja" ? "NO SE CLASIFICA COMO PUÑAL EN ESTA RAMA" : "OBJETO NO CLASIFICADO REGLAMENTARIAMENTE COMO ARMA";
  const observed = inferredWeaponContext(context);
  const facts = weaponFacts(observed);
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
    const processual = resolvePenalProcessualDecision(observed);
    return {
      kind: "penal",
      titulo: "INDICIOS DE DELITO DE TENENCIA DE ARMA PROHIBIDA",
      norma: "Código Penal · art. 563",
      clasificacion: "DELITO MENOS GRAVE",
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
    titulo: "POSIBLE RELEVANCIA PENAL — ART. 563 CP",
    norma: "Código Penal · art. 563",
    clasificacionObjeto,
    conducta,
    situacion: "DILIGENCIAS DE PREVENCIÓN",
    detencion: "NO",
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
    porQue: "La clasificación reglamentaria del objeto pasa a ser secundaria. El objeto puede adquirir relevancia penal por el modo en que ha sido utilizado, aunque no esté clasificado como arma blanca prohibida.",
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
      situacion: "DILIGENCIAS DE PREVENCIÓN",
      detencion: "NO",
      porQue: `La conducta mantiene relevancia aunque el objeto no se haya clasificado como arma prohibida. ${facts.join(" ")}`,
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

  return {
    kind: "sin_conclusion_automatica",
    titulo: object.tipo === "navaja" && !automatica ? mecanismo === "no_automatico" ? "CONTINUAR VALORACIÓN DE NAVAJA NO AUTOMÁTICA" : "CLASIFICACIÓN ABIERTA — CONTINUAR VALORACIÓN" : "SIN INFRACCIÓN DE ARMAS AUTOMÁTICA",
    norma: object.tipo === "navaja" && !automatica ? "Continuación pendiente de armas blancas no prohibidas" : "Continuar solo si aparecen otros hechos relevantes",
    clasificacionObjeto,
    conducta,
    porQue: object.tipo === "objeto"
      ? "El mero porte de un objeto ordinario no lo convierte en arma ni genera por sí solo una infracción de armas."
      : object.tipo === "navaja" && !automatica ? "La navaja no automática o de mecanismo dudoso no se clasifica como automática por ese motivo. Se conserva el análisis del porte y sus circunstancias para la rama posterior de armas blancas no prohibidas." : "La falta de clasificación como puñal o navaja automática no significa que el objeto esté permitido; esta rama no convierte automáticamente el simple porte en infracción.",
    frontera: object.tipo === "objeto"
      ? "La relevancia puede surgir del uso concreto como medio de amenaza, intimidación o agresión."
      : "La valoración completa de necesidad, ocasión, lugar y circunstancias del porte de un arma blanca no prohibida se desarrollará posteriormente.",
    hechosRelevantes: facts,
    actuacion: ["Mantener la descripción objetiva del objeto y continuar únicamente si aparecen hechos relevantes para otra rama."],
  };
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
