import { rawCases } from "./case-catalog";
import trafficRulesJson from "../contenido/juridico/reglas_generales_y_comunes.json";
import penalJson from "../contenido/juridico/articulos_penales.json";
import permisosRulesJson from "../contenido/seguridad_vial/permisos/reglas.json";
import permisosSheetsJson from "../contenido/seguridad_vial/permisos/fichas_juridicas.json";
import alcoholemiaJson from "../contenido/seguridad_vial/alcoholemia.json";
import seguridadPublicaJson from "../contenido/seguridad_publica/operativa.json";
import vmpGuideJson from "../contenido/seguridad_vial/vmp/guia.json";
import establishmentsJson from "../contenido/policia_administrativa/establecimientos/inspeccion.json";
import urbanismoJson from "../contenido/policia_administrativa/urbanismo/inspeccion.json";
import sourceLibraryGroupsJson from "../contenido/biblioteca/grupos-fuentes.json";
import { resolveSourceReference } from "./sources";
import type { Source } from "./types";

export type SourceLibraryGroup = {
  id: string;
  nombre: string;
  icono: string;
  orden: number;
  activo: boolean;
};

/** Registro editable de grupos. Su orden, nombre, icono y visibilidad no viven en React. */
export const sourceLibraryGroups = [...(sourceLibraryGroupsJson as SourceLibraryGroup[])]
  .sort((left, right) => left.orden - right.orden || left.nombre.localeCompare(right.nombre, "es"));

/** Un grupo inactivo no se muestra; los grupos activos sin fuentes también se omiten en la UI. */
export const activeSourceLibraryGroups = sourceLibraryGroups.filter((group) => group.activo);
const sourceLibraryGroupById = new Map(sourceLibraryGroups.map((group) => [group.id, group]));
type SourceLibraryGroups = Record<string, Source[]>;
const sourceNameOrder = new Intl.Collator("es", { sensitivity: "base" });

const animalsJson = rawCases.filter((item) => item.modulo === "animales");
const itvJson = rawCases.filter((item) => item.categoria === "seguridad_vial_itv");
const seguroJson = rawCases.filter((item) => item.categoria === "seguridad_vial_seguro");
const permisosJson = rawCases.filter((item) => item.categoria === "seguridad_vial_permisos");
const terrazasJson = rawCases.filter((item) => item.categoria === "policia_administrativa_terrazas");

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
addUsage(terrazasJson, "Policía Administrativa → Terrazas");
addUsage(establishmentsJson, "Policía Administrativa → Establecimientos públicos");
addUsage(urbanismoJson, "Policía Administrativa → Urbanismo");
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

/** La carpeta principal es un dato editorial explícito, independiente de «Utilizada en». */
export function sourceLibraryGroupFor(source: Pick<Source, "grupoBiblioteca">): string {
  return source.grupoBiblioteca;
}

export function sourceLibraryGroupForSource(sourceId: string): string | undefined {
  const source = resolveSourceReference(sourceId);
  return source ? sourceLibraryGroupFor(source) : undefined;
}

/** Submaterias compactas para las fichas; la lista completa se conserva en «Utilizada en». */
export function sourceLibrarySubmatters(labels: readonly string[]): string[] {
  return [...new Set(labels.flatMap((label) => {
    if (label === "Reglas transversales") return [label];
    const [, submatter] = label.split(" → ", 2);
    return submatter ? [submatter] : [];
  }))];
}

/** Agrupa por el campo editorial grupoBiblioteca y ordena cada grupo en español. */
export function groupSourcesByLibraryMatter(sourceList: readonly Source[]): SourceLibraryGroups {
  const groups: SourceLibraryGroups = {};
  for (const group of sourceLibraryGroups) groups[group.id] = [];
  for (const source of sourceList) {
    if (!sourceLibraryGroupById.has(source.grupoBiblioteca)) continue;
    groups[source.grupoBiblioteca].push(source);
  }
  for (const sourcesInGroup of Object.values(groups)) {
    sourcesInGroup.sort((left, right) => sourceNameOrder.compare(left.nombreCorto ?? left.nombre, right.nombreCorto ?? right.nombre) || sourceNameOrder.compare(left.id, right.id));
  }
  return groups;
}

export function allSourceReferences(): string[] {
  return [
    ...collectSourceReferences(animalsJson),
    ...collectSourceReferences(itvJson),
    ...collectSourceReferences(seguroJson),
    ...collectSourceReferences(permisosJson),
    ...collectSourceReferences(terrazasJson),
    ...collectSourceReferences(establishmentsJson),
    ...collectSourceReferences(urbanismoJson),
    ...collectSourceReferences(permisosRulesJson),
    ...collectSourceReferences(permisosSheetsJson),
    ...collectSourceReferences(penalJson),
    ...collectSourceReferences(alcoholemiaJson),
    ...collectSourceReferences(vmpGuideJson),
    ...collectSourceReferences(trafficRulesJson),
    ...collectSourceReferences(seguridadPublicaJson),
  ];
}
