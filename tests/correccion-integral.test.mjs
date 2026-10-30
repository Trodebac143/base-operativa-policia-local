import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { checkedPatrimony, checkedNoRisks } from "./helpers/checked-facts.mjs";
const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ appType:"custom", configFile:false, root, resolve:{alias:{"@":root}}, server:{middlewareMode:true,hmr:false} });
after(()=>vite.close());
const { resolverSituacionProcesal: process } = await vite.ssrLoadModule("/data/procesal-penal.ts");
const { resolvePublicSafetyOutcome: incident, resolveAuthorityFromFacts: authority, seguridadPublicaConceptos } = await vite.ssrLoadModule("/data/seguridad-publica.ts");
const { resolvePatrimonyOutcome: patrimony } = await vite.ssrLoadModule("/data/patrimonio.ts");
const { updatePatrimonyFact, theftQualificationFields, damageQualificationFields } = await vite.ssrLoadModule("/data/patrimony-review.ts");
const { updatePublicSafetyFact } = await vite.ssrLoadModule("/data/fact-transitions.ts");
const { hasProcessualAnswer } = await vite.ssrLoadModule("/app/seguridad-publica.tsx");
const { legalArticleLinks } = await vite.ssrLoadModule("/data/legal-links.ts");
const norms = o => o.resultados.map(r=>r.norma).join(" ");
const sexual = { conductaSexual:"acto_fisico", menorDieciseis:true, penetracion:false, violenciaIntimidacion:false, voluntadAnulada:false };
const taking = { hechoPrincipal:"apoderamiento", titularidad:"ajena", gradoEjecucion:"consumado", intencionApropiacionBeneficio:true, sinConsentimiento:true, violenciaFisica:false, intimidacion:false, fuerza:"ninguna", cuantia:100, cuantiaAcreditada:true };
const adult = { edadAutor:"mayor_de_18", gravedad:"DELITO LEVE" };

