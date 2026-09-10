import { deriveRelationalContext, type PublicSafetyFacts, type RelationalContext } from "./seguridad-publica";
import { resolveMinorOffenceProcessualDecision, resolvePenalProcessualDecision, type ProcessualDecision, type ProcessualInput } from "./procesal-penal";

export type PatrimonyMainEvent = "apoderamiento" | "recepcion" | "danos" | "no_claro";
export type PatrimonyOwnership = "ajena" | "propia" | "compartida" | "no_determinada";
export type PriorPossession = "victima_titular" | "autor_entrega_legitima" | "autor_acceso_material" | "autor_facultades_administracion" | "tercero" | "no_determinada";
export type ExecutionDegree = "consumado" | "tentativa" | "no_determinado";
export type PriorConvictionsState = "no_consta_verificacion" | "antecedentes_no_judicialmente_verificados" | "condenas_ejecutorias_verificadas";
export type ForceFact = "ninguna" | "escalamiento" | "rotura_acceso" | "fractura_contenedor" | "cerradura_claves" | "llave_falsa" | "alarma_acceso_salida" | "llave_entregada_legitima" | "escalamiento_dudoso" | "no_determinada";
export type ViolenceMoment = "apoderamiento" | "conservar" | "huida" | "auxiliador" | "perseguidor" | "otro" | "no_determinado";
export type PlaceKind = "morada" | "local_abierto" | "local_fuera_horario" | "dependencia" | "otro" | "no_determinado";
export type DamageIntent = "deliberado" | "imprudente_accidental" | "no_determinado";
export type Family268Kind = "conyuge" | "ascendiente" | "descendiente" | "hermano" | "afin_primer_grado" | "otro" | "no_determinado";

export type PatrimonyFacts = {
  hechoPrincipal?: PatrimonyMainEvent;
  titularidad?: PatrimonyOwnership;
  posesionPrevia?: PriorPossession;
  intencionApropiacionBeneficio?: boolean;
  sinConsentimiento?: boolean;
  recepcionLegitima?: boolean;
  obligacionDevolverEntregar?: boolean;
  facultadesAdministracion?: boolean;
  excesoFacultadesConPerjuicio?: boolean;
  autorizacionDisposicion?: boolean;
  relacionLaboralProfesional?: boolean;
  conductaApropiacionONegacion?: boolean;
  enganoPrevioActoDisposicion?: boolean;
  viaApropiacionFuera253?: boolean;
  cuantia?: number;
  cuantiaAcreditada?: boolean;
  gradoEjecucion?: ExecutionDegree;
  efectoRecuperado?: boolean;
  fuerza?: ForceFact;
  fuerzaParaAccederOAbandonar?: boolean;
  violenciaFisica?: boolean;
  intimidacion?: boolean;
  momentoViolencia?: ViolenceMoment;
  conexionViolenciaApoderamiento?: boolean;
  armaPresente?: boolean;
  armaUsada?: boolean;
  lesionAutonoma?: boolean;
  amenazaCoaccionAutonoma?: boolean;
  dispositivoAntihurtoEnCosaNeutralizado?: boolean;
  telefonoODispositivo235?: boolean;
  existenciaComercialVentaAlmacenExposicion?: boolean;
  valorArtisticoHistoricoCulturalCientifico?: boolean;
  primeraNecesidadConDesabastecimiento?: boolean;
  infraestructuraConQuebrantoGrave?: boolean;
  productoAgrarioGanaderoEnExplotacion?: boolean;
  especialGravedadValorPerjuicio?: boolean;
  graveSituacionEconomicaOAbusoCircunstancias?: boolean;
  usaMenorDieciseis?: boolean;
  miembroOrganizacionGrupoCriminal?: boolean;
  intervienenDosPersonas?: boolean;
  tipoLugar?: PlaceKind;
  especialGravedad2414?: boolean;
  agravacion250Acreditada?: boolean;
  agravacion250Especial?: boolean;
  estadoCondenasPrevias?: PriorConvictionsState;
  numeroCondenasEjecutorias?: number;
  condenasMismaNaturaleza?: boolean;
  algunaCondenaLeve?: boolean;
  todasCondenasMenosGravesOGraves?: boolean;
  condenasCanceladasOCancelables?: boolean;
  requisitosCondenasCompletos?: boolean;
  numeroEpisodios?: number;
  nexoPlanOcasionComunAcreditado?: boolean;
  separacionConyugal?: boolean;
  procesoSeparacionDivorcioNulidad?: boolean;
  vinculoFamiliar268?: Family268Kind;
  afinPrimerGradoConvive?: boolean;
  abusoVulnerabilidadEdadDiscapacidad?: boolean;
  terceroExtranoParticipa?: boolean;
  intencionalidadDano?: DamageIntent;
  danoInformatico?: boolean;
  imprudenciaGrave?: boolean;
  bienDominioUsoPublicoComunal?: boolean;
  danoImpedirAutoridad?: boolean;
  contagioGanado?: boolean;
  sustanciasVenenosasCorrosivas?: boolean;
  danoGraveSituacionEconomica?: boolean;
  danoEspecialGravedadInteresGeneral?: boolean;
  medioDestructivoOPeligroPersonas?: boolean;
};

