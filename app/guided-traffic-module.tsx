"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { OperationalCase } from "@/data/types";
import {
  classifyVmp,
  resolveNonVmpRoute,
  resolveVmpCirculation,
  resolveVmpDocumentation,
  resolveVmpInsurance,
  resolveVmpMinor,
  resolveVmpPracticalCase,
  resolveVmpTechnical,
  vmpGuide,
  type VmpCategory,
  type VmpClassificationInput,
  type VmpDocumentationResult,
  type VmpInfraction,
  type VmpOperationalOutput,
} from "@/data/vmp";
import { AlcoholemiaView } from "./alcoholemia";

type BooleanValue = boolean | null;
type AreaId = (typeof vmpGuide.areas)[number]["id"];
type ViewId = AreaId | "casos";
type VmpGuideViewProps = { onOpenCase: (item: OperationalCase) => void; cases: OperationalCase[] };

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const initialFacts: VmpClassificationInput = {
  electric: true,
  seats: 1,
  hasSeat: false,
  selfBalancing: true,
  factoryMaxSpeed: null,
  mass: null,
  meetsOtherRequirements: true,
  modified: false,
  observedMaxSpeed: null,
};

export function VmpGuideView({ onOpenCase, cases }: VmpGuideViewProps) {
  const [view, setView] = useState<ViewId | null>(null);
  const [practicalCaseId, setPracticalCaseId] = useState<string | null>(null);
  const [facts, setFacts] = useState<VmpClassificationInput>(initialFacts);

  const openCaseId = (caseId: string | null) => {
    const item = cases.find((candidate) => candidate.id === caseId);
    if (item) onOpenCase(item);
  };

  if (view === "alcohol") return <AlcoholemiaView initialVehicle="vmp" backLabel="← Volver a VMP y VPL" onBack={() => setView(null)} />;

  return (
    <section className="vmp-guide">
      <header className="vmp-hero">
        <div className="vmp-hero-icon" aria-hidden="true">🛴</div>
        <div><span className="kicker">SEGURIDAD VIAL · GUÍA OPERATIVA</span><h2>{vmpGuide.titulo}</h2><p>{vmpGuide.subtitulo}</p></div>
      </header>

      {view == null ? (
        <>
          <div className="vmp-area-grid" aria-label="Siete áreas operativas VMP y VPL">
            {vmpGuide.areas.slice().sort((a, b) => a.orden - b.orden).map((item) => (
              <button key={item.id} onClick={() => setView(item.id)}>
                <span className="vmp-area-icon" aria-hidden="true">{item.icono}</span>
                <span><strong>{item.titulo}</strong><small>{item.descripcion}</small></span>
                <b aria-hidden="true">›</b>
              </button>
            ))}
          </div>
          <section className="vmp-practical-access" aria-label="Consulta y formación">
            <div><span>CONSULTA Y FORMACIÓN</span><h3>🧩 Casos prácticos</h3><p>Ocho situaciones resueltas por el mismo motor de reglas del módulo.</p></div>
            <button onClick={() => { setPracticalCaseId(null); setView("casos"); }}>Abrir casos <b aria-hidden="true">›</b></button>
          </section>
          <p className="vmp-source-note">Fuente de apoyo: manual/protocolo operativo interno. Verificar la normativa aplicable y las circunstancias concretas.</p>
        </>
      ) : view === "casos" ? (
        practicalCaseId
          ? <PracticalCaseDetail caseId={practicalCaseId} cases={cases} onBack={() => setPracticalCaseId(null)} onHome={() => { setPracticalCaseId(null); setView(null); }} />
          : <PracticalCases onOpen={setPracticalCaseId} onHome={() => setView(null)} />
      ) : (
        <div className="vmp-area-view">
          <button className="vmp-area-back" onClick={() => setView(null)}>← Volver a las 7 áreas</button>
          {view === "clasificacion" && <ClassificationPanel facts={facts} setFacts={setFacts} />}
          {view === "documentacion" && <DocumentationPanel facts={facts} setFacts={setFacts} />}
          {view === "seguro" && <InsurancePanel facts={facts} setFacts={setFacts} cases={cases} onOpenCase={openCaseId} />}
          {view === "tecnica" && <TechnicalPanel classification={classifyVmp(facts)} />}
          {view === "circulacion" && <CirculationPanel />}
          {view === "menores" && <MinorsPanel onOpenAlcohol={() => setView("alcohol")} />}
        </div>
      )}
    </section>
  );
}

