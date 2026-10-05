/** Arts. 13 y 33 CP. Se analiza la pena legal en abstracto, nunca la solicitada o impuesta. */
export type GravedadPenal = "DELITO LEVE" | "DELITO MENOS GRAVE" | "DELITO GRAVE";
export type DuracionPenal = { unidad: "dias" | "meses" | "anios"; valor: number; diasAdicionales?: number };
type PenaTemporal = "prision" | "multa" | "tbc" | "conduccion" | "armas" | "residencia" | "aproximacion" | "comunicacion" | "inhabilitacion_especial" | "suspension" | "animales" | "localizacion";
export type PenaAbstracta =
  | { tipo: PenaTemporal; minimo: DuracionPenal; maximo: DuracionPenal }
  | { tipo: "prision_permanente_revisable" | "inhabilitacion_absoluta" | "privacion_patria_potestad" | "persona_juridica" }
  | { tipo: "multa_proporcional"; baseEconomica?: string; factorMinimo?: number; factorMaximo?: number }
  | { tipo: "responsabilidad_subsidiaria"; multa: PenaAbstracta };
export type RegimenPenas =
  | { tipo: "pena"; pena: PenaAbstracta }
  | { tipo: "conjuntas" | "alternativas"; penas: RegimenPenas[] }
  | { tipo: "superior_grado" | "mitad_superior"; base: RegimenPenas }
  | { tipo: "pendiente" | "accesoria" };

const leve: GravedadPenal = "DELITO LEVE";
const menosGrave: GravedadPenal = "DELITO MENOS GRAVE";
const grave: GravedadPenal = "DELITO GRAVE";

function validDuration(d: DuracionPenal) {
  return !!d && ["dias", "meses", "anios"].includes(d.unidad) && Number.isSafeInteger(d.valor) && d.valor > 0 &&
    Number.isSafeInteger(d.diasAdicionales ?? 0) && (d.diasAdicionales ?? 0) >= 0 && (d.diasAdicionales ?? 0) < 30 &&
    (d.unidad !== "dias" || !d.diasAdicionales);
}

/** Meses/años exactos y resto de días: no redondear ni convertir un mes calendario en 30 días. */
function monthsAndDays(d: DuracionPenal): [number, number] | undefined {
  if (d.unidad === "dias") return d.valor < 30 ? [0, d.valor] : undefined;
  const months = d.valor * (d.unidad === "anios" ? 12 : 1);
  return Number.isSafeInteger(months) ? [months, d.diasAdicionales ?? 0] : undefined;
}
const compare = (a: [number, number], b: [number, number]) => a[0] - b[0] || a[1] - b[1];

