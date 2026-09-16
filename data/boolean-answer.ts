/** Convierte la respuesta visible a una pregunta positiva al dato interno formulado en negativo. */
export const invertBooleanAnswer = (value: boolean | undefined): boolean | undefined => value === undefined ? undefined : !value;
