"use client";

import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible";
import { resolveAuthorityOutcome, resolveDrugOutcome, resolvePublicSafetyOutcome, resolveWeaponOutcome, seguridadPublica, seguridadPublicaBlockDescription, seguridadPublicaBlockLabel, seguridadPublicaConceptos, type AuthorityOutcome, type DrugOutcome, type ProcessualInput, type PublicConcept, type PublicSafetyFacts, type PublicSafetyOutcome, type PublicSecurityBlock, type WeaponConduct, type WeaponContextInput, type WeaponObjectInput, type WeaponOutcome } from "@/data/seguridad-publica";

type Props = { block: PublicSecurityBlock; initialConceptId?: string; onBack: () => void };

export function SeguridadPublicaView({ block, initialConceptId, onBack }: Props) {
  const [activeBlock, setActiveBlock] = useState<PublicSecurityBlock>(block);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialConceptId);
  const [query, setQuery] = useState("");
  const [facts, setFacts] = useState<PublicSafetyFacts>({});
  const blockConcepts = useMemo(() => seguridadPublicaConceptos.filter((concept) => concept.bloque === activeBlock), [activeBlock]);
  const selected = blockConcepts.find((concept) => concept.id === selectedId);
  const matches = useMemo(() => {
    const q = normalise(query);
    return q ? blockConcepts.filter((concept) => normalise([concept.titulo, ...concept.sinonimos].join(" ")).includes(q)) : [];
  }, [blockConcepts, query]);
  const choose = (id: string) => { const target = seguridadPublicaConceptos.find((concept) => concept.id === id); if (target) { setActiveBlock(target.bloque); setSelectedId(id); } setQuery(""); window.scrollTo({ top: 0, behavior: "smooth" }); };
  if (selected) return <ConceptSheet concept={selected} facts={facts} setFacts={setFacts} onNavigate={choose} onBack={() => setSelectedId(undefined)} />;
  return <section className="sp-view">
    <div className="sp-heading"><div><span className="kicker">{seguridadPublica.titulo.toUpperCase()}</span><h2>{seguridadPublicaBlockLabel(activeBlock)}</h2><p>{seguridadPublicaBlockDescription[activeBlock]}</p></div><button className="alcohol-back" onClick={onBack}>← Volver a Seguridad Pública</button></div>
    <section className="sp-search"><label htmlFor="public-security-search">Buscar situación</label><input id="public-security-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: porro, no se identifica, navaja…" autoComplete="off" />{query && <div className="sp-search-results">{matches.length ? matches.map((concept) => <button key={concept.id} onClick={() => choose(concept.id)}><strong>{concept.titulo}</strong><small>{seguridadPublicaBlockLabel(concept.bloque)}</small></button>) : <p>Sin concepto operativo coincidente.</p>}</div>}</section>
    <section className="sp-block"><div className="sp-block-heading"><span>{activeBlock === "Drogas" ? "◉" : activeBlock === "Armas y objetos peligrosos" ? "△" : activeBlock === "Agresiones sexuales" ? "●" : "◈"}</span><h3>{seguridadPublicaBlockLabel(activeBlock)}</h3></div><div className="sp-concept-grid">{blockConcepts.map((concept) => <button key={concept.id} onClick={() => choose(concept.id)}><strong>{concept.titulo}</strong><small>{concept.resultado}</small><b>›</b></button>)}</div></section>
  </section>;
}

