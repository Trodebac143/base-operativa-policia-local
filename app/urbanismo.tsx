"use client";

import { useState } from "react";
import {
  isUrbanismoQuestionVisible,
  resolveUrbanismoRoute,
  urbanismoData,
  urbanismoRoute,
  type UrbanismoAnswer,
  type UrbanismoAnswers,
  type UrbanismoQuestion,
  type UrbanismoRouteId,
} from "@/data/urbanismo";
import { SourceLinks } from "./source-links";

const EXCLUSIVE_VALUES = new Set(["ninguno", "nadie"]);

export function UrbanismoGuideView({ initialRouteId }: { initialRouteId?: UrbanismoRouteId }) {
  const [routeId, setRouteId] = useState<UrbanismoRouteId | undefined>(initialRouteId);
  const [answersByRoute, setAnswersByRoute] = useState<Partial<Record<UrbanismoRouteId, UrbanismoAnswers>>>({});
  const [showResult, setShowResult] = useState(false);
  const route = routeId ? urbanismoRoute(routeId) : undefined;
  const answers = routeId ? answersByRoute[routeId] ?? {} : {};
  const visibleQuestions = route?.preguntas.filter((question) => isUrbanismoQuestionVisible(question, answers)) ?? [];
  const canResolve = visibleQuestions.length > 0 && visibleQuestions.every((question) => {
    const value = answers[question.id];
    return Array.isArray(value) ? value.length > 0 : typeof value === "string" && value.length > 0;
  });
  const resolution = routeId ? resolveUrbanismoRoute(routeId, answers) : undefined;

  const selectRoute = (nextRoute: UrbanismoRouteId) => {
    setRouteId(nextRoute);
    setShowResult(false);
    window.requestAnimationFrame(() => document.querySelector(".urbanismo-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const updateAnswer = (question: UrbanismoQuestion, value: UrbanismoAnswer) => {
    if (!routeId) return;
    setAnswersByRoute((current) => ({
      ...current,
      [routeId]: { ...(current[routeId] ?? {}), [question.id]: value },
    }));
    setShowResult(false);
  };
  const showResolution = () => {
    if (!canResolve) return;
    setShowResult(true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => document.querySelector(".urbanismo-result")?.scrollIntoView({ behavior: "smooth", block: "start" })));
  };

  return <section className="urbanismo-view">
    <header className="urbanismo-heading">
      <span className="kicker">🏛️ POLICÍA ADMINISTRATIVA · 🏗️ URBANISMO</span>
      <h2>{urbanismoData.titulo}</h2>
      <p>{urbanismoData.descripcion}</p>
    </header>

    <aside className="urbanismo-principle">
      {urbanismoData.principios.map((principle, index) => <p key={principle} className={index === urbanismoData.principios.length - 1 ? "technical-boundary" : ""}>{principle}</p>)}
    </aside>

    {!route && <UrbanismoRouteMenu onSelect={selectRoute} />}

    {route && <>
      <button type="button" className="urbanismo-route-back" onClick={() => { setRouteId(undefined); setShowResult(false); }}>← Volver a las situaciones</button>
      <article className="urbanismo-route">
        <header><span aria-hidden="true">{route.icono}</span><div><small>RECORRIDO GUIADO</small><h3>{route.titulo}</h3><p>{route.objetivo}</p></div></header>
        {route.aviso_inicial && <p className="urbanismo-callout">{route.aviso_inicial}</p>}
        <div className="urbanismo-questions">
          {visibleQuestions.map((question, index) => <UrbanismoQuestionControl
            key={question.id}
            question={question}
            number={index + 1}
            value={answers[question.id]}
            onChange={(value) => updateAnswer(question, value)}
          />)}
        </div>
        <div className="urbanismo-resolve">
          <button type="button" disabled={!canResolve} onClick={showResolution}>Ver actuación policial</button>
          {!canResolve && <span>Responde las preguntas visibles para obtener una salida operativa.</span>}
        </div>
      </article>
      {showResult && resolution && <UrbanismoResult resolution={resolution} onRoute={selectRoute} />}
    </>}

    <details className="urbanismo-checklist">
      <summary>📷 QUÉ CONVIENE DOCUMENTAR</summary>
      <ul>{urbanismoData.checklist.map((item) => <li key={item}>{item}</li>)}</ul>
    </details>
    <SourceLinks sourceIds={urbanismoData.fuentes} className="case-sources urbanismo-sources" />
  </section>;
}

export function UrbanismoRouteMenu({ onSelect }: { onSelect: (routeId: UrbanismoRouteId) => void }) {
  return <section className="urbanismo-menu" aria-labelledby="urbanismo-situation-title">
    <h3 id="urbanismo-situation-title">¿Qué situación tienes?</h3>
    <div>{urbanismoData.rutas.map((route) => <button type="button" key={route.id} onClick={() => onSelect(route.id)}>
      <span aria-hidden="true">{route.icono}</span><strong>{route.titulo}</strong><b aria-hidden="true">›</b>
    </button>)}</div>
  </section>;
}

export function UrbanismoQuestionControl({ question, number, value, onChange }: {
  question: UrbanismoQuestion;
  number: number;
  value?: UrbanismoAnswer;
  onChange: (value: UrbanismoAnswer) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (optionValue: string) => {
    if (selected.includes(optionValue)) return onChange(selected.filter((entry) => entry !== optionValue));
    if (EXCLUSIVE_VALUES.has(optionValue)) return onChange([optionValue]);
    return onChange([...selected.filter((entry) => !EXCLUSIVE_VALUES.has(entry)), optionValue]);
  };
  return <fieldset className="urbanismo-question">
    <legend><span>{number}</span>{question.etiqueta}</legend>
    {question.ayuda && <p>{question.ayuda}</p>}
    <div className={question.tipo === "multiple" ? "urbanismo-options multiple" : "urbanismo-options"}>
      {question.opciones.map((option) => {
        const active = question.tipo === "multiple" ? selected.includes(option.valor) : value === option.valor;
        return <button type="button" key={option.valor} className={active ? "selected" : ""} aria-pressed={active} onClick={() => question.tipo === "multiple" ? toggle(option.valor) : onChange(option.valor)}>{question.tipo === "multiple" && <span aria-hidden="true">{active ? "✓" : ""}</span>}{option.etiqueta}</button>;
      })}
    </div>
  </fieldset>;
}

function UrbanismoResult({ resolution, onRoute }: { resolution: ReturnType<typeof resolveUrbanismoRoute>; onRoute: (routeId: UrbanismoRouteId) => void }) {
  return <section className={`urbanismo-result tone-${resolution.tono}`} aria-live="polite">
    <header><small>SALIDA OPERATIVA</small><h3>{resolution.titulo}</h3></header>
    <div className="urbanismo-result-sections">{resolution.secciones.map((section) => <section key={section.titulo} className={section.emphasis ? `emphasis-${section.emphasis}` : ""}>
      <h4>{section.titulo}</h4><ol>{section.items.map((item) => <li key={item}>{item}</li>)}</ol>
    </section>)}</div>
    {resolution.aviso && <p className="urbanismo-result-warning">{resolution.aviso}</p>}
    {!!resolution.rutasRelacionadas.length && <nav className="urbanismo-related" aria-label="Continuar por otra situación">
      <strong>Continuar directamente</strong>
      <div>{resolution.rutasRelacionadas.map((relatedId) => { const related = urbanismoRoute(relatedId); return <button type="button" key={relatedId} onClick={() => onRoute(relatedId)}>{related.icono} {related.titulo} <span aria-hidden="true">›</span></button>; })}</div>
    </nav>}
  </section>;
}
