import urbanismoJson from "../contenido/policia_administrativa/urbanismo/inspeccion.json";

export type UrbanismoRouteId = "obras_ejecucion" | "via_publica" | "riesgo" | "queja" | "orden_previa";
export type UrbanismoAnswer = string | string[];
export type UrbanismoAnswers = Record<string, UrbanismoAnswer>;
export type UrbanismoOption = { valor: string; etiqueta: string };
export type UrbanismoVisibility = { campo: string; igual: string };
export type UrbanismoQuestion = {
  id: string;
  etiqueta: string;
  tipo: "opcion" | "multiple";
  opciones: UrbanismoOption[];
  ayuda?: string;
  mostrar_si?: UrbanismoVisibility;
};
export type UrbanismoRoute = {
  id: UrbanismoRouteId;
  icono: string;
  titulo: string;
  objetivo: string;
  aviso_inicial?: string;
  preguntas: UrbanismoQuestion[];
  salidas: Record<string, string[] | string>;
};
export type UrbanismoData = {
  id: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  principios: string[];
  palabras_clave: string[];
  fuentes: string[];
  checklist: string[];
  rutas: UrbanismoRoute[];
};
export type UrbanismoResultSection = { titulo: string; items: string[]; emphasis?: "priority" | "administrative" | "safety" };
export type UrbanismoResolution = {
  titulo: string;
  tono: "standard" | "priority" | "warning";
  secciones: UrbanismoResultSection[];
  aviso?: string;
  rutasRelacionadas: UrbanismoRouteId[];
};

export const urbanismoData = urbanismoJson as unknown as UrbanismoData;

export const urbanismoSearchEntry = {
  id: urbanismoData.id,
  categoria: urbanismoData.categoria,
  titulo: urbanismoData.titulo,
  palabrasClave: [...urbanismoData.palabras_clave, ...urbanismoData.rutas.flatMap((route) => [route.titulo, route.objetivo])],
};

export function urbanismoRoute(routeId: UrbanismoRouteId): UrbanismoRoute {
  const route = urbanismoData.rutas.find((candidate) => candidate.id === routeId);
  if (!route) throw new Error(`Ruta de Urbanismo inexistente: ${routeId}`);
  return route;
}

export function isUrbanismoQuestionVisible(question: UrbanismoQuestion, answers: UrbanismoAnswers): boolean {
  if (!question.mostrar_si) return true;
  return answers[question.mostrar_si.campo] === question.mostrar_si.igual;
}

const list = (route: UrbanismoRoute, key: string): string[] => {
  const value = route.salidas[key];
  return Array.isArray(value) ? value : [];
};

const text = (route: UrbanismoRoute, key: string): string | undefined => {
  const value = route.salidas[key];
  return typeof value === "string" ? value : undefined;
};

const selected = (answers: UrbanismoAnswers, field: string, value: string): boolean => {
  const answer = answers[field];
  return Array.isArray(answer) ? answer.includes(value) : answer === value;
};

