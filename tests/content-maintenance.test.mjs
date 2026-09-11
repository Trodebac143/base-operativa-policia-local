import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const caseDirectories = [
  "contenido/animales/casos",
  "contenido/seguridad_vial/itv/casos",
  "contenido/seguridad_vial/seguro/casos",
  "contenido/seguridad_vial/permisos/casos",
];

test("cada caso editable vive en un único archivo y el índice conserva los 50", async () => {
  const cases = [];
  for (const directory of caseDirectories) {
    const names = (await readdir(path.join(root, directory))).filter((name) => name.endsWith(".json")).sort((left, right) => left.localeCompare(right, "es", { numeric: true }));
    for (const name of names) {
      const item = JSON.parse(await readFile(path.join(root, directory, name), "utf8"));
      assert.equal(name, `${item.id}.json`);
      assert.equal(Array.isArray(item), false);
      cases.push(item);
    }
  }
  const generated = JSON.parse(await readFile(path.join(root, "contenido/_generado/casos.json"), "utf8"));
  assert.equal(cases.length, 50);
  assert.deepEqual(generated, cases);
});

test("los nombres físicos de PDF solo se relacionan desde la biblioteca", async () => {
  const sourcesText = await readFile(path.join(root, "contenido/juridico/fuentes.json"), "utf8");
  const metadata = JSON.parse(await readFile(path.join(root, "contenido/biblioteca/metadatos.json"), "utf8"));
  const generated = JSON.parse(await readFile(path.join(root, "contenido/biblioteca/documentos.json"), "utf8"));
  assert.doesNotMatch(sourcesText, /documentoLocal/);
  assert.equal(metadata.length, 8);
  assert.equal(new Set(metadata.map((document) => document.id)).size, metadata.length);
  assert.deepEqual(generated, metadata);
});

test("los subgrupos no repiten listas de casos", async () => {
  const groups = JSON.parse(await readFile(path.join(root, "contenido/seguridad_vial/permisos/subgrupos.json"), "utf8"));
  assert.ok(groups.every((group) => !("casos" in group)));
});
