import { rawCases } from "./case-catalog";
import { auditOperationalWarnings } from "./warnings";
import { auditAmbiguousPenalMessages, auditPenalBranches } from "./penal";
import { itvCases } from "./itv";
import { seguroCases } from "./seguro";
import { permisosCases } from "./permisos";

/**
 * Composición técnica de los casos publicados.
 * Para mantener datos, editar exclusivamente los JSON de contenido/.
 */
export const animalCases = rawCases.filter((item) => item.modulo === "animales");
export const cases = [...animalCases, ...itvCases, ...seguroCases, ...permisosCases];
export const warningsPendingReview = auditOperationalWarnings(cases);
export const penalMessagesPendingReview = auditAmbiguousPenalMessages(cases);
export const penalBranchStatus = auditPenalBranches(cases);
