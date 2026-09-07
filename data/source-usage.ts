import animalsJson from "../contenido/animales/casos.json";
import trafficRulesJson from "../contenido/juridico/reglas_generales_y_comunes.json";
import penalJson from "../contenido/juridico/articulos_penales.json";
import itvJson from "../contenido/seguridad_vial/itv/casos.json";
import seguroJson from "../contenido/seguridad_vial/seguro/casos.json";
import permisosJson from "../contenido/seguridad_vial/permisos/casos.json";
import permisosRulesJson from "../contenido/seguridad_vial/permisos/reglas.json";
import permisosSheetsJson from "../contenido/seguridad_vial/permisos/fichas_juridicas.json";
import alcoholemiaJson from "../contenido/seguridad_vial/alcoholemia.json";
import seguridadPublicaJson from "../contenido/seguridad_publica/operativa.json";
import vmpGuideJson from "../contenido/seguridad_vial/vmp/guia.json";
import { resolveSourceReference } from "./sources";

const sourceKeys = new Set([
  "sourceId",
  "fuenteId",
  "source_id",
  "fuente_id",
  "sources",
  "fuentes",
  "fuente_manual",
  "fuentes_v3",
  "fuentes_juridicas_validadas",
]);

function collectSourceReferences(value: unknown, key = "", output: string[] = []): string[] {
  if (typeof value === "string") {
    if (sourceKeys.has(key)) output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    if (sourceKeys.has(key)) {
      for (const entry of value) if (typeof entry === "string") output.push(entry);
    } else {
      for (const entry of value) collectSourceReferences(entry, key, output);
    }
    return output;
  }
  if (value && typeof value === "object") {
    for (const [childKey, childValue] of Object.entries(value)) collectSourceReferences(childValue, childKey, output);
  }
  return output;
}

const usage = new Map<string, Set<string>>();

function addUsage(value: unknown, label: string) {
  for (const reference of collectSourceReferences(value)) {
    const source = resolveSourceReference(reference);
    if (!source) continue;
    const labels = usage.get(source.id) ?? new Set<string>();
    labels.add(label);
    usage.set(source.id, labels);
  }
}

addUsage(animalsJson, "Animales");
addUsage(itvJson, "Seguridad Vial → ITV");
addUsage(seguroJson, "Seguridad Vial → Seguro");
addUsage(permisosJson, "Seguridad Vial → Permisos de conducir");
addUsage(permisosRulesJson, "Seguridad Vial → Permisos de conducir");
addUsage(permisosSheetsJson, "Seguridad Vial → Permisos de conducir");
addUsage(penalJson, "Seguridad Vial → Permisos de conducir");
addUsage(alcoholemiaJson, "Seguridad Vial → Alcoholemia");
addUsage(vmpGuideJson, "Seguridad Vial → VMP y VPL");
addUsage(trafficRulesJson, "Reglas transversales");

const publicSecurity = seguridadPublicaJson as {
  fuentes?: string[];
  conceptos?: Array<{ bloque?: string; fuentes?: string[] }>;
};
addUsage({ fuentes: publicSecurity.fuentes ?? [] }, "Seguridad Pública");
for (const concept of publicSecurity.conceptos ?? []) {
  addUsage({ fuentes: concept.fuentes ?? [] }, `Seguridad Pública → ${concept.bloque ?? "Contenido operativo"}`);
}

export function sourceUsage(sourceId: string): string[] {
  return [...(usage.get(sourceId) ?? [])].sort((left, right) => left.localeCompare(right, "es"));
}

export function allSourceReferences(): string[] {
  return [
    ...collectSourceReferences(animalsJson),
    ...collectSourceReferences(itvJson),
    ...collectSourceReferences(seguroJson),
    ...collectSourceReferences(permisosJson),
    ...collectSourceReferences(permisosRulesJson),
    ...collectSourceReferences(permisosSheetsJson),
    ...collectSourceReferences(penalJson),
    ...collectSourceReferences(alcoholemiaJson),
    ...collectSourceReferences(vmpGuideJson),
    ...collectSourceReferences(trafficRulesJson),
    ...collectSourceReferences(seguridadPublicaJson),
  ];
}
