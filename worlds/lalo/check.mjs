// Behavioral gates over the same inline organs shipped in Amos-2.html.
// USGS/weather fixtures below are explicitly synthetic and stay in this test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../../Amos-2.html',import.meta.url),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('/* Kinetic instrument:')[0];
const context=vm.createContext({TextEncoder,TextDecoder,console,AbortController,fetch,ReadableStream});
vm.runInContext(code+';globalThis.organs={AMOS,LALO,VOICE,AMOS2};',context);
const {AMOS,LALO,VOICE,AMOS2}=context.organs;
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
  assert.equal(JSON.stringify(aa.observed.slice(0,2)),JSON.stringify(bb.observed.slice(0,2)));
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

test('the optional folder registers two lazy instruments and text becomes sourced encounters',async()=>{
  const definitions=[],worldContext=vm.createContext({window:{AMOS2Worlds:{version:1,register:def=>definitions.push(def)}}});
  vm.runInContext(readFileSync(new URL('../worlds.js',import.meta.url),'utf8'),worldContext);
  assert.equal(definitions.length,2);
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
  const saved=life.dump();assert.throws(()=>life.ingestWorld([{...frame,values:{value:1},observedAt:T+1}],T+3));assert.equal(life.dump(),saved);
});
