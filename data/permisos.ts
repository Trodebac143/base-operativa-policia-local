import type { PermitGroup, PermitHelp, PermitOperationalCase, Rule } from "./types";
import casesJson from "../contenido/seguridad_vial/permisos/casos.json";
import legalSheetsJson from "../contenido/seguridad_vial/permisos/fichas_juridicas.json";
import rulesJson from "../contenido/seguridad_vial/permisos/reglas.json";
import helpsJson from "../contenido/seguridad_vial/permisos/ayudas.json";
import groupsJson from "../contenido/seguridad_vial/permisos/subgrupos.json";
import { withTrafficMeasurePlan } from "./traffic";

/** Adaptadores técnicos. El contenido editable está en contenido/seguridad_vial/permisos/. */
export const permisosCases = (casesJson as PermitOperationalCase[]).map(withTrafficMeasurePlan) as PermitOperationalCase[];
export const permisosLegalSheets = legalSheetsJson;
export const permisosRules = rulesJson as Rule[];
export const permisosHelps = helpsJson as PermitHelp[];
export const permisosGroups = groupsJson as PermitGroup[];
export const resolvePermitHelps = (ids: string[] | undefined) => ids?.map((id) => permisosHelps.find((help) => help.id === id)).filter((help): help is PermitHelp => Boolean(help)) ?? [];
