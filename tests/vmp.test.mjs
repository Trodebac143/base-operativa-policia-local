import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

const data = await vite.ssrLoadModule("/data/vmp.ts");
const { seguroCases } = await vite.ssrLoadModule("/data/seguro.ts");
const base = {
  electric: true,
  seats: 1,
  hasSeat: false,
  selfBalancing: true,
  meetsOtherRequirements: true,
  modified: false,
  observedMaxSpeed: null,
};
const doc = (overrides = {}) => ({ category: "A", marketedBeforeCutoff: false, asOf: "2026-09-07", hasCertificate: true, registered: true, hasIdentificationLabel: true, hasMarkingPlate: true, ...overrides });

test("1 · MOM 25 kg y Vmax 25 km/h resuelve VPL", () => {
  const result = data.classifyVmp({ ...base, mass: 25, factoryMaxSpeed: 25 });
  assert.equal(result.category, "A");
  assert.equal(result.title, "VPL");
});

test("2 · MOM 25,01 kg y Vmax 14 km/h resuelve VPL", () => {
  const result = data.classifyVmp({ ...base, mass: 25.01, factoryMaxSpeed: 14 });
  assert.equal(result.category, "A");
  assert.equal(result.reason, "categoria_a_pesado_lento");
});

test("3 · MOM 25,01 kg y Vmax 15 km/h resuelve vehículo a motor a efectos del seguro", () => {
  const result = data.classifyVmp({ ...base, mass: 25.01, factoryMaxSpeed: 15 });
  assert.equal(result.category, "B");
  assert.match(result.title, /vehículo a motor a efectos del seguro/i);
});

test("4 · VMP original hasta 25 km/h manipulado a 38 conserva su clase y activa 5D", () => {
  const result = data.classifyVmp({ ...base, mass: 15, factoryMaxSpeed: 25, modified: true, observedMaxSpeed: 38 });
  assert.equal(result.category, "A");
  assert.equal(result.originalCategoryPreserved, true);
  assert.equal(result.technicalViolationId, "5D");
  assert.match(result.detail, /no convertirlo automáticamente en ciclomotor/i);
  const output = data.resolveVmpTechnical("5D");
  assert.equal(output.codigo, "VEH.22.B-2.5D");
  assert.equal(output.articulo, "Anexo XXI RGV");
  assert.ok(output.actuacion.some((step) => /No retirar al depósito/i.test(step)));
});

test("5 · Vmax 60 km/h de fábrica no es VMP ni activa automáticamente 1.1.5B", () => {
  const result = data.classifyVmp({ ...base, mass: 20, factoryMaxSpeed: 60 });
  assert.equal(result.category, "NO_VMP");
  assert.equal(result.reason, "velocidad_fabrica_superior_25");
  assert.equal(data.resolveNonVmpRoute(null), null);
  assert.equal(data.resolveNonVmpRoute("UE_168_2013"), null);
  const nonRegistrable = data.resolveNonVmpRoute("NO_MATRICULABLE");
  assert.equal(nonRegistrable.codigo, "VEH.1.1.5B");
  assert.equal(nonRegistrable.articulo, "Art. 1 RGV");
});

test("6 · VMP 2022 sin certificado pero inscrito en 2026 no recibe 5A", () => {
  const result = data.resolveVmpDocumentation(doc({ marketedBeforeCutoff: true, hasCertificate: false, hasMarkingPlate: false }));
  assert.equal(result.transitional, true);
  assert.deepEqual(result.complaints, []);
  assert.doesNotMatch(result.message, /denunciar 5A/i);
});

test("7 · VMP 2022 sin certificado ni inscripción en 2026 recibe solo 5B", () => {
  const result = data.resolveVmpDocumentation(doc({ marketedBeforeCutoff: true, hasCertificate: false, registered: false, hasIdentificationLabel: false, hasMarkingPlate: false }));
  assert.deepEqual(result.complaints.map((item) => item.id), ["5B"]);
  assert.deepEqual(result.complaints[0].absorbe, ["5C"]);
});

test("8 · el 22/01/2027 sigue siendo el último día transitorio", () => {
  const result = data.resolveVmpDocumentation(doc({ marketedBeforeCutoff: true, asOf: "2027-01-22", hasCertificate: false, hasMarkingPlate: false }));
  assert.equal(result.transitional, true);
  assert.deepEqual(result.complaints, []);
});

test("9 · el 23/01/2027 la falta de certificado activa 5A", () => {
  const result = data.resolveVmpDocumentation(doc({ marketedBeforeCutoff: true, asOf: "2027-01-23", hasCertificate: false, hasMarkingPlate: false }));
  assert.equal(result.transitional, false);
  assert.deepEqual(result.complaints.map((item) => item.id), ["5A"]);
});

test("10 · sin certificado exigible, inscripción ni etiqueta se aplica únicamente 5A", () => {
  const result = data.resolveVmpDocumentation(doc({ hasCertificate: false, registered: false, hasIdentificationLabel: false, hasMarkingPlate: false }));
  assert.deepEqual(result.complaints.map((item) => item.id), ["5A"]);
  assert.deepEqual(result.complaints[0].absorbe, ["5B", "5C"]);
});

