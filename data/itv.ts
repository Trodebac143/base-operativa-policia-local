import type { DecisionTree, OperationalCase, PoliceMeasure, Rule } from "./types";

const common = {
  modulo: "seguridad_vial",
  categoria: "seguridad_vial_itv",
  responsable: "Titular o arrendatario a largo plazo inscrito",
  competencia_denuncia: "Policía Local de Torrent — órgano actuante y formulador de la denuncia",
  competencia_resuelve: "Jefatura Provincial de Tráfico de Valencia",
  alerta_penal: false,
  referencia_penal: null,
  estado: "validado" as const,
};

export const itvCases: OperationalCase[] = [
  {
    ...common, id: "TR-ITV-OP-001", titulo: "ITV vencida — circulando", palabras_clave: ["ITV", "caducada", "vencida", "circulando", "5A"],
    que_comprobar: ["Fecha en que era exigible la inspección periódica.", "Estado ITV en el Registro de Vehículos y documentación disponible.", "Circulación efectiva del vehículo.", "Existencia separada de deficiencias técnicas actuales."],
    resultado: "Vehículo circulando sin haber superado la inspección técnica periódica en el plazo debido.", norma: "Reglamento General de Vehículos", articulo: "10.1, en relación con el art. 76.o LSV", codificado: "VEH 10.1 5A", calificacion: "grave", importe_fijo: 200, importe_reducido: 100,
    actuacion: ["Comprobar y documentar el estado ITV.", "Formular denuncia con el codificado indicado y remitirla a la Jefatura Provincial de Tráfico de Valencia.", "Informar de la obligación de someter el vehículo a inspección.", "Comprobar por separado si existen deficiencias técnicas actuales."],
    medidas: ["TR-MED-ITV-CHECK"], advertencias: ["La ITV vencida no acredita por sí sola una deficiencia técnica ni justifica la inmovilización.", "La retirada y el depósito exigen un supuesto autónomo del artículo 105 LSV."], fuentes: ["TR-ITV-SRC-001", "TR-ITV-SRC-002", "TR-ITV-SRC-003", "TR-ITV-SRC-007"], fichas_juridicas: ["TR-ITV-FJ-001", "TR-ITV-FJ-004", "TR-ITV-FJ-005", "TR-ITV-FJ-006"]
  },
  {
    ...common, id: "TR-ITV-OP-002", titulo: "ITV vencida — estacionado en vía pública", palabras_clave: ["ITV", "caducada", "vencida", "estacionado", "5A"],
    que_comprobar: ["Fecha en que era exigible la inspección periódica.", "Alta y puesta en circulación del vehículo.", "Estacionamiento en vía pública y circunstancias relevantes para la proporcionalidad.", "Existencia de abandono u otro presupuesto jurídico independiente."],
    resultado: "Vehículo estacionado en vía pública sin haber superado la inspección técnica periódica en el plazo debido.", norma: "Reglamento General de Vehículos", articulo: "10.1, en relación con el art. 76.o LSV", codificado: "VEH 10.1 5A", calificacion: "grave", importe_fijo: 200, importe_reducido: 100,
    actuacion: ["Comprobar y documentar el estado ITV y la situación del vehículo.", "Aplicar el criterio de proporcionalidad.", "Formular denuncia con el codificado indicado y remitirla a la Jefatura Provincial de Tráfico de Valencia."],
    medidas: ["TR-MED-ITV-CHECK"], advertencias: ["El mero vencimiento no permite presumir defectos técnicos actuales.", "No procede inmovilización, retirada ni depósito por el solo vencimiento; cada medida requiere su propia causa legal."], fuentes: ["TR-ITV-SRC-001", "TR-ITV-SRC-002", "TR-ITV-SRC-003", "TR-ITV-SRC-004", "TR-ITV-SRC-007"], fichas_juridicas: ["TR-ITV-FJ-001", "TR-ITV-FJ-004", "TR-ITV-FJ-005", "TR-ITV-FJ-006"]
  },
  {
    ...common, id: "TR-ITV-OP-003", titulo: "ITV desfavorable — dentro del plazo", palabras_clave: ["ITV", "desfavorable", "segunda inspección", "taller", "5C"],
    que_comprobar: ["Informe ITV, defectos graves y fecha límite de segunda inspección.", "Origen, destino y finalidad real del desplazamiento.", "Necesidad del traslado al taller o regularización, o de la vuelta a la estación ITV.", "Coherencia de la ruta y ausencia de usos intermedios."],
    resultado: "Dentro del plazo, solo están permitidos los desplazamientos necesarios para subsanar las deficiencias y volver a la inspección. Cualquier otro desplazamiento constituye infracción.", norma: "RD 920/2017 y Reglamento General de Vehículos", articulo: "11.2 RD 920/2017 y 10.1 RGV, en relación con el art. 76.o LSV", calificacion: null,
    actuacion: ["Verificar y documentar la finalidad y coherencia del trayecto.", "Si el desplazamiento está permitido, dejar constancia de la comprobación sin formular denuncia 5C.", "Si no está amparado, formular denuncia 5C y remitirla a la Jefatura Provincial de Tráfico de Valencia.", "Advertir de la limitación de circulación hasta superar la inspección."],
    medidas: ["TR-MED-ITV-CHECK", "TR-MED-WARN-NOCIRC"], advertencias: ["La ITV desfavorable no genera inmovilización automática.", "El plazo concedido para la segunda inspección no puede superar dos meses desde la primera inspección desfavorable."],
    datos_adicionales: { encaje_condicional: [{ supuesto: "Trayecto necesario y coherente para subsanar las deficiencias o volver a la ITV", articulo: "11.2 RD 920/2017", calificacion: "sin infracción ITV" }, { supuesto: "Cualquier otro desplazamiento", articulo: "10.1 RGV y 76.o LSV", calificacion: "grave", codificado: "VEH 10.1 5C", importe_fijo: 200, importe_reducido: 100 }] },
    fuentes: ["TR-ITV-SRC-001", "TR-ITV-SRC-002", "TR-ITV-SRC-003", "TR-ITV-SRC-007"], fichas_juridicas: ["TR-ITV-FJ-002", "TR-ITV-FJ-003", "TR-ITV-FJ-004", "TR-ITV-FJ-005", "TR-ITV-FJ-006"]
  },
  {
    ...common, id: "TR-ITV-OP-004", titulo: "ITV desfavorable — plazo máximo superado", palabras_clave: ["ITV", "desfavorable", "fuera de plazo", "5D", "5E"],
    que_comprobar: ["Primera inspección desfavorable y fecha límite concedida.", "Que se ha superado el plazo máximo para la segunda inspección.", "Si existe circulación efectiva o el vehículo está estacionado/puesto en circulación.", "Deficiencias técnicas actuales, separadamente."],
    resultado: "No se ha superado la segunda inspección dentro del plazo máximo; debe seleccionarse la salida según la situación real del vehículo.", norma: "RD 920/2017 y Reglamento General de Vehículos", articulo: "11.2 y 11.4 RD 920/2017 y 10.1 RGV", calificacion: null,
    actuacion: ["Acreditar que el plazo está superado.", "Seleccionar la salida según circulación efectiva o estacionamiento/puesta en circulación.", "Formular denuncia y remitirla a la Jefatura Provincial de Tráfico de Valencia.", "Informar de que, fuera de plazo, procede una inspección completa."],
    medidas: ["TR-MED-ITV-CHECK", "TR-MED-WARN-NOCIRC"], advertencias: ["No existe inmovilización automática por el resultado desfavorable ni por superar el plazo.", "Retirada y depósito solo pueden acordarse si concurre un supuesto autónomo del artículo 105 LSV."],
    datos_adicionales: { encaje_condicional: [{ supuesto: "Vehículo circulando", articulo: "10.1 RGV y 77.ll LSV", calificacion: "muy grave", codificado: "VEH 10.1 5D", importe_fijo: 500, importe_reducido: 250 }, { supuesto: "Vehículo estacionado o puesto en circulación", articulo: "10.1 RGV y 76.o LSV", calificacion: "grave", codificado: "VEH 10.1 5E", importe_fijo: 200, importe_reducido: 100 }] },
    fuentes: ["TR-ITV-SRC-001", "TR-ITV-SRC-002", "TR-ITV-SRC-003", "TR-ITV-SRC-004", "TR-ITV-SRC-007"], fichas_juridicas: ["TR-ITV-FJ-003", "TR-ITV-FJ-004", "TR-ITV-FJ-005", "TR-ITV-FJ-006"]
  },
  {
    ...common, id: "TR-ITV-OP-005", titulo: "ITV negativa — circulando", palabras_clave: ["ITV", "negativa", "circulando", "grúa", "5B"],
    que_comprobar: ["Resultado negativo e informe de defectos muy graves.", "Circulación autopropulsada.", "Estado técnico actual y posible reparación posterior.", "Forma en que el vehículo llegó al lugar."],
    resultado: "Vehículo con resultado ITV negativo circulando por sus propios medios.", norma: "RD 920/2017 y Reglamento General de Vehículos", articulo: "9 y 11.3 RD 920/2017 y 10.1 RGV, en relación con el art. 77.ll LSV", codificado: "VEH 10.1 5B", calificacion: "muy grave", importe_fijo: 500, importe_reducido: 250,
    actuacion: ["Formular denuncia y remitirla a la Jefatura Provincial de Tráfico de Valencia.", "Impedir la continuación autopropulsada.", "Exigir el transporte mediante medios ajenos, como grúa o plataforma.", "Acordar inmovilización únicamente si las deficiencias actuales constituyen riesgo especialmente grave y motivar ese presupuesto."],
    medidas: ["TR-MED-ITV-CHECK", "TR-MED-WARN-NOCIRC", "TR-MED-EXT-TRANSPORT", "TR-MED-IMMOB-104B"], advertencias: ["La ITV negativa no genera automáticamente retirada ni depósito.", "La inmovilización exige acreditar deficiencias actuales que constituyan riesgo especialmente grave; no deriva automáticamente de la anotación ITV."], fuentes: ["TR-ITV-SRC-001", "TR-ITV-SRC-002", "TR-ITV-SRC-003", "TR-ITV-SRC-007"], fichas_juridicas: ["TR-ITV-FJ-002", "TR-ITV-FJ-003", "TR-ITV-FJ-004", "TR-ITV-FJ-005", "TR-ITV-FJ-006"]
  },
  {
    ...common, id: "TR-ITV-OP-006", titulo: "ITV negativa — estacionado o puesto en circulación", palabras_clave: ["ITV", "negativa", "estacionado", "grúa", "5F"],
    que_comprobar: ["Resultado negativo e informe de defectos muy graves.", "Ubicación en vía pública e indicios de puesta en circulación.", "Deficiencias técnicas actuales.", "Existencia independiente de peligro, obstáculo u otro presupuesto de retirada."],
    resultado: "Vehículo con última ITV negativa estacionado o puesto en circulación en vía pública.", norma: "RD 920/2017 y Reglamento General de Vehículos", articulo: "11.3 RD 920/2017 y 10.1 RGV, en relación con el art. 76.o LSV", codificado: "VEH 10.1 5F", calificacion: "grave", importe_fijo: 200, importe_reducido: 100,
    actuacion: ["Precisar en la denuncia el hecho observado.", "Formular denuncia y remitirla a la Jefatura Provincial de Tráfico de Valencia.", "Advertir que el vehículo no puede retirarse por sus propios medios.", "Permitir que el responsable organice transporte privado mediante medios ajenos."],
    medidas: ["TR-MED-ITV-CHECK", "TR-MED-WARN-NOCIRC", "TR-MED-EXT-TRANSPORT"], advertencias: ["La anotación negativa no genera automáticamente inmovilización, retirada ni depósito.", "La retirada administrativa exige peligro, obstáculo u otro supuesto tasado del artículo 105 LSV."], fuentes: ["TR-ITV-SRC-001", "TR-ITV-SRC-002", "TR-ITV-SRC-003", "TR-ITV-SRC-004", "TR-ITV-SRC-007"], fichas_juridicas: ["TR-ITV-FJ-002", "TR-ITV-FJ-003", "TR-ITV-FJ-004", "TR-ITV-FJ-005", "TR-ITV-FJ-006"]
  },
  {
    ...common, id: "TR-ITV-OP-007", titulo: "Deficiencias técnicas actuales con riesgo especialmente grave", palabras_clave: ["deficiencias", "técnicas", "riesgo", "inmovilización", "104", "retirada", "depósito"],
    que_comprobar: ["Deficiencia técnica observable o documentada.", "Riesgo concreto, actual y especialmente grave.", "Relación del defecto con la seguridad vial.", "Estado ITV como dato separado, sin usarlo como prueba sustitutiva del riesgo."],
    resultado: "El vehículo presenta deficiencias técnicas actuales que constituyen riesgo especialmente grave. La infracción técnica debe determinarse por el defecto concreto, con independencia del estado ITV.", norma: "Ley sobre Tráfico, Circulación de Vehículos a Motor y Seguridad Vial", articulo: "104.1.b para la medida; tipo técnico específico para la denuncia", calificacion: null,
    actuacion: ["Describir técnicamente cada defecto y el riesgo concreto.", "Seleccionar el codificado técnico específico que corresponda; esta ficha no fija uno genérico.", "Motivar la necesidad y proporcionalidad de la inmovilización.", "Comprobar separadamente si concurre un presupuesto tasado para retirada y depósito.", "Evitar una doble sanción por idéntico sujeto, hecho y fundamento."],
    medidas: ["TR-MED-IMMOB-104B", "TR-MED-REMOVE-105", "TR-MED-DEPOSIT-105"], advertencias: ["La calificación y el importe dependen del tipo técnico específico acreditado.", "La retirada, el traslado privado y el depósito son actuaciones diferentes y no se activan por la mera inmovilización."], fuentes: ["TR-ITV-SRC-001", "TR-ITV-SRC-002", "TR-ITV-SRC-007"], fichas_juridicas: ["TR-ITV-FJ-004", "TR-ITV-FJ-005", "TR-ITV-FJ-006"]
  }
];

