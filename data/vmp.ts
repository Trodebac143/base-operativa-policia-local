import guideJson from "../contenido/seguridad_vial/vmp/guia.json";

export type VmpCategory = "A" | "B" | "NO_VMP" | "INCOMPLETA";
export type VmpReason =
  | "categoria_a_ligero"
  | "categoria_a_pesado_lento"
  | "categoria_b"
  | "velocidad_fabrica_superior_25"
  | "fuera_rango_velocidad"
  | "mas_de_una_plaza"
  | "asiento_sin_autoequilibrado"
  | "no_electrico"
  | "otros_requisitos_no_cumplidos"
  | "datos_incompletos";

export type VmpClassificationInput = {
  electric: boolean | null;
  seats: number | null;
  hasSeat: boolean | null;
  selfBalancing: boolean | null;
  factoryMaxSpeed: number | null;
  mass: number | null;
  meetsOtherRequirements: boolean | null;
  modified: boolean;
  observedMaxSpeed?: number | null;
};

export type VmpClassification = {
  category: VmpCategory;
  reason: VmpReason;
  title: string;
  detail: string;
  originalCategoryPreserved: boolean;
  technicalViolationId: "5D" | null;
  forbidsVmpDocumentSanctions: boolean;
};

export type VmpDocumentInput = {
  category: VmpCategory;
  marketedBeforeCutoff: boolean;
  asOf: string;
  hasCertificate: boolean;
  registered: boolean;
  hasIdentificationLabel: boolean;
  hasMarkingPlate: boolean;
};

export type VmpInfraction = {
  id: string;
  codigo: string;
  articulo?: string;
  titulo: string;
  descripcion_operativa?: string;
  calificacion: string;
  importe: number;
  reducido: number;
  absorbe?: string[];
  puntos?: number;
  responsable?: string;
  fuentes?: string[];
};

export type VmpCirculationFacts = {
  road?: "urbana_municipal" | "urbana_otra" | "travesia" | "interurbana";
  lightCondition?: "dia" | "noche" | "visibilidad_reducida";
  elementCompliant?: boolean | null;
  professional?: boolean | null;
  place?: "acera" | "zona_peatonal" | "travesia" | "interurbana" | "tunel_urbano" | "autopista_autovia" | null;
  signProhibits?: boolean | null;
  widthOverThree?: boolean | null;
  pedestrianSeparation?: boolean | null;
  buildingSeparation?: boolean | null;
  pedestrianPriority?: boolean | null;
  speedAtMostSix?: boolean | null;
  cyclewayOrMotorBan?: boolean | null;
};

export type VmpCirculationResult = {
  decision: "denuncia" | "no" | "pendiente";
  item: VmpInfraction | null;
  message: string;
  observation?: string;
  competence: string;
  sourceIds: string[];
};

export type VmpDocumentationResult = {
  applicable: boolean;
  transitional: boolean;
  certificateRequired: boolean;
  complaints: VmpInfraction[];
  message: string;
};

export type VmpInsuranceInput = {
  category: VmpCategory;
  certificateRequired?: boolean | null;
  hasCertificate?: boolean | null;
  registered?: boolean | null;
  hasIdentificationLabel?: boolean | null;
  insured: boolean;
  circulating: boolean;
  documentedMotorClass?: "MOTOR" | "OTHER" | null;
};

export type VmpInsuranceResult = {
  regime: "SDA" | "SOA" | "NINGUNO";
  complaint: boolean | null;
  caseId: string | null;
  message: string;
};

type TechnicalMeasure = {
  inmovilizacion: boolean;
  deposito: boolean;
  informe: boolean;
  fotografias: boolean;
  diligencias: boolean;
};

export type VmpOperationalOutput = {
  denuncia: boolean;
  codigo: string | null;
  articulo: string | null;
  descripcion: string;
  importe: number | null;
  reducido: number | null;
  deposito: boolean;
  inmovilizacion: boolean;
  informe: boolean;
  fotografias: boolean;
  diligencias: boolean;
  acta: string | null;
  actuacion: string[];
  datos: string[];
};

