import assert from "node:assert/strict";
import test, { after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("tenencia pública sin indicios de tráfico publica art. 36.16, rango y aprehensión", async () => {
  const { seguridadPublicaConceptos, seguridadPublica } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const entry = seguridadPublicaConceptos.find((item) => item.id === "drogas_consumo");
  assert.deepEqual([entry.norma, entry.calificacion, entry.rango], ["LO 4/2015 · art. 36.16", "INFRACCIÓN GRAVE", "601–30.000 €"]);
  assert.match(seguridadPublica.comunes.aprehension.join(" "), /envoltorio.*lugar exacto/i);
});

test("tráfico solo cierra rama penal con venta o indicios suficientes y clasifica art. 368", async () => {
  const { resolveDrugOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  assert.equal(resolveDrugOutcome({ ventaObservada: false, indiciosSuficientes: false, sustancia: "resto" }).kind, "indicios_no_concluyentes");
  const grave = resolveDrugOutcome({ ventaObservada: true, indiciosSuficientes: false, sustancia: "grave_dano" });
  const resto = resolveDrugOutcome({ ventaObservada: false, indiciosSuficientes: true, sustancia: "resto" });
  assert.deepEqual([grave.norma, grave.clasificacion, grave.detencion], ["Código Penal · art. 368", "DELITO GRAVE", "SÍ"]);
  assert.deepEqual([resto.clasificacion, resto.detencion], ["DELITO MENOS GRAVE", "SÍ"]);
});

test("falta de respeto, identificación y escalas de autoridad conservan la frontera", async () => {
  const { seguridadPublicaConceptos, resolveAuthorityOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const respect = seguridadPublicaConceptos.find((item) => item.id === "respeto");
  const identification = seguridadPublicaConceptos.find((item) => item.id === "identificacion");
  assert.equal(respect.norma, "LO 4/2015 · art. 37.4");
  assert.match(respect.frontera, /556\.2.*falta de respeto y consideración debida a la autoridad; no menciona a sus agentes/i);
  assert.match(identification.frontera, /no constituye una detención penal/i);
  assert.equal(resolveAuthorityOutcome("desobediencia", "admin").norma, "LO 4/2015 · art. 36.6");
  assert.deepEqual([resolveAuthorityOutcome("desobediencia", "penal").norma, resolveAuthorityOutcome("desobediencia", "penal").clasificacion], ["Código Penal · art. 556.1", "DELITO MENOS GRAVE"]);
  assert.equal(resolveAuthorityOutcome("resistencia", "admin").norma, "LO 4/2015 · art. 36.6");
  assert.equal(resolveAuthorityOutcome("resistencia", "penal").norma, "Código Penal · art. 556.1");
  assert.equal(resolveAuthorityOutcome("resistencia", "atentado").norma, "Código Penal · art. 550");
});

test("amenazas y atentado resuelven clasificación y detención conforme a los supuestos trabajados", async () => {
  const { resolveAuthorityOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const leve = resolveAuthorityOutcome("amenazas", "leve");
  const art169 = resolveAuthorityOutcome("amenazas", "art169");
  const atentado = resolveAuthorityOutcome("amenazas", "atentado");
  assert.deepEqual([leve.norma, leve.clasificacion, leve.detencion, leve.situacion], ["Código Penal · art. 171.7", "DELITO LEVE", "NO", "INVESTIGADO NO DETENIDO"]);
  assert.deepEqual([art169.norma, art169.clasificacion], ["Código Penal · art. 169", "DELITO MENOS GRAVE"]);
  assert.deepEqual([atentado.norma, atentado.detencion], ["Código Penal · art. 550", "SÍ"]);
});

test("la vista ofrece buscador, chuletas transversales y no expone lenguaje interno", async () => {
  const { SeguridadPublicaView } = await vite.ssrLoadModule("/app/seguridad-publica.tsx");
  const drugsHtml = renderToStaticMarkup(React.createElement(SeguridadPublicaView, { block: "Drogas", onBack() {} }));
  const agentsHtml = renderToStaticMarkup(React.createElement(SeguridadPublicaView, { block: "Autoridad y agentes", onBack() {} }));
  for (const text of ["Buscar situación", "Drogas", "Registro / comprobación", "Domicilio", "consentimiento válido", "resolución judicial", "delito flagrante", "Aprehensión de sustancia"]) assert.match(drugsHtml, new RegExp(text, "i"));
  assert.match(agentsHtml, /Hechos contra los agentes/);
  assert.doesNotMatch(`${drugsHtml}${agentsHtml}`, /Autoridad y agentes|Drogas y autoridad \/ agentes/i);
  assert.doesNotMatch(`${drugsHtml}${agentsHtml}`, /SP-[A-Z0-9]|regla interna|resolvedor|valorar detención/);
});

test("las salidas con detenido exponen sus chuletas, y las salidas investigado llevan los bloques comunes", async () => {
  const { SeguridadPublicaView } = await vite.ssrLoadModule("/app/seguridad-publica.tsx");
  const detained = renderToStaticMarkup(React.createElement(SeguridadPublicaView, { block: "Autoridad y agentes", initialConceptId: "atentado", onBack() {} }));
  assert.match(detained, /Ver derechos del detenido/);
  assert.match(detained, /Ver diligencias de la detención/);
  assert.match(detained, /ASISTENCIA SANITARIA DEL DETENIDO/);
  const { resolveAuthorityOutcome, seguridadPublica } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const investigated = resolveAuthorityOutcome("amenazas", "leve");
  assert.equal(investigated.situacion, "INVESTIGADO NO DETENIDO");
  assert.match(seguridadPublica.comunes.investigado.texto, /Coordina la continuación.*CNP/i);
  assert.ok(seguridadPublica.comunes.investigado.derechos.length > 0);
  assert.ok(seguridadPublica.comunes.investigado.diligencias.length > 0);
});

test("la pantalla de posible tráfico renderiza la pregunta inicial sin errores", async () => {
  const { SeguridadPublicaView } = await vite.ssrLoadModule("/app/seguridad-publica.tsx");
  const html = renderToStaticMarkup(React.createElement(SeguridadPublicaView, { block: "Drogas", initialConceptId: "drogas_trafico", onBack() {} }));
  assert.match(html, /¿Se observa venta, entrega o suministro a tercero\?/);
  assert.match(html, /sin indicios suficientes de tráfico/i);
  assert.match(html, /LO 4\/2015 · art\. 36\.16/);
});

test("Seguridad Pública se presenta en dos categorías visibles y los desplegables usan el estilo común ámbar", async () => {
  const { categories } = await vite.ssrLoadModule("/data/categories.ts");
  const fs = await import("node:fs");
  const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const publicCategories = categories.filter((category) => category.modulo === "seguridad_publica").map((category) => category.nombre);
  assert.deepEqual(publicCategories, ["Drogas", "Hechos contra los agentes", "Armas y objetos peligrosos"]);
  assert.match(css, /--aux-surface:#fff7e6/);
  assert.match(css, /\.compact-collapsible\{[^}]*background:var\(--aux-surface\)/);
  assert.match(css, /\.compact-collapsible-content\[data-state="open"\]\{[^}]*background:var\(--aux-surface-open\)/);
});

test("la auditoría procesal muestra fronteras completas y aplica el régimen de detención en cada salida", async () => {
  const { seguridadPublicaConceptos, resolveAuthorityOutcome, resolveDrugOutcome, seguridadPublica } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const byId = (id) => seguridadPublicaConceptos.find((item) => item.id === id);
  const respect = byId("respeto");
  const identification = byId("identificacion");
  assert.match(respect.frontera, /insultos.*gestos ofensivos.*agresión o acometimiento.*desobediencia o resistencia grave.*anuncio serio/i);
  assert.match(respect.frontera, /556\.2 CP tipifica.*autoridad; no menciona a sus agentes/i);
  assert.match(identification.frontera, /orden expresa, concreta y terminante.*conocimiento efectivo.*negativa consciente.*tenaz, persistente o contumaz.*traslado.*no constituye una detención penal/i);

  const disobedienceAdmin = resolveAuthorityOutcome("desobediencia", "admin");
  const disobedienceFlagrant = resolveAuthorityOutcome("desobediencia", "penal", { flagrante: true });
  const resistanceAdmin = resolveAuthorityOutcome("resistencia", "admin");
  const resistanceFlagrant = resolveAuthorityOutcome("resistencia", "penal", { flagrante: true });
  const atentadoFlagrant = resolveAuthorityOutcome("resistencia", "atentado", { flagrante: true });
  assert.equal(disobedienceAdmin.clasificacion, undefined);
  assert.deepEqual([disobedienceFlagrant.clasificacion, disobedienceFlagrant.detencion], ["DELITO MENOS GRAVE", "SÍ"]);
  assert.match(disobedienceFlagrant.fundamentoDetencion, /490\.2 y 492\.1 LECrim/i);
  assert.equal(resistanceAdmin.clasificacion, undefined);
  assert.deepEqual([resistanceFlagrant.clasificacion, resistanceFlagrant.detencion], ["DELITO MENOS GRAVE", "SÍ"]);
  assert.deepEqual([atentadoFlagrant.clasificacion, atentadoFlagrant.detencion], ["DELITO MENOS GRAVE", "SÍ"]);

  const leve = resolveAuthorityOutcome("amenazas", "leve");
  const threatFlagrant = resolveAuthorityOutcome("amenazas", "art169", { flagrante: true });
  const threatLater = resolveAuthorityOutcome("amenazas", "art169", { flagrante: false, plenamenteIdentificado: true, localizable: true, riesgoIncomparecencia: false });
  assert.deepEqual([leve.clasificacion, leve.detencion, leve.situacion], ["DELITO LEVE", "NO", "INVESTIGADO NO DETENIDO"]);
  assert.match(leve.fundamentoDetencion, /495 LECrim/i);
  assert.deepEqual([threatFlagrant.clasificacion, threatFlagrant.detencion], ["DELITO MENOS GRAVE", "SÍ"]);
  assert.deepEqual([threatLater.detencion, threatLater.situacion], ["NO", "INVESTIGADO NO DETENIDO"]);
  assert.match(threatLater.fundamentoDetencion, /492\.3–4 y 493 LECrim/i);

  const administrativeDrugs = resolveDrugOutcome({ ventaObservada: false, indiciosSuficientes: false, sustancia: "resto" });
  const drugFlagrant = resolveDrugOutcome({ ventaObservada: true, indiciosSuficientes: true, sustancia: "grave_dano", flagrante: true });
  const drugLater = resolveDrugOutcome({ ventaObservada: true, indiciosSuficientes: true, sustancia: "resto", flagrante: false, plenamenteIdentificado: true, localizable: true, riesgoIncomparecencia: false });
  assert.deepEqual([administrativeDrugs.situacion, administrativeDrugs.detencion], ["DILIGENCIAS DE PREVENCIÓN", "NO"]);
  assert.deepEqual([drugFlagrant.clasificacion, drugFlagrant.detencion], ["DELITO GRAVE", "SÍ"]);
  assert.deepEqual([drugLater.clasificacion, drugLater.situacion, drugLater.detencion], ["DELITO MENOS GRAVE", "INVESTIGADO NO DETENIDO", "NO"]);

  const fs = await import("node:fs");
  const files = ["contenido/seguridad_publica/operativa.json", "data/seguridad-publica.ts", "app/seguridad-publica.tsx"];
  const visibleText = files.map((file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8")).join("\n");
  for (const forbidden of ["esos elementos", "elementos indicados", "valorar detención", "según procedencia y necesidad", "detención condicionada"]) assert.doesNotMatch(visibleText, new RegExp(forbidden, "i"));
  assert.match(seguridadPublica.comunes.investigado.texto, /Coordina la continuación.*CNP/i);
});

test("Armas blancas separa clasificación y conducta sin perder rutas violentas", async () => {
  const { resolveWeaponOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const porte = { disponibilidad: "efectos", comportamiento: "porte", flagrante: true };
  const punal = resolveWeaponOutcome({ tipo: "hoja", hojaMenorOnce: true, dosFilos: true, puntiaguda: true }, porte);
  const noPunal = resolveWeaponOutcome({ tipo: "hoja", hojaMenorOnce: true, dosFilos: false, puntiaguda: true }, porte);
  const automatica = resolveWeaponOutcome({ tipo: "navaja", automaticaConfirmada: true }, porte);
  const mecanismoDudoso = resolveWeaponOutcome({ tipo: "navaja", automaticaConfirmada: false }, porte);
  assert.equal(punal.clasificacionObjeto, "PUÑAL — ARMA PROHIBIDA");
  assert.equal(noPunal.clasificacionObjeto, "NO SE CLASIFICA COMO PUÑAL EN ESTA RAMA");
  assert.equal(automatica.clasificacionObjeto, "NAVAJA AUTOMÁTICA — ARMA PROHIBIDA");
  assert.equal(mecanismoDudoso.clasificacionObjeto, "NO PUEDE CONFIRMARSE COMO NAVAJA AUTOMÁTICA");
  assert.deepEqual([punal.kind, punal.norma, punal.rango], ["administrativa", "Ley Orgánica 4/2015 · art. 36.10", "601–30.000 €"]);
  assert.equal(noPunal.kind, "sin_conclusion_automatica");
  assert.equal(mecanismoDudoso.kind, "sin_conclusion_automatica");
  assert.doesNotMatch(JSON.stringify(punal), /156|157/);

  const noPunalUse = resolveWeaponOutcome({ tipo: "hoja", hojaMenorOnce: true, dosFilos: false, puntiaguda: true }, { comportamiento: "usa", flagrante: true });
  const noPunalIntimidation = resolveWeaponOutcome({ tipo: "hoja", hojaMenorOnce: true, dosFilos: false, puntiaguda: true }, { comportamiento: "intimidatoria", flagrante: true });
  const doubtfulUse = resolveWeaponOutcome({ tipo: "navaja", automaticaConfirmada: false }, { comportamiento: "usa", flagrante: true });
  assert.equal(noPunalUse.kind, "derivacion_penal");
  assert.match(noPunalUse.titulo, /POSIBLE DELITO COMETIDO UTILIZANDO EL OBJETO/i);
  assert.equal(noPunalIntimidation.kind, "posible_penal");
  assert.equal(doubtfulUse.kind, "derivacion_penal");
  for (const outcome of [noPunalUse, noPunalIntimidation, doubtfulUse]) assert.doesNotMatch(JSON.stringify(outcome.hechosRelevantes), /sin incidente|guardad/i);

  const prohibitedUse = resolveWeaponOutcome({ tipo: "navaja", automaticaConfirmada: true }, { comportamiento: "usa", flagrante: true });
  const prohibitedExhibition = resolveWeaponOutcome({ tipo: "hoja", hojaMenorOnce: true, dosFilos: true, puntiaguda: true }, { comportamiento: "exhibe", contexto: "altercado", flagrante: true });
  assert.deepEqual([prohibitedUse.norma, prohibitedUse.clasificacion, prohibitedUse.detencion], ["Código Penal · art. 563", "DELITO MENOS GRAVE", "SÍ"]);
  assert.equal(prohibitedUse.derivaOtroDelito, true);
  assert.match(prohibitedUse.dependenciaFutura, /Agresiones \/ lesiones.*148\.1 CP/i);
  assert.deepEqual([prohibitedExhibition.kind, prohibitedExhibition.derivaOtroDelito], ["penal", true]);
  assert.match(prohibitedUse.fundamentoDetencion, /490\.2 y 492\.1 LECrim/i);
});

test("Navaja diferencia mecanismo automático, no automático y dudoso sin ocultar conductas", async () => {
  const { resolveWeaponOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const porte = { comportamiento: "porte", disponibilidad: "efectos" };
  const automatica = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "automatico" }, porte);
  const noAutomatica = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "no_automatico" }, porte);
  const dudosa = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "dudoso" }, porte);
  assert.equal(automatica.clasificacionObjeto, "NAVAJA AUTOMÁTICA — ARMA PROHIBIDA");
  assert.equal(automatica.kind, "administrativa");
  assert.match(noAutomatica.clasificacionObjeto, /NAVAJA NO AUTOMÁTICA/i);
  assert.equal(noAutomatica.kind, "sin_conclusion_automatica");
  assert.match(noAutomatica.titulo, /CONTINUAR VALORACIÓN/i);
  assert.match(noAutomatica.frontera, /arma blanca no prohibida/i);
  assert.equal(dudosa.clasificacionObjeto, "NO PUEDE CONFIRMARSE COMO NAVAJA AUTOMÁTICA");
  assert.equal(dudosa.kind, "sin_conclusion_automatica");
  assert.match(dudosa.titulo, /CLASIFICACIÓN ABIERTA/i);

  const noAutomaticaUse = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "no_automatico" }, { comportamiento: "usa" });
  const noAutomaticaThreat = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "no_automatico" }, { comportamiento: "amenaza" });
  const dudosaUse = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "dudoso" }, { comportamiento: "usa" });
  assert.equal(noAutomaticaUse.kind, "derivacion_penal");
  assert.equal(noAutomaticaThreat.kind, "derivacion_penal");
  assert.equal(dudosaUse.kind, "derivacion_penal");

  for (const circumstance of ["contemplacion", "reparacion", "transmision"]) {
    const exceptional = resolveWeaponOutcome({ tipo: "navaja", mecanismo: "no_automatico", supuestoEspecifico: true, circunstanciaTenencia: circumstance }, porte);
    assert.deepEqual([exceptional.kind, exceptional.titulo], ["valoracion_especifica", "SUPUESTO QUE REQUIERE VALORACIÓN ESPECÍFICA"]);
  }
});