export const itvRules: Rule[] = [
  ["TR-ITV-R-001", "ITV vencida", "La falta de inspección periódica puede denunciarse también con el vehículo estacionado en vía pública, aplicando proporcionalidad."],
  ["TR-ITV-R-002", "Vencimiento sin riesgo grave", "El mero vencimiento no permite inmovilizar."],
  ["TR-ITV-R-003", "Desfavorable dentro de plazo", "Solo se permite el desplazamiento necesario para subsanar deficiencias y volver a ITV; los demás desplazamientos se denuncian con 5C."],
  ["TR-ITV-R-004", "Desfavorable fuera de plazo", "Distinguir circulación efectiva 5D de estacionamiento o puesta en circulación 5E."],
  ["TR-ITV-R-005", "ITV negativa", "Impedir la continuación autopropulsada y exigir transporte por medios ajenos."],
  ["TR-ITV-R-006", "Riesgo especialmente grave", "La inmovilización solo puede acordarse por deficiencias actuales que constituyan riesgo especialmente grave y debe motivarse."],
  ["TR-ITV-R-007", "Retirada y depósito", "Exigen un supuesto propio del artículo 105 LSV; no son consecuencia automática del estado ITV."],
  ["TR-ITV-R-008", "Competencia", "La Policía Local formula la denuncia y la Jefatura Provincial de Tráfico de Valencia ejerce la competencia sancionadora."],
  ["TR-ITV-R-009", "Responsable", "En las infracciones ITV responde el titular o arrendatario a largo plazo inscrito."],
  ["TR-ITV-R-010", "Reducción", "El pago voluntario dentro de veinte días naturales permite la reducción del 50 por ciento en los tipos ITV incluidos."],
].map(([id, nombre, contenido]) => ({ id, nombre, contenido, tipo: "criterio_itv", aplica_a: "seguridad_vial_itv", activo: true }));

