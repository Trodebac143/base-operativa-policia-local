"use client";

import { useState, type ReactNode } from "react";

export type TerraceGuideId =
  | "location-types"
  | "free-passage"
  | "barrier-height"
  | "extinguisher-label"
  | "heater-extinguisher"
  | "clear-access";

type TerraceGuideDefinition = {
  eyebrow: string;
  title: string;
  summary: string;
  graphic: () => ReactNode;
  notes?: string[];
};

export const TERRACE_CASE_GUIDE_IDS: Readonly<Record<string, readonly TerraceGuideId[]>> = {
  "TER-OP-005": ["free-passage"],
  "TER-OP-006": ["barrier-height"],
  "TER-OP-015": ["extinguisher-label", "heater-extinguisher", "clear-access"],
};

export const TERRACE_GENERAL_GUIDE_IDS: readonly TerraceGuideId[] = ["location-types"];

const guides: Record<TerraceGuideId, TerraceGuideDefinition> = {
  "location-types": {
    eyebrow: "Ubicación",
    title: "Tipologías de terraza",
    summary: "Distingue de un vistazo una terraza adosada, en línea de rastrillo o situada en una zona peatonal.",
    graphic: LocationTypesGraphic,
    notes: ["Identifica primero la ubicación real.", "Después aplica solo las comprobaciones que correspondan a esa tipología."],
  },
  "free-passage": {
    eyebrow: "Medición",
    title: "Qué es la anchura libre de paso",
    summary: "La flecha marca únicamente el espacio que queda disponible para el tránsito peatonal, sin contar la zona ocupada por la terraza.",
    graphic: FreePassageGraphic,
    notes: ["Mide entre el límite real de la terraza y el obstáculo o borde que cierra el itinerario.", "Contrasta la medición con la ubicación y el plano autorizado."],
  },
  "barrier-height": {
    eyebrow: "Delimitación",
    title: "Altura y función de la valla",
    summary: "Referencia visual para medir la valla específica cuando resulte exigible por la ubicación de la terraza.",
    graphic: BarrierHeightGraphic,
    notes: ["En línea de rastrillo, la referencia validada es de 80 a 150 cm.", "La valla debe delimitar y evitar el acceso directo a la calzada; no basta con que exista un elemento decorativo."],
  },
  "extinguisher-label": {
    eyebrow: "Extintor",
    title: "Cómo leer 21A y 13B",
    summary: "Localiza en la etiqueta la eficacia mínima de extinción, sin confundirla con el tipo de extintor.",
    graphic: ExtinguisherLabelGraphic,
    notes: ["21A: eficacia frente a fuegos de clase A, como madera, papel o tejidos.", "13B: eficacia frente a fuegos de clase B, como líquidos inflamables.", "Ejemplo: 21A 113B C cumple el mínimo 21A-13B."],
  },
  "heater-extinguisher": {
    eyebrow: "Estufas",
    title: "Extintor próximo y accesible",
    summary: "Comprueba conjuntamente la presencia de estufas, la distancia al extintor y que el acceso quede libre.",
    graphic: HeaterExtinguisherGraphic,
    notes: ["Referencia validada: extintor de eficacia mínima 21A-13B a menos de 15 m.", "El recorrido hasta el extintor debe permanecer visible y accesible."],
  },
  "clear-access": {
    eyebrow: "Accesos",
    title: "Portales, salidas e itinerarios libres",
    summary: "Compara un paso utilizable con otro interferido por mesas, sillas u otros elementos de la terraza.",
    graphic: ClearAccessGraphic,
    notes: ["Observa el espacio realmente disponible para entrar, salir o evacuar.", "Documenta qué elemento invade o dificulta el itinerario."],
  },
};

export function TerraceGeneralGuide() {
  return <section className="terrace-guide-overview" aria-label="Ayudas gráficas generales de terrazas">
    <div><span>AYUDA GRÁFICA</span><h3>¿Dónde está situada la terraza?</h3><p>Consulta las tres disposiciones básicas antes de elegir una comprobación.</p></div>
    <TerraceVisualGuide guideId={TERRACE_GENERAL_GUIDE_IDS[0]} compact />
  </section>;
}

