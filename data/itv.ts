import type { DecisionTree, PoliceMeasure, Rule } from "./types";
import { rawCases } from "./case-catalog";
import conceptsJson from "../contenido/seguridad_vial/itv/conceptos.json";
import legalSheetsJson from "../contenido/seguridad_vial/itv/fichas_juridicas.json";
import measuresJson from "../contenido/seguridad_vial/itv/medidas.json";
import rulesJson from "../contenido/seguridad_vial/itv/reglas.json";
import decisionTreeJson from "../contenido/seguridad_vial/itv/arbol.json";
import { seguroMeasures } from "./seguro";
import { trafficMeasures, withTrafficMeasurePlan } from "./traffic";

/** Adaptadores técnicos. El contenido editable está en contenido/seguridad_vial/itv/. */
export const itvCases = rawCases.filter((item) => item.categoria === "seguridad_vial_itv").map(withTrafficMeasurePlan);
export const itvConcepts = conceptsJson;
export const itvLegalSheets = legalSheetsJson;
export const itvMeasures = measuresJson as PoliceMeasure[];
export const itvRules = rulesJson as Rule[];
export const itvDecisionTree = decisionTreeJson as DecisionTree;

export function resolveMeasures(ids: string[] | undefined): PoliceMeasure[] {
  if (!ids?.length) return [];
  const all = [...trafficMeasures, ...itvMeasures, ...seguroMeasures];
  return ids.map((id) => all.find((measure) => measure.id === id)).filter((measure): measure is PoliceMeasure => Boolean(measure));
}
