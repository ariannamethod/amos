// Behavioral gates over the same inline organs shipped in Amos-2.html.
// USGS/weather fixtures below are explicitly synthetic and stay in this test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {gunzipSync} from 'node:zlib';
const html=readFileSync(new URL('../../Amos-2.html',import.meta.url),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('/* Kinetic instrument:')[0];
const context=vm.createContext({TextEncoder,TextDecoder,console,AbortController,fetch,ReadableStream});
vm.runInContext(code+';globalThis.organs={AMOS,LALO,VOICE,RELATIONS,AMOS2};',context);
const {AMOS,LALO,VOICE,RELATIONS,AMOS2}=context.organs;
const T=1793400000000;
const feed=(mag=2.9,updated=T-1000)=>({type:'FeatureCollection',features:[{type:'Feature',id:'amosSynthetic1',geometry:{type:'Point',coordinates:[13,52,8]},properties:{mag,magType:'ml',place:'Synthetic test fixture',type:'earthquake',time:T-10000,updated}}]});
const weather=(temperature=12)=>({latitude:52.5,longitude:13.4,current:{time:T/1000,interval:900,temperature_2m:temperature,wind_speed_10m:9,precipitation:0,is_day:1},current_units:{temperature_2m:'°C',wind_speed_10m:'km/h',precipitation:'mm'}});
const weatherURL='https://api.open-meteo.com/v1/forecast?latitude=52.5&longitude=13.4';
const speak=(life,text,at)=>{const e=life.ingestText(text,at);return life.encounter(at,e.id);};

test('the standalone file embeds the original AMOS body and every runtime organ',()=>{
  assert.ok(code.includes(readFileSync(new URL('../../web/amos.js',import.meta.url),'utf8')));
  assert.ok(!/<script[^>]+src=|<link[^>]+stylesheet/i.test(html));
  assert.ok(!html.includes('/* AMOS2_SCRIPTS */'));assert.ok(!html.includes('/* AMOS2_LICENSE */'));
  const life=new AMOS2.WorldLab();assert.equal(life.count,0);assert.equal(life.queue.length,0);assert.equal(life.ledger.size,0);
});
test('receiving a fact and experiencing it are distinct; unchanged polls create no experience',()=>{
  const life=new AMOS2.WorldLab();assert.equal(life.ingestQuakes(feed(),T).encounters,1);
  assert.equal(life.count,0);assert.equal(life.queue.length,1);
  life.encounter(T);const state=life.model.dumps();
  assert.equal(life.ingestQuakes(feed(),T+100).encounters,0);assert.equal(life.model.dumps(),state);assert.equal(life.queue.length,0);
});
test('source corrections preserve earlier knowledge, revision lineage and a second encounter',()=>{
  const life=new AMOS2.WorldLab();life.ingestQuakes(feed(),T);life.encounter(T);
  life.ingestQuakes(feed(3.4,T+50),T+100);const trace=life.encounter(T+100);
  assert.equal(trace.event.detail.revised,true);assert.equal(trace.event.detail.magnitude,3.4);
  const old=life.ledger.asOf({subject:'usgs:amosSynthetic1',predicate:'magnitude',validAt:T-10000,knownAt:T});
  const fresh=life.ledger.asOf({subject:'usgs:amosSynthetic1',predicate:'magnitude',validAt:T-10000,knownAt:T+100});
  assert.equal(old[0].value,2.9);assert.equal(fresh[0].value,3.4);assert.equal(life.ledger.lineage(fresh[0].id).length,2);
});
test('the forecast is made before the next fact, then acquired coefficients change',()=>{
  const life=new AMOS2.WorldLab();const first=speak(life,'earth stone now',T),forecast=JSON.stringify(first.prediction);
  assert.equal(life.model.subject.updates,0);
  const next=speak(life,'water cold sky',T+10);
  assert.equal(JSON.stringify(next.previousForecast),forecast);assert.equal(life.model.subject.updates,1);
  assert.ok(life.model.subject.weights.flat().some(v=>v!==0));
  assert.equal(JSON.stringify(life.history[0].prediction),forecast);
});
test('the same present inherits different meanings from different ordered histories',()=>{
  const a=new AMOS2.WorldLab(17),b=new AMOS2.WorldLab(17);
  speak(a,'earth stone',T);speak(a,'water sky',T+10);
  speak(b,'water sky',T);speak(b,'earth stone',T+10);
  const aa=speak(a,'I remember you',T+20),bb=speak(b,'I remember you',T+20);
  assert.equal(JSON.stringify(aa.event.sensory),JSON.stringify(bb.event.sensory));
  assert.ok(aa.after.some((v,i)=>Math.abs(v-bb.after[i])>1e-5));
  assert.notEqual(JSON.stringify(aa.prediction),JSON.stringify(bb.prediction));
});
test('an address is a fact even when its contents have no lexical glyphs',()=>{
  const life=new AMOS2.WorldLab();const trace=speak(life,'…',T);
  assert.equal(trace.event.detail.contentGlyphs.length,0);
  assert.equal(life.ledger.entries().find(f=>f.predicate==='arrived').value,true);
  assert.equal(trace.utterance.ids.length,5);assert.ok(trace.after.some(v=>v!==0));
});
test('resonance reads acquired glyph overlap before assimilating the current message',()=>{
  const life=new AMOS2.WorldLab();const first=speak(life,'earth stone',T);assert.equal(first.resonance,0);
  const second=speak(life,'earth stone',T+10);assert.ok(second.resonance>0);
  assert.equal(VOICE.tokenize('Я помню землю').tokens[0].via,'lexicon');
});
test('full snapshots continue the same neural, expression and random trajectories',()=>{
  const a=new AMOS2.WorldLab(11);speak(a,'earth stone',T);speak(a,'I remember you',T+10);a.ingestQuakes(feed(),T+20);
  const b=AMOS2.WorldLab.load(a.dump());
  assert.equal(a.dump(),b.dump());
  for(let i=0;i<8;i++){
    if(i%2===0){a.ingestText('water sky remember',T+30+i);b.ingestText('water sky remember',T+30+i);}
    assert.equal(JSON.stringify(a.encounter(T+30+i)),JSON.stringify(b.encounter(T+30+i)));
  }
  assert.equal(a.dump(),b.dump());
});
test('the chosen instrument is executed against LALO and changes expression material',()=>{
  const life=new AMOS2.WorldLab(4);for(let i=0;i<18;i++)speak(life,i%2?'earth stone':'sky water',T+i);
  const names=new Set(life.history.map(t=>t.tool.name));assert.ok(names.size>=2);
  for(const trace of life.history){assert.ok(trace.tool.result.ok);assert.ok(trace.tool.result.data.items.length>=1);assert.equal(trace.tool.arguments.knownAt,trace.event.receivedAt);}
  assert.ok(life.voice.uni[VOICE.names.indexOf('see')]+life.voice.uni[VOICE.names.indexOf('remember')]>0);
});
test('repeated experience grows recursive signs from observed, rather than inherited, pair counts',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<65;i++)speak(life,'earth stone now',T+i);
  assert.ok(life.voice.symbols.length>1);assert.ok(life.voice.symbols.some(p=>p.some(id=>id>=88)));
  for(const trace of life.history)if(trace.utterance.born)assert.ok(trace.utterance.born.support>=14);
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('expression is causally sensitive to its acquired neural associations',t=>{
  let changed=0;
  for(let seed=1;seed<=12;seed++){
    const life=new AMOS2.WorldLab(seed);for(let i=0;i<8;i++)speak(life,i%2?'love tree music':'earth stone cold',T+i);
    const a=VOICE.GlyphVoice.load(JSON.parse(JSON.stringify(life.voice.dump()))),b=VOICE.GlyphVoice.load(JSON.parse(JSON.stringify(life.voice.dump())));
    const h=life.model.subject.h,mixture=life.model.subject.glyph.sequence.slice(-8);
    const x=a.express(h,mixture),y=b.express(h.map(v=>-v),mixture);
    if(JSON.stringify(x.ids)!==JSON.stringify(y.ids))changed++;
  }
  assert.ok(changed>=8,`Neural intervention changed ${changed}/12 utterances`);
  t.diagnostic(`Neural intervention changed ${changed}/12 utterances with the same expression random streams`);
});
test('weather keeps model time, receipt time, units, duplicates and source revisions',()=>{
  const life=new AMOS2.WorldLab();assert.equal(life.ingestWeather(weather(),T+1,weatherURL),1);
  assert.equal(life.ingestWeather(weather(),T+2,weatherURL),0);
  assert.equal(life.ingestWeather(weather(13),T+3,weatherURL),1);
  assert.equal(life.queue.length,2);assert.equal(life.queue[0].observedAt,T);
  const head=life.ledger.entries().findLast(f=>f.predicate==='temperature_c');assert.equal(head.value,13);assert.ok(head.supersedes);
  const bad=weather();bad.current_units.temperature_2m='°F';const prior=life.dump();assert.throws(()=>life.ingestWeather(bad,T+4,weatherURL));assert.equal(life.dump(),prior);
});
test('a full receipt budget rejects the whole arrival without losing history',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<1020;i++)life.ledger.add({id:`fixture:${i}`,subject:'fixture:capacity',predicate:'value',value:i,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T,supersedes:null});
  const prior=life.dump();assert.throws(()=>life.ingestQuakes(feed(),T+1));assert.equal(life.dump(),prior);
});
test('backdated or invalid arrivals and damaged snapshots do not replace a life',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth',T);const prior=life.dump();
  assert.throws(()=>life.ingestText('later',T-1));assert.equal(life.dump(),prior);
  const d=JSON.parse(prior);d.voice.neural[0]=[1];assert.throws(()=>AMOS2.WorldLab.load(JSON.stringify(d)));
  const missing=JSON.parse(prior);missing.history[0].event.factIds=['absent'];assert.throws(()=>AMOS2.WorldLab.load(JSON.stringify(missing)));
  for(const mutate of [d=>d.history[0].changed=null,d=>d.history[0].utterance.contributions=null,d=>d.history[0].event.detail.tokens='broken',d=>d.voice.utterances++]){
    const damaged=JSON.parse(prior);mutate(damaged);assert.throws(()=>AMOS2.WorldLab.load(JSON.stringify(damaged)));
  }
  assert.equal(life.dump(),prior);
});

