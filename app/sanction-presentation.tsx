import type { SanctionPresentation as SanctionData } from "@/data/types";

const euro = (amount: number) => amount.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function SanctionPresentation({ sanction, fixed, min, max }: { sanction?: string | SanctionData; fixed?: number | null; min?: number | null; max?: number | null }) {
  if (typeof sanction === "object") return <><p><strong>{sanction.tipo === "fija" ? "Sanción prevista" : sanction.tipo === "maximo" ? "Máximo previsto por la norma" : sanction.tipo === "rango" ? "Rango sancionador" : "Régimen sancionador previsto"}:</strong> {sanction.texto}</p>{sanction.tipo === "maximo" || sanction.tipo === "rango" ? <small>La cuantía concreta corresponde al órgano sancionador.</small> : null}</>;
  if (typeof sanction === "string") return <p><strong>Sanción prevista:</strong> {sanction}</p>;
  if (fixed != null) return <p><strong>Sanción prevista:</strong> {euro(fixed)} €</p>;
  if (min != null && max != null) return <><p><strong>Rango sancionador:</strong> {euro(min)}–{euro(max)} €</p><small>La cuantía concreta corresponde al órgano sancionador.</small></>;
  if (max != null) return <><p><strong>Máximo previsto por la norma:</strong> {euro(max)} €</p><small>La cuantía concreta corresponde al órgano sancionador.</small></>;
  return <p>La calificación y el régimen sancionador dependen del supuesto acreditado.</p>;
}