export function resolveUrbanismoRoute(routeId: UrbanismoRouteId, answers: UrbanismoAnswers): UrbanismoResolution {
  const route = urbanismoRoute(routeId);

  if (routeId === "obras_ejecucion") {
    const related: UrbanismoRouteId[] = [];
    if (selected(answers, "problemas_adicionales", "via_publica")) related.push("via_publica");
    if (selected(answers, "problemas_adicionales", "riesgo")) related.push("riesgo");
    if (selected(answers, "problemas_adicionales", "orden_previa")) related.push("orden_previa");
    return {
      titulo: "ACTUACIÓN POLICIAL",
      tono: "standard",
      secciones: [{ titulo: "Observar, documentar y remitir", items: list(route, "actuacion") }],
      aviso: text(route, "aviso"),
      rutasRelacionadas: related,
    };
  }

  if (routeId === "via_publica") {
    const immediateSafety = answers.paso_peatonal === "no" || answers.afeccion_trafico === "si" || answers.proteccion === "no";
    return {
      titulo: immediateSafety ? "ACTUACIÓN ADMINISTRATIVA Y SEGURIDAD INMEDIATA" : "ACTUACIÓN POLICIAL",
      tono: immediateSafety ? "priority" : "standard",
      secciones: [
        { titulo: "INCIDENCIA URBANÍSTICA / ADMINISTRATIVA", items: list(route, "administrativa"), emphasis: "administrative" },
        ...(immediateSafety ? [{ titulo: "SEGURIDAD INMEDIATA / VÍA PÚBLICA", items: list(route, "seguridad"), emphasis: "safety" as const }] : []),
      ],
      rutasRelacionadas: [],
    };
  }

  if (routeId === "riesgo") {
    if (answers.riesgo_inmediato === "si") return {
      titulo: "⚠️ PRIORIDAD: SEGURIDAD",
      tono: "priority",
      secciones: [{ titulo: "Respuesta inmediata", items: list(route, "inmediata"), emphasis: "priority" }],
      rutasRelacionadas: [],
    };
    if (answers.riesgo_inmediato === "indeterminado") return {
      titulo: "RIESGO NO DETERMINABLE EN CALLE",
      tono: "warning",
      secciones: [{ titulo: "Actuación prudente", items: list(route, "indeterminada"), emphasis: "safety" }],
      rutasRelacionadas: [],
    };
    return {
      titulo: "ACTUACIÓN SIN RIESGO INMEDIATO APRECIADO",
      tono: "standard",
      secciones: [{ titulo: "Documentación y remisión técnica", items: list(route, "no_inmediata") }],
      rutasRelacionadas: [],
    };
  }

  if (routeId === "queja") {
    const observed = answers.comprobacion_directa === "si";
    return {
      titulo: observed ? "HECHOS MANIFESTADOS Y HECHOS OBSERVADOS" : "QUEJA NO COMPROBADA DIRECTAMENTE",
      tono: observed ? "standard" : "warning",
      secciones: [{
        titulo: observed ? "Separar y documentar" : "Recoger y remitir",
        items: list(route, observed ? "comprobada" : "no_comprobada"),
      }],
      aviso: text(route, "aviso"),
      rutasRelacionadas: observed ? ["obras_ejecucion"] : [],
    };
  }

  if (answers.consta_orden !== "si") return {
    titulo: "NO CONSTA ORDEN PREVIA COMPROBADA",
    tono: "warning",
    secciones: [{ titulo: "No tratar como incumplimiento", items: list(route, "sin_orden") }],
    aviso: text(route, "aviso"),
    rutasRelacionadas: ["obras_ejecucion"],
  };

  const sections: UrbanismoResultSection[] = [];
  let title = "COMPROBACIÓN DE ORDEN PREVIA";
  let tone: UrbanismoResolution["tono"] = "standard";
  if (answers.trabajos_actuales === "si" && answers.afecta_orden === "si") {
    title = "🔴 POSIBLE INCUMPLIMIENTO DE ORDEN PREVIA";
    tone = "priority";
    sections.push({ titulo: "Documentar y comunicar", items: list(route, "posible_incumplimiento"), emphasis: "priority" });
  } else if (answers.trabajos_actuales === "si") {
    title = "ALCANCE DE LA ORDEN NO CONFIRMADO";
    tone = "warning";
    sections.push({ titulo: "No anticipar la conclusión", items: list(route, "alcance_indeterminado") });
  } else {
    title = "SIN ACTIVIDAD OBSERVADA EN ESTE MOMENTO";
    sections.push({ titulo: "Dejar constancia de lo comprobado", items: list(route, "sin_actividad") });
  }
  if (answers.estado_precinto === "roto") sections.push({ titulo: "PRECINTO ROTO O MANIPULADO", items: list(route, "precinto_alterado"), emphasis: "safety" });
  return { titulo: title, tono: tone, secciones: sections, aviso: text(route, "aviso"), rutasRelacionadas: [] };
}
