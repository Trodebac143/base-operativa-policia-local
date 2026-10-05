import {
  clasificarDelitoPorPenas,
  penaEnMeses,
  type RegimenPenas,
} from "./gravedad-penal";

export type ProcedibilidadPenal = "oficio" | "denuncia" | "sexual_191";
export type AmbitoPenal = "general" | "vg" | "domestica" | "protegida";
export type PenaCondicional = { condicion: string; penas: RegimenPenas };

export interface SupuestoPenal {
  id: string;
  articulo: string;
  subtipo: string;
  descripcion: string;
  condiciones: string[];
  penas: RegimenPenas;
  procedibilidad: ProcedibilidadPenal;
  ambito: AmbitoPenal;
  fuentesOficiales: string[];
  advertencias: string[];
  penasCondicionales?: PenaCondicional[];
}

const CP = (articulo: number) => `https://www.boe.es/buscar/act.php?id=BOE-A-1995-25444#a${articulo}`;
const prison = (min: number, max: number) => penaEnMeses("prision", min, max);
const fine = (min: number, max: number) => penaEnMeses("multa", min, max);
const armas = (min: number, minDias: number, max: number) => ({
  tipo: "pena", pena: {
    tipo: "armas", minimo: { unidad: "meses", valor: min, diasAdicionales: minDias },
    maximo: { unidad: "meses", valor: max },
  },
}) as RegimenPenas;
const tbc = (min: number, max: number) => ({
  tipo: "pena", pena: { tipo: "tbc", minimo: { unidad: "dias", valor: min }, maximo: { unidad: "dias", valor: max } },
}) as RegimenPenas;
const localizacion = (min: number, max: number) => ({
  tipo: "pena", pena: { tipo: "localizacion", minimo: { unidad: "dias", valor: min }, maximo: { unidad: "dias", valor: max } },
}) as RegimenPenas;
const proporcional = (factorMaximo: number): RegimenPenas => ({ tipo: "pena", pena: { tipo: "multa_proporcional", baseEconomica: "valor de la droga objeto del delito", factorMinimo: 1, factorMaximo } });
const either = (...penas: RegimenPenas[]): RegimenPenas => ({ tipo: "alternativas", penas });
const together = (...penas: RegimenPenas[]): RegimenPenas => ({ tipo: "conjuntas", penas });
const pending: RegimenPenas = { tipo: "pendiente" };
const mitadSuperior = (base: RegimenPenas) => ({ tipo: "mitad_superior", base }) as RegimenPenas;
const superiorGrado = (base: RegimenPenas) => ({ tipo: "superior_grado", base }) as RegimenPenas;
const commonWarnings = ["El marco expresa la pena legal abstracta; su individualización corresponde al órgano sentenciador."];
const proportionalWarning = "La multa es proporcional: el importe depende de la cuantía legal aplicable y no se expresa en meses.";

function supuesto(
  id: string,
  articulo: number,
  subtipo: string,
  descripcion: string,
  penas: RegimenPenas,
  options: Partial<Pick<SupuestoPenal, "condiciones" | "procedibilidad" | "ambito" | "advertencias" | "penasCondicionales">> = {},
): SupuestoPenal {
  return {
    id,
    articulo: String(articulo),
    subtipo,
    descripcion,
    condiciones: options.condiciones ?? [descripcion],
    penas,
    procedibilidad: options.procedibilidad ?? "oficio",
    ambito: options.ambito ?? "general",
    fuentesOficiales: [id.startsWith("172ter") ? CP(172).replace("#a172", "#a172ter") : id.startsWith("183bis") ? CP(183).replace("#a183", "#a183bis") : CP(articulo), ...(id.startsWith("551") ? [CP(550), CP(70)] : []), ...(id.includes("250") && articulo !== 250 ? [CP(250)] : []), ...(id === "266.3" || id === "266.4.especial" ? [CP(265), CP(323), CP(560)] : [])],
    advertencias: [...commonWarnings, ...(options.advertencias ?? [])],
    ...(options.penasCondicionales ? { penasCondicionales: options.penasCondicionales } : {}),
  };
}

const lesiones148 = prison(24,60);
const lesiones147_1 = either(prison(3, 36), fine(6, 12));
const amenaza171_4 = together(either(prison(6, 12), tbc(31, 80)), armas(12, 1, 36));
const amenaza171_5 = together(either(prison(3, 12), tbc(31, 80)), armas(12, 0, 36));
const maltrato153_1 = together(either(prison(6, 12), tbc(31, 80)), armas(12, 1, 36));
const maltrato153_2 = together(either(prison(3, 12), tbc(31, 80)), armas(12, 1, 36));
const medidas171_7_dom = either(localizacion(5, 30), tbc(5, 30), fine(1, 4));
const defraudacion248 = prison(6, 36);
const defraudacion250_1 = together(prison(12, 72), fine(6, 12));
const defraudacion250_2 = together(prison(48, 96), fine(12, 24));
const danos263_2 = together(prison(12, 36), fine(12, 24));