test('the optional folder registers three lazy instruments and text becomes sourced encounters',async()=>{
  const definitions=[],worldContext=vm.createContext({window:{AMOS2Worlds:{version:1,register:def=>definitions.push(def)}}});
  vm.runInContext(readFileSync(new URL('../worlds.js',import.meta.url),'utf8'),worldContext);
  assert.equal(definitions.length,3);
  const fileWorld=definitions.find(d=>d.id==='world-text-file');
  const text='earth stone now\n'.repeat(150),file={name:'synthetic-fixture.txt',size:text.length,lastModified:T,text:async()=>text};
  const frames=await fileWorld.read({file,tokenize:VOICE.tokenize,glyph:name=>VOICE.names.indexOf(name)});
  const life=new AMOS2.WorldLab();assert.equal(life.ingestWorld(frames,T+1),3);
  assert.equal(life.count,0);assert.equal(life.ingestWorld(frames,T+2),0);
  let encounterAt=T+3;while(life.queue.length)life.encounter(encounterAt++);
  assert.equal(life.history[0].event.kind,'text-file');assert.equal(life.count,3);
  // The saved world carries data and projections, with no reference to module functions.
  const alone=AMOS2.WorldLab.load(life.dump());
  assert.equal(alone.dump(),life.dump());
  assert.equal(JSON.stringify(speak(alone,'I remember earth',T+10)),JSON.stringify(speak(life,'I remember earth',T+10)));
});
test('an invalid optional-world batch preserves the accepted world and acquired subject',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth',T);const prior=life.dump();
  const frame={kind:'sensor',key:'fixture',source:'synthetic:test',observedAt:T,title:'Synthetic sensor',values:{value:1},sensory:[.2,.3],projection:'Synthetic bounded test coordinates',glyphs:[2],detail:{}};
  assert.throws(()=>life.ingestWorld([frame,{...frame,key:'bad',sensory:[Infinity,0]}],T+1));assert.equal(life.dump(),prior);
  assert.equal(life.ingestWorld([frame],T+2),1);
  const saved=life.dump();assert.throws(()=>life.ingestWorld([{...frame,values:{value:Infinity}}],T+3));assert.equal(life.dump(),saved);
});

