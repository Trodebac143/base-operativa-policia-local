export type CaseStatus = "borrador" | "revision" | "validado" | "bloqueado";
export type Module = { id: string; nombre: string; descripcion: string; orden: number; activo: boolean };
export type Category = { id: string; modulo: string; nombre: string; descripcion?: string; orden: number; activo: boolean };
export type Rule = { id: string; nombre: string; tipo: string; contenido: string; aplica_a?: string; fuentes?: string[]; activo: boolean };
export type Source = {
  id: string;
  nombre: string;
  tipo?: string;
  ambito?: string;
  /** Metadatos de mantenimiento: se conservan en el repositorio y no se renderizan. */
  clasificacion_repositorio?: string;
  estado_vigencia_auditoria?: string;
  criterio_incorporacion?: string;
  notas_internas?: string[];
};
export type ImmobilizationStatus = "SÍ" | "NO" | "CONDICIONADA";
export type TrafficMeasureStatus = { estado: ImmobilizationStatus; fundamento?: string; detalle: string };
export type TrafficMeasureCondition = { fundamento: string; detalle: string };
export type TrafficMeasurePlan = {
  inmovilizacion: TrafficMeasureStatus;
  regla_sectorial?: string;
  retirada_sin_lugar?: TrafficMeasureCondition;
  retirada_persistencia?: TrafficMeasureCondition;
  levantamiento?: string;
};
export type ConditionalFit = {
  supuesto: string;
  articulo: string;
  calificacion: string;
  norma_infringida?: string;
  articulo_infringido?: string;
  tipificacion_norma?: string;
  tipificacion_articulo?: string;
  tipificacion_etiqueta?: string;
  textoDenuncia?: string;
  codificado?: string;
  importe_fijo?: number;
  importe_reducido?: number;
};
export type ConditionalClassification = { si: string; calificacion: string; rango_min?: number | null; rango_max?: number | null };
export type ConditionalPenalRelevance = {
  activa: boolean;
  titulo: string;
  condiciones: string[];
  articulo_referencia: string;
  penal_article_id: string;
  accion: string[];
};
export type AdditionalCaseData = Record<string, unknown> & {
  encaje_condicional?: ConditionalFit[];
  calificacion_condicional?: ConditionalClassification;
  relevancia_penal_condicional?: ConditionalPenalRelevance;
};
export type OperationalCase = { id: string; modulo: string; categoria: string; titulo: string; palabras_clave: string[]; que_comprobar: string[]; resultado: string; norma: string; articulo: string; norma_infringida?: string | null; articulo_infringido?: string | null; tipificacion_norma?: string | null; tipificacion_articulo?: string | null; tipificacion_etiqueta?: string | null; textoDenuncia?: string | null; es_infraccion_autonoma?: boolean; inmovilizacion?: ImmobilizationStatus | null; motivo_inmovilizacion?: string | null; medida_operativa?: TrafficMeasurePlan; actuacion_breve?: string[]; codificado?: string | null; calificacion?: string | null; rango_min?: number | null; rango_max?: number | null; importe_fijo?: number | null; importe_reducido?: number | null; responsable?: string | null; medidas?: string[]; actuacion: string[]; competencia_denuncia: string; competencia_instruye?: string | null; competencia_resuelve: string; destino_diligencias_penales?: string | null; penal_article_id?: string | null; advertencias: string[]; alerta_penal: boolean; referencia_penal?: string | null; regla_transversal?: string | null; fuentes: string[]; fichas_juridicas: string[]; estado: CaseStatus; datos_adicionales?: AdditionalCaseData };

export type PoliceMeasure = { id: string; titulo: string; fundamento?: string; activacion: string; automatica: boolean; actuaciones: string[]; levantamiento: string };
export type DecisionNode = { id: string; pregunta: string; si: string; no: string };
export type DecisionTree = { id: string; categoria: string; entrada: string; nodes: DecisionNode[]; outcomes: Record<string, { titulo: string; caseId?: string; texto?: string }> };

export type PenalPrecept = {
  id: string;
  norma: string;
  articulo: string;
  texto_literal: string;
  fuente_id: string;
  estado: "validado";
  fecha_revision: string;
};
