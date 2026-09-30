"use client";
import { resolvePermitHelps } from "@/data/permisos";
import type { Category, OperationalCase, PermitGroup, PermitOperationalCase } from "@/data/types";

type CaseOpener = (item: OperationalCase) => void;

export function PermitCategoryView({ category, cases, groups, onOpenCase, onOpenGroup }: { category: Category; cases: PermitOperationalCase[]; groups: PermitGroup[]; onOpenCase: CaseOpener; onOpenGroup: (group: PermitGroup) => void }) {
  const entries = [
    ...cases.filter((item) => !item.subgrupo).map((item) => ({ order: Number(item.id.slice(-3)), kind: "case" as const, item })),
    ...groups.map((group) => ({ order: group.orden, kind: "group" as const, group })),
  ].sort((a, b) => a.order - b.order);
  return <section className="module-view-seguridad_vial"><div className="sectionhead"><span className="kicker">SEGURIDAD VIAL</span><h2 className="icon-heading"><span className="heading-icon" aria-hidden="true">{category.icono}</span>{category.nombre}</h2><p>{category.descripcion}</p></div><div className="listcards navigation-list">{entries.map((entry) => entry.kind === "case" ? <button key={entry.item.id} onClick={() => onOpenCase(entry.item)}><span className="nav-card-icon nav-card-icon-neutral" aria-hidden="true">📋</span><span><strong>{entry.item.titulo}</strong><small>{entry.item.norma} · art. {entry.item.articulo}</small></span>{entry.item.alerta_penal && <em className="warningtag">Atención penal</em>}<b aria-hidden="true">›</b></button> : <button className="permit-group-card" key={entry.group.id} onClick={() => onOpenGroup(entry.group)}><span className="nav-card-icon" aria-hidden="true">{entry.group.icono ?? "🪪"}</span><span><strong>{entry.group.nombre}</strong><small>{entry.group.descripcion}</small></span><em>{entry.group.casos.length} casos</em><b aria-hidden="true">›</b></button>)}</div></section>;
}

export function PermitGroupView({ group, cases, onOpenCase }: { group: PermitGroup; cases: PermitOperationalCase[]; onOpenCase: CaseOpener }) {
  const helps = resolvePermitHelps(group.ayudas);
  const groupCases = group.casos.map((id) => cases.find((item) => item.id === id)).filter((item): item is PermitOperationalCase => Boolean(item));
  return <section className="module-view-seguridad_vial"><div className="sectionhead"><span className="kicker">PERMISOS DE CONDUCIR</span><h2 className="icon-heading"><span className="heading-icon" aria-hidden="true">{group.icono}</span>{group.nombre}</h2><p>{group.descripcion}</p></div>{!!group.enlaces_operativos?.length && <nav className="permit-group-tools" aria-label={`Herramientas de ${group.nombre}`}>{group.enlaces_operativos.map((link) => <a className={link.principal ? "permit-link primary" : "permit-link"} key={link.url} href={link.url} target="_blank" rel="noreferrer"><span aria-hidden="true">🔗</span>{link.etiqueta} <span aria-hidden="true">↗</span></a>)}</nav>}{helps.map((help) => <details className="permit-help permit-group-help" key={help.id}><summary>VER REQUISITOS ART. 21</summary><h3>{help.titulo}</h3><p>{help.introduccion}</p>{help.secciones.map((section) => <section key={section.titulo}><h4>{section.titulo}</h4><ul>{section.contenido.map((entry) => <li key={entry}>{entry}</li>)}</ul>{section.advertencia && <strong>{section.advertencia}</strong>}</section>)}</details>)}<div className="listcards navigation-list permit-group-cases">{groupCases.map((item) => <button key={item.id} onClick={() => onOpenCase(item)}><span className="nav-card-icon nav-card-icon-neutral" aria-hidden="true">📋</span><span><strong>{item.titulo}</strong><small>{item.norma} · art. {item.articulo}</small></span>{item.alerta_penal && <em className="warningtag">Atención penal</em>}<b aria-hidden="true">›</b></button>)}</div></section>;
}
