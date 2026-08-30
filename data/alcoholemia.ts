import alcoholemiaJson from "../contenido/seguridad_vial/alcoholemia.json";

export type AlcoholemiaMode = "servicio_periodica" | "puesta_servicio_o_post_reparacion";
export type VehicleType = "motor_ciclomotor" | "bicicleta_epac" | "vmp" | "clasificacion_pendiente";
export type DriverType = "general" | "profesional" | "novel" | "menor";
type DecimalValue = { num: bigint; den: bigint };
type EmpRule = { desde?: string; desde_exclusive?: string; hasta_inclusive?: string; tipo: "absoluto" | "porcentaje" | "formula"; valor?: string; formula?: string };
type AdministrativeRule = { rango?: string; condicion?: string; opcion: string; importe: number; reducido: number; puntos_si_vehiculo_exige_permiso?: number; puntos?: number };
type AlcoholemiaContent = {
  titulo: string;
  subtitulo: string;
  tabla_limites: Array<{ tipo: string; limite_mg_l: string | null; texto: string; detalle?: string; comparador?: string }>;
  emp: { nombre_ui: string; unidad: string; modo_por_defecto: AlcoholemiaMode; modos: Record<AlcoholemiaMode, { etiqueta: string; reglas: EmpRule[] }>; aviso: string };
  tabla_rapida_servicio_periodica: Array<{ lectura: string; corregido?: string; corregido_exact?: string; corregido_penal_2_dec?: string; zona: string; color: string; uso: string }>;
  resultado_operativo_agrupado: Array<{ id: string; titulo: string; color: string; regla: string; advertencia?: string; incluye?: string; actuacion?: string[] }>;
  practica_pruebas: { segunda_prueba: string; intervalo: string; derechos: string[]; diligencias: string[] };
  medidas_vehiculo: { regla: string; referencia: string; especifica_rgc_25: string[] };
  fuentes_juridicas_validadas: Array<{ id: string; nombre: string; preceptos: string[]; uso: string }>;
  tabla_sancion_administrativa: { regla_general: string; multa_base_euros: number; multa_agravada_euros: number; multa_agravada_cuando: string[]; puntos: { general: Array<{ rango: string; puntos: number }>; profesional_novel: Array<{ rango: string; puntos: number }>; menor: { regla: string; implementacion_v1: string } } };
  selector_vehiculo: { titulo: string; ubicacion: string; opciones: Array<{ id: VehicleType; label: string; descripcion: string }>; advertencia_vmp: string };
  limites_por_vehiculo: { motor_ciclomotor: { adulto_general: string; profesional_novel: string; menor: string; penal_posible: boolean; puntos_posibles: boolean }; bicicleta_epac: { adulto: string; menor: string; profesional_novel_no_aplica: boolean; penal_posible: boolean; puntos: number }; vmp: { adulto: string; menor: string; profesional_novel_no_aplica: boolean; penal_posible: boolean; puntos: number } };
  salida_administrativa_v2_consolidada: { titulo: string; codificados: { general: AdministrativeRule[]; profesional_novel: AdministrativeRule[]; menor_tramo_cero: AdministrativeRule[]; negativa_administrativa_no_motor: AdministrativeRule & { tipificacion: string; puntos_bicicleta_epac_vmp: number; responsable: string } } };
  regla_puntos: { formula: string; fundamento: string; ui: string };
  regla_antecedente: { pregunta: string; efecto: string; prioridad: string };
  fuentes_v3: Array<{ id: string; nombre: string; preceptos: string[]; uso: string }>;
};

export const alcoholemia = alcoholemiaJson as AlcoholemiaContent;

function decimal(value: string | number): DecimalValue {
  const raw = String(value).trim().replace(",", ".");
  if (!/^\+?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)) throw new Error("La lectura debe ser un número no negativo.");
  const unsigned = raw.replace(/^\+/, "");
  const [whole, fraction = ""] = unsigned.split(".");
  return { num: BigInt(`${whole}${fraction}` || "0"), den: 10n ** BigInt(fraction.length) };
}

function simplify(value: DecimalValue): DecimalValue {
  if (value.num === 0n) return { num: 0n, den: 1n };
  let num = value.num; let den = value.den;
  while (den % 10n === 0n && num % 10n === 0n) { num /= 10n; den /= 10n; }
  return { num, den };
}

function subtract(left: DecimalValue, right: DecimalValue): DecimalValue { return simplify({ num: left.num * right.den - right.num * left.den, den: left.den * right.den }); }
function multiply(left: DecimalValue, right: DecimalValue): DecimalValue { return simplify({ num: left.num * right.num, den: left.den * right.den }); }
function compare(left: DecimalValue, right: DecimalValue): number { const result = left.num * right.den - right.num * left.den; return result < 0n ? -1 : result > 0n ? 1 : 0; }
function maxZero(value: DecimalValue): DecimalValue { return value.num < 0n ? { num: 0n, den: 1n } : value; }

