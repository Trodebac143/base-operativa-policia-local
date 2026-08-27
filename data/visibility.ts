/**
 * Barrera común de presentación: los identificadores y las instrucciones de
 * mantenimiento pueden existir en los datos, pero nunca llegan al visor del agente.
 */
export const internalInterfacePatterns = [
  /\bAN-(?:OP|JUR|SRC)-[A-Z0-9-]+\b/i,
  /\bGEN-(?:JUR|PEN|OP)-[A-Z0-9-]+\b/i,
  /\bCP-[A-Z0-9-]+\b/i,
  /\bTR-(?:ITV|MED)-(?:OP|FJ|SRC|CO|R|AD|ITV|WARN|EXT|IMMOB|REMOVE|DEPOSIT|CHECK)-[A-Z0-9-]+\b/i,
  /\bdatasets?\b/i,
  /\bcambiar de rama\b/i,
  /\bpasa(?:r)? a la rama\b/i,
  /\bno mantener (?:este caso|[^.]*como encaje principal)\b/i,
  /\busar (?:el )?caso\b/i,
] as const;

export const containsInternalInterfaceLanguage = (value: string) =>
  internalInterfacePatterns.some((pattern) => pattern.test(value));

export const visibleTextList = (values: string[]) =>
  values.filter((value) => !containsInternalInterfaceLanguage(value));
