"use client";

import { useState } from "react";
import type { OperationalCase } from "@/data/types";
import { SourceLinks } from "./source-links";

type TerraceAnswer = string | string[];
type TerraceAnswers = Record<string, TerraceAnswer>;
type TerraceOption = { value: string; label: string; detail?: string; reference?: string[] };
type TerraceCondition = { field?: string; equals?: string; not_equals?: string; one_of?: string[]; includes?: string; includes_any?: string[]; non_empty?: boolean; empty?: boolean; any_of?: TerraceCondition[]; all_of?: TerraceCondition[] };
type TerraceField = {
  id: string;
  label: string;
  type: "choice" | "multi" | "number" | "text";
  options?: TerraceOption[];
  help?: string;
  unit?: string;
  placeholder?: string;
  reference?: string[];
  visible_when?: TerraceCondition[];
};
type TerraceOutcome = {
  id: string;
  title: string;
  when: TerraceCondition[];
  unless?: TerraceCondition[];
  status: "infraccion" | "sin_infraccion" | "pendiente" | "informacion";
  classification?: "LEVE" | "GRAVE" | "MUY GRAVE";
  article?: string;
  amount?: number;
  detail: string;
  measures?: string[];
};
type TerraceData = {
  icon: string;
  group: string;
  order: number;
  summary: string;
  information?: string[];
  fields: TerraceField[];
  outcomes: TerraceOutcome[];
  calculation?: "excess_percent" | "passage_reduction_percent";
  final_note?: string;
};
type TerraceCase = OperationalCase & { datos_adicionales: OperationalCase["datos_adicionales"] & { terrazas: TerraceData } };

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const GROUPS = ["Autorización y espacio", "Seguridad y condiciones", "Funcionamiento y convivencia", "Control administrativo"];

const terraceData = (item: OperationalCase): TerraceData | undefined => (item.datos_adicionales as { terrazas?: TerraceData } | undefined)?.terrazas;
const asTerraceCase = (item: OperationalCase): item is TerraceCase => Boolean(terraceData(item));

function conditionMatches(condition: TerraceCondition, answers: TerraceAnswers): boolean {
  if (condition.any_of) return condition.any_of.some((candidate) => conditionMatches(candidate, answers));
  if (condition.all_of) return condition.all_of.every((candidate) => conditionMatches(candidate, answers));
  if (!condition.field) return false;
  const answer = answers[condition.field];
  if (condition.equals !== undefined) return answer === condition.equals;
  if (condition.not_equals !== undefined) return answer !== undefined && answer !== condition.not_equals;
  if (condition.one_of !== undefined) return typeof answer === "string" && condition.one_of.includes(answer);
  if (condition.includes !== undefined) return Array.isArray(answer) && answer.includes(condition.includes);
  if (condition.includes_any !== undefined) return Array.isArray(answer) ? condition.includes_any.some((entry) => answer.includes(entry)) : typeof answer === "string" && condition.includes_any.includes(answer);
  if (condition.non_empty) return Array.isArray(answer) ? answer.length > 0 : typeof answer === "string" && answer.trim().length > 0;
  if (condition.empty) return answer === undefined || (Array.isArray(answer) ? answer.length === 0 : answer.trim().length === 0);
  return false;
}

function allConditionsMatch(conditions: TerraceCondition[] | undefined, answers: TerraceAnswers) {
  return Boolean(conditions?.length) && conditions!.every((condition) => conditionMatches(condition, answers));
}

function withoutHiddenAnswers(data: TerraceData, candidate: TerraceAnswers) {
  let next = { ...candidate };
  let changed = true;
  while (changed) {
    changed = false;
    for (const field of data.fields) {
      if (field.visible_when && !field.visible_when.every((condition) => conditionMatches(condition, next)) && Object.hasOwn(next, field.id)) {
        const rest = { ...next };
        delete rest[field.id];
        next = rest;
        changed = true;
      }
    }
  }
  return next;
}

function withCalculation(data: TerraceData, answers: TerraceAnswers) {
  const next = { ...answers };
  const scaled = (value: TerraceAnswer | undefined) => typeof value === "string" && value.trim() !== "" ? Math.round(Number(value.replace(",", ".")) * 100) : Number.NaN;
  if (data.calculation === "excess_percent") {
    const authorized = scaled(answers.superficie_autorizada);
    const occupied = scaled(answers.superficie_ocupada);
    if (Number.isFinite(authorized) && Number.isFinite(occupied) && authorized > 0 && occupied >= 0) {
      const percent = ((occupied - authorized) / authorized) * 100;
      next._calculation = percent.toFixed(2);
      const excessTimesHundred = (occupied - authorized) * 100;
      const twentyPercent = authorized * 20;
      next._band = excessTimesHundred > twentyPercent ? "mas_20" : excessTimesHundred > 0 ? "hasta_20" : "sin_exceso";
    }
  }
  if (data.calculation === "passage_reduction_percent") {
    const authorized = scaled(answers.anchura_autorizada);
    const free = scaled(answers.anchura_libre);
    if (Number.isFinite(authorized) && Number.isFinite(free) && authorized > 0 && free >= 0) {
      const percent = ((authorized - free) / authorized) * 100;
      next._calculation = percent.toFixed(2);
      const reductionTimesHundred = (authorized - free) * 100;
      const tenPercent = authorized * 10;
      const twentyFivePercent = authorized * 25;
      if (reductionTimesHundred > twentyFivePercent) next._band = "mas_25";
      else if (reductionTimesHundred > tenPercent && reductionTimesHundred < twentyFivePercent) next._band = "mas_10_menos_25";
      else if (reductionTimesHundred === tenPercent || reductionTimesHundred === twentyFivePercent) next._band = "limite_literal";
      else next._band = "fuera_tramos";
    }
  }
  return next;
}