export type PatrimonyConnection = { conceptId: string; etiqueta: string; motivo: string };
export type PatrimonyOutcome = {
  estado: "pendiente" | "resuelto" | "derivacion";
  resultado: string;
  hecho: string;
  tipoPenal?: string;
  norma?: string;
  gravedad?: "DELITO LEVE" | "DELITO MENOS GRAVE" | "DELITO GRAVE";
  grado?: string;
  falta?: string;
  exencion?: { titulo: string; fundamento: string };
  avisos: string[];
  porQue: string[];
  actuacion: string[];
  procesal?: ProcessualDecision;
  conexiones: PatrimonyConnection[];
  contextoRelacional: RelationalContext;
};

const pending = (falta: string, context: RelationalContext, connections: PatrimonyConnection[] = []): PatrimonyOutcome => ({
  estado: "pendiente", resultado: "FALTA DETERMINAR", hecho: "Datos patrimoniales incompletos", falta,
  avisos: [], porQue: [`Falta determinar ${falta}.`], actuacion: ["Documentar el hecho concreto pendiente sin anticipar la calificación."], conexiones: connections, contextoRelacional: context,
});

const processFor = (gravity: PatrimonyOutcome["gravedad"], input: ProcessualInput) => gravity === "DELITO LEVE"
  ? resolveMinorOffenceProcessualDecision(input)
  : gravity ? resolvePenalProcessualDecision(input) : undefined;

const commonActions = ["Identificar a autor, víctima y testigos.", "Describir y asegurar los efectos, instrumentos e indicios.", "Documentar titularidad, posesión, cuantía acreditada y secuencia temporal."];

function connectionsFor(facts: PatrimonyFacts, context: RelationalContext): PatrimonyConnection[] {
  const result: PatrimonyConnection[] = [];
  if (facts.lesionAutonoma) result.push({ conceptId: "agresiones_lesiones", etiqueta: "Agresiones y lesiones", motivo: "Existe una lesión autónoma que debe analizarse sin perder el contexto patrimonial." });
  if (facts.amenazaCoaccionAutonoma) result.push({ conceptId: "amenazas_coacciones", etiqueta: "Amenazas y coacciones", motivo: "Existe una conducta autónoma adicional, distinta de la intimidación que integra el robo." });
  if (facts.armaPresente) result.push({ conceptId: "armas_blancas", etiqueta: "Armas y objetos peligrosos", motivo: facts.armaUsada ? "Consta uso efectivo; conservarlo también como hecho del robo." : "La mera tenencia no activa el art. 242.3; analizar porte y conducta en su módulo." });
  if ((facts.violenciaFisica || facts.intimidacion || facts.lesionAutonoma || facts.amenazaCoaccionAutonoma) && (context.isViogenLO12004 || context.hasFamilyRelationship || context.hasCohabitation)) result.push({ conceptId: "violencia_relacional", etiqueta: context.isViogenLO12004 ? "Violencia de género" : "Violencia doméstica", motivo: "Hay hechos personales adicionales; el conflicto patrimonial por sí solo no determina este ámbito." });
  return result;
}

