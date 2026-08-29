import type { Module } from "./types";
import modulesJson from "../contenido/estructura/modulos.json";

/** Adaptador técnico. Para editar módulos: contenido/estructura/modulos.json */
export const modules = modulesJson as Module[];
