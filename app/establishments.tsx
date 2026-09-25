"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAnnexDraft,
  controlsForFilter,
  EMPTY_INSPECTION_ITEM,
  establishmentsInspection,
  resolveEstablishmentInspection,
  type InspectionAnswer,
  type InspectionControl,
  type InspectionFilter,
  type InspectionQuestion,
  type InspectionState,
  type InspectionStatus,
} from "@/data/establishments";
import { SourceLinks } from "./source-links";

const FILTERS: InspectionFilter[] = ["TODAS", "AUTONÓMICA", "MUNICIPAL", "MIXTA"];
const STORAGE_KEY = "base-operativa:establecimientos:inspeccion:v1";
const STATUS_OPTIONS: Array<{ value: InspectionStatus; label: string; icon: string }> = [
  { value: "correcto", label: "Correcto", icon: "✅" },
  { value: "irregular", label: "Irregular", icon: "⚠️" },
  { value: "no_comprobado", label: "No comprobado", icon: "➖" },
];

export function EstablishmentsInspectionView() {
  const [filter, setFilter] = useState<InspectionFilter>("TODAS");
  const [state, setState] = useState<InspectionState>({});
  const [showResult, setShowResult] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const storageReady = useRef(false);
  const suppressEmptySave = useRef(false);
  const visibleControls = useMemo(() => controlsForFilter(filter), [filter]);
  const resolution = useMemo(() => resolveEstablishmentInspection(state), [state]);
  const draft = useMemo(() => buildAnnexDraft(resolution), [resolution]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.sessionStorage.getItem(STORAGE_KEY);
        storageReady.current = true;
        if (saved) setState(JSON.parse(saved) as InspectionState);
      } catch { storageReady.current = true; }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!storageReady.current) return;
    if (suppressEmptySave.current && !Object.keys(state).length) { suppressEmptySave.current = false; return; }
    suppressEmptySave.current = false;
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* La inspección sigue disponible sin persistencia. */ }
  }, [state]);

  const updateStatus = (controlId: string, estado: InspectionStatus) => {
    setState((current) => ({
      ...current,
      [controlId]: { estado, respuestas: estado === "irregular" ? current[controlId]?.respuestas ?? {} : {} },
    }));
    setShowResult(false);
    setShowDraft(false);
  };
  const updateAnswer = (controlId: string, field: string, value: InspectionAnswer) => {
    setState((current) => ({
      ...current,
      [controlId]: { estado: "irregular", respuestas: { ...(current[controlId]?.respuestas ?? {}), [field]: value } },
    }));
    setShowResult(false);
    setShowDraft(false);
  };
  const clearInspection = () => {
    suppressEmptySave.current = true;
    setState({});
    setFilter("TODAS");
    setShowResult(false);
    setShowDraft(false);
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch { /* Sin almacenamiento disponible. */ }
  };
  const resolveNow = () => {
    setShowResult(true);
    setShowDraft(false);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.querySelector(".establishment-result")?.scrollIntoView({ behavior: "smooth", block: "start" })));
  };

  return <section className="establishments-view">
    <header className="establishments-heading">
      <span className="kicker">🏛️ POLICÍA ADMINISTRATIVA · 🏬 ESTABLECIMIENTOS PÚBLICOS</span>
      <h2>Inspección del establecimiento</h2>
      <p>{establishmentsInspection.descripcion}</p>
    </header>

    <aside className="establishment-principle">
      <strong>Observa y marca los hechos</strong>
      <p>La aplicación agrupa después las incidencias y orienta sobre documento, destino y contenido del ANEXO. El origen normativo de cada control no decide por sí solo la competencia.</p>
    </aside>

    <nav className="establishment-filters" aria-label="Filtrar controles por origen normativo">
      {FILTERS.map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}
    </nav>
    <p className="establishment-filter-note">Filtro informativo · {visibleControls.length} control{visibleControls.length === 1 ? "" : "es"} visible{visibleControls.length === 1 ? "" : "s"}. Las selecciones ocultas se conservan.</p>

    <div className="establishment-checklist">
      {visibleControls.map((control) => <InspectionControlCard
        key={control.id}
        control={control}
        number={establishmentsInspection.controles.indexOf(control) + 1}
        item={state[control.id] ?? EMPTY_INSPECTION_ITEM}
        onStatus={(status) => updateStatus(control.id, status)}
        onAnswer={(field, value) => updateAnswer(control.id, field, value)}
      />)}
    </div>

    <div className="establishment-resolve-bar">
      <div><strong>{resolution.incidencias.length} incidencia{resolution.incidencias.length === 1 ? "" : "s"} marcada{resolution.incidencias.length === 1 ? "" : "s"}</strong><span>Se resolverán todas, aunque un filtro oculte algún control.</span></div>
      <button type="button" onClick={resolveNow}>🔎 Resolver inspección</button>
    </div>

    {showResult && <InspectionResult resolution={resolution} draft={draft} showDraft={showDraft} onShowDraft={() => setShowDraft(true)} />}

    <details className="establishment-common">
      <summary>Reglas comunes de competencia y ANEXO</summary>
      <p>{establishmentsInspection.reglas_comunes.competencia}</p>
      <p>{establishmentsInspection.reglas_comunes.acumulacion}</p>
      <p>{establishmentsInspection.reglas_comunes.anexo}</p>
    </details>
    <SourceLinks sourceIds={establishmentsInspection.fuentes} className="case-sources establishment-sources" />
    <button type="button" className="establishment-clear" onClick={clearInspection}>Limpiar inspección</button>
  </section>;
}