test("11 · con certificado pero sin inscripción ni etiqueta se aplica únicamente 5B", () => {
  const result = data.resolveVmpDocumentation(doc({ registered: false, hasIdentificationLabel: false }));
  assert.deepEqual(result.complaints.map((item) => item.id), ["5B"]);
});

test("12 · con certificado e inscripción pero sin etiqueta se aplica únicamente 5C", () => {
  const result = data.resolveVmpDocumentation(doc({ hasIdentificationLabel: false }));
  assert.deepEqual(result.complaints.map((item) => item.id), ["5C"]);
});

test("13 · VPL completo sin seguro y circulando reutiliza SDA 5A", () => {
  const result = data.resolveVmpInsurance({ category: "A", certificateRequired: true, hasCertificate: true, registered: true, hasIdentificationLabel: true, insured: false, circulating: true });
  assert.deepEqual([result.regime, result.caseId], ["SDA", "TR-SOA-OP-005"]);
  const shared = seguroCases.find((item) => item.id === result.caseId);
  assert.match(shared.codificado, /SDA.*5A/i);
  assert.equal(shared.importe_fijo, 300);
});

test("14 · VPL completo sin seguro y sin circular reutiliza SDA 5B", () => {
  const result = data.resolveVmpInsurance({ category: "A", certificateRequired: true, hasCertificate: true, registered: true, hasIdentificationLabel: true, insured: false, circulating: false });
  assert.deepEqual([result.regime, result.caseId], ["SDA", "TR-SOA-OP-006"]);
});

test("15 · VPL sin un requisito previo no es denunciable por seguro y conserva la infracción documental", () => {
  const documents = data.resolveVmpDocumentation(doc({ registered: false, hasIdentificationLabel: false }));
  const result = data.resolveVmpInsurance({ category: "A", certificateRequired: true, hasCertificate: true, registered: false, hasIdentificationLabel: false, insured: false, circulating: true });
  assert.equal(result.complaint, false);
  assert.equal(result.regime, "NINGUNO");
  assert.match(result.message, /NO DENUNCIABLE POR SEGURO/);
  assert.doesNotMatch(result.message, /exento/i);
  assert.deepEqual(documents.complaints.map((item) => item.id), ["5B"]);
});

test("16 · VMP pesado sin seguro circulando aplica SOA 5N aunque falten documentos", () => {
  const result = data.resolveVmpInsurance({ category: "B", certificateRequired: null, hasCertificate: false, registered: false, hasIdentificationLabel: false, insured: false, circulating: true });
  assert.deepEqual([result.regime, result.caseId], ["SOA", "TR-SOA-OP-003"]);
  const shared = seguroCases.find((item) => item.id === result.caseId);
  assert.match(shared.codificado, /SOA.*5N/i);
  assert.equal(shared.importe_fijo, 800);
});