export const itvMeasures: PoliceMeasure[] = [
  { id: "TR-MED-ITV-CHECK", titulo: "Comprobación documental ITV", activacion: "Cualquier control ITV", automatica: false, actuaciones: ["Consultar el Registro de Vehículos y la documentación ITV.", "Identificar fecha, resultado, defectos, plazo y estación.", "Distinguir circulación efectiva de estacionamiento."], levantamiento: "No es una medida restrictiva; finaliza con la comprobación." },
  { id: "TR-MED-WARN-NOCIRC", titulo: "Advertencia de prohibición o limitación de circulación", activacion: "ITV desfavorable o negativa", automatica: false, actuaciones: ["Informar del alcance exacto de la limitación.", "Dejar constancia de la advertencia.", "No presentarla como inmovilización formal."], levantamiento: "Cesa al obtener un resultado ITV que habilite la circulación; en la desfavorable subsiste la excepción reglamentaria de desplazamiento." },
  { id: "TR-MED-EXT-TRANSPORT", titulo: "Transporte por medios ajenos", activacion: "ITV negativa o imposibilidad legal de continuar autopropulsado", automatica: false, actuaciones: ["Impedir la continuación por sus propios medios.", "Permitir que el responsable organice grúa o plataforma.", "Documentar medio y destino."], levantamiento: "Concluye al transportarse el vehículo sin autopropulsión; no es retirada administrativa ni depósito." },
  { id: "TR-MED-IMMOB-104B", titulo: "Inmovilización por riesgo especialmente grave", fundamento: "Art. 104.1.b LSV", activacion: "Deficiencias actuales que constituyen riesgo especialmente grave", automatica: false, actuaciones: ["Describir las deficiencias y el riesgo concreto.", "Motivar necesidad y proporcionalidad.", "Fijar el lugar indicado por los agentes."], levantamiento: "Cuando cese la causa. Si persiste la inhabilitación ITV, el levantamiento solo permite transporte legal, no circulación autopropulsada." },
  { id: "TR-MED-REMOVE-105", titulo: "Retirada de la vía", fundamento: "Art. 105 LSV", activacion: "Peligro, grave perturbación, falta de lugar adecuado para una inmovilización legal u otro supuesto tasado", automatica: false, actuaciones: ["Identificar el supuesto legal concreto.", "Permitir la retirada por el obligado cuando sea viable.", "Ordenar retirada administrativa solo si concurren sus requisitos."], levantamiento: "Devolución conforme al artículo 105; no habilita para circular si persiste el estado ITV." },
  { id: "TR-MED-DEPOSIT-105", titulo: "Depósito administrativo", fundamento: "Art. 105 LSV", activacion: "Retirada administrativa legalmente acordada", automatica: false, actuaciones: ["Custodiar en el lugar designado.", "Inventariar y comunicar.", "Separarlo del transporte privado a taller o ITV."], levantamiento: "Entrega conforme al artículo 105; si no puede circular, la salida será mediante transporte legal." },
];
export const resolveMeasures = (ids: string[] = []) => ids.map((id) => itvMeasures.find((measure) => measure.id === id)).filter((measure): measure is PoliceMeasure => Boolean(measure));

