import type { Category } from "./types";
import validatedPackage from "./paquete_animales_v0_2_validado.json";

export const categories = validatedPackage.categorias as Category[];