function art268(facts: PatrimonyFacts, relationalFacts: PublicSafetyFacts) {
  const spouse = relationalFacts.tipoRelacion === "esposa" && facts.separacionConyugal === false && facts.procesoSeparacionDivorcioNulidad === false;
  const family = ["ascendiente", "descendiente", "hermano"].includes(facts.vinculoFamiliar268 ?? "") || facts.vinculoFamiliar268 === "afin_primer_grado" && facts.afinPrimerGradoConvive === true;
  const covered = spouse || family;
  const excluded = facts.violenciaFisica === true || facts.intimidacion === true || facts.abusoVulnerabilidadEdadDiscapacidad === true;
  if (!covered || excluded) return undefined;
  return {
    titulo: "POSIBLE EXCUSA ABSOLUTORIA · ART. 268 CP",
    fundamento: `Los hechos se producen entre familiares incluidos y sin violencia, intimidación ni abuso de vulnerabilidad. Puede excluir la responsabilidad criminal, sin perjuicio de la responsabilidad civil.${facts.terceroExtranoParticipa ? " No se extiende al tercero extraño participante." : ""}`,
  };
}

const convictionVerified = (facts: PatrimonyFacts) => facts.estadoCondenasPrevias === "condenas_ejecutorias_verificadas" &&
  (facts.numeroCondenasEjecutorias ?? 0) >= 3 && facts.condenasMismaNaturaleza === true &&
  facts.condenasCanceladasOCancelables === false && facts.requisitosCondenasCompletos === true;

function convictionNotice(facts: PatrimonyFacts, activated: boolean) {
  if (activated) return "MULTIRREINCIDENCIA VERIFICADA. Se recalcula el tipo, la gravedad y la situación procesal.";
  if (facts.estadoCondenasPrevias === "condenas_ejecutorias_verificadas") return "CONDENAS VERIFICADAS, REQUISITOS INCOMPLETOS. No se aplica agravación hasta comprobar positivamente todos los requisitos legales.";
  return "MULTIRREINCIDENCIA NO VERIFICADA. No modifica la actuación actual. Denuncias, detenciones y antecedentes policiales no son condenas ejecutorias computables.";
}

function continuedNotice(facts: PatrimonyFacts) {
  if ((facts.numeroEpisodios ?? 1) <= 1) return undefined;
  return facts.nexoPlanOcasionComunAcreditado === true
    ? "POSIBLE DELITO CONTINUADO · ART. 74 CP. Consta un nexo; no sumar cuantías de forma automática fuera de la aplicación judicial del precepto."
    : "NO PUEDE DETERMINARSE DELITO CONTINUADO. Falta establecer el nexo entre los diferentes hechos.";
}

function resolved(base: Omit<PatrimonyOutcome, "estado" | "contextoRelacional" | "conexiones" | "procesal"> & { estado?: PatrimonyOutcome["estado"] }, facts: PatrimonyFacts, process: ProcessualInput, relationalFacts: PublicSafetyFacts, allowProcess = true): PatrimonyOutcome {
  const contextoRelacional = deriveRelationalContext(relationalFacts);
  const conexiones = connectionsFor(facts, contextoRelacional);
  const exencion = art268(facts, relationalFacts);
  const continued = continuedNotice(facts);
  return {
    ...base,
    estado: base.estado ?? "resuelto",
    exencion: base.exencion ?? exencion,
    avisos: [...base.avisos, ...(continued ? [continued] : [])],
    procesal: allowProcess && !exencion ? processFor(base.gravedad, process) : undefined,
    conexiones,
    contextoRelacional,
  };
}

