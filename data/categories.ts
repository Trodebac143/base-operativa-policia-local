import type { Category } from "./types";
import categoriesJson from "../contenido/estructura/categorias.json";

/** Adaptador técnico. Para editar categorías: contenido/estructura/categorias.json */
export const categories = categoriesJson as Category[];
