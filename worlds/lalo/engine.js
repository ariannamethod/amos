/* LALO → AMOS → expression. Portable, event-driven; clocks enter explicitly.
 * The AMOS Subject is the existing JS body, with its own predictor and RNG.
 * No presentation frame, fetch failure or repeated feed advances this life. */
const AMOS2 = (() => {
  'use strict';
  const CAPACITY=1024, MAX_QUEUE=128, MAX_HISTORY=128, MAX_SNAPSHOT=8_000_000, ENCOUNTER_RECEIPTS=3;
  const bounded=(n,a,b)=>Math.max(a,Math.min(b,n));
  const clone=value=>JSON.parse(JSON.stringify(value));
  const magnitude=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/Math.max(1,a.length));
  const integer=n=>Number.isSafeInteger(n);
  const bytes=s=>new TextEncoder().encode(s).length;
  const finiteArray=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e12);
  const BODY=AMOS.withWidth(28);
  const featureMap=i=>i<29?i:i<53?i+4:61;
  const growFeatures=a=>{const next=Array(BODY.F).fill(0);a.forEach((v,i)=>next[featureMap(i)]=v);return next;};
  function growModel(text) {
    const old=AMOS.Amos.loads(text);if(old.subject.h.length===BODY.H)return old;
    const d=JSON.parse(old.dumps()),a=d.amos,s=a.subject;
    const fresh=JSON.parse(new BODY.Amos(BigInt('0x'+a.seed),a.world.kind,s.glyph.enabled,s.mode).dumps()).amos.subject;
    const weights=Array.from({length:3},(_,k)=>growFeatures(s.weights[k]));
    const covariance=Array.from({length:BODY.F},(_,i)=>Array.from({length:BODY.F},(_,j)=>i===j?100:0));
    for(let i=0;i<54;i++)for(let j=0;j<54;j++)covariance[featureMap(i)][featureMap(j)]=s.covariance[i][j];
    s.h=s.h.concat([0,0,0,0]);s.win=s.win.concat(fresh.win.slice(24));
    s.recurrent=s.recurrent.map(row=>row.concat([0,0,0,0])).concat(fresh.recurrent.slice(24));
    s.weights=weights;s.covariance=covariance;s.glyph.prototypes=s.glyph.prototypes.map(row=>row.concat([0,0,0,0]));
    a.memory=a.memory.map(t=>({...t,features:growFeatures(t.features)}));
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
    if(e.legacyCompletion!==undefined&&e.legacyCompletion!==true)throw Error('Invalid legacy completion marker');
    if((e.kind==='message'||e.detail.tokens!==undefined)&&(!Array.isArray(e.detail.tokens)||e.detail.tokens.length>128||
      !e.detail.tokens.every(t=>t&&typeof t.word==='string'&&t.word.length<=1000&&integer(t.id)&&t.id>=0&&t.id<88&&['lexicon','orthographic','hash'].includes(t.via))||
      !Array.isArray(e.detail.contentGlyphs)||e.detail.contentGlyphs.length>128||
      !e.detail.contentGlyphs.every(id=>integer(id)&&id>=0&&id<88)||
      (e.kind==='message'&&(typeof e.detail.text!=='string'||e.detail.text.length>1000))))throw Error('Invalid text encounter');
    if(e.detail.contentGlyphs!==undefined&&(!Array.isArray(e.detail.contentGlyphs)||e.detail.contentGlyphs.length>128||
      !e.detail.contentGlyphs.every(id=>integer(id)&&id>=0&&id<88)))throw Error('Invalid content glyphs');
    if(e.kind==='quake'&&(!integer(e.detail.sourceUpdatedAt)||!Number.isFinite(e.detail.depth)||
      !(e.detail.magnitude===null||Number.isFinite(e.detail.magnitude))))throw Error('Invalid earthquake encounter');
    if(e.kind==='weather'&&![e.detail.temperature_c,e.detail.wind_kmh,e.detail.precipitation_mm].every(Number.isFinite))throw Error('Invalid weather encounter');
  }
  class WorldLab {
    constructor(seed=17) {
      this.model=new BODY.Amos(seed,1,4);this.ledger=new LALO.FactLedger({capacity:CAPACITY});
      this.voice=new VOICE.GlyphVoice(seed,BODY.H);this.queue=[];this.history=[];this.pending=null;
      this.count=0;this.historyOmitted=0;this.serial=0;this.attention='message';
      this.station={latitude:52.52,longitude:13.405};this.lastWeather=null;
      this.relations=new RELATIONS.RelationField();
    }
    _stage(at) {
      if(!integer(at)||at<latestReceipt(this.ledger))throw Error('Receipt time precedes the accepted world');
      return LALO.decodeJournal(LALO.encodeJournal(this.ledger),{capacity:CAPACITY});
    }
    _commit(ledger,events) {
      if(this.queue.length+events.length>MAX_QUEUE)throw Error('Encounter queue full (128); let the pending world reach AMOS first');
      if(ledger.size+ENCOUNTER_RECEIPTS*(this.queue.length+events.length)>CAPACITY)
        throw Error('Journal budget must reserve attention, relation and read receipts for every pending encounter');
      for(const event of events)eventValid(event,ledger);
      const encoded=LALO.encodeJournal(ledger);
      if(bytes(encoded)+20000*(this.queue.length+events.length)>2_000_000)throw Error('Journal byte budget must reserve pending encounter receipts');
      this.ledger=ledger;this.queue.push(...events);return events.length;
    }
    // Optional worlds enter through the ordinary fact contract. All projections
    // travel with the receipt, so a saved life can continue without that module.
    ingestWorld(frames,receivedAt) {
      if(!Array.isArray(frames)||!frames.length||frames.length>32)throw Error('A world batch needs 1–32 encounters');
      const ledger=this._stage(receivedAt),events=[];
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
      const {ledger,summary}=LALO.ingestUSGS(this.ledger,feed,{receivedAt,capacity:CAPACITY,maxEvents:64});
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
        detail:{text,tokens:parsed.tokens,contentGlyphs:parsed.ids}};
      this._commit(ledger,[e]);this.serial=serial;return e;
    }
    nextIndex(preferredId) {
      if(preferredId){const i=this.queue.findIndex(e=>e.id===preferredId);if(i>=0)return i;}
      const i=this.queue.findIndex(e=>e.kind===this.attention);return i>=0?i:0;
    }
    encounter(at,preferredId) {
      if(!this.queue.length)return null;
      const index=this.nextIndex(preferredId),event=this.queue[index];
      const ledger=this._stage(Math.max(at,latestReceipt(this.ledger))),knownAt=event.receivedAt;
      // Work on detached organs. A failed tool, receipt or budget commits no learning.
      const model=this.model.clone(),s=model.subject,voice=VOICE.GlyphVoice.load(clone(this.voice.dump()));
      const relationField=RELATIONS.RelationField.load(this.relations.dump(),ledger);
      const relations=relationField.observe(event,ledger);
      const content=event.detail.contentGlyphs??event.glyphs,resonance=voice.resonance(content);
      if(!Number.isFinite(resonance)||resonance<0||resonance>1)throw Error('Invalid prior resonance');
      const resonanceGain=.94+.12*resonance;
      const sensory=relations.sensory.map(v=>bounded(v*resonanceGain,-1,1));
      const before=s.h.slice(),oldLoad=model.world.load;
      const errorBefore=this.pending?magnitude(sensory.map((v,k)=>v-this.pending.predicted[k])):0;
      const load=bounded(.85*oldLoad+.15*errorBefore+.005*Math.abs(this.pending?.action||0),0,1);
      const o=[...sensory,load],tick=this.count+1;
      let completed=null;
      if(this.pending) {
        const p=this.pending,delta=o.map((v,k)=>v-p.observation[k]);
        s.regress(p.features,delta);s.body.learn(p.observation,o);s.glyph.learn(p.sequence,p.action,delta);
        completed={tick,observation:p.observation,next:o,action:p.action,predicted:p.predicted,influence:p.influence,
          features:p.features,sequence:p.sequence,recognition:p.recognition};
        model.memory.push(completed);if(model.memory.length>128)model.memory.shift();
      }
      s.glyph.learning=1;s.observe(o);
      const worldAfter=s.h.slice(),action=s.action(0,.22),host=LALO.createToolHost(ledger);
      const tool=action<0?'lalo_history':action>0?'lalo_lineage':'lalo_facts';
      const args=action<0?{subject:event.subject,knownAt,limit:32}:action>0?{id:event.factIds[0],knownAt,limit:32}
        :{subject:event.subject,validAt:event.observedAt,knownAt,limit:32};
      const toolResult=host.call(tool,args);
      if(!toolResult.ok)throw Error(toolResult.error.message);
      const reading=PERCEPTION.read(toolResult,ledger,tool,args);
      const readObservation=[...o.slice(0,2).map((v,i)=>bounded(v+.15*reading.sensory[i],-1,1)),load];
      // A second, explicit neural phase is the consequence of this chosen read.
      // Its returned premises, rather than only its name, enter acquired state.
      s.previous_action=action;s.observe(readObservation);
      const mixture=s.glyph.sequence.slice(-8),recognition=s.glyph.predict(0)[1];
      const changed=s.h.map((v,i)=>({i,before:before[i],after:v,delta:v-before[i]})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
      voice.ingest(event.glyphs,s.h,mixture);
      const evidenceGlyphs=tool==='lalo_history'?ids(['before','remember']):tool==='lalo_lineage'?ids(['cause','change']):ids(['see','now']);
      voice.ingest(evidenceGlyphs,s.h,mixture);
      voice.ingest(reading.glyphs,s.h,mixture);
      const utterance=voice.express(s.h,mixture,errorBefore);
      const expected=s.predict(action),features=s.features(action),influence=s.influence();
      const predictedRecognition=s.glyph.predict(action)[1];
      const pending={observation:readObservation.slice(),action,predicted:expected,features,sequence:s.glyph.sequence.slice(),recognition:predictedRecognition,influence};
      const attention=action<0?'quake':action>0?'weather':'message';
      model.world.pos=readObservation.slice(0,2);model.world.load=load;model.world.tick=tick;
      const receiptAt=Math.max(at,latestReceipt(ledger)),encounterSubject=`agent:amos:encounter:${tick}`;
      const additions=[{id:`agent:amos:attention:${tick}`,subject:encounterSubject,predicate:'attention_subject',value:event.subject,
        source:'amos:encounter',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null},
      {id:`agent:amos:relations:${tick}`,subject:encounterSubject,predicate:'encounter_relations',value:JSON.stringify(relations),
        source:'amos:relations/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null},
      {id:`agent:amos:read:${tick}`,subject:encounterSubject,predicate:'tool_reading',value:JSON.stringify(reading),
        source:'amos:tool-read/v1',validFrom:receiptAt,validTo:receiptAt+1,recordedAt:receiptAt,supersedes:null}];
      let completedLedger=ledger,relationReceipt=additions[1].id,readReceipt=additions[2].id,receiptState='journal';
      try{const candidate=LALO.decodeJournal(LALO.encodeJournal(ledger));for(const f of additions)candidate.add(f);LALO.encodeJournal(candidate);completedLedger=candidate;}
      catch(error){
        const budget=/capacity|byte budget/.test(error.message);
        if(!event.legacyCompletion||!budget)throw error;
        relationReceipt=null;readReceipt=null;receiptState='legacy-full-journal';
      }
      const trace={tick,policy:'amos/world-read-v1',event:clone(event),before,worldAfter,after:s.h.slice(),changed:changed.slice(0,6),mixture,
        relations,relationReceipt,readReceipt,receiptState,reading,readObservation,resonanceGain,
        prototypeCount:s.glyph.prototypes.length,symbolCount:voice.symbols.length,
        load,surprise:errorBefore,resonance,recognition:clone(recognition),action,nextAttention:attention,
        tool:{name:tool,arguments:args,result:toolResult},utterance,
        previousForecast:completed?.predicted??null,observed:o,prediction:expected,
        resolvedFromTick:completed?tick-1:null};
      this.queue.splice(index,1);this.ledger=completedLedger;this.relations=relationField;this.model=model;this.voice=voice;
      this.pending=pending;this.attention=attention;this.count=tick;this.history.push(trace);
      if(this.history.length>MAX_HISTORY){this.history.shift();this.historyOmitted++;}
      return trace;
    }
    dump() {
      const text=JSON.stringify({format:'amos-2/world',version:3,model:this.model.dumps(),journal:LALO.encodeJournal(this.ledger),voice:this.voice.dump(),
        queue:this.queue,history:this.history,pending:this.pending,count:this.count,serial:this.serial,historyOmitted:this.historyOmitted,
        attention:this.attention,station:this.station,lastWeather:this.lastWeather,relations:this.relations.dump(),reservedReceiptSlots:ENCOUNTER_RECEIPTS});
      if(bytes(text)>MAX_SNAPSHOT)throw Error('Complete life exceeds the 8 MB snapshot budget');return text;
    }
    static load(text) {
      if(typeof text!=='string'||bytes(text)>MAX_SNAPSHOT)throw Error('Snapshot exceeds 8 MB');
      const d=JSON.parse(text);
      if(d?.format!=='amos-2/world'||![1,2,3].includes(d.version))throw Error('Unsupported AMOS-2 life');
      if(d.version>=2&&(!d.relations||![2,3].includes(d.reservedReceiptSlots)))throw Error('Missing acquired relation organ or completion reserve');
      if(d.version===3&&d.reservedReceiptSlots!==ENCOUNTER_RECEIPTS)throw Error('Missing tool-read completion reserve');
      const width=JSON.parse(d.model)?.amos?.subject?.h?.length;
      if(d.version===3&&width!==BODY.H)throw Error('Invalid current neural width');
      if(d.voice?.neural?.[0]?.length!==width)throw Error('Voice and body neural widths disagree');
      const life=new WorldLab();life.model=growModel(d.model);life.ledger=LALO.decodeJournal(d.journal,{capacity:CAPACITY});
      life.voice=VOICE.GlyphVoice.load(d.voice).grow(BODY.H);
      if(d.version<3&&d.pending?.features?.length===54)d.pending.features=growFeatures(d.pending.features);
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
      if(d.reservedReceiptSlots!==undefined&&![2,3].includes(d.reservedReceiptSlots))throw Error('Unsupported encounter reserve');
      const needsLegacyCompletion=d.reservedReceiptSlots!==ENCOUNTER_RECEIPTS&&
        (life.ledger.size+ENCOUNTER_RECEIPTS*d.queue.length>CAPACITY||bytes(d.journal)+20000*d.queue.length>2_000_000);
      if(needsLegacyCompletion)for(const event of d.queue)event.legacyCompletion=true;
      if(d.queue.some(e=>!e.legacyCompletion)&&(life.ledger.size+ENCOUNTER_RECEIPTS*d.queue.length>CAPACITY||bytes(d.journal)+20000*d.queue.length>2_000_000))throw Error('Pending encounters have no completion reserve');
      for(const t of d.history) {
        eventValid(t.event,life.ledger);
        if(t.relations){const receipt=life.ledger.entries().find(f=>f.id===t.relationReceipt);
          const legacy=t.receiptState==='legacy-full-journal'&&t.event.legacyCompletion===true&&t.relationReceipt===null;
          if((!legacy&&(!receipt||receipt.source!=='amos:relations/v1'||receipt.value!==JSON.stringify(t.relations)))||
            !Array.isArray(t.relations.evidence)||!t.relations.evidence.every(id=>life.ledger.entries().some(f=>f.id===id&&f.recordedAt<=(receipt?.recordedAt??latestReceipt(life.ledger)))))throw Error('Invalid relation evidence');}
        if(t.tick!==++tick||!finiteArray(t.before,t.after?.length)||![24,28].includes(t.after?.length)||!finiteArray(t.after,t.before?.length)||!finiteArray(t.observed,3)||
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
      for(const t of d.history)if(t.policy==='amos/world-read-v1'){
        const receipt=life.ledger.entries().find(f=>f.id===t.readReceipt);
        const legacy=t.receiptState==='legacy-full-journal'&&t.event.legacyCompletion===true&&t.readReceipt===null;
        if(!finiteArray(t.worldAfter,28)||!finiteArray(t.readObservation,3)||t.resonanceGain!==.94+.12*t.resonance||
          JSON.stringify(PERCEPTION.read(t.tool.result,life.ledger,t.tool.name,t.tool.arguments))!==JSON.stringify(t.reading)||
          (!legacy&&(!receipt||receipt.source!=='amos:tool-read/v1'||receipt.value!==JSON.stringify(t.reading))))throw Error('Invalid acquired tool reading');
      }
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
  return {WorldLab,compareLives,fetchJSON,CAPACITY,MAX_QUEUE,MAX_HISTORY,MAX_SNAPSHOT,ENCOUNTER_RECEIPTS,WIDTH:BODY.H,FEATURES:BODY.F,magnitude};
})();