export function InspectionControlCard({ control, number, item, onStatus, onAnswer }: {
  control: InspectionControl;
  number: number;
  item: { estado: InspectionStatus; respuestas: Record<string, InspectionAnswer> };
  onStatus: (status: InspectionStatus) => void;
  onAnswer: (field: string, value: InspectionAnswer) => void;
}) {
  const content = <>
    <div className="establishment-control-head">
      <span className="establishment-control-number">{number}</span>
      <span className="establishment-control-icon" aria-hidden="true">{control.icono}</span>
      <div><h3>{control.titulo}</h3><p>{control.resumen}</p><small className={`origin-${control.origen.toLowerCase().replaceAll(" ", "-")}`}>{control.origen} · {control.referencia}</small></div>
    </div>
    <div className="establishment-status" role="group" aria-label={`Estado de ${control.titulo}`}>
      {STATUS_OPTIONS.map((status) => <button type="button" key={status.value} className={item.estado === status.value ? `selected ${status.value}` : ""} aria-pressed={item.estado === status.value} onClick={() => onStatus(status.value)}><span aria-hidden="true">{status.icon}</span>{status.label}</button>)}
    </div>
    {item.estado === "irregular" && <div className="establishment-questions">
      <p className="establishment-questions-intro">Concreta únicamente los hechos comprobados.</p>
      {control.preguntas.map((question) => <QuestionControl key={question.id} question={question} value={item.respuestas[question.id]} onChange={(value) => onAnswer(question.id, value)} />)}
    </div>}
  </>;
  if (control.plegado) return <details className={`establishment-control folded status-${item.estado}`}><summary><span>{control.icono}</span><strong>{control.titulo}</strong><small>{item.estado === "no_comprobado" ? "No comprobado" : item.estado === "correcto" ? "Correcto" : "Irregular"}</small></summary><div className="establishment-folded-body">{content}</div></details>;
  return <article className={`establishment-control status-${item.estado}`}>{content}</article>;
}

