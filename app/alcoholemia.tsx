"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible";
import {
  alcoholemia,
  alcoholemiaSecondarySections,
  alcoholemiaVehicleOptions,
  calculateAlcoholemia,
  formatMg,
  resolveAlcoholemiaOutcome,
  type AlcoholemiaMode,
  type AlcoholemiaUiSectionId,
  type DriverType,
  type VehicleType,
} from "@/data/alcoholemia";

const euro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const driverOptions: Array<{ id: DriverType; label: string }> = [
  { id: "general", label: "General" },
  { id: "profesional", label: "Profesional" },
  { id: "novel", label: "Novel" },
  { id: "menor", label: "Menor de edad" },
];

export function AlcoholemiaView({ onBack }: { onBack: () => void }) {
  const [reading, setReading] = useState("0,65");
  const [mode, setMode] = useState<AlcoholemiaMode>(alcoholemia.emp.modo_por_defecto);
  const [vehicle, setVehicle] = useState<VehicleType>("motor_ciclomotor");
  const [driver, setDriver] = useState<DriverType>("general");
  const [previousSanction, setPreviousSanction] = useState(false);
  const [negative, setNegative] = useState(false);
  const calculation = useMemo(() => {
    if (!reading.trim()) return null;
    try {
      return calculateAlcoholemia(reading, mode);
    } catch {
      return null;
    }
  }, [reading, mode]);
  const outcome = useMemo(
    () => resolveAlcoholemiaOutcome({ calculation, vehicle, driver, previousSanction, negative }),
    [calculation, vehicle, driver, previousSanction, negative],
  );
  const selectedVehicle = alcoholemiaVehicleOptions.find((option) => option.id === vehicle);
  const needsPreviousSanction = Boolean(outcome.administracion && !negative);
  const secondaryContent: Record<AlcoholemiaUiSectionId, ReactNode> = {
    tasas: <RatesSection />,
    correccion: <CorrectionSection />,
    actuacion: <PracticeSection />,
    advertencias: <WarningsSection vehicle={vehicle} />,
    fuentes: <SourcesSection />,
  };

  return (
    <section className="alcohol-view">
      <div className="alcohol-heading">
        <div>
          <span className="kicker">SEGURIDAD VIAL · HERRAMIENTA OPERATIVA</span>
          <h2>{alcoholemia.titulo}</h2>
          <p>{alcoholemia.subtitulo}</p>
        </div>
        <button className="alcohol-back" onClick={onBack}>← Volver a Seguridad Vial</button>
      </div>

      <section className="alcohol-card calculator-card">
        <div className="alcohol-card-heading">
          <span className="alcohol-symbol tone-copper">∑</span>
          <div>
            <h3>{alcoholemia.emp.nombre_ui}</h3>
            <p>{alcoholemia.presentacion.calculo_operativo.subtitulo_calculadora}</p>
          </div>
        </div>
        <div className="calculator-layout">
          <div className="calculator-inputs">
            <label htmlFor="alcohol-reading">Lectura del etilómetro <span>(mg/L)</span></label>
            <div className="reading-input">
              <input
                id="alcohol-reading"
                inputMode="decimal"
                value={reading}
                onChange={(event) => setReading(event.target.value)}
                placeholder="Ej.: 0,65"
                aria-describedby="alcohol-input-help"
              />
              <span>mg/L</span>
            </div>
            <p id="alcohol-input-help" className="field-help">{alcoholemia.presentacion.calculo_operativo.ayuda_entrada}</p>

            <label htmlFor="alcohol-driver">Tipo de conductor</label>
            <select id="alcohol-driver" value={driver} onChange={(event) => setDriver(event.target.value as DriverType)}>
              {driverOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>

            <fieldset className="vehicle-fieldset">
              <legend>Tipo de vehículo</legend>
              <div className="vehicle-options">
                {alcoholemiaVehicleOptions.map((option) => (
                  <label
                    className={`vehicle-option ${vehicle === option.id ? "selected" : ""}`}
                    key={option.id}
                    title={option.descripcion}
                  >
                    <input
                      type="radio"
                      name="alcohol-vehicle"
                      value={option.id}
                      checked={vehicle === option.id}
                      onChange={() => {
                        setVehicle(option.id);
                        if (option.id === "clasificacion_pendiente") setNegative(false);
                      }}
                    />
                    <span className="vehicle-option-icon" aria-hidden="true">{option.icono}</span>
                    <strong>{option.label}</strong>
                  </label>
                ))}
              </div>
            </fieldset>
            {vehicle === "clasificacion_pendiente" && (
              <p className="classification-warning">
                <strong>CLASIFICACIÓN DEL VEHÍCULO NECESARIA</strong> {alcoholemia.selector_vehiculo.advertencia_vmp}
              </p>
            )}

            <label htmlFor="alcohol-mode">Situación metrológica</label>
            <select id="alcohol-mode" value={mode} onChange={(event) => setMode(event.target.value as AlcoholemiaMode)}>
              {Object.entries(alcoholemia.emp.modos).map(([key, value]) => <option key={key} value={key}>{value.etiqueta}</option>)}
            </select>

            <label className="checkbox-row">
              <input type="checkbox" checked={negative} onChange={(event) => setNegative(event.target.checked)} />
              <span>Negativa a las pruebas</span>
            </label>
            {needsPreviousSanction && (
              <label className="checkbox-row">
                <input type="checkbox" checked={previousSanction} onChange={(event) => setPreviousSanction(event.target.checked)} />
                <span>{alcoholemia.regla_antecedente.pregunta}</span>
              </label>
            )}
          </div>

          <div className={`calculation-result result-${outcome.tono}`}>
            <div className="calculation-result-header"><span>{outcome.titulo}</span><strong>{outcome.via}</strong></div>
            <div className="selected-context">
              <span>Vehículo: <strong>{selectedVehicle?.label}</strong></span>
              <span>Tasa aplicable: <strong>{outcome.limite_mg_l ? `${formatMg(outcome.limite_mg_l)} mg/L` : "pendiente de clasificación"}</strong></span>
            </div>
            {calculation && !negative && outcome.calculo_operativo && (
              <OperationalCalculation presentation={outcome.calculo_operativo} ticketRate={calculation.tasa_ticket} />
            )}
            <p className="calculation-message">{outcome.mensaje}</p>
            {outcome.administracion && <AdministrativeFinding finding={outcome.administracion} suspended={outcome.kind === "penal_tasa"} />}
            {outcome.articulo_penal && (
              <div className="penal-finding">
                <strong>{outcome.articulo_penal}</strong>
                <p>{outcome.mensaje}</p>
                <span>Vía penal preferente.</span>
              </div>
            )}
            {outcome.influencia_nota && <p className="influence-note">{outcome.influencia_nota}</p>}
          </div>
        </div>
        <p className="alcohol-note">{alcoholemia.emp.aviso}</p>
      </section>

      <div className="alcohol-secondary-sections">
        {alcoholemiaSecondarySections.map((section) => (
          <CollapsibleSection
            key={section.id}
            title={section.titulo}
            icon={section.icono}
            count={section.mostrar_conteo ? alcoholemia.fuentes_v3.length : undefined}
            defaultOpen={section.abierto_por_defecto}
          >
            {secondaryContent[section.id]}
          </CollapsibleSection>
        ))}
      </div>
    </section>
  );
}

function RatesSection() {
  return (
    <div className="limits-table" role="table" aria-label="Límites de alcoholemia en aire espirado">
      <div className="limits-row limits-header" role="row"><span>Tipo</span><span>Límite</span><span>Resultado operativo</span></div>
      {alcoholemia.tabla_limites.map((limit) => (
        <div className={`limits-row ${limit.tipo === "Negativa a las pruebas" ? "limit-negative" : ""}`} role="row" key={limit.tipo}>
          <strong>{limit.tipo}</strong>
          <span>{limit.limite_mg_l == null ? "—" : `${formatMg(limit.limite_mg_l)} mg/L`}</span>
          <div>
            <span className={`status-pill ${limit.tipo === "Umbral penal objetivo" || limit.tipo === "Negativa a las pruebas" ? "status-red" : limit.tipo === "Menor de edad" ? "status-amber" : "status-green"}`}>
              {limit.tipo === "Negativa a las pruebas" ? "Vía penal · art. 383 CP" : limit.tipo === "Umbral penal objetivo" ? "Superior a 0,60 · art. 379.2 CP" : limit.tipo === "Menor de edad" ? "Tolerancia 0,00" : "Comparar con el límite"}
            </span>
            <small>{limit.texto}</small>
            {limit.detalle && <small>{limit.detalle}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CorrectionSection() {
  return (
    <>
      <div className="quick-table-wrap">
        <table className="quick-table">
          <thead><tr><th>Ticket</th><th>Cálculo EMP</th><th>Zona</th><th>Uso práctico</th></tr></thead>
          <tbody>
            {alcoholemia.tabla_rapida_servicio_periodica.map((entry) => (
              <tr key={entry.lectura}>
                <td><strong>{formatMg(entry.lectura)}</strong></td>
                <td><strong>Penal: {formatMg(entry.tasa_penal_2_dec)}</strong><small>Interno exacto: {formatMg(entry.corregido_interno)}</small></td>
                <td><span className={`status-pill status-${entry.color}`}>{entry.zona}</span></td>
                <td>{entry.uso}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="alcohol-note">{alcoholemia.presentacion.calculo_operativo.nota_tabla_correccion}</p>
    </>
  );
}

function PracticeSection() {
  return (
    <>
      <div className="practice-list">
        <InfoBlock title="Pruebas" items={[alcoholemia.practica_pruebas.segunda_prueba, alcoholemia.practica_pruebas.intervalo]} />
        <InfoBlock title="Derechos" items={alcoholemia.practica_pruebas.derechos} />
        <InfoBlock title="Vehículo · art. 25 RGC" items={alcoholemia.medidas_vehiculo.especifica_rgc_25} />
      </div>
      <p className="cross-reference">La medida sobre el vehículo se documenta junto con la intervención y se rige por las reglas comunes vigentes.</p>
    </>
  );
}

function WarningsSection({ vehicle }: { vehicle: VehicleType }) {
  const entries = alcoholemia.resultado_operativo_agrupado.filter(
    (entry) => vehicle === "motor_ciclomotor" || (entry.id !== "ALC-RES-003" && entry.id !== "ALC-RES-004" && entry.id !== "ALC-RES-005"),
  );
  return (
    <>
      <div className="outcomes-grid">
        {entries.map((entry) => (
          <article className={`outcome outcome-${entry.color}`} key={entry.id}>
            <div className="outcome-title"><span className="outcome-dot" aria-hidden="true" /><h4>{entry.titulo}</h4></div>
            <p>{entry.regla}</p>
            {entry.advertencia && <p className="outcome-warning">{entry.advertencia}</p>}
          </article>
        ))}
      </div>
      <p className="alcohol-footer-note"><strong>Nota operativa:</strong> el color apoya la lectura, pero nunca sustituye el texto jurídico. La conducción bajo la influencia exige valorar signos y demás elementos probatorios, aunque no se supere 0,60 mg/L.</p>
    </>
  );
}

function SourcesSection() {
  return (
    <div className="source-list">
      {alcoholemia.fuentes_v3.map((source) => (
        <article key={source.id}>
          <strong>{source.nombre}</strong>
          {source.preceptos.length > 0 && <span>{source.preceptos.join(" · ")}</span>}
          <p>{source.uso}</p>
        </article>
      ))}
    </div>
  );
}

export function OperationalCalculation({ presentation, ticketRate }: {
  presentation: NonNullable<ReturnType<typeof resolveAlcoholemiaOutcome>["calculo_operativo"]>;
  ticketRate: string;
}) {
  return (
    <div className={`operational-calculation operational-${presentation.kind}`}>
      <div className="operational-primary">
        <span>{presentation.principal_label}</span>
        <strong>{formatMg(presentation.principal_value)} mg/L</strong>
        <small>{presentation.principal_help}</small>
      </div>
      {presentation.kind === "penal" && (
        <div className="ticket-rate-secondary">
          <span>{alcoholemia.presentacion.calculo_operativo.etiqueta_ticket}</span>
          <strong>{formatMg(ticketRate)} mg/L</strong>
        </div>
      )}
      <details className="calculation-explanation">
        <summary>{presentation.explanation_title}</summary>
        <dl>
          {presentation.explanation_steps.map((step) => (
            <div key={step.label}>
              <dt>{step.label}</dt>
              <dd>{step.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}

function InfoBlock({ title, items }: { title: string; items: string[] }) {
  return <div className="info-block"><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

function AdministrativeFinding({ finding, suspended }: { finding: NonNullable<ReturnType<typeof resolveAlcoholemiaOutcome>["administracion"]>; suspended: boolean }) {
  return (
    <section className="admin-finding">
      <div className="admin-finding-title">
        <h3>{suspended ? "DENUNCIA ADMINISTRATIVA ASOCIADA — QUEDA SUSPENDIDA" : "DENUNCIA ADMINISTRATIVA"}</h3>
        <span>Salida cerrada</span>
      </div>
      <div className="admin-fields">
        <p><span>Precepto infringido</span><strong>{finding.precepto}</strong></p>
        <p><span>Tipificación</span><strong>{finding.tipificacion}</strong></p>
        <p><span>Codificado ARCI</span><strong>{finding.codificado}</strong></p>
        <p className="admin-field-wide"><span>Hecho denunciado</span><strong>{finding.hecho}</strong></p>
        <p><span>Importe</span><strong>{euro.format(finding.importe)}</strong></p>
        <p><span>Reducción del 50 %</span><strong>{euro.format(finding.reducido)}</strong></p>
        <p><span>Puntos</span><strong>{finding.puntos}</strong>{finding.puntos_nota && <small>{finding.puntos_nota}</small>}</p>
        <p><span>Responsable</span><strong>{finding.responsable}</strong></p>
      </div>
    </section>
  );
}