test('review: arrivals reserve completion receipts for the entire pending queue',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<1007;i++)life.ledger.add({id:`reserve:${i}`,subject:'fixture:reserve',predicate:'value',value:i,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T,supersedes:null});
  const e=life.ingestText('earth',T+1);life.ingestQuakes(feed(),T+2);
  assert.equal(life.ledger.size,1018);assert.equal(life.queue.length,2);
  const before=life.dump();assert.throws(()=>life.ingestText('overflow',T+3),/reserve/);assert.equal(life.dump(),before);
  life.encounter(T+4,e.id);life.encounter(T+5);assert.equal(life.ledger.size,1024);assert.equal(life.queue.length,0);
});
test('review: a compressed phrase counts surviving base pairs once',()=>{
  const voice=new VOICE.GlyphVoice(),g=name=>VOICE.names.indexOf(name),h=Array(24).fill(.1),mix=[1,0,0,0,0,0,0,0];
  for(let i=0;i<14;i++)voice.ingest(['earth','stone'].map(g),h,mix);assert.ok(voice.consolidate());
  for(let i=0;i<7;i++)voice.ingest(['earth','stone','water','sky'].map(g),h,mix);
  assert.equal(voice.cooc[g('water')][g('sky')],7);assert.equal(voice.bi[g('water')][g('sky')],7);
  assert.equal(voice.cooc[88][g('water')],7);assert.equal(voice.consolidate(),null);
});
test('geographic relations change perception of an identical external fact',()=>{
  const a=new AMOS2.WorldLab(17),b=new AMOS2.WorldLab(17),near=feed(),far=feed();
  far.features[0].geometry.coordinates=[-60,-30,8];
  a.ingestQuakes(near,T);b.ingestQuakes(far,T);const firstA=a.encounter(T+1),firstB=b.encounter(T+1);
  assert.equal(JSON.stringify(firstA.worldAfter),JSON.stringify(firstB.worldAfter));
  // Tool reads now include coordinates. Hold body and voice fixed to isolate the relation memory.
  b.model=a.model.clone();b.voice=VOICE.GlyphVoice.load(JSON.parse(JSON.stringify(a.voice.dump())));
  b.pending=JSON.parse(JSON.stringify(a.pending));b.attention=a.attention;
  const next=feed();next.features[0].id='syntheticNext';next.features[0].properties.time=T+10000;next.features[0].geometry.coordinates=[13.1,52.1,8];
  a.ingestQuakes(next,T+11000);b.ingestQuakes(next,T+11000);
  const aa=a.encounter(T+11001),bb=b.encounter(T+11001);
  assert.equal(JSON.stringify(aa.event.sensory),JSON.stringify(bb.event.sensory));
  assert.ok(aa.relations.spatialKm<20);assert.ok(bb.relations.spatialKm>5000);
  assert.ok(aa.after.some((v,i)=>Math.abs(v-bb.after[i])>1e-5));
  for(const life of [a,b]){const t=life.history.at(-1),f=life.ledger.entries().find(f=>f.id===t.relationReceipt);assert.equal(f.value,JSON.stringify(t.relations));assert.ok(t.relations.evidence.every(id=>life.ledger.entries().some(f=>f.id===id)));}
});
test('relation familiarity and transition expectations are acquired before the next encounter',()=>{
  const life=new AMOS2.WorldLab();const readings=[];
  for(let i=0;i<10;i++)readings.push(speak(life,'earth stone now',T+i*10).relations);
  assert.equal(readings[0].priorSupport,0);assert.equal(readings[0].expectation,0);
  assert.ok(readings.at(-1).priorSupport>0);assert.ok(readings.at(-1).transitionSupport>0);assert.ok(readings.at(-1).expectation>0);
  assert.equal(life.relations.seen,10);assert.equal(life.relations.transitions.flat().reduce((s,v)=>s+v,0),9);
  const copy=AMOS2.WorldLab.load(life.dump());assert.equal(copy.dump(),life.dump());
});
test('source revision has a measured relation to the previously encountered version',()=>{
  const life=new AMOS2.WorldLab();life.ingestQuakes(feed(2.9),T);life.encounter(T+1);
  life.ingestQuakes(feed(3.4,T+10),T+20);const t=life.encounter(T+21);
  assert.ok(Math.abs(t.relations.revisionDelta-.5)<1e-12);assert.equal(t.relations.gapMs,0);
  assert.equal(JSON.stringify(AMOS2.WorldLab.load(life.dump()).history.at(-1).relations),JSON.stringify(t.relations));
});
test('a shared observation meets two histories without modifying either original life',()=>{
  const a=new AMOS2.WorldLab(17),b=new AMOS2.WorldLab(17);
  speak(a,'earth stone',T);speak(a,'water sky',T+10);speak(b,'water sky',T);speak(b,'earth stone',T+10);
  const left=a.dump(),right=b.dump(),result=AMOS2.compareLives(left,right,'I remember you',T+100);
  assert.ok(result.activationGap>1e-5);assert.equal(JSON.stringify(result.left.event.sensory),JSON.stringify(result.right.event.sensory));
  assert.equal(a.dump(),left);assert.equal(b.dump(),right);
  const same=AMOS2.compareLives(left,left,'I remember you',T+100);assert.equal(same.activationGap,0);assert.equal(same.forecastGap,0);
});
test('old snapshots acquire the new relation organ while retaining their existing acquired body',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth',T);const data=JSON.parse(life.dump());data.version=1;delete data.relations;
  for(const t of data.history){delete t.relations;delete t.relationReceipt;}
  const restored=AMOS2.WorldLab.load(JSON.stringify(data));assert.equal(restored.model.dumps(),life.model.dumps());assert.equal(restored.relations.seen,0);
  speak(restored,'stone',T+10);assert.equal(restored.relations.seen,1);assert.equal(AMOS2.WorldLab.load(restored.dump()).count,2);
});