type PracticalFacts = {
  clasificacion?: Partial<VmpClassificationInput>;
  documentacion?: Omit<VmpDocumentInput, "category" | "asOf">;
  seguro?: Pick<VmpInsuranceInput, "insured" | "circulating">;
  tecnica?: "5D" | "5E" | "5F";
  variantes?: Array<Partial<VmpClassificationInput>>;
};

export type VmpPracticalCase = {
  id: string;
  titulo: string;
  situacion: string;
  datos_clave: string[];
  que_comprobar: string[];
  por_que: string;
  hechos: PracticalFacts;
};

type GuideShape = {
  id: string;
  categoria: string;
  titulo: string;
  subtitulo: string;
  fuente_manual: string;
  fecha_referencia: string;
  areas: Array<{ id: "clasificacion" | "documentacion" | "seguro" | "tecnica" | "circulacion" | "alcohol" | "menores"; icono: string; titulo: string; descripcion: string; orden: number }>;
  clasificacion: { aviso: string; categoria_a: string; categoria_b: string; no_vmp: string; modificacion: string; datos_minimos: string[] };
  documentacion: { fin_transitorio: string; comercializacion_corte: string; aviso_transitorio: string; infracciones: VmpInfraction[] };
  seguro: {
    categoria_a_casos: { circulando: string; carecer: string };
    categoria_b_casos: { circulando: string; carecer: string };
    sin_denuncia: string;
    no_vmp: string;
  };
  tecnica: {
    infracciones: Array<VmpInfraction & { inmovilizacion: boolean; informe: boolean }>;
    no_vmp_no_matriculable: VmpInfraction;
    comprobaciones: string[];
    medidas: { acta: string; actuacion_base: string[]; "5D": TechnicalMeasure; "5E": TechnicalMeasure; "5F": TechnicalMeasure; NO_MATRICULABLE: TechnicalMeasure };
  };
  circulacion: {
    maniobras: { recordatorio: string; limite_codificacion: string; fuentes: string[] };
    infracciones: Array<VmpInfraction & { vigente_desde?: string }>;
  };
  menores: { edad_minima: number; vigente_desde: string; regla: string; datos_responsable: string; alcohol: string; infraccion: Omit<VmpInfraction, "id"> };
  casos_practicos: VmpPracticalCase[];
  incidencias: string[];
};

/** Adaptador técnico: el contenido mantenible vive una sola vez en contenido/seguridad_vial/vmp/guia.json. */
export const vmpGuide = guideJson as GuideShape;

const completeFacts: VmpClassificationInput = {
  electric: true,
  seats: 1,
  hasSeat: false,
  selfBalancing: true,
  factoryMaxSpeed: null,
  mass: null,
  meetsOtherRequirements: true,
  modified: false,
  observedMaxSpeed: null,
};

function incomplete(input: VmpClassificationInput): boolean {
  return input.electric == null
    || input.seats == null
    || input.hasSeat == null
    || (input.hasSeat && input.selfBalancing == null)
    || input.factoryMaxSpeed == null
    || input.mass == null
    || input.meetsOtherRequirements == null;
}

function classificationResult(category: VmpCategory, reason: VmpReason, title: string, detail: string, modified = false): VmpClassification {
  return {
    category,
    reason,
    title,
    detail: modified ? `${detail} ${vmpGuide.clasificacion.modificacion}` : detail,
    originalCategoryPreserved: modified && (category === "A" || category === "B"),
    technicalViolationId: modified && (category === "A" || category === "B") ? "5D" : null,
    forbidsVmpDocumentSanctions: category === "NO_VMP",
  };
}