function PanelHeading({ icon, title, text }: { icon: string; title: string; text: string }) {
  return <div className="vmp-panel-heading"><span aria-hidden="true">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function BoolSelect({ id, label, value, onChange }: { id: string; label: string; value: BooleanValue; onChange: (value: BooleanValue) => void }) {
  return <label htmlFor={id}><span>{label}</span><select id={id} value={value == null ? "" : String(value)} onChange={(event) => onChange(event.target.value === "" ? null : event.target.value === "true")}><option value="">Selecciona…</option><option value="true">Sí</option><option value="false">No</option></select></label>;
}

function ClassificationFields({ facts, setFacts, prefix }: { facts: VmpClassificationInput; setFacts: (value: VmpClassificationInput) => void; prefix: string }) {
  const update = <K extends keyof VmpClassificationInput>(key: K, value: VmpClassificationInput[K]) => setFacts({ ...facts, [key]: value });
  return <div className="vmp-form-grid">
    <BoolSelect id={`${prefix}-electric`} label="¿Propulsión exclusivamente eléctrica?" value={facts.electric} onChange={(value) => update("electric", value)} />
    <label htmlFor={`${prefix}-seats`}><span>Número de plazas</span><input id={`${prefix}-seats`} type="number" min="1" inputMode="numeric" value={facts.seats ?? ""} onChange={(event) => update("seats", event.target.value ? Number(event.target.value) : null)} /></label>
    <BoolSelect id={`${prefix}-seat`} label="¿Dispone de asiento?" value={facts.hasSeat} onChange={(value) => update("hasSeat", value)} />
    {facts.hasSeat && <BoolSelect id={`${prefix}-balance`} label="¿El asiento está vinculado al autoequilibrado?" value={facts.selfBalancing} onChange={(value) => update("selfBalancing", value)} />}
    <label htmlFor={`${prefix}-mass`}><span>Masa en orden de marcha (kg)</span><input id={`${prefix}-mass`} type="number" min="0" step="0.01" inputMode="decimal" value={facts.mass ?? ""} onChange={(event) => update("mass", event.target.value ? Number(event.target.value) : null)} /></label>
    <label htmlFor={`${prefix}-factory-speed`}><span>Velocidad máxima de fabricación (km/h)</span><input id={`${prefix}-factory-speed`} type="number" min="0" step="0.1" inputMode="decimal" value={facts.factoryMaxSpeed ?? ""} onChange={(event) => update("factoryMaxSpeed", event.target.value ? Number(event.target.value) : null)} /></label>
    <BoolSelect id={`${prefix}-other`} label="¿Cumple los demás requisitos definitorios VMP?" value={facts.meetsOtherRequirements} onChange={(value) => update("meetsOtherRequirements", value)} />
    <label className="vmp-checkbox"><input type="checkbox" checked={facts.modified} onChange={(event) => update("modified", event.target.checked)} /><span>Se aprecian indicios de manipulación posterior</span></label>
    {facts.modified && <label htmlFor={`${prefix}-observed-speed`}><span>Velocidad observada tras la modificación (km/h)</span><input id={`${prefix}-observed-speed`} type="number" min="0" step="0.1" inputMode="decimal" value={facts.observedMaxSpeed ?? ""} onChange={(event) => update("observedMaxSpeed", event.target.value ? Number(event.target.value) : null)} /></label>}
  </div>;
}

function classificationInputIsValid(facts: VmpClassificationInput) {
  return facts.electric != null
    && facts.seats != null
    && Number.isFinite(facts.seats)
    && facts.seats >= 1
    && facts.hasSeat != null
    && (!facts.hasSeat || facts.selfBalancing != null)
    && facts.mass != null
    && Number.isFinite(facts.mass)
    && facts.mass >= 0
    && facts.factoryMaxSpeed != null
    && Number.isFinite(facts.factoryMaxSpeed)
    && facts.factoryMaxSpeed >= 0
    && facts.meetsOtherRequirements != null;
}

function useExplicitClassification(facts: VmpClassificationInput, setFacts: (value: VmpClassificationInput) => void) {
  const [finding, setFinding] = useState<ReturnType<typeof classifyVmp> | null>(null);
  const updateFacts = (value: VmpClassificationInput) => {
    setFacts(value);
    setFinding(null);
  };
  const canClassify = classificationInputIsValid(facts);
  const classify = () => {
    if (canClassify) setFinding(classifyVmp(facts));
  };
  return { finding, updateFacts, canClassify, classify };
}

function EmbeddedClassification({ facts, setFacts, prefix, intro, finding, canClassify, onClassify }: {
  facts: VmpClassificationInput;
  setFacts: (value: VmpClassificationInput) => void;
  prefix: string;
  intro: string;
  finding: ReturnType<typeof classifyVmp> | null;
  canClassify: boolean;
  onClassify: () => void;
}) {
  return <>
    <p className="vmp-context"><strong>{intro}</strong></p>
    <ClassificationFields facts={facts} setFacts={setFacts} prefix={prefix} />
    <div className="vmp-classification-action">
      <button type="button" className="vmp-primary-action" disabled={!canClassify} onClick={onClassify}>Clasificar vehículo</button>
      {!canClassify && <p>Completa MOM, velocidad y los demás datos de clasificación para continuar.</p>}
    </div>
    {finding && <p className="vmp-context" aria-live="polite">Clasificación obtenida: <strong>{categoryLabel(finding.category)}</strong></p>}
  </>;
}

function ClassificationPanel({ facts, setFacts }: { facts: VmpClassificationInput; setFacts: (value: VmpClassificationInput) => void }) {
  const finding = useMemo(() => classifyVmp(facts), [facts]);
  return <section className="vmp-panel">
    <PanelHeading icon="◎" title="Identificar / clasificar vehículo" text={vmpGuide.clasificacion.aviso} />
    <ClassificationFields facts={facts} setFacts={setFacts} prefix="vmp-class" />
    {finding.category === "INCOMPLETA"
      ? <Pending text={finding.detail} />
      : <div className={`vmp-finding vmp-finding-${finding.category.toLowerCase()}`} aria-live="polite"><span>Resultado</span><h4>{finding.title}</h4><p>{finding.detail}</p>{finding.forbidsVmpDocumentSanctions && <strong>No aplicar 5A, 5B ni 5C.</strong>}{finding.technicalViolationId && <strong>La modificación conduce a 5D y a sus medidas resultantes; no reclasificar automáticamente como ciclomotor.</strong>}</div>}
    <Checklist title="Datos mínimos para el boletín" items={vmpGuide.clasificacion.datos_minimos} />
  </section>;
}

function DocumentationPanel({ facts, setFacts }: { facts: VmpClassificationInput; setFacts: (value: VmpClassificationInput) => void }) {
  const classification = useExplicitClassification(facts, setFacts);
  const category: VmpCategory = classification.finding?.category ?? "INCOMPLETA";
  const [asOf, setAsOf] = useState(vmpGuide.fecha_referencia);
  const [marketedBefore, setMarketedBefore] = useState<BooleanValue>(null);
  const [certificate, setCertificate] = useState<BooleanValue>(null);
  const [registered, setRegistered] = useState<BooleanValue>(null);
  const [label, setLabel] = useState<BooleanValue>(null);
  const [plate, setPlate] = useState<BooleanValue>(null);
  const ready = category !== "INCOMPLETA" && marketedBefore != null && certificate != null && registered != null && label != null && (!certificate || plate != null);
  const finding = ready ? resolveVmpDocumentation({ category, marketedBeforeCutoff: marketedBefore!, asOf, hasCertificate: certificate!, registered: registered!, hasIdentificationLabel: label!, hasMarkingPlate: plate ?? false }) : null;
  return <section className="vmp-panel">
    <PanelHeading icon="▤" title="Certificado, registro e identificación" text="Cada requisito se comprueba por separado y el motor aplica la absorción 5A → 5B → 5C." />
    <EmbeddedClassification facts={facts} setFacts={classification.updateFacts} prefix="vmp-doc-class" intro="Primero, identifica el vehículo con hechos observables." finding={classification.finding} canClassify={classification.canClassify} onClassify={classification.classify} />
    <div className="vmp-form-grid">
      <label htmlFor="vmp-doc-date"><span>Fecha de la intervención</span><input id="vmp-doc-date" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} /></label>
      <BoolSelect id="vmp-before" label="¿Fue comercializado antes del 22/01/2024?" value={marketedBefore} onChange={setMarketedBefore} />
      <BoolSelect id="vmp-certificate" label="¿Dispone del certificado de circulación exigible?" value={certificate} onChange={setCertificate} />
      <BoolSelect id="vmp-registered" label="¿Está inscrito en el RNV/RVPL?" value={registered} onChange={setRegistered} />
      <BoolSelect id="vmp-label" label="¿Porta la etiqueta identificativa exigible?" value={label} onChange={setLabel} />
      {certificate && <BoolSelect id="vmp-plate" label="¿Dispone de placa de marcaje cuando corresponde?" value={plate} onChange={setPlate} />}
    </div>
    {!ready || !finding ? <Pending text="Completa la clasificación y las comprobaciones documentales aplicables." /> : <DocumentationOutput result={finding} />}
    <p className="vmp-notice">{vmpGuide.documentacion.aviso_transitorio}</p>
  </section>;
}

