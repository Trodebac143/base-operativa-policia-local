import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("el layout raiz incorpora una unica firma transversal con el texto exacto", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const signatures = layout.match(/OFICIAL 46244143/g) ?? [];

  assert.equal(signatures.length, 1);
  assert.match(layout, /className="project-signature"/);
  assert.match(layout, /aria-hidden="true"/);
});

test("la firma es fija, discreta, no interactiva y respeta navegacion y areas seguras", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  assert.match(css, /\.project-signature\s*\{[^}]*position:\s*fixed/is);
  assert.match(css, /right:\s*max\([^;]*safe-area-inset-right/is);
  assert.match(css, /bottom:\s*calc\([^;]*--bottom-nav-height[^;]*safe-area-inset-bottom/is);
  assert.match(css, /opacity:\s*\.64/i);
  assert.match(css, /pointer-events:\s*none/i);
  assert.match(css, /body:has\(\.sp-mobile-actions\)\s+\.project-signature/is);
  assert.match(css, /--project-signature-space:\s*34px/i);
});
