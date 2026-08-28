import type { Source } from "./types";
import sourcesJson from "../contenido/juridico/fuentes.json";

/** Para editar fuentes: contenido/juridico/fuentes.json */
export const sources = sourcesJson as Source[];

/** Resuelve únicamente los identificadores declarados por el propio caso, sin fallbacks. */
export function resolveCaseSources(sourceIds: string[]): Source[] {
  return sourceIds.map((id) => sources.find((source) => source.id === id)).filter((source): source is Source => Boolean(source));
}
