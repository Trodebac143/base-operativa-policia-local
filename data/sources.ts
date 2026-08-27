import type { Source } from "./types";
export const sources: Source[] = [
  { id: "AN-SRC-001", nombre: "Ley 7/2025 CV, perros de asistencia", tipo: "Ley", ambito: "Comunitat Valenciana" },
  { id: "AN-SRC-004", nombre: "Ley 50/1999, animales potencialmente peligrosos", tipo: "Ley", ambito: "Estatal", estado_vigencia_auditoria: "vigente" },
  { id: "AN-SRC-005", nombre: "Real Decreto 287/2002, desarrollo de la Ley 50/1999", tipo: "Real Decreto", ambito: "Estatal" },
  { id: "AN-SRC-007", nombre: "Código Penal", tipo: "Ley orgánica", ambito: "Estatal", estado_vigencia_auditoria: "vigente" },
  { id: "AN-SRC-016", nombre: "Real Decreto 409/2025, perros de asistencia", tipo: "Real Decreto", ambito: "Estatal" },
  { id: "AN-SRC-018", nombre: "Ley 2/2023 CV, protección, bienestar y tenencia de animales de compañía", tipo: "Ley", ambito: "Comunitat Valenciana", estado_vigencia_auditoria: "vigente" },
  { id: "AN-SRC-023", nombre: "Orden de 25/09/1996, identificación de animales de compañía", tipo: "Orden", ambito: "Comunitat Valenciana" },
  { id: "AN-SRC-026", nombre: "Orden 3/2016 CV, tratamientos sanitarios obligatorios", tipo: "Orden", ambito: "Comunitat Valenciana" },
  { id: "AN-SRC-027", nombre: "Decreto 145/2000 CV, animales potencialmente peligrosos", tipo: "Decreto", ambito: "Comunitat Valenciana" },
  { id: "OTA-TORRENT", nombre: "Ordenanza Municipal sobre Tenencia de Animales de Torrent", tipo: "Ordenanza", ambito: "Torrent", estado_vigencia_auditoria: "vigente con aplicación condicionada por normativa posterior" },
  { id: "OCC-TORRENT", nombre: "Ordenanza de Convivencia Ciudadana de Torrent", tipo: "Ordenanza", ambito: "Torrent" },
  { id: "TR-ITV-SRC-001", nombre: "RDL 6/2015, Ley sobre Tráfico, texto consolidado", tipo: "Real decreto legislativo", ambito: "Estatal", estado_vigencia_auditoria: "validado" },
  { id: "TR-ITV-SRC-002", nombre: "RD 2822/1998, Reglamento General de Vehículos, texto consolidado", tipo: "Real decreto", ambito: "Estatal", estado_vigencia_auditoria: "validado" },
  { id: "TR-ITV-SRC-003", nombre: "RD 920/2017, regulación de la ITV, texto consolidado", tipo: "Real decreto", ambito: "Estatal", estado_vigencia_auditoria: "validado" },
  { id: "TR-ITV-SRC-004", nombre: "Nota DGT de 3 de noviembre de 2021 sobre ITV de vehículo estacionado", tipo: "Criterio interpretativo oficial", ambito: "Estatal", estado_vigencia_auditoria: "validado compatible" },
  { id: "TR-ITV-SRC-005", nombre: "DGT — competencia sancionadora en condiciones técnicas", tipo: "Criterio oficial", ambito: "Estatal", estado_vigencia_auditoria: "validado" },
  { id: "TR-ITV-SRC-007", nombre: "Guía codificada de infracciones DGT (ARCI), vigente desde 6 de julio de 2026", tipo: "Codificado oficial", ambito: "Estatal", estado_vigencia_auditoria: "validado" },
];

/** Resuelve únicamente los identificadores declarados por el propio caso, sin fallbacks. */
export function resolveCaseSources(sourceIds: string[]): Source[] {
  return sourceIds
    .map((id) => sources.find((source) => source.id === id))
    .filter((source): source is Source => Boolean(source));
}
