import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("agrupa los casos de Permisos sin alterar su contenido operativo", async () => {
  const { permisosCases, permisosGroups } = await vite.ssrLoadModule("/data/permisos.ts");
  assert.equal(permisosCases.length, 18);
  assert.deepEqual(permisosGroups.map((group) => [group.nombre, group.casos.length]), [["Pérdida de Vigencia", 4], ["Suspensión Judicial", 3], ["Permisos extranjeros", 6]]);
  for (const group of permisosGroups) for (const id of group.casos) assert.equal(permisosCases.find((item) => item.id === id)?.subgrupo, group.id);
});

test("aplica los rótulos solicitados a los casos 5 a 11", async () => {
  const { permisosCases } = await vite.ssrLoadModule("/data/permisos.ts");
  assert.deepEqual(permisosCases.slice(4, 11).map((item) => item.titulo), [
    "Por pérdida de puntos (firme, conocida y ejecutiva)",
    "Por pérdida total de puntos (edictal)",
    "En periodo de recurso",
    "Fuera del plazo de la pérdida de vigencia sin curso ni examen",
    "Conducir dentro del plazo de suspensión judicial",
    "Conducir fuera del plazo de suspensión judicial (hasta 2 años) sin haber hecho curso",
    "Conducir fuera del plazo de suspensión judicial (> 2 años) sin haber recuperado el permiso de conducir",
  ]);
});

test("sitúa los enlaces y la ayuda común únicamente en Permisos extranjeros", async () => {
  const { permisosCases, permisosGroups } = await vite.ssrLoadModule("/data/permisos.ts");
  const { PermitGroupView } = await vite.ssrLoadModule("/app/permit-navigation.tsx");
  const group = permisosGroups.find((item) => item.id === "permisos_extranjeros");
  const html = renderToStaticMarkup(React.createElement(PermitGroupView, { group, cases: permisosCases, onOpenCase() {} }));
  assert.match(html, /CONSULTAR PAÍSES CON CONVENIO — DGT/);
  assert.match(html, /VER REQUISITOS ART\. 21/);
  assert.match(html, /Permiso UE\/EEE válido y en vigor/);
  assert.equal(permisosCases.filter((item) => item.subgrupo === group.id).length, 6);
  assert.ok(permisosCases.filter((item) => item.subgrupo === group.id).every((item) => !item.ayudas && !item.enlaces_operativos));
});
