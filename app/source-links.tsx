import { documentForSource } from "@/data/documents";
import { resolveCaseSources } from "@/data/sources";
import { publicPath } from "@/lib/public-path";

export function SourceLinks({ sourceIds, className = "case-sources" }: { sourceIds: string[]; className?: string }) {
  const sources = resolveCaseSources(sourceIds);
  const links = sources.flatMap((source) => {
    const localDocument = documentForSource(source.id);
    const label = source.nombre;
    const entries: { key: string; href: string; label: string }[] = [];
    if (localDocument) entries.push({
      key: `${source.id}-document`,
      href: encodeURI(publicPath(`/documentos/${localDocument.archivo}`)),
      label,
    });
    if (source.urlOficial) entries.push({
      key: `${source.id}-official`,
      href: source.urlOficial,
      label: localDocument ? `${label} · fuente oficial` : label,
    });
    for (const link of source.enlacesAdicionales ?? []) entries.push({ key: `${source.id}-${link.url}`, href: link.url, label: link.titulo });
    return entries;
  });

  const pending = sources.filter((source) => source.consultaPendiente);
  if (!links.length && !pending.length) return null;
  return <section className={className} aria-label="Fuentes jurídicas">
    <strong>Fuentes jurídicas ({sources.length})</strong>
    <div>{links.map((link) => <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer">{link.label} <span aria-hidden="true">↗</span></a>)}</div>
    {pending.map((source) => <p key={source.id}>{source.nombre}: {documentForSource(source.id) ? "publicación oficial" : "documento"} pendiente de localizar. {source.consultaPendiente}</p>)}
  </section>;
}
