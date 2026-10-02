/** Referencias LECrim utilizadas por el motor procesal de seguridad pública. */
export type ReferenciaProcesal = {
  norma: "Ley de Enjuiciamiento Criminal";
  articulo: string;
  apartado?: string;
  titulo: string;
  fragmentoLegal: string;
  explicacionOperativa: string;
  fuenteOficial: string;
  version: string;
};

const fuente = "https://www.boe.es/buscar/act.php?id=BOE-A-1882-6036";

export const referenciasProcesales = {
  "lecrim-105-1": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 105.1 LECrim",
    apartado: "1",
    titulo: "Ejercicio de la acción penal de oficio",
    fragmentoLegal: "Los funcionarios del Ministerio Fiscal tendrán la obligación de ejercitar, con arreglo a las disposiciones de la Ley, todas las acciones penales que consideren procedentes, haya o no acusador particular en las causas, menos aquellas que el Código Penal reserva exclusivamente a la querella privada.",
    explicacionOperativa: "El motor distingue los delitos perseguibles de oficio de aquellos cuya persecución exige una iniciativa específica de la persona agraviada u otra vía legal de procedibilidad.",
    fuenteOficial: `${fuente}#a105`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-105-2": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 105.2 LECrim",
    apartado: "2",
    titulo: "Diligencias a prevención aunque falte denuncia",
    fragmentoLegal: "En los delitos perseguibles a instancias de la persona agraviada también podrá denunciar el Ministerio Fiscal si aquélla fuere menor de edad, persona con discapacidad necesitada de especial protección o desvalida. La ausencia de denuncia no impedirá la práctica de diligencias a prevención.",
    explicacionOperativa: "El motor usa esta regla para que la falta de denuncia no paralice las primeras diligencias y para distinguir esa actuación inicial de la condición de procedibilidad que corresponda al delito.",
    fuenteOficial: `${fuente}#a105`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-490-2": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 490.2 LECrim",
    apartado: "2.º",
    titulo: "Detención en flagrancia",
    fragmentoLegal: "Cualquier persona puede detener: [...] 2.º Al delincuente in fraganti.",
    explicacionOperativa: "El motor contrasta este supuesto con el hecho indicado por el usuario: que la persona fue sorprendida durante la comisión o inmediatamente después.",
    fuenteOficial: `${fuente}#a490`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-492-1": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 492.1 LECrim",
    apartado: "1.º",
    titulo: "Deber de detener por la Policía Judicial",
    fragmentoLegal: "La Autoridad o agente de Policía judicial tendrá obligación de detener: 1.º A cualquiera que se halle en alguno de los casos del artículo 490.",
    explicacionOperativa: "Esta regla conecta la flagrancia apreciada conforme al art. 490 con la actuación de la Autoridad o agente de Policía Judicial.",
    fuenteOficial: `${fuente}#a492`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-492-4": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 492.4 LECrim",
    apartado: "4.º",
    titulo: "Persona todavía no procesada: presupuestos de detención",
    fragmentoLegal: "Al que estuviere en el caso del número anterior, aunque todavía no se hallase procesado, con tal que concurran las dos circunstancias siguientes: 1.ª Que la Autoridad o agente tenga motivos racionalmente bastantes para creer en la existencia de un hecho que presente los caracteres de delito. 2.ª Que los tenga también bastantes para creer que la persona a quien intente detener tuvo participación en él.",
    explicacionOperativa: "El apartado se remite al supuesto precedente y exige además indicios racionales del hecho y de la participación. El motor comprueba estos dos indicios por separado y muestra las circunstancias concretas seleccionadas por el usuario como razonamiento propio de la app.",
    fuenteOficial: `${fuente}#a492`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-493": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 493 LECrim",
    titulo: "Identificación cuando no se detiene",
    fragmentoLegal: "La Autoridad o agente de Policía judicial tomará nota del nombre, apellido, domicilio y demás circunstancias bastantes para la averiguación e identificación de la persona [...] a quienes no detuviere por no estar comprendidos en ninguno de los casos del artículo anterior.",
    explicacionOperativa: "Cuando el resultado del motor es no detener, esta regla fundamenta documentar los datos bastantes de identificación y trasladarlos al órgano judicial competente.",
    fuenteOficial: `${fuente}#a493`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-495": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 495 LECrim",
    titulo: "Límite de la detención por delito leve",
    fragmentoLegal: "No se podrá detener por la presunta comisión de delitos leves, a no ser que el presunto reo no tuviese domicilio conocido ni diese fianza bastante, a juicio de la autoridad o agente que intente detenerle.",
    explicacionOperativa: "El motor parte de la prohibición de detener por delito leve y solo muestra la excepción cuando se han indicado conjuntamente falta de domicilio conocido y falta de fianza bastante.",
    fuenteOficial: `${fuente}#a495`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
} as const satisfies Record<string, ReferenciaProcesal>;

export type ReferenciaProcesalId = keyof typeof referenciasProcesales;
export type UsoReferenciaProcesal = { id: ReferenciaProcesalId; aplicacionAlCaso: string };

export const obtenerReferenciaProcesal = (id: ReferenciaProcesalId): ReferenciaProcesal => referenciasProcesales[id];
