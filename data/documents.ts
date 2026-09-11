import documentsJson from "../contenido/biblioteca/documentos.json";

export type LibraryDocument = { id: string; titulo: string; archivo: string; fuenteId?: string; descripcion: string };
/** Índice generado. Para editar títulos y descripciones: contenido/biblioteca/metadatos.json */
export const libraryDocuments = documentsJson as LibraryDocument[];

export function documentForSource(sourceId: string): LibraryDocument | undefined {
  return libraryDocuments.find((document) => document.fuenteId === sourceId);
}
