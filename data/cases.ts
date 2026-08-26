import type { OperationalCase } from "./types";
import validatedPackage from "./paquete_animales_v0_2_validado.json";

export const cases = validatedPackage.casos as OperationalCase[];
