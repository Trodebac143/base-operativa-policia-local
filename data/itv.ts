import type { DecisionTree, OperationalCase, PoliceMeasure, Rule } from "./types";
import casesJson from "../contenido/seguridad_vial/itv/casos.json";
import conceptsJson from "../contenido/seguridad_vial/itv/conceptos.json";
import legalSheetsJson from "../contenido/seguridad_vial/itv/fichas_juridicas.json";
import measuresJson from "../contenido/seguridad_vial/itv/medidas.json";
import rulesJson from "../contenido/seguridad_vial/itv/reglas.json";
import decisionTreeJson from "../contenido/seguridad_vial/itv/arbol.json";
import { seguroMeasures } from "./seguro";

/** Adaptadores técnicos. El contenido editable está en contenido/seguridad_vial/itv/. */
export const itvCases = casesJson as OperationalCase[];
export const itvConcepts = conceptsJson as string[];
export const itvLegalSheets = legalSheetsJson as string[];
export const itvMeasures = measuresJson as PoliceMeasure[];
export const itvRules = rulesJson as Rule[];
export const itvDecisionTree = decisionTreeJson as DecisionTree;

export function resolveMeasures(ids: string[] | undefined): PoliceMeasure[] {
  if (!ids?.length) return [];
  const all = [...itvMeasures, ...seguroMeasures];
  return ids.map((id) => all.find((measure) => measure.id === id)).filter((measure): measure is PoliceMeasure => Boolean(measure));
}
