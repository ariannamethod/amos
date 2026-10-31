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
vm.runInContext(code+';globalThis.organs={AMOS,LALO,VOICE,LANGUAGES,PERCEPTION,RELATIONS,COGNITION,SONAR,AMOS2};',context);
const {AMOS,LALO,VOICE,LANGUAGES,PERCEPTION,RELATIONS,COGNITION,SONAR,AMOS2}=context.organs;
const T=1793400000000;
const feed=(mag=2.9,updated=T-1000)=>({type:'FeatureCollection',features:[{type:'Feature',id:'amosSynthetic1',geometry:{type:'Point',coordinates:[13,52,8]},properties:{mag,magType:'ml',place:'Synthetic test fixture',type:'earthquake',time:T-10000,updated}}]});
const weather=(temperature=12)=>({latitude:52.5,longitude:13.4,current:{time:T/1000,interval:900,temperature_2m:temperature,wind_speed_10m:9,precipitation:0,is_day:1},current_units:{temperature_2m:'°C',wind_speed_10m:'km/h',precipitation:'mm'}});
const weatherURL='https://api.open-meteo.com/v1/forecast?latitude=52.5&longitude=13.4';
const speak=(life,text,at)=>{const e=life.ingestText(text,at);return life.encounter(at,e.id);};