function theft(facts: PatrimonyFacts, process: ProcessualInput, relationalFacts: PublicSafetyFacts): PatrimonyOutcome {
  const context = deriveRelationalContext(relationalFacts);
  if (facts.cuantiaAcreditada !== true || facts.cuantia === undefined) return pending("la cuantía acreditada del bien; no puede tratarse como cero", context, connectionsFor(facts, context));
  const verified = convictionVerified(facts);
  const multi234 = verified && facts.algunaCondenaLeve === true;
  const multi235 = verified && facts.todasCondenasMenosGravesOGraves === true;
  const aggravated: string[] = [];
  if (facts.valorArtisticoHistoricoCulturalCientifico) aggravated.push("valor artístico, histórico, cultural o científico");
  if (facts.primeraNecesidadConDesabastecimiento) aggravated.push("primera necesidad con desabastecimiento");
  if (facts.infraestructuraConQuebrantoGrave) aggravated.push("infraestructura o servicio general con quebranto grave");
  if (facts.productoAgrarioGanaderoEnExplotacion && facts.cuantia > 400) aggravated.push("producto o instrumento agrario/ganadero en explotación y valor superior a 400 €");
  if (facts.especialGravedadValorPerjuicio) aggravated.push("especial gravedad por valor o perjuicio");
  if (facts.graveSituacionEconomicaOAbusoCircunstancias) aggravated.push("grave situación económica, abuso de circunstancias o desamparo");
  if (multi235) aggravated.push("tres condenas ejecutorias menos graves o graves, computables y de la misma naturaleza");
  if (facts.usaMenorDieciseis) aggravated.push("utilización de menor de 16 años");
  if (facts.miembroOrganizacionGrupoCriminal) aggravated.push("participación como miembro de organización o grupo criminal dedicado a estos delitos");
  if (facts.telefonoODispositivo235 && facts.existenciaComercialVentaAlmacenExposicion === false) aggravated.push("teléfono o dispositivo comprendido en el art. 235.1.10");
  const antiTheft = facts.dispositivoAntihurtoEnCosaNeutralizado === true;
  const degree = facts.gradoEjecucion === "tentativa" ? "TENTATIVA · art. 62 CP" : "CONSUMADO";
  const baseNotice = convictionNotice(facts, multi234 || multi235);
  if (aggravated.length) return resolved({
    resultado: "HURTO AGRAVADO", hecho: "Toma de cosa mueble ajena, sin consentimiento y con ánimo de apropiación o beneficio.", tipoPenal: "Hurto agravado", norma: `Código Penal · art. 235${aggravated.length > 1 ? " y 235.2" : ""}${antiTheft ? " · art. 234.3" : ""}`,
    gravedad: "DELITO MENOS GRAVE", grado: degree, avisos: [baseNotice, ...(facts.telefonoODispositivo235 && facts.existenciaComercialVentaAlmacenExposicion ? ["La existencia comercial queda fuera del art. 235.1.10 por la excepción legal."] : [])],
    porQue: [`Concurre: ${aggravated.join("; ")}.`, antiTheft ? "Se neutralizó el antihurto instalado en la cosa: art. 234.3; esto no transforma el hecho en robo con fuerza." : "No consta neutralización del antihurto de la propia cosa."], actuacion: commonActions,
  }, facts, process, relationalFacts);
  const elevated = facts.cuantia <= 400 && multi234;
  const minor = facts.cuantia <= 400 && !elevated;
  return resolved({
    resultado: minor ? "HURTO · MODALIDAD LEVE" : elevated ? "HURTO CON MULTIRREINCIDENCIA VERIFICADA" : "HURTO",
    hecho: "Toma de cosa mueble ajena, sin consentimiento y con intención de apropiación o beneficio.", tipoPenal: "Hurto",
    norma: `Código Penal · art. ${minor ? "234.2" : elevated ? "234.2, párrafo de multirreincidencia (pena del art. 234.1)" : "234.1"}${antiTheft ? " · art. 234.3" : ""}`,
    gravedad: minor ? "DELITO LEVE" : "DELITO MENOS GRAVE", grado: degree,
    avisos: [baseNotice, ...(facts.telefonoODispositivo235 && facts.existenciaComercialVentaAlmacenExposicion ? ["Dispositivo destinado a venta, almacén o exposición: no se activa el art. 235.1.10 por su naturaleza."] : [])],
    porQue: [minor ? `La cuantía acreditada (${facts.cuantia} €) no excede de 400 € y no consta agravación del art. 235.` : elevated ? "Constan al menos tres condenas ejecutorias computables de la misma naturaleza, al menos una leve, y ningún antecedente cancelado o cancelable." : `La cuantía acreditada (${facts.cuantia} €) excede de 400 €.`, antiTheft ? "El art. 234.3 eleva la pena dentro del marco aplicable, sin convertir el hecho en robo." : ""].filter(Boolean),
    actuacion: commonActions,
  }, facts, process, relationalFacts);
}

