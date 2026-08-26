import type { Rule } from "./types";
import validatedPackage from "./paquete_animales_v0_2_validado.json";

export const rules = validatedPackage.reglas as Rule[];
