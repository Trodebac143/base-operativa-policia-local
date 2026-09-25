"use client";

import { useState, type ReactNode } from "react";
import regimen from "@/contenido/policia_administrativa/venta_no_sedentaria/regimen_sancionador.json";
import { SourceLinks } from "./source-links";
import type { OperationalCase, VentaNoSedentariaData, VentaNoSedentariaOutcome } from "@/data/types";

const groups = ["Autorización y condiciones del puesto", "Documentación y obligaciones", "Inspección e incidencias"];
const groupIcons: Record<string, string> = {
  "Autorización y condiciones del puesto": "Store",
  "Documentación y obligaciones": "ClipboardCheck",
  "Inspección e incidencias": "SearchAlert",
};
const caseIcons: Record<string, string> = {
  "VNS-OP-001": "FileWarning",
  "VNS-OP-002": "FileSearch",
  "VNS-OP-003": "UserRoundX",
  "VNS-OP-004": "Clock3",
  "VNS-OP-005": "PackageX",
  "VNS-OP-006": "MapPinned",
  "VNS-OP-007": "Truck",
  "VNS-OP-008": "FileText",
  "VNS-OP-009": "ReceiptText",
  "VNS-OP-010": "ShieldX",
  "VNS-OP-011": "Trash2",
  "VNS-OP-012": "Sparkles",
  "VNS-OP-013": "Hand",
  "VNS-OP-014": "BadgeAlert",
};
const iconPaths: Record<string, ReactNode> = {
  Store: <><path d="M3 10h18v10H3z" /><path d="M2 10l2-6h16l2 6" /><path d="M7 20v-6h5v6M15 14h3" /></>,
  ClipboardCheck: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M8 13l2 2 4-4" /></>,
  SearchAlert: <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5M10 7v4M10 13h.01" /></>,
  FileWarning: <><path d="M6 3h8l4 4v14H6zM14 3v5h4" /><path d="M12 11v3M12 17h.01" /></>,
  FileSearch: <><path d="M5 3h8l4 4v10H5zM13 3v5h4" /><circle cx="14" cy="16" r="3" /><path d="m16 18 3 3" /></>,
  UserRoundX: <><circle cx="9" cy="8" r="3" /><path d="M3 20c.5-4 3-6 6-6 1.2 0 2.4.4 3.3 1.1M16 16l5 5M21 16l-5 5" /></>,
  Clock3: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5h4" /></>,
  PackageX: <><path d="m4 7 8-4 8 4v10l-8 4-8-4zM4 7l8 4 8-4M12 11v7M17 15l4 4M21 15l-4 4" /></>,
  MapPinned: <><path d="M4 6l6-3 6 3 4-2v14l-4 2-6-3-6 3zM10 3v14M16 6v14" /><path d="M16 8a2 2 0 1 0 0 .01" /></>,
  Truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  FileText: <><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6" /></>,
  ReceiptText: <><path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5L6 21zM9 9h6M9 13h6" /></>,
  ShieldX: <><path d="M12 3l7 3v5c0 5-3.1 8.2-7 10-3.9-1.8-7-5-7-10V6zM9 10l6 6M15 10l-6 6" /></>,
  Trash2: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></>,
  Sparkles: <><path d="m12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8zM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7zM5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7z" /></>,
  Hand: <><path d="M8 12V5a1.5 1.5 0 0 1 3 0v5M11 10V4a1.5 1.5 0 0 1 3 0v6M14 10V6a1.5 1.5 0 0 1 3 0v6l1-1a1.5 1.5 0 0 1 2.2 2l-3.7 5.2A5 5 0 0 1 12.4 21H11a5 5 0 0 1-4-2l-3-4a1.5 1.5 0 0 1 2.2-2z" /></>,
  BadgeAlert: <><path d="m12 3 2 2.2 3-.3.8 2.9 2.6 1.5-1.2 2.8 1.2 2.8-2.6 1.5-.8 2.9-3-.3-2 2.2-2-2.2-3 .3-.8-2.9-2.6-1.5L4.8 12 3.6 9.2l2.6-1.5.8-2.9 3 .3z" /><path d="M12 8v4M12 15h.01" /></>,
};
function VnsIcon({ name }: { name: string }) {
  return <svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">{iconPaths[name] ?? iconPaths.FileText}</svg>;
}
const range = (classification: string | undefined) => classification ? regimen.rangos[classification as keyof typeof regimen.rangos] : undefined;
const matchOutcome = (outcomes: VentaNoSedentariaOutcome[] | undefined, answers: Record<string, string>) => outcomes?.find((outcome) => Object.entries(outcome.cuando).every(([key, value]) => answers[key] === value));

