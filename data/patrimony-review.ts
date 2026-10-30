import type { PatrimonyFacts } from "./patrimonio";

/** Entradas existentes que pueden cambiar el subtipo. Un dato omitido sigue pendiente. */
export const theftQualificationFields = {
  valorArtisticoHistoricoCulturalCientifico: "valor artístico, histórico, cultural o científico",
  primeraNecesidadConDesabastecimiento: "primera necesidad con desabastecimiento",
  infraestructuraConQuebrantoGrave: "infraestructura o servicio con quebranto grave",
  productoAgrarioGanaderoEnExplotacion: "productos o instrumentos agrarios en explotación",
  especialGravedadValorPerjuicio: "valor y perjuicio especialmente elevados",
  graveSituacionEconomicaOAbusoCircunstancias: "situación económica, desamparo o circunstancias aprovechadas",
  usaMenorDieciseis: "utilización de menor de 16 años",
  miembroOrganizacionGrupoCriminal: "organización o grupo dedicado a estos hechos",
  telefonoODispositivo235: "teléfono u otro dispositivo comprendido en la reforma",
} satisfies Partial<Record<keyof PatrimonyFacts, string>>;
export const damageQualificationFields = {
  bienDominioUsoPublicoComunal: "bien de dominio, uso público o comunal",
  danoImpedirAutoridad: "finalidad de impedir el ejercicio de la autoridad",
  contagioGanado: "infección o contagio del ganado",
  sustanciasVenenosasCorrosivas: "sustancias venenosas o corrosivas",
  danoGraveSituacionEconomica: "ruina o grave situación económica de la víctima",
  danoEspecialGravedadInteresGeneral: "especial gravedad o intereses generales",
} satisfies Partial<Record<keyof PatrimonyFacts, string>>;

export function patrimonyPendingQualifications(facts: PatrimonyFacts): string[] {
  const missing: string[] = [];
  const ask = (fields: Partial<Record<keyof PatrimonyFacts, string>>) => {
    for (const [key, label] of Object.entries(fields)) if (facts[key as keyof PatrimonyFacts] === undefined) missing.push(label);
  };
  const taking = facts.hechoPrincipal === "apoderamiento" || facts.hechoPrincipal === "recepcion" && facts.posesionPrevia === "autor_acceso_material";
  if (taking && !facts.violenciaFisica && !facts.intimidacion) {
    ask(theftQualificationFields);
    if (!facts.estadoCondenasPrevias || ["no_consta_verificacion", "antecedentes_no_judicialmente_verificados"].includes(facts.estadoCondenasPrevias)) missing.push("comprobación judicial de condenas; no verificado no equivale a ausencia de condenas computables");
    if (facts.telefonoODispositivo235) ask({ existenciaComercialVentaAlmacenExposicion: "destino comercial del dispositivo" });
    if (!facts.fuerza || facts.fuerza === "ninguna") ask({ dispositivoAntihurtoEnCosaNeutralizado: "neutralización del antihurto de la cosa" });
    else ask({ especialGravedad2414: "valoración documentada de circunstancias del robo en inmueble" });
    if (facts.estadoCondenasPrevias === "condenas_ejecutorias_verificadas") {
      ask({ numeroCondenasEjecutorias: "número de condenas", condenasMismaNaturaleza: "misma naturaleza y capítulo de las condenas", condenasCanceladasOCancelables: "cancelación de condenas", requisitosCondenasCompletos: "documentación de todos los requisitos", algunaCondenaLeve: "existencia de condena leve", todasCondenasMenosGravesOGraves: "condenas menos graves o graves" });
      if (facts.requisitosCondenasCompletos === false) missing.push("documentación judicial todavía incompleta");
      if (facts.numeroCondenasEjecutorias !== undefined && (!Number.isInteger(facts.numeroCondenasEjecutorias) || facts.numeroCondenasEjecutorias < 0)) missing.push("un número válido de condenas ejecutorias");
    }
  }
  if (facts.hechoPrincipal === "recepcion" && facts.posesionPrevia !== "autor_acceso_material") {
    if (facts.viaApropiacionFuera253) ask({ valorArtisticoHistoricoCulturalCientifico: "valor cultural de la cosa apropiada" });
    else {
      ask({ agravacion250Acreditada: "comprobación documental de las circunstancias del art. 250" });
      if (facts.agravacion250Acreditada) ask({ agravacion250Especial: "presupuestos del apartado 2 del art. 250" });
    }
  }
  if (facts.hechoPrincipal === "danos" && facts.intencionalidadDano === "deliberado") {
    ask(damageQualificationFields);
    ask({ medioDestructivoOPeligroPersonas: "medio destructivo o peligro para personas" });
  }
  if (!facts.violenciaFisica && !facts.intimidacion) {
    if (!facts.relacionArt268 || facts.relacionArt268 === "no_determinada") missing.push("relación entre las personas para valorar la posible excusa familiar");
    if (facts.relacionArt268 === "conyuge") {
      ask({ separacionConyugal: "separación legal o de hecho" });
      if (facts.separacionConyugal === false) ask({ procesoSeparacionDivorcioNulidad: "proceso judicial de separación, divorcio o nulidad" });
    }
    if (facts.relacionArt268 === "familiar") {
      if (!facts.vinculoFamiliar268 || facts.vinculoFamiliar268 === "no_determinado") missing.push("parentesco concreto");
      if (facts.vinculoFamiliar268 === "afin_primer_grado") ask({ afinPrimerGradoConvive: "convivencia entre afines de primer grado" });
    }
    if (["conyuge", "familiar"].includes(facts.relacionArt268 ?? "")) ask({ abusoVulnerabilidadEdadDiscapacidad: "abuso de vulnerabilidad para la posible excusa familiar" });
  }
  return missing;
}

