/** Un HTTP 200 también puede ser un buscador, un inicio de sesión o un error del portal. */
export function diagnosticarDestinoFuente({ solicitada, destino, status, contentType = "", inicio = "" }) {
  if (status < 200 || status >= 300) return `HTTP ${status}`;
  const url = new URL(destino);
  if (/\/indexAN\.jsp|\/Resolucion\/Show\/?$/i.test(url.pathname)) return "buscador sin documento concreto";
  if (/\/cotejo|\/login|\/sso\/|\/cas\//i.test(url.pathname)) return "formulario de cotejo o identificación";
  if (/DISPOSICI[ÓO]N NO DISPONIBLE|HA OCURRIDO UN ERROR INESPERADO|Estado HTTP 500|Internal Server Error|Unable to initialize the user driver/i.test(inicio)) return "el portal presenta un error aunque responda HTTP 200";
  if (/Acceso Identificaci[oó]n USUARIO|INICIAR SESI[ÓO]N.*CERTIFICADOS/is.test(inicio)) return "inicio de sesión en lugar del documento";
  const expectedPdf = /\.pdf(?:$|[?&#/])/i.test(solicitada);
  if (expectedPdf && (!/application\/pdf/i.test(contentType) || !inicio.startsWith("%PDF-"))) return "la URL del PDF no entrega un documento PDF";
  return undefined;
}
