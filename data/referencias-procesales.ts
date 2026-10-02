/** Referencias LECrim utilizadas por el motor procesal de seguridad pública. */
export type ReferenciaProcesal = {
  norma: "Ley de Enjuiciamiento Criminal";
  articulo: string;
  apartado?: string;
  titulo: string;
  fragmentoLegal: string;
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
    fuenteOficial: `${fuente}#a105`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-105-2": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 105.2 LECrim",
    apartado: "2",
    titulo: "Diligencias a prevención aunque falte denuncia",
    fragmentoLegal: "En los delitos perseguibles a instancias de la persona agraviada también podrá denunciar el Ministerio Fiscal si aquélla fuere menor de edad, persona con discapacidad necesitada de especial protección o desvalida. La ausencia de denuncia no impedirá la práctica de diligencias a prevención.",
    fuenteOficial: `${fuente}#a105`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-490-2": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 490.2 LECrim",
    apartado: "2.º",
    titulo: "Detención en flagrancia",
    fragmentoLegal: "Cualquier persona puede detener: [...] 2.º Al delincuente in fraganti.",
    fuenteOficial: `${fuente}#a490`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-492-1": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 492.1 LECrim",
    apartado: "1.º",
    titulo: "Deber de detener por la Policía Judicial",
    fragmentoLegal: "La Autoridad o agente de Policía judicial tendrá obligación de detener: 1.º A cualquiera que se halle en alguno de los casos del artículo 490.",
    fuenteOficial: `${fuente}#a492`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-492-4": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 492.4 LECrim",
    apartado: "4.º",
    titulo: "Persona todavía no procesada: presupuestos de detención",
    fragmentoLegal: "Al que estuviere en el caso del número anterior, aunque todavía no se hallase procesado, con tal que concurran las dos circunstancias siguientes: 1.ª Que la Autoridad o agente tenga motivos racionalmente bastantes para creer en la existencia de un hecho que presente los caracteres de delito. 2.ª Que los tenga también bastantes para creer que la persona a quien intente detener tuvo participación en él.",
    fuenteOficial: `${fuente}#a492`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-493": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 493 LECrim",
    titulo: "Identificación cuando no se detiene",
    fragmentoLegal: "La Autoridad o agente de Policía judicial tomará nota del nombre, apellido, domicilio y demás circunstancias bastantes para la averiguación e identificación de la persona [...] a quienes no detuviere por no estar comprendidos en ninguno de los casos del artículo anterior.",
    fuenteOficial: `${fuente}#a493`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
  "lecrim-495": {
    norma: "Ley de Enjuiciamiento Criminal",
    articulo: "Art. 495 LECrim",
    titulo: "Límite de la detención por delito leve",
    fragmentoLegal: "No se podrá detener por la presunta comisión de delitos leves, a no ser que el presunto reo no tuviese domicilio conocido ni diese fianza bastante, a juicio de la autoridad o agente que intente detenerle.",
    fuenteOficial: `${fuente}#a495`,
    version: "Texto consolidado BOE; verificado el 02/10/2026 (última actualización publicada el 09/04/2026).",
  },
} as const satisfies Record<string, ReferenciaProcesal>;

export type ReferenciaProcesalId = keyof typeof referenciasProcesales;
export type UsoReferenciaProcesal = { id: ReferenciaProcesalId; aplicacionAlCaso: string; conclusion: string };

export const obtenerReferenciaProcesal = (id: ReferenciaProcesalId): ReferenciaProcesal => referenciasProcesales[id];
