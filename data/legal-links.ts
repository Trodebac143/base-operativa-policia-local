/** Enlaces a preceptos, sin interpretar el texto como una calificación nueva. */
export function legalArticleLinks(normas: string[]) {
  const links = new Map<string, string>();
  for (const norma of normas) {
    const law = /LO 5\/2000/.test(norma) ? "BOE-A-2000-641" : /4\/2015/.test(norma) ? "BOE-A-2015-3442" : /LECrim/.test(norma) ? "BOE-A-1882-6036" : /CP|Código Penal/.test(norma) ? "BOE-A-1995-25444" : undefined;
    const articles = norma.match(/arts?\.\s*(.*)/i)?.[1];
    if (!law || !articles) continue;
    for (const match of articles.matchAll(/\b(\d{1,3})(?:\.\d+)*(?:\s+(bis|ter))?\b/g)) {
      const article = match[1] + (match[2] ?? "");
      const url = `https://www.boe.es/buscar/act.php?id=${law}#a${article}`;
      links.set(url, `BOE · ${norma.split(" · ")[0]} · art. ${match[1]}${match[2] ? " " + match[2] : ""}`);
    }
  }
  return [...links].map(([url, label]) => ({ url, label }));
}