export function updateTerraceAnswer(item: OperationalCase, answers: TerraceAnswers, field: string, value: TerraceAnswer) {
  const data = terraceData(item);
  return data ? withoutHiddenAnswers(data, { ...answers, [field]: value }) : answers;
}

export function resolveTerraceState(item: OperationalCase, answers: TerraceAnswers) {
  const data = terraceData(item);
  if (!data) return { answers, outcomes: [] as TerraceOutcome[] };
  const resolved = withCalculation(data, withoutHiddenAnswers(data, answers));
  return { answers: resolved, outcomes: data.outcomes.filter((outcome) => allConditionsMatch(outcome.when, resolved) && !allConditionsMatch(outcome.unless, resolved)) };
}

export function TerracesCategoryView({ cases, onOpenCase }: { cases: OperationalCase[]; onOpenCase: (item: OperationalCase) => void }) {
  const terraceCases = cases.filter(asTerraceCase).sort((left, right) => terraceData(left)!.order - terraceData(right)!.order);
  return <section className="terraces-home">
    <div className="sectionhead"><span className="kicker">🏛️ POLICÍA ADMINISTRATIVA</span><h2>☕ Terrazas</h2><p>Selecciona la situación que necesitas comprobar y sigue los hechos observables.</p></div>
    <aside className="terrace-common" aria-label="Criterios comunes de terrazas">
      <strong>Criterios comunes</strong>
      <div><span>Responsable · titular de la instalación (art. 26)</span><span>Leve · 150 €</span><span>Grave · 300 €</span><span>Muy grave · 600 €</span></div>
      <p>Las infracciones muy graves pueden comportar además revocación y/o inhabilitación de hasta cinco años; es información para el expediente, no una consecuencia policial automática.</p>
    </aside>
    <div className="terrace-groups">{GROUPS.map((group) => {
      const items = terraceCases.filter((item) => terraceData(item)!.group === group);
      if (!items.length) return null;
      return <section key={group} className="terrace-group"><h3>{group}</h3><div className="terrace-index">{items.map((item) => {
        const data = terraceData(item)!;
        return <button type="button" key={item.id} onClick={() => onOpenCase(item)}><span className="terrace-index-icon" aria-hidden="true">{data.icon}</span><span><strong>{item.titulo.replace(/^\S+\s/, "")}</strong><small>{data.summary}</small></span><b aria-hidden="true">›</b></button>;
      })}</div></section>;
    })}</div>
    <p className="terrace-competence">Competencia sancionadora (art. 30): Junta de Gobierno Local, con posibilidad de delegación en el concejal que tenga atribuidas las competencias indicadas en la ordenanza.</p>
  </section>;
}

