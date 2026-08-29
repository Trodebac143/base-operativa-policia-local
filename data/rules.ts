import type { Rule } from "./types";
import commonRulesJson from "../contenido/juridico/reglas_generales_y_comunes.json";
import { itvRules } from "./itv";

/** Reglas generales + reglas ITV, conservando la composición funcional de V15. */
export const rules = [...(commonRulesJson as Rule[]), ...itvRules];
