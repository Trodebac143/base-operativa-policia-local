export type CaseStatus = "borrador" | "revision" | "validado" | "bloqueado";
export type Module = { id: string; nombre: string; descripcion: string; orden: number; activo: boolean };
export type Category = { id: string; modulo: string; nombre: string; descripcion: string; orden: number; activo: boolean };
export type Rule = { id: string; nombre: string; tipo: string; contenido: string; activo: boolean };
export type Source = { id: string; nombre: string; tipo: string; ambito: string; estado: string };
export type OperationalCase = { id: string; modulo: string; categoria: string; titulo: string; palabras_clave: string[]; que_comprobar: string[]; resultado: string; norma: string; articulo: string; calificacion?: string; rango_min?: number; rango_max?: number; actuacion: string[]; competencia_denuncia: string; competencia_resuelve: string; advertencias: string[]; alerta_penal: boolean; referencia_penal?: string; regla_transversal?: string; fuentes: string[]; fichas_juridicas: string[]; estado: CaseStatus };