export function classifyVmp(input: VmpClassificationInput): VmpClassification {
  if (incomplete(input)) return classificationResult("INCOMPLETA", "datos_incompletos", "Completa las características", "Introduce los datos de fábrica necesarios para obtener el resultado.");
  if (!input.electric) return classificationResult("NO_VMP", "no_electrico", "No es VMP", "No consta propulsión exclusivamente eléctrica.");
  if ((input.seats ?? 0) > 1) return classificationResult("NO_VMP", "mas_de_una_plaza", "No es VMP", "Dispone de más de una plaza; determinar la clase real antes de denunciar.");
  if (input.hasSeat && !input.selfBalancing) return classificationResult("NO_VMP", "asiento_sin_autoequilibrado", "No es VMP", "El asiento no está vinculado a un sistema de autoequilibrado.");
  if (!input.meetsOtherRequirements) return classificationResult("NO_VMP", "otros_requisitos_no_cumplidos", "No es VMP", "No cumple los restantes requisitos definitorios; determinar la clase real mediante documentación técnica.");
  if ((input.factoryMaxSpeed ?? 0) > 25) return classificationResult("NO_VMP", "velocidad_fabrica_superior_25", "No es VMP: supera 25 km/h de fábrica", "No aplicar 5A, 5B ni 5C. Determinar la clase real mediante ficha o informe técnico antes de resolver autorización, matrícula, permiso y seguro.");
  if ((input.factoryMaxSpeed ?? 0) < 6) return classificationResult("NO_VMP", "fuera_rango_velocidad", "No es VMP", "La velocidad de fábrica queda fuera del intervalo definitorio de 6–25 km/h.");
  if ((input.mass ?? 0) <= 25) return classificationResult("A", "categoria_a_ligero", "VPL", vmpGuide.clasificacion.categoria_a, input.modified);
  if ((input.factoryMaxSpeed ?? 0) <= 14) return classificationResult("A", "categoria_a_pesado_lento", "VPL", vmpGuide.clasificacion.categoria_a, input.modified);
  return classificationResult("B", "categoria_b", "VMP · vehículo a motor a efectos del seguro", vmpGuide.clasificacion.categoria_b, input.modified);
}

function onOrBefore(value: string, limit: string): boolean {
  return value <= limit;
}

export function isVmpCertificateRequired(marketedBeforeCutoff: boolean, asOf: string): boolean {
  return !(marketedBeforeCutoff && onOrBefore(asOf, vmpGuide.documentacion.fin_transitorio));
}

export function resolveVmpDocumentation(input: VmpDocumentInput): VmpDocumentationResult {
  const certificateRequired = isVmpCertificateRequired(input.marketedBeforeCutoff, input.asOf);
  const transitional = !certificateRequired;
  if (input.category === "NO_VMP") return { applicable: false, transitional, certificateRequired, complaints: [], message: "No aplicar 5A, 5B ni 5C: no es VMP. Determinar la clase real." };
  if (input.category === "INCOMPLETA") return { applicable: false, transitional, certificateRequired, complaints: [], message: "Completa primero las características de fábrica." };

  const byId = new Map(vmpGuide.documentacion.infracciones.map((item) => [item.id, item]));
  if (certificateRequired && !input.hasCertificate) return { applicable: true, transitional, certificateRequired, complaints: [byId.get("5A")!], message: "Falta el certificado de circulación exigible. La denuncia por esta falta comprende también las carencias posteriores de inscripción o identificación." };
  if (!input.registered) return { applicable: true, transitional, certificateRequired, complaints: [byId.get("5B")!], message: "El VMP no consta inscrito en la DGT. La falta de etiqueta queda comprendida en esta denuncia documental." };
  const missingIdentification = !input.hasIdentificationLabel || (input.hasCertificate && !input.hasMarkingPlate);
  if (missingIdentification) return { applicable: true, transitional, certificateRequired, complaints: [byId.get("5C")!], message: !input.hasIdentificationLabel ? "Falta la etiqueta identificativa exigible de la DGT." : "Falta la placa de marcaje exigible en este VMP certificado." };
  return {
    applicable: true,
    transitional,
    certificateRequired,
    complaints: [],
    message: transitional && !input.hasCertificate
      ? "Sin 5A hasta el 22/01/2027 por la moratoria del certificado; la inscripción y la identificación sí son obligatorias."
      : "Sin infracción documental con los datos indicados.",
  };
}