test("17 · las salidas internas prohibidas no aparecen en la implementación ni en el HTML inicial", async () => {
  const component = await readFile(new URL("../app/guided-traffic-module.tsx", import.meta.url), "utf8");
  const engine = await readFile(new URL("../data/vmp.ts", import.meta.url), "utf8");
  const guide = await readFile(new URL("../contenido/seguridad_vial/vmp/guia.json", import.meta.url), "utf8");
  const joined = `${component}\n${engine}\n${guide}`;
  assert.doesNotMatch(joined, /(?:>|\")COMPROBAR(?:<|\")|Clasificación pendiente|Denuncia:\s*pendiente/);
});

test("18 · el menú inicial contiene exactamente las siete áreas operativas acordadas", async () => {
  const { VmpGuideView } = await vite.ssrLoadModule("/app/guided-traffic-module.tsx");
  const html = renderToStaticMarkup(React.createElement(VmpGuideView, { cases: seguroCases, onOpenCase() {} }));
  const titles = ["Identificar / clasificar vehículo", "Certificado, registro e identificación", "Seguro obligatorio", "Requisitos técnicos / modificaciones", "Normas de circulación", "Alcohol y drogas", "Menores de edad"];
  assert.equal(data.vmpGuide.areas.length, 7);
  assert.deepEqual(data.vmpGuide.areas.map((area) => area.titulo), titles);
  for (const title of titles) assert.match(html, new RegExp(title.replace("/", "\\/")));
  assert.equal((html.match(/<button/g) ?? []).length, 8, "siete áreas más un único acceso secundario");
});

test("19 · inmovilización no existe como área y solo se obtiene como medida resultante", async () => {
  assert.equal(data.vmpGuide.areas.some((area) => /inmovilización/i.test(area.titulo) || area.id === "inmovilizacion"), false);
  const output = data.resolveVmpTechnical("5D");
  assert.equal(output.inmovilizacion, true);
  assert.equal(output.deposito, false);
  assert.equal(output.informe, true);
  assert.equal(output.fotografias, true);
});

test("20 · Casos prácticos es un acceso secundario y no una octava área", async () => {
  const { VmpGuideView } = await vite.ssrLoadModule("/app/guided-traffic-module.tsx");
  const html = renderToStaticMarkup(React.createElement(VmpGuideView, { cases: seguroCases, onOpenCase() {} }));
  assert.match(html, /🧩 Casos prácticos/);
  assert.equal(data.vmpGuide.areas.some((area) => area.id === "casos"), false);
});

test("21 · los ocho casos prácticos tienen resolución abrible", () => {
  assert.equal(data.vmpGuide.casos_practicos.length, 8);
  for (const item of data.vmpGuide.casos_practicos) {
    const resolved = data.resolveVmpPracticalCase(item.id);
    assert.equal(resolved.item.id, item.id);
    assert.ok(resolved.classification || resolved.variants.length === 2);
  }
});

test("22 · los casos prácticos reutilizan el motor y no almacenan sanciones ni medidas", async () => {
  for (const item of data.vmpGuide.casos_practicos) {
    const storedFacts = JSON.stringify(item.hechos);
    assert.doesNotMatch(storedFacts, /"(?:codigo|articulo|importe|reducido|inmovilizacion|deposito)"\s*:/i);
  }
  const source = await readFile(new URL("../data/vmp.ts", import.meta.url), "utf8");
  assert.match(source, /resolveVmpDocumentation\(/);
  assert.match(source, /resolveVmpInsurance\(/);
  assert.match(source, /resolveVmpTechnical\(/);
  const caseOne = data.resolveVmpPracticalCase("vpl-regularizado-sin-seguro");
  assert.equal(caseOne.insurance.caseId, "TR-SOA-OP-005");
});

test("23 · certificado, inscripción, etiqueta y placa son preguntas independientes", async () => {
  const source = await readFile(new URL("../app/guided-traffic-module.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /¿Constan certificado e inscripción\?/);
  for (const question of ["¿Dispone del certificado de circulación exigible?", "¿Está inscrito en el RNV/RVPL?", "¿Porta la etiqueta identificativa exigible?", "¿Dispone de placa de marcaje cuando corresponde?"]) assert.match(source, new RegExp(question.replace(/[?]/g, "\\?")));
});

test("24 · Seguro pregunta por clasificación en el propio flujo y usa la pregunta exacta de circulación", async () => {
  const source = await readFile(new URL("../app/guided-traffic-module.tsx", import.meta.url), "utf8");
  assert.match(source, /prefix="vmp-ins-class"/);
  assert.match(source, /label="¿El vehículo circulaba\?"/);
});

test("25 · las reglas de circulación respetan 01/10/2026 y 01/10/2027", () => {
  assert.equal(data.resolveVmpCirculation("casco_estado", "2026-09-30").active, false);
  assert.equal(data.resolveVmpCirculation("casco_estado", "2026-10-01").active, true);
  assert.equal(data.resolveVmpCirculation("iluminacion", "2027-09-30").active, false);
  assert.equal(data.resolveVmpCirculation("iluminacion", "2027-10-01").active, true);
  assert.equal(data.resolveVmpMinor(14, "2026-09-30").prohibited, false);
  assert.equal(data.resolveVmpMinor(14, "2026-10-01").prohibited, true);
});

test("26 · Alcohol reutiliza la calculadora común con VMP preseleccionado", async () => {
  const source = await readFile(new URL("../app/guided-traffic-module.tsx", import.meta.url), "utf8");
  assert.match(source, /initialVehicle="vmp"/);
  assert.match(source, /from "\.\/alcoholemia"/);
  assert.doesNotMatch(source, /SOA\.2\.1|SDA\.2\.1/);
});

test("27 · la fuente se mantiene como manual interno y la incidencia humana no inventa clasificación", async () => {
  const { sources } = await vite.ssrLoadModule("/data/sources.ts");
  const source = sources.find((item) => item.id === data.vmpGuide.fuente_manual);
  assert.match(source.tipo, /Manual \/ protocolo operativo interno/);
  assert.match(source.clasificacion_repositorio, /no norma jurídica autónoma/);
  assert.equal(data.vmpGuide.incidencias.length, 1);
  assert.match(data.vmpGuide.incidencias[0], /ficha o informe técnico/i);
});

test("28 · Seguro y Documentación solo clasifican tras confirmación y conservan los campos", async () => {
  const source = await readFile(new URL("../app/guided-traffic-module.tsx", import.meta.url), "utf8");
  assert.match(source, /disabled={!canClassify} onClick={onClassify}>Clasificar vehículo/);
  assert.match(source, /setFinding\(null\)/, "editar los hechos invalida el resultado anterior");
  assert.doesNotMatch(source, /const classification = useMemo\(\(\) => classifyVmp\(facts\)/, "el padre no clasifica durante la escritura");
  assert.match(source, /prefix="vmp-ins-class"[^\n]+finding={classification\.finding}/);
  assert.match(source, /prefix="vmp-doc-class"[^\n]+finding={classification\.finding}/);
  assert.doesNotMatch(source, /category === "INCOMPLETA"[^\n]+<ClassificationFields/);
});
