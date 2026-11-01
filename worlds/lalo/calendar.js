/* JANUS.CALENDAR consumer: captured canonical values become sourced encounters.
 * Arithmetic belongs to AML. This organ validates, projects and retains readings.
 * Canonical module: ariannamethod.ai 5e893f9b36288c318254c3183e81fb78ecb097c0. */
const CALENDAR = (() => {
  'use strict';
  const revision='5e893f9b36288c318254c3183e81fb78ecb097c0',source='aml:janus.calendar/1';
  const binary='e2ae9554bcaff56b2e58c1ed96219398d50392c71e8dd9ee4eb963418c046c29';
  const sourceHash='65793043ec680a2f0570a038996ccf501600915bcd085daf90cc25b497acff9b';
  const clone=x=>JSON.parse(JSON.stringify(x)),integer=Number.isSafeInteger;
  const day=x=>integer(x)&&x>=-739161&&x<=2912897;
  const within=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const key=text=>{let n=14695981039346656037n;for(const c of text)n=BigInt.asUintN(64,(n^BigInt(c.codePointAt(0)))*1099511628211n);return n.toString(16);};
  function record(r,local=false){
    if(!r||r.schema!==JANUS.API||r.calendar_model!=='hebrew.dr/1'||r.drift_model!=='metonic.legacy-trunc/1'||
      !['midnight','supplied-sunset'].includes(r.day_policy)||!day(r.day)||!integer(r.unix_day)||
      !integer(r.gregorian_year)||!within(r.gregorian_year,1,9999)||!integer(r.gregorian_month)||!within(r.gregorian_month,1,12)||
      !integer(r.gregorian_day)||!within(r.gregorian_day,1,31)||!integer(r.hebrew_year)||!within(r.hebrew_year,1,20000)||
      !integer(r.hebrew_month)||!within(r.hebrew_month,1,13)||!integer(r.hebrew_day)||!within(r.hebrew_day,1,30)||
      ![0,1].includes(r.gregorian_leap)||![0,1].includes(r.hebrew_leap)||!integer(r.metonic_year)||!within(r.metonic_year,1,19)||
      !Object.values(r).every(v=>typeof v==='string'||typeof v==='number'&&Number.isFinite(v)))throw Error('Invalid canonical calendar record');
    if(!local&&(r.unix_day!==r.day+19999||r.day_policy!=='midnight'))throw Error('Invalid calendar day convention');
    return r;
  }
  function instant(r,at){
    record(r,true);const split=JANUS.splitUnixMilliseconds(at);
    if(r.unix_day!==split.unixDay||r.utc_second!==split.second||r.utc_civil_day!==split.unixDay-19999||
      !day(r.utc_civil_day)||r.epoch_day!==r.utc_civil_day-(split.second<43200?1:0)||!integer(r.offset_minutes)||!within(r.offset_minutes,-1440,1440)||
      !integer(r.sunset_second)||!within(r.sunset_second,-1,86399)||!integer(r.local_second)||!within(r.local_second,0,86399)||
      !day(r.hebrew_civil_day)||(r.sunset_second===-1)!==(r.day_policy==='midnight'))throw Error('Calendar instant differs from its supplied timestamp');
    return r;
  }
  function perspective(r,birth,atDay){
    record(r);
    if(r.day!==atDay||r.birth_day!==birth||r.age_days!==atDay-birth||!day(r.next_hebrew_day)||!day(r.next_gregorian_day)||
      !integer(r.days_to_yahrzeit)||r.days_to_yahrzeit<0||!integer(r.days_to_gregorian)||r.days_to_gregorian<0||
      r.days_to_yahrzeit!==r.next_hebrew_day-atDay||r.days_to_gregorian!==r.next_gregorian_day-atDay||
      r.anniversary_gap_days!==r.next_hebrew_day-r.next_gregorian_day||!within(r.personal_dissonance,0,1)||
      !within(r.janus_gap,-1,1)||!within(r.yahrzeit,0,1)||!within(r.janus_temporal_alpha,0,1)||![0,1].includes(r.birthquake)||
      !['birth_drift','legacy_drift','legacy_step','drift_gap_days'].every(k=>within(r[k],-1e8,1e8)))throw Error('Invalid canonical personal perspective');
    return r;
  }
  const assertion=f=>({id:f.id,source:f.source,validFrom:f.validFrom,validTo:f.validTo,recordedAt:f.recordedAt});
  function origin(fact,coordinates,implementation=revision,wasm=binary){
    instant(coordinates,fact.validFrom);
    if(coordinates.offset_minutes!==0||coordinates.sunset_second!==-1)throw Error('Personal origin uses the canonical UTC midnight policy');
    return {policy:'amos/calendar-origin-v1',assertion:assertion(fact),at:fact.validFrom,day:coordinates.utc_civil_day,implementation,binary:wasm,coordinates:clone(coordinates)};
  }
  function validateOrigin(value){
    if(!value||value.policy!=='amos/calendar-origin-v1'||!value.assertion||typeof value.assertion.id!=='string'||
      typeof value.assertion.source!=='string'||value.assertion.validFrom!==value.at||!day(value.day)||typeof value.receipt!=='string'||
      !/^[a-f0-9]{40}$/.test(value.implementation)||!/^[a-f0-9]{64}$/.test(value.binary))throw Error('Invalid personal calendar origin');
    const expected=origin(value.assertion,value.coordinates,value.implementation,value.binary);
    if(!same({...value,receipt:undefined},{...expected,receipt:undefined}))throw Error('Personal origin differs from its canonical coordinates');
    return value;
  }
  function resolveOrigin(ledger,receipt){
    const all=ledger.entries(),original=all.find(f=>f.id===receipt&&f.predicate==='origin_header');
    if(original)return validateOrigin({...JSON.parse(original.value),receipt});
    const carried=all.find(f=>f.source==='amos:experience/v1'&&f.predicate==='calendar_origin_memory'&&JSON.parse(f.value).receipt===receipt);
    return carried?validateOrigin(JSON.parse(carried.value)):null;
  }
  async function capture(calendar,fact,{role='event',at=fact.validFrom,requestedAt=fact.recordedAt,origin:birth=null,offset=0,sunset=-1,implementation=revision}={}){
    if(!calendar||typeof calendar.local!=='function'||typeof calendar.subject!=='function')throw Error('Canonical calendar transport is unavailable');
    const split=JANUS.splitUnixMilliseconds(at),view=await calendar.local(split.unixDay,split.second,offset,sunset);
    instant(view,at);if(birth)validateOrigin(birth);
    const subject=birth?await calendar.subject(birth.day,view.utc_civil_day):null;
    if(subject)perspective(subject,birth.day,view.utc_civil_day);
    return {format:'amos/janus-observation',version:1,api:JANUS.API,implementation,binary,sourceHash,
      assertion:assertion(fact),role,at,requestedAt,origin:birth?{day:birth.day,receipt:birth.receipt}:null,instant:view,subject};
  }
  function validate(packet,ledger,birth){
    if(!packet||packet.format!=='amos/janus-observation'||packet.version!==1||packet.api!==JANUS.API||
      typeof packet.implementation!=='string'||!/^[a-f0-9]{40}$/.test(packet.implementation)||
      typeof packet.binary!=='string'||!/^[a-f0-9]{64}$/.test(packet.binary)||typeof packet.sourceHash!=='string'||!/^[a-f0-9]{64}$/.test(packet.sourceHash)||
      !['event','self'].includes(packet.role)||!integer(packet.at)||!integer(packet.requestedAt)||!packet.assertion)throw Error('Invalid temporal observation packet');
    const target=ledger.entries().find(f=>f.id===packet.assertion.id);
    if(!target||!same(packet.assertion,assertion(target))||packet.requestedAt<target.recordedAt||packet.role==='event'&&packet.at!==target.validFrom||
      packet.role==='self'&&packet.at!==packet.requestedAt)throw Error('Calendar observation differs from its source assertion');
    instant(packet.instant,packet.at);
    if(packet.origin!==null){
      if(!birth||!same(packet.origin,{day:birth.day,receipt:birth.receipt}))throw Error('Calendar reading would move the personal origin');
      validateOrigin(birth);perspective(packet.subject,birth.day,packet.instant.utc_civil_day);
    }else if(packet.subject!==null)throw Error('A personal perspective needs its declared origin');
    const raw=JSON.stringify(packet);if(raw.length>4096)throw Error('Temporal packet exceeds the scalar receipt budget');
    return {target,raw};
  }
  function frame(packet,ledger,birth){
    const {target,raw}=validate(packet,ledger,birth),s=packet.subject,v=packet.instant,all=ledger.entries(),targetIndex=all.findIndex(f=>f.id===target.id);
    const registration=all.find(f=>f.source==='amos:registration/v1'&&JSON.parse(f.value).premises.includes(targetIndex));
    const content=registration?JSON.parse(registration.value).glyphs??[]:[];
    const glyphs=[...new Set(['now','before','after','remember','me'].map(name=>VOICE.names.indexOf(name)).concat(content))];
    const a=s?.age_days??v.utc_civil_day,b=s?(s.janus_gap+s.personal_dissonance)/2:(v.metonic_year-10)/9;
    return {kind:'temporal',key:`${key(JSON.stringify([target.id,packet.role,packet.origin?.receipt??null,v.offset_minutes,v.sunset_second]))}:${packet.at}:${packet.requestedAt}`,source,
      observedAt:packet.at,title:`${packet.role==='event'?'Event':'Self'} time · ${v.gregorian_year}-${String(v.gregorian_month).padStart(2,'0')}-${String(v.gregorian_day).padStart(2,'0')}`,
      values:{packet:raw,assertion_id:target.id,role:packet.role,evaluated_at:packet.at,civil_day:v.utc_civil_day,epoch_day:v.epoch_day,
        metonic_year:v.metonic_year,birth_day:s?.birth_day??null,age_days:s?.age_days??null,calendar_gap:s?.janus_gap??null,
        personal_dissonance:s?.personal_dissonance??null,days_to_yahrzeit:s?.days_to_yahrzeit??null,days_to_gregorian:s?.days_to_gregorian??null},
      sensory:[Math.tanh(a/1024),b],projection:'Canonical temporal distance and calendar difference, amos/temporal-input-v1',glyphs,
      detail:{contentGlyphs:glyphs,calendar:{policy:'amos/temporal-input-v1',target:target.id,targetIndex,origin:packet.origin,implementation:packet.implementation}}};
  }
  return {revision,binary,sourceHash,source,origin,validateOrigin,resolveOrigin,capture,validate,frame,instant};
})();