export function TerraceCaseSheet({ item }: { item: OperationalCase; copied: boolean; onCopy: () => void }) {
  const data = terraceData(item);
  const [answers, setAnswers] = useState<TerraceAnswers>({});
  if (!data) return null;
  const { answers: resolvedAnswers, outcomes } = resolveTerraceState(item, answers);
  const setAnswer = (field: string, value: TerraceAnswer) => setAnswers((current) => updateTerraceAnswer(item, current, field, value));
  const toggle = (field: string, value: string) => setAnswers((current) => {
    const previous = Array.isArray(current[field]) ? current[field] as string[] : [];
    return updateTerraceAnswer(item, current, field, previous.includes(value) ? previous.filter((entry) => entry !== value) : [...previous, value]);
  });

  return <article className="terrace-sheet">
    <div className="sheettitle"><div><h2>{data.icon} {item.titulo.replace(/^\S+\s/, "")}</h2><p>{data.summary}</p></div></div>
    {!!data.information?.length && <section className="terrace-reference"><h3>Referencia operativa</h3><ul>{data.information.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>}
    <section className="terrace-check"><div className="terrace-section-title"><span>1</span><div><h3>Hechos observados</h3><p>Completa únicamente lo comprobado en la intervención.</p></div></div>
      <div className="terrace-fields">{data.fields.map((field) => {
        if (field.visible_when && !field.visible_when.every((condition) => conditionMatches(condition, answers))) return null;
        return <TerraceFieldControl key={field.id} field={field} value={answers[field.id]} onChange={(value) => setAnswer(field.id, value)} onToggle={(value) => toggle(field.id, value)} />;
      })}</div>
      {resolvedAnswers._calculation && <div className="terrace-calculation"><span>Porcentaje calculado</span><strong>{resolvedAnswers._calculation} %</strong><small>Comprueba las mediciones consignadas antes de usar el encaje.</small></div>}
    </section>
    {!!outcomes.length && <section className="terrace-result"><div className="terrace-section-title"><span>2</span><div><h3>Resultado</h3></div></div>
      {outcomes.map((outcome) => <OutcomeCard key={outcome.id} outcome={outcome} />)}
      {outcomes.length > 1 && <p className="terrace-multiple-note">Consigna todos los hechos concurrentes en una sola actuación; la mera concurrencia no implica por sí sola varias sanciones.</p>}
    </section>}
    <section className="terrace-actions"><div className="terrace-section-title"><span>3</span><div><h3>Actuación policial</h3></div></div><ol>{item.actuacion.map((entry) => <li key={entry}>{entry}</li>)}</ol>{data.final_note && <p className="terrace-final-note">{data.final_note}</p>}
      <dl><div><dt>Responsable</dt><dd>{item.responsable}</dd></div><div><dt>Órgano actuante</dt><dd>{item.competencia_denuncia}</dd></div><div><dt>Órgano sancionador</dt><dd>{item.competencia_resuelve}</dd></div></dl>
    </section>
    <SourceLinks sourceIds={item.fuentes} className="case-sources terrace-sources" />
    <button type="button" className="terrace-reset" onClick={() => setAnswers({})}>Limpiar comprobación</button>
  </article>;
}

function TerraceFieldControl({ field, value, onChange, onToggle }: { field: TerraceField; value?: TerraceAnswer; onChange: (value: string) => void; onToggle: (value: string) => void }) {
  const inputId = `terrace-${field.id}`;
  const selectedOption = field.options?.find((option) => option.value === value);
  return <fieldset className={`terrace-field terrace-field-${field.type}`}><legend>{field.label}</legend>{field.help && <p>{field.help}</p>}
    {!!field.reference?.length && <OperationalReference entries={field.reference} />}
    {field.type === "choice" && <div className="terrace-options">{field.options?.map((option) => <button type="button" key={option.value} className={value === option.value ? "selected" : ""} aria-pressed={value === option.value} onClick={() => onChange(option.value)}><strong>{option.label}</strong>{option.detail && <small>{option.detail}</small>}</button>)}</div>}
    {!!selectedOption?.reference?.length && <OperationalReference entries={selectedOption.reference} />}
    {field.type === "multi" && <TerraceMultiOptions options={field.options ?? []} value={value} onToggle={onToggle} />}
    {field.type === "number" && <label className="terrace-input" htmlFor={inputId}><input id={inputId} type="number" min="0" step="0.01" inputMode="decimal" value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} /><span>{field.unit}</span></label>}
    {field.type === "text" && <textarea id={inputId} value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} rows={3} />}
  </fieldset>;
}

function TerraceMultiOptions({ options, value, onToggle }: { options: TerraceOption[]; value?: TerraceAnswer; onToggle: (value: string) => void }) {
  const hasSections = options.filter((option) => option.label.includes(":")).length >= 2;
  const grouped = new Map<string, TerraceOption[]>();
  for (const option of options) {
    const separator = hasSections ? option.label.indexOf(":") : -1;
    const section = separator > 0 ? option.label.slice(0, separator) : "";
    const label = separator > 0 ? option.label.slice(separator + 1).trim() : option.label;
    grouped.set(section, [...(grouped.get(section) ?? []), { ...option, label }]);
  }
  return <div className="terrace-multi-groups">{[...grouped.entries()].map(([section, entries]) => <section key={section || "items"}>
    {section && <h4>{section}</h4>}
    <div className="terrace-multi">{entries.map((option) => { const checked = Array.isArray(value) && value.includes(option.value); return <label key={option.value}><input type="checkbox" checked={checked} onChange={() => onToggle(option.value)} /><span><strong>{option.label}</strong>{option.detail && <small>{option.detail}</small>}</span></label>; })}</div>
  </section>)}</div>;
}

function OperationalReference({ entries }: { entries: string[] }) {
  return <aside className="terrace-inline-reference"><strong>Qué exige la Ordenanza</strong><ul>{entries.map((entry) => <li key={entry}>{entry}</li>)}</ul></aside>;
}

function OutcomeCard({ outcome }: { outcome: TerraceOutcome }) {
  return <article className={`terrace-outcome ${outcome.status}`}><div><span>{outcome.status === "infraccion" ? "POSIBLE INFRACCIÓN" : outcome.status === "pendiente" ? "COMPROBACIÓN PENDIENTE" : outcome.status === "sin_infraccion" ? "SIN INFRACCIÓN EN ESTE SUPUESTO" : "INFORMACIÓN"}</span><h4>{outcome.title}</h4></div>{outcome.classification && <p className="terrace-sanction"><strong>{outcome.classification}</strong><span>Art. {outcome.article}</span><b>{euro.format(outcome.amount ?? 0)}</b></p>}<p>{outcome.detail}</p>{!!outcome.measures?.length && <ul>{outcome.measures.map((measure) => <li key={measure}>{measure}</li>)}</ul>}</article>;
}
