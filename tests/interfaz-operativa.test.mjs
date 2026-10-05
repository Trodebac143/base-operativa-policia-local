import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { auditVisibleControls, prohibitedControlFindings } from "./helpers/controles-visibles.mjs";

const root = process.cwd();
const read = (relative) => readFileSync(resolve(root, relative), "utf8");

test("el detector identifica preguntas prohibidas en controles visibles", () => {
  const source = `
    const outcomes = [["149", "El informe forense identifica expresamente el art. 149 CP"]];
    function Questions() {
      return <>
      <fieldset><legend>¿Qué resultado diagnóstico definitivo consta?</legend>
          <label><input type="radio" /> Delito de especial gravedad</label>
        </fieldset>
        <input aria-label="¿Qué artículo penal se aplica?" />
        <select aria-label="Resultado forense"><option>Diagnóstico definitivo</option></select>
        <ToggleQuestion legend="¿El informe forense identifica el artículo aplicable?" value={facts.neutral} />
        <ChoiceQuestion legend="¿Qué resultado?" options={outcomes} value={facts.valoracionForense} />
        {yesNo("¿Concurre una circunstancia agravante?", "estado")}
      </>;
    }
  `;
  const findings = auditVisibleControls(source, "synthetic.tsx");
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "C_FORENSE_DIAGNOSTICO")));
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "D_ARTICULO")));
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "D_TIPO_GRAVEDAD")));
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "D_ARTICULO") && item.text.includes("¿Qué artículo penal se aplica?")));
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "C_FORENSE_DIAGNOSTICO") && item.text.includes("Resultado forense")));
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "HARD_FIELD" && hit.field === "valoracionForense")));
  assert.ok(findings.some((item) => item.kind === "ToggleQuestion" && item.hits.some((hit) => hit.rule === "C_FORENSE_DIAGNOSTICO")));
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "D_TIPO_GRAVEDAD" && item.kind === "yesNo")));
});

test("el detector permite ayuda explicativa, fuentes y controles factuales", () => {
  const source = `
    function Questions() {
      return <>
        <p>El informe forense puede llegar después; el agente no elige el artículo.</p>
        <a href="https://example.test">Fuente oficial: BOE</a>
        <fieldset><legend>¿Se recibió asistencia sanitaria?</legend>
          <label><input type="radio" /> Sí</label><label><input type="radio" /> No</label>
        </fieldset>
        <fieldset><legend>¿Consta una medida judicial vigente y conocida?</legend>
          <label><input type="radio" /> Sí</label><label><input type="radio" /> No</label>
        </fieldset>
        <fieldset><legend>¿Qué asistencia ha recibido o le han indicado ya los sanitarios?</legend>
          <ChoiceQuestion legend="¿Qué asistencia ha recibido o le han indicado ya los sanitarios?" value={facts.resultadoAsistencial} options={assistanceOptions} />
        </fieldset>
        <fieldset><legend>La gravedad final del resultado queda pendiente de valoración posterior.</legend>
          <label><input type="radio" value="forense grave" /> Sí</label>
        </fieldset>
        <fieldset><legend>Tipo de soporte</legend>
          {supportOptions.map(([id, label]) => <label key={id}><input type="radio" />{label}</label>)}
        </fieldset>
        <ChoiceQuestion legend="¿Qué conducta se observó?" options={conductOptions} />
      </>;
    }
    const supportOptions = [["video", "Vídeo"], ["testigo", "Testigo identificado"]];
    const conductOptions = [["golpe", "Golpe observado"], ["amenaza", "Amenaza referida"]];
    const assistanceOptions = [["first_aid", "Asistencia recibida"], ["indicated", "Tratamiento indicado por sanitarios"]];
  `;
  assert.deepEqual(auditVisibleControls(source, "allowed.tsx"), []);
});

test("el detector marca fields forenses y judiciales aunque el texto visible sea neutro", () => {
  const source = `
    <fieldset><legend>Resultado disponible</legend>
      <input value={facts.resultadoMedico} />
      <input value={facts.condenasCanceladasOCancelables} />
    </fieldset>
  `;
  const findings = auditVisibleControls(source, "legacy-fields.tsx");
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "HARD_FIELD" && hit.field === "resultadoMedico")));
  assert.ok(findings.some((item) => item.hits.some((hit) => hit.rule === "HARD_FIELD" && hit.field === "condenasCanceladasOCancelables")));
});

test("Seguridad Pública y derivación penal no exponen preguntas C/D ni campos duros", () => {
  const files = {
    "app/seguridad-publica.tsx": read("app/seguridad-publica.tsx"),
    "app/derivacion-penal.tsx": read("app/derivacion-penal.tsx"),
  };
  const findings = prohibitedControlFindings(files);
  assert.deepEqual(findings, [], `Controles que requieren revisión:\n${findings.map(({ file, line, kind, text, hits }) => `${file}:${line} [${kind}] ${text} — ${hits.map((hit) => hit.rule + (hit.field ? `(${hit.field})` : "")).join(", ")}`).join("\n")}`);
});
