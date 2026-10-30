export type OperationalToolSearchEntry = {
  id: string;
  titulo: string;
  modulo: "seguridad_vial" | "policia_administrativa";
  categoria: string;
  sinonimos: string[];
};

/** Entradas de herramientas que no son casos JSON y deben seguir siendo localizables desde la consulta global. */
export const operationalToolSearchEntries: OperationalToolSearchEntry[] = [
  { id: "tool-alcoholemia", titulo: "Calculadora de alcoholemia", modulo: "seguridad_vial", categoria: "seguridad_vial_alcoholemia", sinonimos: ["alcohol", "etilometro", "etilómetro", "tasa", "emp"] },
  { id: "tool-vmp", titulo: "Guía de VMP", modulo: "seguridad_vial", categoria: "seguridad_vial_vmp", sinonimos: ["vmp", "patinete", "movilidad personal", "seguro vmp"] },
  { id: "tool-permisos", titulo: "Permisos de conducción", modulo: "seguridad_vial", categoria: "seguridad_vial_permisos", sinonimos: ["permiso", "carnet", "carné", "conducir", "licencia"] },
  { id: "tool-itv", titulo: "ITV", modulo: "seguridad_vial", categoria: "seguridad_vial_itv", sinonimos: ["itv", "inspeccion tecnica", "inspección técnica", "inspeccion"] },
  { id: "tool-seguro", titulo: "Seguro obligatorio", modulo: "seguridad_vial", categoria: "seguridad_vial_seguro", sinonimos: ["seguro", "soa", "poliza", "póliza"] },
  { id: "tool-establecimientos", titulo: "Establecimientos y actividades", modulo: "policia_administrativa", categoria: "policia_administrativa_establecimientos_actividades", sinonimos: ["establecimiento", "actividad", "licencia", "inspeccion", "inspección"] },
  { id: "tool-urbanismo", titulo: "Urbanismo", modulo: "policia_administrativa", categoria: "policia_administrativa_urbanismo", sinonimos: ["urbanismo", "obra", "zanja", "cala", "via publica", "vía pública"] },
];