function roundTo(value: DecimalValue, places: number): string {
  const factor = 10n ** BigInt(places); const scaled = value.num * factor; const whole = scaled / value.den; const remainder = scaled % value.den;
  const rounded = remainder * 2n >= value.den ? whole + 1n : whole;
  const raw = rounded.toString().padStart(places + 1, "0");
  return `${raw.slice(0, -places)}.${raw.slice(-places)}`;
}

function exactString(value: DecimalValue): string {
  let scale = 0; let denominator = value.den;
  while (denominator % 2n === 0n) { denominator /= 2n; scale++; }
  while (denominator % 5n === 0n) { denominator /= 5n; scale++; }
  if (denominator !== 1n) throw new Error("Resultado decimal no terminante.");
  const scaled = value.num * (10n ** BigInt(scale)) / value.den;
  const raw = scaled.toString().padStart(scale + 1, "0");
  if (scale === 0) return raw;
  return `${raw.slice(0, -scale)}.${raw.slice(-scale)}`.replace(/\.0+$/, "").replace(/(\.[0-9]*?)0+$/, "$1");
}

function ruleFor(reading: DecimalValue, mode: AlcoholemiaMode): EmpRule {
  const rules = alcoholemia.emp.modos[mode].reglas;
  const found = rules.find((rule) => {
    const lower = rule.desde_exclusive ? compare(reading, decimal(rule.desde_exclusive)) > 0 : rule.desde ? compare(reading, decimal(rule.desde)) >= 0 : true;
    const upper = rule.hasta_inclusive ? compare(reading, decimal(rule.hasta_inclusive)) <= 0 : true;
    return lower && upper;
  });
  if (!found) throw new Error("No hay una regla EMP aplicable a esa lectura.");
  return found;
}

function empFor(reading: DecimalValue, rule: EmpRule): DecimalValue {
  if (rule.tipo === "absoluto") return decimal(rule.valor ?? "0");
  if (rule.tipo === "porcentaje") { const percentage = multiply(reading, decimal(rule.valor ?? "0")); return simplify({ num: percentage.num, den: percentage.den * 100n }); }
  if (rule.formula === "3*lectura/4 - 1.35") return maxZero(subtract({ num: reading.num * 3n, den: reading.den * 4n }, decimal("1.35")));
  if (rule.formula === "lectura/2 - 0.9") return maxZero(subtract({ num: reading.num, den: reading.den * 2n }, decimal("0.9")));
  throw new Error("Fórmula EMP no reconocida.");
}

export type AlcoholemiaCalculation = {
  lectura_exacta: string;
  emp_exacto: string;
  emp_mostrado: string;
  valor_corregido_exact: string;
  valor_corregido_mostrado: string;
  valor_penal_2_dec: string;
  supera_umbral_penal: boolean;
  modo: AlcoholemiaMode;
  etiqueta_modo: string;
  resultado_operativo: string;
  tono: "verde" | "ambar" | "naranja" | "rojo_suave" | "rojo";
};

export function calculateAlcoholemia(input: string | number, mode: AlcoholemiaMode = alcoholemia.emp.modo_por_defecto): AlcoholemiaCalculation {
  const reading = decimal(input); const rule = ruleFor(reading, mode); const emp = empFor(reading, rule); const corrected = maxZero(subtract(reading, emp));
  const penalTwoDecimals = roundTo(corrected, 2); const supera = compare(decimal(penalTwoDecimals), decimal("0.60")) > 0;
  let resultado_operativo = "Comparar el valor corregido con el límite del tipo de conductor."; let tono: AlcoholemiaCalculation["tono"] = "verde";
  if (supera) { resultado_operativo = "Vía penal preferente por tasa objetiva: supera 0,60 mg/L tras EMP."; tono = "rojo"; }
  else if (compare(decimal(penalTwoDecimals), decimal("0.60")) === 0) { resultado_operativo = "No supera 0,60 mg/L a efectos del tipo penal objetivo por tasa; valorar influencia."; tono = "rojo_suave"; }
  else if (compare(corrected, decimal("0.50")) > 0) { resultado_operativo = "Tramo administrativo agravado / especial atención; valorar también signos y contexto."; tono = "naranja"; }
  else if (compare(corrected, decimal("0.15")) > 0) { resultado_operativo = "Puede superar el límite profesional/novel; comprobar el tipo de conductor."; tono = "ambar"; }
  return { lectura_exacta: exactString(reading), emp_exacto: exactString(emp), emp_mostrado: roundTo(emp, 2), valor_corregido_exact: exactString(corrected), valor_corregido_mostrado: roundTo(corrected, 2), valor_penal_2_dec: penalTwoDecimals, supera_umbral_penal: supera, modo: mode, etiqueta_modo: alcoholemia.emp.modos[mode].etiqueta, resultado_operativo, tono };
}