function robberyWithViolence(facts: PatrimonyFacts, process: ProcessualInput, relationalFacts: PublicSafetyFacts): PatrimonyOutcome {
  const context = deriveRelationalContext(relationalFacts);
  if (!facts.momentoViolencia || facts.momentoViolencia === "no_determinado") return pending("el momento y destinatario de la violencia o intimidación", context, connectionsFor(facts, context));
  if (facts.conexionViolenciaApoderamiento === undefined) return pending("si la violencia o intimidación sirvió para obtener o conservar el objeto, huir, o vencer a quien auxiliaba o perseguía", context, connectionsFor(facts, context));
  if (!facts.conexionViolenciaApoderamiento) return theft(facts, process, relationalFacts);
  const inProtectedPlace = ["morada", "local_abierto", "dependencia"].includes(facts.tipoLugar ?? "");
  const armed = facts.armaUsada === true;
  return resolved({
    resultado: "ROBO CON VIOLENCIA O INTIMIDACIÓN", hecho: `Violencia o intimidación conectada con ${facts.momentoViolencia === "huida" ? "la huida" : "el apoderamiento o su conservación"}.`, tipoPenal: "Robo con violencia o intimidación",
    norma: `Código Penal · arts. 237 y ${inProtectedPlace ? "242.2" : "242.1"}${armed ? " · 242.3" : ""}`, gravedad: "DELITO MENOS GRAVE", grado: facts.gradoEjecucion === "tentativa" ? "TENTATIVA · art. 62 CP" : "CONSUMADO",
    avisos: facts.armaPresente && !armed ? ["MERA TENENCIA DE ARMA. No activa por sí sola el art. 242.3."] : [],
    porQue: ["La cuantía no convierte el robo en hurto leve.", armed ? "Consta uso efectivo de arma o medio peligroso." : "No consta uso efectivo de arma a efectos del art. 242.3."], actuacion: commonActions,
  }, facts, process, relationalFacts);
}

function robberyWithForce(facts: PatrimonyFacts, process: ProcessualInput, relationalFacts: PublicSafetyFacts): PatrimonyOutcome {
  const context = deriveRelationalContext(relationalFacts);
  if (facts.fuerza === "llave_entregada_legitima") return pending("el título de entrega y el alcance de la autorización de uso de la llave; no es llave falsa automáticamente", context, connectionsFor(facts, context));
  if (facts.fuerza === "escalamiento_dudoso" || facts.fuerza === "no_determinada") return pending("el hecho material de acceso que permitiría afirmar escalamiento o fuerza típica", context, connectionsFor(facts, context));
  if (!facts.tipoLugar || facts.tipoLugar === "no_determinado") return pending("si el lugar es morada, local abierto, local fuera de horario, dependencia u otro lugar", context, connectionsFor(facts, context));
  const aggravations235 = facts.valorArtisticoHistoricoCulturalCientifico || facts.primeraNecesidadConDesabastecimiento || facts.infraestructuraConQuebrantoGrave || facts.especialGravedadValorPerjuicio || facts.graveSituacionEconomicaOAbusoCircunstancias || facts.usaMenorDieciseis || facts.miembroOrganizacionGrupoCriminal || facts.telefonoODispositivo235 && facts.existenciaComercialVentaAlmacenExposicion === false;
  const houseOrLocal = ["morada", "local_abierto", "local_fuera_horario", "dependencia"].includes(facts.tipoLugar);
  const art2414 = facts.especialGravedad2414 === true || houseOrLocal && aggravations235;
  const norm = art2414 ? "237, 238 y 241.4" : houseOrLocal ? "237, 238 y 241.1" : aggravations235 ? "237, 238 y 240.2" : "237, 238 y 240.1";
  return resolved({
    resultado: "ROBO CON FUERZA", hecho: "Apoderamiento con fuerza típica para acceder o abandonar el lugar.", tipoPenal: "Robo con fuerza", norma: `Código Penal · arts. ${norm}`,
    gravedad: art2414 ? "DELITO GRAVE" : "DELITO MENOS GRAVE", grado: facts.gradoEjecucion === "tentativa" ? "TENTATIVA · art. 62 CP" : "CONSUMADO", avisos: [],
    porQue: [facts.tipoLugar === "morada" ? "El lugar constituye morada aunque sus moradores estén temporalmente ausentes." : "La fuerza típica se obtiene de los hechos descritos.", "La cuantía no rebaja un robo con fuerza a hurto leve."], actuacion: commonActions,
  }, facts, process, relationalFacts);
}