const catalogoBase = {
  "550-551.pendiente": {...supuesto("550-551.pendiente",550,"atentado pendiente","El marco exacto depende de la función de la persona atacada y de las circunstancias del ataque; pueden requerirse comprobaciones adicionales.",pending),fuentesOficiales:[CP(550),CP(551),CP(70)]},
  "148.2": supuesto("148.2",148,"lesión con circunstancia específica","Ensañamiento o alevosía documentados.",lesiones148,{advertencias:["Aplicación facultativa atendiendo al resultado o riesgo del art. 148; calificación judicial provisional."]}),
  "148.3": supuesto("148.3",148,"lesión con circunstancia específica","Víctima menor de catorce años o con discapacidad necesitada de especial protección.",lesiones148,{advertencias:["Aplicación facultativa atendiendo al resultado o riesgo del art. 148; calificación judicial provisional."]}),
  "148.4": supuesto("148.4",148,"lesión con circunstancia específica","Víctima esposa/exesposa o mujer pareja/expareja del autor.",lesiones148,{advertencias:["Aplicación facultativa atendiendo al resultado o riesgo del art. 148; calificación judicial provisional."]}),
  "148.5": supuesto("148.5",148,"lesión con circunstancia específica","Víctima especialmente vulnerable que convive con el autor.",lesiones148,{advertencias:["Aplicación facultativa atendiendo al resultado o riesgo del art. 148; calificación judicial provisional."]}),

  "248.pendiente": supuesto("248.pendiente",248,"estafa pendiente","Engaño previo con disposición: completar el subtipo y cuantía en el análisis de estafa.",pending),
  "264.pendiente": supuesto("264.pendiente",264,"daño informático pendiente","Afectación a datos o sistemas: concretar conducta, gravedad y requisitos de los arts. 264 y siguientes.",pending),
  "563.pendiente": supuesto("563.pendiente",563,"tenencia pendiente","Falta confirmar prohibición y peligrosidad concreta suficiente del arma.",pending),
  "368.pendiente": supuesto("368.pendiente",368,"tráfico pendiente","Indicios de tráfico no concluyentes o atribución individual no determinada.",pending),
  "147.1": supuesto("147.1", 147, "lesiones con tratamiento", "Lesión que requiere, además de primera asistencia, tratamiento médico o quirúrgico.", lesiones147_1),
  "147.2": supuesto("147.2", 147, "lesiones sin tratamiento", "Lesión que solo requiere primera asistencia facultativa.", fine(1, 3), { procedibilidad: "denuncia" }),
  "147.3": supuesto("147.3", 147, "maltrato de obra", "Golpear o maltratar de obra sin causar lesión.", fine(1, 2), { procedibilidad: "denuncia" }),
  "148.1": supuesto("148.1", 148, "lesiones agravadas", "Lesión del art. 147.1 con medio concretamente peligroso para vida o salud.", lesiones148, { condiciones: ["Concurre alguna circunstancia del art. 148 CP."], advertencias: ["La aplicación depende de la entidad del resultado y del riesgo producido."] }),
  "149.1": supuesto("149.1", 149, "lesión de especial gravedad", "Pérdida o inutilidad de órgano o miembro principal, sentido, impotencia, esterilidad, grave deformidad o grave enfermedad somática o psíquica.", prison(72, 144)),
  "149.2": supuesto("149.2", 149, "mutilación genital", "Mutilación genital en cualquiera de sus manifestaciones.", prison(72, 144)),
  "150": supuesto("150", 150, "lesión grave", "Pérdida o inutilidad de órgano o miembro no principal o deformidad.", prison(36, 72)),
  "149-150.pendiente": { ...supuesto("149-150.pendiente", 149, "calificación pendiente", "Posible lesión de los arts. 149 o 150 pendiente de concretar.", pending, { condiciones: ["Falta determinar el resultado lesivo y su alcance."], advertencias: ["El subtipo y su pena quedan pendientes. Las consecuencias comunes seguras de las alternativas compatibles pueden orientar la actuación."] }), fuentesOficiales: [CP(149), CP(150)] },

  "153.1": supuesto("153.1", 153, "violencia relacional", "Golpear o maltratar de obra o causar lesión leve en el ámbito subjetivo descrito por el precepto.", maltrato153_1, { ambito: "protegida", condiciones: ["La víctima y la relación deben encajar en el art. 153.1 CP."], penasCondicionales: [{ condicion: "Si el juez o tribunal lo estima adecuado al interés del menor o persona con discapacidad necesitada de especial protección.", penas: { tipo: "pendiente" } }], advertencias: ["La pena de inhabilitación especial sobre patria potestad, tutela, curatela, guarda o acogimiento es facultativa y puede alcanzar cinco años."] }),
  "153.2": supuesto("153.2", 153, "violencia doméstica", "Golpear o maltratar de obra o causar lesión leve en los restantes supuestos de relación familiar o convivencial del precepto.", maltrato153_2, { ambito: "domestica", condiciones: ["Supuesto comprendido en el art. 153.2 CP."], penasCondicionales: [{ condicion: "Si el juez o tribunal lo estima adecuado al interés del menor o persona con discapacidad necesitada de especial protección.", penas: penaEnMeses("inhabilitacion_especial", 6, 36) }], advertencias: ["La inhabilitación especial sobre patria potestad, tutela, curatela, guarda o acogimiento es facultativa."] }),
  "154": supuesto("154", 154, "riña tumultuaria", "Intervención en riña tumultuaria utilizando medios o instrumentos que pongan en peligro la vida o integridad.", either(prison(3, 12), fine(6, 24))),

  "169.1.logrado": supuesto("169.1.logrado", 169, "amenaza condicional lograda", "Amenaza condicional de un mal constitutivo de delito cuando se consigue el propósito.", prison(12, 60), { condiciones: ["Amenaza de un mal constitutivo de delito y propósito conseguido."], advertencias: ["La aplicación concreta depende del mal anunciado y de si se alcanzó el propósito." ] }),
  "169.1.no_logrado": supuesto("169.1.no_logrado", 169, "amenaza condicional no lograda", "Amenaza condicional de un mal constitutivo de delito cuando no se consigue el propósito.", prison(6, 36), { condiciones: ["Amenaza de un mal constitutivo de delito y propósito no conseguido."] }),
  "169.2": supuesto("169.2", 169, "amenaza no condicional", "Amenaza de un mal constitutivo de delito no sujeta a condición.", prison(6, 24)),
  "169.pendiente": supuesto("169.pendiente", 169, "amenaza pendiente", "Posible amenaza del art. 169 pendiente de determinar.", pending, { condiciones: ["Falta concretar el mal anunciado, el carácter condicional y el propósito."], advertencias: ["No permite clasificar hasta concretar los elementos del tipo." ] }),
  "171.1": supuesto("171.1", 171, "amenaza condicional no delictiva", "Amenaza condicional de un mal que no constituye delito cuando la condición no consiste en conducta debida.", either(prison(3, 12), fine(6, 24))),
  "171.4": supuesto("171.4", 171, "amenaza leve en ámbito protegido", "Amenaza leve en el ámbito relacional previsto en el art. 171.4 CP.", amenaza171_4, { ambito: "protegida", condiciones: ["La víctima y relación deben encajar en el art. 171.4 CP."] }),
  "171.5": supuesto("171.5", 171, "amenaza leve doméstica", "Amenaza leve en los restantes supuestos familiares o convivenciales del art. 171.5 CP.", amenaza171_5, { ambito: "domestica", condiciones: ["Supuesto relacional comprendido en el art. 171.5 CP."] }),
  "171.7.general": supuesto("171.7.general", 171, "amenaza leve general", "Amenaza leve fuera de los supuestos de los apartados anteriores.", fine(1, 3), { procedibilidad: "denuncia" }),
  "171.7.domestica": supuesto("171.7.domestica", 171, "amenaza leve doméstica", "Amenaza leve del art. 171.7 en el ámbito familiar o convivencial descrito.", medidas171_7_dom, { ambito: "domestica", advertencias: ["La multa queda condicionada al art. 84.2 CP; comprobar que concurren sus presupuestos."] }),

  "172.1": supuesto("172.1", 172, "coacciones", "Impedir a otro con violencia hacer lo que la ley no prohíbe u obligarle a hacer lo que no quiere.", either(prison(6, 36), fine(12, 24))),
  "172.2": supuesto("172.2", 172, "coacciones en ámbito protegido", "Coacción leve en el ámbito relacional previsto por el art. 172.2 CP.", maltrato153_1, { ambito: "protegida", condiciones: ["La víctima y relación deben encajar en el art. 172.2 CP."] }),
  "172.3.general": supuesto("172.3.general", 172, "coacción leve general", "Coacción leve fuera de los supuestos anteriores.", fine(1, 3), { procedibilidad: "denuncia" }),
  "172.3.domestica": supuesto("172.3.domestica", 172, "coacción leve doméstica", "Coacción leve en el ámbito familiar o convivencial del art. 172.3 CP.", medidas171_7_dom, { ambito: "domestica", advertencias: ["La multa queda condicionada al art. 84.2 CP; comprobar que concurren sus presupuestos."] }),
  "172ter.1": supuesto("172ter.1", 172, "acoso reiterado", "Acoso insistente y reiterado que altera el normal desarrollo de la vida cotidiana de otra persona.", either(prison(3, 24), fine(6, 24)), { procedibilidad: "denuncia" }),
  "172ter.1.vulnerable": supuesto("172ter.1.vulnerable", 172, "acoso a persona especialmente vulnerable", "Acoso reiterado dirigido a persona especialmente vulnerable por razón de edad, enfermedad o situación.", prison(6, 24), { procedibilidad: "denuncia", condiciones: ["La persona afectada es especialmente vulnerable por edad, enfermedad o situación."] }),
  "172ter.2": supuesto("172ter.2", 172, "acoso doméstico", "Acoso reiterado contra persona comprendida en el círculo del art. 173.2 CP.", either(prison(12, 24), tbc(60, 120)), { ambito: "domestica" }),
  "173.2": supuesto("173.2", 173, "violencia habitual", "Ejercicio habitual de violencia física o psíquica sobre personas comprendidas en el círculo legal.", together(prison(6, 36), penaEnMeses("armas", 36, 60)), { ambito: "protegida", condiciones: ["Habitualidad y relación subjetiva conforme al art. 173.2 CP."], advertencias: ["La habitualidad se valora atendiendo al número de actos y proximidad temporal, con independencia de que afecten a una o varias víctimas."] }),
  "173.4": supuesto("173.4", 173, "vejación o injuria leve protegida", "Injuria o vejación injusta de carácter leve contra persona comprendida en el círculo legal.", either(localizacion(5, 30), tbc(5, 30), fine(1, 4)), { procedibilidad: "denuncia", ambito: "protegida", advertencias: ["La multa queda condicionada al art. 84.2 CP; comprobar sus presupuestos."] }),

  "468.1.libertad": supuesto("468.1.libertad", 468, "quebrantamiento de pena privativa de libertad", "Quebrantamiento de condena, medida cautelar, conducción o custodia cuando la persona está privada de libertad.", prison(6, 12)),
  "468.1.otros": supuesto("468.1.otros", 468, "quebrantamiento de otras penas o medidas", "Quebrantamiento de condena o medida cautelar no comprendido en el supuesto de privación de libertad.", fine(12, 24)),
  "468.2": supuesto("468.2", 468, "quebrantamiento en ámbito protegido", "Quebrantamiento de las prohibiciones del art. 48 o medida de seguridad equivalente impuestas en los supuestos legales.", prison(6, 12), { ambito: "protegida" }),
  "468.3": supuesto("468.3", 468, "quebrantamiento de dispositivo", "Retirada, inutilización u obstaculización de dispositivos técnicos de control en los supuestos del apartado.", fine(6, 12)),

  "550.agente": supuesto("550.agente", 550, "atentado contra agente u otro sujeto protegido", "Agresión, resistencia grave o acometimiento contra agente o funcionario; incluye docentes y sanitarios en el ejercicio de sus funciones o con ocasión de ellas, según el art. 550.1.", prison(6, 36)),
  "550.autoridad": supuesto("550.autoridad", 550, "atentado contra autoridad", "Atentado cometido contra autoridad en los supuestos del precepto.", together(prison(12, 48), fine(3, 6))),
  "550.especial": supuesto("550.especial", 550, "atentado con agravación específica", "Atentado comprendido en las circunstancias agravadas del art. 550.3 CP.", together(prison(12, 72), fine(6, 12)), { condiciones: ["Concurre alguna circunstancia específica del art. 550.3 CP."] }),
  "551.agente": supuesto("551.agente", 551, "atentado agravado contra agente", "Atentado contra agente, funcionario, docente o sanitario protegido del art. 550.1, con circunstancia del art. 551.", superiorGrado(prison(6, 36))),
  "551.autoridad": supuesto("551.autoridad", 551, "atentado agravado contra autoridad", "Atentado agravado contra autoridad.", together(superiorGrado(prison(12, 48)), superiorGrado(fine(3, 6)))),
  "551.especial": supuesto("551.especial", 551, "atentado agravado específico", "Atentado agravado del art. 551 sobre el marco del art. 550.3.", together(superiorGrado(prison(12, 72)), superiorGrado(fine(6, 12)))),
  "556.1": supuesto("556.1", 556, "resistencia o desobediencia grave", "Resistencia o desobediencia grave a la autoridad o sus agentes, sin llegar a atentado.", either(prison(3, 12), fine(6, 18))),
  "556.2": supuesto("556.2", 556, "falta de respeto leve", "Falta de respeto y consideración debida a la autoridad en el ejercicio de sus funciones.", fine(1, 3)),
  "563": supuesto("563", 563, "tenencia ilícita de armas prohibidas", "Tenencia de armas prohibidas o modificadas sustancialmente en los términos del precepto.", prison(12, 36), { advertencias: ["El tipo exige comprobar la clase de arma y los requisitos legales y jurisprudenciales del art. 563 CP."] }),

  "368.grave": supuesto("368.grave", 368, "tráfico de drogas de grave daño", "Actos de cultivo, elaboración, tráfico u otros legalmente equiparados referidos a sustancias que causan grave daño a la salud.", together(prison(36, 72), proporcional(3)), { advertencias: [proportionalWarning, "Multa del tanto al triplo del valor de la droga; reducción inferior en grado facultativa del tribunal (368, párrafo segundo), no automática."] }),
  "368.resto": supuesto("368.resto", 368, "tráfico de drogas restantes sustancias", "Actos de cultivo, elaboración, tráfico u otros legalmente equiparados respecto de las restantes sustancias.", together(prison(12, 36), proporcional(2)), { advertencias: [proportionalWarning] }),

  "178.1": supuesto("178.1", 178, "agresión sexual", "Acto que atenta contra la libertad sexual de otra persona sin consentimiento.", prison(12, 48), { procedibilidad: "sexual_191" }),
  "178.3": supuesto("178.3", 178, "agresión sexual agravada", "Agresión sexual con alguna circunstancia prevista en el art. 178.3 CP.", prison(12, 60), { procedibilidad: "sexual_191" }),
  "179.1": supuesto("179.1", 179, "violación", "Agresión sexual con acceso carnal o introducción de miembros u objetos en los términos legales.", prison(48, 144), { procedibilidad: "sexual_191" }),
  "179.2": supuesto("179.2", 179, "violación agravada", "Violación con alguna circunstancia agravante del art. 179.2 CP.", prison(72, 144), { procedibilidad: "sexual_191" }),
  "180.1781": supuesto("180.1781", 180, "agresión sexual agravada", "Agresión sexual básica con circunstancias del art. 180 CP.", prison(24, 96), { procedibilidad: "sexual_191", condiciones: ["Concurre alguna circunstancia del art. 180 CP."], advertencias: ["La concurrencia y combinación de circunstancias del art. 180 debe verificarse sobre el texto vigente."] }),
  "180.1783": supuesto("180.1783", 180, "agresión sexual agravada", "Agresión sexual del art. 178.3 con circunstancias del art. 180 CP.", prison(60, 120), { procedibilidad: "sexual_191", condiciones: ["Concurren los presupuestos de los arts. 178.3 y 180 CP."], advertencias: ["La concurrencia y combinación de circunstancias del art. 180 debe verificarse sobre el texto vigente."] }),
  "180.1791": supuesto("180.1791", 180, "violación agravada", "Violación con circunstancias del art. 180 CP.", prison(84, 180), { procedibilidad: "sexual_191", condiciones: ["Concurre alguna circunstancia del art. 180 CP."], advertencias: ["La concurrencia y combinación de circunstancias del art. 180 debe verificarse sobre el texto vigente."] }),
  "180.1792": supuesto("180.1792", 180, "violación agravada", "Violación del art. 179.2 con circunstancias del art. 180 CP.", prison(144, 180), { procedibilidad: "sexual_191", condiciones: ["Concurren los presupuestos de los arts. 179.2 y 180 CP."], advertencias: ["La concurrencia y combinación de circunstancias del art. 180 debe verificarse sobre el texto vigente."] }),
  "181.1": supuesto("181.1", 181, "agresión sexual a menor", "Acto de carácter sexual con menor de dieciséis años en los términos del precepto.", prison(24, 72), { procedibilidad: "sexual_191" }),
  "181.2": supuesto("181.2", 181, "agresión sexual a menor agravada", "Agresión sexual a menor con alguna circunstancia agravante prevista en el art. 181.2 CP.", prison(60, 120), { procedibilidad: "sexual_191" }),
  "181.4.base": supuesto("181.4.base", 181, "agresión sexual a menor con acceso", "Agresión sexual a menor con acceso carnal o introducción en los términos legales.", prison(96, 144), { procedibilidad: "sexual_191" }),
  "181.4.coerciva": supuesto("181.4.coerciva", 181, "agresión sexual coerciva a menor", "Agresión sexual a menor con acceso carnal realizada con violencia o intimidación o sobre víctima sin sentido o voluntad.", prison(144, 180), { procedibilidad: "sexual_191" }),
  "182.1": supuesto("182.1", 182, "hacer presenciar actos sexuales", "Hacer presenciar actos de carácter sexual a menor de dieciséis años, aunque el autor no participe.", prison(6, 24), { procedibilidad: "sexual_191" }),
  "182.2": supuesto("182.2", 182, "hacer presenciar actos sexuales agravado", "Hacer presenciar al menor actos que constituyan delito contra la libertad sexual.", prison(12, 36), { procedibilidad: "sexual_191" }),
  "183.1": supuesto("183.1", 183, "contacto con menor para encuentro", "Contactar con menor de dieciséis años y proponer encuentro con actos materiales de acercamiento.", either(prison(12, 36), fine(12, 24)), { procedibilidad: "sexual_191" }),
  "183.2": supuesto("183.2", 183, "contacto sexual para material pornográfico", "Contactar con menor de dieciséis años para embaucarlo y obtener material o imágenes pornográficas.", prison(6, 24), { procedibilidad: "sexual_191" }),
  "183bis.pendiente": supuesto("183bis.pendiente", 183, "excepción de proximidad de edad", "Posible aplicación de la excepción del art. 183 bis pendiente de valorar circunstancias.", pending, { procedibilidad: "sexual_191", condiciones: ["Falta valorar diferencia de edad y grado de desarrollo o madurez."], advertencias: ["La excepción exige valoración individual y no se presume."] }),

  "234.1": supuesto("234.1", 234, "hurto superior a 400 euros", "Apoderamiento con ánimo de lucro de cosa mueble ajena por importe superior a 400 euros.", prison(6, 18)),
  "234.2": supuesto("234.2", 234, "hurto hasta 400 euros", "Apoderamiento con ánimo de lucro de cosa mueble ajena por importe no superior a 400 euros.", fine(1, 3)),
  "235.1": supuesto("235.1", 235, "hurto agravado", "Hurto que concurre en alguna circunstancia cualificada del art. 235.1 CP.", prison(12, 36), { advertencias: ["El subtipo depende de acreditar alguna circunstancia enumerada en el precepto."] }),
  "235.2": supuesto("235.2", 235, "hurto con varias circunstancias agravadas", "Hurto del art. 235.1 en que concurren dos o más circunstancias del apartado.", mitadSuperior(prison(12, 36)), { condiciones: ["Concurren al menos dos circunstancias del art. 235.1 CP."], advertencias: ["La mitad superior se resuelve por el motor común con el día como unidad indivisible."] }),
  "234.3.leve": supuesto("234.3.leve", 234, "hurto leve con neutralización de alarmas", "Hurto de cuantía no superior a 400 euros con neutralización, eliminación o inutilización de alarma o seguridad.", mitadSuperior(fine(1, 3)), { condiciones: ["Cuantía no superior a 400 euros y neutralización de dispositivo de alarma o seguridad."] }),
  "234.3.general": supuesto("234.3.general", 234, "hurto con neutralización de alarmas", "Hurto con neutralización, eliminación o inutilización de alarma o seguridad.", mitadSuperior(prison(6, 18)), { condiciones: ["Se acredita la conducta del art. 234.3 CP."], advertencias: ["La pena base depende de la cuantía y de la eventual concurrencia del art. 235 CP."] }),
  "240.1": supuesto("240.1", 240, "robo con fuerza", "Robo con fuerza en las cosas en los términos legales.", prison(12, 36)),
  "240.2": supuesto("240.2", 240, "robo con fuerza agravado", "Robo con fuerza en que concurre circunstancia prevista en el art. 235 CP.", prison(24, 60)),
  "241.1": supuesto("241.1", 241, "robo en casa habitada o local abierto", "Robo con fuerza cometido en casa habitada, edificio o local abiertos al público o dependencias.", prison(24, 60)),
  "241.1.fuera_horario": supuesto("241.1.fuera_horario", 241, "robo en local fuera de horario", "Robo en establecimiento abierto al público o dependencias fuera de las horas de apertura.", prison(12, 60)),
  "241.4": supuesto("241.4", 241, "robo con fuerza especialmente grave", "Robo del art. 241.1 que reviste especial gravedad o concurre circunstancia del art. 235 CP.", prison(24, 72)),
  "242.1": supuesto("242.1", 242, "robo con violencia o intimidación", "Robo con violencia o intimidación en las personas.", prison(24, 60)),
  "242.2": supuesto("242.2", 242, "robo violento en lugar habitado", "Robo con violencia o intimidación en casa habitada, edificio o local abierto al público.", prison(42, 60)),
  "242.3.general": supuesto("242.3.general", 242, "robo violento con armas", "Robo violento con uso de armas u otros medios peligrosos o ataque a quienes auxilian o persiguen.", mitadSuperior(prison(24, 60)), { condiciones: ["Concurre alguna circunstancia del art. 242.3 CP."], advertencias: ["La pena base depende del apartado aplicable; comprobar las circunstancias del hecho."] }),
  "242.3.lugar": supuesto("242.3.lugar", 242, "robo violento agravado en lugar habitado", "Robo del art. 242.2 con alguna circunstancia del art. 242.3 CP.", mitadSuperior(prison(42, 60)), { condiciones: ["Concurre alguna circunstancia del art. 242.3 CP."] }),
  "248": supuesto("248", 248, "estafa", "Engaño bastante que induce a error y causa acto de disposición patrimonial en perjuicio propio o ajeno.", defraudacion248),
  "250.1": supuesto("250.1", 250, "estafa agravada", "Estafa con alguna circunstancia cualificada del art. 250.1 CP.", defraudacion250_1),
  "250.2": supuesto("250.2", 250, "estafa hiperagravada", "Estafa con combinación cualificada o cuantía superior al umbral del art. 250.2 CP.", defraudacion250_2),
  "252.1": supuesto("252.1", 252, "administración desleal", "Infracción de facultades de administración de patrimonio ajeno que causa perjuicio.", defraudacion248, { advertencias: ["El art. 252.1 remite al marco del art. 248 o, en su caso, al art. 250 CP; el marco agravado requiere supuesto propio."] }),
  "252.2": supuesto("252.2", 252, "administración desleal leve", "Administración desleal con perjuicio no superior a 400 euros.", fine(1, 3)),
  "253.1": supuesto("253.1", 253, "apropiación indebida", "Apropiación de cosa recibida en depósito, comisión, custodia u otro título que obligue a entregarla o devolverla.", defraudacion248, { advertencias: ["El marco del apartado 1 remite a los arts. 248 o 250 CP según corresponda."] }),
  "253.2": supuesto("253.2", 253, "apropiación indebida leve", "Apropiación indebida con cuantía no superior a 400 euros.", fine(1, 3)),
  "252.2501": supuesto("252.2501", 252, "administración desleal agravada", "Administración desleal cuando resulte aplicable el marco del art. 250.1 CP.", defraudacion250_1),
  "252.2502": supuesto("252.2502", 252, "administración desleal agravada", "Administración desleal cuando resulte aplicable el marco del art. 250.2 CP.", defraudacion250_2),
  "253.2501": supuesto("253.2501", 253, "apropiación indebida agravada", "Apropiación indebida cuando resulte aplicable el marco del art. 250.1 CP.", defraudacion250_1),
  "253.2502": supuesto("253.2502", 253, "apropiación indebida agravada", "Apropiación indebida cuando resulte aplicable el marco del art. 250.2 CP.", defraudacion250_2),
  "254.1": supuesto("254.1", 254, "apropiación de cosa mueble", "Apropiación de cosa mueble ajena fuera de los supuestos anteriores.", fine(3, 6)),
  "254.2": supuesto("254.2", 254, "otra apropiación de cuantía no superior a 400 euros", "Apropiación de cosa mueble ajena fuera del art. 253 por cuantía no superior a 400 euros.", fine(1, 2)),
  "254.cultural": supuesto("254.cultural", 254, "apropiación de bien cultural", "Apropiación de cosa mueble de valor artístico, histórico, cultural o científico.", prison(6, 24)),
  "263.1": supuesto("263.1", 263, "daños", "Causación dolosa de daños en propiedad ajena fuera de los supuestos especiales.", fine(6, 24)),
  "263.leve": supuesto("263.leve", 263, "daños leves", "Daños cuya cuantía no excede de 400 euros.", fine(1, 3)),
  "263.2": supuesto("263.2", 263, "daños agravados", "Daños que concurren en alguna circunstancia del art. 263.2 CP.", danos263_2),
  "266.1": supuesto("266.1", 266, "daños por incendio o medios peligrosos", "Daños del art. 263.1 cometidos mediante incendio, explosión u otro medio de similar potencia destructiva.", prison(12, 36)),
  "266.2": supuesto("266.2", 266, "daños agravados por incendio", "Daños del art. 263.2 cometidos mediante los medios del art. 266.1 CP.", together(prison(36, 60), fine(12, 24))),
  "266.3": supuesto("266.3", 266, "daños sobre bienes de los arts. 265, 323 y 560", "Daños sobre bienes específicamente comprendidos en los arts. 265, 323 o 560 mediante las circunstancias del art. 266.1.", prison(48, 96)),
  "266.4.base": supuesto("266.4.base", 266, "daños mediante explosión y peligro para personas", "Daños del art. 266.1 mediante explosión o potencia destructiva semejante y, además, peligro para vida o integridad.", mitadSuperior(prison(12, 36)), { condiciones: ["Explosión o medio de similar potencia destructiva y peligro para personas concurren conjuntamente."], advertencias: ["La mitad superior opera sobre la pena que corresponda según el supuesto base."] }),
  "266.4.agravado": supuesto("266.4.agravado", 266, "daños mediante explosión y peligro para personas", "Daños del art. 266.2 mediante explosión o potencia destructiva semejante y, además, peligro para vida o integridad.", mitadSuperior(together(prison(36, 60), fine(12, 24))), { condiciones: ["Concurren los presupuestos del art. 266.4 CP."], advertencias: ["La mitad superior opera sobre la pena que corresponda según el supuesto base."] }),
  "266.4.especial": supuesto("266.4.especial", 266, "daños especiales mediante explosión y peligro para personas", "Daños del art. 266.3 mediante explosión o potencia destructiva semejante y, además, peligro para vida o integridad.", mitadSuperior(prison(48, 96)), { condiciones: ["Concurren los presupuestos del art. 266.4 CP."], advertencias: ["La mitad superior opera sobre la pena que corresponda según el supuesto base."] }),
  "351": supuesto("351", 351, "incendio con peligro para vida o integridad", "Provocar incendio con peligro para la vida o integridad física de las personas.", prison(120, 240)),
  "267": supuesto("267", 267, "daños por imprudencia grave", "Daños por imprudencia grave en cuantía superior a 80.000 euros.", fine(3, 9), { procedibilidad: "denuncia", condiciones: ["Imprudencia grave y cuantía superior a 80.000 euros."] }),
  "180.1781.multiple": supuesto("180.1781.multiple", 180, "pluralidad de agravaciones", "Dos o más circunstancias del art. 180.1: mitad superior conforme al art. 180.2.", mitadSuperior(prison(24, 96)), { procedibilidad: "sexual_191" }),
  "180.1783.multiple": supuesto("180.1783.multiple", 180, "pluralidad de agravaciones", "Dos o más circunstancias del art. 180.1: mitad superior conforme al art. 180.2.", mitadSuperior(prison(60, 120)), { procedibilidad: "sexual_191" }),
  "180.1791.multiple": supuesto("180.1791.multiple", 180, "pluralidad de agravaciones", "Dos o más circunstancias del art. 180.1: mitad superior conforme al art. 180.2.", mitadSuperior(prison(84, 180)), { procedibilidad: "sexual_191" }),
  "180.1792.multiple": supuesto("180.1792.multiple", 180, "pluralidad de agravaciones", "Dos o más circunstancias del art. 180.1: mitad superior conforme al art. 180.2.", mitadSuperior(prison(144, 180)), { procedibilidad: "sexual_191" }),
  "181.1.1815": supuesto("181.1.1815", 181, "agravaciones del menor", "Una circunstancia del art. 181.5: mitad superior.", mitadSuperior(prison(24, 72)), { procedibilidad: "sexual_191" }),
  "181.1.1816": supuesto("181.1.1816", 181, "agravaciones del menor", "Dos o más circunstancias: mitad superior de la mitad superior (181.5 y 181.6).", { tipo: "mitad_superior", base: mitadSuperior(prison(24, 72)) }, { procedibilidad: "sexual_191" }),
  "181.2.1815": supuesto("181.2.1815", 181, "agravaciones del menor", "Una circunstancia del art. 181.5: mitad superior.", mitadSuperior(prison(60, 120)), { procedibilidad: "sexual_191" }),
  "181.2.1816": supuesto("181.2.1816", 181, "agravaciones del menor", "Dos o más circunstancias: mitad superior de la mitad superior (181.5 y 181.6).", { tipo: "mitad_superior", base: mitadSuperior(prison(60, 120)) }, { procedibilidad: "sexual_191" }),
  "181.4.base.1815": supuesto("181.4.base.1815", 181, "agravaciones del menor", "Una circunstancia del art. 181.5: mitad superior.", mitadSuperior(prison(96, 144)), { procedibilidad: "sexual_191" }),
  "181.4.base.1816": supuesto("181.4.base.1816", 181, "agravaciones del menor", "Dos o más circunstancias: mitad superior de la mitad superior (181.5 y 181.6).", { tipo: "mitad_superior", base: mitadSuperior(prison(96, 144)) }, { procedibilidad: "sexual_191" }),
  "181.4.coerciva.1815": supuesto("181.4.coerciva.1815", 181, "agravaciones del menor", "Una circunstancia del art. 181.5: mitad superior.", mitadSuperior(prison(144, 180)), { procedibilidad: "sexual_191" }),
  "181.4.coerciva.1816": supuesto("181.4.coerciva.1816", 181, "agravaciones del menor", "Dos o más circunstancias: mitad superior de la mitad superior (181.5 y 181.6).", { tipo: "mitad_superior", base: mitadSuperior(prison(144, 180)) }, { procedibilidad: "sexual_191" }),
  "235.antihurto": supuesto("235.antihurto", 235, "hurto agravado con alarma neutralizada", "Circunstancia del art. 235 y neutralización del dispositivo de la cosa: art. 234.3.", mitadSuperior(prison(12, 36))),
  "235.multiple_antihurto": supuesto("235.multiple_antihurto", 235, "hurto pluralmente agravado con alarma neutralizada", "Art. 235.2 y art. 234.3: conservar todas las circunstancias para valoración judicial sin duplicar su fundamento.", mitadSuperior(prison(12, 36)), { advertencias: ["No se aplica una segunda mitad superior automática sin valoración jurídica de la concurrencia."] }),

  "153.1.3": supuesto("153.1.3",153,"maltrato agravado", "Art. 153.1 con presencia de menores, armas, domicilio común/de la víctima o quebrantamiento: mitad superior.", mitadSuperior(maltrato153_1), {ambito:"protegida"}),
  "153.2.3": supuesto("153.2.3",153,"maltrato doméstico agravado", "Art. 153.2 con circunstancia del apartado 3: mitad superior.", mitadSuperior(maltrato153_2), {ambito:"domestica"}),
  "171.1.logrado": supuesto("171.1.logrado",171,"amenaza de mal no delictivo lograda","Amenaza condicional de mal no constitutivo de delito, condición no debida y propósito conseguido.",mitadSuperior(either(prison(3,12),fine(6,24)))),
  "171.4.agravada": supuesto("171.4.agravada",171,"amenaza leve agravada","Art. 171.4 con presencia de menores, domicilio común/de la víctima o quebrantamiento: mitad superior.",mitadSuperior(amenaza171_4),{ambito:"protegida"}),
  "171.5.agravada": supuesto("171.5.agravada",171,"amenaza doméstica con arma agravada","Art. 171.5 con circunstancia de su último párrafo: mitad superior.",mitadSuperior(amenaza171_5),{ambito:"domestica"}),
  "172.2.agravada": supuesto("172.2.agravada",172,"coacción leve agravada","Art. 172.2 con presencia de menores, domicilio común/de la víctima o quebrantamiento: mitad superior.",mitadSuperior(maltrato153_1),{ambito:"protegida"}),
  "173.2.agravada": supuesto("173.2.agravada",173,"violencia habitual agravada","Algún acto habitual con menores presentes, armas, domicilio común/de la víctima o quebrantamiento: mitad superior.",mitadSuperior(together(prison(6,36),penaEnMeses("armas",36,60))),{ambito:"protegida",advertencias:["No confundir episodios referidos con habitualidad acreditada; documentar actos y proximidad temporal."]}),
  "379.2": supuesto("379.2",379,"conducción bajo influencia o tasa penal","Conducción de vehículo de motor o ciclomotor bajo influencia o con tasa objetiva superior al umbral legal.",together(either(prison(3,6),fine(6,12),tbc(31,90)),{tipo:"pena",pena:{tipo:"conduccion",minimo:{unidad:"meses",valor:12,diasAdicionales:1},maximo:{unidad:"meses",valor:48}}})),
  "383": supuesto("383",383,"negativa a pruebas legalmente establecidas","Negativa del conductor requerido por agente a pruebas legalmente establecidas.",together(prison(6,12),{tipo:"pena",pena:{tipo:"conduccion",minimo:{unidad:"meses",valor:12,diasAdicionales:1},maximo:{unidad:"meses",valor:48}}})),
  "384": supuesto("384",384,"conducción sin habilitación penal","Conducción de motor/ciclomotor con pérdida total de puntos, privación judicial o sin haber obtenido nunca permiso.",either(prison(3,6),fine(12,24),tbc(31,90))),
  "340ter": {...supuesto("340ter",340,"abandono con peligro","Abandono de vertebrado bajo responsabilidad en condiciones que ponen en peligro vida o integridad.",together(either(fine(1,6),tbc(31,90)),penaEnMeses("animales",12,36))),articulo:"340 ter",fuentesOficiales:[CP(340).replace("#a340","#a3-5")]},
  "340bis.pendiente": {...supuesto("340bis.pendiente",340,"maltrato pendiente","Maltrato animal: concretar especie, control humano, resultado y agravantes.",pending),articulo:"340 bis",fuentesOficiales:[CP(340).replace("#a340","#a3-4")]},
  "340bis.1.domestico": {...supuesto("340bis.1.domestico",340,"lesión de animal bajo control humano","Lesión que requiere tratamiento veterinario en animal doméstico/amansado/domesticado o bajo control humano.",together(either(prison(3,18),fine(6,12)),penaEnMeses("animales",12,36))),articulo:"340 bis.1",fuentesOficiales:[CP(340).replace("#a340","#a3-4")]},
  "340bis.1.vertebrado": {...supuesto("340bis.1.vertebrado",340,"lesión de otro vertebrado","Lesión que requiere tratamiento veterinario en vertebrado no comprendido en el primer párrafo.",together(either(prison(3,12),fine(3,6)),penaEnMeses("animales",12,36))),articulo:"340 bis.1",fuentesOficiales:[CP(340).replace("#a340","#a3-4")]},
  "340bis.3.domestico": {...supuesto("340bis.3.domestico",340,"muerte de animal bajo control humano","Muerte causada en los hechos del apartado 1 a animal bajo control humano.",together(prison(12,24),penaEnMeses("animales",24,48))),articulo:"340 bis.3",fuentesOficiales:[CP(340).replace("#a340","#a3-4")]},
  "340bis.3.vertebrado": {...supuesto("340bis.3.vertebrado",340,"muerte de otro vertebrado","Muerte causada en los hechos del apartado 1 a otro vertebrado.",together(either(prison(6,18),fine(18,24)),penaEnMeses("animales",24,48))),articulo:"340 bis.3",fuentesOficiales:[CP(340).replace("#a340","#a3-4")]},
  "340bis.4": {...supuesto("340bis.4",340,"lesión sin tratamiento o maltrato grave","Lesión sin tratamiento veterinario o maltrato grave sin lesión.",together(either(fine(1,2),tbc(1,30)),penaEnMeses("animales",3,12))),articulo:"340 bis.4",fuentesOficiales:[CP(340).replace("#a340","#a3-4")]},
} satisfies Record<string, SupuestoPenal>;

