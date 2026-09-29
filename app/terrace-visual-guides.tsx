"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { publicPath } from "@/lib/public-path";

export type TerraceGuideId =
  | "location-types"
  | "free-passage"
  | "barrier-height"
  | "clear-access"
  | "heater-extinguisher"
  | "awning-height"
  | "roadway-extension";

export type TerraceVisualGuideDefinition = {
  id: TerraceGuideId;
  title: string;
  summary: string;
  image: string;
  alt: string;
  width: number;
  height: number;
};

export const TERRACE_VISUAL_GUIDES: readonly TerraceVisualGuideDefinition[] = [
  {
    id: "location-types",
    title: "Tipologías de terraza",
    summary: "Diferencia visualmente terraza adosada a fachada, en línea de rastrillo y en zona peatonal.",
    image: "/imagenes/terrazas/tipologias-terraza.webp",
    alt: "Tipologías de terraza",
    width: 1671,
    height: 941,
  },
  {
    id: "free-passage",
    title: "Anchura libre de paso",
    summary: "Referencia visual del paso general de 1,80 m y del paso de 3,50 m en calles, paseos peatonales y plazas.",
    image: "/imagenes/terrazas/anchura-libre-paso.webp",
    alt: "Anchura libre de paso de una terraza",
    width: 1536,
    height: 1024,
  },
  {
    id: "barrier-height",
    title: "Línea de rastrillo: valla y bordillo",
    summary: "Referencia visual de separación al bordillo, altura de valla y apertura máxima.",
    image: "/imagenes/terrazas/linea-rastrillo-valla-bordillo.webp",
    alt: "Medidas de valla y bordillo en terraza en línea de rastrillo",
    width: 1672,
    height: 941,
  },
  {
    id: "clear-access",
    title: "Accesos, puertas y salidas",
    summary: "Referencia visual de separación desde quicios y espacio libre en salidas de emergencia.",
    image: "/imagenes/terrazas/accesos-salidas.webp",
    alt: "Distancias libres en puertas y salidas de emergencia",
    width: 1672,
    height: 941,
  },
  {
    id: "heater-extinguisher",
    title: "Estufas y extintor",
    summary: "Referencia visual de altura libre, distancia al extintor y eficacia mínima exigible.",
    image: "/imagenes/terrazas/estufas-extintor.webp",
    alt: "Requisitos de estufas y extintor",
    width: 1672,
    height: 941,
  },
  {
    id: "awning-height",
    title: "Altura de los toldos",
    summary: "Referencia visual del rango permitido entre 2,80 y 3,50 m.",
    image: "/imagenes/terrazas/altura-toldos.webp",
    alt: "Altura reglamentaria de toldos",
    width: 1672,
    height: 941,
  },
  {
    id: "roadway-extension",
    title: "Suplemento de calzada",
    summary: "Referencia visual de separación, protección, reflectantes y señalización.",
    image: "/imagenes/terrazas/suplemento-calzada.webp",
    alt: "Requisitos visuales de suplemento de calzada",
    width: 1672,
    height: 941,
  },
];

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function TerraceVisualHelp() {
  const [open, setOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState<TerraceGuideId | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const firstGuideRef = useRef<HTMLButtonElement>(null);
  const scrollPositionRef = useRef({ left: 0, top: 0 });
  const selectedGuide = TERRACE_VISUAL_GUIDES.find((guide) => guide.id === selectedGuideId) ?? null;

  const closeHelp = useCallback(() => {
    setOpen(false);
    setSelectedGuideId(null);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
      window.scrollTo(scrollPositionRef.current);
    });
  }, []);

  const openHelp = () => {
    scrollPositionRef.current = { left: window.scrollX, top: window.scrollY };
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    const focusFrame = window.requestAnimationFrame(() => {
      window.scrollTo(scrollPositionRef.current);
      closeRef.current?.focus({ preventScroll: true });
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeHelp();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [closeHelp, open]);

  const showGuide = (guideId: TerraceGuideId) => {
    setSelectedGuideId(guideId);
    window.requestAnimationFrame(() => backRef.current?.focus());
  };

  const showIndex = () => {
    setSelectedGuideId(null);
    window.requestAnimationFrame(() => firstGuideRef.current?.focus());
  };

  return <>
    <button ref={triggerRef} type="button" className="terrace-help-open" aria-haspopup="dialog" onClick={openHelp}>
      <span aria-hidden="true">◫</span><span>Ayuda visual</span>
    </button>
    {open && createPortal(<div className="terrace-help-overlay">
      <div ref={dialogRef} className="terrace-help-dialog" role="dialog" aria-modal="true" aria-labelledby="terrace-help-title">
        <header className="terrace-help-header">
          <div><span>Terrazas</span><h2 id="terrace-help-title">Ayuda visual</h2></div>
          <button ref={closeRef} type="button" className="terrace-help-close" onClick={closeHelp} aria-label="Cerrar Ayuda visual">Cerrar <span aria-hidden="true">×</span></button>
        </header>
        {selectedGuide ? <GuideDetail guide={selectedGuide} backRef={backRef} onBack={showIndex} /> : <GuideIndex firstGuideRef={firstGuideRef} onSelect={showGuide} />}
      </div>
    </div>, document.body)}
  </>;
}

function GuideIndex({ firstGuideRef, onSelect }: { firstGuideRef: RefObject<HTMLButtonElement | null>; onSelect: (guideId: TerraceGuideId) => void }) {
  return <div className="terrace-help-content terrace-help-index">
    <div className="terrace-help-intro"><h3>Guías disponibles</h3><p>Selecciona una referencia visual. Solo se cargará la imagen que abras.</p></div>
    <div className="terrace-help-grid">{TERRACE_VISUAL_GUIDES.map((guide, index) => <button
      ref={index === 0 ? firstGuideRef : undefined}
      type="button"
      key={guide.id}
      data-guide-id={guide.id}
      onClick={() => onSelect(guide.id)}
    >
      <span className="terrace-help-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <span><strong>{guide.title}</strong><small>{guide.summary}</small></span>
      <b aria-hidden="true">›</b>
    </button>)}</div>
  </div>;
}

function GuideDetail({ guide, backRef, onBack }: { guide: TerraceVisualGuideDefinition; backRef: RefObject<HTMLButtonElement | null>; onBack: () => void }) {
  return <div className="terrace-help-content terrace-help-detail">
    <button ref={backRef} type="button" className="terrace-help-back" onClick={onBack}>← Volver al índice</button>
    <section aria-labelledby={`terrace-help-guide-${guide.id}`}>
      <header><h3 id={`terrace-help-guide-${guide.id}`}>{guide.title}</h3><p>{guide.summary}</p></header>
      <div className="terrace-guide-canvas"><Image
        className="terrace-guide-image"
        src={publicPath(guide.image)}
        alt={guide.alt}
        width={guide.width}
        height={guide.height}
        sizes="(max-width: 700px) 100vw, 800px"
        loading="eager"
        decoding="async"
        unoptimized
      /></div>
    </section>
  </div>;
}
