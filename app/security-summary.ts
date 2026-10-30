/** Copia las respuestas presentes en el formulario, no todas sus alternativas. */
export function buildSecuritySummary(sheet: HTMLElement): string {
  const blocks = new Set(["ARTICLE", "HEADER", "SECTION", "FIELDSET", "LEGEND", "DIV", "P", "H2", "H3", "H4", "UL", "OL", "LI", "LABEL", "DETAILS", "SUMMARY"]);
  const read = (node: Node): string => {
    if (node.nodeType === 3) return node.textContent ?? "";
    if (node.nodeType !== 1) return "";
    const element = node as HTMLElement;
    if (["BUTTON", "SVG", "IMG", "SCRIPT", "STYLE"].includes(element.tagName) || element.hidden || element.getAttribute("aria-hidden") === "true") return "";
    const style = element.ownerDocument.defaultView?.getComputedStyle(element);
    if (style?.display === "none" || style?.visibility === "hidden") return "";
    if (element.tagName === "LABEL") {
      const control = element.querySelector<HTMLInputElement>('input[type="radio"], input[type="checkbox"]');
      if (control && !control.checked) return "";
    }
    if (element.tagName === "INPUT") {
      const input = element as HTMLInputElement;
      if (["radio", "checkbox"].includes(input.type)) return "";
      return input.value || "Dato pendiente";
    }
    if (element.tagName === "SELECT") {
      const select = element as HTMLSelectElement;
      return select.selectedOptions[0]?.textContent ?? "Dato pendiente";
    }
    if (element.tagName === "TEXTAREA") return (element as HTMLTextAreaElement).value || "Dato pendiente";
    if (element.tagName === "DETAILS" && !(element as HTMLDetailsElement).open) {
      const summary = element.querySelector("summary");
      return summary ? read(summary) : "";
    }
    const content = Array.from(element.childNodes).map(read).join("");
    if (element.tagName === "A") return `${content} (${(element as HTMLAnchorElement).href})`;
    return blocks.has(element.tagName) ? `\n${content}\n` : content;
  };
  return read(sheet).replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