test("Objetos peligrosos prioriza el uso y mantiene la salida administrativa subsidiaria", async () => {
  const { resolveWeaponOutcome } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
  const screwdriverPort = resolveWeaponOutcome({ tipo: "objeto" }, { comportamiento: "porte", disponibilidad: "efectos" });
  const screwdriverIntimidation = resolveWeaponOutcome({ tipo: "objeto" }, { comportamiento: "intimidatoria" });
  const screwdriverUse = resolveWeaponOutcome({ tipo: "objeto" }, { comportamiento: "usa" });
  assert.equal(screwdriverPort.kind, "sin_conclusion_automatica");
  assert.match(screwdriverPort.porQue, /mero porte.*no.*infracción/i);
  assert.equal(screwdriverIntimidation.kind, "posible_penal");
  assert.match(screwdriverIntimidation.salidaSubsidiaria, /art\. 37\.2/i);
  assert.equal(screwdriverUse.kind, "derivacion_penal");
  assert.match(screwdriverUse.dependenciaFutura, /art\. 148\.1 CP/i);
  assert.notEqual(screwdriverUse.norma, "Código Penal · art. 563");
  assert.match(screwdriverUse.frontera, /no activa automáticamente el art\. 563/i);

  const objects = [{ tipo: "objeto" }, { tipo: "navaja", automaticaConfirmada: false }, { tipo: "hoja", hojaMenorOnce: true, dosFilos: false, puntiaguda: true }];
  const behaviours = ["porte", "manipula", "exhibe", "intimidatoria", "amenaza", "intenta", "usa"];
  for (const object of objects) for (const comportamiento of behaviours) {
    const outcome = resolveWeaponOutcome(object, { comportamiento, contexto: comportamiento === "manipula" ? "altercado" : undefined });
    assert.ok(outcome.titulo && outcome.norma && outcome.frontera && outcome.actuacion.length, `Ruta incompleta: ${object.tipo}/${comportamiento}`);
    if (["intimidatoria", "amenaza", "intenta", "usa"].includes(comportamiento)) assert.doesNotMatch(JSON.stringify(outcome.hechosRelevantes), /sin incidente|permanece guardad/i);
  }
});