for (const legacy of [false, undefined]) test("E01 · entrada antigua "+legacy+" no cierra víctima menor de 16",()=>{
 const o=incident("agresiones_sexuales",{...sexual,actoSexualNoConsentido:legacy});
 assert.match(norms(o),/181/); assert.ok(o.resultados.some(r=>r.actuacion.length));
});
test("E01 · consentimiento desconocido adulto queda pendiente; 182 y 183 accesibles",()=>{
 assert.doesNotMatch(norms(incident("agresiones_sexuales",{...sexual,menorDieciseis:false})),/178|179/);
 assert.match(norms(incident("agresiones_sexuales",{...sexual,conductaSexual:"hacer_presenciar",actosPresenciadosDelictivos:false})),/182/);
 assert.match(norms(incident("agresiones_sexuales",{...sexual,conductaSexual:"contacto_tic",propuestaEncuentroYAcercamiento:true})),/183/);
 const o=incident("agresiones_sexuales",{...sexual,posibleExcepcion183Bis:true});
 assert.match(JSON.stringify(o),/consentimiento libre.*proximidad de edad/);
 assert.doesNotMatch(JSON.stringify(o),/diferencia de [0-9]+ años/);
});
for(const domicilio of [true,false,undefined]) for(const fianza of [true,false,undefined]) for(const denuncia of [true,false,undefined]) test("E02 · domicilio/fianza/denuncia "+[domicilio,fianza,denuncia].join("/"),()=>{
 const input={...adult,domicilioConocido:domicilio,fianzaBastante:fianza,denunciaOQuerella:denuncia,procedibilidad:"denuncia"};
 const o=process(input);
 if(denuncia!==true) { assert.equal(o.escenarioProcesal,"PROCEDIBILIDAD PENDIENTE"); assert.equal(o.detencion,"NO"); }
 else if(domicilio===undefined || domicilio===false&&fianza===undefined) {
  assert.equal(o.situacion,"NO DETENER TODAVÍA — INVESTIGAR");
  assert.equal(hasProcessualAnswer(undefined,input,true,true),false);
 } else { assert.equal(hasProcessualAnswer(undefined,input,true,true),true); assert.equal(o.detencion,domicilio===false&&fianza===false?"SÍ":"NO"); }
});
test("E03 · oposición no suple actuación, orden ni resistencia comprobadas",()=>{
 const facts={conductaObservada:"oposicion",enEjercicioFunciones:true,conductaOposicionConcreta:true};
 for(const patch of [{},{actuacionLegitima:false},{actuacionLegitima:true,requerimientoAplicable:true,ordenLegitimaDentroCompetencia:false},{actuacionLegitima:true,requerimientoAplicable:false,oposicionPersistente:false,servicioImpedido:false}]){
  const o=authority("resistencia",{...facts,...patch}); assert.equal(o.clasificacion,undefined); assert.doesNotMatch(o.actuacion.join(" "),/Formular denuncia/);
 }
 const admin=authority("resistencia",{...facts,actuacionLegitima:true,requerimientoAplicable:true,ordenLegitimaDentroCompetencia:true,ordenConcretaComprendida:true,oposicionPersistente:true,servicioImpedido:false});
 assert.match(admin.norma,/36.6/);
});
test("E04/E06 · contexto de amenazas y ámbito del respeto no se presumen",()=>{
 const pending=authority("amenazas",{conductaObservada:"amenaza_concreta",enEjercicioFunciones:true});
 assert.match(pending.titulo,/PENDIENTE/); assert.equal(pending.supuestoPenalId,undefined);
 const confirmed=authority("amenazas",{conductaObservada:"amenaza_concreta",enEjercicioFunciones:false,porRazonServicio:false,amenazaContenidoDocumentado:true,amenazaSeriedadFirmeza:true,amenazaMediosConcretos:false,amenazaProximidad:false,amenazaReiteracion:false,condicionAmenaza:false});
 assert.match(confirmed.norma,/169/);
 assert.doesNotMatch(confirmed.porQue,/medios disponibles|reiteración acreditada|temor efectivo/);
 for(const facts of [{enEjercicioFunciones:false,porRazonServicio:true,agenteProteccionSeguridad:true},{enEjercicioFunciones:true,agenteProteccionSeguridad:false}]) assert.doesNotMatch(authority("amenazas",{conductaObservada:"insulto",...facts}).norma,/37.4/);
 assert.match(authority("amenazas",{conductaObservada:"insulto",enEjercicioFunciones:true,agenteProteccionSeguridad:true}).norma,/37.4/);
});
test("E05 · identidad pendiente no añade riesgo de fuga; cada riesgo debe constar",()=>{
 const input={edadAutor:"mayor_de_18",gravedad:"DELITO MENOS GRAVE",flagrante:false,indiciosHechoSuficientes:true,indiciosParticipacionSuficientes:true,identidadODomicilioNoVerificables:true};
 assert.equal(process(input).situacion,"NO DETENER TODAVÍA — INVESTIGAR");
 const no=process({...input,...checkedNoRisks});assert.equal(no.detencion,"NO");
 assert.doesNotMatch(no.fundamentoDetencion,/Constan hechos concretos que permiten valorar riesgo/);
 for(const key of Object.keys(checkedNoRisks)) assert.equal(process({...input,[key]:true}).detencion,"SÍ");
});
for(const [age,scenario] of [["menor_de_14","MENOR DE 14"],["de_14_a_17","AUTOR MENOR"],["mayor_de_18","FLAGRANCIA"],["desconocida","EDAD PENDIENTE"]]) test("E07 · edad "+age,()=>{
 const o=process({edadAutor:age,gravedad:"DELITO MENOS GRAVE",flagrante:true});
 assert.equal(o.escenarioProcesal,scenario);
 if(age==="de_14_a_17")assert.match(o.fundamentoDetencion,/24 horas.*no ordena detener/);
});
test("E07 · dato antiguo menor de edad no inventa 14–17",()=>{
 assert.equal(process({autorMayorEdad:false,gravedad:"DELITO MENOS GRAVE",flagrante:true}).escenarioProcesal,"EDAD PENDIENTE");
 assert.equal(hasProcessualAnswer(true,{autorMayorEdad:false}),false);
});
test("E08 · garantías de identificación permanecen en contenido canónico",()=>{
 const t=JSON.stringify(seguridadPublicaConceptos.find(c=>c.id==="identificacion"));
 for(const pattern of [/seis horas|6 horas/,/volante/,/registro/,/identifica/i,/inform/i,/discrimin/i])assert.match(t,pattern);
});
test("E09 · lugar y arma desconocidos no cierran 242; uso y presencia separados",()=>{
 const base={...taking,violenciaFisica:true,momentoViolencia:"apoderamiento",conexionViolenciaApoderamiento:true};
 for(const patch of [{},{tipoLugar:"otro"},{tipoLugar:"morada",armaPresente:true}])assert.equal(patrimony({...base,...patch}).estado,"pendiente");
 for(const [l,id] of [["otro","242.1"],["morada","242.2"],["local_abierto","242.2"],["dependencia","242.2"]]){
  assert.equal(patrimony({...base,tipoLugar:l,armaPresente:false}).supuestoPenalId,id);
  assert.match(patrimony({...base,tipoLugar:l,armaPresente:true,armaUsada:true}).norma,/242.3/);
  assert.doesNotMatch(patrimony({...base,tipoLugar:l,armaPresente:true,armaUsada:false}).norma,/242.3/);
 }
});
for(const key of Object.keys(theftQualificationFields)) test("E10 · omitir "+key+" mantiene calificación pendiente",()=>{
 const o=patrimony({...checkedPatrimony,...taking,[key]:undefined});
 assert.equal(o.estado,"pendiente");assert.equal(o.procesal,undefined);assert.equal(o.gravedad,undefined);
});
for(const key of Object.keys(damageQualificationFields)) test("E10 · daño sin comprobar "+key,()=>{
 const o=patrimony({...checkedPatrimony,hechoPrincipal:"danos",titularidad:"ajena",intencionalidadDano:"deliberado",cuantia:100,cuantiaAcreditada:true,[key]:undefined});
 assert.equal(o.estado,"pendiente");
});
test("E10 · controles activos y excepciones heredadas documentadas",()=>{
 const app=readFileSync(new URL("../app/seguridad-publica.tsx",import.meta.url),"utf8");
 for(const k of [...Object.keys(theftQualificationFields),...Object.keys(damageQualificationFields),"numeroCondenasEjecutorias","condenasCanceladasOCancelables","personaEspecialmenteVulnerableConvive"])assert.ok(app.includes('"'+k+'"'),k);
});
test("E10 · cambiar conductor de rama elimina datos subordinados",()=>{
 assert.equal(updatePatrimonyFact({armaPresente:true,armaUsada:true},"armaPresente",false).armaUsada,undefined);
 assert.equal(updatePatrimonyFact({estadoCondenasPrevias:"condenas_ejecutorias_verificadas",numeroCondenasEjecutorias:3},"estadoCondenasPrevias","no_consta_verificacion").numeroCondenasEjecutorias,undefined);
 const switched=updatePublicSafetyFact({...sexual,penetracion:true,estadoConsentimiento:"ausencia_manifestada",procedibilidadSexual:"denuncia_victima"},"conductaSexual","contacto_tic");
 for(const key of ["penetracion","estadoConsentimiento","procedibilidadSexual"])assert.equal(switched[key],undefined);
});

