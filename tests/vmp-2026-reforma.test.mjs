import assert from "node:assert/strict";
import test, { after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, ssr: { external: ["react", "react/jsx-dev-runtime", "react/jsx-runtime"] }, server: { middlewareMode: true } });
after(async () => vite.close());
const data = await vite.ssrLoadModule("/data/vmp.ts");
const { SourceLinks } = await vite.ssrLoadModule("/app/source-links.tsx");
const resolve = (id, facts = {}, asOf = "2026-10-08") => data.resolveVmpCirculation(id, asOf, facts);
const checkDenuncia = (result, article, code, amount, source) => {
  assert.equal(result.decision, "denuncia");
  assert.equal(result.item.articulo, article);
  assert.equal(result.item.codigo, code);
  assert.equal(result.item.importe, amount);
  assert.equal(result.item.reducido, amount / 2);
  assert.equal(result.item.puntos, 0);
  assert.ok(result.sourceIds.includes(source));
};

test("1 · menor de 15 años: art. 155.3, ARCI, responsable y fuentes", () => {
  const result = data.resolveVmpMinor(14, "2026-10-08");
  assert.equal(result.prohibited, true);
  assert.equal(result.infraction.articulo, "Art. 155.3 RGC");
  assert.equal(result.infraction.codigo, "CIR 155.3.5A");
  assert.deepEqual([result.infraction.importe, result.infraction.reducido, result.infraction.puntos], [200, 100, 0]);
  assert.match(result.infraction.responsable, /82\.b LSV/);
  assert.ok(result.sourceIds.includes("TR-VMP-SRC-SANC-2026-27"));
  assert.equal(data.resolveVmpMinor(15, "2026-10-08").infraction, null);
});

test("2 · sin casco: precepto estatal y competencia municipal separados", () => {
  const result = resolve("casco");
  checkDenuncia(result, "Art. 118.3 RGC", "CIR 118.3.5D", 200, "TR-VMP-SRC-SANC-2026-27");
  assert.match(result.competence, /Ayuntamiento de Torrent/);
  assert.match(result.observation, /ordenanza/i);
});

test("3 · falta de elemento personal exigible de noche", () => {
  const result = resolve("visibilidad", { lightCondition: "noche", elementCompliant: false });
  checkDenuncia(result, "Art. 118.3 RGC", "CIR 118.3.5E", 200, "TR-VMP-SRC-RD518-2026");
  assert.match(result.message, /150 m/);
  assert.equal(resolve("visibilidad", { lightCondition: "dia", elementCompliant: false }).item, null);
});

test("4 · día sin alumbrado antes del 01/10/2027: sin denuncia ni importe", () => {
  const result = resolve("alumbrado", { lightCondition: "dia" });
  assert.equal(result.decision, "no");
  assert.equal(result.item, null);
  assert.match(result.message, /transitoria tercera/);
  assert.ok(result.sourceIds.includes("TR-VMP-SRC-RD518-2026"));
});

test("5 · noche sin alumbrado: CIR 155.5.5A desde el 01/10/2026", () => {
  checkDenuncia(resolve("alumbrado", { lightCondition: "noche" }), "Art. 155.5 y disposición transitoria tercera RGC", "CIR 155.5.5A", 200, "TR-VMP-SRC-SANC-2026-27");
  assert.equal(resolve("alumbrado", { lightCondition: "dia" }, "2027-10-01").decision, "denuncia");
});

test("6 · acera ordinaria: art. 152.1, 100 €, sin confundirla con zona peatonal", () => {
  const result = resolve("lugar", { place: "acera" });
  checkDenuncia(result, "Art. 152.1 RGC", "CIR 152.1.5A", 100, "TR-VMP-SRC-SANC-2026-27");
  assert.match(result.observation, /200 €/);
});

const pedestrianFacts = { place: "zona_peatonal", signProhibits: false, widthOverThree: true, pedestrianSeparation: true, buildingSeparation: true, pedestrianPriority: true, speedAtMostSix: true };

test("7 · calle peatonal de Torrent con todas las condiciones: permitida", () => {
  const result = resolve("lugar", pedestrianFacts);
  assert.equal(result.decision, "no");
  assert.equal(result.item, null);
  assert.match(result.message, /39 bis\.3\.3/);
  assert.ok(result.sourceIds.includes("TR-MOV-SRC-001"));
});