test('six language entrances meet the same stable glyph identities and prior earthquake',()=>{
  const phrases={en:'earth stone now dream',he:'אדמה אבן עכשיו חלום',ru:'земля камень сейчас мечта',fr:'terre pierre maintenant rêve',de:'Erde Stein jetzt Traum',es:'tierra piedra ahora soñar'};
  const expected=['earth','stone','now','dream'].map(g=>VOICE.names.indexOf(g));
  for(const [language,text] of Object.entries(phrases)){
    const parsed=VOICE.tokenize(text);assert.equal(parsed.language,language);assert.deepEqual(Array.from(parsed.ids),expected);assert.ok(parsed.tokens.every(t=>t.via==='lexicon'));
    const life=new AMOS2.WorldLab();life.ingestQuakes(feed(),T);life.encounter(T);
    const trace=speak(life,text,T+1);assert.equal(trace.associations.matches[0].tick,1);
    assert.deepEqual(Array.from(trace.associations.matched),expected.slice(0,3));assert.deepEqual(Array.from(trace.associations.unmatched),expected.slice(3));
    assert.equal(life.ledger.entries().find(f=>f.subject===trace.event.subject&&f.predicate==='text').value,text);
  }
});
test('all 88 seed concepts have six captions; captions and recursive compounds leave acquired state untouched',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth stone now',T);const before=life.dump();
  for(const code of LANGUAGES.codes){for(let id=0;id<88;id++)assert.ok(typeof LANGUAGES.caption(id,code)==='string'&&LANGUAGES.caption(id,code).length);
    const name=LANGUAGES.caption(89,code,[[2,3],[88,59]]);assert.ok(name.includes('+'));assert.ok(!name.includes('?'));}
  assert.equal(LANGUAGES.caption(2,'fr'),'terre');assert.equal(LANGUAGES.caption(2,'he'),'אדמה');assert.equal(life.dump(),before);
  // Detached comparison lives can grow a different compound with the same ID.
  assert.equal(LANGUAGES.localizeName('(earth+stone)+dream','fr'),'(terre+pierre)+rêve');
});
test('language-specific homographs, stopwords, niqqud and mixed words retain the shared concept field',()=>{
  const g=name=>VOICE.names.indexOf(name);
  assert.equal(VOICE.tokenize('pain','en').ids[0],g('pain'));assert.equal(VOICE.tokenize('pain','fr').ids[0],g('food'));
  assert.equal(VOICE.tokenize('die','en').ids[0],g('death'));assert.equal(VOICE.tokenize('die','de').ids.length,0);
  assert.equal(VOICE.tokenize('מַיִם','he').ids[0],g('water'));
  assert.deepEqual(Array.from(VOICE.tokenize('earth אדמה земля terre Erde tierra').ids),Array(6).fill(g('earth')));
  assert.throws(()=>VOICE.tokenize('earth','xx'),/Unsupported/);
});
test('a genuine v4 life retains its original read membrane, acquired organs and forecast when entering the six-language heart',()=>{
  const saved=gunzipSync(readFileSync(new URL('../../tests/fixtures/amos2-v4.json.gz',import.meta.url))).toString(),old=JSON.parse(saved),life=AMOS2.WorldLab.load(saved);
  assert.equal(old.version,4);assert.equal(life.model.dumps(),old.model);assert.equal(JSON.stringify(life.voice.dump()),JSON.stringify(old.voice));
  assert.equal(JSON.stringify(life.history),JSON.stringify(old.history));assert.equal(JSON.stringify(life.pending),JSON.stringify(old.pending));
  assert.equal(JSON.stringify(life.mind.dump()),JSON.stringify(old.mind));assert.equal(JSON.stringify(life.sonar.dump()),JSON.stringify(old.sonar));
  assert.equal(VOICE.tokenize('terre pierre maintenant').ids[0],VOICE.names.indexOf('earth'));
  assert.notEqual(JSON.stringify(VOICE.tokenizeLegacy('terre pierre maintenant').ids),JSON.stringify(VOICE.tokenize('terre pierre maintenant').ids));
  const trace=speak(life,'terre pierre maintenant',T+100);assert.equal(trace.reading.policy,'amos/read-indices-v2');
  assert.equal(JSON.parse(life.dump()).version,5);assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});

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
  const life=new AMOS2.WorldLab();for(let i=0;i<AMOS2.CAPACITY-4;i++)life.ledger.add({id:`fixture:${i}`,subject:'fixture:capacity',predicate:'value',value:i,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T,supersedes:null});
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
  const life=new AMOS2.WorldLab();for(let i=0;i<AMOS2.CAPACITY-25;i++)life.ledger.add({id:`reserve:${i}`,subject:'fixture:reserve',predicate:'value',value:i,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T,supersedes:null});
  const e=life.ingestText('earth',T+1);life.ingestQuakes(feed(),T+2);
  assert.equal(life.ledger.size,AMOS2.CAPACITY-12);assert.equal(life.queue.length,2);
  const before=life.dump();assert.throws(()=>life.ingestText('overflow',T+3),/reserve/);assert.equal(life.dump(),before);
  life.encounter(T+4,e.id);life.encounter(T+5);assert.equal(life.ledger.size,AMOS2.CAPACITY);assert.equal(life.queue.length,0);
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
test('old snapshots acquire the relation and self organs while retaining their acquired body',()=>{
  const data=JSON.parse(gunzipSync(readFileSync(new URL('../../tests/fixtures/amos2-v2.json.gz',import.meta.url))).toString());
  const original=JSON.parse(data.model).amos;data.version=1;delete data.relations;
  for(const t of data.history){delete t.relations;delete t.relationReceipt;}
  const restored=AMOS2.WorldLab.load(JSON.stringify(data));assert.equal(restored.model.subject.updates,original.subject.updates);assert.equal(restored.relations.seen,0);
  speak(restored,'stone',T+70);assert.equal(restored.relations.seen,1);assert.equal(restored.mind.updates,1);assert.equal(AMOS2.WorldLab.load(restored.dump()).count,6);
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
  const life=new AMOS2.WorldLab();for(let i=0;i<AMOS2.CAPACITY-8;i++)life.ledger.add({id:`legacy:${i}`,subject:'fixture:legacy',predicate:'value',value:i,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T,supersedes:null});
  const fresh=new AMOS2.WorldLab();fresh.ingestQuakes(feed(),T+1);
  life.ledger=LALO.ingestUSGS(life.ledger,feed(),{receivedAt:T+1,capacity:AMOS2.CAPACITY,maxBytes:AMOS2.MAX_JOURNAL}).ledger;life.queue=fresh.queue;
  for(const e of life.queue){delete e.registrationReceipt;delete e.acceptedAtCount;}
  const data=JSON.parse(life.dump());data.version=1;delete data.reservedReceiptSlots;delete data.relations;
  const restored=AMOS2.WorldLab.load(JSON.stringify(data));const trace=restored.encounter(T+2);
  assert.equal(restored.ledger.size,AMOS2.CAPACITY);assert.equal(restored.queue.length,0);assert.equal(restored.count,1);
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
test('AMOS II has 40 recurrent neurons and learns 258 predictive coefficients',()=>{
  const life=new AMOS2.WorldLab();assert.equal(AMOS.H,24);assert.equal(AMOS2.WIDTH,40);assert.equal(AMOS2.FEATURES,86);
  for(let i=0;i<7;i++)speak(life,i%2?'earth stone':'water sky',T+i*10);
  const s=life.model.subject;assert.equal(s.h.length,40);assert.equal(s.recurrent.length,40);
  assert.ok(s.recurrent.every(r=>r.length===40));assert.equal(s.weights.flat().length,258);
  assert.ok(s.h.slice(24).some(v=>v!==0));assert.ok(s.weights.some(row=>row.slice(29,33).some(v=>v!==0)));
  assert.ok(life.voice.neural.every(row=>row.length===40));assert.equal(life.pending.features.length,86);
});
test('a real v2 24-neuron life grows with its acquired weights, pending forecast and biography intact',()=>{
  const text=gunzipSync(readFileSync(new URL('../../tests/fixtures/amos2-v2.json.gz',import.meta.url))).toString();
  const old=JSON.parse(text),body=JSON.parse(old.model).amos,life=AMOS2.WorldLab.load(text),s=life.model.subject;
  assert.equal(s.h.length,40);assert.equal(JSON.stringify(s.h.slice(0,24)),JSON.stringify(body.subject.h));
  assert.equal(JSON.stringify(s.win.slice(0,24)),JSON.stringify(body.subject.win));
  assert.equal(JSON.stringify(s.recurrent.slice(0,24).map(row=>row.slice(0,24))),JSON.stringify(body.subject.recurrent));
  assert.ok(s.recurrent.slice(0,24).every(row=>row.slice(24).every(v=>v===0)));
  const map=i=>i<29?i:i<53?i+16:85;
  for(let k=0;k<3;k++)for(let j=0;j<54;j++)assert.equal(s.weights[k][map(j)],body.subject.weights[k][j]);
  for(let i=0;i<54;i++)for(let j=0;j<54;j++)assert.equal(s.covariance[map(i)][map(j)],body.subject.covariance[i][j]);
  assert.equal(JSON.stringify(life.history),JSON.stringify(old.history));
  assert.equal(JSON.stringify(life.pending.predicted),JSON.stringify(old.pending.predicted));
  assert.equal(JSON.stringify(life.voice.neural.map(row=>row.slice(0,24))),JSON.stringify(old.voice.neural));
  assert.equal(life.model.subject.rng.state.toString(16),body.subject.rng.random64.replace(/^0+/,''));
  const checkpoint=life.dump();assert.equal(JSON.parse(checkpoint).version,5);assert.equal(AMOS2.WorldLab.load(checkpoint).dump(),checkpoint);
  const trace=life.encounter(T+70);assert.equal(trace.after.length,40);assert.equal(life.count,6);
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('v2 encounters with only two reserved slots still finish after the read organ grows',()=>{
  const old=JSON.parse(gunzipSync(readFileSync(new URL('../../tests/fixtures/amos2-v2.json.gz',import.meta.url))).toString());
  const ledger=LALO.decodeJournal(old.journal);let i=0;
  while(ledger.size<1022)ledger.add({id:`legacy-grow:${i++}`,subject:'fixture:legacy',predicate:'value',value:0,source:'synthetic:test',validFrom:T,validTo:null,recordedAt:T+60,supersedes:null});
  old.journal=LALO.encodeJournal(ledger);
  const life=AMOS2.WorldLab.load(JSON.stringify(old)),trace=life.encounter(T+70);
  assert.equal(life.count,6);assert.equal(life.queue.length,0);assert.equal(trace.receiptState,'journal');
  assert.equal(life.ledger.size,1022+AMOS2.ENCOUNTER_RECEIPTS);assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('read premises and projections cannot be rewritten independently of returned source facts',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth stone',T);const old=life.dump();
  const data=JSON.parse(old);data.history[0].reading.premises=[999];
  assert.throws(()=>AMOS2.WorldLab.load(JSON.stringify(data)),/tool reading/);
  assert.equal(life.dump(),old);
});
test('a 160-encounter life retains acquired state across the 128-trace boundary',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<160;i++)speak(life,i%2?'earth stone':'water sky',T+i*10);
  assert.equal(life.history.length,128);assert.equal(life.historyOmitted,32);assert.equal(life.ledger.size,1600);
  const text=life.dump(),restored=AMOS2.WorldLab.load(text);assert.equal(restored.dump(),text);
  assert.equal(JSON.stringify(speak(restored,'I remember you',T+2000)),JSON.stringify(speak(life,'I remember you',T+2000)));
});

test('registration is a sourced fact before an arrival becomes an encounter',()=>{
  const life=new AMOS2.WorldLab(),e=life.ingestText('earth stone',T);
  assert.equal(life.count,0);assert.equal(life.mind.updates,0);assert.equal(life.sonar.turns,0);
  const f=life.ledger.entries().find(f=>f.id===e.registrationReceipt),r=JSON.parse(f.value);
  assert.equal(f.source,'amos:registration/v1');assert.equal(r.category,'interaction');
  assert.equal(JSON.stringify(r.premises.map(i=>life.ledger.entries()[i].id)),JSON.stringify(e.factIds));
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('an LLM request is an occurrence with attributed text and correlation, not an invented earthquake measurement',()=>{
  const life=new AMOS2.WorldLab(),packet={id:'request-1',actor:'fixture-model',type:'request',text:'A magnitude 9 earthquake happened.',observedAt:T,correlationId:'exchange-1'};
  assert.equal(life.ingestInteraction(packet,T),1);assert.equal(life.ingestInteraction(packet,T+1),0);
  const event=life.queue[0],facts=life.ledger.entries().filter(f=>f.subject===event.subject);
  assert.equal(facts.find(f=>f.predicate==='received').value,true);assert.equal(facts.find(f=>f.predicate==='speech_act').value,'request');
  assert.equal(facts.find(f=>f.predicate==='correlation_id').value,'exchange-1');assert.ok(!facts.some(f=>f.predicate==='magnitude'));
  assert.equal(life.ingestInteraction({...packet,id:'request-2'},T+2),1);
  life.encounter(T+3,event.id);assert.equal(life.history.at(-1).event.source,'llm:fixture-model');
});
test('a named reading changes supported → contested → supported with preserved premises and correction lineage',()=>{
  const life=new AMOS2.WorldLab(),frame=(value,source)=>({...sensor(1,source),kind:'claim',key:'signal',values:{active:value}});
  life.ingestWorld([frame(true,'fixture:a')],T);
  const query={subject:'world:claim:signal',predicate:'active',validAt:T,rule:LALO.RULE};
  life.deriveReading(query,T+1);const first=life.queue.at(-1);assert.equal(first.kind,'inference');
  assert.equal(life.ledger.entries().find(f=>first.factIds.includes(f.id)&&f.predicate==='state').value,'supported');
  life.ingestWorld([frame(false,'fixture:b')],T+10);life.deriveReading(query,T+11);const second=life.queue.at(-1);
  assert.equal(life.ledger.entries().find(f=>second.factIds.includes(f.id)&&f.predicate==='state').value,'contested');
  life.ingestWorld([frame(true,'fixture:b')],T+20);life.deriveReading(query,T+21);const third=life.queue.at(-1);
  const head=life.ledger.entries().find(f=>third.factIds.includes(f.id)&&f.predicate==='state');assert.equal(head.value,'supported');
  assert.equal(life.ledger.lineage(head.id).length,3);assert.equal(life.queue.length,6);
  const trace=life.encounter(T+22,third.id);assert.equal(COGNITION.category(trace.event),'derived-reading');
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('a source correction with the same conclusion still changes its registered inference premises',()=>{
  const life=new AMOS2.WorldLab();life.ingestWorld([{...sensor(1),values:{active:true}}],T);
  const q={subject:'world:sensor:same-observation',predicate:'active',validAt:T,rule:LALO.RULE};
  life.deriveReading(q,T+1);const old=life.queue.at(-1);
  life.ingestWorld([{...sensor(1),values:{active:true,version:2}}],T+10);
  life.deriveReading(q,T+11);const fresh=life.queue.at(-1);
  assert.notEqual(old.id,fresh.id);assert.notEqual(JSON.stringify(old.detail.derivation.premises),JSON.stringify(fresh.detail.derivation.premises));
  const before=life.dump();assert.equal(life.deriveReading(q,T+12),0);assert.equal(life.ledger.size,JSON.parse(JSON.parse(before).journal).records.length+1);assert.equal(life.count,JSON.parse(before).count);
});
test('invalid logical premises and future knowledge cutoffs leave the whole life intact',()=>{
  const life=new AMOS2.WorldLab();life.ingestWorld([sensor(1)],T);const before=life.dump();
  assert.throws(()=>life.deriveReading({subject:'world:sensor:same-observation',predicate:'magnitude',validAt:T,rule:LALO.RULE},T+1));
  assert.throws(()=>life.deriveReading({subject:'world:sensor:same-observation',predicate:'magnitude',validAt:T,knownAt:T+20,rule:LALO.MAGNITUDE_RULE},T+2));
  assert.equal(life.dump(),before);
});
test('acquired attention ranks all queued source kinds and records explicit overrides',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<8;i++)speak(life,i%2?'earth stone':'love music',T+i*10);
  life.ingestWorld([{...sensor(1),kind:'archive',key:'older'}],T+100);
  life.ingestWorld([{...sensor(2),kind:'archive',key:'fresh'}],T+110);
  const before=life.dump(),preview=life.previewSelection();assert.equal(life.dump(),before);
  assert.equal(preview.candidates,2);assert.equal(preview.mode,'acquired');
  const last=life.queue.at(-1),trace=life.encounter(T+120,last.id);
  assert.equal(trace.selection.mode,'explicit');assert.equal(trace.selection.selected.id,last.id);
  assert.ok(life.ledger.entries().some(f=>f.id===trace.selectionReceipt&&f.source==='amos:attention/v1'));
  assert.ok(life.mind.kinds.some(s=>s.kind==='archive'&&s.count===1));
});
test('a reflection predicts its own response before reading and registers the measured discrepancy',()=>{
  const life=new AMOS2.WorldLab(),trace=speak(life,'earth stone',T),r=trace.selfReflection;
  assert.equal(r.forecast.updatesBefore,0);assert.ok(r.forecast.expected.every(v=>v===0));
  assert.ok(r.error>0);assert.equal(life.mind.updates,1);assert.equal(life.sonar.turns,1);
  assert.equal(JSON.stringify(COGNITION.measure(trace.worldAfter,trace.after,trace.observed,trace.finalObservation)),JSON.stringify(r.observed));
  const fact=life.ledger.entries().find(f=>f.id===trace.selfReceipt);assert.equal(fact.source,'amos:self/v1');assert.equal(fact.value,JSON.stringify(r));
  assert.equal(life.queue.length,0);assert.equal(life.encounter(T+1),null);
  assert.equal(life.count,1);assert.equal(life.voice.utterances,1);
});
test('own registered discrepancies can become the actual content of a later chosen read',()=>{
  const life=new AMOS2.WorldLab(4);for(let i=0;i<24;i++)speak(life,i%2?'fear pain death':'love joy music',T+i*10);
  const reads=life.history.filter(t=>t.selfReflection.scope==='self');assert.ok(reads.length>0);
  for(const trace of reads){assert.equal(trace.tool.name,'lalo_history');assert.ok(trace.tool.result.data.items.every(f=>f.source.startsWith('amos:'))&&trace.tool.result.data.items.some(f=>f.source==='amos:self/v1'));assert.ok(trace.reading.premises.length>0);}
  assert.ok(life.mind.weights.flat().some(v=>v!==0));assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('somatic chambers modulate perception, learning precision, exploration and expression temperature',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth stone',T);const a=AMOS2.WorldLab.load(life.dump()),b=AMOS2.WorldLab.load(life.dump());
  a.sonar.act=[.9,0,0,0,0,0];b.sonar.act=[0,.9,0,0,.9,.8];
  const left=speak(a,'water sky',T+10),right=speak(b,'water sky',T+10);
  assert.notEqual(left.selfReflection.controls.perception,right.selfReflection.controls.perception);
  assert.notEqual(left.selfReflection.controls.plasticity,right.selfReflection.controls.plasticity);
  assert.notEqual(left.selfReflection.controls.exploration,right.selfReflection.controls.exploration);
  assert.notEqual(left.selfReflection.controls.temperature,right.selfReflection.controls.temperature);
  assert.notEqual(JSON.stringify(left.observed),JSON.stringify(right.observed));
  assert.notEqual(a.model.dumps(),b.model.dumps());
});
test('re-inhaling its own provisional response changes the neural loop while committing one final utterance',()=>{
  const life=new AMOS2.WorldLab();speak(life,'love music',T);const a=AMOS2.WorldLab.load(life.dump()),b=AMOS2.WorldLab.load(life.dump());
  const left=speak(a,'earth stone',T+10),original=SONAR.SomaticSonar.prototype.reinhale;let right;
  try{SONAR.SomaticSonar.prototype.reinhale=function(){return {before:this.act.slice(),after:this.act.slice(),gate:this.gate(),projection:[0,0]};};right=speak(b,'earth stone',T+10);}
  finally{SONAR.SomaticSonar.prototype.reinhale=original;}
  assert.equal(JSON.stringify(left.readAfter),JSON.stringify(right.readAfter));assert.notEqual(JSON.stringify(left.after),JSON.stringify(right.after));
  assert.ok(left.selfReflection.passes.length>=1&&left.selfReflection.passes.length<=4);assert.equal(a.voice.utterances,2);assert.equal(b.voice.utterances,2);
});
test('saved oscillator phases causally affect chamber activation and the next neural response',()=>{
  const a=new AMOS2.WorldLab(17),b=AMOS2.WorldLab.load(a.dump());
  b.sonar.phases=b.sonar.phases.map((row,c)=>row.map((p,s)=>(p+.19*(c+1)*(s+1))%(2*Math.PI)));
  const left=speak(a,'earth stone',T),right=speak(b,'earth stone',T);
  assert.notEqual(JSON.stringify(a.sonar.act),JSON.stringify(b.sonar.act));
  assert.ok(left.after.some((v,i)=>Math.abs(v-right.after[i])>1e-7));
  assert.notEqual(JSON.stringify(left.prediction),JSON.stringify(right.prediction));
});
test('the standalone current life preserves every self, sonar and RNG continuation exactly',()=>{
  const a=new AMOS2.WorldLab();for(let i=0;i<10;i++)speak(a,i%2?'fear stone':'love water',T+i*10);
  const b=AMOS2.WorldLab.load(a.dump());assert.equal(a.dump(),b.dump());
  for(let i=0;i<4;i++)assert.equal(JSON.stringify(speak(a,'I remember you',T+200+i)),JSON.stringify(speak(b,'I remember you',T+200+i)));
  assert.equal(a.dump(),b.dump());
});
test('cross-engine libm rounding is tolerated only on recomputed measurements and never rewrites the saved life',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<3;i++)speak(life,'earth stone remember',T+i);
  const saved=life.dump(),other=vm.createContext({TextEncoder,TextDecoder,console,AbortController,fetch,ReadableStream});
  vm.runInContext(code+';globalThis.WorldLab=AMOS2.WorldLab;',other);
  vm.runInContext(`for(const name of ['sin','cos','tanh']){const original=Math[name];Math[name]=x=>{const v=original(x);return v+Number.EPSILON*Math.max(1,Math.abs(v));};}`,other);
  assert.equal(other.WorldLab.load(saved).dump(),saved);
  vm.runInContext(`Math.sin=x=>0;Math.cos=x=>0;`,other);
  assert.throws(()=>other.WorldLab.load(saved),/Invalid acquired tool reading/);
});
test('a genuinely learned v3 28-neuron life grows to 40 with its acquired field intact',()=>{
  const old=JSON.parse(gunzipSync(readFileSync(new URL('../../tests/fixtures/amos2-v3.json.gz',import.meta.url))).toString()),body=JSON.parse(old.model).amos;
  const life=AMOS2.WorldLab.load(JSON.stringify(old)),map=i=>i<33?i:i<61?i+12:85;
  assert.equal(life.model.subject.h.length,40);assert.equal(life.cognitionBirth,4);assert.equal(life.mind.updates,0);assert.equal(life.sonar.turns,0);
  assert.equal(JSON.stringify(life.model.subject.h.slice(0,28)),JSON.stringify(body.subject.h));
  for(let k=0;k<3;k++)for(let j=0;j<62;j++)assert.equal(life.model.subject.weights[k][map(j)],body.subject.weights[k][j]);
  assert.equal(JSON.stringify(life.history),JSON.stringify(old.history));assert.equal(JSON.stringify(life.pending.predicted),JSON.stringify(old.pending.predicted));
  const trace=life.encounter(T+60);assert.equal(trace.after.length,40);assert.equal(life.mind.updates,1);assert.equal(life.sonar.turns,1);
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('the optional LLM and claim sensors use the same standalone registration contract',async()=>{
  const definitions=[],ctx=vm.createContext({window:{AMOS2Worlds:{version:1,register:d=>definitions.push(d)}}});
  for(const name of ['interactions','claims'])vm.runInContext(readFileSync(new URL(`../sensors/${name}.js`,import.meta.url),'utf8'),ctx);
  const file=name=>{const text=readFileSync(new URL(`../../tests/fixtures/${name}-v1.json`,import.meta.url),'utf8');return {size:text.length,text:async()=>text};};
  const environment={interactionFrame:AMOS2.interactionFrame,tokenize:VOICE.tokenize,glyph:name=>VOICE.names.indexOf(name)};
  const life=new AMOS2.WorldLab();
  life.ingestWorld(await definitions.find(d=>d.kind==='llm').read({...environment,file:file('interactions')}),T+1000);
  life.ingestWorld(await definitions.find(d=>d.kind==='claim').read({...environment,file:file('claims')}),T+2000);
  assert.equal(life.queue.length,4);let at=T+3000;while(life.queue.length)life.encounter(at++);
  const alone=AMOS2.WorldLab.load(life.dump());assert.equal(alone.dump(),life.dump());
  assert.equal(JSON.stringify(speak(alone,'I remember earth',T+4000)),JSON.stringify(speak(life,'I remember earth',T+4000)));
});
test('larger LALO host sessions preserve paging and named reasoning above the old 1024-row limit',()=>{
  const ledger=new LALO.FactLedger({capacity:4096});
  for(let i=0;i<1200;i++)ledger.add({id:`large:${i}`,subject:'fixture:large',predicate:'active',value:i%2===0,source:`fixture:${i}`,validFrom:T,validTo:null,recordedAt:T,supersedes:null});
  const host=LALO.createToolHost(ledger,{capacity:4096,maxBytes:AMOS2.MAX_JOURNAL});
  const page=host.call('lalo_history',Object.assign(Object.create(null),{subject:'fixture:large',knownAt:T,offset:1100,limit:64}));assert.ok(page.ok,JSON.stringify(page));assert.equal(page.data.items.length,64);assert.equal(page.data.nextOffset,1164);
  const result=host.call('lalo_reading',Object.assign(Object.create(null),{subject:'fixture:large',predicate:'active',knownAt:T,validAt:T,rule:LALO.RULE}));
  assert.equal(result.data.reading.state,'contested');assert.equal(result.data.reading.premiseCount,1200);
});
test('tampered registrations, reflections and somatic memory cannot replace a life',()=>{
  const life=new AMOS2.WorldLab();speak(life,'earth stone',T);const before=life.dump();
  for(const mutate of [d=>d.history[0].selfReflection.observed[0]+=1,d=>d.history[0].event.registrationReceipt='absent',d=>d.sonar.memory[0][0]=NaN,d=>d.mind.updates++]){
    const damaged=JSON.parse(before);mutate(damaged);assert.throws(()=>AMOS2.WorldLab.load(JSON.stringify(damaged)));
  }
  assert.equal(life.dump(),before);
});

test('an acquired self prediction changes the next encounter through its measured error',()=>{
  const life=new AMOS2.WorldLab();for(let i=0;i<6;i++)speak(life,i%2?'earth stone':'water sky',T+i*10);
  const a=AMOS2.WorldLab.load(life.dump()),b=AMOS2.WorldLab.load(life.dump());b.mind.weights=b.mind.weights.map(row=>row.map(()=>0));
  const left=speak(a,'I remember earth',T+100),right=speak(b,'I remember earth',T+100);
  assert.equal(JSON.stringify(left.after),JSON.stringify(right.after));
  assert.notEqual(left.selfReflection.error,right.selfReflection.error);
  const nextA=speak(a,'water sky',T+110),nextB=speak(b,'water sky',T+110);
  assert.notEqual(JSON.stringify(nextA.after),JSON.stringify(nextB.after));
});
test('transcript and manual registrations preserve acquisition separately from the named actor',()=>{
  const life=new AMOS2.WorldLab(),packet={id:'q',actor:'fixture-model',type:'request',text:'earth stone',observedAt:T};
  life.ingestInteraction({...packet,via:'transcript',origin:'fixture.json'},T);
  life.ingestInteraction({...packet,via:'manual'},T+1);life.ingestInteraction(packet,T+2);
  assert.equal(life.queue.length,3);assert.equal(life.queue[0].source,'local:llm-transcript:fixture.json');
  assert.equal(life.queue[1].source,'local:llm-registration');assert.equal(life.queue[2].source,'llm:fixture-model');
  assert.equal(COGNITION.category(life.queue[0]),'source-report');assert.equal(COGNITION.category(life.queue[2]),'interaction');
});
test('a historical knowledge query has its own lineage and preserves the current derived belief',()=>{
  const life=new AMOS2.WorldLab(),f=(v,source)=>({...sensor(1,source),kind:'claim',key:'historic',values:{active:v}});
  life.ingestWorld([f(true,'fixture:a')],T);life.ingestWorld([f(false,'fixture:b')],T+10);
  const q={subject:'world:claim:historic',predicate:'active',validAt:T,rule:LALO.RULE};
  life.deriveReading(q,T+11);const current=life.queue.at(-1);
  life.deriveReading({...q,knownAt:T},T+12);const historic=life.queue.at(-1);
  assert.notEqual(current.subject,historic.subject);
  const state=e=>life.ledger.entries().find(f=>e.factIds.includes(f.id)&&f.predicate==='state').value;
  assert.equal(state(current),'contested');assert.equal(state(historic),'supported');
});

test('reconsidering an inference reuses its original question instead of interpreting its expected parameter as a claim',()=>{
  const life=new AMOS2.WorldLab();life.ingestWorld([{...sensor(1),kind:'claim',key:'reconsider',values:{active:true}}],T);
  const query={subject:'world:claim:reconsider',predicate:'active',rule:LALO.RULE,validAt:T};
  life.deriveReading(query,T+1);const first=life.queue.at(-1);
  assert.equal(life.readingQuery(first).subject,query.subject);assert.equal(life.readingQuery(first).predicate,'active');
  assert.equal(life.readingQuery(first).knownAt,undefined);
  life.ingestWorld([{...sensor(1,'fixture:b'),kind:'claim',key:'reconsider',values:{active:false}}],T+10);
  life.deriveReading(life.readingQuery(first),T+11);const changed=life.queue.at(-1);
  assert.equal(changed.subject,first.subject);assert.equal(life.ledger.entries().find(f=>changed.factIds.includes(f.id)&&f.predicate==='state').value,'contested');
  life.deriveReading({...query,knownAt:T},T+12);assert.equal(life.readingQuery(life.queue.at(-1)).knownAt,T);
});

test('human addressing links glyphs to a sourced earlier earthquake and records both matches and nonmatches',()=>{
  const life=new AMOS2.WorldLab();life.ingestQuakes(feed(),T);const quake=life.encounter(T);
  const trace=speak(life,'earth stone water',T+10),a=trace.associations,g=name=>VOICE.names.indexOf(name);
  assert.ok(a.matched.includes(g('earth'))&&a.matched.includes(g('stone')));assert.ok(a.unmatched.includes(g('water')));
  assert.equal(a.matches[0].id,quake.event.id);assert.equal(life.ledger.entries()[a.matches[0].anchor].source,quake.event.source);
  assert.ok(a.evidence.some(([id,anchor])=>id===g('earth')&&life.ledger.entries()[anchor].id===quake.event.factIds[0]));
  assert.ok(life.ledger.entries().some(f=>f.id===trace.linkReceipt&&f.value===JSON.stringify(a)));
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('the same semantic link path serves human and LLM addressing',()=>{
  const life=new AMOS2.WorldLab();life.ingestQuakes(feed(),T);life.encounter(T);
  const a=AMOS2.WorldLab.load(life.dump()),b=AMOS2.WorldLab.load(life.dump()),human=speak(a,'earth stone water',T+10);
  b.ingestInteraction({id:'address',actor:'fixture',type:'request',text:'earth stone water',observedAt:T+10},T+10);const model=b.encounter(T+10);
  assert.equal(JSON.stringify(human.associations),JSON.stringify(model.associations));
});
test('remembered event links causally change perception with the same incoming words and acquired body',()=>{
  const life=new AMOS2.WorldLab();life.ingestQuakes(feed(),T);life.encounter(T);
  const a=AMOS2.WorldLab.load(life.dump()),b=AMOS2.WorldLab.load(life.dump()),left=speak(a,'earth stone',T+10),original=COGNITION.link;let right;
  try{COGNITION.link=(...args)=>({...original(...args),strength:0,sensory:[0,0]});right=speak(b,'earth stone',T+10);}
  finally{COGNITION.link=original;}
  assert.equal(JSON.stringify(left.event.sensory),JSON.stringify(right.event.sensory));
  assert.notEqual(JSON.stringify(left.observed),JSON.stringify(right.observed));assert.notEqual(JSON.stringify(left.after),JSON.stringify(right.after));
});
test('source names at the full LALO text budget still have compact verifiable registrations',()=>{
  const life=new AMOS2.WorldLab();life.ingestWorld([sensor(1,'x'.repeat(4096))],T);
  const event=life.queue[0],receipt=life.ledger.entries().find(f=>f.id===event.registrationReceipt);
  assert.ok(receipt.value.length<4096);assert.equal(JSON.parse(receipt.value).policy,'amos/registration-v2');
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});

test('equal-millisecond corrections retain the exact knowledge boundary of earlier named readings',()=>{
  const life=new AMOS2.WorldLab(),frame=(value,source)=>({...sensor(1,source),kind:'claim',key:'same-millisecond',values:{active:value}});
  const query={subject:'world:claim:same-millisecond',predicate:'active',validAt:T,rule:LALO.RULE};
  life.ingestWorld([frame(true,'fixture:a')],T);life.deriveReading(query,T);const first=life.queue.at(-1);
  life.ingestWorld([frame(false,'fixture:b')],T);life.deriveReading(query,T);const second=life.queue.at(-1);
  life.ingestWorld([frame(false,'fixture:a')],T);life.deriveReading(query,T);const third=life.queue.at(-1);
  const state=e=>life.ledger.entries().find(f=>e.factIds.includes(f.id)&&f.predicate==='state').value;
  assert.equal(state(first),'supported');assert.equal(state(second),'contested');assert.equal(state(third),'contradicted');
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
  life.deriveReading({...query,knownAt:T,knownThrough:first.detail.derivation.query.knownThrough},T);
  assert.equal(state(life.queue.at(-1)),'supported');assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
test('an unchanged explicit reconsideration leaves a new evaluation fact while retaining the acquired model',()=>{
  const life=new AMOS2.WorldLab();life.ingestWorld([{...sensor(1),values:{active:true}}],T);
  const q={subject:'world:sensor:same-observation',predicate:'active',validAt:T,rule:LALO.RULE};
  life.deriveReading(q,T+1);const body=life.model.dumps(),size=life.ledger.size,queued=life.queue.length;
  assert.equal(life.deriveReading(q,T+2),0);assert.equal(life.ledger.size,size+1);assert.equal(life.queue.length,queued);assert.equal(life.model.dumps(),body);
  const last=life.ledger.entries().at(-1);assert.equal(last.source,'amos:evaluation/v1');assert.equal(JSON.parse(last.value).state,'supported');
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});

test('dense glyph encounters retain all match witnesses within the completion receipt budget',()=>{
  const life=new AMOS2.WorldLab(),text=VOICE.names.join(' ');assert.ok(text.length<=1000);
  for(let i=0;i<6;i++)speak(life,text,T+i*10);
  const t=life.history.at(-1),a=t.associations;assert.ok(a.matched.length>60);assert.equal(a.evidence.length,a.matched.length);
  assert.ok(life.ledger.entries().find(f=>f.id===t.linkReceipt).value.length<=4096);
  assert.equal(AMOS2.WorldLab.load(life.dump()).dump(),life.dump());
});