function InsurancePanel({ facts, setFacts, cases, onOpenCase }: { facts: VmpClassificationInput; setFacts: (value: VmpClassificationInput) => void; cases: OperationalCase[]; onOpenCase: (caseId: string | null) => void }) {
  const classification = useExplicitClassification(facts, setFacts);
  const category: VmpCategory = classification.finding?.category ?? "INCOMPLETA";
  const [asOf, setAsOf] = useState(vmpGuide.fecha_referencia);
  const [marketedBefore, setMarketedBefore] = useState<BooleanValue>(null);
  const [certificate, setCertificate] = useState<BooleanValue>(null);
  const [registered, setRegistered] = useState<BooleanValue>(null);
  const [label, setLabel] = useState<BooleanValue>(null);
  const [plate, setPlate] = useState<BooleanValue>(null);
  const [insured, setInsured] = useState<BooleanValue>(null);
  const [circulating, setCirculating] = useState<BooleanValue>(null);
  const [motorClass, setMotorClass] = useState<"MOTOR" | "OTHER" | null>(null);

  const documentReady = category === "A" && marketedBefore != null && certificate != null && registered != null && label != null && (!certificate || plate != null);
  const documentation = documentReady ? resolveVmpDocumentation({ category, marketedBeforeCutoff: marketedBefore!, asOf, hasCertificate: certificate!, registered: registered!, hasIdentificationLabel: label!, hasMarkingPlate: plate ?? false }) : null;
  const ready = category !== "INCOMPLETA" && insured != null && circulating != null && (category !== "A" || documentReady) && (category !== "NO_VMP" || motorClass != null);
  const finding = ready ? resolveVmpInsurance({ category, insured: insured!, circulating: circulating!, certificateRequired: documentation?.certificateRequired, hasCertificate: certificate, registered, hasIdentificationLabel: label, documentedMotorClass: motorClass }) : null;
  const sharedCase = finding?.caseId ? cases.find((item) => item.id === finding.caseId) ?? null : null;

  return <section className="vmp-panel">
    <PanelHeading icon="◈" title="Seguro obligatorio" text="Clasifica aquí el vehículo y reutiliza los casos comunes SDA/SOA, sin un segundo cálculo jurídico." />
    <EmbeddedClassification facts={facts} setFacts={classification.updateFacts} prefix="vmp-ins-class" intro="Introduce los datos de clasificación sin salir de Seguro." finding={classification.finding} canClassify={classification.canClassify} onClassify={classification.classify} />
    {category === "A" && <div className="vmp-subflow"><h4>Requisitos previos SDA y control documental</h4><div className="vmp-form-grid">
      <label htmlFor="vmp-ins-date"><span>Fecha de la intervención</span><input id="vmp-ins-date" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} /></label>
      <BoolSelect id="vmp-ins-before" label="¿Fue comercializado antes del 22/01/2024?" value={marketedBefore} onChange={setMarketedBefore} />
      <BoolSelect id="vmp-ins-certificate" label="¿Dispone del certificado de circulación exigible?" value={certificate} onChange={setCertificate} />
      <BoolSelect id="vmp-ins-registered" label="¿Está inscrito en el RNV/RVPL?" value={registered} onChange={setRegistered} />
      <BoolSelect id="vmp-ins-label" label="¿Porta la etiqueta identificativa exigible?" value={label} onChange={setLabel} />
      {certificate && <BoolSelect id="vmp-ins-plate" label="¿Dispone de placa de marcaje cuando corresponde?" value={plate} onChange={setPlate} />}
    </div></div>}
    {category === "NO_VMP" && <label className="vmp-wide-control" htmlFor="vmp-ins-real-class"><span>¿Qué clase figura en la ficha técnica o informe?</span><select id="vmp-ins-real-class" value={motorClass ?? ""} onChange={(event) => setMotorClass(event.target.value ? event.target.value as typeof motorClass : null)}><option value="">Selecciona la clase documentada…</option><option value="MOTOR">Vehículo a motor / ciclomotor</option><option value="OTHER">Otra clase acreditada</option></select></label>}
    <div className="vmp-form-grid">
      <BoolSelect id="vmp-insured" label="¿Tiene seguro en vigor?" value={insured} onChange={setInsured} />
      <BoolSelect id="vmp-circulating" label="¿El vehículo circulaba?" value={circulating} onChange={setCirculating} />
    </div>
    {!ready || !finding ? <Pending text="Responde a las preguntas visibles para obtener la actuación." /> : <div className={`vmp-finding ${finding.complaint ? "vmp-finding-no_vmp" : "vmp-finding-a"}`}><span>Resultado de seguro</span><h4>{finding.complaint ? `${finding.regime} · DENUNCIA POR SEGURO: SÍ` : "DENUNCIA POR SEGURO: NO"}</h4><p>{finding.message}</p>{sharedCase && <><SharedCaseOutput item={sharedCase} /><button className="vmp-primary-action" onClick={() => onOpenCase(finding.caseId)}>Abrir ficha común de Seguro →</button></>}</div>}
    {documentation && documentation.complaints.length > 0 && <div className="vmp-linked-result"><h4>Infracción documental resultante</h4><DocumentationOutput result={documentation} /></div>}
  </section>;
}

