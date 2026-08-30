"use client";
import { resolvePermitHelps } from "@/data/permisos";
import type { Category, OperationalCase, PermitGroup, PermitOperationalCase } from "@/data/types";

type CaseOpener = (item: OperationalCase) => void;

export function PermitCategoryView({ category, cases, groups, onOpenCase, onOpenGroup }: { category: Category; cases: PermitOperationalCase[]; groups: PermitGroup[]; onOpenCase: CaseOpener; onOpenGroup: (group: PermitGroup) => void }) {
  const entries = [
    ...cases.filter((item) => !item.subgrupo).map((item) => ({ order: Number(item.id.slice(-3)), kind: "case" as const, item })),
    ...groups.map((group) => ({ order: group.orden, kind: "group" as const, group })),
  ].sort((a, b) => a.order - b.order);
  return <section><div className="sectionhead"><span className="kicker">SEGURIDAD VIAL</span><h2>{category.nombre}</h2><p>{category.descripcion}</p></div><div className="listcards">{entries.map((entry) => entry.kind === "case" ? <button key={entry.item.id} onClick={() => onOpenCase(entry.item)}><span><strong>{entry.item.titulo}</strong><small>{entry.item.norma} · art. {entry.item.articulo}</small></span>{entry.item.alerta_penal && <em className="warningtag">Atención penal</em>}<b>›</b></button> : <button className="permit-group-card" key={entry.group.id} onClick={() => onOpenGroup(entry.group)}><span><strong>{entry.group.nombre}</strong><small>{entry.group.descripcion}</small></span><em>{entry.group.casos.length} casos</em><b>›</b></button>)}</div></section>;
}

export function PermitGroupView({ group, cases, onOpenCase }: { group: PermitGroup; cases: PermitOperationalCase[]; onOpenCase: CaseOpener }) {
  const helps = resolvePermitHelps(group.ayudas);
  const groupCases = group.casos.map((id) => cases.find((item) => item.id === id)).filter((item): item is PermitOperationalCase => Boolean(item));
  return <section><div className="sectionhead"><span className="kicker">PERMISOS DE CONDUCIR</span><h2>{group.nombre}</h2><p>{group.descripcion}</p></div>{!!group.enlaces_operativos?.length && <nav className="permit-group-tools" aria-label={`Herramientas de ${group.nombre}`}>{group.enlaces_operativos.map((link) => <a className={link.principal ? "permit-link primary" : "permit-link"} key={link.url} href={link.url} target="_blank" rel="noreferrer">{link.etiqueta} ↗</a>)}</nav>}{helps.map((help) => <details className="permit-help permit-group-help" key={help.id}><summary>VER REQUISITOS ART. 21</summary><h3>{help.titulo}</h3><p>{help.introduccion}</p>{help.secciones.map((section) => <section key={section.titulo}><h4>{section.titulo}</h4><ul>{section.contenido.map((entry) => <li key={entry}>{entry}</li>)}</ul>{section.advertencia && <strong>{section.advertencia}</strong>}</section>)}</details>)}<div className="listcards permit-group-cases">{groupCases.map((item) => <button key={item.id} onClick={() => onOpenCase(item)}><span><strong>{item.titulo}</strong><small>{item.norma} · art. {item.articulo}</small></span>{item.alerta_penal && <em className="warningtag">Atención penal</em>}<b>›</b></button>)}</div></section>;
}
