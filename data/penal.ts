import type { OperationalCase, PenalPrecept } from "./types";

export const ANIMAL_MALTREATMENT_PENAL_DESTINATION = "Fiscalía Provincial de Valencia — Sección de Medio Ambiente (protección/maltrato animal)";

/** Dataset penal común. Para editar textos validados: contenido/juridico/articulos_penales.json */
import penalArticlesJson from "../contenido/juridico/articulos_penales.json";
export const penalArticles = penalArticlesJson as PenalPrecept[];

export const resolveValidatedPenalPrecept = (id?: string | null) => {
  if (!id) return null;
  const precept = penalArticles.find((item) => item.id === id);
  return precept?.estado === "validado" && precept.texto_literal.trim() ? precept : null;
};

export type PenalBranchAudit = {
  caseId: string;
  type: "directa" | "condicional";
  penalArticleId: string | null;
  status: "VALIDADA" | "PENDIENTE_TEXTO_LITERAL" | "SIN_PRECEPTO_COMUN";
};

export function auditPenalBranches(items: OperationalCase[]): PenalBranchAudit[] {
  return items.flatMap((item) => {
    const branches: PenalBranchAudit[] = [];
    if (item.alerta_penal) {
      const entry = penalArticles.find((precept) => precept.id === item.penal_article_id);
      branches.push({ caseId: item.id, type: "directa", penalArticleId: item.penal_article_id ?? null, status: !entry ? "SIN_PRECEPTO_COMUN" : resolveValidatedPenalPrecept(entry.id) ? "VALIDADA" : "PENDIENTE_TEXTO_LITERAL" });
    }
    const conditional = item.datos_adicionales?.relevancia_penal_condicional;
    if (conditional?.activa) {
      const entry = penalArticles.find((precept) => precept.id === conditional.penal_article_id);
      branches.push({ caseId: item.id, type: "condicional", penalArticleId: conditional.penal_article_id, status: !entry ? "SIN_PRECEPTO_COMUN" : resolveValidatedPenalPrecept(entry.id) ? "VALIDADA" : "PENDIENTE_TEXTO_LITERAL" });
    }
    return branches;
  });
}

const ambiguousPenalPatterns = [/valorar relevancia penal/i, /posible relevancia penal/i, /valorar diligencias/i, /valorar instrucci[oó]n de diligencias/i];

export function auditAmbiguousPenalMessages(items: OperationalCase[]) {
  return items.flatMap((item) => Object.entries({ resultado: item.resultado, actuacion: item.actuacion, advertencias: item.advertencias, referencia_penal: item.referencia_penal }).flatMap(([field, value]) => (Array.isArray(value) ? value : [value]).filter((text): text is string => typeof text === "string").filter((text) => ambiguousPenalPatterns.some((pattern) => pattern.test(text))).map((text) => ({ caseId: item.id, field, text }))));
}