/** Elimina hechos subordinados al cambiar el recorrido; también protege llamadas ajenas a React. */
export function updatePatrimonyFact<K extends keyof PatrimonyFacts>(facts: PatrimonyFacts, key: K, value: PatrimonyFacts[K]): PatrimonyFacts {
  const next = { ...facts, [key]: value };
  const clear = (...keys: Array<keyof PatrimonyFacts>) => { for (const field of keys) delete next[field]; };
  if (key === "armaPresente") clear("armaUsada");
  if (key === "fuerza") clear("tipoLugar", "especialGravedad2414");
  if (key === "momentoViolencia") clear("conexionViolenciaApoderamiento", "fuerza", "tipoLugar", "armaPresente", "armaUsada");
  if (key === "conexionViolenciaApoderamiento") clear("fuerza", "tipoLugar", "especialGravedad2414", "armaPresente", "armaUsada");
  if (key === "telefonoODispositivo235") clear("existenciaComercialVentaAlmacenExposicion");
  if (key === "agravacion250Acreditada") clear("agravacion250Especial");
  if (key === "estadoCondenasPrevias") clear("numeroCondenasEjecutorias", "condenasMismaNaturaleza", "algunaCondenaLeve", "todasCondenasMenosGravesOGraves", "condenasCanceladasOCancelables", "requisitosCondenasCompletos");
  if (key === "relacionArt268") clear("vinculoFamiliar268", "afinPrimerGradoConvive", "separacionConyugal", "procesoSeparacionDivorcioNulidad", "abusoVulnerabilidadEdadDiscapacidad", "terceroExtranoParticipa");
  if (key === "vinculoFamiliar268") clear("afinPrimerGradoConvive");
  if (key === "separacionConyugal") clear("procesoSeparacionDivorcioNulidad");
  if (key === "medioDestructivoOPeligroPersonas") clear("medioDano", "peligroVidaIntegridad", "bienEspecial266", "danoGraveOInutilizacionMilitar", "interrupcionObstaculizacionServicio");
  if (key === "bienEspecial266") clear("danoGraveOInutilizacionMilitar", "interrupcionObstaculizacionServicio");
  if (key === "intencionalidadDano") { for (const field of Object.keys(damageQualificationFields)) delete next[field as keyof PatrimonyFacts]; clear("imprudenciaGrave", "medioDano", "peligroVidaIntegridad", "medioDestructivoOPeligroPersonas", "bienEspecial266"); }
  if (key === "violenciaFisica" || key === "intimidacion") { clear("fuerza", "tipoLugar", "especialGravedad2414"); }
  return next;
}
