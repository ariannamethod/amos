/* LALO → AMOS → expression. Portable, event-driven; clocks enter explicitly.
 * The AMOS Subject is the existing JS body, with its own predictor and RNG.
 * No presentation frame, fetch failure or repeated feed advances this life. */
const AMOS2 = (() => {
  'use strict';
  const CAPACITY=4096, MAX_QUEUE=128, MAX_HISTORY=128, MAX_SNAPSHOT=24_000_000, MAX_JOURNAL=8_000_000, ENCOUNTER_RECEIPTS=9, RESERVE_BYTES=32000;
  const bounded=(n,a,b)=>Math.max(a,Math.min(b,n));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const magnitude=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/Math.max(1,a.length));
  const integer=n=>Number.isSafeInteger(n);
  const bytes=s=>new TextEncoder().encode(s).length;
  const finiteArray=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e12);
  // Recomputed libm projections may differ by a few ulps across JS engines.
  // Stored receipts remain byte-exact; loading never rewrites acquired numbers.
  const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(a),Math.abs(b));
  const closeArray=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>close(v,b[i]));
  const sameReading=(a,b)=>!!b&&closeArray(a.sensory,b.sensory)&&JSON.stringify({...a,sensory:null})===JSON.stringify({...b,sensory:null});
  const BODY=AMOS.withWidth(40);
  // An encounter is mid-transaction: its new memory tick is not committed yet.
  // Copy only the live subject for interventions; never change its world clock.
  function copySubject(subject){
    const data=clone(subject),out=Object.assign(Object.create(BODY.Subject.prototype),data);
    out.rng=new BODY.Random(BigInt('0x'+data.rng.random64));
    out.glyph=Object.assign(Object.create(BODY.Glyphs.prototype),data.glyph);
    out.body=Object.assign(Object.create(BODY.Embodiment.prototype),data.body);return out;
  }
  const encode=ledger=>LALO.encodeJournal(ledger,{maxBytes:MAX_JOURNAL});
  const decode=text=>LALO.decodeJournal(text,{capacity:CAPACITY,maxBytes:MAX_JOURNAL});
  const makeHost=ledger=>LALO.createToolHost(ledger,{capacity:CAPACITY,maxBytes:MAX_JOURNAL});
  const featureMap=(i,width)=>i<5+width?i:i<5+2*width?i+BODY.H-width:BODY.F-1;
  const growFeatures=(a,width)=>{const next=Array(BODY.F).fill(0);a.forEach((v,i)=>next[featureMap(i,width)]=v);return next;};
  function growModel(text) {
    const old=AMOS.Amos.loads(text),width=old.subject.h.length;if(width===BODY.H)return old;
    const extra=BODY.H-width,pad=()=>Array(extra).fill(0),d=JSON.parse(old.dumps()),a=d.amos,s=a.subject;
    const fresh=JSON.parse(new BODY.Amos(BigInt('0x'+a.seed),a.world.kind,s.glyph.enabled,s.mode).dumps()).amos.subject;
    const weights=Array.from({length:3},(_,k)=>growFeatures(s.weights[k],width));
    const covariance=Array.from({length:BODY.F},(_,i)=>Array.from({length:BODY.F},(_,j)=>i===j?100:0));
    for(let i=0;i<2*width+6;i++)for(let j=0;j<2*width+6;j++)covariance[featureMap(i,width)][featureMap(j,width)]=s.covariance[i][j];
    s.h=s.h.concat(pad());s.win=s.win.concat(fresh.win.slice(width));
    s.recurrent=s.recurrent.map(row=>row.concat(pad())).concat(fresh.recurrent.slice(width));
    s.weights=weights;s.covariance=covariance;s.glyph.prototypes=s.glyph.prototypes.map(row=>row.concat(pad()));
    a.memory=a.memory.map(t=>({...t,features:growFeatures(t.features,width)}));
    return BODY.Amos.loads(JSON.stringify(d));
  }
  // Only a current head from the same source can be an unchanged observation.
  function currentVersion(ledger,subject,source) {
    const all=ledger.entries(),last=all.findLast(f=>f.subject===subject&&f.source===source);
    if(!last)return [];
    const prefix=last.id.slice(0,last.id.lastIndexOf(':')+1),replaced=new Set(all.map(f=>f.supersedes));
    return all.filter(f=>f.subject===subject&&f.source===source&&f.id.startsWith(prefix)&&!replaced.has(f.id));
  }
  const unchanged=(facts,values,from,to)=>facts.length===Object.keys(values).length&&facts.every(f=>Object.hasOwn(values,f.predicate)&&f.value===values[f.predicate]&&f.validFrom===from&&f.validTo===to);
  const gid=name=>VOICE.names.indexOf(name);
  const ids=names=>names.map(gid);
  const latestReceipt=ledger=>ledger.entries().at(-1)?.recordedAt??0;
  const worldKind=kind=>typeof kind==='string'&&/^[a-z][a-z0-9-]{0,31}$/.test(kind);
  const fingerprint=text=>{let n=14695981039346656037n;for(const c of text)n=BigInt.asUintN(64,(n^BigInt(c.codePointAt(0)))*1099511628211n);return n.toString(16);};
  function prefixLedger(ledger,count){
    if(count===undefined)return ledger;
    const rows=ledger.entries();if(!integer(count)||count<0||count>rows.length)throw Error('Invalid knowledge boundary');
    const out=new LALO.FactLedger({capacity:CAPACITY});for(const f of rows.slice(0,count))out.add(f);return out;
  }
  function inference(query,ledger) {
    const known=prefixLedger(ledger,query.knownThrough);
    return query.rule===LALO.RULE?LALO.hypothesis(known,query):LALO.magnitudeHypothesis(known,query);
  }
  function validateEvaluation(fact,ledger){
    const d=JSON.parse(fact.value),all=ledger.entries(),index=all.findIndex(f=>f.id===fact.id);
    if(d?.policy!=='amos/named-evaluation-v1'||!integer(d.query?.knownThrough)||d.query.knownThrough<0||d.query.knownThrough>index||
      !integer(d.query.knownAt)||d.query.knownAt>fact.recordedAt||![LALO.RULE,LALO.MAGNITUDE_RULE].includes(d.query.rule))throw Error('Invalid recorded evaluation');
    const result=inference(d.query,ledger);
    if(result.state!==d.state||JSON.stringify(result.premises.map(id=>all.findIndex(f=>f.id===id)))!==JSON.stringify(d.premises))throw Error('Evaluation differs from its knowledge boundary');
    return d;
  }
  function validateInference(event,ledger){
    const d=event.detail.derivation;
    if(event.source!=='amos:inference/v1'||!d||![LALO.RULE,LALO.MAGNITUDE_RULE].includes(d.query?.rule)||
      !integer(d.query.knownAt)||d.query.knownAt>event.receivedAt||d.query.validAt!==event.observedAt||
      !Array.isArray(d.premises)||d.premises.length>128)throw Error('Invalid named inference');
    const result=inference(d.query,ledger),all=ledger.entries();
    if(JSON.stringify(result.premises.map(id=>all.findIndex(f=>f.id===id)))!==JSON.stringify(d.premises)||
      !event.factIds.some(id=>all.some(f=>f.id===id&&f.predicate==='state'&&f.value===result.state))||
      !event.factIds.some(id=>all.some(f=>f.id===id&&f.predicate==='premise_indices'&&f.value===JSON.stringify(d.premises))))throw Error('Inference differs from its premises');
    if(d.evaluationReceipt){const evaluation=all.find(f=>f.id===d.evaluationReceipt);
      if(!evaluation||evaluation.source!=='amos:evaluation/v1'||JSON.stringify(validateEvaluation(evaluation,ledger).query)!==JSON.stringify(d.query))throw Error('Missing inference evaluation');}
  }
  function validateReflection(t,ledger){
    const r=t.selfReflection,all=ledger.entries(),legacy=t.receiptState==='legacy-full-journal'&&t.event.legacyCompletion===true;
    const expectedFeatures=[1,...t.worldAfter,t.action,t.load,t.resonance,t.relations.familiarity,Math.tanh(t.surprise)];
    if(!r||r.policy!=='amos/self-sonar-v1'||!finiteArray(r.forecast?.features,BODY.H+6)||!finiteArray(r.forecast?.expected,4)||
      JSON.stringify(r.forecast.features.slice(0,-1))!==JSON.stringify(expectedFeatures.slice(0,-1))||!close(r.forecast.features.at(-1),expectedFeatures.at(-1))||
      !integer(r.forecast.updatesBefore)||r.forecast.updatesBefore<0||!finiteArray(r.observed,4)||
      !finiteArray(t.readAfter,BODY.H)||!finiteArray(t.finalObservation,3)||!integer(t.encounterAt)||t.encounterAt<t.event.receivedAt||
      !closeArray(COGNITION.measure(t.worldAfter,t.after,t.observed,t.finalObservation),r.observed)||
      !close(COGNITION.rms(r.observed.map((v,k)=>v-r.forecast.expected[k])),r.error)||
      !['self','world'].includes(r.scope)||!finiteArray(r.before,6)||!finiteArray(r.after,6)||
      !r.controls||!Object.values(r.controls).every(v=>Number.isFinite(v)&&v>0)||
      !Array.isArray(r.passes)||!r.passes.length||r.passes.length>4||
      !r.passes.every((p,i)=>p.depth===i+1&&finiteArray(p.after,6)&&p.after.every(v=>v>=0&&v<=1)&&finiteArray(p.observation,3)&&
        Number.isFinite(p.shift)&&p.shift>=0&&Number.isFinite(p.gate)&&p.gate>=0&&p.gate<=1&&Array.isArray(p.draft)&&p.draft.length===5&&p.draft.every(integer))||
      JSON.stringify(r.passes.at(-1).observation)!==JSON.stringify(t.finalObservation)||
      r.registrationPremise!==all.findIndex(f=>f.id===t.event.registrationReceipt)||
      JSON.stringify(r.sourcePremises)!==JSON.stringify(t.event.factIds.map(id=>all.findIndex(f=>f.id===id)))||
      !t.selection||t.selection.selected?.id!==t.event.id||!['explicit','acquired'].includes(t.selection.mode)||
      !Array.isArray(t.selection.alternatives)||t.selection.alternatives.length>3||
      ![t.selection.selected,...t.selection.alternatives].every(c=>typeof c.id==='string'&&Number.isFinite(c.score)))throw Error('Invalid self-reflection or attention decision');
    for(const [id,source,value] of [[t.selfReceipt,'amos:self/v1',r],[t.selectionReceipt,'amos:attention/v1',t.selection]]){
      const fact=all.find(f=>f.id===id);
      if(!legacy&&(!fact||fact.source!==source||fact.recordedAt!==t.encounterAt||fact.value!==JSON.stringify(value)))throw Error('Missing self-observation receipt');
    }
    if(t.policy==='amos/reflective-facts-v2'){
      const a=t.associations,receipt=all.find(f=>f.id===t.linkReceipt),incoming=[...new Set(t.event.detail.contentGlyphs??t.event.glyphs)];
      const ids=items=>Array.isArray(items)&&new Set(items).size===items.length&&items.every(g=>integer(g)&&incoming.includes(g));
      if(!a||a.policy!=='amos/encounter-links-v1'||JSON.stringify(a.incoming)!==JSON.stringify(incoming)||
        ![a.known,a.novel,a.matched,a.unmatched].every(ids)||
        !ids(a.known.concat(a.novel))||a.known.length+a.novel.length!==incoming.length||
        !ids(a.matched.concat(a.unmatched))||a.matched.length+a.unmatched.length!==incoming.length||
        !Array.isArray(a.matches)||a.matches.length>3||!finiteArray(a.sensory,2)||!Number.isFinite(a.strength)||a.strength<0||a.strength>1||
        !Array.isArray(a.evidence)||a.evidence.length!==a.matched.length||
        !a.evidence.every(([g,anchor,registration])=>a.matched.includes(g)&&integer(anchor)&&anchor>=0&&!!all[anchor]&&all[anchor].recordedAt<=t.encounterAt&&
          (registration===-1||integer(registration)&&!!all[registration]&&JSON.parse(all[registration].value).premises.includes(anchor)&&
            (JSON.parse(all[registration].value).policy!=='amos/registration-v2'||JSON.parse(all[registration].value).glyphs.includes(g))))||
        !a.matches.every(m=>integer(m.tick)&&m.tick<t.tick&&integer(m.anchor)&&!!all[m.anchor]&&finiteArray(m.sensory,2)&&Number.isFinite(m.similarity)&&m.similarity>0&&m.similarity<=1)||
        (!legacy&&(!receipt||receipt.source!=='amos:links/v1'||receipt.value!==JSON.stringify(a)||r.associationPremise!==all.findIndex(f=>f.id===t.linkReceipt))))throw Error('Invalid encounter association');
    }
  }
  function eventValid(e,ledger) {
    if(!e||typeof e.id!=='string'||!worldKind(e.kind)||
      !integer(e.observedAt)||!integer(e.receivedAt)||typeof e.title!=='string'||e.title.length>4096||
      typeof e.subject!=='string'||!e.subject||e.subject.length>512||typeof e.source!=='string'||
      typeof e.projection!=='string'||e.projection.length>512||!e.detail||typeof e.detail!=='object'||Array.isArray(e.detail)||
      !finiteArray(e.sensory,2)||e.sensory.some(v=>Math.abs(v)>1)||
      !Array.isArray(e.glyphs)||e.glyphs.length>132||!e.glyphs.every(v=>integer(v)&&v>=0&&v<88)||
      !Array.isArray(e.factIds)||e.factIds.length>16||!e.factIds.length||
      new Set(e.factIds).size!==e.factIds.length||
      !e.factIds.every(id=>ledger.entries().some(f=>f.id===id&&f.subject===e.subject&&f.source===e.source&&f.validFrom===e.observedAt&&f.recordedAt===e.receivedAt)))throw Error('Invalid encounter or missing source receipts');
    if(e.registrationReceipt!==undefined){
      const f=ledger.entries().find(f=>f.id===e.registrationReceipt);
      if(!f||f.source!=='amos:registration/v1'||f.recordedAt!==e.receivedAt||f.value!==JSON.stringify(COGNITION.registration(e,ledger,JSON.parse(f.value).policy==='amos/registration-v1'?1:2))||!integer(e.acceptedAtCount)||e.acceptedAtCount<0)throw Error('Invalid fact registration');
    }
    if(e.kind==='inference')validateInference(e,ledger);
    if(e.kind==='llm'){const values=Object.fromEntries(e.factIds.map(id=>{const f=ledger.entries().find(f=>f.id===id);return [f.predicate,f.value];}));
      const expectedSource=values.acquisition==='bridge'?`llm:${values.actor}`:values.acquisition==='manual'?'local:llm-registration':`local:llm-transcript:${values.origin||'file'}`;
      if(values.received!==true||typeof values.actor!=='string'||!['bridge','manual','transcript'].includes(values.acquisition)||e.detail.acquisition!==values.acquisition||e.source!==expectedSource||!['request','response','tool-request','tool-result'].includes(values.speech_act)||typeof values.text!=='string')throw Error('Invalid interaction receipt');
    }
    if(e.legacyCompletion!==undefined&&e.legacyCompletion!==true)throw Error('Invalid legacy completion marker');
    if((e.kind==='message'||e.detail.tokens!==undefined)&&(!Array.isArray(e.detail.tokens)||e.detail.tokens.length>128||
      !e.detail.tokens.every(t=>t&&typeof t.word==='string'&&t.word.length<=1000&&integer(t.id)&&t.id>=0&&t.id<88&&['lexicon','orthographic','hash'].includes(t.via))||
      !Array.isArray(e.detail.contentGlyphs)||e.detail.contentGlyphs.length>128||
      !e.detail.contentGlyphs.every(id=>integer(id)&&id>=0&&id<88)||
      (e.kind==='message'&&(typeof e.detail.text!=='string'||e.detail.text.length>1000))))throw Error('Invalid text encounter');
    if(e.detail.contentGlyphs!==undefined&&(!Array.isArray(e.detail.contentGlyphs)||e.detail.contentGlyphs.length>128||
      !e.detail.contentGlyphs.every(id=>integer(id)&&id>=0&&id<88)))throw Error('Invalid content glyphs');
    if(e.detail.semanticPolicy!==undefined&&(e.detail.semanticPolicy!==LANGUAGES.policy||!LANGUAGES.codes.includes(e.detail.language)))throw Error('Invalid lexical provenance');
    if(e.kind==='quake'&&(!integer(e.detail.sourceUpdatedAt)||!Number.isFinite(e.detail.depth)||
      !(e.detail.magnitude===null||Number.isFinite(e.detail.magnitude))))throw Error('Invalid earthquake encounter');
    if(e.kind==='weather'&&![e.detail.temperature_c,e.detail.wind_kmh,e.detail.precipitation_mm].every(Number.isFinite))throw Error('Invalid weather encounter');
  }
  function interactionFrame(packet) {
    if(!packet||typeof packet.actor!=='string'||!packet.actor.trim()||packet.actor.length>128||
      typeof packet.id!=='string'||!/^[a-zA-Z0-9:_-]{1,128}$/.test(packet.id)||
      !['request','response','tool-request','tool-result'].includes(packet.type)||
      typeof packet.text!=='string'||!packet.text.trim()||packet.text.length>1000||!integer(packet.observedAt)||
      (packet.via!==undefined&&!['bridge','manual','transcript'].includes(packet.via))||
      (packet.origin!==undefined&&(typeof packet.origin!=='string'||packet.origin.length>256))||
      (packet.correlationId!==undefined&&(typeof packet.correlationId!=='string'||packet.correlationId.length>256)))throw Error('Invalid LLM interaction');
    const parsed=VOICE.tokenize(packet.text),point=parsed.ids.length?parsed.ids:ids(['AI','speak']),sensory=[0,0];
    for(const g of point){sensory[0]+=Math.cos(g*2.3999632297)/point.length;sensory[1]+=Math.sin(g*2.3999632297)/point.length;}
    const via=packet.via??'bridge',source=via==='bridge'?`llm:${packet.actor}`:via==='manual'?'local:llm-registration':`local:llm-transcript:${packet.origin??'file'}`;
    return {kind:'llm',key:`${fingerprint(packet.actor)}:${packet.id}`,source,observedAt:packet.observedAt,
      title:`${packet.actor} · ${packet.type}: ${packet.text}`,values:{received:true,actor:packet.actor,message_id:packet.id,speech_act:packet.type,text:packet.text,correlation_id:packet.correlationId??'',acquisition:via,origin:packet.origin??''},
      sensory,projection:'Semantic projection of an observed interaction; text remains attributed to its actor',
      glyphs:ids(['AI','speak','now']).concat(parsed.ids),detail:{tokens:parsed.tokens,contentGlyphs:parsed.ids,language:parsed.language,semanticPolicy:parsed.policy,acquisition:via,origin:packet.origin??null}};
  }
  class WorldLab {
    constructor(seed=17) {
      this.model=new BODY.Amos(seed,1,4);this.ledger=new LALO.FactLedger({capacity:CAPACITY});
      this.voice=new VOICE.GlyphVoice(seed,BODY.H);this.queue=[];this.history=[];this.pending=null;
      this.count=0;this.historyOmitted=0;this.serial=0;this.attention='message';
      this.station={latitude:52.52,longitude:13.405};this.lastWeather=null;
      this.relations=new RELATIONS.RelationField();this.mind=new COGNITION.FactMind(BODY.H);this.sonar=new SONAR.SomaticSonar();this.cognitionBirth=0;
      this.transitions=new TRANSITIONS.TransitionMind(BODY.H);this.transitionBirth=0;
    }
    _stage(at) {
      if(!integer(at)||at<latestReceipt(this.ledger))throw Error('Receipt time precedes the accepted world');
      return decode(encode(this.ledger));
    }
    _commit(ledger,events) {
      if(this.queue.length+events.length>MAX_QUEUE)throw Error('Encounter queue full (128); let the pending world reach AMOS first');
      for(const event of events){
        eventValid(event,ledger);event.acceptedAtCount=this.count;
        const id=`amos:registered:${event.id}`;
        ledger.add({id,subject:'agent:amos:registrations',predicate:'registered_event',value:JSON.stringify(COGNITION.registration(event,ledger)),
          source:'amos:registration/v1',validFrom:event.receivedAt,validTo:event.receivedAt+1,recordedAt:event.receivedAt,supersedes:null});
        event.registrationReceipt=id;
      }
      if(ledger.size+ENCOUNTER_RECEIPTS*(this.queue.length+events.length)>CAPACITY)
        throw Error('Journal budget must reserve nine completion receipts for every pending encounter');
      for(const event of events)eventValid(event,ledger);
      const encoded=encode(ledger);
      if(bytes(encoded)+RESERVE_BYTES*(this.queue.length+events.length)>MAX_JOURNAL)throw Error('Journal byte budget must reserve pending encounter receipts');
      this.ledger=ledger;this.queue.push(...events);return events.length;
    }
    // Optional worlds enter through the ordinary fact contract. All projections
    // travel with the receipt, so a saved life can continue without that module.
    ingestWorld(frames,receivedAt,receipts=[]) {
      if(!Array.isArray(frames)||!frames.length||frames.length>32)throw Error('A world batch needs 1–32 encounters');
      const ledger=this._stage(receivedAt),events=[];for(const receipt of receipts)ledger.add(receipt);
      for(const frame of frames){
        if(!frame||!worldKind(frame.kind)||['quake','weather','message'].includes(frame.kind)||
          typeof frame.key!=='string'||!/^[a-zA-Z0-9:_-]{1,160}$/.test(frame.key)||
          typeof frame.source!=='string'||!frame.source||!integer(frame.observedAt)||
          !frame.values||typeof frame.values!=='object'||Array.isArray(frame.values)||
          !Object.keys(frame.values).length||Object.keys(frame.values).length>16||
          !Object.keys(frame.values).every(p=>/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(p)))throw Error('Invalid world receipt');
        const subject=`world:${frame.kind}:${frame.key}`;
        if(unchanged(currentVersion(ledger,subject,frame.source),frame.values,frame.observedAt,frame.observedAt+1))continue;
        const id=`${subject}:r${ledger.size+1}`;
        const all=ledger.entries(),previous=all.filter(f=>f.subject===subject&&f.source===frame.source),replaced=new Set(all.map(f=>f.supersedes)),factIds=[];
        for(const [predicate,value] of Object.entries(frame.values)){
          const old=previous.findLast(f=>f.predicate===predicate&&!replaced.has(f.id));
          const factId=`${id}:${predicate}`;ledger.add({id:factId,subject,predicate,value,source:frame.source,validFrom:frame.observedAt,
            validTo:frame.observedAt+1,recordedAt:receivedAt,supersedes:old?.id??null});factIds.push(factId);
        }
        events.push({id,subject,kind:frame.kind,title:frame.title,source:frame.source,observedAt:frame.observedAt,receivedAt,
          factIds,sensory:clone(frame.sensory),projection:frame.projection,glyphs:clone(frame.glyphs),detail:clone(frame.detail??{})});
      }
      return this._commit(ledger,events);
    }
    ingestQuakes(feed,receivedAt) {
      this._stage(receivedAt);
      const old=new Set(this.ledger.entries().map(f=>f.id));
      const {ledger,summary}=LALO.ingestUSGS(this.ledger,feed,{receivedAt,capacity:CAPACITY,maxBytes:MAX_JOURNAL,maxEvents:64});
      const events=[];
      for(const feature of [...feed.features].sort((a,b)=>a.properties.time-b.properties.time||a.id.localeCompare(b.id))) {
        const p=feature.properties,subject=`usgs:${feature.id}`,id=`${subject}:${p.updated}`;
        if(old.has(`${id}:magnitude`)||!ledger.entries().some(f=>f.id===`${id}:magnitude`))continue;
        const facts=ledger.entries().filter(f=>f.subject===subject&&f.recordedAt===receivedAt&&f.id.startsWith(id+':'));
        const [longitude,latitude,depth]=feature.geometry.coordinates;
        events.push({id,subject,kind:'quake',title:`M ${p.mag===null?'?':p.mag.toFixed(1)} · ${p.place||feature.id}`,
          observedAt:p.time,receivedAt,source:facts[0].source,factIds:facts.map(f=>f.id),
          sensory:[Math.tanh((p.mag??0)/6),Math.tanh(depth/100)],
          projection:'x = tanh(magnitude / 6); y = tanh(depth_km / 100)',
          glyphs:ids(facts[0].supersedes?['earth','stone','change','before','now']:['earth','stone','now']),
          detail:{magnitude:p.mag,depth,longitude,latitude,sourceUpdatedAt:p.updated,revised:!!facts[0].supersedes}});
      }
      const added=this._commit(ledger,events);return {...summary,encounters:added};
    }
    ingestWeather(data,receivedAt,source) {
      const ledger=this._stage(receivedAt),c=data?.current;
      if(!c||!integer(c.time)||!Number.isFinite(c.temperature_2m)||!Number.isFinite(c.wind_speed_10m)||
        !Number.isFinite(c.precipitation)||![0,1].includes(c.is_day)||
        !Number.isFinite(data.latitude)||Math.abs(data.latitude)>90||!Number.isFinite(data.longitude)||Math.abs(data.longitude)>180||
        c.wind_speed_10m<0||c.precipitation<0||!integer(c.interval)||c.interval<1||c.interval>86400||
        data.current_units?.temperature_2m!=='°C'||data.current_units?.wind_speed_10m!=='km/h'||
        data.current_units?.precipitation!=='mm'||typeof source!=='string'||!source.startsWith('https://api.open-meteo.com/v1/forecast?'))throw Error('Invalid Open-Meteo current model sample or units');
      const observedAt=c.time*1000,validTo=observedAt+c.interval*1000;
      if(!integer(observedAt)||!integer(validTo))throw Error('Invalid weather time');
      const subject=`weather:${data.latitude.toFixed(4)}:${data.longitude.toFixed(4)}:${c.time}`;
      const values={temperature_c:c.temperature_2m,wind_kmh:c.wind_speed_10m,precipitation_mm:c.precipitation,is_day:c.is_day,latitude:data.latitude,longitude:data.longitude};
      if(unchanged(currentVersion(ledger,subject,source),values,observedAt,validTo))return 0;
      const id=`${subject}:r${ledger.size+1}`,all=ledger.entries();
      const replaced=new Set(all.map(f=>f.supersedes)),factIds=[];
      for(const [predicate,value] of Object.entries(values)) {
        const previous=all.findLast(f=>f.subject===subject&&f.source===source&&f.predicate===predicate&&!replaced.has(f.id));
        const factId=`${id}:${predicate}`;ledger.add({id:factId,subject,predicate,value,source,
          validFrom:observedAt,validTo,recordedAt:receivedAt,supersedes:previous?.id??null});factIds.push(factId);
      }
      const glyphs=ids(['sky',c.temperature_2m<12?'cold':'light',c.precipitation>0?'water':c.is_day?'light':'dark','now']);
      const e={id,subject,kind:'weather',title:`${c.temperature_2m.toFixed(1)}°C · wind ${c.wind_speed_10m.toFixed(1)} km/h`,observedAt,receivedAt,source,factIds,
        sensory:[Math.tanh(c.temperature_2m/30),-Math.tanh(c.wind_speed_10m/40)],
        projection:'x = tanh(temperature_c / 30); y = −tanh(wind_kmh / 40)',glyphs,
        detail:{...values,interval:c.interval,kind:'Open-Meteo model sample'}};
      const added=this._commit(ledger,[e]);this.lastWeather=e;return added;
    }
    ingestText(text,receivedAt) {
      if(typeof text!=='string'||!text.trim()||text.length>1000)throw Error('Write between 1 and 1000 characters');
      const ledger=this._stage(receivedAt),serial=this.serial+1;
      const subject=`message:${serial}`,id=`${subject}:${receivedAt}`;
      const parsed=VOICE.tokenize(text),glyphs=ids(['you','write','now']).concat(parsed.ids);
      const point=parsed.ids.length?parsed.ids:ids(['you','write']);
      const sensory=[0,0];let total=0;
      point.forEach((g,i)=>{const weight=1+i/Math.max(1,point.length);const angle=g*2.3999632297;
        sensory[0]+=weight*Math.cos(angle);sensory[1]+=weight*Math.sin(angle);total+=weight;});
      sensory[0]/=total;sensory[1]/=total;
      const values={arrived:true,text,projected_glyphs:parsed.ids.map(g=>VOICE.names[g]).join(' ')};
      const factIds=[];
      for(const [predicate,value] of Object.entries(values)){
        const factId=`${id}:${predicate}`;ledger.add({id:factId,subject,predicate,value,source:'local:human',validFrom:receivedAt,validTo:receivedAt+1,recordedAt:receivedAt,supersedes:null});factIds.push(factId);
      }
      const e={id,subject,kind:'message',title:text,observedAt:receivedAt,receivedAt,source:'local:human',factIds,
        sensory,projection:'Order-weighted mean of the 88 glyph basis vectors: (cos(g·2.39996), sin(g·2.39996))',glyphs,
        detail:{text,tokens:parsed.tokens,contentGlyphs:parsed.ids,language:parsed.language,semanticPolicy:parsed.policy}};
      this._commit(ledger,[e]);this.serial=serial;return e;
    }
    ingestInteraction(packet,receivedAt) {
      const frame=interactionFrame(packet);return this.ingestWorld([frame],receivedAt);
    }
    readingQuery(event) {
      if(event.kind==='inference'){
        const query={...event.detail.derivation.query};
        if(event.detail.derivation.question?.knowledge==='current'||!event.detail.derivation.question){delete query.knownAt;delete query.knownThrough;}
        return query;
      }
      const facts=event.factIds.map(id=>this.ledger.entries().find(f=>f.id===id));
      const fact=facts.find(f=>f.predicate==='magnitude'&&(f.value===null||typeof f.value==='number'))??facts.find(f=>typeof f.value==='boolean');
      return fact?{subject:fact.subject,predicate:fact.predicate,validAt:event.observedAt,rule:fact.predicate==='magnitude'?LALO.MAGNITUDE_RULE:LALO.RULE}:null;
    }
    deriveReading(query,receivedAt) {
      const ledger=this._stage(receivedAt),{knownThrough,...input}=query,boundary=knownThrough??ledger.size,known=prefixLedger(ledger,boundary),args={...input,knownAt:query.knownAt??receivedAt,offset:0,limit:64};
      if(!integer(args.knownAt)||args.knownAt>receivedAt)throw Error('Inference cutoff exceeds its receipt time');
      const toolHost=makeHost(known),first=toolHost.call('lalo_reading',args);
      if(!first.ok)throw Error(first.error.message);
      const measured=inference(args,known),all=ledger.entries(),premises=measured.premises.map(id=>all.findIndex(f=>f.id===id));
      if(premises.length>128)throw Error('A registered inference has at most 128 premises');
      const q={subject:args.subject,predicate:args.predicate,rule:args.rule,validAt:args.validAt};
      if(args.rule===LALO.RULE)q.expected=args.expected??true;else q.threshold=args.threshold??3;
      const question={...q,knowledge:query.knownAt===undefined&&knownThrough===undefined?'current':{at:args.knownAt,through:knownThrough??null}},key=`reading:${fingerprint(JSON.stringify(question))}`,old=this.queue.concat(this.history.map(t=>t.event)).find(e=>e.subject===`world:inference:${key}`);
      if(old&&old.detail.derivation&&JSON.stringify({...old.detail.derivation.query,knownAt:undefined,knownThrough:undefined})!==JSON.stringify(q))throw Error('Inference identity collision');
      const parsed=VOICE.tokenize(`${q.subject} ${q.predicate}`),state=measured.state;
      const states={supported:'agree',contradicted:'not',contested:'conflict',unsettled:'seek'};
      const values={state,rule:q.rule,query_subject:q.subject,query_predicate:q.predicate,premise_indices:JSON.stringify(premises)};
      if(q.expected!==undefined)values.expected=q.expected;if(q.threshold!==undefined)values.threshold=q.threshold;
      const evaluation={id:`agent:amos:evaluation:${ledger.size+1}`,subject:`world:inference:${key}`,predicate:'named_evaluation',
        value:JSON.stringify({policy:'amos/named-evaluation-v1',query:{...q,knownAt:args.knownAt,knownThrough:boundary},premises,state}),
        source:'amos:evaluation/v1',validFrom:receivedAt,validTo:receivedAt+1,recordedAt:receivedAt,supersedes:null};
      return this.ingestWorld([{kind:'inference',key,source:'amos:inference/v1',observedAt:q.validAt,
        title:`${q.predicate}: ${state}`,values,
        sensory:[(measured.supporting.length-measured.opposing.length)/Math.max(1,premises.length),(measured.unknown?.length??0)/Math.max(1,premises.length)],
        projection:'Named LALO reading: signed support fraction and explicit unknown fraction',
        glyphs:ids(['think','know',states[state]]).concat(parsed.ids.slice(0,125)),
        detail:{derivation:{query:{...q,knownAt:args.knownAt,knownThrough:boundary},question,premises,evaluationReceipt:evaluation.id},contentGlyphs:parsed.ids}}],receivedAt,[evaluation]);
    }
    previewSelection(preferredId) {
      return this.mind.rank(this.queue,this.voice,this.ledger,this.attention,this.count,preferredId,this.sonar.coefficients());
    }
    nextIndex(preferredId) {return this.previewSelection(preferredId)?.selected.index??0;}
    encounter(at,preferredId) {
      if(!this.queue.length)return null;
      const selection=this.previewSelection(preferredId),index=selection.selected.index,event=this.queue[index];
      const receiptAt=Math.max(at,latestReceipt(this.ledger)),ledger=this._stage(receiptAt),knownAt=receiptAt;
      const model=this.model.clone(),s=model.subject,voice=VOICE.GlyphVoice.load(clone(this.voice.dump()));
      const mind=COGNITION.FactMind.load(this.mind.dump(),BODY.H),sonar=SONAR.SomaticSonar.load(this.sonar.dump());
      const transitionMind=TRANSITIONS.TransitionMind.load(this.transitions.dump(),BODY.H),investigation=transitionMind.plan(ledger,knownAt),transitionRecords=[];
      selection.investigation=investigation?clone(investigation):null;
      const sourceIndices=event.factIds.map(id=>ledger.entries().findIndex(f=>f.id===id));
      const relationField=RELATIONS.RelationField.load(this.relations.dump(),ledger);
      const associations=COGNITION.link(event,this.history,voice,ledger),relations=relationField.observe(event,ledger),content=event.detail.contentGlyphs??event.glyphs,resonance=voice.resonance(content);
      if(!Number.isFinite(resonance)||resonance<0||resonance>1)throw Error('Invalid prior resonance');
      const contextual=relations.sensory.map((v,i)=>bounded(v+.12*associations.sensory[i],-1,1));
      const priorGap=this.pending?magnitude(contextual.map((v,k)=>v-this.pending.predicted[k])):0;
      const sonarBefore=sonar.act.slice(),inhaled=sonar.inhale(event.glyphs,{surprise:priorGap,resonance:(resonance+associations.strength)/2,unmatched:associations.unmatched.length/Math.max(1,associations.incoming.length),
        familiarity:relations.familiarity,revision:event.factIds.some(id=>ledger.entries().find(f=>f.id===id).supersedes!==null)?1:0,selfError:mind.lastError});
      const controls=sonar.coefficients(),resonanceGain=.94+.12*resonance;
      const sensory=contextual.map(v=>bounded(v*resonanceGain*controls.perception,-1,1));
      const before=s.h.slice(),oldLoad=model.world.load;
      const trajectory=[{name:'before',h:before.slice()}];
      const errorBefore=this.pending?magnitude(sensory.map((v,k)=>v-this.pending.predicted[k])):0;
      const load=bounded(.85*oldLoad+.15*errorBefore+.005*Math.abs(this.pending?.action||0),0,1);
      const o=[...sensory,load],tick=this.count+1;
      let completed=null;
      if(this.pending) {
        const p=this.pending,delta=o.map((v,k)=>v-p.observation[k]);
        s.regress(p.features,delta,controls.plasticity);s.body.learn(p.observation,o);s.glyph.learn(p.sequence,p.action,delta);
        completed={tick,observation:p.observation,next:o,action:p.action,predicted:p.predicted,influence:p.influence,
          features:p.features,sequence:p.sequence,recognition:p.recognition};
        model.memory.push(completed);if(model.memory.length>128)model.memory.shift();
      }
      const worldTransition=transitionMind.forecast('world',before,o,s.previous_action,associations.strength);
      s.glyph.learning=1;s.observe(o);
      const worldAfter=s.h.slice(),action=s.action(0,controls.exploration),toolHost=makeHost(ledger);
      trajectory.push({name:'world',h:worldAfter.slice()});
      transitionRecords.push(transitionMind.learn(worldTransition,worldAfter,[...new Set(sourceIndices.concat(associations.evidence.map(e=>e[1])))]));
      const scope=mind.readScope(action),selfFact=scope==='self'?ledger.entries().find(f=>f.id===mind.lastSelf):null;
      const tool=investigation?.tool??(action<0?'lalo_history':action>0?'lalo_lineage':'lalo_facts');
      const args=investigation?.arguments??(selfFact?{subject:selfFact.subject,knownAt,limit:32}:
        action<0?{subject:event.subject,knownAt,limit:32}:action>0?{id:event.factIds[0],knownAt,limit:32}
        :{subject:event.subject,validAt:event.observedAt,knownAt,limit:32});
      const selfForecast=mind.forecast(worldAfter,action,load,resonance,relations.familiarity,errorBefore);
      const toolResult=toolHost.call(tool,args);
      if(!toolResult.ok)throw Error(toolResult.error.message);
      const reading=PERCEPTION.read(toolResult,ledger,tool,args,ledger.size);
      const readObservation=[...o.slice(0,2).map((v,i)=>bounded(v+.15*reading.sensory[i]*controls.recall,-1,1)),load];
      const readTransition=transitionMind.forecast('read',worldAfter,readObservation,action,reading.premises.length/32);
      s.previous_action=action;const readTwin=copySubject(s);readTwin.observe(o);s.observe(readObservation);
      const readAfter=s.h.slice(),passes=[],evidenceGlyphs=tool==='lalo_history'?ids(['before','remember']):tool==='lalo_lineage'?ids(['cause','change']):ids(['see','now']);
      trajectory.push({name:'read',h:readAfter.slice()});
      transitionRecords.push(transitionMind.learn(readTransition,readAfter,reading.premises,{observation:o,after:readTwin.h,steps:1}));
      const returnTransition=transitionMind.forecast('return',readAfter,readObservation,action,sonar.gate()),returnTwin=copySubject(s);
      let finalObservation=readObservation.slice(),previousGate=sonar.gate();
      for(let depth=1;depth<=4;depth++){
        const draftVoice=VOICE.GlyphVoice.load(clone(voice.dump())),mix=s.glyph.sequence.slice(-8),c=sonar.coefficients();
        draftVoice.ingest(event.glyphs,s.h,mix,c.plasticity);draftVoice.ingest(evidenceGlyphs,s.h,mix,c.plasticity);draftVoice.ingest(reading.glyphs,s.h,mix,c.plasticity);
        const draft=draftVoice.express(s.h,mix,errorBefore,c.temperature),meta=sonar.reinhale(VOICE.tokenize(draft.words.join(' ')).ids);
        const hBefore=s.h.slice();finalObservation=[...readObservation.slice(0,2).map((v,i)=>bounded(v+.1*meta.projection[i],-1,1)),load];
        s.observe(finalObservation);
        returnTwin.observe(readObservation);trajectory.push({name:'return-'+depth,h:s.h.slice()});
        passes.push({depth,draft:draft.ids,after:meta.after,gate:meta.gate,observation:finalObservation.slice(),shift:magnitude(s.h.map((v,i)=>v-hBefore[i]))});
        if(Math.abs(meta.gate-previousGate)<.005)break;previousGate=meta.gate;
      }
      transitionRecords.push(transitionMind.learn(returnTransition,s.h,reading.premises,{observation:readObservation,after:returnTwin.h,steps:passes.length}));
      const selfObserved=COGNITION.measure(worldAfter,s.h,o,finalObservation),selfError=mind.learn(selfForecast,selfObserved,event,errorBefore);
      sonar.settle(inhaled);
      const finalControls=sonar.coefficients(),mixture=s.glyph.sequence.slice(-8),recognition=s.glyph.predict(0)[1];
      voice.ingest(event.glyphs,s.h,mixture,finalControls.plasticity);voice.ingest(evidenceGlyphs,s.h,mixture,finalControls.plasticity);
      voice.ingest(reading.glyphs,s.h,mixture,finalControls.plasticity);
      const utterance=voice.express(s.h,mixture,errorBefore,finalControls.temperature);
      const changed=s.h.map((v,i)=>({i,before:before[i],after:v,delta:v-before[i]})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
      const expected=s.predict(action),features=s.features(action),influence=s.influence(),predictedRecognition=s.glyph.predict(action)[1];
      const pending={observation:finalObservation.slice(),action,predicted:expected,features,sequence:s.glyph.sequence.slice(),recognition:predictedRecognition,influence};
      const attention=action<0?'quake':action>0?'weather':'message';
      model.world.pos=finalObservation.slice(0,2);model.world.load=load;model.world.tick=tick;
      const encounterSubject=`agent:amos:encounter:${tick}`,all=ledger.entries(),rawPremises=event.factIds.map(id=>all.findIndex(f=>f.id===id));
      const selfReflection={policy:'amos/self-sonar-v1',forecast:selfForecast,observed:selfObserved,error:selfError,
        before:sonarBefore,after:sonar.act.slice(),controls,passes,scope:investigation?.scope??(selfFact?'self':'world'),registrationPremise:all.findIndex(f=>f.id===event.registrationReceipt),sourcePremises:rawPremises,associationPremise:all.length+4};
      const additions=[{id:`agent:amos:attention:${tick}`,subject:encounterSubject,predicate:'attention_subject',value:event.subject,
        source:'amos:encounter',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null},
      {id:`agent:amos:relations:${tick}`,subject:encounterSubject,predicate:'encounter_relations',value:JSON.stringify(relations),
        source:'amos:relations/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null},
      {id:`agent:amos:read:${tick}`,subject:encounterSubject,predicate:'tool_reading',value:JSON.stringify(reading),
        source:'amos:tool-read/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null},
      {id:`agent:amos:selection:${tick}`,subject:encounterSubject,predicate:'fact_selection',value:JSON.stringify(selection),
        source:'amos:attention/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null},
      {id:`agent:amos:links:${tick}`,subject:encounterSubject,predicate:'encounter_links',value:JSON.stringify(associations),
        source:'amos:links/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null},
      {id:`agent:amos:self:${tick}`,subject:encounterSubject,predicate:'self_reflection',value:JSON.stringify(selfReflection),
        source:'amos:self/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null}];
      for(const record of transitionRecords)additions.push({id:`agent:amos:transition:${tick}:${record.phase}`,subject:encounterSubject,predicate:`transition_${record.phase}`,
        value:JSON.stringify(record),source:'amos:transition/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null});
      let transitionReceipts=additions.slice(6).map(f=>f.id);
      let completedLedger=ledger,relationReceipt=additions[1].id,readReceipt=additions[2].id,selectionReceipt=additions[3].id,linkReceipt=additions[4].id,selfReceipt=additions[5].id,receiptState='journal';
      try{const candidate=decode(encode(ledger));for(const f of additions)candidate.add(f);encode(candidate);completedLedger=candidate;mind.lastSelf=selfReceipt;}
      catch(error){
        const budget=/capacity|byte budget/.test(error.message);
        if(!event.legacyCompletion||!budget)throw error;
        relationReceipt=null;readReceipt=null;selectionReceipt=null;linkReceipt=null;selfReceipt=null;receiptState='legacy-full-journal';
        transitionReceipts=[null,null,null];
      }
      if(receiptState==='journal')transitionMind.remember(transitionRecords,transitionReceipts,tick,completedLedger,investigation);
      else{transitionMind.last=[];if(investigation)transitionMind.lastProbe=transitionMind.heads.world.updates;}
      const trace={tick,policy:'amos/reflective-facts-v2',encounterAt:receiptAt,event:clone(event),before,worldAfter,readAfter,after:s.h.slice(),changed:changed.slice(0,6),mixture,
        relations,relationReceipt,readReceipt,selectionReceipt,linkReceipt,selfReceipt,receiptState,reading,associations,readObservation,finalObservation,resonanceGain,
        selection,selfReflection,transitions:transitionRecords,transitionReceipts,trajectory,investigation,prototypeCount:s.glyph.prototypes.length,symbolCount:voice.symbols.length,
        load,surprise:errorBefore,resonance,recognition:clone(recognition),action,nextAttention:attention,
        tool:{name:tool,arguments:args,result:toolResult},utterance,
        previousForecast:completed?.predicted??null,observed:o,prediction:expected,resolvedFromTick:completed?tick-1:null};
      this.queue.splice(index,1);this.ledger=completedLedger;this.relations=relationField;this.model=model;this.voice=voice;this.mind=mind;this.sonar=sonar;
      this.transitions=transitionMind;
      this.pending=pending;this.attention=attention;this.count=tick;this.history.push(trace);
      if(this.history.length>MAX_HISTORY){this.history.shift();this.historyOmitted++;}
      return trace;
    }
    dump() {
      const text=JSON.stringify({format:'amos-2/world',version:6,semanticPolicy:LANGUAGES.policy,model:this.model.dumps(),journal:encode(this.ledger),voice:this.voice.dump(),
        queue:this.queue,history:this.history,pending:this.pending,count:this.count,serial:this.serial,historyOmitted:this.historyOmitted,
        attention:this.attention,station:this.station,lastWeather:this.lastWeather,relations:this.relations.dump(),mind:this.mind.dump(),sonar:this.sonar.dump(),cognitionBirth:this.cognitionBirth,
        transitions:this.transitions.dump(),transitionBirth:this.transitionBirth,reservedReceiptSlots:ENCOUNTER_RECEIPTS});
      if(bytes(text)>MAX_SNAPSHOT)throw Error('Complete life exceeds the 24 MB snapshot budget');return text;
    }
    static load(text) {
      if(typeof text!=='string'||bytes(text)>MAX_SNAPSHOT)throw Error('Snapshot exceeds 24 MB');
      const d=JSON.parse(text);
      if(d?.format!=='amos-2/world'||![1,2,3,4,5,6].includes(d.version))throw Error('Unsupported AMOS 2 life');
      if(d.version>=5&&d.semanticPolicy!==LANGUAGES.policy)throw Error('Unsupported semantic membrane');
      if(d.version>=2&&(!d.relations||![2,3,5,6,9].includes(d.reservedReceiptSlots)))throw Error('Missing acquired relation organ or completion reserve');
      if(d.version>=4&&![5,6,9].includes(d.reservedReceiptSlots))throw Error('Missing tool-read completion reserve');
      if(d.version===6&&d.reservedReceiptSlots!==9)throw Error('Missing transition completion reserve');
      const width=JSON.parse(d.model)?.amos?.subject?.h?.length;
      if(d.version>=4&&width!==BODY.H)throw Error('Invalid current neural width');
      if(d.voice?.neural?.[0]?.length!==width)throw Error('Voice and body neural widths disagree');
      const life=new WorldLab();life.model=growModel(d.model);life.ledger=decode(d.journal);
      life.voice=VOICE.GlyphVoice.load(d.voice).grow(BODY.H);
      for(const f of life.ledger.entries())if(f.source==='amos:evaluation/v1')validateEvaluation(f,life.ledger);
      if(width!==BODY.H&&d.pending?.features?.length===2*width+6)d.pending.features=growFeatures(d.pending.features,width);
      if(d.version<3&&Array.isArray(d.relations?.recent))for(const c of d.relations.recent){
        if(c.source===undefined)c.source=d.history?.find(t=>t.event.id===c.id)?.event.source;
      }
      life.relations=d.relations?RELATIONS.RelationField.load(d.relations,life.ledger):new RELATIONS.RelationField();
      if(!integer(d.count)||d.count<0||d.count!==life.model.world.tick||!integer(d.serial)||d.serial<0||
        !integer(d.historyOmitted)||d.historyOmitted<0||!['quake','weather','message'].includes(d.attention)||
        !Array.isArray(d.queue)||d.queue.length>MAX_QUEUE||new Set(d.queue.map(e=>e.id)).size!==d.queue.length||
        !Array.isArray(d.history)||d.history.length>MAX_HISTORY||d.history.length+d.historyOmitted!==d.count||
        !d.station||!Number.isFinite(d.station.latitude)||Math.abs(d.station.latitude)>90||!Number.isFinite(d.station.longitude)||Math.abs(d.station.longitude)>180)throw Error('Invalid life history');
      for(const event of d.queue)eventValid(event,life.ledger);
      let tick=d.historyOmitted;
      if(d.reservedReceiptSlots!==undefined&&![2,3,5,6,9].includes(d.reservedReceiptSlots))throw Error('Unsupported encounter reserve');
      const needsLegacyCompletion=d.reservedReceiptSlots!==ENCOUNTER_RECEIPTS&&
        (life.ledger.size+ENCOUNTER_RECEIPTS*d.queue.length>CAPACITY||bytes(d.journal)+RESERVE_BYTES*d.queue.length>MAX_JOURNAL);
      if(needsLegacyCompletion)for(const event of d.queue)event.legacyCompletion=true;
      if(d.queue.some(e=>!e.legacyCompletion)&&(life.ledger.size+ENCOUNTER_RECEIPTS*d.queue.length>CAPACITY||bytes(d.journal)+RESERVE_BYTES*d.queue.length>MAX_JOURNAL))throw Error('Pending encounters have no completion reserve');
      for(const t of d.history) {
        eventValid(t.event,life.ledger);
        if(t.relations){const receipt=life.ledger.entries().find(f=>f.id===t.relationReceipt);
          const legacy=t.receiptState==='legacy-full-journal'&&t.event.legacyCompletion===true&&t.relationReceipt===null;
          if((!legacy&&(!receipt||receipt.source!=='amos:relations/v1'||receipt.value!==JSON.stringify(t.relations)))||
            !Array.isArray(t.relations.evidence)||!t.relations.evidence.every(id=>life.ledger.entries().some(f=>f.id===id&&f.recordedAt<=(receipt?.recordedAt??latestReceipt(life.ledger)))))throw Error('Invalid relation evidence');}
        if(t.tick!==++tick||!finiteArray(t.before,t.after?.length)||![24,28,40].includes(t.after?.length)||!finiteArray(t.after,t.before?.length)||!finiteArray(t.observed,3)||
          !finiteArray(t.mixture,8)||!finiteArray(t.prediction,3)||!Number.isFinite(t.surprise)||!Number.isFinite(t.load)||
          !Number.isFinite(t.resonance)||t.load<0||t.load>1||t.resonance<0||t.resonance>1||
          !Array.isArray(t.changed)||t.changed.length>6||!t.changed.every(n=>n&&integer(n.i)&&n.i>=0&&n.i<t.after.length&&[n.before,n.after,n.delta].every(Number.isFinite))||
          !t.recognition||!['similarity','support','uncertainty','ignorance','noise'].every(k=>Number.isFinite(t.recognition[k])&&t.recognition[k]>=0)||
          !t.tool?.result?.ok||!['lalo_facts','lalo_history','lalo_lineage'].includes(t.tool.name)||!Array.isArray(t.tool.result.data?.items)||
          !Array.isArray(t.utterance?.ids)||t.utterance.ids.length!==5||
          !t.utterance.ids.every(id=>integer(id)&&id>=0&&id<88+life.voice.symbols.length)||
          !Array.isArray(t.utterance.contributions)||t.utterance.contributions.length!==5||
          !t.utterance.contributions.every(c=>c&&integer(c.id)&&c.id>=0&&c.id<88+life.voice.symbols.length&&[c.association,c.recognition,c.succession].every(Number.isFinite))||
          !['quake','weather','message'].includes(t.nextAttention)||![-1,0,1].includes(t.action)||
          (t.prototypeCount!==undefined&&(!integer(t.prototypeCount)||t.prototypeCount<1||t.prototypeCount>8))||
          (t.symbolCount!==undefined&&(!integer(t.symbolCount)||t.symbolCount<0||t.symbolCount>64)))throw Error('Invalid encounter history');
        const born=t.utterance.born;
        if(born&&(!integer(born.id)||born.id<88||born.id>=88+life.voice.symbols.length||!integer(born.support)||born.support<14||typeof born.name!=='string'))throw Error('Invalid symbol birth');
      }
      for(const t of d.history)if(['amos/world-read-v1','amos/reflective-facts-v1','amos/reflective-facts-v2'].includes(t.policy)){
        const receipt=life.ledger.entries().find(f=>f.id===t.readReceipt);
        const legacy=t.receiptState==='legacy-full-journal'&&t.event.legacyCompletion===true&&t.readReceipt===null;
        if(!finiteArray(t.worldAfter,t.after.length)||!finiteArray(t.readObservation,3)||t.resonanceGain!==.94+.12*t.resonance||
          !['amos/read-indices-v1','amos/read-indices-v2'].includes(t.reading?.policy)||
          !sameReading(PERCEPTION.read(t.tool.result,life.ledger,t.tool.name,t.tool.arguments,t.reading?.knownThrough,t.reading?.policy==='amos/read-indices-v1'?1:2),t.reading)||
          (!legacy&&(!receipt||receipt.source!=='amos:tool-read/v1'||receipt.value!==JSON.stringify(t.reading))))throw Error('Invalid acquired tool reading');
      }
      if(d.version>=4){
        life.mind=COGNITION.FactMind.load(d.mind,BODY.H);life.sonar=SONAR.SomaticSonar.load(d.sonar);life.cognitionBirth=d.cognitionBirth;
        if(!integer(life.cognitionBirth)||life.cognitionBirth<0||life.mind.updates!==d.count-life.cognitionBirth||life.sonar.turns!==life.mind.updates||
          (life.mind.lastSelf!==null&&!life.ledger.entries().some(f=>f.id===life.mind.lastSelf&&f.source==='amos:self/v1')))throw Error('Self history disagrees with this life');
      }else life.cognitionBirth=d.count;
      for(const t of d.history)if(['amos/reflective-facts-v1','amos/reflective-facts-v2'].includes(t.policy))validateReflection(t,life.ledger);
      for(const t of d.history)if(t.transitions)TRANSITIONS.validate(t,life.ledger,BODY.H,d.version===6?d.transitionBirth:undefined);
      if(d.version===6){life.transitions=TRANSITIONS.TransitionMind.load(d.transitions,BODY.H);life.transitionBirth=d.transitionBirth;
        if(!integer(life.transitionBirth)||life.transitionBirth<0||!TRANSITIONS.phases.every(p=>life.transitions.heads[p].updates===d.count-life.transitionBirth)||
          d.history.some(t=>t.tick>life.transitionBirth&&!t.transitions)||
          !life.transitions.last.every(r=>{const f=life.ledger.entries()[r.premise],record=f&&JSON.parse(f.value);return f&&r.tick===d.count&&f.id===r.id&&f.subject===`agent:amos:encounter:${r.tick}`&&f.source==='amos:transition/v1'&&record.phase===r.phase&&record.error===r.error&&(record.premises[0]??null)===r.sourcePremise;}))throw Error('Transition learning disagrees with this life');
      }else life.transitionBirth=d.count;
      if(d.pending&&(!finiteArray(d.pending.observation,3)||!finiteArray(d.pending.predicted,3)||!finiteArray(d.pending.features,BODY.F)||
        !finiteArray(d.pending.sequence,32)||!finiteArray(d.pending.influence,2)||![-1,0,1].includes(d.pending.action)||
        !d.pending.recognition||!Object.values(d.pending.recognition).every(v=>Number.isFinite(v)&&v>=0)))throw Error('Invalid pending forecast');
      if(!!d.pending!==(d.count>0))throw Error('Missing pending forecast');
      if(life.model.subject.updates!==Math.max(0,d.count-1)||life.voice.utterances!==d.count)throw Error('Acquired state and biography disagree');
      if(life.relations.seen>d.count)throw Error('Relation history exceeds this life');
      for(const c of life.relations.recent){const t=d.history.find(t=>t.event.id===c.id);
        const expected=t?RELATIONS.context(t.event,life.ledger):null;
        if(!expected||Object.keys(c).length!==Object.keys(expected).length||Object.keys(expected).some(k=>JSON.stringify(c[k])!==JSON.stringify(expected[k])))throw Error('Relation context differs from its source receipts');}
      if(d.lastWeather){eventValid(d.lastWeather,life.ledger);if(d.lastWeather.kind!=='weather')throw Error('Invalid last weather sample');}
      Object.assign(life,{queue:d.queue,history:d.history,pending:d.pending,count:d.count,serial:d.serial,historyOmitted:d.historyOmitted,
        attention:d.attention,station:d.station,lastWeather:d.lastWeather});return life;
    }
  }
  async function fetchJSON(url,{signal,maxBytes=1_000_000}={}) {
    const response=await fetch(url,{signal,credentials:'omit',referrerPolicy:'no-referrer'});
    if(!response.ok)throw Error(`Source returned HTTP ${response.status}`);
    const reader=response.body?.getReader();let text='';
    if(reader){const chunks=[];let total=0;for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;
      if(total>maxBytes){await reader.cancel();throw Error('Source exceeds the 1 MB input budget');}chunks.push(value);}
      const buffer=new Uint8Array(total);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length;}text=new TextDecoder().decode(buffer);
    }else{text=await response.text();if(bytes(text)>maxBytes)throw Error('Source exceeds input budget');}
    return JSON.parse(text);
  }
  function compareLives(kept,current,text,at) {
    const a=WorldLab.load(kept),b=WorldLab.load(current);
    if(a.model.birth!==b.model.birth)throw Error('Choose two histories from the same birth for this experiment');
    const before=[a.count,b.count];
    const ea=a.ingestText(text,at),eb=b.ingestText(text,at);
    const left=a.encounter(at,ea.id),right=b.encounter(at,eb.id);
    return {before,left,right,activationGap:magnitude(left.after.map((v,i)=>v-right.after[i])),
      forecastGap:magnitude(left.prediction.map((v,i)=>v-right.prediction[i]))};
  }
  return {WorldLab,compareLives,fetchJSON,CAPACITY,MAX_QUEUE,MAX_HISTORY,MAX_SNAPSHOT,ENCOUNTER_RECEIPTS,MAX_JOURNAL,interactionFrame,WIDTH:BODY.H,FEATURES:BODY.F,magnitude};
})();
