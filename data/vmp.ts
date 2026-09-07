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
  circulacion: { infracciones: Array<VmpInfraction & { vigente_desde?: string }> };
  menores: { edad_minima: number; vigente_desde: string; regla: string; datos_responsable: string; alcohol: string };
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
  if (certificateRequired && !input.hasCertificate) return { applicable: true, transitional, certificateRequired, complaints: [byId.get("5A")!], message: "Denunciar 5A. Absorbe 5B y 5C." };
  if (!input.registered) return { applicable: true, transitional, certificateRequired, complaints: [byId.get("5B")!], message: "Denunciar 5B. Absorbe 5C." };
  const missingIdentification = !input.hasIdentificationLabel || (input.hasCertificate && !input.hasMarkingPlate);
  if (missingIdentification) return { applicable: true, transitional, certificateRequired, complaints: [byId.get("5C")!], message: "Denunciar 5C por la identificación exigible ausente." };
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
    if (input.documentedMotorClass === "OTHER") return { regime: "NINGUNO", complaint: false, caseId: null, message: "La documentación aportada no permite aplicar automáticamente el régimen SOA; continuar por la clase real acreditada." };
    if (input.insured) return { regime: "SOA", complaint: false, caseId: null, message: "Seguro en vigor: sin infracción por aseguramiento." };
    return { regime: "SOA", complaint: true, caseId: input.circulating ? "TR-SOA-OP-001" : "TR-SOA-OP-002", message: "Aplicar el caso común de Seguro correspondiente a la clase real acreditada." };
  }
  if (input.insured) return { regime: input.category === "A" ? "SDA" : "SOA", complaint: false, caseId: null, message: "Seguro en vigor: sin infracción por aseguramiento." };
  if (input.category === "A") {
    const requirementsKnown = input.certificateRequired != null && input.hasCertificate != null && input.registered != null && input.hasIdentificationLabel != null;
    if (!requirementsKnown) return { regime: "NINGUNO", complaint: null, caseId: null, message: "Completa certificado, inscripción y etiqueta para resolver el régimen SDA." };
    const prerequisites = (!input.certificateRequired || input.hasCertificate) && input.registered && input.hasIdentificationLabel;
    if (!prerequisites) return { regime: "NINGUNO", complaint: false, caseId: null, message: vmpGuide.seguro.sin_denuncia };
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

export function resolveVmpCirculation(infractionId: string, asOf: string) {
  const item = vmpGuide.circulacion.infracciones.find((candidate) => candidate.id === infractionId);
  if (!item) return null;
  const active = !item.vigente_desde || asOf >= item.vigente_desde;
  return { ...item, active, message: active ? "Precepto aplicable en la fecha indicada." : `Todavía no aplicable. Entrada en vigor: ${item.vigente_desde!.split("-").reverse().join("/")}.` };
}

export function resolveVmpMinor(age: number, asOf: string) {
  const active = asOf >= vmpGuide.menores.vigente_desde;
  const prohibited = active && age < vmpGuide.menores.edad_minima;
  return {
    active,
    prohibited,
    message: !active
      ? "La prohibición por edad todavía no está vigente en la fecha indicada."
      : prohibited
        ? `${vmpGuide.menores.regla} ${vmpGuide.menores.datos_responsable}`
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
