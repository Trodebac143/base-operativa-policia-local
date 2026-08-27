import type { OperationalCase } from "./types";
import validatedPackage from "./paquete_animales_v0_2_validado.json";

const nuevosCasosV03: OperationalCase[] = [
  {
    id: "AN-OP-017",
    modulo: "animales",
    categoria: "animales_identificacion",
    titulo: "Datos registrales del animal no actualizados",
    palabras_clave: ["registro", "datos", "actualización", "titular", "domicilio", "teléfono", "RIAC", "identificación"],
    que_comprobar: [
      "Identificar al animal y a su responsable legal.",
      "Comprobar que el animal está sujeto a identificación y consta en el registro correspondiente.",
      "Determinar qué dato registral obligatorio está desactualizado.",
      "Comprobar, cuando sea posible, desde cuándo existe el cambio y si fue comunicado.",
      "Documentar la consulta registral y el dato concreto que no está actualizado."
    ],
    resultado: "No mantener actualizados los datos del animal en el Registro Supramunicipal de Identificación de Animales de Compañía de la Comunitat Valenciana.",
    norma: "Ley 2/2023 de la Comunitat Valenciana",
    articulo: "42.2.g",
    calificacion: "leve",
    rango_min: 100,
    rango_max: 3000,
    actuacion: [
      "Identificar al responsable y al animal.",
      "Comprobar la información registral disponible.",
      "Precisar en el acta qué dato consta desactualizado y cuál es el dato correcto acreditado.",
      "Formular denuncia si se acredita el incumplimiento.",
      "Informar al responsable de que debe actualizar los datos en el registro correspondiente."
    ],
    competencia_denuncia: "Policía Local",
    competencia_resuelve: "Ayuntamiento de Torrent",
    advertencias: [
      "No confundir datos registrales desactualizados con ausencia de identificación física (chip), falta de inscripción registral o falta de censo municipal.",
      "Debe concretarse qué dato obligatorio no está actualizado; no basta una referencia genérica a 'datos incorrectos'."
    ],
    alerta_penal: false,
    referencia_penal: null,
    regla_transversal: null,
    fuentes: ["AN-SRC-018"],
    fichas_juridicas: ["AN-JUR-033"],
    estado: "validado"
  },
  {
    id: "AN-OP-018",
    modulo: "animales",
    categoria: "animales_identificacion",
    titulo: "Extravío, pérdida o sustracción del animal no comunicada",
    palabras_clave: ["pérdida", "extravío", "sustracción", "robo", "desaparición", "comunicación", "registro", "denuncia"],
    que_comprobar: [
      "Identificar al responsable legal y determinar qué animal ha desaparecido.",
      "Comprobar si el animal estaba sujeto a identificación y si constaba inscrito en el registro.",
      "Determinar si se trata de extravío/pérdida o de sustracción.",
      "Comprobar la fecha y hora aproximadas en que se tuvo conocimiento de la desaparición.",
      "Comprobar si se efectuó comunicación al Registro Valenciano/Supramunicipal y al ayuntamiento cuando resulte exigible.",
      "En caso de extravío o sustracción de animal identificado, comprobar si la comunicación fue acompañada de la correspondiente denuncia cuando proceda."
    ],
    resultado: "Incumplimiento de la obligación legal de comunicar la desaparición del animal. El precepto sancionador concreto depende de si el animal está identificado y de si el hecho es extravío/pérdida o sustracción.",
    norma: "Ley 2/2023 de la Comunitat Valenciana",
    articulo: "42.2.e / 42.2.f / 42.2.t, según supuesto",
    calificacion: "leve",
    rango_min: 100,
    rango_max: 3000,
    actuacion: [
      "Identificar al responsable y recabar los datos del animal.",
      "Comprobar la situación de identificación e inscripción registral.",
      "Determinar con precisión si se trata de extravío/pérdida o sustracción.",
      "Comprobar las comunicaciones efectuadas y sus fechas.",
      "Documentar en el acta el supuesto concreto y el precepto aplicable.",
      "Formular denuncia si se acredita el incumplimiento.",
      "Informar al responsable de la obligación de comunicar inmediatamente la desaparición por los cauces legalmente exigibles."
    ],
    competencia_denuncia: "Policía Local",
    competencia_resuelve: "Ayuntamiento de Torrent",
    advertencias: [
      "Animal identificado: la falta de comunicación del extravío al registro se encuadra en el art. 42.2.e.",
      "Animal no identificado/no incluido en el registro: la falta de comunicación del extravío o pérdida a la autoridad competente se encuadra en el art. 42.2.f.",
      "La sustracción está expresamente incluida entre las obligaciones del art. 6.2.b, pero no aparece nominada en los tipos específicos 42.2.e y 42.2.f; cuando no concurra otro tipo específico, debe utilizarse con cautela el tipo residual del art. 42.2.t.",
      "No confundir la falta de comunicación de la desaparición con abandono del animal."
    ],
    alerta_penal: false,
    referencia_penal: null,
    regla_transversal: null,
    fuentes: ["AN-SRC-018"],
    fichas_juridicas: ["AN-JUR-034"],
    estado: "validado",
    datos_adicionales: {
      encaje_condicional: [
        { supuesto: "Animal identificado: extravío no comunicado al registro en plazo", articulo: "42.2.e", calificacion: "leve" },
        { supuesto: "Animal no identificado/no incluido en registro: extravío o pérdida no comunicado a autoridad competente", articulo: "42.2.f", calificacion: "leve" },
        { supuesto: "Sustracción no comunicada cuando no exista tipo específico aplicable", articulo: "42.2.t en relación con 6.2.b", calificacion: "leve" }
      ]
    }
  },
  {
    id: "AN-OP-019",
    modulo: "animales",
    categoria: "animales_identificacion",
    titulo: "No poner a disposición de los agentes la documentación obligatoria de identificación",
    palabras_clave: ["documentación", "identificación", "agentes", "requerimiento", "no facilita", "no aporta", "registro", "documentos"],
    que_comprobar: [
      "Realizar un requerimiento claro de documentación de identificación que resulte obligatoria en el caso concreto.",
      "Identificar qué documento se solicita y por qué resulta exigible.",
      "Comprobar si la documentación puede verificarse por medios disponibles antes de concluir que existe incumplimiento.",
      "Documentar el requerimiento y la respuesta concreta de la persona responsable."
    ],
    resultado: "No poner a disposición de la autoridad competente o de sus agentes la documentación de identificación del animal que haya sido requerida y resulte obligatoria en el caso concreto.",
    norma: "Ley 2/2023 de la Comunitat Valenciana",
    articulo: "42.2.m",
    calificacion: "leve",
    rango_min: 100,
    rango_max: 3000,
    actuacion: [
      "Identificar al responsable y al animal.",
      "Precisar el documento obligatorio requerido.",
      "Realizar y documentar el requerimiento.",
      "Comprobar, cuando sea posible, la información mediante los sistemas disponibles.",
      "Hacer constar la respuesta o negativa concreta.",
      "Formular denuncia cuando se acrediten todos los elementos del tipo."
    ],
    competencia_denuncia: "Policía Local",
    competencia_resuelve: "Ayuntamiento de Torrent",
    advertencias: [
      "El tipo exige que la documentación haya sido requerida y que resulte obligatoria en el caso concreto.",
      "No equiparar automáticamente 'no portar físicamente' con 'carecer de documentación' si esta puede comprobarse por otros medios.",
      "Para PPP existe además un régimen sancionador específico; si el animal es PPP debe acudirse primero a la rama PPP y valorar la especialidad."
    ],
    alerta_penal: false,
    referencia_penal: null,
    regla_transversal: null,
    fuentes: ["AN-SRC-018"],
    fichas_juridicas: ["AN-JUR-035"],
    estado: "validado"
  }
];

export const cases = [...(validatedPackage.casos as OperationalCase[]), ...nuevosCasosV03];
