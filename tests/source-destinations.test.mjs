import assert from "node:assert/strict";
import test from "node:test";
import { diagnosticarDestinoFuente as diagnose } from "../scripts/diagnosticar-destino-fuente.mjs";

const response = (override = {}) => ({ solicitada: "https://example.org/documento.pdf", destino: "https://example.org/documento.pdf", status: 200, contentType: "application/pdf", inicio: "%PDF-1.7", ...override });
test("las incidencias de las capturas se detectan aunque el servidor responda 200", () => {
  for (const inicio of ["DISPOSICIÓN NO DISPONIBLE", "HA OCURRIDO UN ERROR INESPERADO", "Estado HTTP 500 – Internal Server Error", "Acceso Identificación USUARIO"]) assert.ok(diagnose(response({ inicio, contentType: "text/html" })));
  assert.match(diagnose(response({ destino: "https://www.poderjudicial.es/search/indexAN.jsp?org=TS&num=210" })), /buscador/);
  assert.match(diagnose(response({ destino: "https://hj.tribunalconstitucional.es/es/Resolucion/Show/?query=STC24" })), /buscador/);
  assert.match(diagnose(response({ destino: "https://sede.example.es/cotejo/csv" })), /cotejo/);
});
test("un PDF aparente que entrega HTML no pasa; documento HTML concreto y PDF real sí", () => {
  assert.ok(diagnose(response({ inicio: "<html>buscador</html>", contentType: "text/html" })));
  assert.equal(diagnose(response()), undefined);
  assert.equal(diagnose(response({ solicitada: "https://hj.tribunalconstitucional.es/es-ES/Resolucion/Show/5029", destino: "https://hj.tribunalconstitucional.es/es-ES/Resolucion/Show/5029", contentType: "text/html", inicio: "Buscador de jurisprudencia constitucional SENTENCIA 24/2004" })), undefined);
  assert.match(diagnose(response({ status: 500 })), /HTTP 500/);
});
