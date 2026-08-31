import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType: "custom", configFile: false, root, resolve: { alias: { "@": root } }, server: { middlewareMode: true } });
after(async () => vite.close());

test("la calculadora EMP acepta coma y punto con el mismo resultado", async () => {
  const { calculateAlcoholemia } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  assert.deepEqual(calculateAlcoholemia("0,65"), calculateAlcoholemia("0.65"));
});

test("la calculadora EMP conserva el cálculo exacto y aplica cada regla en su frontera", async () => {
  const { calculateAlcoholemia } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const service = (value) => calculateAlcoholemia(value, "servicio_periodica");
  assert.deepEqual([service("0,14").emp_exacto, service("0,14").corregido_interno_exacto], ["0.03", "0.11"]);
  assert.deepEqual([service("0,18").corregido_interno_exacto, service("0,19").corregido_interno_exacto], ["0.15", "0.16"]);
  assert.deepEqual([service("0,28").corregido_interno_exacto, service("0,29").corregido_interno_exacto], ["0.25", "0.26"]);
  assert.deepEqual([service("0,40").emp_exacto, service("0,40").corregido_interno_exacto], ["0.03", "0.37"]);
  assert.equal(service("0,40").tasa_ticket, "0.40");
  assert.deepEqual([service("0,41").emp_exacto, service("0,41").corregido_interno_exacto], ["0.03075", "0.37925"]);
  assert.equal(service("0,41").tasa_penal_operativa, "0.38");
  assert.match(service("0,41").emp_operacion, /0,41 × 7,5 % = 0,03075 mg\/L/);
  assert.equal(service("0,40").emp_tipo, "absoluto");
  assert.equal(service("0,41").emp_tipo, "porcentaje");
  assert.equal(calculateAlcoholemia("0,40", "puesta_servicio_o_post_reparacion").emp_exacto, "0.02");
  assert.equal(calculateAlcoholemia("0,50", "puesta_servicio_o_post_reparacion").emp_exacto, "0.025");
});

test("la tasa penal operativa redondea a dos decimales sin truncar el corregido interno", async () => {
  const { calculateAlcoholemia, roundPenalOperationalRate } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const service = (value) => calculateAlcoholemia(value, "servicio_periodica");
  assert.deepEqual(
    ["0.64", "0.65", "0.66"].map((value) => {
      const result = service(value);
      return [result.emp_exacto, result.corregido_interno_exacto, result.tasa_penal_operativa, result.supera_umbral_penal];
    }),
    [
      ["0.048", "0.592", "0.59", false],
      ["0.04875", "0.60125", "0.60", false],
      ["0.0495", "0.6105", "0.61", true],
    ],
  );
  assert.equal(roundPenalOperationalRate("0.605"), "0.61");
  assert.equal(roundPenalOperationalRate("0.6049"), "0.60");
});

