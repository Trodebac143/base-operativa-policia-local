import inspectionJson from "../contenido/policia_administrativa/establecimientos/inspeccion.json";

export type InspectionOrigin = "AUTONÓMICA" | "MUNICIPAL" | "MIXTA" | "NORMATIVA ESPECÍFICA";
export type InspectionFilter = "TODAS" | "AUTONÓMICA" | "MUNICIPAL" | "MIXTA";
export type InspectionStatus = "no_comprobado" | "correcto" | "irregular";
export type InspectionAnswer = string | string[];
export type InspectionAnswers = Record<string, InspectionAnswer>;
export type InspectionState = Record<string, { estado: InspectionStatus; respuestas: InspectionAnswers }>;
export type InspectionRoute = "LEY_14_2010" | "MUNICIPAL" | "ESPECIFICA";
export type InspectionClassification = "LEVE" | "GRAVE" | "MUY GRAVE" | "PENDIENTE";

export type InspectionOption = { valor: string; etiqueta: string };
export type InspectionQuestion = {
  id: string;
  etiqueta: string;
  tipo: "opcion" | "multiple" | "numero" | "texto" | "texto_largo" | "hora" | "fecha";
  opciones?: InspectionOption[];
  placeholder?: string;
  unidad?: string;
  anexo: string;
};
export type InspectionCondition = {
  campo: string;
  igual?: string;
  uno_de?: string[];
  ninguno_de?: string[];
  contiene?: string;
  contiene_alguno?: string[];
  no_vacio?: boolean;
  vacio?: boolean;
  menor_que?: number;
  mayor_que_campo?: string;
};
export type InspectionIncidentDefinition = {
  id: string;
  titulo: string;
  via: InspectionRoute;
  norma: string;
  articulo: string;
  clasificacion: InspectionClassification;
  documento?: string;
  destino?: string;
  cuando: InspectionCondition[];
  cuando_alguno?: InspectionCondition[];
  anexo_campos: string[];
  recordatorios: string[];
};
export type InspectionControl = {
  id: string;
  icono: string;
  titulo: string;
  origen: InspectionOrigin;
  referencia: string;
  resumen: string;
  plegado?: boolean;
  preguntas: InspectionQuestion[];
  resultados: InspectionIncidentDefinition[];
};
export type InspectionData = {
  id: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  fuentes: string[];
  reglas_comunes: { anexo: string; competencia: string; acumulacion: string };
  controles: InspectionControl[];
};
export type ResolvedIncident = InspectionIncidentDefinition & {
  controlId: string;
  controlTitulo: string;
  controlIcono: string;
  datosAnexo: Array<{ etiqueta: string; valor: string }>;
};
export type ResolvedGroup = {
  via: InspectionRoute;
  titulo: string;
  incidencias: ResolvedIncident[];
  documento: string;
  destino: string;
};
export type InspectionResolution = { grupos: ResolvedGroup[]; incidencias: ResolvedIncident[] };
export type InspectionAnnexSection = {
  controlId: string;
  controlTitulo: string;
  controlIcono: string;
  recordatorios: string[];
  datosAnexo: Array<{ etiqueta: string; valor: string }>;
};

export const establishmentsInspection = inspectionJson as InspectionData;
export const EMPTY_INSPECTION_ITEM = { estado: "no_comprobado" as const, respuestas: {} };

const isFilled = (answer: InspectionAnswer | undefined) => Array.isArray(answer) ? answer.length > 0 : typeof answer === "string" && answer.trim().length > 0;
const numeric = (answer: InspectionAnswer | undefined) => typeof answer === "string" && answer.trim() ? Number(answer.replace(",", ".")) : Number.NaN;

function conditionMatches(condition: InspectionCondition, answers: InspectionAnswers): boolean {
  const answer = condition.campo === "_irregular" ? "si" : answers[condition.campo];
  if (condition.igual !== undefined) return answer === condition.igual;
  if (condition.uno_de) return typeof answer === "string" && condition.uno_de.includes(answer);
  if (condition.ninguno_de) return typeof answer !== "string" || !condition.ninguno_de.includes(answer);
  if (condition.contiene) return Array.isArray(answer) && answer.includes(condition.contiene);
  if (condition.contiene_alguno) return Array.isArray(answer) && condition.contiene_alguno.some((value) => answer.includes(value));
  if (condition.no_vacio) return isFilled(answer);
  if (condition.vacio) return !isFilled(answer);
  if (condition.menor_que !== undefined) {
    const value = numeric(answer);
    return Number.isFinite(value) && value < condition.menor_que;
  }
  if (condition.mayor_que_campo) {
    const left = numeric(answer);
    const right = numeric(answers[condition.mayor_que_campo]);
    return Number.isFinite(left) && Number.isFinite(right) && left > right;
  }
  return false;
}

function answerLabel(question: InspectionQuestion, answer: InspectionAnswer): string {
  if (Array.isArray(answer)) return answer.map((value) => question.opciones?.find((option) => option.valor === value)?.etiqueta ?? value).join(", ");
  const value = question.opciones?.find((option) => option.valor === answer)?.etiqueta ?? answer;
  return question.unidad && value ? `${value} ${question.unidad}` : value;
}

function incidentsForControl(control: InspectionControl, answers: InspectionAnswers): ResolvedIncident[] {
  return control.resultados
    .filter((candidate) => candidate.cuando.every((condition) => conditionMatches(condition, answers))
      && (!candidate.cuando_alguno?.length || candidate.cuando_alguno.some((condition) => conditionMatches(condition, answers))))
    .map((result) => {
      const fields = new Set(result.anexo_campos);
      const datosAnexo = control.preguntas
        .filter((question) => fields.has(question.id) && isFilled(answers[question.id]))
        .map((question) => ({ etiqueta: question.anexo, valor: answerLabel(question, answers[question.id]!) }));
      return { ...result, controlId: control.id, controlTitulo: control.titulo, controlIcono: control.icono, datosAnexo };
    });
}