export function resolveVmpInsurance(input: VmpInsuranceInput): VmpInsuranceResult {
  if (input.category === "INCOMPLETA") return { regime: "NINGUNO", complaint: null, caseId: null, message: "Introduce MOM, velocidad máxima de fabricación y los demás datos definitorios." };
  if (input.category === "NO_VMP") {
    if (input.documentedMotorClass == null) return { regime: "NINGUNO", complaint: null, caseId: null, message: vmpGuide.seguro.no_vmp };
    if (input.documentedMotorClass === "OTHER") return { regime: "NINGUNO", complaint: null, caseId: null, message: "La clase acreditada no permite resolver aquí el seguro. Comprueba el régimen que le corresponde antes de decidir si procede denuncia." };
    if (input.insured) return { regime: "SOA", complaint: false, caseId: null, message: "Seguro en vigor: sin infracción por aseguramiento." };
    return { regime: "SOA", complaint: true, caseId: input.circulating ? "TR-SOA-OP-001" : "TR-SOA-OP-002", message: "Aplicar el caso común de Seguro correspondiente a la clase real acreditada." };
  }
  if (input.insured) return { regime: input.category === "A" ? "SDA" : "SOA", complaint: false, caseId: null, message: "Seguro en vigor: sin infracción por aseguramiento." };
  if (input.category === "A") {
    const requirementsKnown = input.hasCertificate != null && input.registered != null && input.hasIdentificationLabel != null;
    if (!requirementsKnown) return { regime: "NINGUNO", complaint: null, caseId: null, message: "Comprueba si tiene certificado de circulación, inscripción y etiqueta identificativa antes de resolver el seguro específico del VPL." };
    if (!input.hasCertificate) return { regime: "NINGUNO", complaint: false, caseId: null, message: input.certificateRequired === false
      ? "No procede denuncia por el seguro específico VPL: circula durante el período transitorio sin certificado de circulación, pero ese certificado sigue siendo requisito previo para esta infracción. Comprueba inscripción y etiqueta por separado."
      : "No procede denuncia por el seguro específico VPL porque falta el certificado de circulación. Comprueba la infracción documental que corresponda." };
    if (!input.registered) return { regime: "NINGUNO", complaint: false, caseId: null, message: "No procede denuncia por el seguro específico VPL porque no consta su inscripción en la DGT. Valora la infracción documental por falta de inscripción." };
    if (!input.hasIdentificationLabel) return { regime: "NINGUNO", complaint: false, caseId: null, message: "No procede denuncia por el seguro específico VPL porque falta la etiqueta identificativa. Valora la infracción documental por identificación." };
    return { regime: "SDA", complaint: true, caseId: input.circulating ? vmpGuide.seguro.categoria_a_casos.circulando : vmpGuide.seguro.categoria_a_casos.carecer, message: "Aplicar la rama SDA común para VPL con los requisitos previos cumplidos." };
  }
  return { regime: "SOA", complaint: true, caseId: input.circulating ? vmpGuide.seguro.categoria_b_casos.circulando : vmpGuide.seguro.categoria_b_casos.carecer, message: "Aplicar SOA con independencia del certificado, inscripción o etiqueta VMP." };
}

function operationalOutput(item: VmpInfraction, measure: TechnicalMeasure): VmpOperationalOutput {
  const extraActions = [
    ...(measure.inmovilizacion && !measure.deposito ? ["No retirar al depósito por esta medida técnica; el titular necesita el vehículo para subsanar."] : []),
    ...(measure.fotografias ? ["Realizar reportaje fotográfico del vehículo, placa y elementos relevantes."] : []),
    ...(measure.informe ? ["Adjuntar informe técnico de las características o modificaciones acreditadas."] : []),
    ...(measure.diligencias ? ["Instruir diligencias a prevención cuando corresponda."] : []),
  ];
  return {
    denuncia: true,
    codigo: item.codigo,
    articulo: item.articulo ?? item.codigo,
    descripcion: item.descripcion_operativa ?? item.titulo,
    importe: item.importe,
    reducido: item.reducido,
    deposito: measure.deposito,
    inmovilizacion: measure.inmovilizacion,
    informe: measure.informe,
    fotografias: measure.fotografias,
    diligencias: measure.diligencias,
    acta: measure.inmovilizacion ? vmpGuide.tecnica.medidas.acta : null,
    actuacion: [...vmpGuide.tecnica.medidas.actuacion_base, ...extraActions],
    datos: vmpGuide.clasificacion.datos_minimos,
  };
}