const agravacionAnimal = (id: "340bis.1.domestico" | "340bis.1.vertebrado" | "340bis.3.domestico" | "340bis.3.vertebrado", nuevoId: string): SupuestoPenal => ({ ...catalogoBase[id], id: nuevoId, subtipo: catalogoBase[id].subtipo + " agravado", penas: mitadSuperior(catalogoBase[id].penas), condiciones: [...catalogoBase[id].condiciones, "Una circunstancia del art. 340 bis.2, acreditada; si muerte, último párrafo del apartado 3."], advertencias: [...catalogoBase[id].advertencias, "Arma de fuego: privación del porte facultativa del sentenciador; no se añade automáticamente."] });
export const catalogoPenal = { ...catalogoBase,
  "340bis.1.domestico.agravado": agravacionAnimal("340bis.1.domestico", "340bis.1.domestico.agravado"),
  "340bis.1.vertebrado.agravado": agravacionAnimal("340bis.1.vertebrado", "340bis.1.vertebrado.agravado"),
  "340bis.3.domestico.agravado": agravacionAnimal("340bis.3.domestico", "340bis.3.domestico.agravado"),
  "340bis.3.vertebrado.agravado": agravacionAnimal("340bis.3.vertebrado", "340bis.3.vertebrado.agravado"),
} satisfies Record<string, SupuestoPenal>;