export function TerraceCaseGuides({ caseId }: { caseId: string }) {
  const guideIds = TERRACE_CASE_GUIDE_IDS[caseId] ?? [];
  if (!guideIds.length) return null;
  return <section className="terrace-guide-list" aria-label="Ayudas gráficas de la ficha">
    <div className="terrace-guide-list-title"><span aria-hidden="true">◫</span><div><h3>Ayudas gráficas</h3><p>Ábrelas solo cuando necesites aclarar una comprobación.</p></div></div>
    <div>{guideIds.map((guideId) => <TerraceVisualGuide key={guideId} guideId={guideId} />)}</div>
  </section>;
}

export function TerraceVisualGuide({ guideId, compact = false }: { guideId: TerraceGuideId; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const guide = guides[guideId];
  const panelId = `terrace-guide-${guideId}`;
  const Graphic = guide.graphic;
  return <div className={`terrace-guide ${compact ? "compact" : ""}`} data-guide-id={guideId}>
    <button type="button" className="terrace-guide-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((current) => !current)}>
      <span><small>{guide.eyebrow}</small><strong>{guide.title}</strong></span>
      <b>{open ? "Ocultar esquema" : "Ver esquema"}<i aria-hidden="true">{open ? "−" : "+"}</i></b>
    </button>
    {open && <section id={panelId} className="terrace-guide-panel" aria-label={guide.title}>
      <header><span>GUÍA VISUAL</span><h4>{guide.title}</h4><p>{guide.summary}</p></header>
      <div className="terrace-guide-canvas"><Graphic /></div>
      {!!guide.notes?.length && <ul className="terrace-guide-notes">{guide.notes.map((note) => <li key={note}>{note}</li>)}</ul>}
      <button type="button" className="terrace-guide-close" onClick={() => setOpen(false)}>Cerrar ayuda gráfica</button>
    </section>}
  </div>;
}

function LocationTypesGraphic() {
  return <div className="terrace-guide-triptych">
    <GuideMiniPanel label="Adosada a fachada"><svg viewBox="0 0 240 180" role="img" aria-label="Vista superior de una terraza adosada a fachada">
      <rect className="guide-wall" x="12" y="15" width="216" height="34" rx="6"/><text className="guide-label-on-dark" x="120" y="37" textAnchor="middle">FACHADA</text>
      <rect className="guide-terrace-zone" x="48" y="57" width="144" height="62" rx="9"/><TableTop x={78} y={88}/><TableTop x={142} y={88}/>
      <path className="guide-walk-line" d="M25 145 H215"/><path className="guide-walk-arrow" d="M198 137 l17 8 -17 8"/><text className="guide-caption" x="120" y="169" textAnchor="middle">Paso frente a la terraza</text>
    </svg></GuideMiniPanel>
    <GuideMiniPanel label="En línea de rastrillo"><svg viewBox="0 0 240 180" role="img" aria-label="Vista superior de una terraza situada junto al bordillo">
      <rect className="guide-wall" x="12" y="15" width="216" height="30" rx="6"/><text className="guide-label-on-dark" x="120" y="35" textAnchor="middle">FACHADA</text>
      <path className="guide-walk-line" d="M25 80 H215"/><path className="guide-walk-arrow" d="M198 72 l17 8 -17 8"/><rect className="guide-terrace-zone" x="48" y="101" width="144" height="48" rx="8"/><TableTop x={82} y={125}/><TableTop x={150} y={125}/>
      <rect className="guide-curb" x="12" y="158" width="216" height="10" rx="3"/><text className="guide-caption" x="120" y="96" textAnchor="middle">Itinerario peatonal</text>
    </svg></GuideMiniPanel>
    <GuideMiniPanel label="En zona peatonal"><svg viewBox="0 0 240 180" role="img" aria-label="Vista superior de una terraza en una zona peatonal">
      <rect className="guide-plaza" x="12" y="15" width="216" height="150" rx="12"/><path className="guide-plaza-lines" d="M24 52 H216 M24 90 H216 M24 128 H216"/>
      <rect className="guide-terrace-zone" x="71" y="42" width="98" height="82" rx="10"/><TableTop x={98} y={68}/><TableTop x={142} y={98}/>
      <path className="guide-walk-line" d="M28 145 H212"/><path className="guide-walk-arrow" d="M195 137 l17 8 -17 8"/><text className="guide-caption" x="120" y="158" textAnchor="middle">Zona de paso</text>
    </svg></GuideMiniPanel>
  </div>;
}

function FreePassageGraphic() {
  return <div className="terrace-guide-comparison">
    <GuideStatusPanel status="correct" title="Paso identificable"><PassagePlan crowded={false} /></GuideStatusPanel>
    <GuideStatusPanel status="incorrect" title="Paso invadido"><PassagePlan crowded /></GuideStatusPanel>
  </div>;
}

function PassagePlan({ crowded }: { crowded: boolean }) {
  const boundary = crowded ? 190 : 150;
  return <svg viewBox="0 0 320 250" role="img" aria-label={crowded ? "Vista superior de una terraza que invade el paso peatonal" : "Vista superior con la anchura libre de paso correctamente identificada"}>
    <rect className="guide-wall" x="12" y="12" width="296" height="34" rx="6"/><text className="guide-label-on-dark" x="160" y="34" textAnchor="middle">FACHADA</text>
    <rect className="guide-sidewalk" x="12" y="50" width="296" height="158" rx="4"/><text className="guide-surface-label" x="28" y="72">ACERA</text>
    <rect className={crowded ? "guide-terrace-zone danger" : "guide-terrace-zone"} x="34" y="82" width={boundary - 34} height="104" rx="9"/>
    <TableTop x={75} y={112}/><TableTop x={crowded ? 151 : 115} y={155}/>
    <line className={crowded ? "guide-measure danger" : "guide-measure"} x1={boundary + 10} y1="109" x2="292" y2="109"/>
    <path className={crowded ? "guide-arrowhead danger" : "guide-arrowhead"} d={`M${boundary + 10} 109 l12 -7 v14 z M292 109 l-12 -7 v14 z`}/>
    <text className={crowded ? "guide-measure-label danger" : "guide-measure-label"} x={(boundary + 302) / 2} y="99" textAnchor="middle">ANCHURA LIBRE</text>
    <rect className="guide-curb" x="12" y="208" width="296" height="12" rx="3"/><text className="guide-caption" x="160" y="242" textAnchor="middle">Bordillo / calzada</text>
  </svg>;
}

function BarrierHeightGraphic() {
  return <div className="terrace-guide-comparison">
    <GuideStatusPanel status="correct" title="Referencia de altura"><svg viewBox="0 0 320 250" role="img" aria-label="Vista frontal de una valla medida entre 80 y 150 centímetros">
      <rect className="guide-ground" x="18" y="207" width="284" height="14" rx="4"/><Fence x={102} y={67} width={162} height={140}/>
      <line className="guide-measure" x1="65" y1="67" x2="65" y2="207"/><path className="guide-arrowhead" d="M65 67 l-7 12 h14 z M65 207 l-7 -12 h14 z"/>
      <rect className="guide-measure-chip" x="18" y="120" width="76" height="34" rx="17"/><text className="guide-measure-chip-text" x="56" y="142" textAnchor="middle">80–150 cm</text>
      <text className="guide-caption" x="183" y="239" textAnchor="middle">Mide desde la base hasta la coronación</text>
    </svg></GuideStatusPanel>
    <GuideStatusPanel status="incorrect" title="No cumple su función"><svg viewBox="0 0 320 250" role="img" aria-label="Valla fuera del rango o que no delimita correctamente">
      <rect className="guide-ground" x="18" y="207" width="284" height="14" rx="4"/><Fence x={74} y={123} width={172} height={84} broken/>
      <path className="guide-danger-mark" d="M252 54 l42 42 M294 54 l-42 42"/><text className="guide-danger-text" x="173" y="36" textAnchor="middle">FUERA DE RANGO O SIN CIERRE EFECTIVO</text>
      <path className="guide-pedestrian-path danger" d="M142 180 C180 164 203 160 275 169"/><text className="guide-caption" x="160" y="239" textAnchor="middle">Revisa altura, aperturas y acceso a calzada</text>
    </svg></GuideStatusPanel>
  </div>;
}

function ExtinguisherLabelGraphic() {
  return <div className="guide-extinguisher-layout">
    <svg viewBox="0 0 230 330" role="img" aria-label="Extintor con su etiqueta de eficacia destacada">
      <path className="guide-hose" d="M142 60 C190 63 195 118 170 149"/><rect className="guide-extinguisher-handle" x="91" y="35" width="65" height="22" rx="8"/><rect className="guide-extinguisher-body" x="59" y="58" width="112" height="235" rx="52"/>
      <rect className="guide-extinguisher-label" x="76" y="111" width="78" height="102" rx="8"/><text className="guide-label-heading" x="115" y="136" textAnchor="middle">EFICACIA</text><text className="guide-label-code" x="115" y="168" textAnchor="middle">21A</text><text className="guide-label-code" x="115" y="197" textAnchor="middle">113B C</text>
      <rect className="guide-ground" x="41" y="292" width="149" height="14" rx="5"/>
    </svg>
    <div className="guide-rating-card"><span>EFICACIA MÍNIMA</span><div><b>21A</b><small>Clase A · sólidos</small></div><div><b>13B</b><small>Clase B · líquidos inflamables</small></div><p><strong>Ejemplo válido</strong><em>21A&nbsp;&nbsp;113B&nbsp;&nbsp;C</em></p><footer>No describe el tipo de extintor: indica su capacidad mínima de extinción.</footer></div>
  </div>;
}

function HeaterExtinguisherGraphic() {
  return <svg className="guide-wide-svg" viewBox="0 0 640 330" role="img" aria-label="Estufa de terraza conectada por un recorrido libre a un extintor accesible">
    <rect className="guide-plaza" x="18" y="18" width="604" height="294" rx="18"/><rect className="guide-terrace-zone" x="52" y="58" width="180" height="212" rx="18"/><text className="guide-surface-label" x="75" y="87">ZONA DE TERRAZA</text>
    <Heater x={142} y={165} scale={0.72}/><text className="guide-caption" x="142" y="257" textAnchor="middle">ESTUFA</text>
    <path className="guide-access-route" d="M230 171 C330 171 383 111 470 111"/><path className="guide-access-arrow" d="M453 101 l22 10 -22 10"/><rect className="guide-access-chip" x="263" y="216" width="216" height="34" rx="17"/><text className="guide-access-label" x="371" y="238" textAnchor="middle">RECORRIDO LIBRE · &lt; 15 m</text>
    <rect className="guide-wall" x="496" y="52" width="92" height="225" rx="10"/><ExtinguisherIcon x={542} y={145}/><text className="guide-label-on-dark" x="542" y="235" textAnchor="middle">EXTINTOR</text><text className="guide-label-on-dark small" x="542" y="255" textAnchor="middle">≥ 21A-13B</text>
    <circle className="guide-ok-circle" cx="474" cy="111" r="18"/><path className="guide-ok-check" d="M465 111 l7 7 13 -15"/>
  </svg>;
}

function ClearAccessGraphic() {
  return <div className="terrace-guide-comparison">
    <GuideStatusPanel status="correct" title="Acceso libre"><AccessPlan blocked={false}/></GuideStatusPanel>
    <GuideStatusPanel status="incorrect" title="Acceso interferido"><AccessPlan blocked/></GuideStatusPanel>
  </div>;
}

function AccessPlan({ blocked }: { blocked: boolean }) {
  return <svg viewBox="0 0 320 250" role="img" aria-label={blocked ? "Portal bloqueado por mobiliario de terraza" : "Portal con el itinerario de entrada y salida libre"}>
    <rect className="guide-building" x="26" y="18" width="268" height="72" rx="10"/><rect className="guide-door" x="125" y="29" width="70" height="61" rx="5"/><text className="guide-label-on-dark" x="160" y="64" textAnchor="middle">PORTAL</text>
    <rect className="guide-sidewalk" x="26" y="94" width="268" height="132" rx="8"/>
    <path className={blocked ? "guide-pedestrian-path danger" : "guide-pedestrian-path"} d="M160 206 C160 174 160 139 160 97"/><path className={blocked ? "guide-route-arrow danger" : "guide-route-arrow"} d="M151 113 l9 -18 9 18"/>
    <Person x={160} y={183}/>
    {blocked ? <><TableTop x={160} y={133}/><Chair x={119} y={148}/><Chair x={201} y={148}/><path className="guide-danger-mark" d="M232 38 l38 38 M270 38 l-38 38"/></> : <><TableTop x={70} y={153}/><TableTop x={250} y={153}/><circle className="guide-ok-circle" cx="256" cy="47" r="18"/><path className="guide-ok-check" d="M247 47 l7 7 13 -15"/></>}
    <text className={blocked ? "guide-danger-text" : "guide-access-label"} x="160" y="241" textAnchor="middle">{blocked ? "EL MOBILIARIO CORTA EL ITINERARIO" : "ENTRADA, SALIDA Y PASO UTILIZABLES"}</text>
  </svg>;
}

function GuideMiniPanel({ label, children }: { label: string; children: ReactNode }) {
  return <figure className="terrace-guide-mini"><div>{children}</div><figcaption>{label}</figcaption></figure>;
}

function GuideStatusPanel({ status, title, children }: { status: "correct" | "incorrect"; title: string; children: ReactNode }) {
  return <figure className={`terrace-guide-status ${status}`}><figcaption><span aria-hidden="true">{status === "correct" ? "✓" : "!"}</span>{title}</figcaption><div>{children}</div></figure>;
}

function TableTop({ x, y }: { x: number; y: number }) {
  return <g className="guide-table"><circle cx={x} cy={y} r="13"/><rect x={x - 25} y={y - 9} width="10" height="18" rx="3"/><rect x={x + 15} y={y - 9} width="10" height="18" rx="3"/></g>;
}

function Fence({ x, y, width, height, broken = false }: { x: number; y: number; width: number; height: number; broken?: boolean }) {
  const posts = broken ? [0, 44, 128, 172] : [0, 40, 80, 120, 160];
  return <g className={broken ? "guide-fence broken" : "guide-fence"}><rect x={x} y={y + 13} width={width} height="12" rx="4"/><rect x={x} y={y + height - 20} width={width} height="12" rx="4"/>{posts.map((offset) => <rect key={offset} x={x + Math.min(offset, width - 8)} y={y} width="8" height={height} rx="3"/>)}</g>;
}

function Heater({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g className="guide-heater" transform={`translate(${x} ${y}) scale(${scale})`}><ellipse cx="0" cy="-65" rx="43" ry="12"/><rect x="-8" y="-55" width="16" height="95" rx="7"/><ellipse cx="0" cy="45" rx="34" ry="9"/><path d="M-31 -55 Q0 -92 31 -55 Z"/></g>;
}

function ExtinguisherIcon({ x, y }: { x: number; y: number }) {
  return <g className="guide-extinguisher-icon"><rect x={x - 21} y={y - 44} width="42" height="88" rx="19"/><rect x={x - 12} y={y - 55} width="28" height="13" rx="5"/><path d={`M${x + 15} ${y - 46} q24 12 8 35`}/><rect className="label" x={x - 13} y={y - 17} width="26" height="31" rx="3"/></g>;
}

function Person({ x, y }: { x: number; y: number }) {
  return <g className="guide-person"><circle cx={x} cy={y - 20} r="9"/><path d={`M${x} ${y - 10} v29 M${x} ${y} l-17 15 M${x} ${y} l17 15 M${x} ${y + 19} l-12 24 M${x} ${y + 19} l12 24`}/></g>;
}

function Chair({ x, y }: { x: number; y: number }) {
  return <g className="guide-chair"><rect x={x - 12} y={y - 11} width="24" height="20" rx="4"/><path d={`M${x - 9} ${y + 8} v17 M${x + 9} ${y + 8} v17 M${x - 13} ${y - 10} v-13`}/></g>;
}
