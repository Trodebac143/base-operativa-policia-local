import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { diagnosticarDestinoFuente } from "./diagnosticar-destino-fuente.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = JSON.parse(fs.readFileSync(path.join(root, "contenido/juridico/fuentes.json"), "utf8"));
const selected = process.argv.slice(2);
const selectedSources = sources.filter((source) => !selected.length || selected.includes(source.id));
const targets = selectedSources.flatMap((source) => [source.urlOficial, ...(source.enlacesAdicionales ?? []).map((link) => link.url)].filter(Boolean).map((url) => ({ id: source.id, url })));
const failures = [];
for (const source of selectedSources.filter((source) => source.consultaPendiente)) {
  failures.push(`${source.id}: consulta pendiente — ${source.consultaPendiente}`);
}

async function check(source) {
  try {
    const response = await fetch(source.url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "Base-Operativa-Source-Check/1.0" } });
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let inicio = "";
    try {
      while (reader && inicio.length < 100000) {
        const chunk = await reader.read();
        if (chunk.done) break;
        inicio += decoder.decode(chunk.value, { stream: true });
      }
    } finally { await reader?.cancel(); }
    const error = diagnosticarDestinoFuente({ solicitada: source.url, destino: response.url, status: response.status, contentType: response.headers.get("content-type") ?? "", inicio });
    if (error) failures.push(`${source.id}: ${error} (${source.url} → ${response.url})`);
    else console.log(`OK ${source.id} · HTTP ${response.status} · ${response.url}`);
  } catch (error) {
    failures.push(`${source.id}: ${error.message} (${source.url})`);
  }
}
// Peticiones independientes, en tandas limitadas para no saturar los portales oficiales.
for (let offset = 0; offset < targets.length; offset += 5) await Promise.all(targets.slice(offset, offset + 5).map(check));

if (!targets.length) failures.push("No se encontraron fuentes enlazadas para comprobar");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${targets.length} enlace(s) sin errores de acceso detectados. Revisar también la identidad del documento; HTTP 200 no la garantiza.`);