function QuestionControl({ question, value, onChange }: { question: InspectionQuestion; value?: InspectionAnswer; onChange: (value: InspectionAnswer) => void }) {
  const id = `establishment-${question.id}`;
  if (question.tipo === "opcion") return <fieldset className="establishment-question"><legend>{question.etiqueta}</legend><div className="establishment-options">{question.opciones?.map((option) => <button type="button" key={option.valor} aria-pressed={value === option.valor} className={value === option.valor ? "selected" : ""} onClick={() => onChange(option.valor)}>{option.etiqueta}</button>)}</div></fieldset>;
  if (question.tipo === "multiple") {
    const selected = Array.isArray(value) ? value : [];
    return <fieldset className="establishment-question"><legend>{question.etiqueta}</legend><div className="establishment-multiple">{question.opciones?.map((option) => <label key={option.valor}><input type="checkbox" checked={selected.includes(option.valor)} onChange={() => onChange(selected.includes(option.valor) ? selected.filter((entry) => entry !== option.valor) : [...selected, option.valor])} /><span>{option.etiqueta}</span></label>)}</div></fieldset>;
  }
  const inputType = question.tipo === "numero" ? "number" : question.tipo === "hora" ? "time" : question.tipo === "fecha" ? "date" : "text";
  return <label className="establishment-question establishment-input" htmlFor={id}><span>{question.etiqueta}</span>{question.tipo === "texto_largo" ? <textarea id={id} rows={4} value={typeof value === "string" ? value : ""} placeholder={question.placeholder} onChange={(event) => onChange(event.target.value)} /> : <span className="establishment-input-row"><input id={id} type={inputType} min={inputType === "number" ? "0" : undefined} inputMode={inputType === "number" ? "numeric" : undefined} value={typeof value === "string" ? value : ""} placeholder={question.placeholder} onChange={(event) => onChange(event.target.value)} />{question.unidad && <small>{question.unidad}</small>}</span>}</label>;
}

function InspectionResult({ resolution, draft, showDraft, onShowDraft }: { resolution: ReturnType<typeof resolveEstablishmentInspection>; draft: string; showDraft: boolean; onShowDraft: () => void }) {
  if (!resolution.incidencias.length) return <section className="establishment-result empty-result" aria-live="polite"><span className="kicker">RESULTADO DE LA INSPECCIÓN</span><h3>Sin irregularidades marcadas</h3><p>Los controles correctos o no comprobados no generan propuesta de infracción ni documento.</p></section>;
  return <section className="establishment-result" aria-live="polite">
    <div className="establishment-result-heading"><span className="kicker">RESULTADO DE LA INSPECCIÓN</span><h3>Incidencias por vía documental</h3></div>
    <div className="establishment-result-groups">{resolution.grupos.map((group) => <article key={group.via} className={`establishment-result-group route-${group.via.toLowerCase()}`}>
      <h4>{group.via === "LEY_14_2010" ? "🔵" : group.via === "MUNICIPAL" ? "🟠" : "⚪"} {group.titulo}</h4>
      <div className="establishment-incidents">{group.incidencias.map((incident) => <section key={`${incident.controlId}-${incident.id}`}>
        <strong>{incident.controlIcono} {incident.titulo}</strong>
        <p>{incident.norma} · {incident.articulo === "PENDIENTE DE VALIDACIÓN JURÍDICA" ? incident.articulo : `art. ${incident.articulo}`}</p>
        <span className={incident.clasificacion === "PENDIENTE" ? "pending" : "classification"}>{incident.clasificacion === "PENDIENTE" ? "PENDIENTE DE VALIDACIÓN JURÍDICA" : `Posible infracción ${incident.clasificacion}`}</span>
      </section>)}</div>
      <dl><div><dt>Documento</dt><dd>{group.documento}</dd></div><div><dt>Destino</dt><dd>{group.destino}</dd></div></dl>
    </article>)}</div>
    <section className="establishment-annex">
      <h4>📝 ANEXO — recuerda hacer constar</h4>
      {resolution.incidencias.map((incident) => <div key={`${incident.controlId}-${incident.id}`}><strong>{incident.controlIcono} {incident.controlTitulo}</strong><ul>{incident.recordatorios.map((entry) => <li key={entry}>{entry}</li>)}{incident.datosAnexo.map((datum) => <li key={`${datum.etiqueta}-${datum.valor}`}><b>{datum.etiqueta}:</b> {datum.valor}</li>)}</ul></div>)}
      <button type="button" onClick={onShowDraft}>Preparar borrador del ANEXO</button>
      {showDraft && (draft ? <div className="establishment-draft"><strong>Borrador para revisar</strong><pre>{draft}</pre><p>Revisa el texto antes de transcribirlo. La calificación jurídica se mantiene separada.</p></div> : <div className="establishment-draft empty-draft"><strong>Sin datos para redactar</strong><p>Marca o introduce hechos comprobados. El borrador no completa información ausente.</p></div>)}
    </section>
  </section>;
}
