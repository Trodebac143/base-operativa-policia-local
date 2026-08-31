import type { OperationalCase, PoliceMeasure, TrafficMeasurePlan } from "./types";
import commonMeasuresJson from "../contenido/seguridad_vial/medidas.json";
import measurePlansJson from "../contenido/seguridad_vial/medidas_por_caso.json";

/** Regla y medidas reutilizables para todos los bloques de Tráfico. */
export const trafficMeasures = commonMeasuresJson as PoliceMeasure[];
type TrafficMeasurePlanCatalog = Record<string, unknown> & { _por_categoria?: Record<string, TrafficMeasurePlan> };
export const trafficMeasurePlans = measurePlansJson as unknown as TrafficMeasurePlanCatalog;

export function withTrafficMeasurePlan(item: OperationalCase): OperationalCase {
  const directPlan = trafficMeasurePlans[item.id] as TrafficMeasurePlan | undefined;
  const measurePlan = directPlan ?? trafficMeasurePlans._por_categoria?.[item.categoria];
  if (!measurePlan) return item;
  const fuentes = item.fuentes.includes("TR-MOV-SRC-001") ? item.fuentes : [...item.fuentes, "TR-MOV-SRC-001"];
  return { ...item, fuentes, regla_transversal: "TR-GEN-R-104-105-001", inmovilizacion: measurePlan.inmovilizacion.estado, motivo_inmovilizacion: `${measurePlan.inmovilizacion.fundamento ?? ""} ${measurePlan.inmovilizacion.detalle}`.trim(), medida_operativa: measurePlan };
}
