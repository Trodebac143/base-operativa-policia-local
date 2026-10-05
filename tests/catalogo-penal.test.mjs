import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});
after(async () => vite.close());

const { catalogoPenal, gravedadDe, seleccionarSupuestoPenal } = await vite.ssrLoadModule("/data/catalogo-penal.ts");
const { clasificarDelitoPorPenas, transformarMarcoPenal } = await vite.ssrLoadModule("/data/gravedad-penal.ts");
const L = "DELITO LEVE";
const M = "DELITO MENOS GRAVE";
const G = "DELITO GRAVE";

test("el catálogo conserva IDs, ancla cada fuente en el artículo BOE y documenta los supuestos condicionales", () => {
  const entries = Object.entries(catalogoPenal);
  const ids = entries.map(([, entry]) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const [key, entry] of entries) {
    assert.equal(entry.id, key);
    assert.ok(entry.fuentesOficiales.length > 0, `${key} debe citar fuente oficial`);
    for (const url of entry.fuentesOficiales) {
      assert.match(url, /^https:\/\/www\.boe\.es\/buscar\/act\.php\?id=BOE-A-1995-25444#a[a-z\d-]+$/i);
    }
    assert.ok(Array.isArray(entry.condiciones), `${key} debe declarar condiciones como lista`);
    if (entry.penasCondicionales) {
      assert.ok(entry.condiciones.length > 0, `${key} debe explicar cuándo aplica la pena principal`);
      assert.ok(entry.penasCondicionales.every((pena) => pena.condicion.trim() && pena.penas), `${key} debe documentar cada pena condicional`);
    }
  }
  for (const id of ["148.1", "153.1", "153.2", "169.1.logrado", "169.1.no_logrado", "172ter.1.vulnerable", "235.2", "242.3.general", "266.4.base", "181.1.1816"]) {
    assert.ok(catalogoPenal[id].condiciones.length > 0, `${id} debe describir sus presupuestos de aplicación`);
  }
});

test("las fuentes de pena pendiente o condicionada no cierran gravedad por sí solas", () => {
  for (const id of ["149-150.pendiente", "169.pendiente", "183bis.pendiente"]) {
    assert.equal(gravedadDe(id), undefined, id);
    assert.equal(seleccionarSupuestoPenal(id).gravedad, undefined, id);
  }
  assert.equal(clasificarDelitoPorPenas({ tipo: "pendiente" }), undefined);
  assert.equal(clasificarDelitoPorPenas({ tipo: "pena", pena: { tipo: "prision" } }), undefined);
});

test("el catálogo produce las gravedades esperadas en las ramas penales principales", () => {
  const expected = {
    "147.1": M,
    "147.2": L,
    "147.3": L,
    "148.1": M,
    "149.1": G,
    "150": G,
    "153.1": M,
    "153.2": M,
    "154": M,
    "171.5": M,
    "171.7.domestica": L,
    "172.3.domestica": L,
    "172ter.2": M,
    "173.4": L,
    "550.agente": M,
    "550.autoridad": M,
    "550.especial": G,
    "551.agente": M,
    "551.autoridad": G,
    "551.especial": G,
    "266.1": M,
    "266.2": M,
    "266.3": G,
    "266.4.base": M,
    "266.4.agravado": M,
    "266.4.especial": G,
    "181.1.1815": G,
    "181.1.1816": G,
    "340bis.4": L,
    "340bis.1.domestico": M,
    "340bis.1.vertebrado": M,
    "340bis.3.domestico": M,
    "340bis.3.vertebrado": M,
    "340ter": M,
  };
  for (const [id, expectedGravity] of Object.entries(expected)) {
    assert.equal(gravedadDe(id), expectedGravity, id);
  }
});

test("los marcos de un grado superior conservan unidades y días adicionales exactos", () => {
  const cases = [
    ["551.agente", { tipo: "prision", minimo: { unidad: "meses", valor: 36, diasAdicionales: 1 }, maximo: { unidad: "meses", valor: 54 } }],
    ["551.autoridad", { tipo: "prision", minimo: { unidad: "meses", valor: 48, diasAdicionales: 1 }, maximo: { unidad: "meses", valor: 72 } }],
    ["551.especial", { tipo: "prision", minimo: { unidad: "meses", valor: 72, diasAdicionales: 1 }, maximo: { unidad: "meses", valor: 108 } }],
  ];
  for (const [id, expectedPrison] of cases) {
    const framework = catalogoPenal[id].penas;
    const prisonWrapper = framework.tipo === "conjuntas" ? framework.penas.find((p) => p.tipo === "superior_grado" && p.base.pena?.tipo === "prision") : framework;
    assert.equal(prisonWrapper.tipo, "superior_grado", id);
    const transformedPrison = transformarMarcoPenal(prisonWrapper.base, "superior_grado");
    assert.ok(transformedPrison, id);
    assert.deepEqual(transformedPrison.pena, expectedPrison, id);
  }

  const authority = catalogoPenal["551.autoridad"].penas;
  const fineWrapper = authority.penas.find((p) => p.tipo === "superior_grado" && p.base.pena?.tipo === "multa");
  assert.deepEqual(transformarMarcoPenal(fineWrapper.base, "superior_grado").pena, {
    tipo: "multa",
    minimo: { unidad: "dias", valor: 181 },
    maximo: { unidad: "dias", valor: 270 },
  });
});

test("la mitad superior no inventa gravedad leve ni degrada marcos graves", () => {
  assert.equal(gravedadDe("234.3.leve"), L);
  assert.equal(gravedadDe("181.1.1815"), G);
  assert.equal(gravedadDe("181.1.1816"), G);
  const halfWrapper = catalogoPenal["234.3.leve"].penas;
  assert.equal(halfWrapper.tipo, "mitad_superior");
  const halfFine = transformarMarcoPenal(halfWrapper.base, "mitad_superior");
  assert.deepEqual(halfFine.pena, {
    tipo: "multa",
    minimo: { unidad: "dias", valor: 61 },
    maximo: { unidad: "dias", valor: 90 },
  });
});

test("procedibilidad distingue denuncia de oficio en los marcos indicados", () => {
  assert.equal(catalogoPenal["171.7.general"].procedibilidad, "denuncia");
  assert.equal(catalogoPenal["171.7.domestica"].procedibilidad, "oficio");
  assert.equal(catalogoPenal["173.4"].procedibilidad, "denuncia");
  assert.equal(catalogoPenal["172ter.1"].procedibilidad, "denuncia");
  assert.equal(catalogoPenal["172ter.2"].procedibilidad, "oficio");
});
