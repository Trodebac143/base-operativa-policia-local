"use client";

import { useState, type ReactNode } from "react";
import { SourceLinks } from "./source-links";
import { visibleOperationalWarnings } from "@/data/warnings";
import { SanctionPresentation } from "./sanction-presentation";
import { convivenciaGroups } from "@/data/convivencia";
import type { ConvivenciaData, ConvivenciaOutcome, OperationalCase, SpecificRegulationDestination, SpecificRegulationReferral } from "@/data/types";

const paths: Record<string, ReactNode> = {
  people: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.3" /><path d="M3.5 20v-1.2a5.5 5.5 0 0 1 11 0V20zM15 15.2a4.5 4.5 0 0 1 5.5 4.1V20h-4" /></>,
  sound: <><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9c1 .8 1.5 1.8 1.5 3S17 14.2 16 15M19 6c2 1.6 3 3.6 3 6s-1 4.4-3 6" /></>,
  party: <><path d="m5 20 4-12 4 12zM8 8l3-5 2 5M16 5v3M20 9l-2 2M4 5l2 2M18 16h.01M5 14h.01" /><path d="M3 20h18" /></>,
  fountain: <><path d="M3 18h18M5 18c.5-3 2-4 4-4s3.5 1 4 4M9 14c0-4 3-6 3-9 2 2 3 4 3 6" /><path d="M12 5V3M16 14c1.5 0 2.5 1.2 3 4" /></>,
  tools: <><path d="M4 20 15 9M6 4a4 4 0 0 0 4 5l-6 6a3 3 0 0 0 4 4l6-6a4 4 0 0 0 5-4l-3 2-3-3z" /><circle cx="18" cy="18" r="2" /></>,
  leaf: <><path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-6 10-16Z" /><path d="M4 21c3-5 7-8 12-11" /></>,
  tree: <><path d="M12 21v-7M8 14h8l-1.5-3H16l-4-7-4 7h1.5zM5 21h14" /></>,
  droplet: <><path d="M12 3C9 7 6 10.2 6 14a6 6 0 0 0 12 0c0-3.8-3-7-6-11Z" /><path d="M9.5 15.5a2.5 2.5 0 0 0 2.5 2" /></>,
  balcony: <><path d="M4 20h16M5 20V9h14v11M3 9l9-6 9 6M8 12v5M12 12v5M16 12v5" /></>,
  sofa: <><path d="M4 11h16v7H4zM6 11V8h4v3M14 11V8h4v3M6 18v2M18 18v2" /></>,
  bricks: <><path d="M3 7h7v5H3zM10 7h11v5H10zM3 12h11v5H3zM14 12h7v5h-7zM3 17h7v4H3zM10 17h11v4H10z" /></>,
  warning: <><path d="m12 3 10 18H2z" /><path d="M12 9v5M12 17h.01" /></>,
  building: <><path d="M3 21h18M5 21V8l7-4 7 4v13M9 21v-7h6v7M8 10h.01M12 10h.01M16 10h.01" /></>,
  brush: <><path d="m14 4 6 6-8 8-5 1 1-5zM5 20h14" /></>,
  cafe: <><path d="M4 7h13v8H4zM17 9h2a2 2 0 0 1 0 4h-2M6 20h10M8 15v5M14 15v5" /></>,
  shop: <><path d="M4 10h16v10H4zM3 10l2-6h14l2 6M8 20v-6h5v6M4 10c1 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0 1 2 3 2 4 0" /></>,
  barrier: <><path d="M4 19h16M6 19V9h12v10M7 9l3-4h4l3 4M9 13h6M9 16h6" /></>,
  clean: <><path d="M5 20h14M7 20l2-9h6l2 9M9 11V6h6v5M11 3h2" /><path d="M5 8h.01M19 7h.01" /></>,
  spray: <><path d="M9 7h7v4H9zM11 7V4h3M14 11v9H8v-9M6 15h.01M18 14h.01M20 17h.01" /></>,
  car: <><path d="M3 15h18v4H3zM5 15l2-6h10l2 6M7 19h.01M17 19h.01M12 5l2 2-2 2" /></>,
  sign: <><path d="M4 4h16v11H4zM12 15v6M8 21h8M7 8h10M7 11h6" /></>,
  mailbox: <><path d="M4 20V9a4 4 0 0 1 8 0v11M12 20V8h7v12zM4 13h8M15 11h2" /><path d="M7 5V3" /></>,
  megaphone: <><path d="M3 10v4h4l11 5V5L7 10zM7 14l2 6h4l-2-4M21 9v6" /></>,
  poster: <><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" /><path d="M3 7h3M18 7h3" /></>,
  street: <><path d="M3 21 9 3h6l6 18M8 21h8M11 7h2M10 12h4M9 17h6" /></>,
  furniture: <><path d="M4 11h16v7H4zM6 11V8h4v3M14 11V8h4v3M6 18v2M18 18v2" /><path d="M3 14h18" /></>,
  bin: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /><path d="M3 21h18" /></>,
  fire: <><path d="M12 21c4 0 7-2.8 7-6.5 0-3-2-5.3-4.5-7.5 0 3-1.7 4.2-2.8 5.1.3-2.4-1-4.9-3.2-7.1C7.8 8.8 5 11.3 5 14.5 5 18.2 8 21 12 21z" /><path d="M12 21c-1.8-1.4-2.3-3.4-1.2-5.4.5 1 1.2 1.6 2.2 1.9.9-.8 1.3-1.7 1.1-2.8 1.1 1 1.9 2.3 1.9 3.8" /></>,
};