function ConceptSheet({ concept, facts, setFacts, onNavigate, onBack }: { concept: PublicConcept; facts: PublicSafetyFacts; setFacts: Dispatch<SetStateAction<PublicSafetyFacts>>; onNavigate: (id: string) => void; onBack: () => void }) {
  const sheetRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const copySummary = async () => {
    const text = sheetRef.current?.innerText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <section className="sp-view sp-view-with-actions"><button className="back sp-desktop-back" onClick={onBack}>← Volver a {seguridadPublicaBlockLabel(concept.bloque)}</button><article className="sp-sheet" ref={sheetRef}><header><span className="kicker">{seguridadPublicaBlockLabel(concept.bloque).toUpperCase()}</span><h2>{concept.titulo}</h2><p>{concept.resultado}</p></header>{concept.id === "drogas_trafico" ? <DrugDecision /> : ["armas_blancas", "objetos_peligrosos"].includes(concept.id) ? <WeaponDecision key={concept.id} concept={concept} facts={facts} /> : ["desobediencia", "resistencia", "amenazas"].includes(concept.id) ? <AuthorityDecision concept={concept} /> : concept.id === "atentado" ? <AtentadoConcept concept={concept} /> : isIncidentConcept(concept.id) ? <IncidentDecision concept={concept} facts={facts} setFacts={setFacts} onNavigate={onNavigate} /> : <StaticConcept concept={concept} />}</article><nav className="sp-mobile-actions" aria-label="Acciones principales"><button onClick={onBack}>← Volver</button><button className="primary" onClick={copySummary}>{copied ? "✓ Copiado" : "Copiar resumen"}</button></nav></section>;
}

function StaticConcept({ concept }: { concept: PublicConcept }) {
  return <><OperationalSection title="Qué comprobar" items={concept.comprobar} /><ResultCard title={concept.calificacion?.startsWith("DELITO") ? "POSIBLE DELITO" : "INFRACCIÓN"} norma={concept.norma} clasificacion={concept.calificacion} range={concept.rango} text={concept.resultado} /><OperationalSection title="Actuación policial" items={concept.actuacion ?? []} />{concept.id === "identificacion" && <div className="sp-highlight neutral"><strong>TRASLADO IDENTIFICATIVO</strong><p>El traslado a dependencias a efectos exclusivos de identificación conforme al art. 16 LO 4/2015 no constituye una detención penal.</p></div>}{concept.competencia && <OperationalSection title="Competencia" items={[concept.competencia]} />}{concept.bloque === "Drogas" && <CommonProcessual showSubstance />}<LegalFoundation normas={[concept.norma, ...(concept.fuentes ?? [])]} detalle={concept.frontera} /></>;
}

function AtentadoConcept({ concept }: { concept: PublicConcept }) {
  const result = resolveAuthorityOutcome("resistencia", "atentado")!;
  return <><OperationalSection title="Qué comprobar" items={concept.comprobar} /><ResolvedOutcome result={result} /></>;
}

function DrugDecision() {
  const [status, setStatus] = useState<"sin" | "duda" | "venta">("sin"); const [substance, setSubstance] = useState<"grave_dano" | "resto">("grave_dano"); const [indicators, setIndicators] = useState<string[]>([]); const [flagrante, setFlagrante] = useState(true); const [profile, setProfile] = useState<"favorable" | "riesgo">("favorable");
  const processual: ProcessualInput = flagrante ? { flagrante: true } : { flagrante: false, plenamenteIdentificado: profile === "favorable", localizable: profile === "favorable", riesgoIncomparecencia: profile === "riesgo" };
  const result: DrugOutcome | null = status === "sin" ? null : status === "duda" ? resolveDrugOutcome({ ventaObservada: false, indiciosSuficientes: false, sustancia: substance, ...processual }) : resolveDrugOutcome({ ventaObservada: true, indiciosSuficientes: true, sustancia: substance, ...processual });
  return <><OperationalSection title="Qué comprobar" items={seguridadPublicaConceptos.find((item) => item.id === "drogas_trafico")?.comprobar ?? []} /><fieldset className="sp-choice"><legend>¿Se observa venta, entrega o suministro a tercero?</legend><label><input type="radio" checked={status === "sin"} onChange={() => setStatus("sin")} /> No; sin indicios suficientes de tráfico</label><label><input type="radio" checked={status === "duda"} onChange={() => setStatus("duda")} /> Hay indicios de posible tráfico, no concluyentes</label><label><input type="radio" checked={status === "venta"} onChange={() => setStatus("venta")} /> Sí, o hay indicios objetivos suficientes</label>{status === "venta" && <label className="sp-subchoice">Tipo de sustancia <select value={substance} onChange={(event) => setSubstance(event.target.value as "grave_dano" | "resto")}><option value="grave_dano">Causa grave daño a la salud</option><option value="resto">Resto de sustancias</option></select></label>}</fieldset>{status === "venta" && <ProcessualControls flagrante={flagrante} setFlagrante={setFlagrante} profile={profile} setProfile={setProfile} />}{status === "duda" && <fieldset className="sp-choice"><legend>Indicios concretos a documentar</legend>{trafficIndicators.map((indicator) => <label key={indicator}><input type="checkbox" checked={indicators.includes(indicator)} onChange={() => setIndicators((current) => current.includes(indicator) ? current.filter((item) => item !== indicator) : [...current, indicator])} /> {indicator}</label>)}</fieldset>}{status === "sin" ? <StaticConcept concept={seguridadPublicaConceptos.find((item) => item.id === "drogas_consumo")!} /> : result && <><ResolvedOutcome result={result} drug />{status === "duda" && <OperationalSection title="Indicios concretos presentes" items={indicators.length ? indicators : ["Marca los indicios observados antes de documentar y coordinar la continuación con CNP."]} />}</>}</>;
}

const incidentConceptIds = ["violencia_relacional", "agresiones_lesiones", "agresiones_sexuales", "peleas_rinas", "amenazas_coacciones"];
const isIncidentConcept = (id: string) => incidentConceptIds.includes(id);

function IncidentDecision({ concept, facts, setFacts, onNavigate }: { concept: PublicConcept; facts: PublicSafetyFacts; setFacts: Dispatch<SetStateAction<PublicSafetyFacts>>; onNavigate: (id: string) => void }) {
  const [flagrante, setFlagrante] = useState(true);
  const [profile, setProfile] = useState<"favorable" | "riesgo">("favorable");
  const processual: ProcessualInput = flagrante ? { flagrante: true } : { flagrante: false, plenamenteIdentificado: profile === "favorable", localizable: profile === "favorable", riesgoIncomparecencia: profile === "riesgo" };
  const set = <K extends keyof PublicSafetyFacts>(key: K, value: PublicSafetyFacts[K]) => setFacts((current) => ({ ...current, [key]: value }));
  const toggleRelationEvent = (value: NonNullable<PublicSafetyFacts["hechosRelacion"]>[number]) => setFacts((current) => ({ ...current, hechosRelacion: current.hechosRelacion?.includes(value) ? current.hechosRelacion.filter((item) => item !== value) : [...(current.hechosRelacion ?? []), value] }));
  const result = resolvePublicSafetyOutcome(concept.id, facts, processual);
  const showProcessual = Boolean(result.procesal);
  const showComplaintQuestion = facts.relacion === "vg" && showProcessual;
  const sexualContext = concept.id === "agresiones_sexuales" || facts.hechosRelacion?.includes("sexual");
  return <>
    <OperationalSection title="Qué comprobar" items={concept.comprobar} />
    <RelationshipQuestion facts={facts} set={set} />
    {facts.relacion && concept.id !== "violencia_relacional" && <div className="sp-highlight neutral"><strong>RELACIÓN YA REGISTRADA</strong><p>{facts.relacion === "vg" ? "Ámbito de violencia de género." : facts.relacion === "domestica" ? "Ámbito familiar o convivencial protegido." : "No consta relación protegida."} No se volverá a pedir en las conexiones.</p></div>}
    {concept.id === "violencia_relacional" && <>
      <fieldset className="sp-choice"><legend>¿Qué hechos pueden coexistir?</legend>{relationEvents.map(([value, label]) => <label key={value}><input type="checkbox" checked={facts.hechosRelacion?.includes(value as NonNullable<PublicSafetyFacts["hechosRelacion"]>[number]) ?? false} onChange={() => toggleRelationEvent(value as NonNullable<PublicSafetyFacts["hechosRelacion"]>[number])} /> {label}</label>)}</fieldset>
      <ToggleQuestion legend="¿Se refieren episodios anteriores de violencia física o psíquica?" value={facts.episodiosPrevios} onChange={(value) => set("episodiosPrevios", value)} />
    </>}
    {concept.id === "agresiones_lesiones" && <>
      <ToggleQuestion legend="¿Ha existido golpe o agresión física?" value={facts.agresionFisica} onChange={(value) => set("agresionFisica", value)} />
      {facts.agresionFisica && <><ToggleQuestion legend="¿Existe o se refiere alguna lesión?" value={facts.lesion} onChange={(value) => set("lesion", value)} />
        {facts.lesion && <ChoiceQuestion legend="¿Se conoce el resultado asistencial?" value={facts.resultadoAsistencial} options={medicalResultOptions} onChange={(value) => set("resultadoAsistencial", value as PublicSafetyFacts["resultadoAsistencial"])} />}
        <ToggleQuestion legend="¿Se utilizó arma, botella, objeto o medio especialmente peligroso?" value={facts.medioPeligroso} onChange={(value) => set("medioPeligroso", value)} />
        <ToggleQuestion legend="¿Existe un resultado aparentemente de especial gravedad?" value={facts.resultadoEspecialGravedad} onChange={(value) => set("resultadoEspecialGravedad", value)} />
        <ToggleQuestion legend="¿Hay indicios de que la conducta pudiera estar dirigida a matar?" value={facts.indiciosFinalidadMatar} onChange={(value) => set("indiciosFinalidadMatar", value)} />
        {facts.indiciosFinalidadMatar && <div className="sp-question-help">Recoge zona corporal atacada, medio, número e intensidad de acciones, estrangulamiento o disparos, expresiones, conducta y motivo por el que cesó.</div>}
        <ToggleQuestion legend="¿La agresión se produjo en un contexto sexual?" value={facts.contextoSexual} onChange={(value) => set("contextoSexual", value)} />
      </>}
    </>}
    {concept.id === "agresiones_sexuales" && <>
      <ToggleQuestion legend="¿Se refiere un acto de contenido sexual no consentido?" value={facts.actoSexualNoConsentido} onChange={(value) => set("actoSexualNoConsentido", value)} />
      {facts.actoSexualNoConsentido && <><ToggleQuestion legend="¿La víctima es menor de 16 años?" value={facts.menorDieciseis} onChange={(value) => set("menorDieciseis", value)} />
        {!facts.menorDieciseis && <><ToggleQuestion legend="¿Hubo penetración?" value={facts.penetracion} onChange={(value) => set("penetracion", value)} />
          <ToggleQuestion legend="¿Existió violencia o intimidación?" value={facts.violenciaIntimidacion} onChange={(value) => set("violenciaIntimidacion", value)} />
          <ToggleQuestion legend="¿Existía imposibilidad o grave dificultad para decidir libremente?" value={facts.dificultadDecidir} onChange={(value) => set("dificultadDecidir", value)} />
          <ToggleQuestion legend="¿Intervinieron varias personas?" value={facts.variasPersonas} onChange={(value) => set("variasPersonas", value)} />
        </>}
        <ToggleQuestion legend="¿Existe posible sumisión o vulnerabilidad química?" value={facts.posibleSumisionQuimica} onChange={(value) => set("posibleSumisionQuimica", value)} />
        {facts.posibleSumisionQuimica && <div className="sp-question-help">Pérdida de memoria, somnolencia intensa, desorientación, pérdida de conciencia no explicada, sospecha de sustancias o aprovechamiento de intoxicación.</div>}
        <ToggleQuestion legend="¿Existen lesiones?" value={facts.lesion} onChange={(value) => set("lesion", value)} />
        <ToggleQuestion legend="¿Hay arma u objeto peligroso?" value={facts.medioPeligroso} onChange={(value) => set("medioPeligroso", value)} />
      </>}
    </>}
    {concept.id === "peleas_rinas" && <>
      <ChoiceQuestion legend="¿Cómo se desarrolla el enfrentamiento?" value={facts.tipoRina} options={fightTypeOptions} onChange={(value) => set("tipoRina", value as PublicSafetyFacts["tipoRina"])} />
      {facts.tipoRina && <><ToggleQuestion legend="¿Se utilizan botellas, cuchillos, palos u otros instrumentos peligrosos?" value={facts.medioPeligroso} onChange={(value) => set("medioPeligroso", value)} />
        <ToggleQuestion legend="¿Hay personas lesionadas?" value={facts.lesion} onChange={(value) => set("lesion", value)} />
        {facts.lesion && <ToggleQuestion legend="¿Puede identificarse quién causó una lesión concreta?" value={facts.lesionIndividualizable} onChange={(value) => set("lesionIndividualizable", value)} />}
        <ToggleQuestion legend="¿La víctima es agente?" value={facts.victimaAgente} onChange={(value) => set("victimaAgente", value)} />
      </>}
    </>}
    {concept.id === "amenazas_coacciones" && <>
      <ChoiceQuestion legend="¿Qué está haciendo la persona?" value={facts.conductaLibertad} options={freedomConductOptions} onChange={(value) => set("conductaLibertad", value as PublicSafetyFacts["conductaLibertad"])} />
      {facts.conductaLibertad === "amenaza" && <><ChoiceQuestion legend="¿Qué mal anuncia?" value={facts.malAnunciado} options={threatHarmOptions} onChange={(value) => set("malAnunciado", value as PublicSafetyFacts["malAnunciado"])} />
        <ToggleQuestion legend="¿Exige algo o impone alguna condición?" value={facts.condicionImpuesta} onChange={(value) => set("condicionImpuesta", value)} />
      </>}
      {facts.conductaLibertad === "coaccion" && <ChoiceQuestion legend="¿Cómo impone o impide la conducta?" value={facts.coaccionEntidad} options={coactionOptions} onChange={(value) => set("coaccionEntidad", value as PublicSafetyFacts["coaccionEntidad"])} />}
      {facts.conductaLibertad && facts.conductaLibertad !== "acoso" && <><ToggleQuestion legend="¿Utiliza o exhibe arma u objeto peligroso?" value={facts.medioPeligroso} onChange={(value) => set("medioPeligroso", value)} />
        <ToggleQuestion legend="¿Hay mensajes, audios, llamadas u otros soportes?" value={facts.soportes} onChange={(value) => set("soportes", value)} />
      </>}
    </>}
    {showComplaintQuestion && <><ToggleQuestion legend="¿La víctima manifiesta que no desea denunciar?" value={facts.noDeseaDenunciar} onChange={(value) => set("noDeseaDenunciar", value)} />
      <div className="sp-question-help">{sexualContext ? "No paraliza la protección ni las primeras diligencias. Para proceder: denuncia de la víctima o querella del Ministerio Fiscal." : "No es necesaria para continuar. Informa a la víctima y sigue la actuación de oficio."}</div>
    </>}
    {showProcessual && <ProcessualControls flagrante={flagrante} setFlagrante={setFlagrante} profile={profile} setProfile={setProfile} />}
    <IncidentResolvedOutcome result={result} onNavigate={onNavigate} />
  </>;
}

function RelationshipQuestion({ facts, set }: { facts: PublicSafetyFacts; set: <K extends keyof PublicSafetyFacts>(key: K, value: PublicSafetyFacts[K]) => void }) {
  if (facts.relacion) return null;
  return <ChoiceQuestion legend="¿Qué relación existe entre autor y víctima?" value={facts.relacion} options={relationshipOptions} onChange={(value) => set("relacion", value as PublicSafetyFacts["relacion"])} />;
}

function ChoiceQuestion({ legend, value, options, onChange }: { legend: string; value: string | undefined; options: Array<[string, string]>; onChange: (value: string) => void }) { return <fieldset className="sp-choice"><legend>{legend}</legend>{options.map(([id, label]) => <label key={id}><input type="radio" checked={value === id} onChange={() => onChange(id)} /> {label}</label>)}</fieldset>; }
function ToggleQuestion({ legend, value, onChange }: { legend: string; value: boolean | undefined; onChange: (value: boolean) => void }) { return <fieldset className="sp-choice"><legend>{legend}</legend><label><input type="radio" checked={value === true} onChange={() => onChange(true)} /> Sí</label><label><input type="radio" checked={value === false} onChange={() => onChange(false)} /> No</label></fieldset>; }

function IncidentResolvedOutcome({ result, onNavigate }: { result: PublicSafetyOutcome; onNavigate: (id: string) => void }) {
  const attentions = result.resultados.filter(isIncidentAttention);
  const outcomes = result.resultados.filter((item) => !isIncidentAttention(item));
  const actions = uniqueItems(outcomes.flatMap((item) => item.actuacion).filter((item) => !isContinuationAction(item) && !isAttentionAction(item)));
  const attentionItems = uniqueItems([...attentions.map((item) => `${item.titulo}: ${item.texto}`), ...outcomes.flatMap((item) => item.actuacion).filter(isAttentionAction)]);
  return <>{outcomes.map((item, index) => <div key={`${item.titulo}-${index}`} className={item.destacado ? `sp-incident-${item.destacado}` : undefined}><ResultCard title={item.titulo} norma={item.norma} clasificacion={item.clasificacion} text={item.texto} showText={needsOutcomeDetail(item.titulo)} /></div>)}
    <OperationalSection title="Actuación policial" items={actions} />
    {result.procesal && <><AuthorSituation decision={result.procesal} /><Continuation decision={result.procesal} /></>}
    <OperationalSection title="Atención" items={attentionItems} />
    {result.conexiones.length > 0 && <section className="sp-section"><h3>Conexiones activas</h3><div className="sp-connections">{result.conexiones.map((item) => item.conceptId ? <button key={`${item.conceptId}-${item.etiqueta}`} onClick={() => onNavigate(item.conceptId)}><strong>{item.etiqueta}</strong><small>{item.motivo}</small><b>›</b></button> : <div key={item.etiqueta}><strong>{item.etiqueta}</strong><small>{item.motivo}</small></div>)}</div></section>}
    <LegalFoundation normas={uniqueItems(result.resultados.map((item) => item.norma))} />
  </>;
}

function WeaponDecision({ concept, facts }: { concept: PublicConcept; facts: PublicSafetyFacts }) {
  const ordinaryObject = concept.id === "objetos_peligrosos";
  const [tipo, setTipo] = useState<WeaponObjectInput["tipo"]>("navaja");
  const [mecanismo, setMecanismo] = useState<"automatico" | "no_automatico" | "dudoso">("dudoso");
  const [longitudNavaja, setLongitudNavaja] = useState<"supera_11" | "no_supera_11" | "dudosa">("dudosa");
  const [menorOnce, setMenorOnce] = useState(false); const [dosFilos, setDosFilos] = useState(false); const [puntiaguda, setPuntiaguda] = useState(false);
  const [armamento, setArmamento] = useState<"aprobado" | "imitacion" | "no" | "dudoso">("dudoso");
  const [circunstanciaTenencia, setCircunstanciaTenencia] = useState<"ninguna" | "contemplacion" | "reparacion" | "transmision">("ninguna");
  const [disponibilidad, setDisponibilidad] = useState<"encima" | "efectos" | "accesible" | "vehiculo" | "sin_disponente">("efectos"); const [comportamiento, setComportamiento] = useState<WeaponConduct>(facts.medioPeligroso ? "usa" : "porte"); const [contexto, setContexto] = useState<"sin_incidente" | "altercado" | "violento" | "amenazas" | "otro_delito" | "otras">("sin_incidente"); const [flagrante, setFlagrante] = useState(true); const [profile, setProfile] = useState<"favorable" | "riesgo">("favorable");
  const [motivo, setMotivo] = useState<WeaponContextInput["motivo"]>();
  const [transporte, setTransporte] = useState<WeaponContextInput["transporte"]>();
  const [lugar, setLugar] = useState<WeaponContextInput["lugar"]>();
  const [momento, setMomento] = useState<WeaponContextInput["momento"]>();
  const [consumo, setConsumo] = useState<WeaponContextInput["consumo"]>();
  const [accesoRestringido, setAccesoRestringido] = useState<WeaponContextInput["accesoRestringido"]>();
  const [motivoSeguridadFinalizado, setMotivoSeguridadFinalizado] = useState<WeaponContextInput["motivoSeguridadFinalizado"]>();
  const processual: ProcessualInput = flagrante ? { flagrante: true } : { flagrante: false, plenamenteIdentificado: profile === "favorable", localizable: profile === "favorable", riesgoIncomparecencia: profile === "riesgo" };
  const clearCarry = () => { setCircunstanciaTenencia("ninguna"); setMotivo(undefined); setTransporte(undefined); setLugar(undefined); setMomento(undefined); setConsumo(undefined); setAccesoRestringido(undefined); setMotivoSeguridadFinalizado(undefined); };
  const chooseBehaviour = (value: WeaponConduct) => { setComportamiento(value); if (value !== "porte") clearCarry(); if (value === "exhibe" && contexto === "sin_incidente") setContexto("altercado"); };
  const chooseTipo = (value: WeaponObjectInput["tipo"]) => { setTipo(value); setMecanismo("dudoso"); setLongitudNavaja("dudosa"); setMenorOnce(false); setDosFilos(false); setPuntiaguda(false); setArmamento("dudoso"); clearCarry(); };
  const chooseMechanism = (value: typeof mecanismo) => { setMecanismo(value); setLongitudNavaja("dudosa"); if (value === "automatico") clearCarry(); };
  const choosePlace = (value: NonNullable<WeaponContextInput["lugar"]>) => { setLugar(value); if (!["establecimiento", "ocio", "reunion"].includes(value)) { setMomento(undefined); setConsumo(undefined); } setAccesoRestringido(undefined); setMotivoSeguridadFinalizado(undefined); };
  const showAvailability = ordinaryObject && comportamiento === "porte";
  const showContext = comportamiento === "manipula" || comportamiento === "exhibe";
  const showTenenciaExcepcional = !ordinaryObject && comportamiento === "porte";
  const prohibitedTechnical = mecanismo === "automatico" && tipo === "navaja" || tipo === "hoja" && menorOnce && dosFilos && puntiaguda;
  const showCarry = !ordinaryObject && comportamiento === "porte" && !prohibitedTechnical;
  const sensitivePlace = lugar === "establecimiento" || lugar === "ocio" || lugar === "reunion";
  const legitimatePurpose = motivo === "trabajo" || motivo === "actividad" || motivo === "trayecto";
  const protectedTransport = transporte === "funda" || transporte === "equipamiento";
  const coherentPlace = lugar === "trayecto" || motivo === "trabajo" && lugar === "trabajo" || motivo === "actividad" && lugar === "actividad";
  const showSafetyAccess = showCarry && legitimatePurpose && protectedTransport && coherentPlace && consumo !== "si";
  const contextOptions = comportamiento === "exhibe" ? weaponRelatedContext : weaponContext;
  const inferredAvailability = ordinaryObject ? disponibilidad : transporte === "bolsillo" || transporte === "accesible" ? "accesible" : "efectos";
  const result = resolveWeaponOutcome({ tipo: ordinaryObject ? "objeto" : tipo, mecanismo, longitudNavaja, hojaMenorOnce: menorOnce, dosFilos, puntiaguda, armamento, supuestoEspecifico: circunstanciaTenencia !== "ninguna", circunstanciaTenencia: circunstanciaTenencia === "ninguna" ? undefined : circunstanciaTenencia }, { disponibilidad: inferredAvailability, comportamiento, contexto: showContext ? contexto : undefined, motivo, transporte, lugar, momento, consumo, accesoRestringido: showSafetyAccess ? accesoRestringido : undefined, motivoSeguridadFinalizado: showSafetyAccess && accesoRestringido === "si" ? motivoSeguridadFinalizado : undefined, ...processual });
  return <>{facts.medioPeligroso && <div className="sp-highlight neutral"><strong>MEDIO PELIGROSO YA REGISTRADO</strong><p>Se conserva como hecho de la intervención. Completa solo las características del objeto necesarias para su descripción.</p></div>}<OperationalSection title="Qué comprobar" items={concept.comprobar} />{facts.medioPeligroso ? <div className="sp-question-help">La conducta contra una persona ya consta en la intervención; completa únicamente la identificación del objeto.</div> : <fieldset className="sp-choice"><legend>¿Qué ocurre con el objeto?</legend>{weaponBehaviour.map(([id, label]) => <label key={id}><input type="radio" checked={comportamiento === id} onChange={() => chooseBehaviour(id as WeaponConduct)} /> {label}</label>)}</fieldset>}{showAvailability && <fieldset className="sp-choice"><legend>¿Dónde se encuentra?</legend>{weaponAvailability.map(([id, label]) => <label key={id}><input type="radio" checked={disponibilidad === id} onChange={() => setDisponibilidad(id as typeof disponibilidad)} /> {label}</label>)}</fieldset>}{showContext && <fieldset className="sp-choice"><legend>¿Qué situación se observa?</legend>{contextOptions.map(([id, label]) => <label key={id}><input type="radio" checked={contexto === id} onChange={() => setContexto(id as typeof contexto)} /> {label}</label>)}</fieldset>}{ordinaryObject ? <div className="sp-highlight neutral"><strong>OBJETO ORDINARIO</strong><ul><li>Solo porte: no implica infracción automática.</li><li>Intimidación o agresión: analizar primero vía penal.</li><li>El uso puede ser relevante aunque el objeto no sea arma.</li></ul></div> : <><fieldset className="sp-choice"><legend>¿Qué tipo de arma blanca se observa?</legend>{bladeTypes.map(([id, label]) => <label key={id}><input type="radio" checked={tipo === id} onChange={() => chooseTipo(id as WeaponObjectInput["tipo"])} /> {label}</label>)}</fieldset>{tipo === "navaja" && <fieldset className="sp-choice"><legend>¿Cómo es el mecanismo de apertura?</legend><p className="sp-question-help">Indica si el mecanismo es automático.</p>{mechanismOptions.map(([id, label]) => <label key={id}><input type="radio" checked={mecanismo === id} onChange={() => chooseMechanism(id as typeof mecanismo)} /> {label}</label>)}{mecanismo === "no_automatico" && <div className="sp-nested-question"><strong>Longitud desde el reborde o tope del mango hasta el extremo</strong>{manualLengthOptions.map(([id, label]) => <label key={id}><input type="radio" checked={longitudNavaja === id} onChange={() => setLongitudNavaja(id as typeof longitudNavaja)} /> {label}</label>)}</div>}</fieldset>}{tipo === "hoja" && <fieldset className="sp-choice"><legend>¿Reúne las tres características de un puñal?</legend><label><input type="checkbox" checked={menorOnce} onChange={(event) => setMenorOnce(event.target.checked)} /> Hoja menor de 11 cm</label><label><input type="checkbox" checked={dosFilos} onChange={(event) => setDosFilos(event.target.checked)} /> Dos filos</label><label><input type="checkbox" checked={puntiaguda} onChange={(event) => setPuntiaguda(event.target.checked)} /> Punta</label></fieldset>}{(tipo === "cuchillo" || tipo === "machete") && <fieldset className="sp-choice"><legend>¿Forma parte de un armamento debidamente aprobado?</legend>{armamentOptions.map(([id, label]) => <label key={id}><input type="radio" checked={armamento === id} onChange={() => setArmamento(id as typeof armamento)} /> {label}</label>)}</fieldset>}{showTenenciaExcepcional && <fieldset className="sp-choice"><legend>¿Existe una circunstancia excepcional de tenencia?</legend>{exceptionalTenureOptions.map(([id, label]) => <label key={id}><input type="radio" checked={circunstanciaTenencia === id} onChange={() => setCircunstanciaTenencia(id as typeof circunstanciaTenencia)} /> {label}</label>)}</fieldset>}{showCarry && <><fieldset className="sp-choice"><legend>¿Para qué lleva el objeto?</legend>{carryPurposeOptions.map(([id, label]) => <label key={id}><input type="radio" checked={motivo === id} onChange={() => { setMotivo(id as NonNullable<typeof motivo>); setAccesoRestringido(undefined); setMotivoSeguridadFinalizado(undefined); }} /> {label}</label>)}</fieldset><fieldset className="sp-choice"><legend>¿Cómo lo transporta?</legend>{carryTransportOptions.map(([id, label]) => <label key={id}><input type="radio" checked={transporte === id} onChange={() => { setTransporte(id as NonNullable<typeof transporte>); setAccesoRestringido(undefined); setMotivoSeguridadFinalizado(undefined); }} /> {label}</label>)}</fieldset><fieldset className="sp-choice"><legend>¿Dónde se encuentra?</legend>{carryPlaceOptions.map(([id, label]) => <label key={id}><input type="radio" checked={lugar === id} onChange={() => choosePlace(id as NonNullable<typeof lugar>)} /> {label}</label>)}</fieldset>{sensitivePlace && <fieldset className="sp-choice"><legend>Datos adicionales relevantes</legend>{momentOptions.map(([id, label]) => <label key={id}><input type="radio" checked={momento === id} onChange={() => setMomento(id as NonNullable<typeof momento>)} /> {label}</label>)}<span className="sp-choice-divider">¿Se observan signos de consumo o influencia?</span>{yesNoUnknown.map(([id, label]) => <label key={`consumo-${id}`}><input type="radio" checked={consumo === id} onChange={() => setConsumo(id as NonNullable<typeof consumo>)} /> {label}</label>)}</fieldset>}{showSafetyAccess && <fieldset className="sp-choice"><legend>¿Intenta acceder a un espacio con una restricción concreta de seguridad?</legend>{yesNoUnknown.map(([id, label]) => <label key={`acceso-${id}`}><input type="radio" checked={accesoRestringido === id} onChange={() => { setAccesoRestringido(id as NonNullable<typeof accesoRestringido>); if (id !== "si") setMotivoSeguridadFinalizado(undefined); }} /> {label}</label>)}{accesoRestringido === "si" && <div className="sp-nested-question"><strong>¿Ha desaparecido el motivo concreto de seguridad?</strong>{yesNoUnknown.map(([id, label]) => <label key={`fin-${id}`}><input type="radio" checked={motivoSeguridadFinalizado === id} onChange={() => setMotivoSeguridadFinalizado(id as NonNullable<typeof motivoSeguridadFinalizado>)} /> {label}</label>)}</div>}</fieldset>}</>}</>}<div className="sp-dimensions"><p><span>CLASIFICACIÓN DEL OBJETO</span><strong>{result.clasificacionObjeto}</strong></p><p><span>CONDUCTA OBSERVADA</span><strong>{result.conducta}</strong></p></div>{result.kind === "penal" && <ProcessualControls flagrante={flagrante} setFlagrante={setFlagrante} profile={profile} setProfile={setProfile} />}<ResolvedOutcome result={result} weapon={ordinaryObject ? "object" : "weapon"} showFoundation={false} /><WeaponDetails concept={concept} result={result} ordinaryObject={ordinaryObject} /></>;
}

function WeaponDetails({ concept, result, ordinaryObject }: { concept: PublicConcept; result: WeaponOutcome; ordinaryObject: boolean }) { return <div className="sp-common">{result.salidaSubsidiaria && <CollapsibleSection title="Salida administrativa subsidiaria"><p>{result.salidaSubsidiaria}</p></CollapsibleSection>}{result.derivaOtroDelito && <CollapsibleSection title={ordinaryObject ? "Posible delito cometido utilizando el objeto" : "Delito cometido utilizando el arma"}><p>{ordinaryObject ? "La clasificación del objeto no elimina su relevancia por el uso ni activa automáticamente el art. 563 CP." : "La vía del art. 563 y el delito cometido utilizando el arma exigen sus propios requisitos."}</p>{result.dependenciaFutura && <p><strong>{result.dependenciaFutura}</strong></p>}</CollapsibleSection>}<CollapsibleSection title="Datos para acta o diligencias"><Checklist items={["Tipo, características y dimensiones relevantes.", "Lugar, motivo y forma de porte.", "Actividad relacionada y accesibilidad.", "Conducta y contexto observados.", "Fotografías, cuando proceda."]} /></CollapsibleSection><CollapsibleSection title="Fundamento jurídico">{concept.detalle?.length ? <Checklist items={concept.detalle} /> : null}{!ordinaryObject && <p>El art. 563 exige conjuntamente los requisitos constitucionales ya incorporados al motor.</p>}<Checklist items={concept.fuentes ?? []} /></CollapsibleSection></div> }

function AuthorityDecision({ concept }: { concept: PublicConcept }) {
  const options = concept.id === "desobediencia" ? [["admin", "Desobediencia administrativa: falta alguno de los requisitos penales"], ["penal", "Desobediencia grave: concurren todos los requisitos penales"]] : concept.id === "resistencia" ? [["admin", "Resistencia pasiva leve, oposición de escasa entidad o dificultad menor"], ["penal", "Resistencia pasiva grave o activa de entidad penal sin atentado"], ["atentado", "Agresión, acometimiento o resistencia grave mediante violencia o intimidación grave"]] : [["admin", "Expresión ofensiva sin anuncio serio de mal penal"], ["leve", "Amenaza leve"], ["art169", "Amenaza con entidad del art. 169 CP"], ["atentado", "Intimidación grave integrada en resistencia grave o inicio inmediato de ataque"]];
  const [level, setLevel] = useState(options[0][0]); const [flagrante, setFlagrante] = useState(true); const [profile, setProfile] = useState<"favorable" | "riesgo">("favorable");
  const penal = ["penal", "atentado", "art169"].includes(level);
  const processual: ProcessualInput = flagrante ? { flagrante: true } : { flagrante: false, plenamenteIdentificado: profile === "favorable", localizable: profile === "favorable", riesgoIncomparecencia: profile === "riesgo" };
  const result = resolveAuthorityOutcome(concept.id, level, processual);
  return <><OperationalSection title="Indicadores objetivos" items={concept.comprobar} /><fieldset className="sp-choice"><legend>Selecciona la conducta observada ya comprobada</legend>{options.map(([id, label]) => <label key={id}><input type="radio" checked={level === id} onChange={() => setLevel(id)} /> {label}</label>)}</fieldset>{penal && level !== "leve" && <ProcessualControls flagrante={flagrante} setFlagrante={setFlagrante} profile={profile} setProfile={setProfile} />}{result && <ResolvedOutcome result={result} />}</>;
}

function ResolvedOutcome({ result, drug = false, weapon, showFoundation = true }: { result: AuthorityOutcome | DrugOutcome | WeaponOutcome; drug?: boolean; weapon?: "weapon" | "object"; showFoundation?: boolean }) {
  const hasProcessualOutput = Boolean(result.situacion || result.detencion);
  const relevantObject = weapon === "object" && "kind" in result && !["sin_conclusion_automatica", "valoracion_especifica"].includes(result.kind);
  const actions = result.actuacion.filter((item) => !isContinuationAction(item));
  return <><ResultCard title={result.titulo} norma={result.norma} clasificacion={result.clasificacion} range={"rango" in result ? result.rango : undefined} text={result.porQue} /><OperationalSection title="Actuación policial" items={actions} />{hasProcessualOutput && <><AuthorSituation decision={result} /><Continuation decision={result} /></>}{weapon === "weapon" && "kind" in result && result.kind === "penal" && <EffectsCommon weapon />}{relevantObject && <EffectsCommon object />}{drug && <CommonProcessual showSubstance />}{showFoundation && <LegalFoundation normas={[result.norma]} detalle={"frontera" in result ? result.frontera : "No se usa una cantidad, ni un número de indicios, como frontera automática."} />}</>;
}

function ResultCard({ title, norma, clasificacion, range, text, showText = true }: { title: string; norma: string; clasificacion?: string; range?: string; text: string; showText?: boolean }) { return <section className="sp-result"><span>{title}</span><h3>{norma}</h3>{clasificacion && <strong className={clasificacion.includes("DELITO") ? "sp-pill penal" : "sp-pill"}>{clasificacion}</strong>}{range && <p className="sp-range">Rango legal: <strong>{range}</strong></p>}{showText && <p>{text}</p>}{range && <p>La LO 4/2015 califica esta conducta como infracción grave y prevé una sanción de entre 601 y 30.000 euros. La cuantía concreta será determinada por el órgano sancionador competente.</p>}</section> }
function OperationalSection({ title, items }: { title: string; items: string[] }) { if (!items.length) return null; return <section className="sp-section"><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section> }
function EffectsCommon({ weapon = false, object = false }: { weapon?: boolean; object?: boolean }) { return <CollapsibleSection title={weapon || object ? "Efectos / instrumentos relacionados" : "Efectos / custodia"}><Checklist items={weapon ? ["Arma intervenida, ocupada y custodiada.", "Lugar exacto de intervención y persona que disponía de ella.", "Estado, características y relación objetiva con los hechos."] : object ? ["Objeto asegurado o intervenido cuando proceda por su relación con los hechos.", "Lugar exacto y persona que disponía de él.", "Estado, características y relación objetiva con la conducta."] : seguridadPublica.comunes.efectos} note={weapon || object ? "La intervención y custodia, cuando procedan, se incorporan a las diligencias y a la coordinación con CNP." : seguridadPublica.comunes.efectos_aviso} /></CollapsibleSection> }
function ProcessualControls({ flagrante, setFlagrante, profile, setProfile }: { flagrante: boolean; setFlagrante: (value: boolean) => void; profile: "favorable" | "riesgo"; setProfile: (value: "favorable" | "riesgo") => void }) { return <fieldset className="sp-choice"><legend>Situación procesal comprobada</legend><label><input type="radio" checked={flagrante} onChange={() => setFlagrante(true)} /> Hechos presenciados directamente: flagrancia</label><label><input type="radio" checked={!flagrante} onChange={() => setFlagrante(false)} /> Hechos conocidos posteriormente: no flagrancia</label>{!flagrante && <><label><input type="radio" checked={profile === "favorable"} onChange={() => setProfile("favorable")} /> Persona plenamente identificada y localizable, sin indicadores objetivos de riesgo de incomparecencia</label><label><input type="radio" checked={profile === "riesgo"} onChange={() => setProfile("riesgo")} /> Concurren circunstancias objetivas de riesgo de incomparecencia</label></>}</fieldset> }
function AuthorSituation({ decision }: { decision: { situacion?: "DETENIDO" | "INVESTIGADO NO DETENIDO" | "DILIGENCIAS DE PREVENCIÓN"; detencion?: "SÍ" | "NO"; escenarioProcesal?: string; fundamentoDetencion?: string } }) { if (!decision.situacion || !decision.detencion) return null; const detencion = decision.detencion === "SÍ" ? "SÍ" : decision.escenarioProcesal === "DELITO LEVE" ? "NO · regla general" : "NO"; return <section className="sp-section"><h3>Situación del autor</h3><div className="sp-status"><p><span>DETENCIÓN</span><strong>{detencion}</strong></p><p><span>SITUACIÓN</span><strong>{decision.situacion}</strong></p></div>{decision.escenarioProcesal === "DELITO LEVE" && <p className="sp-status-note">Regla general de no detención, salvo art. 495 LECrim.</p>}</section> }
function Continuation({ decision }: { decision: { situacion?: "DETENIDO" | "INVESTIGADO NO DETENIDO" | "DILIGENCIAS DE PREVENCIÓN" } }) { if (!decision.situacion) return null; const items = decision.situacion === "DETENIDO" ? ["Solicitar presencia de CNP en el lugar.", "Entregar persona y actuaciones a CNP."] : decision.situacion === "INVESTIGADO NO DETENIDO" ? ["Solicitar presencia de CNP o coordinar continuación y citación.", "Policía Local comparece posteriormente cuando corresponda."] : ["Diligencias a prevención y posterior comunicación a CNP."]; return <OperationalSection title="Continuación de la actuación" items={items} /> }
function LegalFoundation({ normas, detalle }: { normas: string[]; detalle?: string }) { return <div className="sp-common"><CollapsibleSection title="Fundamento jurídico"><Checklist items={uniqueItems(normas)} />{detalle && <p>{detalle}</p>}</CollapsibleSection></div> }
function CommonProcessual({ showSubstance = false }: { showSubstance?: boolean }) { if (!showSubstance) return null; return <div className="sp-common"><CollapsibleSection title="Aprehensión de sustancia"><Checklist items={seguridadPublica.comunes.aprehension} /></CollapsibleSection></div> }
function Checklist({ items, title, note }: { items: string[]; title?: string; note?: string }) { return <div className="sp-checklist">{title && <h4>{title}</h4>}<ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>{note && <p className="sp-note">{note}</p>}</div> }
const normalise = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const uniqueItems = (items: string[]) => [...new Set(items)];
const isContinuationAction = (item: string) => /coordinar continuacion|continuacion.*CNP|presentar.*CNP|continuacion y citacion/i.test(normalise(item));
const isAttentionAction = (item: string) => /evitar interrogatorios|repeticiones innecesarias|no impide continuar/i.test(normalise(item));
const isIncidentAttention = (item: PublicSafetyOutcome["resultados"][number]) =>
  /DENUNCIA DE LA V[ÍI]CTIMA|NO VALORAR [ÚU]NICAMENTE COMO LESIONES|SUMISI[ÓO]N O VULNERABILIDAD QU[ÍI]MICA|V[ÍI]CTIMA MENOR DE 16 A[ÑN]OS/i.test(item.titulo);
const needsOutcomeDetail = (title: string) =>
  /CLASIFICACI[ÓO]N PROVISIONAL|INDIVIDUALIZAR CONDUCTAS|DATOS DE .*PENDIENTES|SIN AGRESI[ÓO]N F[ÍI]SICA|SIN ACTO SEXUAL/i.test(title);
const relationshipOptions: Array<[string, string]> = [["vg", "Hombre → esposa, exesposa o mujer ligada o anteriormente ligada por relación análoga de afectividad"], ["domestica", "Otro integrante del ámbito familiar o convivencial protegido"], ["ninguna", "Sin relación de este tipo"]];
const relationEvents: Array<[string, string]> = [["agresion", "Agresión física"], ["amenazas", "Amenazas"], ["coacciones", "Coacciones"], ["sexual", "Agresión sexual"], ["quebrantamiento", "Posible quebrantamiento de prohibición o medida"]];
const medicalResultOptions: Array<[string, string]> = [["sin_asistencia", "Todavía sin asistencia"], ["primera_asistencia", "Primera asistencia únicamente"], ["tratamiento_posterior", "Requiere tratamiento médico o quirúrgico posterior"], ["desconocido", "Se desconoce"]];
const fightTypeOptions: Array<[string, string]> = [["una_agrede", "Una persona agrede a otra"], ["reciproca", "Dos personas se agreden mutuamente"], ["grupal_confusa", "Varias personas o grupos se acometen de forma confusa"], ["grupal_individualizable", "Varias personas intervienen, pero pueden individualizarse claramente agresores y víctimas"]];
const freedomConductOptions: Array<[string, string]> = [["amenaza", "Anuncia que causará un mal"], ["coaccion", "Obliga a hacer algo o impide hacer algo"], ["acoso", "Conducta reiterada de vigilancia, persecución o contacto"]];
const threatHarmOptions: Array<[string, string]> = [["entidad_delictiva", "Muerte, lesión grave, agresión sexual u otro mal de esa entidad"], ["menor_entidad", "Mal de menor entidad"], ["no_precisado", "No puede concretarse todavía"]];
const coactionOptions: Array<[string, string]> = [["general", "Violencia o intimidación para obligar o impedir"], ["leve", "Imposición o impedimento de menor entidad"], ["no_precisada", "No puede concretarse todavía"]];
const trafficIndicators = ["Cantidad o naturaleza", "Forma de presentación o pluralidad de envoltorios", "Básculas, bolsas, material o sustancias de corte", "Dinero compatible con ventas", "Ventas, entregas o contactos observados", "Comunicaciones incorporables legítimamente", "Contexto, ocultación, condición de consumidor o explicación ofrecida"];
const weaponAvailability = [["encima", "La lleva encima"], ["efectos", "Está dentro de mochila, bolso, caja u otros efectos"], ["vehiculo", "Se encuentra en un vehículo"], ["sin_disponente", "No puede determinarse claramente quién dispone del objeto"]];
const weaponBehaviour = [["porte", "La lleva guardada / simplemente la porta"], ["manipula", "La manipula"], ["exhibe", "La exhibe"], ["intimidatoria", "La exhibe de forma intimidatoria"], ["amenaza", "Amenaza con ella"], ["intenta", "Intenta utilizarla contra otra persona"], ["usa", "La utiliza efectivamente contra otra persona"]];
const weaponContext = [["sin_incidente", "No existe otra conducta relacionada"], ["altercado", "Existe discusión o altercado"], ["violento", "Existe una situación violenta"], ["amenazas", "Se están produciendo amenazas o intimidación"], ["otro_delito", "Está relacionada con otro posible delito"], ["otras", "Existen otras circunstancias relevantes"]];
const weaponRelatedContext = weaponContext.filter(([id]) => id !== "sin_incidente");
const bladeTypes = [["navaja", "Navaja"], ["hoja", "Posible puñal"], ["cuchillo", "Cuchillo ordinario"], ["machete", "Machete"]];
const mechanismOptions = [["automatico", "Automático"], ["no_automatico", "No automático"], ["dudoso", "No puedo determinarlo con seguridad"]];
const manualLengthOptions = [["supera_11", "Sí, supera 11 cm"], ["no_supera_11", "No, no supera 11 cm"], ["dudosa", "No puedo determinarlo con seguridad"]];
const armamentOptions = [["aprobado", "Sí"], ["imitacion", "Parece una imitación de ese tipo"], ["no", "No"], ["dudoso", "No puedo determinarlo con seguridad"]];
const exceptionalTenureOptions = [["contemplacion", "Mera contemplación o examen"], ["reparacion", "Reparación"], ["transmision", "Simple transmisión a otra persona"], ["ninguna", "Ninguna de las anteriores"]];
const carryPurposeOptions = [["trabajo", "Trabajo"], ["actividad", "Actividad deportiva, caza o pesca"], ["trayecto", "Transporte hacia o desde una actividad relacionada"], ["otro", "Otro motivo concreto"], ["ninguno", "Ningún motivo concreto"], ["dudoso", "No puede determinarse"]];
const carryTransportOptions = [["funda", "En funda, caja o bolsa adecuada"], ["equipamiento", "Junto con herramientas o equipamiento relacionado"], ["mochila", "En mochila o bolso"], ["bolsillo", "En bolsillo, cintura o ropa"], ["accesible", "Inmediatamente accesible"], ["otro", "Otra situación"]];
const carryPlaceOptions = [["trabajo", "Lugar de trabajo relacionado"], ["actividad", "Actividad deportiva, caza o pesca relacionada"], ["trayecto", "Trayecto directo hacia o desde dicha actividad"], ["via_publica", "Vía pública sin relación aparente con esa actividad"], ["establecimiento", "Establecimiento público"], ["ocio", "Local o zona de ocio"], ["reunion", "Lugar de reunión, concentración o recreo"], ["otro", "Otro lugar"]];
const momentOptions = [["coherente", "Horario coherente con la actividad"], ["madrugada", "Madrugada sin actividad relacionada"], ["otro", "Otro momento"], ["dudoso", "No puede determinarse"]];
const yesNoUnknown = [["si", "Sí"], ["no", "No"], ["dudoso", "No puede determinarse"]];
