"use client";

import { useState } from "react";
import { documentForSource, libraryDocuments } from "@/data/documents";
import { filterSources, sources } from "@/data/sources";
import {
  groupSourcesByLibraryMatter,
  sourceLibraryGroupForSource,
  sourceLibraryGroups,
  sourceLibrarySubmatters,
  sourceUsage,
  type SourceLibraryGroup,
} from "@/data/source-usage";
import type { Source } from "@/data/types";
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
  const hasQuery = Boolean(query.trim());
  const groupedSources = groupSourcesByLibraryMatter(results);

  return (
    <div className="library-panel" aria-labelledby="library-sources-tab">
      <div className="library-search">
        <label htmlFor="source-search">Buscar fuente</label>
        <input id="source-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar fuente" autoComplete="off" />
      </div>
      <p className="library-result-count">{results.length} fuente{results.length === 1 ? "" : "s"}</p>
      {hasQuery ? (
        <div className="source-library-list" data-source-results="search">
          {results.map((source) => <SourceLibraryCard key={source.id} source={source} group={sourceLibraryGroupForSource(source.id)} />)}
        </div>
      ) : (
        <div className="source-library-groups" data-source-results="grouped">
          {sourceLibraryGroups.map((group) => {
            const groupSources = groupedSources[group.id];
            return (
              <details className="source-library-group" key={group.id}>
                <summary>
                  <span className="source-library-group-icon" aria-hidden="true">{group.icon}</span>
                  <span className="source-library-group-label">{group.label}</span>
                  <small className="source-library-group-count">{groupSources.length} fuente{groupSources.length === 1 ? "" : "s"}</small>
                </summary>
                <div className="source-library-list">
                  {groupSources.map((source) => <SourceLibraryCard key={source.id} source={source} />)}
                </div>
              </details>
            );
          })}
        </div>
      )}
      {!results.length && <LibraryEmpty text="No hay fuentes que coincidan con la búsqueda." />}
    </div>
  );
}

function SourceLibraryCard({ source, group }: { source: Source; group?: ReturnType<typeof sourceLibraryGroupForSource> }) {
  const usage = sourceUsage(source.id);
  const submatters = sourceLibrarySubmatters(usage);
  const localDocument = documentForSource(source.id);
  const groupMetadata: SourceLibraryGroup | undefined = group
    ? sourceLibraryGroups.find((candidate) => candidate.id === group)
    : undefined;

  return (
    <article id={`source-${source.id}`} className="source-library-card">
      <div className="source-library-heading">
        <div>
          <span className="source-library-kind">{source.tipo ?? "Fuente operativa"}</span>
          <h3>{source.nombre}</h3>
          {source.organismo && <p>{source.organismo}</p>}
        </div>
        <small>{source.id}</small>
      </div>
      {groupMetadata && <span className="source-library-group-badge"><span aria-hidden="true">{groupMetadata.icon}</span> {groupMetadata.label}</span>}
      {!!submatters.length && (
        <ul className="source-library-submatters" aria-label="Submaterias">
          {submatters.map((submatter) => <li key={submatter}>{submatter}</li>)}
        </ul>
      )}
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
