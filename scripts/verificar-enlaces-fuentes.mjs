import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = JSON.parse(fs.readFileSync(path.join(root, "contenido/juridico/fuentes.json"), "utf8"));
const selected = process.argv.slice(2);
const targets = sources.filter((source) => source.urlOficial && (!selected.length || selected.includes(source.id)));
const failures = [];

for (const source of targets) {
  try {
    const response = await fetch(source.urlOficial, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "Base-Operativa-Source-Check/1.0" } });
    if (!response.ok) failures.push(`${source.id}: HTTP ${response.status} (${source.urlOficial})`);
    else console.log(`OK ${source.id} · HTTP ${response.status} · ${response.url}`);
    await response.body?.cancel();
  } catch (error) {
    failures.push(`${source.id}: ${error.message} (${source.urlOficial})`);
  }
}

if (!targets.length) failures.push("No se encontraron fuentes enlazadas para comprobar");
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${targets.length} enlace(s) de fuente comprobados correctamente.`);