export const itvLegalSheets = [
  { id: "TR-ITV-FJ-001", titulo: "Obligación de inspección periódica", regla: "Someter el vehículo a ITV y superar la inspección en los términos reglamentarios." },
  { id: "TR-ITV-FJ-002", titulo: "Resultado desfavorable o negativo", regla: "Defecto grave determina resultado desfavorable; defecto muy grave, resultado negativo." },
  { id: "TR-ITV-FJ-003", titulo: "Segunda inspección", regla: "Plazo máximo de dos meses; desfavorable con desplazamientos tasados y negativa con transporte por medios ajenos." },
  { id: "TR-ITV-FJ-004", titulo: "Tipificación, cuantía, responsable y reducción", regla: "Aplicar tipo ARCI validado, titular o arrendatario inscrito y reducción del 50 por ciento." },
  { id: "TR-ITV-FJ-005", titulo: "Competencia sancionadora", regla: "Jefatura Provincial de Tráfico de Valencia; Policía Local como formuladora." },
  { id: "TR-ITV-FJ-006", titulo: "Medidas policiales", regla: "Inmovilización, retirada, traslado y depósito conservan presupuestos y efectos propios." },
];

export const itvConcepts = ["ITV caducada", "ITV desfavorable", "ITV negativa", "Circulando", "Estacionado o puesto en circulación", "Plazo de segunda inspección", "Riesgo especialmente grave", "Transporte por medios ajenos", "Retirada", "Depósito"].map((termino, index) => ({ id: `TR-ITV-CO-${String(index + 1).padStart(3, "0")}`, termino }));

