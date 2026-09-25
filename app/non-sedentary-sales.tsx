"use client";

import { useState } from "react";
import regimen from "@/contenido/policia_administrativa/venta_no_sedentaria/regimen_sancionador.json";
import { SourceLinks } from "./source-links";
import type { OperationalCase, VentaNoSedentariaData, VentaNoSedentariaOutcome } from "@/data/types";

const groups = ["Autorización y condiciones del puesto", "Documentación y obligaciones", "Inspección e incidencias"];
const range = (classification: string | undefined) => classification ? regimen.rangos[classification as keyof typeof regimen.rangos] : undefined;
const matchOutcome = (outcomes: VentaNoSedentariaOutcome[] | undefined, answers: Record<string, string>) => outcomes?.find((outcome) => Object.entries(outcome.cuando).every(([key, value]) => answers[key] === value));

export function VentaNoSedentariaCategoryView({ cases, onOpenCase }: { cases: OperationalCase[]; onOpenCase: (item: OperationalCase) => void }) {
  const data = (item: OperationalCase) => item.datos_adicionales?.venta_no_sedentaria as VentaNoSedentariaData | undefined;
  return <section className="vns-category"><div className="sectionhead"><span className="kicker">POLICÍA ADMINISTRATIVA</span><h2>🛒 Venta no sedentaria</h2><p>Elige la situación observada.</p></div>{groups.map((group) => {
    const entries = cases.filter((item) => data(item)?.grupo === group).sort((a, b) => (data(a)?.orden ?? 0) - (data(b)?.orden ?? 0));
    return <section className="vns-group" key={group}><h3>{group}</h3><div>{entries.map((item) => <button key={item.id} onClick={() => onOpenCase(item)}><strong>{item.titulo}</strong><b aria-hidden="true">›</b></button>)}</div></section>;
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