export function formatMg(value: string): string { return value.replace(".", ","); }

export type AdministrativeFinding = {
  precepto: string;
  tipificacion: string;
  codificado: string;
  hecho: string;
  importe: number;
  reducido: number;
  puntos: number;
  puntos_nota?: string;
  responsable: string;
  suspendida: boolean;
};

export type AlcoholemiaOutcome = {
  kind: "sin_superacion" | "administrativa" | "penal_tasa" | "penal_negativa" | "clasificacion_pendiente" | "sin_lectura";
  titulo: string;
  via: string;
  tono: "verde" | "ambar" | "naranja" | "rojo";
  limite_mg_l?: string;
  mensaje: string;
  articulo_penal?: string;
  administracion?: AdministrativeFinding;
  influencia_nota?: string;
};

function isNonMotor(vehicle: VehicleType): vehicle is "bicicleta_epac" | "vmp" { return vehicle === "bicicleta_epac" || vehicle === "vmp"; }

export function getAlcoholemiaLimit(vehicle: VehicleType, driver: DriverType): string | null {
  if (vehicle === "clasificacion_pendiente") return null;
  if (vehicle === "motor_ciclomotor") return driver === "menor" ? alcoholemia.limites_por_vehiculo.motor_ciclomotor.menor : driver === "general" ? alcoholemia.limites_por_vehiculo.motor_ciclomotor.adulto_general : alcoholemia.limites_por_vehiculo.motor_ciclomotor.profesional_novel;
  return driver === "menor" ? alcoholemia.limites_por_vehiculo[vehicle].menor : alcoholemia.limites_por_vehiculo[vehicle].adulto;
}

function findRule(group: AdministrativeRule[], predicate: (rule: AdministrativeRule) => boolean): AdministrativeRule {
  const found = group.find(predicate);
  if (!found) throw new Error("No hay una salida administrativa validada para ese tramo.");
  return found;
}

function administrativeFinding(calculation: AlcoholemiaCalculation, vehicle: VehicleType, driver: DriverType, previousSanction: boolean): AdministrativeFinding {
  const corrected = decimal(calculation.valor_corregido_exact); const quarter = decimal("0.25"); const half = decimal("0.50");
  const config = alcoholemia.salida_administrativa_v2_consolidada.codificados;
  let rule: AdministrativeRule; let precepto = "RGC art. 20.1"; let tipificacion = "Infracción muy grave por conducir con tasa superior a la permitida.";
  const minorZeroBand = driver === "menor" && compare(corrected, quarter) <= 0;
  if (minorZeroBand) { rule = findRule(config.menor_tramo_cero, (entry) => entry.opcion.endsWith(previousSanction ? "5C" : "5B")); precepto = "LSV art. 14.1"; tipificacion = "Infracción muy grave por conducir con tasa superior a 0,00 mg/L."; }
  else if (vehicle === "motor_ciclomotor" && (driver === "profesional" || driver === "novel")) {
    precepto = "RGC art. 20.2";
    rule = compare(corrected, decimal("0.30")) > 0 ? findRule(config.profesional_novel, (entry) => entry.opcion.endsWith("5K")) : findRule(config.profesional_novel, (entry) => entry.opcion.endsWith(previousSanction ? "5Ñ" : "5G"));
  } else rule = compare(corrected, half) > 0 ? findRule(config.general, (entry) => entry.opcion.endsWith("5I")) : findRule(config.general, (entry) => entry.opcion.endsWith(previousSanction ? "5M" : "5E"));
  const points = isNonMotor(vehicle) ? 0 : rule.puntos_si_vehiculo_exige_permiso ?? rule.puntos ?? 0;
  return { precepto, tipificacion, codificado: rule.opcion, hecho: minorZeroBand ? `Conducir el vehículo reseñado con una tasa corregida de ${formatMg(calculation.valor_corregido_mostrado)} mg/L, superior al límite de 0,00 mg/L.` : `Conducir el vehículo reseñado con una tasa corregida de ${formatMg(calculation.valor_corregido_mostrado)} mg/L, superior al límite permitido de ${formatMg(getAlcoholemiaLimit(vehicle, driver) ?? "0.25")} mg/L.`, importe: rule.importe, reducido: rule.reducido, puntos: points, puntos_nota: isNonMotor(vehicle) ? alcoholemia.regla_puntos.ui : undefined, responsable: "Conductor", suspendida: false };
}

