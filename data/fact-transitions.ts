import type { PublicSafetyFacts } from "./seguridad-publica";

export function updatePublicSafetyFact<K extends keyof PublicSafetyFacts>(facts: PublicSafetyFacts, key: K, value: PublicSafetyFacts[K]): PublicSafetyFacts {
  const next = { ...facts, [key]: value };
  const clear = (...keys: Array<keyof PublicSafetyFacts>) => { for (const field of keys) delete next[field]; };
  if (key === "conductaSexualReferida" || key === "menorDieciseis" || key === "conductaSexual") {
    clear("actoSexualNoConsentido", "estadoConsentimiento", "penetracion", "violenciaIntimidacion", "voluntadAnulada", "variasPersonas", "violenciaExtremaDegradante", "sustanciasAdministradas", "organizacionCriminal", "posibleExcepcion183Bis", "actosPresenciadosDelictivos", "propuestaEncuentroYAcercamiento", "embaucarMaterialPornografico", "procedibilidadSexual", "abusoSuperioridad", "prevalimientoRelacion", "medioPeligroso");
    if (key === "conductaSexualReferida") clear("menorDieciseis", "conductaSexual");
  }
  if (key === "condicionImpuesta" || key === "malAnunciado") clear("propositoConseguido", "condicionConductaDebida");
  if (key === "parejaExpareja" || key === "relacionFamiliar" || key === "convivencia") clear("personaEspecialmenteVulnerableConvive");
  if (key === "conductaLibertad") clear("malAnunciado", "condicionImpuesta", "propositoConseguido", "condicionConductaDebida", "coaccionEntidad", "conductaAcoso", "acosoReiterado", "alteracionVidaCotidiana");
  if (key === "lesion" && value !== true) clear("signosLesion", "resultadoAsistencial", "resultadoEspecialGravedad");
  if (key === "medioPeligroso" && value !== true) clear("peligroConcretoLesion", "armaUtilizada");
  if (key === "medidaVigenteConocida" && value !== true) clear("incumplimientoMedida", "medidaQuebrantada", "dispositivoControlManipulado", "medidaRelacion1732", "privadoLibertad");
  return next;
}
