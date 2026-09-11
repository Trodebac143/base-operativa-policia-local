"use client";

import { useState } from "react";
import { documentForSource, libraryDocuments } from "@/data/documents";
import { filterSources, sources } from "@/data/sources";
import { sourceUsage } from "@/data/source-usage";
import { publicPath } from "@/lib/public-path";

type LibrarySection = "documents" | "sources";

export function LibraryDocumentsPanel() {
  const [query, setQuery] = useState("");
  const normalized = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const results = normalized
    ? libraryDocuments.filter((document) => `${document.titulo} ${document.archivo} ${document.descripcion}`
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(normalized))
    : libraryDocuments;

  return (
    <div className="library-panel" aria-labelledby="library-documents-tab">
      <div className="library-search">
        <label htmlFor="document-search">Buscar documentos</label>
        <input id="document-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título o nombre de archivo…" autoComplete="off" />
      </div>
      <div className="library-list library-document-list">
        {results.map((document) => (
          <article key={document.archivo}>
            <span className="library-document-icon" aria-hidden="true">▤</span>
            <div className="library-document-copy">
              <strong>{document.titulo}</strong>
              <p>{document.descripcion}</p>
              <small>{document.archivo}</small>
            </div>
            <a href={encodeURI(publicPath(`/documentos/${document.archivo}`))} target="_blank" rel="noopener noreferrer">Abrir documento <span aria-hidden="true">↗</span></a>
          </article>
        ))}
      </div>
      {!results.length && <LibraryEmpty text="No hay documentos que coincidan con la búsqueda." />}
    </div>
  );
}

export function LibrarySourcesPanel({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const results = filterSources(query);

  return (
    <div className="library-panel" aria-labelledby="library-sources-tab">
      <div className="library-search">
        <label htmlFor="source-search">Buscar fuente</label>
        <input id="source-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar fuente" autoComplete="off" />
      </div>
      <p className="library-result-count">{results.length} fuente{results.length === 1 ? "" : "s"}</p>
      <div className="source-library-list">
        {results.map((source) => {
          const usage = sourceUsage(source.id);
          const localDocument = documentForSource(source.id);
          return (
            <article id={`source-${source.id}`} className="source-library-card" key={source.id}>
              <div className="source-library-heading">
                <div>
                  <span className="source-library-kind">{source.tipo ?? "Fuente operativa"}</span>
                  <h3>{source.nombre}</h3>
                  {source.organismo && <p>{source.organismo}</p>}
                </div>
                <small>{source.id}</small>
              </div>
              <dl className="source-library-meta">
                {source.ambito && <div><dt>Ámbito</dt><dd>{source.ambito}</dd></div>}
                {source.estado_vigencia_auditoria && <div><dt>Estado</dt><dd>{source.estado_vigencia_auditoria}</dd></div>}
              </dl>
              {!!usage.length && (
                <div className="source-library-usage">
                  <strong>Utilizada en</strong>
                  <ul>{usage.map((label) => <li key={label}>{label}</li>)}</ul>
                </div>
              )}
              {(localDocument || source.urlOficial) && (
                <div className="source-library-actions">
                  {localDocument && <a href={encodeURI(publicPath(`/documentos/${localDocument.archivo}`))} target="_blank" rel="noopener noreferrer">Abrir documento <span aria-hidden="true">↗</span></a>}
                  {source.urlOficial && <a href={source.urlOficial} target="_blank" rel="noopener noreferrer">Consultar fuente oficial <span aria-hidden="true">↗</span></a>}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!results.length && <LibraryEmpty text="No hay fuentes que coincidan con la búsqueda." />}
    </div>
  );
}

export function LibraryView({ onBack }: { onBack: () => void }) {
  const [section, setSection] = useState<LibrarySection>("documents");
  return (
    <section className="library-view">
      <div className="sectionhead">
        <span className="kicker">CONSULTA DOCUMENTAL Y TRAZABILIDAD</span>
        <h2>Biblioteca</h2>
        <p>{libraryDocuments.length} documentos locales · {sources.length} fuentes centrales. Los documentos solo se cargan al abrirlos.</p>
      </div>
      <div className="library-tabs" role="tablist" aria-label="Secciones de la Biblioteca">
        <button id="library-documents-tab" type="button" role="tab" aria-selected={section === "documents"} onClick={() => setSection("documents")}>📄 Documentos</button>
        <button id="library-sources-tab" type="button" role="tab" aria-selected={section === "sources"} onClick={() => setSection("sources")}>🔗 Fuentes</button>
      </div>
      {section === "documents" ? <LibraryDocumentsPanel /> : <LibrarySourcesPanel />}
      <button className="back library-back" onClick={onBack}>← Volver a la Base Operativa</button>
    </section>
  );
}

function LibraryEmpty({ text }: { text: string }) {
  return <div className="empty"><h3>Sin resultados</h3><p>{text}</p></div>;
}
