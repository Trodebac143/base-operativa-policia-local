import type { OperationalCase } from "./types";
import animalsJson from "../contenido/animales/casos.json";
import { auditOperationalWarnings } from "./warnings";
import { auditAmbiguousPenalMessages, auditPenalBranches } from "./penal";
import { itvCases } from "./itv";
import { seguroCases } from "./seguro";
import { permisosCases } from "./permisos";

/**
 * Composición técnica de los casos publicados.
 * Para mantener datos, editar exclusivamente los JSON de contenido/.
 */
export const animalCases = animalsJson as OperationalCase[];
export const cases = [...animalCases, ...itvCases, ...seguroCases, ...permisosCases];
export const warningsPendingReview = auditOperationalWarnings(cases);
export const penalMessagesPendingReview = auditAmbiguousPenalMessages(cases);
export const penalBranchStatus = auditPenalBranches(cases);
