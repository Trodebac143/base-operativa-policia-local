import type { Category } from "./types";
export const categories: Category[] = [
  { id: "animales_identificacion", modulo: "animales", nombre: "Identificación y registro", descripcion: "Identificación obligatoria y registros", orden: 10, activo: true },
  { id: "animales_ppp", modulo: "animales", nombre: "Perros potencialmente peligrosos", descripcion: "Licencia y medidas de seguridad", orden: 20, activo: true },
  { id: "animales_sanidad", modulo: "animales", nombre: "Sanidad", descripcion: "Control y obligaciones sanitarias", orden: 30, activo: true },
  { id: "animales_abandono", modulo: "animales", nombre: "Abandono", descripcion: "Animales abandonados o desatendidos", orden: 40, activo: true },
];