function appropriation(facts: PatrimonyFacts, process: ProcessualInput, relationalFacts: PublicSafetyFacts): PatrimonyOutcome {
  const context = deriveRelationalContext(relationalFacts);
  if (!facts.posesionPrevia || facts.posesionPrevia === "no_determinada") return pending("cómo llegó el bien a poder del presunto autor", context, connectionsFor(facts, context));
  if (facts.titularidad !== "ajena") return pending("la titularidad ajena y las facultades reales de disposición", context, connectionsFor(facts, context));
  if (facts.enganoPrevioActoDisposicion) return resolved({ estado: "derivacion", resultado: "POSIBLE ESTAFA", hecho: "Engaño previo que provoca un acto voluntario de disposición.", tipoPenal: "Frontera con estafa", norma: "Código Penal · art. 248", avisos: [], porQue: ["El hecho requiere el módulo específico de estafas; esta fase no desarrolla su árbol completo."], actuacion: commonActions }, facts, process, relationalFacts, false);
  if (facts.facultadesAdministracion && facts.excesoFacultadesConPerjuicio) {
    if (facts.cuantiaAcreditada !== true || facts.cuantia === undefined) return pending("la cuantía acreditada del perjuicio administrado", context);
    const aggravated = facts.agravacion250Acreditada === true;
    return resolved({ resultado: "POSIBLE ADMINISTRACIÓN DESLEAL", hecho: "Exceso en facultades de administración de patrimonio ajeno con perjuicio.", tipoPenal: "Frontera con administración desleal", norma: `Código Penal · art. 252${aggravated ? " en relación con art. 250" : ""}`, gravedad: aggravated ? "DELITO GRAVE" : facts.cuantia <= 400 ? "DELITO LEVE" : "DELITO MENOS GRAVE", grado: facts.gradoEjecucion === "tentativa" ? "TENTATIVA · art. 62 CP" : "CONSUMADO", avisos: [], porQue: ["Las facultades de administración excluyen resolver automáticamente como apropiación indebida."], actuacion: commonActions }, facts, process, relationalFacts);
  }
  if (facts.posesionPrevia === "autor_acceso_material" && facts.conductaApropiacionONegacion) return theft({ ...facts, sinConsentimiento: true, intencionApropiacionBeneficio: true }, process, relationalFacts);
  if (facts.recepcionLegitima === true && facts.obligacionDevolverEntregar === true && facts.conductaApropiacionONegacion === true) {
    if (facts.cuantiaAcreditada !== true || facts.cuantia === undefined) return pending("la cuantía acreditada de lo apropiado", context);
    const aggravated = facts.agravacion250Acreditada === true;
    return resolved({ resultado: "APROPIACIÓN INDEBIDA", hecho: "Bien recibido legítimamente con obligación de entregar o devolver y posterior apropiación o negación.", tipoPenal: "Apropiación indebida", norma: `Código Penal · art. ${facts.cuantia <= 400 && !aggravated ? "253.2" : aggravated ? "253.1 en relación con 250" : "253.1"}`, gravedad: facts.cuantia <= 400 && !aggravated ? "DELITO LEVE" : aggravated ? "DELITO GRAVE" : "DELITO MENOS GRAVE", grado: facts.gradoEjecucion === "tentativa" ? "TENTATIVA · art. 62 CP" : "CONSUMADO", avisos: [], porQue: ["La recepción fue legítima y existía obligación jurídica de entrega o devolución."], actuacion: commonActions }, facts, process, relationalFacts);
  }
  if (facts.viaApropiacionFuera253 === true) {
    if (facts.cuantiaAcreditada !== true || facts.cuantia === undefined) return pending("la cuantía acreditada de la cosa mueble ajena", context);
    const cultural = facts.valorArtisticoHistoricoCulturalCientifico === true;
    return resolved({ resultado: "APROPIACIÓN DE COSA MUEBLE AJENA FUERA DEL ART. 253", hecho: "Apropiación de cosa mueble ajena por vía distinta de una recepción con obligación de devolver.", tipoPenal: "Otra apropiación", norma: `Código Penal · art. ${facts.cuantia <= 400 && !cultural ? "254.2" : cultural ? "254.1, inciso segundo" : "254.1"}`, gravedad: cultural ? "DELITO MENOS GRAVE" : "DELITO LEVE", grado: facts.gradoEjecucion === "tentativa" ? "TENTATIVA · art. 62 CP" : "CONSUMADO", avisos: [], porQue: [cultural ? "La cosa posee valor artístico, histórico, cultural o científico." : "La multa de tres a seis meses mantiene la clasificación leve por el art. 13.4 CP."], actuacion: commonActions }, facts, process, relationalFacts);
  }
  return pending("si hubo recepción legítima con obligación de devolver, mero acceso material o facultades de administración", context);
}