export const itvDecisionTree: DecisionTree = {
  id: "TR-ITV-AD-001", categoria: "seguridad_vial_itv", entrada: "Comprobar estado ITV, movimiento real, informe de defectos y plazo", outcomes: {
    "TR-ITV-OP-001": { titulo: "Abrir: ITV vencida circulando", caseId: "TR-ITV-OP-001" }, "TR-ITV-OP-002": { titulo: "Abrir: ITV vencida estacionado", caseId: "TR-ITV-OP-002" }, "TR-ITV-OP-003": { titulo: "Abrir: ITV desfavorable dentro de plazo", caseId: "TR-ITV-OP-003" }, "TR-ITV-OP-004": { titulo: "Abrir: ITV desfavorable fuera de plazo", caseId: "TR-ITV-OP-004" }, "TR-ITV-OP-005": { titulo: "Abrir: ITV negativa circulando", caseId: "TR-ITV-OP-005" }, "TR-ITV-OP-006": { titulo: "Abrir: ITV negativa estacionado", caseId: "TR-ITV-OP-006" }, "TR-ITV-OP-007": { titulo: "Abrir: riesgo especialmente grave", caseId: "TR-ITV-OP-007" },
    NO_ITV_INFRINGEMENT: { titulo: "Sin infracción ITV por el desplazamiento", texto: "Documenta que el trayecto es necesario y coherente para subsanar deficiencias o volver a ITV. Comprueba aparte las deficiencias actuales." }, NO_ITV_CASE: { titulo: "No se identifica uno de los casos ITV del bloque", texto: "Revisa la documentación y, si existen defectos técnicos, utiliza el tipo técnico específico." }
  },
  nodes: [
    { id: "N1", pregunta: "¿La ITV periódica está vencida sin resultado desfavorable o negativo?", si: "N2", no: "N3" }, { id: "N2", pregunta: "¿El vehículo está circulando?", si: "TR-ITV-OP-001", no: "TR-ITV-OP-002" }, { id: "N3", pregunta: "¿El último resultado es desfavorable?", si: "N4", no: "N6" }, { id: "N4", pregunta: "¿Se ha superado el plazo máximo?", si: "TR-ITV-OP-004", no: "N5" }, { id: "N5", pregunta: "¿Es un trayecto necesario y coherente para subsanar deficiencias o volver a ITV?", si: "NO_ITV_INFRINGEMENT", no: "TR-ITV-OP-003" }, { id: "N6", pregunta: "¿El último resultado es negativo?", si: "N7", no: "N8" }, { id: "N7", pregunta: "¿Está circulando por sus propios medios?", si: "TR-ITV-OP-005", no: "TR-ITV-OP-006" }, { id: "N8", pregunta: "¿Existen deficiencias actuales con riesgo especialmente grave?", si: "TR-ITV-OP-007", no: "NO_ITV_CASE" },
  ]
};
