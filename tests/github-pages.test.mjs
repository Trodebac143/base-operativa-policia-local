import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("GitHub Pages usa exportación estática y un basePath calculado", async () => {
  const config = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(config, /output:\s*["']export["']/);
  assert.match(config, /GITHUB_REPOSITORY/);
  assert.match(config, /basePath:\s*pagesBasePath/);
  assert.doesNotMatch(config, /base-operativa-policia-local/);
});

test("los recursos públicos se resuelven mediante un único helper", async () => {
  const helper = await readFile(new URL("../lib/public-path.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(helper, /NEXT_PUBLIC_BASE_PATH/);
  assert.match(page, /publicPath\(`\/documentos\/\$\{document\.archivo\}`\)/);
  assert.match(layout, /publicPath\("\/favicon\.svg"\)/);
  assert.doesNotMatch(page, /encodeURI\(`\/documentos\//);
});

test("el workflow utiliza las acciones oficiales de GitHub Pages", async () => {
  const workflow = await readFile(new URL("../.github/workflows/deploy-pages.yml", import.meta.url), "utf8");
  assert.match(workflow, /branches:\s*\[main\]/);
  assert.match(workflow, /actions\/configure-pages@v5/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
});