function damages(facts: PatrimonyFacts, process: ProcessualInput, relationalFacts: PublicSafetyFacts): PatrimonyOutcome {
  const context = deriveRelationalContext(relationalFacts);
  if (!facts.intencionalidadDano || facts.intencionalidadDano === "no_determinado") return pending("si el daño fue deliberado o accidental/imprudente", context, connectionsFor(facts, context));
  if (facts.danoInformatico) return resolved({ estado: "derivacion", resultado: "DAÑO INFORMÁTICO: DERIVAR", hecho: "Afectación a datos, programas, documentos electrónicos o sistemas.", tipoPenal: "Daños informáticos", norma: "Código Penal · arts. 264 y siguientes", avisos: [], porQue: ["No se integra automáticamente en el art. 263."], actuacion: commonActions }, facts, process, relationalFacts, false);
  if (facts.intencionalidadDano === "imprudente_accidental") {
    if (facts.imprudenciaGrave === true && facts.cuantiaAcreditada === true && (facts.cuantia ?? 0) > 80000) return resolved({ resultado: "DAÑOS POR IMPRUDENCIA GRAVE", hecho: "Daño imprudente grave superior a 80.000 €.", tipoPenal: "Daños imprudentes", norma: "Código Penal · art. 267", gravedad: "DELITO LEVE", avisos: ["PROCEDIBILIDAD: requiere denuncia de la persona agraviada o representante, con las especialidades legales."], porQue: ["No se aplica el art. 263 doloso."], actuacion: commonActions }, facts, process, relationalFacts);
    return resolved({ estado: "derivacion", resultado: "NO APLICAR ART. 263", hecho: "Daño accidental o imprudente sin los datos cerrados del art. 267.", tipoPenal: "Fuera del daño doloso", norma: "Código Penal · arts. 12 y 267", avisos: [], porQue: ["La existencia de perjuicio económico no convierte un accidente en daño doloso."], actuacion: ["Documentar causa, cuantía y circunstancias; tramitar por la vía que corresponda."] }, facts, process, relationalFacts, false);
  }
  if (facts.titularidad !== "ajena") return pending("que el daño recaiga sobre propiedad ajena", context);
  if (facts.cuantiaAcreditada !== true || facts.cuantia === undefined) return pending("la cuantía acreditada del daño; no puede tratarse como cero", context);
  const aggravated = facts.bienDominioUsoPublicoComunal || facts.danoImpedirAutoridad || facts.contagioGanado || facts.sustanciasVenenosasCorrosivas || facts.danoGraveSituacionEconomica || facts.danoEspecialGravedadInteresGeneral;
  if (facts.medioDestructivoOPeligroPersonas) return resolved({ estado: "derivacion", resultado: "DAÑOS CON MEDIO DE ESPECIAL PELIGROSIDAD", hecho: "Daño doloso mediante incendio, explosión, medio de potencia destructiva semejante o peligro para personas.", tipoPenal: "Derivación por daños conexos", norma: "Código Penal · art. 266", avisos: ["NO CERRAR GRAVEDAD SIN DETERMINAR EL TIPO BASE, EL MEDIO Y EL PELIGRO CONCRETOS."], porQue: ["La forma de ejecución desplaza la respuesta ordinaria del art. 263."], actuacion: commonActions }, facts, process, relationalFacts, false);
  return resolved({ resultado: aggravated ? "DAÑOS AGRAVADOS" : facts.cuantia <= 400 ? "DAÑOS · MODALIDAD LEVE" : "DAÑOS", hecho: "Daño deliberado en propiedad ajena.", tipoPenal: "Daños", norma: `Código Penal · art. ${aggravated ? "263.2" : "263.1"}`, gravedad: aggravated ? "DELITO MENOS GRAVE" : facts.cuantia <= 400 ? "DELITO LEVE" : "DELITO MENOS GRAVE", avisos: [], porQue: [aggravated ? "Concurre una circunstancia del art. 263.2; la cuantía reducida no mantiene la modalidad leve." : facts.cuantia <= 400 ? "La cuantía acreditada no excede de 400 € y no consta agravación del art. 263.2." : "La cuantía acreditada excede de 400 €."], actuacion: commonActions }, facts, process, relationalFacts);
}

