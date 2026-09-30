import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));

test("los módulos declaran su icono sin incrustarlo en el nombre", async () => {
  const modules = await readJson("../contenido/estructura/modulos.json");
  assert.deepEqual(
    Object.fromEntries(modules.map((module) => [module.id, module.icono])),
    { animales: "🐾", seguridad_vial: "🚦", policia_administrativa: "🏛️", seguridad_publica: "🛡️" },
  );
  assert.deepEqual(modules.map((module) => module.nombre), ["Animales", "Seguridad Vial", "Policía Administrativa", "Seguridad Pública"]);
});

test("todas las categorías navegables declaran icono y mantienen el nombre limpio", async () => {
  const categories = await readJson("../contenido/estructura/categorias.json");
  assert.ok(categories.length >= 24);
  for (const category of categories) {
    assert.ok(category.icono, `Falta icono en ${category.id}`);
    assert.ok(!category.nombre.startsWith(`${category.icono} `), `Icono duplicado en el nombre de ${category.id}`);
  }
  const expected = {
    animales_identificacion: "🏷️",
    animales_ppp: "🐕",
    animales_sanidad: "🩺",
    animales_abandono: "🚐",
    animales_convivencia: "🐾",
    seguridad_vial_itv: "🔧",
    seguridad_vial_seguro: "🛡️",
    seguridad_vial_permisos: "🪪",
    seguridad_vial_alcoholemia: "🧪",
    seguridad_vial_vmp: "🛴",
  };
  for (const [id, icon] of Object.entries(expected)) assert.equal(categories.find((category) => category.id === id)?.icono, icon);
});

test("las estructuras internas relevantes disponen de iconografía propia", async () => {
  const groups = await readJson("../contenido/seguridad_vial/permisos/subgrupos.json");
  const vmp = await readJson("../contenido/seguridad_vial/vmp/guia.json");
  const alcohol = await readJson("../contenido/seguridad_vial/alcoholemia.json");
  const publicSecurity = await readJson("../contenido/seguridad_publica/operativa.json");

  for (const group of groups) assert.ok(group.icono, `Falta icono en grupo ${group.id}`);
  for (const area of vmp.areas) assert.ok(area.icono, `Falta icono en área VMP ${area.id}`);
  for (const option of alcohol.selector_vehiculo.opciones) assert.ok(option.icono, `Falta icono en vehículo ${option.id}`);
  for (const section of alcohol.presentacion.secciones_secundarias) assert.ok(section.icono, `Falta icono en sección ${section.id}`);
  for (const concept of publicSecurity.conceptos) assert.ok(concept.icono, `Falta icono en concepto ${concept.id}`);
});

test("la interfaz consume iconos estructurados y no tablas o posiciones accidentales", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const permits = await readFile(new URL("../app/permit-navigation.tsx", import.meta.url), "utf8");
  const publicSecurity = await readFile(new URL("../app/seguridad-publica.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(page, /moduleIcons|moduleCardName/);
  assert.match(page, /m\.icono/);
  assert.match(page, /c\.icono/);
  assert.match(permits, /group\.icono/);
  assert.match(publicSecurity, /concept\.icono/);
});

test("Volver y Consulta rápida comparten un panel sticky sin alterar sus condiciones", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/operational-ui.css", import.meta.url), "utf8");
  assert.match(page, /const showBack = Boolean\(selectedModule \|\| selectedCategory \|\| selectedCase \|\| view\.library \|\| view\.help\)/);
  assert.match(page, /const showSearch = !selectedCase && !view\.library && !view\.help/);
  assert.match(page, /className="quick-access-panel"/);
  assert.match(css, /\.quick-access-panel\s*\{[^}]*position:\s*sticky/i);
  assert.match(css, /\.quick-access-panel \.results\s*\{[^}]*overflow-y:\s*auto/i);
  assert.doesNotMatch(css.match(/\.quick-access-panel\s*\{[^}]*\}/i)?.[0] ?? "", /position:\s*fixed/i);
});
