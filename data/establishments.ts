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
  no_vacio?: boolean;
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

export const establishmentsInspection = inspectionJson as InspectionData;
export const EMPTY_INSPECTION_ITEM = { estado: "no_comprobado" as const, respuestas: {} };

const isFilled = (answer: InspectionAnswer | undefined) => Array.isArray(answer) ? answer.length > 0 : typeof answer === "string" && answer.trim().length > 0;
const numeric = (answer: InspectionAnswer | undefined) => typeof answer === "string" && answer.trim() ? Number(answer.replace(",", ".")) : Number.NaN;

function conditionMatches(condition: InspectionCondition, answers: InspectionAnswers): boolean {
  const answer = condition.campo === "_irregular" ? "si" : answers[condition.campo];
  if (condition.igual !== undefined) return answer === condition.igual;
  if (condition.no_vacio) return isFilled(answer);
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

function incidentForControl(control: InspectionControl, answers: InspectionAnswers): ResolvedIncident | undefined {
  const result = control.resultados.find((candidate) => candidate.cuando.every((condition) => conditionMatches(condition, answers)));
  if (!result) return undefined;
  const fields = new Set(result.anexo_campos);
  const datosAnexo = control.preguntas
    .filter((question) => fields.has(question.id) && isFilled(answers[question.id]))
    .map((question) => ({ etiqueta: question.anexo, valor: answerLabel(question, answers[question.id]!) }));
  return { ...result, controlId: control.id, controlTitulo: control.titulo, controlIcono: control.icono, datosAnexo };
}

const routeTitles: Record<InspectionRoute, string> = {
  LEY_14_2010: "Ley 14/2010",
  MUNICIPAL: "Normativa municipal",
  ESPECIFICA: "Normativa específica",
};

function lawDocument(incidents: ResolvedIncident[]): string {
  if (incidents.some((item) => item.clasificacion === "GRAVE" || item.clasificacion === "MUY GRAVE")) return "ACTA G + ANEXO";
  if (incidents.some((item) => item.clasificacion === "PENDIENTE")) return "PENDIENTE DE VALIDACIÓN JURÍDICA";
  return "ACTA L + ANEXO";
}

function lawDestination(incidents: ResolvedIncident[]): string {
  if (incidents.some((item) => item.clasificacion === "GRAVE" || item.clasificacion === "MUY GRAVE")) return "Administración autonómica competente por la infracción de mayor gravedad; no consta delegación expresa validada para Torrent.";
  if (incidents.some((item) => item.clasificacion === "PENDIENTE")) return "PENDIENTE DE VALIDACIÓN JURÍDICA";
  return "Ayuntamiento de Torrent (infracciones leves de la Ley 14/2010).";
}

export function resolveEstablishmentInspection(state: InspectionState, data: InspectionData = establishmentsInspection): InspectionResolution {
  const incidencias = data.controles.flatMap((control) => {
    const item = state[control.id] ?? EMPTY_INSPECTION_ITEM;
    if (item.estado !== "irregular") return [];
    const incident = incidentForControl(control, item.respuestas);
    return incident ? [incident] : [];
  });
  const routes: InspectionRoute[] = ["LEY_14_2010", "MUNICIPAL", "ESPECIFICA"];
  const grupos = routes.flatMap((via) => {
    const routeIncidents = incidencias.filter((incident) => incident.via === via);
    if (!routeIncidents.length) return [];
    const first = routeIncidents[0];
    return [{
      via,
      titulo: routeTitles[via],
      incidencias: routeIncidents,
      documento: via === "LEY_14_2010" ? lawDocument(routeIncidents) : first.documento ?? "PENDIENTE DE VALIDACIÓN JURÍDICA",
      destino: via === "LEY_14_2010" ? lawDestination(routeIncidents) : first.destino ?? "PENDIENTE DE VALIDACIÓN JURÍDICA",
    }];
  });
  return { grupos, incidencias };
}

export function controlsForFilter(filter: InspectionFilter, data: InspectionData = establishmentsInspection): InspectionControl[] {
  if (filter === "TODAS") return data.controles;
  return data.controles.filter((control) => control.origen === filter);
}

export function buildAnnexDraft(resolution: InspectionResolution): string {
  return resolution.incidencias.flatMap((incident) => {
    if (!incident.datosAnexo.length) return [];
    return [`${incident.controlTitulo}. ${incident.datosAnexo.map((datum) => `${datum.etiqueta}: ${datum.valor}`).join(". ")}.`];
  }).join("\n\n");
}