test('optional dated facts supply spatial relations that remain in the standalone life',async()=>{
  const definitions=[],wc=vm.createContext({window:{AMOS2Worlds:{version:1,register:d=>definitions.push(d)}}});
  vm.runInContext(readFileSync(new URL('../worlds.js',import.meta.url),'utf8'),wc);
  const data={format:'amos/world-facts',version:1,events:[
    {id:'a',time:T,values:{latitude:52,longitude:13,magnitude:2},glyphs:['earth','stone']},
    {id:'b',time:T+60000,values:{latitude:52.1,longitude:13.1,magnitude:2},glyphs:['earth','stone']},
  ]},file={name:'synthetic-world.json',size:1000,text:async()=>JSON.stringify(data)};
  const frames=await definitions.find(d=>d.id==='world-facts').read({file,glyph:n=>VOICE.names.indexOf(n)});
  const life=new AMOS2.WorldLab();life.ingestWorld(frames,T+100000);life.encounter(T+100001);const last=life.encounter(T+100002);
  assert.equal(last.relations.gapMs,60000);assert.ok(last.relations.spatialKm>10&&last.relations.spatialKm<20);
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
  assert.ok(life.ledger.entries().some(f=>f.predicate==='original_source'&&f.source==='local:world-facts'));
});
test('a revised relation context cannot be imported against different source coordinates',()=>{
  const life=new AMOS2.WorldLab();life.ingestQuakes(feed(),T);life.encounter(T+1);
  const data=JSON.parse(life.dump());data.relations.recent[0].geo=[0,0];
  assert.throws(()=>AMOS2.WorldLab.load(JSON.stringify(data)),/source receipts/);
});

