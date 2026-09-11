import type { OperationalCase } from "./types";
import casesJson from "../contenido/_generado/casos.json";

/** Índice técnico generado. Los casos editables viven en las carpetas contenido/.../casos/. */
export const rawCases = casesJson as OperationalCase[];