export function VentaNoSedentariaCategoryView({ cases, onOpenCase }: { cases: OperationalCase[]; onOpenCase: (item: OperationalCase) => void }) {
  const data = (item: OperationalCase) => item.datos_adicionales?.venta_no_sedentaria as VentaNoSedentariaData | undefined;
  return <section className="vns-category"><div className="sectionhead"><span className="kicker">POLICÍA ADMINISTRATIVA</span><h2>🛒 Venta no sedentaria</h2><p>Elige la situación observada.</p></div>{groups.map((group, groupIndex) => {
    const entries = cases.filter((item) => data(item)?.grupo === group).sort((a, b) => (data(a)?.orden ?? 0) - (data(b)?.orden ?? 0));
    return <section className={`vns-group vns-group-${groupIndex + 1}`} key={group}><h3><span className="vns-group-title-icon" aria-hidden="true"><VnsIcon name={groupIcons[group]} /></span>{group}</h3><div>{entries.map((item) => {
      return <button key={item.id} onClick={() => onOpenCase(item)}><span className="vns-card-content"><span className="vns-card-icon" aria-hidden="true"><VnsIcon name={caseIcons[item.id] ?? "FileText"} /></span><strong>{item.titulo}</strong></span><b aria-hidden="true">›</b></button>;
    })}</div></section>;
  })}</section>;
}

export function VentaNoSedentariaCaseSheet({ item }: { item: OperationalCase }) {
  const data = item.datos_adicionales?.venta_no_sedentaria as VentaNoSedentariaData | undefined;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const chosen = matchOutcome(data?.salidas, answers);
  const ready = !data?.condiciones?.length || Boolean(chosen);
  const classification = chosen?.clasificacion ?? item.calificacion ?? undefined;
  const article = chosen?.articulo ?? item.articulo;
  const result = chosen?.resultado ?? item.resultado;
  const action = chosen?.sinInfraccion ? [] : item.actuacion;
  return <article className="vns-sheet"><div className="sheettitle"><div><span className="kicker">FICHA OPERATIVA</span><h2>{item.titulo}</h2></div></div>
    <section><h3>QUÉ COMPROBAR</h3><ul>{item.que_comprobar.map((check) => <li key={check}>{check}</li>)}</ul></section>
    {!!data?.condiciones?.length && <section className="vns-facts"><h3>DATOS DEL SUPUESTO</h3>{data.condiciones.map((condition) => <fieldset key={condition.id}><legend>{condition.etiqueta}</legend><div>{condition.opciones.map((option) => <button type="button" key={option.valor} className={answers[condition.id] === option.valor ? "selected" : ""} aria-pressed={answers[condition.id] === option.valor} onClick={() => setAnswers((previous) => ({ ...previous, [condition.id]: option.valor }))}>{option.etiqueta}</button>)}</div></fieldset>)}</section>}
    <section><h3>RESULTADO</h3>{ready ? chosen?.sinInfraccion ? <p>{result}</p> : <><p><strong>{classification}</strong> · {item.norma} · art. {article}</p><p>{result}</p><p>{range(classification)} La sanción concreta corresponde al órgano sancionador.</p></> : <p>Completa los datos del supuesto para mostrar el resultado aplicable.</p>}</section>
    {ready && !chosen?.sinInfraccion && <section><h3>ACTUACIÓN</h3><ul>{action.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>}
    {!!chosen?.medida?.length && <section><h3>MEDIDA</h3><ul>{chosen.medida.map((entry) => <li key={entry}>{entry}</li>)}</ul></section>}
    {ready && !chosen?.sinInfraccion && item.id === "VNS-OP-001" && <section><h3>MEDIDA</h3><p>Cese inmediato de la actividad (art. 40.4).</p></section>}
    {!!item.advertencias.length && <section className="vns-warning"><h3>ADVERTENCIA</h3>{item.advertencias.map((entry) => <p key={entry}>{entry}</p>)}</section>}
    {!!chosen?.advertencia?.length && <section className="vns-warning"><h3>ADVERTENCIA</h3>{chosen.advertencia.map((entry) => <p key={entry}>{entry}</p>)}</section>}
    {!!chosen?.otraVia && <section className="vns-warning"><h3>ADVERTENCIA</h3><p>{chosen.otraVia}</p></section>}
    {ready && !chosen?.sinInfraccion && <section><h3>COMPETENCIA</h3><p>Ayuntamiento de Torrent.</p></section>}
    <SourceLinks sourceIds={item.fuentes} className="vns-sources" />
  </article>;
}
