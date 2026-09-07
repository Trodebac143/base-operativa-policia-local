import type { Source } from "./types";
import sourcesJson from "../contenido/juridico/fuentes.json";

/** Para editar fuentes: contenido/juridico/fuentes.json */
export const sources = sourcesJson as Source[];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const sourceIndex = new Map<string, Source>();

for (const source of sources) {
  for (const reference of [source.id, source.nombre, source.nombreCorto, ...(source.referencias ?? [])]) {
    if (reference) sourceIndex.set(normalize(reference), source);
  }
}

export function resolveSourceReference(reference: string): Source | undefined {
  return sourceIndex.get(normalize(reference));
}

export function resolveSourceReferences(references: string[]): Source[] {
  return references.map(resolveSourceReference).filter((source): source is Source => Boolean(source));
}

/** Resuelve únicamente las referencias declaradas por el propio caso, sin fuentes implícitas. */
export function resolveCaseSources(sourceIds: string[]): Source[] {
  return resolveSourceReferences(sourceIds);
}

export function filterSources(query: string): Source[] {
  const needle = normalize(query);
  if (!needle) return sources;
  return sources.filter((source) => normalize([
    source.nombre,
    source.nombreCorto,
    source.tipo,
    source.ambito,
    source.organismo,
    ...(source.referencias ?? []),
  ].filter(Boolean).join(" ")).includes(needle));
}