function TechnicalPanel({ classification }: { classification: ReturnType<typeof classifyVmp> }) {
  const initial = classification.reason === "velocidad_fabrica_superior_25" ? "fabrica_mayor_25" : classification.technicalViolationId ?? "ninguna";
  const [selected, setSelected] = useState<"5D" | "5E" | "5F" | "fabrica_mayor_25" | "ninguna">(initial);
  const [route, setRoute] = useState<"UE_168_2013" | "NO_MATRICULABLE" | null>(null);
  const finding = selected === "fabrica_mayor_25" ? resolveNonVmpRoute(route) : resolveVmpTechnical(selected);
  return <section className="vmp-panel">
    <PanelHeading icon="⚙" title="Requisitos técnicos / modificaciones" text="La inmovilización, el depósito, el informe, las fotografías y las diligencias aparecen como medidas del resultado." />
    <Checklist title="Comprobar" items={vmpGuide.tecnica.comprobaciones} />
    <label className="vmp-wide-control" htmlFor="vmp-technical"><span>Hecho técnico constatado</span><select id="vmp-technical" value={selected} onChange={(event) => { setSelected(event.target.value as typeof selected); setRoute(null); }}><option value="ninguna">Sin incumplimiento constatado</option>{vmpGuide.tecnica.infracciones.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.titulo}</option>)}<option value="fabrica_mayor_25">Velocidad máxima de fabricación superior a 25 km/h</option></select></label>
    {selected === "fabrica_mayor_25" && <div className="vmp-subflow"><p className="vmp-notice">No es VMP y no se aplican 5A, 5B ni 5C. La velocidad de fábrica no se confunde con una modificación posterior.</p><label className="vmp-wide-control" htmlFor="vmp-real-route"><span>¿Qué acredita la ficha o informe técnico sobre su homologación o matriculación?</span><select id="vmp-real-route" value={route ?? ""} onChange={(event) => setRoute(event.target.value ? event.target.value as typeof route : null)}><option value="">Selecciona lo acreditado…</option><option value="UE_168_2013">Encuadre en Reglamento UE 168/2013</option><option value="NO_MATRICULABLE">Otro vehículo no VMP no matriculable</option></select></label>{route === "UE_168_2013" && <div className="vmp-finding vmp-finding-a"><span>Siguiente actuación</span><h4>Determinar la clase real</h4><p>Continuar por autorización, matrícula, permiso y Seguro correspondientes a la clase acreditada. No aplicar automáticamente el codificado reservado al supuesto no matriculable.</p></div>}</div>}
    {finding ? <OperationalOutput item={finding} /> : selected === "ninguna" ? <NoComplaint text="Sin denuncia técnica con el hecho seleccionado." /> : route == null ? <Pending text="Selecciona únicamente lo acreditado por la ficha o el informe técnico." /> : null}
  </section>;
}