/** Devuelve undefined ante datos incompletos, duraciones no comparables o penas fuera del art. 33. */
export function clasificarPenaAbstracta(pena: PenaAbstracta): GravedadPenal | undefined {
  if (["prision_permanente_revisable", "inhabilitacion_absoluta", "privacion_patria_potestad", "persona_juridica"].includes(pena.tipo)) return grave;
  if (pena.tipo === "multa_proporcional") return menosGrave;
  if (pena.tipo === "responsabilidad_subsidiaria") {
    if (!["multa", "multa_proporcional"].includes(pena.multa.tipo)) return undefined;
    return clasificarPenaAbstracta(pena.multa);
  }
  if (!("minimo" in pena) || !validDuration(pena.minimo) || !validDuration(pena.maximo)) return undefined;
  if (pena.tipo === "multa") {
    // Conversión prevista expresamente SOLO para la multa por el art. 50.4 CP.
    const days = (d: DuracionPenal) => d.valor * (d.unidad === "anios" ? 360 : d.unidad === "meses" ? 30 : 1) + (d.diasAdicionales ?? 0);
    const min = days(pena.minimo), max = days(pena.maximo);
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || min > max) return undefined;
    return min <= 90 ? leve : menosGrave;
  }
  if (pena.tipo === "tbc") {
    // El extremo legal de un año se expresa en años/meses. 365 días siempre cabe
    // en un año; 366 necesita contexto calendario y queda sin resolver. Esta es
    // una restricción de representación, no una equivalencia fija año = 365 días.
    const maxIsYear = (pena.maximo.unidad === "anios" && pena.maximo.valor === 1 || pena.maximo.unidad === "meses" && pena.maximo.valor === 12) && !pena.maximo.diasAdicionales;
    if (maxIsYear) {
      if (pena.minimo.unidad === "dias" && pena.minimo.valor <= 30) return leve;
      if (pena.minimo.unidad === "dias" && pena.minimo.valor <= 365) return menosGrave;
      if ((pena.minimo.unidad === "anios" && pena.minimo.valor === 1 || pena.minimo.unidad === "meses" && pena.minimo.valor === 12) && !pena.minimo.diasAdicionales) return menosGrave;
      return undefined;
    }
    if (pena.minimo.unidad !== "dias" || pena.maximo.unidad !== "dias" || pena.minimo.valor > pena.maximo.valor || pena.maximo.valor > 365) return undefined;
    // Un intervalo que incluye 30 días es leve por el art. 13.4, aunque también incluya 31.
    return pena.minimo.valor <= 30 ? leve : menosGrave;
  }
  if (pena.tipo === "localizacion" && pena.minimo.unidad === "dias" && pena.maximo.unidad === "dias") {
    return pena.minimo.valor <= pena.maximo.valor && pena.maximo.valor <= 30 ? leve : undefined;
  }
  const min = monthsAndDays(pena.minimo), max = monthsAndDays(pena.maximo);
  if (!min || !max || compare(min, max) > 0) return undefined;
  if (pena.tipo === "localizacion") return compare(min, [0, 1]) >= 0 && compare(max, [3, 0]) <= 0 ? leve : undefined;
  if (["prision", "inhabilitacion_especial", "suspension"].includes(pena.tipo)) {
    if (pena.tipo === "prision" && compare(min, [3, 0]) < 0) return undefined;
    return compare(max, [60, 0]) > 0 ? grave : menosGrave;
  }
  if (["conduccion", "armas", "animales"].includes(pena.tipo)) {
    if (compare(min, [3, 0]) < 0) return undefined;
    const graveFrom = pena.tipo === "animales" ? 60 : 96;
    if (compare(max, [graveFrom, 0]) > 0) return grave;
    return compare(min, [12, 0]) <= 0 ? leve : menosGrave;
  }
  if (["residencia", "aproximacion", "comunicacion"].includes(pena.tipo)) {
    if (pena.tipo !== "residencia" && compare(min, [1, 0]) < 0) return undefined;
    if (compare(max, [60, 0]) > 0) return grave;
    return compare(min, [6, 0]) < 0 ? leve : menosGrave;
  }
  return undefined;
}

/** Circular FGE 1/2015, §3.3: aplicar 13.4 dentro de cada pena, después considerar TODAS. */
export function clasificarDelitoPorPenas(regimen: RegimenPenas): GravedadPenal | undefined {
  if (regimen.tipo === "pendiente" || regimen.tipo === "accesoria") return undefined;
  if (regimen.tipo === "superior_grado" || regimen.tipo === "mitad_superior") {
    const transformado = transformarMarcoPenal(regimen.base, regimen.tipo);
    if (transformado) return clasificarDelitoPorPenas(transformado);
    if (regimen.tipo === "mitad_superior") {
      if (regimen.base.tipo === "conjuntas" || regimen.base.tipo === "alternativas") return clasificarDelitoPorPenas({ tipo: regimen.base.tipo, penas: regimen.base.penas.map((base) => ({ tipo: "mitad_superior", base })) });
      // Para estas penas el art. 13.4 resuelve la frontera grave/menos grave
      // por el máximo, que la mitad superior conserva. No necesitamos convertir
      // una fracción de mes calendario en días para conocer la categoría.
      if (regimen.base.tipo === "pena" && ["prision", "inhabilitacion_especial", "suspension"].includes(regimen.base.pena.tipo)) return clasificarPenaAbstracta(regimen.base.pena);
    }
    return undefined;
  }
  if (regimen.tipo === "pena") return clasificarPenaAbstracta(regimen.pena);
  if (!("penas" in regimen)) return undefined;
  if (!regimen.penas.length) return undefined;
  const categories = regimen.penas.map(clasificarDelitoPorPenas);
  // No cerrar una clasificación con una rama sin determinar, aunque otra sea conocida.
  if (categories.some((category) => !category)) return undefined;
  return categories.includes(grave) ? grave : categories.includes(menosGrave) ? menosGrave : leve;
}

