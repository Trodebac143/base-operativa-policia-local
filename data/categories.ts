import type { Category } from "./types";
import validatedPackage from "./paquete_animales_v0_2_validado.json";

export const categories: Category[] = [
  ...(validatedPackage.categorias as Category[]),
  { id: "seguridad_vial_itv", modulo: "seguridad_vial", nombre: "Inspección técnica de vehículos (ITV)", descripcion: "Estado ITV, segunda inspección, circulación y medidas policiales", orden: 10, activo: true },
  { id: "seguridad_vial_seguro", modulo: "seguridad_vial", nombre: "Seguro obligatorio", descripcion: "Sujeción, seguro en vigor, VMP/VPL y medidas policiales", orden: 20, activo: true },
];