export function resolveAlcoholemiaOutcome({ calculation, vehicle, driver, previousSanction, negative }: { calculation: AlcoholemiaCalculation | null; vehicle: VehicleType; driver: DriverType; previousSanction: boolean; negative: boolean }): AlcoholemiaOutcome {
  if (vehicle === "clasificacion_pendiente") return { kind: "clasificacion_pendiente", titulo: "CLASIFICACIÓN DEL VEHÍCULO NECESARIA", via: "Clasificación pendiente", tono: "ambar", mensaje: "Determina primero si el aparato es VMP/bicicleta/EPAC o vehículo a motor/ciclomotor. La vía jurídica cambia según esa clasificación." };
  if (negative) {
    if (vehicle === "motor_ciclomotor") return { kind: "penal_negativa", titulo: "NEGATIVA A LAS PRUEBAS", via: "Vía penal preferente", tono: "rojo", limite_mg_l: getAlcoholemiaLimit(vehicle, driver) ?? undefined, articulo_penal: "Art. 383 CP", mensaje: "Negativa a las pruebas legalmente establecidas, incluida la segunda medición cuando sea legalmente exigida." };
    const finding = alcoholemia.salida_administrativa_v2_consolidada.codificados.negativa_administrativa_no_motor;
    return { kind: "administrativa", titulo: alcoholemia.salida_administrativa_v2_consolidada.titulo, via: "Vía administrativa", tono: "ambar", limite_mg_l: getAlcoholemiaLimit(vehicle, driver) ?? undefined, mensaje: "Negativa a las pruebas en vehículo que no exige permiso o licencia de conducción.", administracion: { precepto: "LSV art. 77.d", tipificacion: finding.tipificacion, codificado: finding.opcion, hecho: "Negarse a someterse a las pruebas legalmente establecidas.", importe: finding.importe, reducido: finding.reducido, puntos: 0, puntos_nota: alcoholemia.regla_puntos.ui, responsable: finding.responsable, suspendida: false } };
  }
  if (!calculation) return { kind: "sin_lectura", titulo: "RESULTADO OPERATIVO", via: "Pendiente de lectura", tono: "verde", mensaje: "Introduce una lectura válida para resolver el resultado." };
  const limit = getAlcoholemiaLimit(vehicle, driver); if (!limit) return { kind: "clasificacion_pendiente", titulo: "CLASIFICACIÓN DEL VEHÍCULO NECESARIA", via: "Clasificación pendiente", tono: "ambar", mensaje: "Determina primero la clasificación técnica del aparato." };
  const corrected = decimal(calculation.valor_corregido_exact); const exceeds = compare(corrected, decimal(limit)) > 0; const admin = exceeds ? administrativeFinding(calculation, vehicle, driver, previousSanction) : undefined;
  if (!exceeds) return { kind: "sin_superacion", titulo: "SIN SUPERACIÓN DE TASA", via: "Dentro del límite", tono: "verde", limite_mg_l: limit, mensaje: `La tasa corregida de ${formatMg(calculation.valor_corregido_mostrado)} mg/L no supera el límite aplicable de ${formatMg(limit)} mg/L.`, influencia_nota: vehicle === "motor_ciclomotor" ? "La tasa no excluye por sí sola la valoración de signos de influencia." : undefined };
  const tone = compare(corrected, decimal("0.50")) > 0 ? "naranja" : "ambar";
  if (vehicle === "motor_ciclomotor" && calculation.supera_umbral_penal) return { kind: "penal_tasa", titulo: "VÍA PENAL PREFERENTE", via: "Art. 379.2 CP · tasa objetiva", tono: "rojo", limite_mg_l: limit, mensaje: `El valor penal corregido de ${formatMg(calculation.valor_penal_2_dec)} mg/L supera 0,60 mg/L.`, articulo_penal: "Art. 379.2 CP", administracion: { ...admin!, suspendida: true }, influencia_nota: "La conducción bajo la influencia se valora además por signos y demás elementos probatorios." };
  return { kind: "administrativa", titulo: alcoholemia.salida_administrativa_v2_consolidada.titulo, via: "Vía administrativa", tono: tone, limite_mg_l: limit, mensaje: `La tasa corregida de ${formatMg(calculation.valor_corregido_mostrado)} mg/L supera el límite aplicable de ${formatMg(limit)} mg/L.`, administracion: admin, influencia_nota: vehicle === "motor_ciclomotor" ? "La cifra no decide por sí sola la influencia: documenta signos y demás elementos objetivos." : undefined };
}