/** Arts. 70.1.1 y 70.2 CP. Solo se operan unidades exactas representables.
 * No existe equivalencia general mes=30 días: solo se usa para la multa (50.4).
 * Los grados inferiores facultativos del sentenciador no alteran el marco del tipo
 * consumado usado para su clasificación; tentativa se documenta por separado (62).
 */
export function transformarMarcoPenal(base: RegimenPenas, regla: "superior_grado" | "mitad_superior"): RegimenPenas | undefined {
  if (base.tipo === "conjuntas" || base.tipo === "alternativas") {
    const penas = base.penas.map((pena) => transformarMarcoPenal(pena, regla));
    return penas.every((pena): pena is RegimenPenas => Boolean(pena)) ? { tipo: base.tipo, penas } : undefined;
  }
  if (base.tipo === "superior_grado" || base.tipo === "mitad_superior") {
    const previo = transformarMarcoPenal(base.base, base.tipo);
    return previo ? transformarMarcoPenal(previo, regla) : undefined;
  }
  if (base.tipo !== "pena" || !("minimo" in base.pena)) return undefined;
  const { pena } = base;
  if (!("minimo" in pena) || !validDuration(pena.minimo) || !validDuration(pena.maximo)) return undefined;
  const min = pena.minimo, max = pena.maximo;
  // Multa: el día-multa es una unidad legal indivisible.
  if (pena.tipo === "multa") {
    const dias = (d: DuracionPenal) => d.valor * (d.unidad === "anios" ? 360 : d.unidad === "meses" ? 30 : 1) + (d.diasAdicionales ?? 0);
    const a = dias(min), b = dias(max);
    if (a > b) return undefined;
    const inferior = regla === "superior_grado" ? b + 1 : Math.floor((a + b) / 2) + 1;
    const superior = regla === "superior_grado" ? Math.min(Math.floor(b * 3 / 2), 900) : b;
    if (inferior > superior) return undefined;
    return { tipo: "pena", pena: { ...pena, minimo: { unidad: "dias", valor: inferior }, maximo: { unidad: "dias", valor: superior } } };
  }
  if (min.unidad === "dias" && max.unidad === "dias") {
    if (min.valor > max.valor) return undefined;
    const inferior = regla === "superior_grado" ? max.valor + 1 : Math.floor((min.valor + max.valor) / 2) + 1;
    const superior = regla === "superior_grado" ? Math.floor(max.valor * 3 / 2) : max.valor;
    return { tipo: "pena", pena: { ...pena, minimo: { unidad: "dias", valor: inferior }, maximo: { unidad: "dias", valor: superior } } };
  }
  const a = monthsAndDays(min), b = monthsAndDays(max);
  if (!a || !b || b[1] || (regla === "superior_grado" && a[1]) || compare(a, b) > 0) return undefined;
  const lowerMonths = regla === "superior_grado" ? b[0] : (a[0] + b[0]) / 2;
  const upperMonths = regla === "superior_grado" ? b[0] * 3 / 2 : b[0];
  // Una fracción de mes calendario no se sustituye por un número inventado de días.
  if (!Number.isSafeInteger(lowerMonths) || !Number.isSafeInteger(upperMonths)) return undefined;
  const limites: Partial<Record<PenaTemporal, number>> = { prision: 360, inhabilitacion_especial: 360, suspension: 96, conduccion: 180, armas: 240, residencia: 240, aproximacion: 240, comunicacion: 240 };
  const capped = regla === "superior_grado" ? Math.min(upperMonths, limites[pena.tipo] ?? upperMonths) : upperMonths;
  if (lowerMonths >= capped) return undefined;
  return { tipo: "pena", pena: { ...pena, minimo: { unidad: "meses", valor: lowerMonths, diasAdicionales: regla === "superior_grado" ? 1 : Math.floor((a[1] + b[1]) / 2) + 1 }, maximo: { unidad: "meses", valor: capped } } };
}

export const penaEnMeses = (tipo: PenaTemporal, minimo: number, maximo: number): RegimenPenas => ({
  tipo: "pena", pena: { tipo, minimo: { unidad: "meses", valor: minimo }, maximo: { unidad: "meses", valor: maximo } },
});
