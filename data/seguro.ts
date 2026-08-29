import type { DecisionTree, OperationalCase, PoliceMeasure, Rule } from "./types";
import casesJson from "../contenido/seguridad_vial/seguro/casos.json";
import legalSheetsJson from "../contenido/seguridad_vial/seguro/fichas_juridicas.json";
import measuresJson from "../contenido/seguridad_vial/seguro/medidas.json";
import rulesJson from "../contenido/seguridad_vial/seguro/reglas.json";
import decisionTreeJson from "../contenido/seguridad_vial/seguro/arbol.json";
import { withTrafficMeasurePlan } from "./traffic";

/** Adaptadores técnicos. El contenido editable está en contenido/seguridad_vial/seguro/. */
export const seguroCases = (casesJson as OperationalCase[]).map(withTrafficMeasurePlan);
export const seguroLegalSheets = legalSheetsJson;
export const seguroMeasures = measuresJson as PoliceMeasure[];
export const seguroRules = rulesJson as Rule[];
export const seguroDecisionTree = decisionTreeJson as DecisionTree;
