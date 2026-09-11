import type { PermitGroup, PermitHelp, PermitOperationalCase, Rule } from "./types";
import { rawCases } from "./case-catalog";
import legalSheetsJson from "../contenido/seguridad_vial/permisos/fichas_juridicas.json";
import rulesJson from "../contenido/seguridad_vial/permisos/reglas.json";
import helpsJson from "../contenido/seguridad_vial/permisos/ayudas.json";
import groupsJson from "../contenido/seguridad_vial/permisos/subgrupos.json";
import { withTrafficMeasurePlan } from "./traffic";

/** Adaptadores técnicos. El contenido editable está en contenido/seguridad_vial/permisos/. */
export const permisosCases = rawCases.filter((item) => item.categoria === "seguridad_vial_permisos").map(withTrafficMeasurePlan) as PermitOperationalCase[];
export const permisosLegalSheets = legalSheetsJson;
export const permisosRules = rulesJson as Rule[];
export const permisosHelps = helpsJson as PermitHelp[];
export const permisosGroups = (groupsJson as Omit<PermitGroup, "casos">[]).map((group) => ({
  ...group,
  casos: permisosCases.filter((item) => item.subgrupo === group.id).map((item) => item.id),
}));
export const resolvePermitHelps = (ids: string[] | undefined) => ids?.map((id) => permisosHelps.find((help) => help.id === id)).filter((help): help is PermitHelp => Boolean(help)) ?? [];