test("8 · zona peatonal incumpliendo una condición: ordenanza compatible", () => {
  const result = resolve("lugar", { ...pedestrianFacts, widthOverThree: false });
  checkDenuncia(result, "Art. 39 bis.3.3 y anexo I Ordenanza de Torrent", "Art. 39 bis O.O.M.M.", 200, "TR-MOV-SRC-001");
  assert.match(result.observation, /no un ARCI estatal/);
});

test("9 · vía interurbana: excepción ciclista estatal frente a prohibición municipal general", () => {
  const allowed = resolve("lugar", { place: "interurbana", cyclewayOrMotorBan: true, signProhibits: false });
  assert.equal(allowed.decision, "no");
  assert.equal(allowed.item, null);
  assert.match(allowed.observation, /38\.4\.c RGC/);
  assert.ok(allowed.sourceIds.includes("TR-MOV-SRC-001"));
  const forbidden = resolve("lugar", { place: "interurbana", cyclewayOrMotorBan: false, signProhibits: false });
  checkDenuncia(forbidden, "Art. 38.4.c RGC", "CIR 038.4.5B", 200, "TR-VMP-SRC-SANC-2026-27");
  assert.match(forbidden.competence, /Jefatura de Tráfico/);
  const uncertainTunnel = resolve("lugar", { place: "tunel_urbano", cyclewayOrMotorBan: false, signProhibits: false });
  assert.equal(uncertainTunnel.decision, "pendiente", "la tipificación no suple la competencia desconocida del túnel");
  assert.equal(uncertainTunnel.item, null);
});

test("10 · precepto estatal no altera por sí mismo competencia municipal", () => {
  const urban = resolve("casco", { road: "urbana_municipal" });
  const crossing = resolve("casco", { road: "travesia" });
  assert.equal(urban.item.articulo, crossing.item.articulo);
  assert.equal(urban.item.codigo, crossing.item.codigo);
  assert.equal(urban.item.importe, crossing.item.importe);
  assert.match(urban.competence, /Ayuntamiento/);
  assert.match(crossing.competence, /Jefatura de Tráfico/);
  assert.ok(urban.sourceIds.includes("TR-ITV-SRC-001"));
});

test("chaleco profesional y señalización de maniobras mantienen reglas diferenciadas", async () => {
  checkDenuncia(resolve("chaleco_profesional", { professional: true }), "Art. 118.4 RGC", "CIR 118.4.5C", 200, "TR-VMP-SRC-SANC-2026-27");
  assert.equal(resolve("chaleco_profesional", { professional: false }).decision, "no");
  assert.equal(resolve("brazo"), null, "sin ficha sancionadora autónoma ni ARCI no acreditado");
  assert.match(data.vmpGuide.circulacion.maniobras.recordatorio, /155\.4 RGCir.*brazo.*art\. 109/);
  assert.match(data.vmpGuide.circulacion.maniobras.limite_codificacion, /SANC 2026\/27.*ARCI específico/);
  assert.match(data.vmpGuide.circulacion.maniobras.limite_codificacion, /no generar denuncia automática ni asignar CIR 108\.1\.5A o CIR 109\.1\.5A/);
  assert.ok(data.vmpGuide.circulacion.maniobras.fuentes.includes("TR-VMP-SRC-RD518-2026"));
  const component = await import("node:fs/promises").then((fs) => fs.readFile(new URL("../app/guided-traffic-module.tsx", import.meta.url), "utf8"));
  assert.match(component, /vmpGuide\.circulacion\.maniobras\.recordatorio/);
});

test("fuentes de la ficha enlazan directamente al BOE, la ordenanza y el PDF original", () => {
  const html = renderToStaticMarkup(React.createElement(SourceLinks, { sourceIds: resolve("casco").sourceIds }));
  assert.match(html, /boe\.es\/eli\/es\/rd\/2026\/06\/24\/518/);
  assert.match(html, /torrent\.es\/wp-content/);
  assert.match(html, /Instrucci%C3%B3n%202026-27/);
});