function Icon({ name }: { name?: string }) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name ?? ""] ?? paths.street}</svg>;
}
const dataOf = (item: OperationalCase) => item.datos_adicionales?.convivencia as (ConvivenciaData & { icono?: string; tema?: string }) | undefined;
const matches = (expected: Record<string, string>, answers: Record<string, string>) => Object.entries(expected).every(([key, value]) => answers[key] === value);
const visible = (condition: NonNullable<ConvivenciaData["condiciones"]>[number], answers: Record<string, string>) => !condition.mostrarSi?.length || condition.mostrarSi.some((expected) => matches(expected, answers));
const matchOutcome = (outcomes: ConvivenciaOutcome[] | undefined, answers: Record<string, string>) => outcomes?.filter((outcome) => matches(outcome.cuando, answers)).sort((left, right) => Object.keys(right.cuando).length - Object.keys(left.cuando).length)[0];
export const convivenciaIconNames = Object.keys(paths);

export function sourceIdsForConvivenciaOutcome(caseId: string, caseSources: string[], outcome?: ConvivenciaOutcome) {
  if (outcome?.fuentes) return outcome.fuentes;
  if (caseId === "CONV-OP-008" && outcome) return [];
  return caseSources;
}

export function pruneHiddenConvivenciaAnswers(conditions: NonNullable<ConvivenciaData["condiciones"]>, answers: Record<string, string>) {
  let current = { ...answers };
  while (true) {
    const visibleIds = new Set(conditions.filter((condition) => visible(condition, current)).map((condition) => condition.id));
    const next = Object.fromEntries(Object.entries(current).filter(([id]) => visibleIds.has(id)));
    if (Object.keys(next).length === Object.keys(current).length) return next;
    current = next;
  }
}

export function SpecificRegulationCard({ referral, onNavigate }: { referral: SpecificRegulationReferral; onNavigate: (destination: SpecificRegulationDestination) => void }) {
  return <section className="conv-specific-regulation"><h3>🟠 EXISTE REGULACIÓN ESPECÍFICA</h3><p><strong>{referral.nombre}</strong></p><p>{referral.explicacion}</p><button type="button" onClick={() => onNavigate(referral.destino)}>{referral.etiquetaBoton}<span aria-hidden="true">›</span></button></section>;
}

export function ConvivenciaCategoryView({ cases, onOpenCase, selectedGroup, onSelectGroup }: { cases: OperationalCase[]; onOpenCase: (item: OperationalCase) => void; selectedGroup?: string; onSelectGroup?: (group: string | undefined) => void }) {
  const [localGroup, setLocalGroup] = useState<string>();
  const activeGroup = onSelectGroup ? selectedGroup : localGroup;
  const selectGroup = (group: string | undefined) => onSelectGroup ? onSelectGroup(group) : setLocalGroup(group);
  return <section className="conv-category"><div className="sectionhead"><span className="kicker">POLICÍA ADMINISTRATIVA</span><h2>🤝 Convivencia</h2><p>{activeGroup ? "Elige la situación observada en el espacio público." : "Selecciona el ámbito de la situación observada."}</p></div>
    {!activeGroup ? <div className="conv-group-selector">{convivenciaGroups.map((group) => <button className={`conv-group-card conv-theme-${group.tema}`} key={group.nombre} type="button" onClick={() => selectGroup(group.nombre)}><span className="conv-group-card-icon"><Icon name={group.icono} /></span><strong>{group.nombre}</strong><b aria-hidden="true">›</b></button>)}</div> : <><button className="conv-groups-back" type="button" onClick={() => selectGroup(undefined)}>← Volver a los grupos</button>{convivenciaGroups.filter((group) => group.nombre === activeGroup).map((group) => {
      const entries = cases.filter((item) => dataOf(item)?.grupo === group.nombre).sort((a, b) => (dataOf(a)?.orden ?? 0) - (dataOf(b)?.orden ?? 0));
      const sections = group.secciones ? [...group.secciones.map((section) => ({ nombre: section.nombre, entries: entries.filter((item) => section.casos.includes(item.id)) })), { nombre: "Otras situaciones", entries: entries.filter((item) => !group.secciones?.some((section) => section.casos.includes(item.id))) }] : [{ nombre: undefined, entries }];
      return <section className={`conv-group conv-theme-${group.tema}`} key={group.nombre}><h3><span className="conv-group-icon"><Icon name={group.icono} /></span><span>{group.nombre}</span><small>{entries.length} {entries.length === 1 ? "caso" : "casos"}</small></h3>{sections.filter((section) => section.entries.length).map((section) => <div key={section.nombre ?? group.nombre}>{section.nombre && <h4 className="conv-topic-heading">{section.nombre}</h4>}{section.entries.map((item) => <button className={`conv-case-card conv-theme-${dataOf(item)?.tema ?? group.tema}`} key={item.id} type="button" onClick={() => onOpenCase(item)}><span className="conv-card-content"><span className="conv-card-icon"><Icon name={dataOf(item)?.icono} /></span><strong>{item.titulo}</strong></span><b aria-hidden="true">›</b></button>)}</div>)}</section>;
    })}</>}
  </section>;
}

