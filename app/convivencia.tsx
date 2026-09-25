"use client";

import { useState, type ReactNode } from "react";
import { SourceLinks } from "./source-links";
import type { ConvivenciaData, ConvivenciaOutcome, OperationalCase } from "@/data/types";

const groups = ["Convivencia y molestias", "Limpieza y uso del espacio público", "Riesgos / incidencias"];
const groupIcons: Record<string, string> = { "Convivencia y molestias": "sound", "Limpieza y uso del espacio público": "clean", "Riesgos / incidencias": "fire" };
const caseIcons: Record<string, string> = {
  "CONV-OP-001": "sound", "CONV-OP-002": "fountain", "CONV-OP-003": "tools", "CONV-OP-004": "barrier", "CONV-OP-005": "clean", "CONV-OP-006": "spray", "CONV-OP-007": "car", "CONV-OP-008": "poster", "CONV-OP-009": "bin", "CONV-OP-010": "fire",
};
const paths: Record<string, ReactNode> = {
  sound: <><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9c1 .8 1.5 1.8 1.5 3S17 14.2 16 15M19 6c2 1.6 3 3.6 3 6s-1 4.4-3 6" /></>,
  fountain: <><path d="M3 18h18M5 18c.5-3 2-4 4-4s3.5 1 4 4M9 14c0-4 3-6 3-9 2 2 3 4 3 6" /><path d="M12 5V3M16 14c1.5 0 2.5 1.2 3 4" /></>,
  tools: <><path d="M4 20 15 9M6 4a4 4 0 0 0 4 5l-6 6a3 3 0 0 0 4 4l6-6a4 4 0 0 0 5-4l-3 2-3-3z" /><circle cx="18" cy="18" r="2" /></>,
  barrier: <><path d="M4 19h16M6 19V9h12v10M7 9l3-4h4l3 4M9 13h6M9 16h6" /></>,
  clean: <><path d="M5 20h14M7 20l2-9h6l2 9M9 11V6h6v5M11 3h2" /><path d="M5 8h.01M19 7h.01" /></>,
  spray: <><path d="M9 7h7v4H9zM11 7V4h3M14 11v9H8v-9M6 15h.01M18 14h.01M20 17h.01" /></>,
  car: <><path d="M3 15h18v4H3zM5 15l2-6h10l2 6M7 19h.01M17 19h.01M12 5l2 2-2 2" /></>,
  poster: <><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" /><path d="M3 7h3M18 7h3" /></>,
  bin: <><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /><path d="M3 21h18" /></>,
  fire: <><path d="M12 21c4 0 7-2.8 7-6.5 0-3-2-5.3-4.5-7.5 0 3-1.7 4.2-2.8 5.1.3-2.4-1-4.9-3.2-7.1C7.8 8.8 5 11.3 5 14.5 5 18.2 8 21 12 21z" /><path d="M12 21c-1.8-1.4-2.3-3.4-1.2-5.4.5 1 1.2 1.6 2.2 1.9.9-.8 1.3-1.7 1.1-2.8 1.1 1 1.9 2.3 1.9 3.8" /></>,
};
function Icon({ name }: { name: string }) { return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{paths[name] ?? paths.poster}</svg>; }
const dataOf = (item: OperationalCase) => item.datos_adicionales?.convivencia as ConvivenciaData | undefined;
const matchOutcome = (outcomes: ConvivenciaOutcome[] | undefined, answers: Record<string, string>) => outcomes?.find((outcome) => Object.entries(outcome.cuando).every(([key, value]) => answers[key] === value));

export function ConvivenciaCategoryView({ cases, onOpenCase }: { cases: OperationalCase[]; onOpenCase: (item: OperationalCase) => void }) {
  return <section className="conv-category"><div className="sectionhead"><span className="kicker">POLICÍA ADMINISTRATIVA</span><h2>🤝 Convivencia</h2><p>Elige la situación observada en el espacio público.</p></div>{groups.map((group, index) => {
    const entries = cases.filter((item) => dataOf(item)?.grupo === group).sort((a, b) => (dataOf(a)?.orden ?? 0) - (dataOf(b)?.orden ?? 0));
    return <section className={`conv-group conv-group-${index + 1}`} key={group}><h3><span className="conv-group-icon"><Icon name={groupIcons[group]} /></span>{group}</h3><div>{entries.map((item) => <button key={item.id} onClick={() => onOpenCase(item)}><span className="conv-card-content"><span className="conv-card-icon"><Icon name={caseIcons[item.id]} /></span><strong>{item.titulo}</strong></span><b aria-hidden="true">›</b></button>)}</div></section>;
  })}</section>;
}

export function ConvivenciaCaseSheet({ item }: { item: OperationalCase }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const data = dataOf(item); const outcome = matchOutcome(data?.salidas, answers); const ready = !data?.condiciones?.length || Boolean(outcome);
  const article = outcome?.articulo ?? item.articulo; const result = outcome?.resultado ?? item.resultado; const classification = outcome?.calificacion ?? item.calificacion; const sanction = outcome?.sancion; const noInfringement = outcome?.sinInfraccion;
  return <article className="conv-sheet"><div className="sheettitle"><div><span className="kicker">FICHA OPERATIVA</span><h2>{item.titulo}</h2></div></div>
    <section><h3>QUÉ COMPROBAR</h3><ul>{item.que_comprobar.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>
    {!!data?.condiciones?.length && <section className="conv-facts"><h3>DATOS DEL SUPUESTO</h3>{data.condiciones.map((condition) => <fieldset key={condition.id}><legend>{condition.etiqueta}</legend><div>{condition.opciones.map((option) => <button type="button" className={answers[condition.id] === option.valor ? "selected" : ""} aria-pressed={answers[condition.id] === option.valor} key={option.valor} onClick={() => setAnswers((previous) => ({ ...previous, [condition.id]: option.valor }))}>{option.etiqueta}</button>)}</div></fieldset>)}</section>}
    <section><h3>RESULTADO</h3>{!ready ? <p>Completa los datos observados para mostrar el resultado aplicable.</p> : noInfringement ? <p>{result}</p> : <><p><strong>{item.norma}</strong> · art. {article}</p>{classification && <p><strong>{classification}</strong></p>}<p>{result}</p><p><strong>Sanción prevista:</strong> {sanction ?? (item.importe_fijo != null ? `${item.importe_fijo.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €` : item.rango_max != null ? `hasta ${item.rango_max.toLocaleString("es-ES")} €` : "según el supuesto acreditado")}</p></>}</section>
    {ready && !noInfringement && <section><h3>ACTUACIÓN</h3><ul>{item.actuacion.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>}
    {ready && outcome?.otraVia && <section className="conv-other-way"><h3>OTRA VÍA / MATERIA RELACIONADA</h3><p>{outcome.otraVia}</p></section>}
    {ready && !noInfringement && <section><h3>COMPETENCIA</h3><p>{item.competencia_resuelve}</p></section>}
    <SourceLinks sourceIds={item.fuentes} className="conv-sources" />
  </article>;
}