function CirculationPanel() {
  const [asOf, setAsOf] = useState(vmpGuide.fecha_referencia);
  const [selected, setSelected] = useState(vmpGuide.circulacion.infracciones[0]?.id ?? "");
  const finding = resolveVmpCirculation(selected, asOf);
  return <section className="vmp-panel">
    <PanelHeading icon="↗" title="Normas de circulación" text="La fecha decide si los preceptos con vigencia futura resultan aplicables." />
    <div className="vmp-form-grid"><label htmlFor="vmp-circulation-date"><span>Fecha de la intervención</span><input id="vmp-circulation-date" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} /></label><label htmlFor="vmp-circulation-rule"><span>Hecho observado</span><select id="vmp-circulation-rule" value={selected} onChange={(event) => setSelected(event.target.value)}>{vmpGuide.circulacion.infracciones.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select></label></div>
    {finding && <div className={`vmp-finding ${finding.active ? "vmp-finding-no_vmp" : "vmp-finding-pendiente"}`}><span>Resultado a fecha {formatDate(asOf)}</span><h4>{finding.active ? "Aplicable" : "Todavía no aplicable"}</h4><p>{finding.message}</p>{finding.active && <InfractionOutput item={finding} />}</div>}
  </section>;
}

function MinorsPanel({ onOpenAlcohol }: { onOpenAlcohol: () => void }) {
  const [asOf, setAsOf] = useState(vmpGuide.fecha_referencia);
  const [age, setAge] = useState(14);
  const finding = resolveVmpMinor(age, asOf);
  return <section className="vmp-panel">
    <PanelHeading icon="◇" title="Menores de edad" text="Distingue la regla de edad por fecha de la tasa 0,0 de alcohol." />
    <div className="vmp-form-grid"><label htmlFor="vmp-minor-date"><span>Fecha de la intervención</span><input id="vmp-minor-date" type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} /></label><label htmlFor="vmp-age"><span>Edad</span><input id="vmp-age" type="number" min="0" value={age} onChange={(event) => setAge(Number(event.target.value))} /></label></div>
    <div className={`vmp-finding ${finding.prohibited ? "vmp-finding-no_vmp" : finding.active ? "vmp-finding-a" : "vmp-finding-pendiente"}`}><span>Resultado por edad</span><h4>{finding.prohibited ? "Circulación prohibida por edad" : finding.active ? "No se activa la prohibición" : "Regla todavía no vigente"}</h4><p>{finding.message}</p><p>{vmpGuide.menores.alcohol}</p><button className="vmp-primary-action" onClick={onOpenAlcohol}>Abrir Alcoholemia con VMP →</button></div>
  </section>;
}

