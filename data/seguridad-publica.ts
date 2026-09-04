import operativaJson from "../contenido/seguridad_publica/operativa.json";

export type PublicConcept = {
  id: string;
  bloque: "Drogas" | "Autoridad y agentes" | "Armas y objetos peligrosos" | "Violencia de género y doméstica" | "Agresiones y lesiones" | "Agresiones sexuales" | "Peleas y riñas" | "Amenazas y coacciones";
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
  detalle?: string[];
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
export const seguridadPublicaBlockDescription: Record<PublicSecurityBlock, string> = {
  "Drogas": "Consumo, tenencia y posible tráfico.",
  "Autoridad y agentes": "Respeto, desobediencia, identificación, resistencia, amenazas y atentado.",
  "Armas y objetos peligrosos": "Armas blancas y objetos utilizados como medio ofensivo.",
  "Violencia de género y doméstica": "Relación protegida y hechos que pueden coexistir.",
  "Agresiones y lesiones": "Agresión física, resultado asistencial y alertas de gravedad.",
  "Agresiones sexuales": "Actuación inmediata, preservación y derivaciones necesarias.",
  "Peleas y riñas": "Enfrentamientos individuales, recíprocos y tumultuarios.",
  "Amenazas y coacciones": "Anuncio de mal, imposición y conducta reiterada.",
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
};
export const seguridadPublicaCategoryId = (block: PublicSecurityBlock) => publicSecurityCategoryByBlock[block];
export const seguridadPublicaBlockFromCategoryId = (categoryId: string): PublicSecurityBlock | undefined => Object.entries(publicSecurityCategoryByBlock).find(([, value]) => value === categoryId)?.[0] as PublicSecurityBlock | undefined;
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
  categoria: seguridadPublicaCategoryId(concept.bloque),
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

export type PublicSafetyRelation = "vg" | "domestica" | "ninguna";
export type PublicSafetyFacts = {
  relacion?: PublicSafetyRelation;
  hechosRelacion?: Array<"agresion" | "amenazas" | "coacciones" | "sexual" | "quebrantamiento">;
  episodiosPrevios?: boolean;
  noDeseaDenunciar?: boolean;
  agresionFisica?: boolean;
  lesion?: boolean;
  resultadoAsistencial?: "sin_asistencia" | "primera_asistencia" | "tratamiento_posterior" | "desconocido";
  medioPeligroso?: boolean;
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
  conductaLibertad?: "amenaza" | "coaccion" | "acoso";
  malAnunciado?: "entidad_delictiva" | "menor_entidad" | "no_precisado";
  condicionImpuesta?: boolean;
  coaccionEntidad?: "general" | "leve" | "no_precisada";
  soportes?: boolean;
};
export type PublicSafetyResult = {
  titulo: string;
  norma: string;
  clasificacion?: string;
  texto: string;
  actuacion: string[];
  destacado?: "warning" | "danger" | "neutral";
};
export type PublicSafetyConnection = { conceptId: string; etiqueta: string; motivo: string };
export type PublicSafetyOutcome = {
  resultados: PublicSafetyResult[];
  conexiones: PublicSafetyConnection[];
  procesal?: ProcessualDecision;
};

const incidentResult = (titulo: string, norma: string, texto: string, actuacion: string[], clasificacion?: string, destacado?: PublicSafetyResult["destacado"]): PublicSafetyResult => ({ titulo, norma, texto, actuacion, clasificacion, destacado });
const basicIncidentAction = ["Proteger y separar cuando proceda.", "Identificar a las personas implicadas.", "Recoger hechos relevantes, testigos e indicios disponibles."];
const relationConnection = (relation: PublicSafetyRelation | undefined): PublicSafetyConnection | undefined => relation === "vg" || relation === "domestica" ? { conceptId: "violencia_relacional", etiqueta: relation === "vg" ? "Violencia de género" : "Violencia doméstica", motivo: "La relación ya recogida se conserva en la intervención." } : undefined;
const addConnection = (connections: PublicSafetyConnection[], connection: PublicSafetyConnection | undefined) => { if (connection && !connections.some((item) => item.conceptId === connection.conceptId)) connections.push(connection); };
const withIncidentProcessual = (outcome: PublicSafetyOutcome, regime: "leve" | "no_leve" | undefined, input: ProcessualInput) => ({ ...outcome, procesal: regime === "leve" ? delitoLeveDecision() : regime === "no_leve" ? resolvePenalProcessualDecision(input) : undefined });

/** Motor común para incidentes personales: utiliza los mismos hechos entre bloques. */
export function resolvePublicSafetyOutcome(conceptId: string, facts: PublicSafetyFacts, input: ProcessualInput = {}): PublicSafetyOutcome {
  const results: PublicSafetyResult[] = [];
  const connections: PublicSafetyConnection[] = [];
  const relation = facts.relacion;
  const protectedRelation = relation === "vg" || relation === "domestica";
  const relationLink = relationConnection(relation);
  const pending = (text: string) => ({ resultados: [incidentResult("ORIENTACIÓN PENDIENTE", "Datos de la intervención", text, basicIncidentAction, undefined, "neutral")], conexiones: [] });
  const addComplaintNotice = (sexual = false) => {
    if (relation !== "vg" || !facts.noDeseaDenunciar) return;
    results.push(incidentResult(
      "DENUNCIA DE LA VÍCTIMA",
      sexual ? "Código Penal · art. 191; LECrim · art. 105" : "LECrim · art. 105",
      sexual
        ? "No paraliza la protección ni las primeras diligencias. Para proceder: denuncia de la víctima o querella del Ministerio Fiscal."
        : "No es necesaria para continuar. Informar a la víctima y actuar de oficio.",
      ["Documentar su manifestación e informar de sus derechos.", "Continuar la actuación policial."],
      undefined,
      "danger",
    ));
  };

  if (conceptId === "violencia_relacional") {
    if (!relation) return pending("Indica la relación entre autor y víctima antes de orientar los hechos.");
    const relationFacts = facts.hechosRelacion ?? [];
    const vgCriminalFacts = relation === "vg" && relationFacts.length > 0;
    results.push(incidentResult(
      relation === "vg" ? "ÁMBITO DE VIOLENCIA DE GÉNERO" : relation === "domestica" ? "ÁMBITO FAMILIAR O CONVIVENCIAL PROTEGIDO" : "SIN RELACIÓN PROTEGIDA",
      relation === "vg" ? "LO 1/2004 · art. 1" : "Relación autor-víctima",
      relation === "vg" ? "Hombre frente a esposa, exesposa o mujer ligada o anteriormente ligada por relación análoga de afectividad, aun sin convivencia." : relation === "domestica" ? "Otro integrante del ámbito familiar o convivencial protegido." : "Derivar cada hecho a los bloques generales correspondientes.",
      relation === "vg" ? ["Coordinar continuación y valoración de riesgo mediante CNP / Sistema VioGén conforme al protocolo operativo aplicable."] : basicIncidentAction,
      undefined,
      relation === "ninguna" ? "neutral" : "warning",
    ));
    if (relation === "vg") {
      const vgResults: Record<NonNullable<PublicSafetyFacts["hechosRelacion"]>[number], PublicSafetyResult> = {
        agresion: incidentResult("POSIBLE MALTRATO EN VIOLENCIA DE GÉNERO", "Código Penal · art. 153.1", "El golpe o maltrato, aun sin lesión, tiene trascendencia penal.", ["Proteger y separar.", "Documentar el episodio y conservar los indicios."], "DELITO MENOS GRAVE", "warning"),
        amenazas: incidentResult("POSIBLE DELITO DE AMENAZAS", "Código Penal · arts. 169 y ss. y 171.4", "La amenaza tiene trascendencia penal. Concretar expresiones y gravedad en su bloque.", ["Proteger y separar.", "Recoger literalmente las expresiones y el contexto."], "DELITO NO LEVE", "warning"),
        coacciones: incidentResult("POSIBLE DELITO DE COACCIONES", "Código Penal · arts. 172.1 y 172.2", "La conducta que obliga o impide actuar tiene trascendencia penal.", ["Proteger y separar.", "Documentar la conducta y el medio empleado."], "DELITO MENOS GRAVE", "warning"),
        sexual: incidentResult("POSIBLE AGRESIÓN SEXUAL", "Código Penal · arts. 178 a 180", "El acto sexual no consentido tiene trascendencia penal.", ["Proteger y separar.", "Priorizar asistencia y preservar indicios."], "DELITO NO LEVE", "warning"),
        quebrantamiento: incidentResult("POSIBLE QUEBRANTAMIENTO", "Código Penal · art. 468.2", "El incumplimiento de la prohibición o medida tiene trascendencia penal.", ["Proteger y separar.", "Comprobar la vigencia y contenido de la medida."], "DELITO MENOS GRAVE", "warning"),
      };
      for (const fact of relationFacts) results.push(vgResults[fact]);
    }
    if (facts.episodiosPrevios) results.push(incidentResult("VALORAR ADEMÁS POSIBLE VIOLENCIA HABITUAL", "Código Penal · art. 173.2", "Los episodios anteriores no sustituyen el análisis del hecho actual.", ["Documentar episodios y datos objetivos.", "Mantener el análisis de cada hecho concreto."], relation === "vg" ? "DELITO MENOS GRAVE" : undefined, "warning"));
    if (vgCriminalFacts) addComplaintNotice(relationFacts.includes("sexual"));
    for (const fact of relationFacts) {
      const connection: Record<string, PublicSafetyConnection> = {
        agresion: { conceptId: "agresiones_lesiones", etiqueta: "Agresiones y lesiones", motivo: "Analizar el episodio físico sin volver a pedir la relación." },
        amenazas: { conceptId: "amenazas_coacciones", etiqueta: "Amenazas y coacciones", motivo: "Analizar las expresiones y su contexto." },
        coacciones: { conceptId: "amenazas_coacciones", etiqueta: "Amenazas y coacciones", motivo: "Analizar la conducta que obliga o impide actuar." },
        sexual: { conceptId: "agresiones_sexuales", etiqueta: "Agresiones sexuales", motivo: "Aplicar el bloque de actuación inmediata." },
        quebrantamiento: { conceptId: "", etiqueta: "Posible quebrantamiento", motivo: "Comunicar y documentar la posible prohibición o medida; este bloque no se desarrolla todavía." },
      };
      addConnection(connections, connection[fact]);
    }
    return withIncidentProcessual({ resultados: results, conexiones: connections }, vgCriminalFacts ? "no_leve" : undefined, input);
  }

  if (conceptId === "agresiones_lesiones") {
    if (facts.agresionFisica === undefined) return pending("Indica si ha existido golpe o agresión física.");
    if (!facts.agresionFisica) return { resultados: [incidentResult("SIN AGRESIÓN FÍSICA REFERIDA", "Datos de la intervención", "Valora el bloque que corresponda si existen amenazas, coacciones u otro hecho.", basicIncidentAction, undefined, "neutral")], conexiones: [] };
    let regime: "leve" | "no_leve" | undefined;
    if (!facts.lesion) {
      if (protectedRelation) {
        results.push(incidentResult("POSIBLE DELITO EN RELACIÓN PROTEGIDA", "Código Penal · art. 153", "El golpe o maltrato, aun sin lesión, tiene trascendencia penal.", ["Proteger y separar.", "Documentar el episodio concreto."], "DELITO MENOS GRAVE", "warning"));
        regime = "no_leve";
        addConnection(connections, relationLink);
      } else {
        results.push(incidentResult("MALTRATO DE OBRA SIN LESIÓN", "Código Penal · art. 147.3", "Posible delito leve. En régimen general requiere denuncia de la persona agraviada.", ["Documentar la agresión y ausencia de lesión conocida.", "Comprobar antes si existe violencia de género o doméstica."], "DELITO LEVE"));
        regime = "leve";
      }
    } else if (facts.resultadoAsistencial === "tratamiento_posterior") {
      results.push(incidentResult("POSIBLE LESIÓN", "Código Penal · art. 147.1", "Existe necesidad objetiva de tratamiento médico o quirúrgico posterior. No se clasifica como delito leve.", ["Recabar asistencia o parte médico y circunstancias completas de la agresión.", "Documentar mecanismo, zona afectada y evolución conocida."], "DELITO NO LEVE"));
      regime = "no_leve";
      if (facts.medioPeligroso) results.push(incidentResult("POSIBLE LESIÓN AGRAVADA", "Código Penal · art. 148.1", "El medio empleado y el peligro concreto son relevantes para la calificación; su uso no activa este artículo automáticamente.", ["Describir el arma, instrumento, objeto o medio empleado.", "Asegurar el efecto y su relación objetiva con los hechos cuando proceda."], undefined, "warning"));
    } else if (facts.resultadoAsistencial === "primera_asistencia") {
      if (protectedRelation) {
        results.push(incidentResult("POSIBLE DELITO EN RELACIÓN PROTEGIDA", "Código Penal · art. 153", "La lesión de menor entidad tiene trascendencia penal en esta relación.", ["Proteger y separar.", "Documentar el episodio y el resultado asistencial."], "DELITO MENOS GRAVE", "warning"));
        regime = "no_leve";
        addConnection(connections, relationLink);
      } else {
        results.push(incidentResult("POSIBLE LESIÓN", "Código Penal · art. 147.2", "Posible delito leve. En régimen general requiere denuncia de la persona agraviada.", ["Recabar el parte y confirmar si se necesita tratamiento posterior.", "La asistencia hospitalaria por sí sola no determina el art. 147.1."], "DELITO LEVE"));
        regime = "leve";
      }
    } else {
      results.push(incidentResult("CLASIFICACIÓN PROVISIONAL", "Resultado médico pendiente", "No es posible distinguir todavía entre art. 147.1 y 147.2. Recabar asistencia o parte médico y circunstancias completas de la agresión.", ["Priorizar atención sanitaria cuando proceda.", "Actualizar la clasificación al conocer el resultado asistencial."], undefined, "warning"));
    }
    if (facts.resultadoEspecialGravedad) results.push(incidentResult("POSIBLES LESIONES DE ESPECIAL GRAVEDAD", "Código Penal · arts. 149/150", "Priorizar asistencia sanitaria, mecanismo de producción e indicios. Clasificación definitiva pendiente del resultado médico-forense.", ["Documentar el resultado observable sin exigir determinar órganos principales.", "Asegurar el mecanismo de producción y los indicios disponibles."], undefined, "danger"));
    if (facts.indiciosFinalidadMatar) results.push(incidentResult("⚠️ NO VALORAR ÚNICAMENTE COMO LESIONES", "Posible tentativa de homicidio/asesinato", "Los hechos pueden ser compatibles con tentativa de homicidio/asesinato. Recoger especialmente medio empleado, zona atacada, número e intensidad de acciones, expresiones y forma de finalización.", ["Documentar zona corporal, arma o medio, reiteración e intensidad.", "Documentar expresiones, conducta antes/durante/después y motivo por el que cesó la agresión."], undefined, "danger"));
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "El medio empleado se conserva como dato de la intervención." });
    if (facts.contextoSexual) addConnection(connections, { conceptId: "agresiones_sexuales", etiqueta: "Agresiones sexuales", motivo: "La lesión puede coexistir con el hecho sexual." });
    addConnection(connections, relationLink);
    if (regime === "no_leve") addComplaintNotice(false);
    return withIncidentProcessual({ resultados: results, conexiones: connections }, regime, input);
  }

  if (conceptId === "agresiones_sexuales") {
    if (facts.actoSexualNoConsentido === undefined) return pending("Indica si se refiere un acto de contenido sexual no consentido.");
    if (!facts.actoSexualNoConsentido) return { resultados: [incidentResult("SIN ACTO SEXUAL NO CONSENTIDO REFERIDO", "Datos de la intervención", "Valora otros bloques si existen lesiones, amenazas o coacciones.", basicIncidentAction, undefined, "neutral")], conexiones: [] };
    let regime: "no_leve" | undefined;
    if (facts.menorDieciseis) {
      results.push(incidentResult("VÍCTIMA MENOR DE 16 AÑOS", "Código Penal · art. 181", "Activar protección y tratamiento especializado de menor.", ["Proteger y activar la unidad especializada.", "Recoger solo los datos necesarios para la actuación inmediata."], "DELITO GRAVE", "danger"));
      regime = "no_leve";
    } else if (facts.penetracion) {
      results.push(incidentResult("POSIBLE VIOLACIÓN", relation === "vg" ? "Código Penal · arts. 179 y 180.1.4" : "Código Penal · art. 179", "Existe penetración en los términos legalmente previstos.", ["Proteger y separar víctima y presunto autor.", "Obtener solo el relato mínimo necesario para la actuación inmediata.", "Evitar interrogatorios exhaustivos o repeticiones innecesarias.", "Priorizar asistencia sanitaria o forense cuando proceda.", "Preservar indicios y evitar contaminación.", "Coordinar continuación con unidad competente o especializada."], "DELITO GRAVE", "warning"));
      regime = "no_leve";
    } else {
      results.push(incidentResult("POSIBLE AGRESIÓN SEXUAL", relation === "vg" ? "Código Penal · arts. 178 y 180.1.4" : "Código Penal · art. 178", "Se refiere un acto de contenido sexual no consentido.", ["Proteger y separar víctima y presunto autor.", "Obtener solo el relato mínimo necesario para la actuación inmediata.", "Evitar interrogatorios exhaustivos o repeticiones innecesarias.", "Priorizar asistencia sanitaria o forense cuando proceda.", "Preservar indicios y evitar contaminación.", "Coordinar continuación con unidad competente o especializada."], relation === "vg" ? "DELITO GRAVE" : "DELITO MENOS GRAVE", "warning"));
      regime = "no_leve";
    }
    if (facts.posibleSumisionQuimica) results.push(incidentResult("POSIBLE SUMISIÓN O VULNERABILIDAD QUÍMICA", "Atención sanitaria/forense urgente", "Posible sumisión o vulnerabilidad química. Atención sanitaria/forense urgente y comunicar expresamente la sospecha.", ["Comunicar pérdida de memoria, somnolencia, desorientación, pérdida de conciencia o sospecha de sustancias.", "Priorizar asistencia sanitaria y forense."], undefined, "danger"));
    if (facts.lesion) addConnection(connections, { conceptId: "agresiones_lesiones", etiqueta: "Lesiones", motivo: "Existen lesiones que deben valorarse en su bloque." });
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "El medio empleado es información complementaria." });
    addConnection(connections, relationLink);
    addComplaintNotice(true);
    return withIncidentProcessual({ resultados: results, conexiones: connections }, regime, input);
  }

  if (conceptId === "peleas_rinas") {
    if (!facts.tipoRina) return pending("Indica cómo se desarrolla el enfrentamiento físico.");
    const riñaTumultuaria = facts.tipoRina === "grupal_confusa" && facts.medioPeligroso;
    results.push(riñaTumultuaria
      ? incidentResult("POSIBLE RIÑA TUMULTUARIA", "Código Penal · art. 154", "Existe enfrentamiento recíproco y confuso entre varias personas y utilización de medios o instrumentos peligrosos.", ["Separar y hacer cesar la agresión.", "Identificar participantes, víctimas y testigos.", "Asegurar armas u objetos peligrosos.", "Individualizar conductas siempre que sea posible."], "DELITO MENOS GRAVE", "warning")
      : incidentResult("INDIVIDUALIZAR CONDUCTAS", "Actuación operativa", "No clasificar automáticamente como art. 154. Una pelea a puñetazos entre varias personas no basta por sí sola.", ["Separar y hacer cesar la agresión.", "Identificar participantes, víctimas y testigos.", "Individualizar agresiones y lesiones siempre que sea posible."], undefined, "neutral"));
    if (facts.lesion) addConnection(connections, { conceptId: "agresiones_lesiones", etiqueta: "Lesiones", motivo: facts.lesionIndividualizable ? "Puede identificarse quién causó una lesión concreta." : "Hay personas lesionadas que deben valorarse." });
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "Asegurar el medio empleado y describirlo." });
    if (facts.victimaAgente) addConnection(connections, { conceptId: "atentado", etiqueta: "Hechos contra los agentes", motivo: "La víctima puede ser agente; revisar el bloque específico." });
    addConnection(connections, relationLink);
    return withIncidentProcessual({ resultados: results, conexiones: connections }, riñaTumultuaria ? "no_leve" : undefined, input);
  }

  if (conceptId === "amenazas_coacciones") {
    if (!facts.conductaLibertad) return pending("Indica qué está haciendo la persona.");
    let regime: "leve" | "no_leve" | undefined;
    if (facts.conductaLibertad === "acoso") return { resultados: [incidentResult("VALORACIÓN ESPECÍFICA NECESARIA", "Acoso", "La conducta reiterada de vigilancia, persecución o contacto puede requerir valoración específica de acoso. Este bloque no se desarrolla todavía.", ["Documentar la reiteración, contactos, soportes y contexto.", "Coordinar la continuación con la unidad competente."], undefined, "warning")], conexiones: [] };
    if (facts.conductaLibertad === "amenaza") {
      if (facts.malAnunciado === "entidad_delictiva") {
        results.push(incidentResult("POSIBLE DELITO DE AMENAZAS", "Código Penal · arts. 169 y ss.", "La amenaza tiene entidad penal.", ["Recoger literalmente las expresiones.", "Documentar contexto, condición, medios y soportes."], "DELITO NO LEVE"));
        regime = "no_leve";
      }
      else if (facts.malAnunciado === "menor_entidad" && relation === "vg") {
        results.push(incidentResult("POSIBLE AMENAZA LEVE EN VIOLENCIA DE GÉNERO", "Código Penal · art. 171.4", "Aunque la conducta se denomine amenaza leve, no se clasifica como delito leve.", ["Documentar expresiones, contexto y relación.", "Aplicar la regla procesal correspondiente a delito menos grave."], "DELITO MENOS GRAVE", "warning"));
        regime = "no_leve";
      } else if (facts.malAnunciado === "menor_entidad" && relation === "domestica") results.push(incidentResult("POSIBLE AMENAZA EN ÁMBITO FAMILIAR PROTEGIDO", "Criterio doméstico aplicable", "Aplicar internamente el criterio doméstico correspondiente. No exigir denuncia cuando legalmente no corresponda.", ["Documentar expresiones, relación y contexto.", "Coordinar continuación con CNP."], undefined, "warning"));
      else if (facts.malAnunciado === "menor_entidad") {
        results.push(incidentResult("POSIBLE AMENAZA LEVE", "Código Penal · art. 171.7", "Posible delito leve. En régimen general requiere denuncia de la persona agraviada.", ["Recoger expresiones utilizadas y contexto.", "Informar de hechos y derechos; coordinar continuación y citación con CNP."], "DELITO LEVE"));
        regime = "leve";
      } else results.push(incidentResult("DATOS DE AMENAZA PENDIENTES", "Expresiones y contexto", "Indica el mal anunciado para orientar la actuación sin pedir una conclusión jurídica.", ["Recoger literalmente las expresiones utilizadas.", "Documentar destinatario, condición, medios y soportes."]));
    }
    if (facts.conductaLibertad === "coaccion") {
      if (facts.coaccionEntidad === "general") {
        results.push(incidentResult("POSIBLE COACCIÓN", "Código Penal · art. 172.1", "Existe una conducta que obliga o impide actuar contra la voluntad.", ["Documentar la acción concreta.", "Recoger violencia, intimidación, medios y contexto."], "DELITO MENOS GRAVE"));
        regime = "no_leve";
      }
      else if (facts.coaccionEntidad === "leve" && relation === "vg") {
        results.push(incidentResult("POSIBLE COACCIÓN LEVE EN VIOLENCIA DE GÉNERO", "Código Penal · art. 172.2", "Aunque la conducta se denomine coacción leve, no es delito leve.", ["Documentar la acción, contexto y relación.", "Aplicar la regla procesal correspondiente a delito menos grave."], "DELITO MENOS GRAVE", "warning"));
        regime = "no_leve";
      } else if (facts.coaccionEntidad === "leve" && relation === "domestica") results.push(incidentResult("POSIBLE COACCIÓN EN ÁMBITO FAMILIAR PROTEGIDO", "Criterio doméstico aplicable", "Aplicar internamente el criterio doméstico correspondiente. No exigir denuncia cuando legalmente no corresponda.", ["Documentar la acción, relación y contexto.", "Coordinar continuación con CNP."], undefined, "warning"));
      else if (facts.coaccionEntidad === "leve") {
        results.push(incidentResult("POSIBLE COACCIÓN LEVE", "Código Penal · art. 172.3", "Posible delito leve. En régimen general requiere denuncia de la persona agraviada.", ["Documentar la acción que obliga o impide actuar.", "Informar de hechos y derechos; coordinar continuación y citación con CNP."], "DELITO LEVE"));
        regime = "leve";
      } else results.push(incidentResult("DATOS DE COACCIÓN PENDIENTES", "Conducta observada", "Indica si la imposición o impedimento se aprecia por violencia o intimidación, o es de menor entidad.", ["Documentar la acción concreta: impedir salir, impedir acceso, quitar llaves u obligar a actuar.", "Recoger medios y contexto."]));
    }
    if (facts.medioPeligroso) addConnection(connections, { conceptId: "objetos_peligrosos", etiqueta: "Armas / objeto peligroso", motivo: "Se exhibe o utiliza como medio de intimidación." });
    addConnection(connections, relationLink);
    if (regime === "no_leve") addComplaintNotice(false);
    return withIncidentProcessual({ resultados: results, conexiones: connections }, regime, input);
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
export type WeaponOutcome = {
  kind: "sin_conclusion_automatica" | "porte_coherente" | "valoracion_porte" | "ocupacion_preventiva" | "valoracion_especifica" | "administrativa" | "posible_penal" | "derivacion_penal" | "penal";
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
      situacion: "DILIGENCIAS DE PREVENCIÓN",
      detencion: "NO",
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
