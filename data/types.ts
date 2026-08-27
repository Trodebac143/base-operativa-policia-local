export type CaseStatus = "borrador" | "revision" | "validado" | "bloqueado";
export type Module = { id: string; nombre: string; descripcion: string; orden: number; activo: boolean };
export type Category = { id: string; modulo: string; nombre: string; descripcion?: string; orden: number; activo: boolean };
export type Rule = { id: string; nombre: string; tipo: string; contenido: string; activo: boolean };
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
export type ConditionalFit = { supuesto: string; articulo: string; calificacion: string };
export type ConditionalClassification = { si: string; calificacion: string; rango_min?: number | null; rango_max?: number | null };
export type AdditionalCaseData = Record<string, unknown> & {
  encaje_condicional?: ConditionalFit[];
  calificacion_condicional?: ConditionalClassification;
};
export type OperationalCase = { id: string; modulo: string; categoria: string; titulo: string; palabras_clave: string[]; que_comprobar: string[]; resultado: string; norma: string; articulo: string; calificacion?: string | null; rango_min?: number | null; rango_max?: number | null; actuacion: string[]; competencia_denuncia: string; competencia_resuelve: string; advertencias: string[]; alerta_penal: boolean; referencia_penal?: string | null; regla_transversal?: string | null; fuentes: string[]; fichas_juridicas: string[]; estado: CaseStatus; datos_adicionales?: AdditionalCaseData };