export function resolveVmpTechnical(infractionId: "5D" | "5E" | "5F" | "ninguna"): VmpOperationalOutput | null {
  if (infractionId === "ninguna") return null;
  const item = vmpGuide.tecnica.infracciones.find((candidate) => candidate.id === infractionId);
  return item ? operationalOutput(item, vmpGuide.tecnica.medidas[infractionId]) : null;
}

export function resolveNonVmpRoute(route: "UE_168_2013" | "NO_MATRICULABLE" | null): VmpOperationalOutput | null {
  if (route !== "NO_MATRICULABLE") return null;
  return operationalOutput(vmpGuide.tecnica.no_vmp_no_matriculable, vmpGuide.tecnica.medidas.NO_MATRICULABLE);
}

export function resolveVmpCirculation(infractionId: string, asOf: string, facts: VmpCirculationFacts = {}): VmpCirculationResult | null {
  const item = vmpGuide.circulacion.infracciones.find((candidate) => candidate.id === infractionId);
  if (!item) return null;
  const road = facts.place === "travesia" ? "travesia" : facts.place === "interurbana" ? "interurbana" : facts.place === "autopista_autovia" || facts.place === "tunel_urbano" ? facts.road ?? "urbana_otra" : facts.road ?? "urbana_municipal";
  const competence = road === "urbana_municipal"
    ? "Ayuntamiento de Torrent: infracción de circulación en vía urbana de su competencia (art. 84.4 LSV)."
    : road === "travesia" || road === "interurbana"
      ? "Jefatura de Tráfico: travesía o vía interurbana; verificar la titularidad y el expediente (art. 84.1 LSV)."
      : "Verificar autoridad competente de esta vía urbana antes de tramitar (art. 84 LSV).";
  const sourceIds = [...new Set([...(item.fuentes ?? (item.codigo.includes("O.O.M.M") ? ["TR-MOV-SRC-001"] : ["ALC-SRC-RGC"])), "TR-ITV-SRC-001"])];
  const answer = (decision: VmpCirculationResult["decision"], message: string, sanction: VmpInfraction | null = decision === "denuncia" ? item : null, observation?: string): VmpCirculationResult => {
    const uncertainCompetence = decision === "denuncia" && road === "urbana_otra";
    return {
      decision: uncertainCompetence ? "pendiente" : decision,
      item: uncertainCompetence ? null : sanction,
      message: uncertainCompetence ? `${message} La competencia de esta vía urbana no está acreditada: verificarla antes de denunciar.` : message,
      observation,
      competence,
      sourceIds: [...new Set([...(sanction?.fuentes ?? sourceIds), "TR-ITV-SRC-001"])],
    };
  };
  const amended = asOf >= "2026-10-01";
  if (item.vigente_desde && !amended) {
    if (infractionId === "casco") return answer("denuncia", "Antes de la reforma estatal se aplica la obligación municipal de casco.", { ...item, codigo: "Art. 39 bis.2.4 O.O.M.M.", articulo: "Art. 39 bis.2.4 Ordenanza de Torrent", fuentes: ["TR-MOV-SRC-001"] });
    return answer("pendiente", "La reforma estatal todavía no estaba en vigor en la fecha indicada. Revisar la regulación aplicable entonces; sin denuncia automática con este codificado.");
  }

  if (infractionId === "casco") return answer("denuncia", "Comprobar casco homologado o certificado y correctamente abrochado. VMP: 0 puntos.", item, "La ordenanza (art. 39 bis.2.4) contiene la obligación de casco; utilizar el precepto estatal y ARCI actualizados para esta conducta.");
  if (infractionId === "visibilidad") {
    if (!facts.lightCondition) return answer("pendiente", "Indicar si es de día, de noche o hay visibilidad reducida.");
    if (facts.lightCondition === "dia") return answer("no", "De día y con visibilidad normal no se exige este elemento personal por el art. 118.3 RGC.");
    if (facts.elementCompliant == null) return answer("pendiente", "Comprobar al menos un elemento luminoso o reflectante conforme a EPI y visible a 150 m.");
    if (facts.elementCompliant) return answer("no", "El elemento personal exigido cumple las condiciones indicadas.");
    return answer("denuncia", "Entre ocaso y salida del sol, o con visibilidad sensiblemente reducida: elemento luminoso o reflectante conforme a EPI visible a 150 m. VMP: 0 puntos.", item, "La ordenanza (art. 39 bis.2.6) solo lo recomienda; la obligación estatal posterior prevalece. No confundir con el chaleco profesional.");
  }
  if (infractionId === "alumbrado") {
    if (!facts.lightCondition) return answer("pendiente", "Indicar si circulaba de día, de noche o con visibilidad reducida.");
    if (facts.lightCondition === "dia" && asOf < "2027-10-01") return answer("no", "El alumbrado diurno todavía no es exigible: disposición transitoria tercera del RD 518/2026. No generar CIR 155.5.5A.");
    return answer("denuncia", "Alumbrado apagado cuando su uso ya es exigible. De noche rige desde el 01/10/2026; de día, desde el 01/10/2027. VMP: 0 puntos.", item, "La ordenanza (art. 39 bis.2.7) regula la dotación del alumbrado, pero no sustituye la regla estatal de uso ni su régimen transitorio.");
  }
  if (infractionId === "chaleco_profesional") {
    if (facts.professional == null) return answer("pendiente", "Confirmar que el conductor desarrollaba actividad profesional utilizando el VMP.");
    return facts.professional ? answer("denuncia", "Actividad profesional en VMP sin chaleco reflectante de alta visibilidad conforme a EPI. Exigible en todo tipo de vías; 0 puntos.", item, "Obligación distinta del elemento personal de visibilidad nocturna del art. 118.3 RGC.") : answer("no", "La obligación específica de chaleco profesional no se aplica si no desarrolla actividad profesional con el VMP.");
  }
  if (infractionId === "lugar") {
    if (!facts.place) return answer("pendiente", "Seleccionar el tipo de espacio; una acera no es una calle peatonal.");
    if (facts.place === "acera") return answer("denuncia", "Circular montado en VMP por acera está prohibido, cualquiera que sea su anchura.", { ...item, codigo: "CIR 152.1.5A", articulo: "Art. 152.1 RGC", titulo: "Circular con un VMP por la acera", calificacion: "Leve", importe: 100, reducido: 50, puntos: 0, responsable: "Conductor" }, "La ordenanza (art. 39 bis.3.2 y anexo I) prevé 200 € para el supuesto agregado; aplicar el precepto estatal específico y el ARCI vigente de 100 €.");
    if (facts.place === "zona_peatonal") {
      const checks = [facts.signProhibits === false, facts.widthOverThree, facts.pedestrianSeparation, facts.buildingSeparation, facts.pedestrianPriority, facts.speedAtMostSix];
      if (checks.every((check) => check === true)) return answer("no", "La ordenanza de Torrent (art. 39 bis.3.3) permite circular: sin señal de prohibición, paso libre >3 m, separación de 1 m de peatones en cruces/adelantamientos y edificios, prioridad peatonal y velocidad ≤6 km/h.");
      if (facts.signProhibits == null || checks.some((check) => check == null)) return answer("pendiente", "Completar las seis condiciones de la ordenanza antes de resolver la circulación en zona peatonal.");
      return answer("denuncia", "La circulación en zona peatonal no reúne todas las condiciones del art. 39 bis.3.3 de Torrent; consignar cuál se incumplió.", { ...item, codigo: "Art. 39 bis O.O.M.M.", articulo: "Art. 39 bis.3.3 y anexo I Ordenanza de Torrent", titulo: "Circular por zona peatonal incumpliendo las condiciones municipales", calificacion: "Grave", importe: 200, reducido: 100, puntos: 0, responsable: "Conductor" }, "La excepción municipal es compatible con el art. 152.1 RGC. Este supuesto utiliza el código de la ordenanza, no un ARCI estatal específico.");
    }
    if (facts.place === "travesia" || facts.place === "autopista_autovia") return answer("denuncia", "La prohibición estatal no tiene excepción de vía ciclista para este tipo de vía.", { ...item, codigo: "CIR 038.4.5B", articulo: `Art. 38.4.${facts.place === "travesia" ? "b" : "a"} RGC`, titulo: "Circular con VMP por vía prohibida", calificacion: "Grave", importe: 200, reducido: 100, puntos: 0, responsable: "Conductor" });
    if (facts.cyclewayOrMotorBan == null || facts.signProhibits == null) return answer("pendiente", "Comprobar si es vía ciclista o vía sin vehículos de motor y si existe señal que prohíba el VMP.");
    if (facts.cyclewayOrMotorBan && !facts.signProhibits) return answer("no", "La excepción del art. 38.4.c RGC permite este itinerario sin señal prohibitiva.", null, "La prohibición general del art. 39 bis.3.4 municipal se opone a esta excepción estatal; aplicar el art. 38.4.c RGC. Confirmar la clase de vía y señalización.");
    return answer("denuncia", "Fuera de la excepción estatal, la circulación de VMP en esta vía está prohibida.", { ...item, codigo: "CIR 038.4.5B", articulo: "Art. 38.4.c RGC", titulo: "Circular con VMP por vía interurbana o túnel urbano prohibido", calificacion: "Grave", importe: 200, reducido: 100, puntos: 0, responsable: "Conductor" }, "El art. 39 bis.3.4 municipal no refleja la excepción estatal; utilizar art. 38.4.c RGC y CIR 038.4.5B.");
  }
  return answer("denuncia", "Conducta seleccionada constatada. Comprobar los elementos de la infracción y el ámbito de la vía antes de tramitar.");
}

