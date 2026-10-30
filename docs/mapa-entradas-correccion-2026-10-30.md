# Mapa de entradas y controles · corrección integral

Fecha: 30/10/2026. Se inventarían los 168 campos declarados en `PatrimonyFacts` (77), `PublicSafetyFacts` (71) y `ProcessualInput` (20). El enlace de cada fila localiza el enlace del control o su descriptor en el formulario; los controles repetidos por `map` comparten línea. Esta correspondencia de código se complementa con las comprobaciones reales de navegador descritas en el [informe](informe-correccion-integral-2026-10-30.md).

Los campos de compatibilidad se identifican expresamente. Los nueve campos sin lectura funcional se conservan para no romper contratos anteriores y no participan en la decisión: no se crea una pregunta para una entrada sin efecto. `soportes` documenta el relato y la copia, pero no cambia por sí solo el tipo penal. La existencia de un control no certifica la corrección jurídica de todo resultado.

## PatrimonyFacts

Contrato: [data/patrimonio.ts](../data/patrimonio.ts).

| Entrada | Control o tratamiento | Ubicación |
| --- | --- | --- |
| `hechoPrincipal` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L357](../app/seguridad-publica.tsx#L357) |
| `fechaHecho` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L363](../app/seguridad-publica.tsx#L363) |
| `relacionArt268` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L365](../app/seguridad-publica.tsx#L365) |
| `titularidad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L369](../app/seguridad-publica.tsx#L369) |
| `posesionPrevia` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L393](../app/seguridad-publica.tsx#L393) |
| `intencionApropiacionBeneficio` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L372](../app/seguridad-publica.tsx#L372) |
| `sinConsentimiento` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L373](../app/seguridad-publica.tsx#L373) |
| `recepcionLegitima` | Se deriva del selector de posesión previa: entrega legítima al autor. No exige otra respuesta duplicada. | Derivación descrita en esta fila. |
| `obligacionDevolverEntregar` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L394](../app/seguridad-publica.tsx#L394) |
| `facultadesAdministracion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L394](../app/seguridad-publica.tsx#L394) |
| `excesoFacultadesConPerjuicio` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L394](../app/seguridad-publica.tsx#L394) |
| `autorizacionDisposicion` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `relacionLaboralProfesional` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `conductaApropiacionONegacion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L394](../app/seguridad-publica.tsx#L394) |
| `enganoPrevioActoDisposicion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L394](../app/seguridad-publica.tsx#L394) |
| `viaApropiacionFuera253` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L394](../app/seguridad-publica.tsx#L394) |
| `cuantia` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L427](../app/seguridad-publica.tsx#L427) |
| `cuantiaAcreditada` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L427](../app/seguridad-publica.tsx#L427) |
| `gradoEjecucion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L421](../app/seguridad-publica.tsx#L421) |
| `efectoRecuperado` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `fuerza` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L387](../app/seguridad-publica.tsx#L387) |
| `fuerzaParaAccederOAbandonar` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `violenciaFisica` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L374](../app/seguridad-publica.tsx#L374) |
| `intimidacion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L375](../app/seguridad-publica.tsx#L375) |
| `momentoViolencia` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L377](../app/seguridad-publica.tsx#L377) |
| `conexionViolenciaApoderamiento` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L378](../app/seguridad-publica.tsx#L378) |
| `armaPresente` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L381](../app/seguridad-publica.tsx#L381) |
| `armaUsada` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L382](../app/seguridad-publica.tsx#L382) |
| `lesionAutonoma` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L383](../app/seguridad-publica.tsx#L383) |
| `amenazaCoaccionAutonoma` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L384](../app/seguridad-publica.tsx#L384) |
| `dispositivoAntihurtoEnCosaNeutralizado` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L389](../app/seguridad-publica.tsx#L389) |
| `telefonoODispositivo235` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L389](../app/seguridad-publica.tsx#L389) |
| `existenciaComercialVentaAlmacenExposicion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L389](../app/seguridad-publica.tsx#L389) |
| `valorArtisticoHistoricoCulturalCientifico` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L419](../app/seguridad-publica.tsx#L419) |
| `primeraNecesidadConDesabastecimiento` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L431](../app/seguridad-publica.tsx#L431) |
| `infraestructuraConQuebrantoGrave` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L431](../app/seguridad-publica.tsx#L431) |
| `productoAgrarioGanaderoEnExplotacion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L431](../app/seguridad-publica.tsx#L431) |
| `especialGravedadValorPerjuicio` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L431](../app/seguridad-publica.tsx#L431) |
| `graveSituacionEconomicaOAbusoCircunstancias` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L431](../app/seguridad-publica.tsx#L431) |
| `usaMenorDieciseis` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L431](../app/seguridad-publica.tsx#L431) |
| `miembroOrganizacionGrupoCriminal` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L431](../app/seguridad-publica.tsx#L431) |
| `intervienenDosPersonas` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `tipoLugar` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L380](../app/seguridad-publica.tsx#L380) |
| `especialGravedad2414` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L391](../app/seguridad-publica.tsx#L391) |
| `agravacion250Acreditada` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L436](../app/seguridad-publica.tsx#L436) |
| `agravacion250Especial` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L436](../app/seguridad-publica.tsx#L436) |
| `estadoCondenasPrevias` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L434](../app/seguridad-publica.tsx#L434) |
| `numeroCondenasEjecutorias` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L434](../app/seguridad-publica.tsx#L434) |
| `condenasMismaNaturaleza` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L434](../app/seguridad-publica.tsx#L434) |
| `algunaCondenaLeve` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L434](../app/seguridad-publica.tsx#L434) |
| `todasCondenasMenosGravesOGraves` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L434](../app/seguridad-publica.tsx#L434) |
| `condenasCanceladasOCancelables` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L434](../app/seguridad-publica.tsx#L434) |
| `requisitosCondenasCompletos` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L434](../app/seguridad-publica.tsx#L434) |
| `numeroEpisodios` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L420](../app/seguridad-publica.tsx#L420) |
| `nexoPlanOcasionComunAcreditado` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L420](../app/seguridad-publica.tsx#L420) |
| `separacionConyugal` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L366](../app/seguridad-publica.tsx#L366) |
| `procesoSeparacionDivorcioNulidad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L366](../app/seguridad-publica.tsx#L366) |
| `vinculoFamiliar268` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L367](../app/seguridad-publica.tsx#L367) |
| `afinPrimerGradoConvive` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L367](../app/seguridad-publica.tsx#L367) |
| `abusoVulnerabilidadEdadDiscapacidad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L368](../app/seguridad-publica.tsx#L368) |
| `terceroExtranoParticipa` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L368](../app/seguridad-publica.tsx#L368) |
| `intencionalidadDano` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L397](../app/seguridad-publica.tsx#L397) |
| `danoInformatico` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L398](../app/seguridad-publica.tsx#L398) |
| `imprudenciaGrave` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L402](../app/seguridad-publica.tsx#L402) |
| `bienDominioUsoPublicoComunal` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L403](../app/seguridad-publica.tsx#L403) |
| `danoImpedirAutoridad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L404](../app/seguridad-publica.tsx#L404) |
| `contagioGanado` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L405](../app/seguridad-publica.tsx#L405) |
| `sustanciasVenenosasCorrosivas` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L406](../app/seguridad-publica.tsx#L406) |
| `danoGraveSituacionEconomica` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L407](../app/seguridad-publica.tsx#L407) |
| `danoEspecialGravedadInteresGeneral` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L408](../app/seguridad-publica.tsx#L408) |
| `medioDestructivoOPeligroPersonas` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L409](../app/seguridad-publica.tsx#L409) |
| `medioDano` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L411](../app/seguridad-publica.tsx#L411) |
| `peligroVidaIntegridad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L412](../app/seguridad-publica.tsx#L412) |
| `bienEspecial266` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L413](../app/seguridad-publica.tsx#L413) |
| `danoGraveOInutilizacionMilitar` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L413](../app/seguridad-publica.tsx#L413) |
| `interrupcionObstaculizacionServicio` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L413](../app/seguridad-publica.tsx#L413) |
| `denunciaOQuerella` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L489](../app/seguridad-publica.tsx#L489) |

## PublicSafetyFacts

Contrato: [data/seguridad-publica.ts](../data/seguridad-publica.ts).

| Entrada | Control o tratamiento | Ubicación |
| --- | --- | --- |
| `sexoAutor` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L209](../app/seguridad-publica.tsx#L209) |
| `sexoVictima` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L207](../app/seguridad-publica.tsx#L207) |
| `parejaExpareja` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L194](../app/seguridad-publica.tsx#L194) |
| `relacionFamiliar` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L195](../app/seguridad-publica.tsx#L195) |
| `convivencia` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L211](../app/seguridad-publica.tsx#L211) |
| `hechosRelacion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L112](../app/seguridad-publica.tsx#L112) |
| `episodiosPrevios` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L114](../app/seguridad-publica.tsx#L114) |
| `noDeseaDenunciar` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L184](../app/seguridad-publica.tsx#L184) |
| `agresionFisica` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L131](../app/seguridad-publica.tsx#L131) |
| `lesion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L132](../app/seguridad-publica.tsx#L132) |
| `resultadoAsistencial` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L135](../app/seguridad-publica.tsx#L135) |
| `medioPeligroso` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L118](../app/seguridad-publica.tsx#L118) |
| `personaEspecialmenteVulnerableConvive` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L212](../app/seguridad-publica.tsx#L212) |
| `signosLesion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L133](../app/seguridad-publica.tsx#L133) |
| `peligroConcretoLesion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L138](../app/seguridad-publica.tsx#L138) |
| `ensanamientoAlevosiaDocumentado` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L134](../app/seguridad-publica.tsx#L134) |
| `victimaMenorCatorce` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L134](../app/seguridad-publica.tsx#L134) |
| `discapacidadEspecialProteccion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L134](../app/seguridad-publica.tsx#L134) |
| `presenciaMenores` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L110](../app/seguridad-publica.tsx#L110) |
| `armaUtilizada` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L113](../app/seguridad-publica.tsx#L113) |
| `domicilioComunOVictima` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L111](../app/seguridad-publica.tsx#L111) |
| `medidaQuebrantada` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L116](../app/seguridad-publica.tsx#L116) |
| `denunciaOQuerella` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L489](../app/seguridad-publica.tsx#L489) |
| `propositoConseguido` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L118](../app/seguridad-publica.tsx#L118) |
| `condicionConductaDebida` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L118](../app/seguridad-publica.tsx#L118) |
| `acosoReiterado` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L120](../app/seguridad-publica.tsx#L120) |
| `alteracionVidaCotidiana` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L120](../app/seguridad-publica.tsx#L120) |
| `conductaAcoso` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L120](../app/seguridad-publica.tsx#L120) |
| `medidaVigenteConocida` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L116](../app/seguridad-publica.tsx#L116) |
| `incumplimientoMedida` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L116](../app/seguridad-publica.tsx#L116) |
| `medidaRelacion1732` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L116](../app/seguridad-publica.tsx#L116) |
| `privadoLibertad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L116](../app/seguridad-publica.tsx#L116) |
| `dispositivoControlManipulado` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L116](../app/seguridad-publica.tsx#L116) |
| `habitualidadDocumentada` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L115](../app/seguridad-publica.tsx#L115) |
| `vejacionInjuriaLeve` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L117](../app/seguridad-publica.tsx#L117) |
| `prevalimientoRelacion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `actosPresenciadosDelictivos` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `propuestaEncuentroYAcercamiento` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `embaucarMaterialPornografico` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `resultadoEspecialGravedad` | Compatibilidad anterior. La interfaz pide signos observados y asistencia sanitaria; no pide al agente que elija una gravedad jurídica. | Derivación descrita en esta fila. |
| `indiciosFinalidadMatar` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L140](../app/seguridad-publica.tsx#L140) |
| `contextoSexual` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L142](../app/seguridad-publica.tsx#L142) |
| `tipoRina` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L163](../app/seguridad-publica.tsx#L163) |
| `lesionIndividualizable` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L166](../app/seguridad-publica.tsx#L166) |
| `victimaAgente` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L167](../app/seguridad-publica.tsx#L167) |
| `conductaSexualReferida` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `actoSexualNoConsentido` | Compatibilidad anterior. Sustituido en la interfaz por conducta referida, tramo de edad y estado del consentimiento. Un valor negativo no excluye por sí solo la vía de menores de 16. | Derivación descrita en esta fila. |
| `penetracion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `violenciaIntimidacion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `dificultadDecidir` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `variasPersonas` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L123](../app/seguridad-publica.tsx#L123) |
| `posibleSumisionQuimica` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L153](../app/seguridad-publica.tsx#L153) |
| `menorDieciseis` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `autorMayorEdad` | Compatibilidad anterior. Se deriva del tramo de edad comprobado; no se presume mayoría de edad al iniciar el formulario. | Derivación descrita en esta fila. |
| `conductaSexual` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `estadoConsentimiento` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `voluntadAnulada` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L121](../app/seguridad-publica.tsx#L121) |
| `abusoSuperioridad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L213](../app/seguridad-publica.tsx#L213) |
| `vulnerabilidadEspecial` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L120](../app/seguridad-publica.tsx#L120) |
| `violenciaExtremaDegradante` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L124](../app/seguridad-publica.tsx#L124) |
| `sustanciasAdministradas` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L126](../app/seguridad-publica.tsx#L126) |
| `organizacionCriminal` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L127](../app/seguridad-publica.tsx#L127) |
| `posibleExcepcion183Bis` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L127](../app/seguridad-publica.tsx#L127) |
| `amenazasAutonomas` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L156](../app/seguridad-publica.tsx#L156) |
| `tiempoTranscurridoSuperior72h` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `procedibilidadSexual` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L184](../app/seguridad-publica.tsx#L184) |
| `conductaLibertad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L171](../app/seguridad-publica.tsx#L171) |
| `malAnunciado` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L118](../app/seguridad-publica.tsx#L118) |
| `condicionImpuesta` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L118](../app/seguridad-publica.tsx#L118) |
| `coaccionEntidad` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L119](../app/seguridad-publica.tsx#L119) |
| `soportes` | Pregunta de soportes disponibles; documenta, sin calificación automática. | [Formulario L181](../app/seguridad-publica.tsx#L181) |

## ProcessualInput

Contrato: [data/procesal-penal.ts](../data/procesal-penal.ts).

| Entrada | Control o tratamiento | Ubicación |
| --- | --- | --- |
| `flagrante` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L495](../app/seguridad-publica.tsx#L495) |
| `plenamenteIdentificado` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `localizable` | Compatibilidad sin lectura en el resolutor; no determina un resultado. | Declaración del contrato; sin control ni efecto. |
| `indiciosHechoSuficientes` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L497](../app/seguridad-publica.tsx#L497) |
| `indiciosParticipacionSuficientes` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L498](../app/seguridad-publica.tsx#L498) |
| `intentoFugaElusion` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L501](../app/seguridad-publica.tsx#L501) |
| `identidadODomicilioNoVerificables` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L502](../app/seguridad-publica.tsx#L502) |
| `riesgoConcretoIncomparecencia` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L503](../app/seguridad-publica.tsx#L503) |
| `riesgoOcultacionPruebas` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L504](../app/seguridad-publica.tsx#L504) |
| `riesgoConcretoVictimaTestigos` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L505](../app/seguridad-publica.tsx#L505) |
| `domicilioConocido` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L491](../app/seguridad-publica.tsx#L491) |
| `fianzaBastante` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L492](../app/seguridad-publica.tsx#L492) |
| `edadAutor` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L487](../app/seguridad-publica.tsx#L487) |
| `autorMayorEdad` | Compatibilidad anterior. Se deriva del tramo de edad comprobado; no se presume mayoría de edad al iniciar el formulario. | Derivación descrita en esta fila. |
| `gravedad` | Derivada del supuesto penal seleccionado y de sus penas. No es una valoración libre del usuario. | Derivación descrita en esta fila. |
| `procedibilidad` | Derivada del supuesto y su cauce de denuncia/Fiscalía. | Derivación descrita en esta fila. |
| `denunciaOQuerella` | Control visible en el recorrido correspondiente; sin respuesta conserva el dato pendiente. | [Formulario L489](../app/seguridad-publica.tsx#L489) |
| `atribucionPendiente` | Derivada de los datos de atribución todavía insuficientes; impide cerrar la situación procesal. | Derivación descrita en esta fila. |
| `alternativasPenales` | Derivadas de alternativas del catálogo cuando no cabe cerrar una sola calificación. | Derivación descrita en esta fila. |
| `supuestosConcurrentes` | Derivados de los resultados penales concurrentes; no son una selección manual de detención. | Derivación descrita en esta fila. |

## Visibilidad y limpieza al cambiar respuestas

- Patrimonio: el hecho principal reinicia el recorrido; el cambio de arma limpia su uso; momento y conexión de la violencia limpian fuerza, lugar y arma; fuerza limpia lugar y gravedad del inmueble. Las agravaciones del hurto no califican un robo violento.
- Las condenas verificadas muestran número, naturaleza, gravedad, cancelación y documentación. Cambiar el estado de verificación limpia esas respuestas. No constar una comprobación no equivale a comprobar ausencia de condenas computables.
- El vínculo familiar controla parentesco, convivencia y separación; cambiarlo borra respuestas subordinadas. Un parentesco oculto no activa la excusa del art. 268.
- Los medios de daño muestran solo las circunstancias del medio seleccionado. Cambiar intencionalidad, medio o bien especial limpia las respuestas que dejan de pertenecer al recorrido.
- Violencia sexual: cambiar conducta, tramo de edad de la víctima o clase de conducta limpia consentimiento, penetración, agravaciones y procedibilidad subordinados. La edad del presunto autor se comprueba por separado.
- Procesal: cambiar edad, flagrancia o un presupuesto de indicios limpia las circunstancias dependientes. El domicilio no verificado se distingue del riesgo concreto de incomparecencia.
- Alcohol: lectura vacía o inválida y cambios de vehículo, conductor, metrología, negativa o sanción previa invalidan la confirmación y eliminan el resultado anterior.

Implementación: [transiciones públicas](../data/fact-transitions.ts), [revisión y transiciones patrimoniales](../data/patrimony-review.ts), [controles](../app/seguridad-publica.tsx) y [alcohol](../app/alcoholemia.tsx).
