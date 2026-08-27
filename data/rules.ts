import type { Rule } from "./types";
import validatedPackage from "./paquete_animales_v0_2_validado.json";

const generalRules: Rule[] = [
  {
    id: "GEN-OP-VIS-001",
    nombre: "Separación entre arquitectura interna e interfaz operativa",
    tipo: "control_presentacion",
    contenido: "La interfaz destinada al agente solo muestra comprobaciones, circunstancias relevantes, actuaciones, norma y artículo, texto legal validado, competencia administrativa, destino de diligencias penales y advertencias operativas. Los identificadores técnicos, nombres de casos, fuentes o reglas, nombres de datasets e instrucciones para el motor o el desarrollador permanecen exclusivamente en la capa interna.",
    activo: true
  },
  {
    id: "GEN-JUR-002",
    nombre: "Separación de vía administrativa y destino de diligencias penales",
    tipo: "competencias",
    contenido: "La competencia sancionadora administrativa y el destino de las diligencias penales son campos distintos. El destino penal debe almacenarse como dato validado y no inferirse automáticamente.",
    activo: true
  },
  {
    id: "GEN-OP-ADV-002",
    nombre: "Umbral y actuación en advertencias penales",
    tipo: "control_advertencias",
    contenido: "Toda advertencia penal debe indicar la condición o umbral, la exclusión del encaje base cuando corresponda, la actuación concreta, el destino validado y el precepto con su texto literal validado.",
    activo: true
  },
  {
    id: "GEN-PEN-002",
    nombre: "Integridad de la rama penal",
    tipo: "regla_penal_general",
    aplica_a: "todos los módulos",
    contenido: "Un caso administrativo con posible delito adicional debe utilizar relevancia penal condicional, no directa. La relevancia penal directa solo se utiliza cuando el propio caso ya incluye todos los elementos básicos del supuesto penal validado. Toda rama penal debe expresar condición, actuación, destino y precepto; separar la competencia administrativa del destino de diligencias; mostrar el texto literal desde el dataset penal común; y mantener separado el bloque sobre preferencia de la vía penal y non bis in idem.",
    activo: true
  }
];

export const rules = [...(validatedPackage.reglas as Rule[]).map((rule) => rule.id === "GEN-JUR-001" ? { ...rule, contenido: "Cuando unos mismos hechos puedan tener simultáneamente relevancia administrativa y penal, documentar la infracción administrativa que proceda e instruir las diligencias penales que correspondan. La vía penal tiene preferencia en los términos legalmente establecidos. No puede imponerse doble sanción por los mismos hechos cuando concurra identidad de sujeto, hecho y fundamento. Si la vía penal finaliza sin condena y jurídicamente procede, la vía administrativa podrá iniciarse o reanudarse, respetando los hechos declarados probados judicialmente." } : rule), ...generalRules];