test("la decisión administrativa usa el corregido exacto y la graduación usa la tasa del ticket", async () => {
  const { calculateAlcoholemia, resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const resolve = (reading, driver = "general") => resolveAlcoholemiaOutcome({ calculation: calculateAlcoholemia(reading), vehicle: "motor_ciclomotor", driver, previousSanction: false, negative: false });
  assert.equal(resolve("0.18", "novel").kind, "sin_superacion");
  assert.equal(resolve("0.19", "novel").administracion.codificado, "CIR 020.1 5G");
  assert.equal(resolve("0.28").kind, "sin_superacion");
  assert.equal(resolve("0.29").administracion.codificado, "CIR 020.1 5E");
  assert.deepEqual(
    [resolve("0.30", "profesional").administracion, resolve("0.31", "profesional").administracion].map(({ codificado, importe, puntos }) => [codificado, importe, puntos]),
    [["CIR 020.1 5G", 500, 4], ["CIR 020.1 5K", 1000, 6]],
  );
  assert.deepEqual(
    [resolve("0.50").administracion, resolve("0.51").administracion].map(({ codificado, importe, puntos }) => [codificado, importe, puntos]),
    [["CIR 020.1 5E", 500, 4], ["CIR 020.1 5I", 1000, 6]],
  );
  const repeated = resolveAlcoholemiaOutcome({ calculation: calculateAlcoholemia("0.50"), vehicle: "motor_ciclomotor", driver: "general", previousSanction: true, negative: false });
  assert.deepEqual([repeated.administracion.codificado, repeated.administracion.importe, repeated.administracion.puntos], ["CIR 020.1 5M", 1000, 4]);
  assert.match(resolve("0.51").administracion.hecho, /0,51 mg\/L/);
  assert.doesNotMatch(resolve("0.51").administracion.hecho, /corregida/i);
  assert.deepEqual(
    resolve("0.29").calculo_operativo.rates.map(({ label, value }) => [label, value]),
    [["RESULTADO TRAS APLICAR EMP", "0.26"], ["TASA A CONSIGNAR EN DENUNCIA", "0.29"]],
  );
  assert.deepEqual(
    resolve("0.65").calculo_operativo.rates.map(({ label, value }) => [label, value]),
    [["RESULTADO TRAS APLICAR EMP", "0.60125"], ["TASA A CONSIGNAR EN DENUNCIA", "0.65"]],
  );
  assert.equal(resolve("0.65").calculo_operativo.kind, "administrativa");
  assert.equal(resolve("0.66").calculo_operativo.kind, "penal");
  assert.deepEqual(resolve("0.66").calculo_operativo.rates.map(({ label, value }) => [label, value]), [["TASA A EFECTOS DEL UMBRAL PENAL", "0.61"], ["TASA DEL TICKET", "0.66"]]);
});

test("la vista de Alcoholemia es agrupada, no expone árbol ni sangre y conserva los límites críticos", async () => {
  const { AlcoholemiaView } = await vite.ssrLoadModule("/app/alcoholemia.tsx");
  const html = renderToStaticMarkup(React.createElement(AlcoholemiaView, { onBack() {} }));
  assert.match(html, /Alcoholemia/);
  assert.match(html, /0,00 mg\/L/);
  assert.match(html, /0,15 mg\/L/);
  assert.match(html, /0,25 mg\/L/);
  assert.match(html, /0,19/);
  assert.match(html, /0,29/);
  assert.match(html, /Negativa a la segunda medición legalmente exigida/i);
  assert.doesNotMatch(html, /árbol de decisiones|alcohol en sangre|tasa real|0,40 mg\/L/i);
  assert.doesNotMatch(html, /Tasa corregida a 2 decimales/i);
  assert.doesNotMatch(html, /Tasa exacta corregida|trunca a dos decimales|sin redondeo/i);
  assert.match(html, /RESULTADO TRAS APLICAR EMP/);
  assert.match(html, /TASA A CONSIGNAR EN DENUNCIA/);
  assert.match(html, /0,60125 mg\/L/);
  assert.match(html, /0,65 mg\/L/);
  assert.doesNotMatch(html, /TASA A EFECTOS DEL UMBRAL PENAL/);
  assert.match(html, /Cómo se ha calculado/);
  assert.match(html, /SSTS 788\/2023 y 789\/2023/);
  assert.match(html, /0,65 × 7,5 % = 0,04875 mg\/L/);
  assert.match(html, /0,60125 → 0,60 mg\/L/);
  assert.equal(html.match(/class="operational-rate operational-rate-/g)?.length, 2);
  assert.doesNotMatch(html, /DILIGENCIAS/);
  assert.equal(html.match(/data-slot="collapsible-trigger"/g)?.length, 5);
  assert.equal(html.match(/aria-expanded="false"/g)?.length, 5);
  assert.match(html, /Fuentes jurídicas \(9\)/);
  assert.match(html, /fumar, comer ni beber entre prueba y prueba/i);
  assert.doesNotMatch(html, /Reglas aplicables|Aplicar la infracción administrativa correspondiente|Mostrar cuantía\/puntos solo|Aplicar medidas .*regla transversal|TR-GEN-R|si procede/i);
  assert.match(html, /No supera 0,15 tras EMP/);
  assert.match(html, /No procede denuncia para límite 0,25/);
});

test("la presentación administrativa muestra dos tasas grandes sin etiqueta penal", async () => {
  const { OperationalCalculation } = await vite.ssrLoadModule("/app/alcoholemia.tsx");
  const { calculateAlcoholemia, resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const calculation = calculateAlcoholemia("0.41");
  const outcome = resolveAlcoholemiaOutcome({ calculation, vehicle: "motor_ciclomotor", driver: "general", previousSanction: false, negative: false });
  const html = renderToStaticMarkup(React.createElement(OperationalCalculation, { presentation: outcome.calculo_operativo }));
  assert.equal(html.match(/class="operational-rate operational-rate-/g)?.length, 2);
  assert.match(html, /RESULTADO TRAS APLICAR EMP<\/span><strong>0,37925 mg\/L<\/strong>/);
  assert.match(html, /TASA A CONSIGNAR EN DENUNCIA<\/span><strong>0,41 mg\/L<\/strong>/);
  assert.match(html, /Tasa que figura en el ticket del etilómetro/);
  assert.doesNotMatch(html, /TASA A EFECTOS DEL UMBRAL PENAL/);
  assert.match(html, /0,41 − 0,03075 = 0,37925 mg\/L/);
  assert.match(html, /Instrucción DGT 14\/S-134/);
});

test("solo una tasa penal operativa superior a 0,60 activa la presentación penal", async () => {
  const { OperationalCalculation } = await vite.ssrLoadModule("/app/alcoholemia.tsx");
  const { calculateAlcoholemia, resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const render = (reading) => {
    const outcome = resolveAlcoholemiaOutcome({ calculation: calculateAlcoholemia(reading), vehicle: "motor_ciclomotor", driver: "general", previousSanction: false, negative: false });
    return renderToStaticMarkup(React.createElement(OperationalCalculation, { presentation: outcome.calculo_operativo }));
  };
  const boundary = render("0.65");
  assert.match(boundary, /RESULTADO TRAS APLICAR EMP<\/span><strong>0,60125 mg\/L<\/strong>/);
  assert.doesNotMatch(boundary, /TASA A EFECTOS DEL UMBRAL PENAL/);
  assert.match(boundary, /0,60125 → 0,60 mg\/L\. No supera POR TASA/);

  const penal = render("0.66");
  assert.match(penal, /TASA A EFECTOS DEL UMBRAL PENAL<\/span><strong>0,61 mg\/L<\/strong>/);
  assert.match(penal, /TASA DEL TICKET<\/span><strong>0,66 mg\/L<\/strong>/);
  assert.match(penal, /0,6105 → 0,61 mg\/L\. Sí supera POR TASA/);
});

test("el selector visual conserva exactamente los valores internos y toma iconos y orden de la configuración", async () => {
  const { AlcoholemiaView } = await vite.ssrLoadModule("/app/alcoholemia.tsx");
  const { alcoholemiaVehicleOptions } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const expectedIds = ["motor_ciclomotor", "bicicleta_epac", "vmp", "clasificacion_pendiente"];
  assert.deepEqual(alcoholemiaVehicleOptions.map((option) => option.id), expectedIds);
  assert.deepEqual(alcoholemiaVehicleOptions.map((option) => option.icono), ["🚗", "🚲", "🛴", "⚠️"]);

  const html = renderToStaticMarkup(React.createElement(AlcoholemiaView, { onBack() {} }));
  for (const id of expectedIds) assert.match(html, new RegExp(`value="${id}"`));
  assert.match(html, /<legend>Tipo de vehículo<\/legend>/);
});

test("la configuración determina el orden y el estado inicial de los desplegables", async () => {
  const { AlcoholemiaView } = await vite.ssrLoadModule("/app/alcoholemia.tsx");
  const { alcoholemiaSecondarySections } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const expectedIds = ["tasas", "correccion", "actuacion", "advertencias", "fuentes"];
  assert.deepEqual(alcoholemiaSecondarySections.map((section) => section.id), expectedIds);
  assert.ok(alcoholemiaSecondarySections.every((section) => section.abierto_por_defecto === false));

  const html = renderToStaticMarkup(React.createElement(AlcoholemiaView, { onBack() {} }));
  const positions = alcoholemiaSecondarySections.map((section) => html.indexOf(section.titulo));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((left, right) => left - right), positions);
});

test("el desplegable común expone aria-expanded y respeta defaultOpen", async () => {
  const { CollapsibleSection } = await vite.ssrLoadModule("/components/ui/collapsible.tsx");
  const content = React.createElement("p", null, "Contenido de prueba");
  const closed = renderToStaticMarkup(React.createElement(CollapsibleSection, { title: "Cerrado" }, content));
  const open = renderToStaticMarkup(React.createElement(CollapsibleSection, { title: "Abierto", defaultOpen: true }, content));
  assert.match(closed, /aria-expanded="false"/);
  assert.match(closed, /data-state="closed"/);
  assert.match(open, /aria-expanded="true"/);
  assert.match(open, /data-state="open"/);
});

test("el contenido de Alcoholemia permanece separado de los casos y las categorías enlazan la vista", async () => {
  const { alcoholemia } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const { categories } = await vite.ssrLoadModule("/data/categories.ts");
  assert.equal(categories.find((item) => item.id === "seguridad_vial_alcoholemia")?.modulo, "seguridad_vial");
  assert.equal(alcoholemia.medidas_vehiculo.referencia, "TR-GEN-R-104-105-001");
  assert.match(JSON.stringify(alcoholemia.resultado_operativo_agrupado), /influencia/);
});

test("resuelve la denuncia administrativa V2 con campos cerrados y la suspensión penal asociada", async () => {
  const { calculateAlcoholemia, resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const outcome = resolveAlcoholemiaOutcome({ calculation: calculateAlcoholemia("0.66"), vehicle: "motor_ciclomotor", driver: "general", previousSanction: false, negative: false });
  assert.equal(outcome.kind, "penal_tasa");
  assert.deepEqual([outcome.administracion.codificado, outcome.administracion.importe, outcome.administracion.reducido, outcome.administracion.puntos, outcome.administracion.suspendida], ["CIR 020.1 5I", 1000, 500, 6, true]);
  assert.match(outcome.articulo_penal, /379\.2/);
  assert.match(outcome.administracion.hecho, /0,66|0.66/);
});

test("bicicleta, EPAC y VMP resuelven 0,66 como administración y siempre muestran cero puntos", async () => {
  const { calculateAlcoholemia, resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const calculation = calculateAlcoholemia("0.66");
  for (const vehicle of ["bicicleta_epac", "vmp"]) {
    const outcome = resolveAlcoholemiaOutcome({ calculation, vehicle, driver: "general", previousSanction: false, negative: false });
    assert.equal(outcome.kind, "administrativa");
    assert.deepEqual([outcome.administracion.codificado, outcome.administracion.importe, outcome.administracion.reducido, outcome.administracion.puntos], ["CIR 020.1 5I", 1000, 500, 0]);
    assert.equal(outcome.articulo_penal, undefined);
    assert.match(outcome.administracion.puntos_nota, /no exige permiso/i);
  }
});

test("la negativa no motorizada es CIR 021.1 5F y la negativa motorizada es art. 383 CP", async () => {
  const { resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const nonMotor = resolveAlcoholemiaOutcome({ calculation: null, vehicle: "vmp", driver: "general", previousSanction: false, negative: true });
  assert.deepEqual([nonMotor.administracion.codificado, nonMotor.administracion.importe, nonMotor.administracion.reducido, nonMotor.administracion.puntos], ["CIR 021.1 5F", 1000, 500, 0]);
  assert.doesNotMatch(nonMotor.mensaje, /383/);
  const motor = resolveAlcoholemiaOutcome({ calculation: null, vehicle: "motor_ciclomotor", driver: "general", previousSanction: false, negative: true });
  assert.equal(motor.articulo_penal, "Art. 383 CP");
  assert.equal(motor.administracion, undefined);
});

test("novel y profesional en bicicleta/VMP usan 0,25, y la clasificación dudosa no concluye", async () => {
  const { calculateAlcoholemia, getAlcoholemiaLimit, resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  assert.equal(getAlcoholemiaLimit("bicicleta_epac", "novel"), "0.25");
  assert.equal(getAlcoholemiaLimit("vmp", "profesional"), "0.25");
  const vmp = resolveAlcoholemiaOutcome({ calculation: calculateAlcoholemia("0.29"), vehicle: "vmp", driver: "novel", previousSanction: false, negative: false });
  assert.equal(vmp.administracion.codificado, "CIR 020.1 5E");
  const pending = resolveAlcoholemiaOutcome({ calculation: calculateAlcoholemia("0.66"), vehicle: "clasificacion_pendiente", driver: "general", previousSanction: false, negative: false });
  assert.equal(pending.kind, "clasificacion_pendiente");
  assert.equal(pending.administracion, undefined);
  assert.equal(pending.articulo_penal, undefined);
});

test("la matriz operativa conserva conductores, vehículos, negativa, reincidencia y vías administrativa y penal", async () => {
  const { calculateAlcoholemia, resolveAlcoholemiaOutcome } = await vite.ssrLoadModule("/data/alcoholemia.ts");
  const resolve = ({ reading = "0.29", vehicle = "motor_ciclomotor", driver = "general", previousSanction = false, negative = false } = {}) => resolveAlcoholemiaOutcome({
    calculation: negative ? null : calculateAlcoholemia(reading),
    vehicle,
    driver,
    previousSanction,
    negative,
  });

  assert.equal(resolve().kind, "administrativa");
  assert.equal(resolve({ reading: "0.19", driver: "novel" }).administracion.codificado, "CIR 020.1 5G");
  assert.equal(resolve({ reading: "0.19", driver: "profesional" }).administracion.codificado, "CIR 020.1 5G");
  assert.equal(resolve({ vehicle: "bicicleta_epac" }).administracion.puntos, 0);
  assert.equal(resolve({ vehicle: "vmp" }).administracion.puntos, 0);
  assert.equal(resolve({ vehicle: "clasificacion_pendiente" }).kind, "clasificacion_pendiente");
  assert.equal(resolve({ negative: true }).kind, "penal_negativa");
  assert.equal(resolve({ previousSanction: true }).administracion.codificado, "CIR 020.1 5M");
  assert.equal(resolve({ reading: "0.66" }).kind, "penal_tasa");
});