test("E10 derivado · documentación judicial incompleta no confirma ausencia de agravación",()=>{
 const o=patrimony({...checkedPatrimony,...taking,estadoCondenasPrevias:"condenas_ejecutorias_verificadas",numeroCondenasEjecutorias:3,condenasMismaNaturaleza:true,condenasCanceladasOCancelables:false,requisitosCondenasCompletos:false,algunaCondenaLeve:true});
 assert.equal(o.estado,"pendiente");assert.equal(o.gravedad,undefined);assert.equal(o.procesal,undefined);
});

test("E10 derivado · violencia no conectada no oculta la fuerza del acceso",()=>{
 const base={...checkedPatrimony,...taking,violenciaFisica:true,momentoViolencia:"otro",conexionViolenciaApoderamiento:false};
 assert.equal(patrimony({...base,fuerza:undefined}).estado,"pendiente");
 assert.match(patrimony({...base,fuerza:"ninguna"}).norma,/234/);
 assert.match(patrimony({...base,fuerza:"rotura_acceso"}).norma,/238.*240/);
});

test("E10 derivado · la excusa familiar pendiente no se descarta ni se arrastra",()=>{
 const pending=patrimony({...checkedPatrimony,...taking,relacionArt268:undefined});
 assert.equal(pending.estado,"pendiente");assert.equal(pending.procesal,undefined);
 const stale=patrimony({...checkedPatrimony,...taking,relacionArt268:"ninguna",vinculoFamiliar268:"ascendiente"});
 assert.equal(stale.exencion,undefined);assert.equal(stale.estado,"resuelto");
});
test("E11 · residuos no confunden incertidumbre con inexistencia de infracción",()=>{
 const data=JSON.parse(readFileSync(new URL("../contenido/policia_administrativa/convivencia/casos/CONV-OP-009.json",import.meta.url),"utf8"));
 const outcomes=data.datos_adicionales.convivencia.salidas;
 const pending=outcomes.filter(o=>Object.values(o.cuando).includes("indeterminado"));
 assert.ok(pending.length>0);
 for(const o of pending){assert.notEqual(o.estadoSalida,"sin_infraccion");assert.notEqual(o.sinInfraccion,true);}
 assert.ok(outcomes.some(o=>o.estadoSalida==="tipificacion_no_verificada"));
 assert.ok(outcomes.some(o=>o.estadoSalida==="sin_infraccion"));
 assert.ok(outcomes.some(o=>o.regulacionEspecifica));
});
test("E12 · índice de herramientas con destinos existentes y alias",async()=>{
 const {operationalToolSearchEntries: entries}=await vite.ssrLoadModule("/data/operational-tools.ts");
 const {categories}=await vite.ssrLoadModule("/data/categories.ts");
 assert.equal(new Set(entries.map(e=>e.id)).size,7);
 for(const e of entries){assert.ok(categories.some(c=>c.id===e.categoria),e.id);assert.ok(e.sinonimos.length);}
});
for(const date of [undefined,"desconocida","antes_2026_04_10","continuado"]) test("E14 · fecha "+date+" no aplica reforma desfavorable",()=>{
 const mobile=patrimony({...checkedPatrimony,...taking,fechaHecho:date,telefonoODispositivo235:true,existenciaComercialVentaAlmacenExposicion:false});
 assert.equal(mobile.estado,"pendiente");assert.equal(mobile.gravedad,undefined);
 const convictions=patrimony({...checkedPatrimony,...taking,fechaHecho:date,estadoCondenasPrevias:"condenas_ejecutorias_verificadas",numeroCondenasEjecutorias:3,condenasMismaNaturaleza:true,condenasCanceladasOCancelables:false,requisitosCondenasCompletos:true,algunaCondenaLeve:true});
 assert.equal(convictions.estado,"pendiente");assert.equal(convictions.gravedad,undefined);
});
test("E14 · fecha posterior habilita rama actual; cultural anterior no usa reforma nueva",()=>{
 assert.equal(patrimony({...checkedPatrimony,...taking,telefonoODispositivo235:true,existenciaComercialVentaAlmacenExposicion:false}).supuestoPenalId,"235.1");
 assert.equal(patrimony({...checkedPatrimony,...taking,fechaHecho:"antes_2026_04_10",valorArtisticoHistoricoCulturalCientifico:true}).supuestoPenalId,"235.1");
});
test("E15 · fuentes específicas y explicación procesal con hechos y pendientes",()=>{
 const links=legalArticleLinks(["Código Penal · arts. 237 y 242.2","LO 4/2015 · art. 16","LO 5/2000 · art. 17"]);
 for(const suffix of ["#a237","#a242","#a16","#a17"])assert.ok(links.some(l=>l.url.endsWith(suffix)));
 const o=process({...adult,domicilioConocido:false});
 assert.ok(o.razonamientoProcesal.hechosConfirmados.length);
 assert.match(o.fundamentoDetencion,/fianza/i);assert.ok(o.referenciasProcesales.length);
});