export function ConvivenciaCaseSheet({ item, onNavigate }: { item: OperationalCase; onNavigate: (destination: SpecificRegulationDestination) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const data = dataOf(item); const conditions = data?.condiciones?.filter((condition) => visible(condition, answers)) ?? []; const allFactsAnswered = conditions.every((condition) => answers[condition.id]); const outcome = allFactsAnswered ? matchOutcome(data?.salidas, answers) : undefined; const ready = !data?.condiciones?.length || Boolean(outcome);
  const article = outcome?.articulo ?? item.articulo; const classification = outcome?.calificacion ?? item.calificacion; const sanction = outcome?.sancion; const noInfringement = outcome?.sinInfraccion; const referral = outcome?.regulacionEspecifica;
  const unresolved = Boolean(outcome && !outcome.pendiente && !outcome.sinInfraccion && !outcome.regulacionEspecifica && !outcome.articulo && !outcome.sancion && !outcome.resultado && !outcome.otraVia);
  const pending = Boolean(outcome?.pendiente || unresolved);
  const result = unresolved ? "Esta combinación requiere una derivación o comprobación adicional. No se asigna una sanción automática." : outcome?.resultado ?? item.resultado;
  const outcomeSources = sourceIdsForConvivenciaOutcome(item.id, item.fuentes, outcome);
  return <article className="conv-sheet"><div className="sheettitle"><div><span className="kicker">FICHA OPERATIVA</span><h2>{item.titulo}</h2></div></div>
    <section><h3>QUÉ COMPROBAR</h3><ul>{item.que_comprobar.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>
    {!!data?.condiciones?.length && <section className="conv-facts"><h3>DATOS DEL SUPUESTO</h3>{conditions.map((condition) => <fieldset key={condition.id}><legend>{condition.etiqueta}</legend>{condition.ayuda && <p className="conv-help">{condition.ayuda}</p>}<div>{condition.opciones.map((option) => <button type="button" className={answers[condition.id] === option.valor ? "selected" : ""} aria-pressed={answers[condition.id] === option.valor} key={option.valor} onClick={() => setAnswers((previous) => pruneHiddenConvivenciaAnswers(data.condiciones ?? [], { ...previous, [condition.id]: option.valor }))}>{option.icono && <span className="conv-option-icon" aria-hidden="true"><Icon name={option.icono} /></span>}{option.etiqueta}</button>)}</div></fieldset>)}</section>}
    {!referral && <section><h3>RESULTADO</h3>{!ready ? <p>Completa los datos observados para mostrar el resultado aplicable.</p> : pending || noInfringement ? <>{outcome?.norma && <p><strong>{outcome.norma}</strong></p>}<p>{result}</p></> : <><p><strong>{outcome?.norma ?? item.norma}</strong> · art. {article}</p>{classification && <p><strong>{classification}</strong></p>}<p>{result}</p><SanctionPresentation sanction={sanction} fixed={pending || noInfringement ? undefined : item.importe_fijo} min={pending || noInfringement ? undefined : item.rango_min} max={pending || noInfringement ? undefined : item.rango_max} /></>}</section>}
    {ready && referral && <SpecificRegulationCard referral={referral} onNavigate={onNavigate} />}
    {ready && !noInfringement && !referral && <section><h3>ACTUACIÓN</h3><ul>{item.actuacion.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>}
    {ready && outcome?.otraVia && <section className="conv-other-way"><h3>OTRA VÍA / MATERIA RELACIONADA</h3><p>{outcome.otraVia}</p></section>}
    {ready && !noInfringement && !referral && <section><h3>COMPETENCIA</h3><p>{item.competencia_resuelve}</p></section>}
    {visibleOperationalWarnings(item).length > 0 && <section><h3>ADVERTENCIAS</h3><ul>{visibleOperationalWarnings(item).map((warning) => <li key={warning}>{warning}</li>)}</ul></section>}
    <SourceLinks sourceIds={outcomeSources} className="conv-sources" />
  </article>;
}
