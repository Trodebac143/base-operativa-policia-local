import type { OperationalCase, PoliceMeasure, TrafficMeasurePlan } from "./types";
import commonMeasuresJson from "../contenido/seguridad_vial/medidas.json";
import measurePlansJson from "../contenido/seguridad_vial/medidas_por_caso.json";

/** Regla y medidas reutilizables para todos los bloques de Tráfico. */
export const trafficMeasures = commonMeasuresJson as PoliceMeasure[];
export const trafficMeasurePlans = measurePlansJson as Record<string, TrafficMeasurePlan>;

export function withTrafficMeasurePlan(item: OperationalCase): OperationalCase {
  const measurePlan = trafficMeasurePlans[item.id];
  if (!measurePlan) return item;
  const fuentes = item.fuentes.includes("TR-MOV-SRC-001") ? item.fuentes : [...item.fuentes, "TR-MOV-SRC-001"];
  return { ...item, fuentes, regla_transversal: "TR-GEN-R-104-105-001", medida_operativa: measurePlan };
}
