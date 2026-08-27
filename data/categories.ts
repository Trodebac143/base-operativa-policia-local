import type { Category } from "./types";
import validatedPackage from "./paquete_animales_v0_2_validado.json";

export const categories: Category[] = [
  ...(validatedPackage.categorias as Category[]),
  { id: "seguridad_vial_itv", modulo: "seguridad_vial", nombre: "Inspección técnica de vehículos (ITV)", descripcion: "Estado ITV, segunda inspección, circulación y medidas policiales", orden: 10, activo: true },
];
