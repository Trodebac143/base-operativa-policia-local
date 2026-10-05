export type ConvivenciaTheme = "convivencia" | "limpieza" | "espacio-publico";

export type ConvivenciaGroup = {
  nombre: string;
  icono: string;
  tema: ConvivenciaTheme;
  secciones?: { nombre: string; casos: string[] }[];
};

export const convivenciaGroups: ConvivenciaGroup[] = [
  { nombre: "Convivencia, molestias y actividades", icono: "people", tema: "convivencia" },
  { nombre: "Limpieza, ornato y publicidad", icono: "clean", tema: "limpieza", secciones: [
    { nombre: "Limpieza y cuidado del entorno", casos: ["CONV-OP-005", "CONV-OP-006", "CONV-OP-009", "CONV-OP-013", "CONV-OP-014", "CONV-OP-015"] },
    { nombre: "Publicidad", casos: ["CONV-OP-008", "CONV-OP-016", "CONV-OP-017", "CONV-OP-018", "CONV-OP-019"] },
  ] },
  { nombre: "Uso y seguridad del espacio público", icono: "street", tema: "espacio-publico" },
];
