"use client";

import { useState } from "react";
import { resolverDerivacionPenal, type AnimalPenalFacts } from "@/data/derivaciones-penales";
import { ProcessualControls, AuthorSituation, ProcessualExplanation, PendingDetails, ExportPenaltyFramework as PenaltyFramework, type ProcessualFactsForm } from "./seguridad-publica";

export function PenalDerivation({ preceptId }: { preceptId: string }) {
  const [animal, setAnimal] = useState<AnimalPenalFacts>({});
  const [flagrante, setFlagrante] = useState<boolean>();
  const [facts, setFacts] = useState<ProcessualFactsForm>({});
  const resolved = resolverDerivacionPenal(preceptId, { ...facts, flagrante }, animal);
  if (!resolved) return null;
  const minor = (resolved.supuesto.gravedad ?? resolved.comunes.gravedad) === "DELITO LEVE";
  return <section className="sp-section">
    {preceptId === "CP-340-BIS" && <>
      <fieldset className="sp-choice"><legend>¿Es un mamífero, ave, reptil, anfibio o pez?</legend>{[true, false].map((value) => <label key={String(value)}><input type="radio" checked={animal.vertebrado === value} onChange={() => setAnimal((current) => ({ ...current, vertebrado: value }))} />{value ? "Sí" : "No"}</label>)}</fieldset>
      <fieldset className="sp-choice"><legend>¿Qué se observa o se conoce ya sobre el animal?</legend><select aria-label="Hechos observados sobre el animal" value={animal.resultado ?? ""} onChange={(event) => setAnimal((current) => ({ ...current, resultado: event.target.value as AnimalPenalFacts["resultado"] || undefined }))}>
        <option value="">No se ha podido comprobar</option>
        <option value="lesion_pendiente">Golpes o lesiones observados; aún sin atención veterinaria</option>
        <option value="tratamiento">Ya consta indicación veterinaria de tratamiento por las lesiones</option>
        <option value="muerte">Muerte del animal tras la agresión observada o referida</option>
      </select></fieldset>
      {animal.resultado && <fieldset className="sp-choice"><legend>¿Vive con personas o bajo su cuidado o control?</legend>{[true, false].map((value) => <label key={String(value)}><input type="radio" checked={animal.bajoControlHumano === value} onChange={() => setAnimal((current) => ({ ...current, bajoControlHumano: value }))} />{value ? "Sí" : "No; otro animal vertebrado"}</label>)}</fieldset>}
    </>}
    {(resolved.supuesto.gravedad || resolved.comunes.alternativasPenales.length > 0) && <ProcessualControls flagrante={flagrante} setFlagrante={setFlagrante} facts={facts} setFacts={setFacts} minor={minor} />}
    <h3>{preceptId === "CP-340-BIS" ? "POSIBLE MALTRATO ANIMAL" : resolved.supuesto.descripcion}</h3>
    <p>{resolved.supuesto.gravedad ?? resolved.comunes.gravedad}</p>
    <AuthorSituation decision={resolved.procesal} explain={false} />
    <h3>Actuación inmediata</h3><ul>{resolved.actuacion.map((item) => <li key={item}>{item}</li>)}</ul>
    <ProcessualExplanation decision={resolved.procesal} />
    <PendingDetails text={resolved.incertidumbre} />
    <PenaltyFramework supuestoPenalId={resolved.supuesto.id as Parameters<typeof PenaltyFramework>[0]["supuestoPenalId"]} />
  </section>;
}