test('review: an already full legacy journal can finish its accepted earthquake',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<1016;i++)life.ledger.add({id:`legacy:${i}`,subject:'fixture:legacy',predicate:'value',value:i,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T,supersedes:null});
  const fresh=new AMOS2.WorldLab();fresh.ingestQuakes(feed(),T+1);
  life.ledger=LALO.ingestUSGS(life.ledger,feed(),{receivedAt:T+1}).ledger;life.queue=fresh.queue;
  const data=JSON.parse(life.dump());data.version=1;delete data.reservedReceiptSlots;delete data.relations;
  const restored=AMOS2.WorldLab.load(JSON.stringify(data));const trace=restored.encounter(T+2);
  assert.equal(restored.ledger.size,1024);assert.equal(restored.queue.length,0);assert.equal(restored.count,1);
  assert.equal(trace.receiptState,'legacy-full-journal');assert.ok(trace.relations.evidence.length>0);
  assert.equal(AMOS2.WorldLab.load(restored.dump()).dump(),restored.dump());
});

test('audit: weather can return to an older value and revise its validity interval',()=>{
  const life=new AMOS2.WorldLab();
  assert.equal(life.ingestWeather(weather(12),T,weatherURL),1);
  assert.equal(life.ingestWeather(weather(13),T+10,weatherURL),1);
  assert.equal(life.ingestWeather(weather(12),T+20,weatherURL),1);
  assert.equal(life.ingestWeather(weather(12),T+30,weatherURL),0);
  const head=life.ledger.asOf({subject:life.queue[0].subject,predicate:'temperature_c',validAt:T,knownAt:T+30})[0];
  assert.equal(head.value,12);assert.equal(life.ledger.lineage(head.id).length,3);
  const revised=weather(12);revised.current.interval=1800;
  assert.equal(life.ingestWeather(revised,T+40,weatherURL),1);
  const changed=life.ledger.entries().findLast(f=>f.predicate==='temperature_c');assert.equal(changed.validTo,T+1800000);
});
const sensor=(value,source='synthetic:a')=>({kind:'sensor',key:'same-observation',source,observedAt:T,title:'Synthetic sensor',values:{magnitude:value},sensory:[.2,.3],projection:'Synthetic coordinates',glyphs:[2],detail:{}});
test('audit: optional worlds retain A-B-A corrections and deduplicate the current version',()=>{
  const life=new AMOS2.WorldLab();
  assert.equal(life.ingestWorld([sensor(12)],T),1);assert.equal(life.ingestWorld([sensor(13)],T+10),1);
  assert.equal(life.ingestWorld([sensor(12)],T+20),1);assert.equal(life.ingestWorld([sensor(12)],T+30),0);
  const f=life.ledger.asOf({subject:'world:sensor:same-observation',validAt:T,knownAt:T+30})[0];
  assert.equal(f.value,12);assert.equal(life.ledger.lineage(f.id).length,3);
  const reordered={...sensor(12),values:{magnitude:12,latitude:2}};
  assert.equal(life.ingestWorld([reordered],T+40),1);
  assert.equal(life.ingestWorld([{...reordered,values:{latitude:2,magnitude:12}}],T+50),0);
});
test('audit: independent sources coexist and revisions compare the same source',()=>{
  const life=new AMOS2.WorldLab();
  life.ingestWorld([sensor(12)],T);life.encounter(T);
  life.ingestWorld([sensor(13,'synthetic:b')],T+10);life.encounter(T+10);
  life.ingestWorld([sensor(14)],T+20);const trace=life.encounter(T+20);
  const active=life.ledger.asOf({subject:'world:sensor:same-observation',validAt:T,knownAt:T+30});
  assert.equal(active.length,2);assert.equal(active.find(f=>f.source==='synthetic:a').value,14);
  assert.equal(active.find(f=>f.source==='synthetic:b').value,13);assert.equal(trace.relations.revisionDelta,2);
  assert.equal(life.ingestWorld([sensor(14,'synthetic:c')],T+30),1);
  assert.equal(life.ledger.asOf({subject:'world:sensor:same-observation',validAt:T,knownAt:T+40}).length,3);
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('audit: encounters share a receipt millisecond without changing external clocks',()=>{
  const life=new AMOS2.WorldLab();life.ingestText('earth',T);life.ingestText('water',T);
  life.encounter(T);life.encounter(T);
  assert.equal(life.count,2);assert.equal(life.queue.length,0);
  assert.ok(life.ledger.entries().every(f=>f.recordedAt===T));
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
  // This is also the UI clock after importing a life ahead of the wall clock.
  for(let i=0;i<3;i++)speak(life,'same now',T);
  assert.equal(life.count,5);assert.ok(life.ledger.entries().every(f=>f.recordedAt===T));
});
test('audit: returned tool content changes neural state and has exact source premises',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth stone',T);const snapshot=life.dump();
  const a=AMOS2.WorldLab.load(snapshot),b=AMOS2.WorldLab.load(snapshot),original=LALO.createToolHost;
  const left=speak(a,'water sky',T+10);let right;
  try{
    LALO.createToolHost=(...args)=>{const host=original(...args);return {call(...callArgs){const r=host.call(...callArgs);if(r.ok)r.data.items=[];return r;}};};
    right=speak(b,'water sky',T+10);
  }finally{LALO.createToolHost=original;}
  assert.equal(JSON.stringify(left.worldAfter),JSON.stringify(right.worldAfter));
  assert.notEqual(JSON.stringify(left.after),JSON.stringify(right.after));
  assert.ok(left.reading.premises.length>0);assert.equal(right.reading.premises.length,0);
  assert.equal(JSON.stringify(left.reading.premises.map(i=>a.ledger.entries()[i].id)),JSON.stringify(left.tool.result.data.items.map(f=>f.id)));
  assert.ok(a.ledger.entries().some(f=>f.id===left.readReceipt&&f.value===JSON.stringify(left.reading)));
});
test('audit: prior resonance causally changes perception before assimilation',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth stone',T);const snapshot=life.dump();
  const a=AMOS2.WorldLab.load(snapshot),b=AMOS2.WorldLab.load(snapshot),proto=VOICE.GlyphVoice.prototype,original=proto.resonance;
  let left,right;
  try{proto.resonance=()=>0;left=speak(a,'water sky',T+10);proto.resonance=()=>1;right=speak(b,'water sky',T+10);}
  finally{proto.resonance=original;}
  assert.equal(left.resonanceGain,.94);assert.equal(right.resonanceGain,1.06);
  assert.notEqual(JSON.stringify(left.observed),JSON.stringify(right.observed));
  assert.notEqual(JSON.stringify(left.worldAfter),JSON.stringify(right.worldAfter));
});
test('a failing chosen tool commits no learning, random draw, receipt or encounter',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth',T);life.ingestText('water',T+10);
  const before=life.dump(),original=LALO.createToolHost;
  try{
    LALO.createToolHost=()=>({call:()=>({ok:false,error:{message:'Synthetic tool failure'}})});
    assert.throws(()=>life.encounter(T+10),/Synthetic tool failure/);
  }finally{LALO.createToolHost=original;}
  assert.equal(life.dump(),before);assert.ok(life.encounter(T+10));
});
test('AMOS II has 28 recurrent neurons and learns 186 predictive coefficients',()=>{
  const life=new AMOS2.WorldLab();assert.equal(AMOS.H,24);assert.equal(AMOS2.WIDTH,28);assert.equal(AMOS2.FEATURES,62);
  for(let i=0;i<7;i++)speak(life,i%2?'earth stone':'water sky',T+i*10);
  const s=life.model.subject;assert.equal(s.h.length,28);assert.equal(s.recurrent.length,28);
  assert.ok(s.recurrent.every(r=>r.length===28));assert.equal(s.weights.flat().length,186);
  assert.ok(s.h.slice(24).some(v=>v!==0));assert.ok(s.weights.some(row=>row.slice(29,33).some(v=>v!==0)));
  assert.ok(life.voice.neural.every(row=>row.length===28));assert.equal(life.pending.features.length,62);
});
test('a real v2 24-neuron life grows with its acquired weights, pending forecast and biography intact',()=>{
  const text=gunzipSync(readFileSync(new URL('../../tests/fixtures/amos2-v2.json.gz',import.meta.url))).toString();
  const old=JSON.parse(text),body=JSON.parse(old.model).amos,life=AMOS2.WorldLab.load(text),s=life.model.subject;
  assert.equal(s.h.length,28);assert.equal(JSON.stringify(s.h.slice(0,24)),JSON.stringify(body.subject.h));
  assert.equal(JSON.stringify(s.win.slice(0,24)),JSON.stringify(body.subject.win));
  assert.equal(JSON.stringify(s.recurrent.slice(0,24).map(row=>row.slice(0,24))),JSON.stringify(body.subject.recurrent));
  assert.ok(s.recurrent.slice(0,24).every(row=>row.slice(24).every(v=>v===0)));
  const map=i=>i<29?i:i<53?i+4:61;
  for(let k=0;k<3;k++)for(let j=0;j<54;j++)assert.equal(s.weights[k][map(j)],body.subject.weights[k][j]);
  for(let i=0;i<54;i++)for(let j=0;j<54;j++)assert.equal(s.covariance[map(i)][map(j)],body.subject.covariance[i][j]);
  assert.equal(JSON.stringify(life.history),JSON.stringify(old.history));
  assert.equal(JSON.stringify(life.pending.predicted),JSON.stringify(old.pending.predicted));
  assert.equal(JSON.stringify(life.voice.neural.map(row=>row.slice(0,24))),JSON.stringify(old.voice.neural));
  assert.equal(life.model.subject.rng.state.toString(16),body.subject.rng.random64.replace(/^0+/,''));
  const checkpoint=life.dump();assert.equal(JSON.parse(checkpoint).version,3);assert.equal(AMOS2.WorldLab.load(checkpoint).dump(),checkpoint);
  const trace=life.encounter(T+70);assert.equal(trace.after.length,28);assert.equal(life.count,6);
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('v2 encounters with only two reserved slots still finish after the read organ grows',()=>{
  const old=JSON.parse(gunzipSync(readFileSync(new URL('../../tests/fixtures/amos2-v2.json.gz',import.meta.url))).toString());
  const ledger=LALO.decodeJournal(old.journal);let i=0;
  while(ledger.size<1022)ledger.add({id:`legacy-grow:${i++}`,subject:'fixture:legacy',predicate:'value',value:0,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T+60,supersedes:null});
  old.journal=LALO.encodeJournal(ledger);
  const life=AMOS2.WorldLab.load(JSON.stringify(old)),trace=life.encounter(T+70);
  assert.equal(life.count,6);assert.equal(life.queue.length,0);assert.equal(trace.receiptState,'legacy-full-journal');
  assert.equal(life.ledger.size,1022);assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('read premises and projections cannot be rewritten independently of returned source facts',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth stone',T);const old=life.dump();
  const data=JSON.parse(old);data.history[0].reading.premises=[999];
  assert.throws(()=>AMOS2.WorldLab.load(JSON.stringify(data)),/tool reading/);
  assert.equal(life.dump(),old);
});
test('a 160-encounter life retains acquired state across the 128-trace boundary',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<160;i++)speak(life,i%2?'earth stone':'water sky',T+i*10);
  assert.equal(life.history.length,128);assert.equal(life.historyOmitted,32);assert.equal(life.ledger.size,960);
  const text=life.dump(),restored=AMOS2.WorldLab.load(text);assert.equal(restored.dump(),text);
  assert.equal(JSON.stringify(speak(restored,'I remember you',T+2000)),JSON.stringify(speak(life,'I remember you',T+2000)));
});
