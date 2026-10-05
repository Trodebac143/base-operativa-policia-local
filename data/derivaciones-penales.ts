import { consecuenciasComunesPenales, seleccionarSupuestoPenal, type SupuestoPenalId } from "./catalogo-penal";
import { resolverSituacionProcesal, type ProcessualInput } from "./procesal-penal";

export type AnimalPenalFacts = {
  vertebrado?: boolean;
  bajoControlHumano?: boolean;
  resultado?: "tratamiento" | "muerte" | "sin_tratamiento_maltrato_grave" | "lesion_pendiente";
  agravanteDocumentada?: boolean;
};

/** Adaptador de las derivaciones históricas: selecciona catálogo, nunca fija penas. */
export function supuestoDeDerivacion(preceptId: string, animal: AnimalPenalFacts = {}): SupuestoPenalId | undefined {
  if (preceptId === "CP-384") return "384";
  if (preceptId === "CP-379-2") return "379.2";
  if (preceptId === "CP-383") return "383";
  if (preceptId === "CP-340-TER") return "340ter";
  if (preceptId !== "CP-340-BIS") return undefined;
  if (animal.resultado === "sin_tratamiento_maltrato_grave") return "340bis.4";
  if (animal.bajoControlHumano === undefined || !animal.resultado || animal.resultado === "lesion_pendiente" || animal.agravanteDocumentada === undefined) return "340bis.pendiente";
  const base = `340bis.${animal.resultado === "muerte" ? "3" : "1"}.${animal.bajoControlHumano ? "domestico" : "vertebrado"}`;
  return `${base}${animal.agravanteDocumentada ? ".agravado" : ""}` as SupuestoPenalId;
}

export function resolverDerivacionPenal(preceptId: string, input: ProcessualInput = {}, animal?: AnimalPenalFacts) {
  const id = supuestoDeDerivacion(preceptId, animal);
  if (!id) return undefined;
  const supuesto = seleccionarSupuestoPenal(id);
  const alternativas: SupuestoPenalId[] = [];
  if (id === "340bis.pendiente" && animal?.vertebrado === true && animal.resultado && animal.resultado !== "lesion_pendiente") {
    for (const clase of animal.bajoControlHumano === undefined ? ["domestico", "vertebrado"] : [animal.bajoControlHumano ? "domestico" : "vertebrado"]) {
      const base = `340bis.${animal.resultado === "muerte" ? "3" : "1"}.${clase}`;
      alternativas.push(base as SupuestoPenalId, `${base}.agravado` as SupuestoPenalId);
    }
  }
  const comunes = consecuenciasComunesPenales(alternativas);
  const pendiente = supuesto.penas.tipo === "pendiente";
  return { supuesto, comunes,
    actuacion: preceptId === "CP-340-BIS" ? ["Hacer cesar la agresión y proteger al animal.", "Solicitar atención veterinaria cuando sea necesaria.", "Identificar al responsable, documentar hechos y preservar indicios; coordinar con la unidad competente."] : ["Documentar los hechos, identificar a la persona y asegurar los indicios.", "Coordinar las diligencias y aplicar las garantías de la situación procesal indicada."],
    incertidumbre: pendiente ? "La especie, el resultado y las circunstancias todavía no comprobadas se determinarán durante la investigación. No se presume ningún dato ausente." : undefined,
    procesal: resolverSituacionProcesal({ ...input, alternativasPenales: alternativas, gravedad: supuesto.gravedad, procedibilidad: pendiente ? comunes.procedibilidad : supuesto.procedibilidad }),
  };
}
