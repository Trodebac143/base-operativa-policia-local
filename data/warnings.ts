import type { OperationalCase } from "./types";
import { containsInternalInterfaceLanguage } from "./visibility";

export const warningReplacements: Record<string, string[]> = {
  "AN-OP-002": ["Esta ficha solo se utiliza para la falta de censo municipal. Si el problema es la ausencia de identificación física (chip) o de inscripción registral, utiliza la ficha específica correspondiente."],
  "AN-OP-003": [
    "Que la persona no lleve consigo la licencia no demuestra que carezca de ella. Comprueba su existencia y vigencia antes de denunciar por «PPP sin licencia».",
    "La falta de exhibición de la licencia no determina por sí sola la retirada del animal."
  ],
  "AN-OP-006": ["Comprueba también la correa: debe ser no extensible y de menos de 2 metros. Si además incumple esta obligación, describe por separado la falta de bozal y la sujeción incorrecta."],
  "AN-OP-007": ["Si concurren falta de bozal y sujeción incorrecta, describe cada incumplimiento por separado en el acta. No dupliques una misma conducta bajo dos conceptos."],
  "AN-OP-010": ["Antes de denunciar, confirma en la documentación sanitaria que la vacunación antirrábica era obligatoria para ese animal y que no estaba vigente o no se había realizado. Si no puedes acreditar ambos extremos, no cierres la actuación con esta ficha."],
  "AN-OP-012": ["Si el abandono ha causado muerte, daños irreversibles o lesiones invalidantes, no mantengas la calificación base de grave: aplica el escenario condicional de infracción muy grave y su rango legal de 9.001 a 45.000 €."],
  "AN-OP-013": [],
  "AN-OP-014": [
    "Si el perro es PPP, no uses esta ficha: selecciona la rama PPP.",
    "Esta ficha cubre al perro ordinario completamente suelto. Si el animal va sujeto y la duda es únicamente la longitud o el tipo de correa, no denuncies por el art. 65.4 con esta ficha."
  ],
  "AN-OP-015": [
    "Solo utiliza esta ficha si existe una prohibición expresa aplicable y visible; no basta con que el establecimiento sea de un determinado tipo.",
    "Antes de denunciar, comprueba si existe una excepción legal. Si se trata de un perro de asistencia amparado por su régimen específico, no uses esta ficha por el mero acceso del animal."
  ],
  "AN-OP-016": [
    "Esta ficha se utiliza únicamente cuando las deficiencias higiénicas, olores o molestias no han causado una afectación grave al animal.",
    "Comprueba el estado físico y conductual del animal. Si presenta lesiones, enfermedad, deterioro relevante o signos compatibles con maltrato grave, no cierres la actuación con esta ficha.",
    "Si existen esos signos, documenta detalladamente el estado del animal, solicita valoración veterinaria cuando sea necesaria para acreditar lesiones, sufrimiento o estado sanitario y activa la actuación por protección o maltrato animal para determinar el encaje administrativo y la posible vía penal."
  ],
  "AN-OP-018": [
    "Animal identificado y extravío no comunicado al registro: art. 42.2.e.",
    "Animal no identificado o no incluido en el registro y extravío/pérdida no comunicado a la autoridad competente: art. 42.2.f.",
    "Si se trata de una sustracción, no uses automáticamente los arts. 42.2.e o 42.2.f. Utiliza el art. 42.2.t en relación con el art. 6.2.b únicamente cuando hayas comprobado que no existe otro tipo específico aplicable.",
    "La desaparición del animal no equivale por sí sola a abandono. Utiliza la ficha de abandono únicamente cuando existan hechos propios de abandono."
  ],
  "AN-OP-019": [
    "Para aplicar esta ficha debe existir un requerimiento concreto de documentación obligatoria. Deja constancia del documento solicitado y de la respuesta.",
    "No confundas falta de exhibición física con inexistencia de la documentación cuando pueda comprobarse por otros medios.",
    "Si el animal es PPP, consulta primero la rama PPP. No utilices esta ficha para sustituir una infracción PPP específica."
  ]
};

export const operationalWarningPolicy = {
  nombre: "Criterio de claridad operativa",
  aplicaA: "todos los módulos y todos los casos futuros",
  principio: "Una advertencia visible debe indicar al agente qué condición comprobar y qué acción concreta realizar. No debe trasladar al visor notas internas de mantenimiento jurídico.",
  expressionsToReview: ["valorar normativa", "valorar la especialidad", "cuando proceda", "en su caso", "en lo compatible", "según normativa vigente", "sujeción reglamentaria", "regímenes especiales", "con cautela", "evitar duplicidades", "aplicación condicionada"]
} as const;

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const conditionPattern = /\b(si|antes de|cuando|solo|para aplicar|que|debe|existe|concurren|puede)\b/i;
const actionPattern = /\b(comprueba|confirma|documenta|describe|utiliza|usa|uses|aplica|activa|pasa|consulta|selecciona|denuncia|denuncies|cierres|deja|confundas|dupliques|mantengas|acredita|determina)\b/i;

export type WarningReviewFinding = { caseId: string; warning: string; expression: string };

export function auditOperationalWarnings(items: OperationalCase[]): WarningReviewFinding[] {
  return items.flatMap((item) => item.advertencias.flatMap((warning) => {
    const normalized = normalize(warning);
    const expression = operationalWarningPolicy.expressionsToReview.find((candidate) => normalized.includes(normalize(candidate)));
    if (!expression || (conditionPattern.test(normalized) && actionPattern.test(normalized))) return [];
    return [{ caseId: item.id, warning, expression }];
  }));
}

export function applyWarningReplacements(items: OperationalCase[]): OperationalCase[] {
  return items.map((item) => Object.hasOwn(warningReplacements, item.id) ? { ...item, advertencias: [...warningReplacements[item.id]] } : item);
}

export function visibleOperationalWarnings(item: OperationalCase): string[] {
  const conditionalFit = item.datos_adicionales?.encaje_condicional;
  const conditionalClassification = item.datos_adicionales?.calificacion_condicional;
  return item.advertencias.filter((warning) => {
    const normalized = normalize(warning);
    if (containsInternalInterfaceLanguage(warning)) return false;
    if (conditionalFit?.some((entry) => normalized.includes(normalize(entry.articulo.split(" ")[0])))) return false;
    if (conditionalClassification && normalized.includes(normalize(conditionalClassification.calificacion))) return false;
    return true;
  });
}