test("el árbol de armas es adaptativo, operativo y no expone lenguaje interno", async () => {
  const { SeguridadPublicaView } = await vite.ssrLoadModule("/app/seguridad-publica.tsx");
  const weaponsHtml = renderToStaticMarkup(React.createElement(SeguridadPublicaView, { block: "Armas y objetos peligrosos", initialConceptId: "armas_blancas", onBack() {} }));
  const objectsHtml = renderToStaticMarkup(React.createElement(SeguridadPublicaView, { block: "Armas y objetos peligrosos", initialConceptId: "objetos_peligrosos", onBack() {} }));
  const fs = await import("node:fs");
  const source = fs.readFileSync(new URL("../app/seguridad-publica.tsx", import.meta.url), "utf8");
  const dataSource = fs.readFileSync(new URL("../data/seguridad-publica.ts", import.meta.url), "utf8");
  for (const text of ["¿Qué ocurre con el objeto?", "¿Dónde se encuentra?", "¿Qué situación se observa?", "Clasificación del arma blanca", "Datos relevantes para el acta / diligencias", "Criterio jurídico aplicado"]) assert.match(source, new RegExp(text, "i"));
  assert.match(weaponsHtml, /No puedo determinarlo con seguridad/i);
  assert.match(weaponsHtml, /Automático.*No automático.*No puedo determinarlo con seguridad/is);
  assert.match(weaponsHtml, /¿Existe una circunstancia excepcional de tenencia\?/i);
  assert.doesNotMatch(source, /primera opción|opción anterior|opción superior/i);
  assert.match(source, /value !== "porte"\) setCircunstanciaTenencia\("ninguna"\)/);
  assert.match(weaponsHtml, /CLASIFICACIÓN DEL OBJETO.*CONDUCTA OBSERVADA/i);
  assert.match(objectsHtml, /Destornillador.*tijeras.*martillo/i);
  assert.doesNotMatch(`${weaponsHtml}${objectsHtml}`, /¿Es un arma prohibida?|¿El porte es ilegal?|¿Constituye delito?|¿Debe detenerse?|armas_blancas|objetos_peligrosos|regla interna|puntuación/i);
  assert.equal((dataSource.match(/resolvePenalProcessualDecision\(observed\)/g) ?? []).length, 1);
});