export function resolvePatrimonyOutcome(facts: PatrimonyFacts, process: ProcessualInput = {}, relationalFacts: PublicSafetyFacts = {}): PatrimonyOutcome {
  const context = deriveRelationalContext(relationalFacts);
  const connections = connectionsFor(facts, context);
  if (!facts.hechoPrincipal || facts.hechoPrincipal === "no_claro") return pending("qué ocurrió principalmente: apoderamiento, recepción legítima seguida de apropiación o daño", context, connections);
  if (facts.titularidad === undefined || facts.titularidad === "no_determinada" || facts.titularidad === "compartida") return pending("la titularidad y ajenidad del bien", context, connections);
  if (facts.hechoPrincipal === "danos") return damages(facts, process, relationalFacts);
  if (facts.gradoEjecucion === undefined || facts.gradoEjecucion === "no_determinado") return pending("el grado de ejecución a partir de cuándo se inició, tomó o llegó a disponer del objeto; recuperarlo después no equivale a tentativa", context, connections);
  if (facts.hechoPrincipal === "recepcion") return appropriation(facts, process, relationalFacts);
  if (facts.intencionApropiacionBeneficio === undefined) return pending("si los actos muestran intención de apropiarse del bien o de obtener beneficio", context, connections);
  if (facts.sinConsentimiento === undefined) return pending("si el titular consintió la toma o disposición", context, connections);
  if (!facts.intencionApropiacionBeneficio || !facts.sinConsentimiento) return resolved({ estado: "derivacion", resultado: "NO CERRAR DELITO DE APODERAMIENTO", hecho: "No constan todos los elementos de apropiación sin consentimiento.", avisos: [], porQue: ["Falta intención de apropiación/beneficio o la toma no fue contra la voluntad del titular."], actuacion: ["Documentar el título de uso, autorización y voluntad del titular."] }, facts, process, relationalFacts, false);
  if (facts.violenciaFisica === undefined || facts.intimidacion === undefined) return pending("si existió violencia física o intimidación durante el apoderamiento, conservación o huida", context, connections);
  if (facts.violenciaFisica || facts.intimidacion) return robberyWithViolence(facts, process, relationalFacts);
  if (!facts.fuerza) return pending("los hechos materiales de acceso o salida: escalamiento, fractura, cerradura, llave o sistema de alarma", context, connections);
  if (facts.fuerza !== "ninguna") return robberyWithForce(facts, process, relationalFacts);
  return theft(facts, process, relationalFacts);
}
