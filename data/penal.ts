import type { OperationalCase, PenalPrecept } from "./types";

export const ANIMAL_MALTREATMENT_PENAL_DESTINATION = "Fiscalía Provincial de Valencia — Sección de Medio Ambiente (protección/maltrato animal)";

/** Dataset penal común: fuente única de los textos literales mostrados en las ramas penales. */
export const penalArticles: PenalPrecept[] = [
  {
    id: "CP-340-TER",
    norma: "Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal",
    articulo: "340 ter",
    texto_literal: "Quien abandone a un animal vertebrado que se encuentre bajo su responsabilidad en condiciones en que pueda peligrar su vida o integridad será castigado con una pena de multa de uno a seis meses o de trabajos en beneficio de la comunidad de treinta y uno a noventa días. Asimismo, se impondrá la pena de inhabilitación especial de uno a tres años para el ejercicio de profesión, oficio o comercio que tenga relación con los animales y para la tenencia de animales.",
    fuente_id: "AN-SRC-007",
    estado: "validado",
    fecha_revision: "2026-08-27"
  },
  {
    id: "CP-340-BIS",
    norma: "Ley Orgánica 10/1995, de 23 de noviembre, del Código Penal",
    articulo: "340 bis",
    texto_literal: `1. Será castigado con la pena de prisión de tres a dieciocho meses o multa de seis a doce meses y con la pena de inhabilitación especial de uno a tres años para el ejercicio de profesión, oficio o comercio que tenga relación con los animales y para la tenencia de animales el que fuera de las actividades legalmente reguladas y por cualquier medio o procedimiento, incluyendo los actos de carácter sexual, cause a un animal doméstico, amansado, domesticado o que viva temporal o permanentemente bajo el control humano lesión que requiera tratamiento veterinario para el restablecimiento de su salud.

Si las lesiones del apartado anterior se causaren a un animal vertebrado no incluido en el apartado anterior, se impondrá la pena de prisión de tres a doce meses o multa de tres a seis meses, además de la pena de inhabilitación especial de uno a tres años para el ejercicio de la profesión, oficio o comercio que tenga relación con los animales y para la tenencia de animales.

Si el delito se hubiera cometido utilizando armas de fuego, el juez o tribunal podrá imponer motivadamente la pena de privación del derecho a tenencia y porte de armas por un tiempo de uno a cuatro años.

2. Las penas previstas en el apartado anterior se impondrán en su mitad superior cuando concurra alguna de las siguientes circunstancias agravantes:

a) Utilizar armas, instrumentos, objetos, medios, métodos o formas que pudieran resultar peligrosas para la vida o salud del animal.

b) Ejecutar el hecho con ensañamiento.

c) Causar al animal la pérdida o la inutilidad de un sentido, órgano o miembro principal.

d) Realizar el hecho por su propietario o quien tenga confiado el cuidado del animal.

e) Ejecutar el hecho en presencia de un menor de edad o de una persona especialmente vulnerable.

f) Ejecutar el hecho con ánimo de lucro.

g) Cometer el hecho para coaccionar, intimidar, acosar o producir menoscabo psíquico a quien sea o haya sido cónyuge o a persona que esté o haya estado ligada al autor por una análoga relación de afectividad, aun sin convivencia.

h) Ejecutar el hecho en un evento público o difundirlo a través de tecnologías de la información o la comunicación.

i) Utilizar veneno, medios explosivos u otros instrumentos o artes de similar eficacia destructiva o no selectiva.

3. Cuando, con ocasión de los hechos previstos en el apartado primero de este artículo, se cause la muerte de un animal doméstico, amansado, domesticado o que viva temporal o permanentemente bajo el control humano, se impondrá la pena de prisión de doce a veinticuatro meses, además de la pena de inhabilitación especial de dos a cuatro años para el ejercicio de profesión, oficio o comercio que tenga relación con los animales y para la tenencia de animales.

Cuando, con ocasión de los hechos previstos en el apartado primero de este artículo, se cause muerte de un animal vertebrado no incluido en el apartado anterior, se impondrá la pena de prisión de seis a dieciocho meses o multa de dieciocho a veinticuatro meses, además de la pena de inhabilitación especial de dos a cuatro años para el ejercicio de la profesión, oficio o comercio que tenga relación con los animales y para la tenencia de animales.

Si el delito se hubiera cometido utilizando armas de fuego, el juez o tribunal podrá imponer motivadamente la pena de privación del derecho a tenencia y porte de armas por un tiempo de dos a cinco años.

Cuando concurra alguna de las circunstancias previstas en el apartado anterior, el juez o tribunal impondrá las penas en su mitad superior.

4. Si las lesiones producidas no requiriesen tratamiento veterinario o se hubiere maltratado gravemente al animal sin causarle lesiones, se impondrá una pena de multa de uno a dos meses o trabajos en beneficio de la comunidad de uno a treinta días. Asimismo, se impondrá la pena de inhabilitación especial de tres meses a un año para el ejercicio de profesión, oficio o comercio que tenga relación con los animales y para la tenencia de animales.`,
    fuente_id: "AN-SRC-007",
    estado: "validado",
    fecha_revision: "2026-08-27"
  }
];

export const resolveValidatedPenalPrecept = (id?: string | null) => {
  if (!id) return null;
  const precept = penalArticles.find((item) => item.id === id);
  return precept?.estado === "validado" && precept.texto_literal.trim() ? precept : null;
};

export type PenalBranchAudit = {
  caseId: string;
  type: "directa" | "condicional";
  penalArticleId: string | null;
  status: "VALIDADA" | "PENDIENTE_TEXTO_LITERAL" | "SIN_PRECEPTO_COMUN";
};

export function auditPenalBranches(items: OperationalCase[]): PenalBranchAudit[] {
  return items.flatMap((item) => {
    const branches: PenalBranchAudit[] = [];
    if (item.alerta_penal) {
      const entry = penalArticles.find((precept) => precept.id === item.penal_article_id);
      branches.push({ caseId: item.id, type: "directa", penalArticleId: item.penal_article_id ?? null, status: !entry ? "SIN_PRECEPTO_COMUN" : resolveValidatedPenalPrecept(entry.id) ? "VALIDADA" : "PENDIENTE_TEXTO_LITERAL" });
    }
    const conditional = item.datos_adicionales?.relevancia_penal_condicional;
    if (conditional?.activa) {
      const entry = penalArticles.find((precept) => precept.id === conditional.penal_article_id);
      branches.push({ caseId: item.id, type: "condicional", penalArticleId: conditional.penal_article_id, status: !entry ? "SIN_PRECEPTO_COMUN" : resolveValidatedPenalPrecept(entry.id) ? "VALIDADA" : "PENDIENTE_TEXTO_LITERAL" });
    }
    return branches;
  });
}

const ambiguousPenalPatterns = [/valorar relevancia penal/i, /posible relevancia penal/i, /valorar diligencias/i, /valorar instrucci[oó]n de diligencias/i];

export function auditAmbiguousPenalMessages(items: OperationalCase[]) {
  return items.flatMap((item) => Object.entries({ resultado: item.resultado, actuacion: item.actuacion, advertencias: item.advertencias, referencia_penal: item.referencia_penal }).flatMap(([field, value]) => (Array.isArray(value) ? value : [value]).filter((text): text is string => typeof text === "string").filter((text) => ambiguousPenalPatterns.some((pattern) => pattern.test(text))).map((text) => ({ caseId: item.id, field, text }))));
}
