import documentsJson from "../contenido/biblioteca/documentos.json";

export type LibraryDocument = { titulo: string; archivo: string; descripcion: string };
/** Biblioteca de consulta. Para editar el listado: contenido/biblioteca/documentos.json */
export const libraryDocuments = documentsJson as LibraryDocument[];