export function resolveVmpMinor(age: number, asOf: string, road: VmpCirculationFacts["road"] = "urbana_municipal") {
  const active = asOf >= vmpGuide.menores.vigente_desde;
  const prohibited = active && age < vmpGuide.menores.edad_minima;
  const competence = road === "urbana_municipal"
    ? "Ayuntamiento de Torrent en vía urbana de su competencia (art. 84.4 LSV)."
    : road === "travesia" || road === "interurbana"
      ? "Jefatura de Tráfico en travesía o vía interurbana (art. 84.1 LSV)."
      : "Competencia de la vía urbana pendiente de acreditar (art. 84 LSV).";
  return {
    active,
    prohibited,
    infraction: prohibited && road !== "urbana_otra" ? vmpGuide.menores.infraccion : null,
    competence,
    sourceIds: vmpGuide.menores.infraccion.fuentes ?? [],
    message: !active
      ? "La prohibición por edad todavía no está vigente en la fecha indicada."
      : prohibited
        ? `${vmpGuide.menores.regla} ${vmpGuide.menores.datos_responsable}${road === "urbana_otra" ? " Verificar la competencia de la vía antes de denunciar." : ""}`
        : "No se activa la prohibición por edad con los datos indicados.",
  };
}

export function resolveVmpPracticalCase(caseId: string) {
  const item = vmpGuide.casos_practicos.find((candidate) => candidate.id === caseId);
  if (!item) return null;
  if (item.hechos.variantes) {
    return { item, variants: item.hechos.variantes.map((facts) => classifyVmp({ ...completeFacts, ...facts })), classification: null, documentation: null, insurance: null, technical: null };
  }
  const classification = classifyVmp({ ...completeFacts, ...item.hechos.clasificacion });
  const documentation = item.hechos.documentacion
    ? resolveVmpDocumentation({ ...item.hechos.documentacion, category: classification.category, asOf: vmpGuide.fecha_referencia })
    : null;
  const insurance = item.hechos.seguro
    ? resolveVmpInsurance({
        ...item.hechos.seguro,
        category: classification.category,
        certificateRequired: documentation?.certificateRequired,
        hasCertificate: item.hechos.documentacion?.hasCertificate,
        registered: item.hechos.documentacion?.registered,
        hasIdentificationLabel: item.hechos.documentacion?.hasIdentificationLabel,
      })
    : null;
  const technical = item.hechos.tecnica ? resolveVmpTechnical(item.hechos.tecnica) : null;
  return { item, variants: [], classification, documentation, insurance, technical };
}
