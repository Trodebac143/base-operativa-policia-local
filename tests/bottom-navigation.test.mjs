import assert from "node:assert/strict";
import test, { after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("la navegación inferior expone las cuatro secciones y el estado activo", async () => {
  const { BottomNavigation } = await vite.ssrLoadModule("/app/bottom-navigation.tsx");
  const html = renderToStaticMarkup(React.createElement(BottomNavigation, {
    active: "library",
    onHome() {}, onSearch() {}, onLibrary() {}, onHelp() {},
  }));
  for (const label of ["Inicio", "Buscar", "Biblioteca", "Ayuda"]) assert.match(html, new RegExp(`>${label}<`));
  assert.match(html, /aria-label="Navegación principal"/);
  assert.match(html, /class="active" aria-current="page"[^>]*>.*Biblioteca/is);
});

test("la barra fija reserva espacio, respeta safe-area y mantiene objetivos táctiles", async () => {
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../app/operational-ui.css", import.meta.url), "utf8");
  assert.match(css, /\.bottom-navigation\s*\{[^}]*position:\s*fixed[^}]*bottom:\s*0/is);
  assert.match(css, /padding-bottom:\s*calc\(var\(--bottom-nav-height\)\s*\+\s*env\(safe-area-inset-bottom\)\)/i);
  assert.match(css, /\.bottom-navigation button\s*\{[^}]*min-height:\s*69px/is);
});
