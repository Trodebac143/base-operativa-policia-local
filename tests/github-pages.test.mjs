import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("GitHub Pages usa exportación estática y un basePath calculado", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /PAGES_BUILD/);
  assert.match(config, /output:\s*["']export["']/);
  assert.match(config, /GITHUB_REPOSITORY/);
  assert.match(config, /basePath:\s*pagesBasePath/);
  assert.doesNotMatch(config, /base-operativa-policia-local/);
});

test("los recursos públicos se resuelven mediante un único helper", async () => {
  const helper = await readFile(new URL("../lib/public-path.ts", import.meta.url), "utf8");
  const libraryView = await readFile(new URL("../app/library-view.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(helper, /NEXT_PUBLIC_BASE_PATH/);
  assert.match(libraryView, /publicPath\(`\/documentos\/\$\{document\.archivo\}`\)/);
  assert.match(libraryView, /publicPath\(`\/documentos\/\$\{source\.documentoLocal\}`\)/);
  assert.match(layout, /publicPath\("\/favicon\.ico"\)/);
  assert.match(layout, /publicPath\("\/manifest\.webmanifest"\)/);
  assert.match(layout, /apple-touch-icon\.png/);
  assert.match(layout, /applicationName: "Base Operativa"/);
  assert.doesNotMatch(libraryView, /encodeURI\(`\/documentos\//);
});

test("la identidad visual usa el master y derivados accesibles bajo basePath", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.match(page, /publicPath\("\/branding\/Icono_Base_Operativa\.png"\)/);
  assert.equal(manifest.name, "Base Operativa Policía Local");
  assert.equal(manifest.short_name, "Base Operativa");
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ["192x192", "512x512"]);
  for (const asset of [
    "public/favicon.ico",
    "public/branding/Icono_Base_Operativa.png",
    "public/branding/favicon-16x16.png",
    "public/branding/favicon-32x32.png",
    "public/branding/apple-touch-icon.png",
    "public/branding/icon-192x192.png",
    "public/branding/icon-512x512.png",
  ]) {
    await access(join(fileURLToPath(new URL("..", import.meta.url)), asset));
  }
});

test("el workflow utiliza las acciones oficiales de GitHub Pages", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /PAGES_BUILD:\s*["']true["']/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
});