function PracticalCases({ onOpen, onHome }: { onOpen: (id: string) => void; onHome: () => void }) {
  return <div className="vmp-area-view"><button className="vmp-area-back" onClick={onHome}>← Volver a 🛴 VMP y VPL</button><section className="vmp-panel"><PanelHeading icon="🧩" title="Casos prácticos" text="Consulta y formación: cada ejemplo usa las reglas, codificados y medidas centrales." /><div className="vmp-case-grid">{vmpGuide.casos_practicos.map((item, index) => <button key={item.id} onClick={() => onOpen(item.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.titulo}</strong><b aria-hidden="true">›</b></button>)}</div></section></div>;
}

function PracticalCaseDetail({ caseId, cases, onBack, onHome }: { caseId: string; cases: OperationalCase[]; onBack: () => void; onHome: () => void }) {
  const resolved = resolveVmpPracticalCase(caseId);
  if (!resolved) return null;
  const { item, classification, documentation, insurance, technical, variants } = resolved;
  const sharedCase = insurance?.caseId ? cases.find((candidate) => candidate.id === insurance.caseId) ?? null : null;
  return <div className="vmp-area-view"><div className="vmp-case-nav"><button className="vmp-area-back" onClick={onBack}>← Volver a 🧩 Casos prácticos</button><button className="vmp-area-back" onClick={onHome}>🛴 VMP y VPL</button></div><article className="vmp-practical-detail"><header><span>CASO PRÁCTICO</span><h3>{item.titulo}</h3></header><CaseSection title="SITUACIÓN"><p>{item.situacion}</p></CaseSection><CaseSection title="DATOS CLAVE"><List items={item.datos_clave} /></CaseSection><CaseSection title="QUÉ COMPROBAR"><List items={item.que_comprobar} /></CaseSection><CaseSection title="RESULTADO"><div className="vmp-case-results">{classification && <p><strong>Clasificación:</strong> {classification.title}</p>}{variants.map((variant, index) => <p key={`${variant.reason}-${index}`}><strong>Ejemplo {String.fromCharCode(65 + index)}:</strong> {variant.title}. No aplicar documentación VMP; determinar la clase real acreditada.</p>)}{documentation && <DocumentationOutput result={documentation} />}{insurance && <div className={`vmp-inline-result ${insurance.complaint ? "is-alert" : ""}`}><strong>{insurance.complaint ? `${insurance.regime} · DENUNCIA POR SEGURO: SÍ` : "DENUNCIA POR SEGURO: NO"}</strong><p>{insurance.message}</p>{sharedCase && <SharedCaseOutput item={sharedCase} />}</div>}{technical && <OperationalOutput item={technical} />}</div></CaseSection><CaseSection title="ACTUACIÓN">{technical ? <List items={technical.actuacion} /> : sharedCase ? <List items={sharedCase.actuacion.slice(0, 4)} /> : documentation?.complaints.length ? <p>Tramitar únicamente la infracción documental resultante y recoger los datos comprobados.</p> : variants.length ? <p>Obtener ficha o informe técnico; después decidir autorización, matrícula, permiso, seguro y medidas de la clase real.</p> : <p>Sin actuación sancionadora adicional con los hechos indicados.</p>}</CaseSection><CaseSection title="POR QUÉ"><p>{item.por_que}</p></CaseSection></article></div>;
}

function DocumentationOutput({ result }: { result: VmpDocumentationResult }) {
  return <div className={`vmp-finding ${result.complaints.length ? "vmp-finding-no_vmp" : "vmp-finding-a"}`}><span>Salida documental</span><h4>DENUNCIA DOCUMENTAL: {result.complaints.length ? "SÍ" : "NO"}</h4><p>{result.message}</p>{result.complaints.map((item) => <InfractionOutput key={item.id} item={item} />)}</div>;
}

function InfractionOutput({ item }: { item: VmpInfraction }) {
  return <div className="vmp-output vmp-output-compact"><div className="vmp-output-title"><span>Salida operativa</span><strong>DENUNCIA: SÍ</strong></div><dl><div><dt>Código / artículo</dt><dd>{item.codigo}</dd></div><div><dt>Descripción</dt><dd>{item.titulo}</dd></div><div><dt>Importe</dt><dd>{euro.format(item.importe)} · reducido {euro.format(item.reducido)}</dd></div><div><dt>Inmovilización</dt><dd>No por esta infracción documental</dd></div><div><dt>Depósito</dt><dd>No por esta infracción documental</dd></div></dl></div>;
}

function OperationalOutput({ item }: { item: VmpOperationalOutput }) {
  return <div className="vmp-output"><div className="vmp-output-title"><span>Salida operativa</span><strong>DENUNCIA: {item.denuncia ? "SÍ" : "NO"}</strong></div><dl><div><dt>Código</dt><dd>{item.codigo ?? "No aplica"}</dd></div><div><dt>Artículo / referencia</dt><dd>{item.articulo ?? "No aplica"}</dd></div><div><dt>Descripción</dt><dd>{item.descripcion}</dd></div><div><dt>Importe</dt><dd>{item.importe == null ? "No aplica" : `${euro.format(item.importe)} · reducido ${euro.format(item.reducido ?? 0)}`}</dd></div><div><dt>Inmovilización</dt><dd>{yesNo(item.inmovilizacion)}</dd></div><div><dt>Depósito</dt><dd>{yesNo(item.deposito)}</dd></div><div><dt>Informe técnico</dt><dd>{yesNo(item.informe)}</dd></div><div><dt>Fotografías</dt><dd>{yesNo(item.fotografias)}</dd></div><div><dt>Diligencias</dt><dd>{yesNo(item.diligencias)}</dd></div></dl><div className="vmp-act">{item.acta && <><h4>Texto del acta</h4><p>{item.acta}</p></>}<h4>Actuación</h4><List items={item.actuacion} /><h4>Datos que recoger</h4><List items={item.datos} /></div></div>;
}

function SharedCaseOutput({ item }: { item: OperationalCase }) {
  const immobilization = item.medida_operativa?.inmovilizacion.estado ?? item.inmovilizacion ?? "NO";
  const deposit = item.medida_operativa?.traslado_deposito?.estado ?? "NO";
  return <div className="vmp-output vmp-output-compact"><div className="vmp-output-title"><span>Regla común de Seguro</span><strong>DENUNCIA: SÍ</strong></div><dl><div><dt>Código</dt><dd>{item.codificado ?? item.articulo}</dd></div><div><dt>Artículo</dt><dd>{item.articulo}</dd></div><div><dt>Descripción</dt><dd>{item.textoDenuncia ?? item.resultado}</dd></div><div><dt>Importe</dt><dd>{item.importe_fijo == null ? "Ver ficha común" : `${euro.format(item.importe_fijo)} · reducido ${euro.format(item.importe_reducido ?? 0)}`}</dd></div><div><dt>Inmovilización</dt><dd>{immobilization}</dd></div><div><dt>Depósito</dt><dd>{deposit}</dd></div></dl></div>;
}

function NoComplaint({ text }: { text: string }) {
  return <div className="vmp-finding vmp-finding-a"><span>Salida operativa</span><h4>DENUNCIA: NO</h4><p>{text}</p><p><strong>INMOVILIZACIÓN:</strong> NO · <strong>DEPÓSITO:</strong> NO</p></div>;
}

function CaseSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h4>{title}</h4>{children}</section>;
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return <div className="vmp-checklist"><h4>{title}</h4><List items={items} /></div>;
}

function List({ items }: { items: string[] }) {
  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}

function Pending({ text }: { text: string }) {
  return <div className="vmp-pending"><strong>Faltan datos</strong><p>{text}</p></div>;
}

function categoryLabel(category: VmpCategory) {
  if (category === "A") return "VPL";
  if (category === "B") return "VMP · vehículo a motor a efectos del seguro";
  return category === "NO_VMP" ? "No VMP · determinar clase real" : "Sin resultado";
}

function yesNo(value: boolean) {
  return value ? "Sí" : "No";
}

function formatDate(value: string) {
  return value.split("-").reverse().join("/");
}