export type SupuestoPenalId = keyof typeof catalogoPenal;

export function seleccionarSupuestoPenal(id: SupuestoPenalId) {
  const supuestoSeleccionado = catalogoPenal[id];
  return { ...supuestoSeleccionado, gravedad: clasificarDelitoPorPenas(supuestoSeleccionado.penas) };
}

export function gravedadDe(id: SupuestoPenalId) {
  return clasificarDelitoPorPenas(catalogoPenal[id].penas);
}

/** Consecuencias compartidas; nunca transforma una entrada pendiente en un tipo cerrado.
 * Las alternativas deben estar acotadas por hechos, no por el resultado deseado.
 */
export function consecuenciasComunesPenales(ids: readonly SupuestoPenalId[]) {
  const alternativas = [...new Set(ids)].map(seleccionarSupuestoPenal);
  const completas = alternativas.length > 0 && alternativas.every((item) => item.gravedad !== undefined);
  return {
    alternativasPenales: completas ? alternativas.map((item) => item.id as SupuestoPenalId) : [],
    gravedad: completas && alternativas.every((item) => item.gravedad === alternativas[0].gravedad) ? alternativas[0].gravedad : undefined,
    procedibilidad: completas && alternativas.every((item) => item.procedibilidad === alternativas[0].procedibilidad) ? alternativas[0].procedibilidad : undefined,
  };
}