const routeTitles: Record<InspectionRoute, string> = {
  LEY_14_2010: "Ley 14/2010",
  MUNICIPAL: "Normativa municipal",
  ESPECIFICA: "NORMATIVA ESPECÍFICA — TABAQUISMO",
};

function lawDocument(incidents: ResolvedIncident[]): string {
  if (incidents.some((item) => item.clasificacion === "GRAVE" || item.clasificacion === "MUY GRAVE")) return "ACTA G + ANEXO";
  if (incidents.some((item) => item.clasificacion === "PENDIENTE")) return "PENDIENTE DE VALIDACIÓN JURÍDICA";
  return "ACTA L + ANEXO";
}

function lawDestination(incidents: ResolvedIncident[]): string {
  if (incidents.some((item) => item.clasificacion === "GRAVE" || item.clasificacion === "MUY GRAVE")) return "Generalitat Valenciana (Torrent no tiene delegadas las infracciones graves y muy graves de la Ley 14/2010).";
  if (incidents.some((item) => item.clasificacion === "PENDIENTE")) return "PENDIENTE DE VALIDACIÓN JURÍDICA";
  return "Ayuntamiento de Torrent (infracciones leves de la Ley 14/2010).";
}

export function resolveEstablishmentInspection(state: InspectionState, data: InspectionData = establishmentsInspection): InspectionResolution {
  const resolvedIncidents = data.controles.flatMap((control) => {
    const item = state[control.id] ?? EMPTY_INSPECTION_ITEM;
    if (item.estado !== "irregular") return [];
    return incidentsForControl(control, item.respuestas);
  });
  const lacksTitle = resolvedIncidents.some((incident) => incident.id === "sin_titulo");
  const incidencias = lacksTitle
    ? resolvedIncidents.filter((incident) => incident.id !== "licencia_no_expuesta")
    : resolvedIncidents;
  const grupos: ResolvedGroup[] = [];
  const lawIncidents = incidencias.filter((incident) => incident.via === "LEY_14_2010");
  const determinedLawIncidents = lawIncidents.filter((incident) => incident.clasificacion !== "PENDIENTE");
  const pendingLawIncidents = lawIncidents.filter((incident) => incident.clasificacion === "PENDIENTE");
  if (determinedLawIncidents.length) grupos.push({
    via: "LEY_14_2010",
    titulo: routeTitles.LEY_14_2010,
    incidencias: determinedLawIncidents,
    documento: lawDocument(determinedLawIncidents),
    destino: lawDestination(determinedLawIncidents),
  });
  if (pendingLawIncidents.length) grupos.push({
    via: "LEY_14_2010",
    titulo: "Ley 14/2010 · supuesto pendiente separado",
    incidencias: pendingLawIncidents,
    documento: "PENDIENTE DE VALIDACIÓN JURÍDICA",
    destino: "PENDIENTE DE VALIDACIÓN JURÍDICA",
  });
  for (const via of ["MUNICIPAL", "ESPECIFICA"] as const) {
    const routeIncidents = incidencias.filter((incident) => incident.via === via);
    if (!routeIncidents.length) continue;
    const first = routeIncidents[0];
    grupos.push({
      via,
      titulo: routeTitles[via],
      incidencias: routeIncidents,
      documento: first.documento ?? "PENDIENTE DE VALIDACIÓN JURÍDICA",
      destino: first.destino ?? "PENDIENTE DE VALIDACIÓN JURÍDICA",
    });
  }
  return { grupos, incidencias };
}

export function controlsForFilter(filter: InspectionFilter, data: InspectionData = establishmentsInspection): InspectionControl[] {
  if (filter === "TODAS") return data.controles;
  if (filter === "AUTONÓMICA") return data.controles.filter((control) => control.origen === "AUTONÓMICA" || control.origen === "MIXTA");
  if (filter === "MUNICIPAL") return data.controles.filter((control) => control.origen === "MUNICIPAL" || control.origen === "MIXTA");
  return data.controles.filter((control) => control.origen === filter);
}

export function buildAnnexSections(resolution: InspectionResolution): InspectionAnnexSection[] {
  const sections = new Map<string, InspectionAnnexSection>();
  for (const incident of resolution.incidencias) {
    const section = sections.get(incident.controlId) ?? {
      controlId: incident.controlId,
      controlTitulo: incident.controlTitulo,
      controlIcono: incident.controlIcono,
      recordatorios: [],
      datosAnexo: [],
    };
    for (const reminder of incident.recordatorios) if (!section.recordatorios.includes(reminder)) section.recordatorios.push(reminder);
    for (const datum of incident.datosAnexo) if (!section.datosAnexo.some((entry) => entry.etiqueta === datum.etiqueta && entry.valor === datum.valor)) section.datosAnexo.push(datum);
    sections.set(incident.controlId, section);
  }
  return [...sections.values()];
}

export function buildAnnexDraft(resolution: InspectionResolution): string {
  return buildAnnexSections(resolution).flatMap((section) => {
    if (!section.datosAnexo.length) return [];
    return [`${section.controlTitulo}. ${section.datosAnexo.map((datum) => `${datum.etiqueta}: ${datum.valor}`).join(". ")}.`];
  }).join("\n\n");
}
