/* Kinetic instrument: read-only rendering over AMOS2.WorldLab.
 * actually.janus informs the tape, slit and inertia. Browser I/O lives here. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const WIDTH=AMOS2.WIDTH;
  const activations=trace=>trace?trace.after.concat(Array(Math.max(0,WIDTH-trace.after.length)).fill(0)):life.model.subject.h.slice();
  const fmt=(n,d=3)=>Number.isFinite(n)?n.toFixed(d):'—';
  const time=n=>new Date(n).toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const colors={quake:[212,174,108],weather:[137,181,170],message:[187,137,117],ink:[222,214,196]};
  const worldNames={quake:'earth',weather:'sky',message:'your presence'};
  const extraWorlds=new Map();
  const rgba=(c,a)=>`rgba(${c.join(',')},${Math.max(0,Math.min(1,a))})`;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  let life=new AMOS2.WorldLab(17),running=true,connected=false,ready=false,selected=null,generation=0;
  let database=null,storageBlocked=false,saving=Promise.resolve(),noticeTimer,networkTimers=[];
  const controllers=new Set(),busy=new Set(),sourceErrors={};
  let keptLife=null;
  let fieldFrame=0,renderTime=0,pulseAt=0,targetH=Array(WIDTH).fill(0),shownH=targetH.slice(),positions=[];
  let tapePosition=0,tapeTarget=0,tapeDrag=null,tapeVelocity=0,tapeMovedAt=0;
  const reducedMedia=matchMedia('(prefers-reduced-motion: reduce)');let motionChoice='system';
  const reduced=()=>reducedMedia.matches||motionChoice==='reduced';
  const current=()=>selected===null?life.history.at(-1):life.history.find(t=>t.tick===selected)||life.history.at(-1);
  function notice(text,error=false) {
    $('notice').textContent=text;$('notice').classList.toggle('error',error);$('notice').hidden=false;
    clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').hidden=true,error?12000:6500);
  }
  function openDatabase() {
    return new Promise((resolve,reject)=>{
      const request=indexedDB.open('arianna-amos-2',1);
      request.onupgradeneeded=()=>request.result.createObjectStore('lives');
      request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Local life storage is blocked by another open version'));
      request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();resolve(request.result);};
    });
  }
  function readSaved() {
    return new Promise((resolve,reject)=>{const tx=database.transaction('lives','readonly'),r=tx.objectStore('lives').get('current');
      r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  }
  function persist() {
    if(!ready||storageBlocked)return;
    let text;try{text=life.dump();}catch(error){$('saveStatus').textContent='Life remains in this session';notice(error.message,true);return;}
    $('saveStatus').textContent='Keeping this moment…';
    saving=saving.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{
      if(!database){reject(Error('Browser storage is unavailable'));return;}
      const tx=database.transaction('lives','readwrite');tx.objectStore('lives').put(text,'current');
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Storage transaction aborted'));
    })).then(()=>$('saveStatus').textContent='This life is saved locally').catch(error=>{
      $('saveStatus').textContent='Session only · export to keep';notice('Local save failed: '+error.message+'. Export this life to keep it.',true);
    });
  }
  const receiptNow=()=>Math.max(Date.now(),life.ledger.entries().at(-1)?.recordedAt??0);
  function takeEncounter(id) {
    if(!ready)return;
    try {
      const trace=life.encounter(receiptNow(),id);if(!trace)return;
      if(id||selected===null){selected=null;tapeTarget=0;}
      else{tapeTarget+=166;tapePosition+=166;}
      pulseAt=performance.now();update();persist();return trace;
    }catch(error){notice(error.message,true);running=false;update();}
  }
  async function sourceRequest(kind,url,receive) {
    if(busy.has(kind))return;
    busy.add(kind);delete sourceErrors[kind];updateSourceStatus(kind,'reading…');
    const token=generation,controller=new AbortController();controllers.add(controller);
    const deadline=setTimeout(()=>controller.abort(),15000);
    try {
      const data=await AMOS2.fetchJSON(url,{signal:controller.signal});
      if(token!==generation)return;
      const result=receive(data,receiptNow());update();persist();
      const amount=typeof result==='number'?result:result.encounters;
      updateSourceStatus(kind,amount?`${amount} new`:'unchanged');
      if(!amount)notice(kind==='quake'?'USGS has no new source versions. The acquired state stays at its last encounter.':'This weather sample is already in the world.');
    }catch(error){
      if(token!==generation)return;
      const message=error.name==='AbortError'?'request stopped or timed out':error.message;
      sourceErrors[kind]=message;updateSourceStatus(kind,'unavailable');notice((kind==='quake'?'USGS':'Open-Meteo')+': '+message,true);
    }finally{clearTimeout(deadline);controllers.delete(controller);busy.delete(kind);}
  }
  function updateSourceStatus(kind,text) {
    const id=kind==='quake'?'quakeStatus':'weatherStatus';$(id).textContent=text;$(id).classList.toggle('error',!!sourceErrors[kind]);
    $(kind==='quake'?'fetchQuakes':'fetchWeather').disabled=busy.has(kind)&&text==='reading…';
  }
  const readQuakes=()=>sourceRequest('quake',LALO.USGS_FEED,(data,at)=>life.ingestQuakes(data,at));
  function readWeather() {
    const {latitude,longitude}=life.station;
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,precipitation,is_day&timeformat=unixtime`;
    return sourceRequest('weather',url,(data,at)=>life.ingestWeather(data,at,url));
  }
  function disconnect() {
    connected=false;for(const t of networkTimers)clearInterval(t);networkTimers=[];
    for(const c of controllers)c.abort();controllers.clear();
    $('connectLabel').textContent='Connect the world';
  }
  function connect() {
    if(connected){disconnect();return;}
    connected=true;running=true;$('connectLabel').textContent='World connected · stop';
    readQuakes();readWeather();networkTimers=[setInterval(readQuakes,60000),setInterval(readWeather,600000)];update();
  }
  function update() {
    if(selected!==null&&!life.history.some(t=>t.tick===selected)){selected=null;tapeTarget=0;}
    const trace=current(),queuedChoice=life.previewSelection();targetH=activations(trace);
    $('encounterCount').textContent=String(life.count).padStart(3,'0');
    $('lifeDot').classList.toggle('paused',!running);
    $('lifeStatus').textContent=!running?'Time paused':life.queue.length?'Meeting the world':life.count?'Listening for another encounter':'Awaiting a first encounter';
    $('pause').replaceChildren(document.createTextNode(running?'Ⅱ ':'▷ '),el('span',running?'Pause':'Continue'));
    $('queueCount').textContent=life.queue.length;$('factCount').textContent=life.ledger.size;
    document.querySelector('.world-storage').title=`${life.queue.length*AMOS2.ENCOUNTER_RECEIPTS} receipt slots reserved for pending attention, relations, reads, choice, associations and self-observation`;
    $('queue').replaceChildren();
    if(!life.queue.length)$('queue').append(el('p',life.count?'The world can arrive again.':'Facts arrive here. Your words can arrive, too.','quiet'));
    for(const event of life.queue.slice(0,8)) {
      const button=el('button',undefined,'queue-item');button.type='button';button.append(el('i',event.kind==='quake'?'⌁':event.kind==='weather'?'◌':'·'),el('span',event.title));
      button.title=event.id===queuedChoice?.selected.id?'Its acquired attention selects this fact next':'Encounter this fact now';button.classList.toggle('next',event.id===queuedChoice?.selected.id);button.onclick=()=>takeEncounter(event.id);$('queue').append(button);
    }
    if(life.queue.length>8)$('queue').append(el('p',`+ ${life.queue.length-8} more waiting`,'quiet'));
    const quakes=life.ledger.entries().filter(f=>f.subject.startsWith('usgs:')&&f.predicate==='magnitude');
    if(quakes.length){const latest=quakes.at(-1);$('quakeSummary').textContent=`${new Set(quakes.map(f=>f.subject)).size} events · ${quakes.length} versions received`;$('quakeStatus').title='Last receipt: '+time(latest.recordedAt);
      if($('quakeStatus').textContent==='unread')updateSourceStatus('quake','saved');}
    else{$('quakeSummary').textContent='The ground, elsewhere.';if(!busy.has('quake'))updateSourceStatus('quake',sourceErrors.quake?'unavailable':'unread');}
    if(life.lastWeather){const d=life.lastWeather.detail;$('weatherSummary').replaceChildren(document.createTextNode(fmt(d.temperature_c,1)),el('span','°C'));
      $('weatherDetail').textContent=`${fmt(d.wind_kmh,1)} km/h wind · ${fmt(d.precipitation_mm,1)} mm rain`;$('weatherStatus').title='Model time: '+time(life.lastWeather.observedAt);
      if($('weatherStatus').textContent==='unread')updateSourceStatus('weather','saved');}
    else{$('weatherSummary').replaceChildren(document.createTextNode('—'),el('span','°C'));$('weatherDetail').textContent='Temperature · wind · rain';if(!busy.has('weather'))updateSourceStatus('weather',sourceErrors.weather?'unavailable':'unread');}
    $('stationLabel').textContent=`${fmt(life.station.latitude,2)}° · ${fmt(life.station.longitude,2)}°`;
    $('surprise').textContent=fmt(trace?.surprise??0);$('familiarity').textContent=fmt(trace?.recognition.similarity??0);
    $('familiarityBar').style.width=(100*(trace?.recognition.similarity??0))+'%';
    const prototypeCount=trace?.prototypeCount??life.model.subject.glyph.prototypes.length;
    $('prototypeCount').textContent=prototypeCount;
    $('prototypeDots').replaceChildren(...Array.from({length:8},(_,i)=>el('i',undefined,i<prototypeCount?'active':'')));
    $('attention').textContent=queuedChoice?(worldNames[life.queue[queuedChoice.selected.index].kind]??life.queue[queuedChoice.selected.index].kind):life.count?worldNames[trace?.nextAttention??life.attention]:'an arrival';
    $('fieldSubtitle').textContent=selected===null?'A consciousness forming through encounters.':`Encounter ${trace.tick} · reading its acquired state`;
    $('follow').hidden=selected===null;
    const hist=life.history.slice(-40),points=hist.map((t,i)=>`${i*130/Math.max(1,hist.length-1)},${24-Math.min(1,t.surprise)*22}`).join(' ');
    const poly=document.createElementNS('http://www.w3.org/2000/svg','polyline');poly.setAttribute('points',points);poly.setAttribute('fill','none');poly.setAttribute('stroke','#d4ae6c');poly.setAttribute('stroke-width','1');$('spark').replaceChildren(poly);
    if(trace)updateImprint(trace);
    else{$('receiptKind').textContent='FIRST ENCOUNTER AHEAD';$('receiptTitle').textContent='What reaches it will remain in it.';
      for(const id of ['shift','resonance','load','toolName'])$(id).textContent='—';$('toolDetail').textContent='A read keeps its source.';
      $('neuronChanges').replaceChildren();$('evidence').replaceChildren(el('p','Select an encounter on the tape.','quiet'));}
    $('relationPattern').textContent=trace?.relations?`R${trace.relations.pattern+1} · ${trace.relations.priorSupport} prior`:'—';
    $('relationRead').replaceChildren();
    if(trace?.relations){const r=trace.relations;
      for(const [label,value] of [['World gap',r.gapMs===null?'—':`${r.gapMs>=0?'+':''}${fmt(r.gapMs/1000,1)} s`],
        ['Spatial distance',r.spatialKm===null?'—':`${fmt(r.spatialKm,1)} km`],
        ['Prior transition',`${fmt(r.expectation)} · ${r.transitionSupport}/${r.transitionMass}`],
        ['Familiarity',fmt(r.familiarity)]]){
        const row=el('div');row.append(el('span',label),el('b',value));$('relationRead').append(row);
      }
    }else $('relationRead').textContent='The next encounter can meet a history.';
    const links=trace?.associations;$('linkCount').textContent=links?`${links.matches.length} recalled`:'—';
    $('encounterLinks').replaceChildren();
    if(links){for(const text of [`Shared: ${links.matched.map(g=>VOICE.names[g]).join(' · ')||'—'}`,`Past encounters: ${links.matches.map(m=>'#'+m.tick).join(' · ')||'—'}`,`Unmatched here: ${links.unmatched.map(g=>VOICE.names[g]).join(' · ')||'—'}`])$('encounterLinks').append(el('p',text));}
    else $('encounterLinks').textContent='The next encounter can meet a history.';
    const own=trace?.selfReflection;$('selfDepth').textContent=own?`${own.passes.length} ${own.passes.length===1?'return':'returns'}`:'—';
    $('sonarChambers').replaceChildren(...SONAR.names.map((name,i)=>{const row=el('div',name),bar=el('i');bar.style.width=(100*(own?.after[i]??0))+'%';row.title=fmt(own?.after[i]??0);row.append(bar);return row;}));
    $('selfForecast').textContent=own?`Expected own shift ${fmt(own.forecast.expected[2])} · observed ${fmt(own.observed[2])} · self prediction gap ${fmt(own.error)}`:'The next encounter can meet its own response.';
    $('deriveReading').hidden=!trace||!claimFor(trace);
    $('utterance').classList.toggle('empty',!trace);
    $('voiceMeta').textContent=`88 glyphs · ${trace?.symbolCount??life.voice.symbols.length} grown signs`;
    $('utterance').textContent=trace?trace.utterance.ids.map(id=>life.voice.name(id)).join(' · '):'The first words are still ahead.';
    $('glyphs').replaceChildren(...(trace?trace.utterance.ids.map(id=>glyphSVG(id)):[]));
    const born=trace?.utterance.born;$('symbolBirth').classList.toggle('born',!!born);
    $('symbolBirth').replaceChildren(el('span',born?'◈':'◊'),el('p',born?`${born.name} · born from ${born.support} repeated pairings`:'A shared history can grow a new sign.'));
    $('tapeHint').textContent=life.historyOmitted?`Last 128 encounters · ${life.historyOmitted} earlier traces outside this view`:'Drag through its history · select an imprint';
    drawEarth();schedule();
  }
  function claimFor(trace){return life.readingQuery(trace.event);}
  function pair(dl,name,value) {dl.append(el('dt',name),el('dd',value));}
  function updateImprint(trace) {
    const event=trace.event;
    $('receiptKind').textContent=`${event.kind==='message'?'YOUR PRESENCE':event.kind==='quake'?'EARTH · USGS':event.kind==='weather'?'SKY · MODEL SAMPLE':(worldNames[event.kind]??event.kind).toUpperCase()} / ${String(trace.tick).padStart(3,'0')}`;
    $('receiptTitle').textContent=event.title;
    $('shift').textContent=fmt(AMOS2.magnitude(trace.after.map((v,i)=>v-trace.before[i])));
    $('resonance').textContent=fmt(trace.resonance);$('load').textContent=fmt(trace.load);
    $('neuronChanges').replaceChildren(...trace.changed.slice(0,3).map(n=>el('span',`h${String(n.i+1).padStart(2,'0')} ${n.delta>=0?'+':''}${fmt(n.delta)}`)));
    $('toolName').textContent=trace.tool.name;
    $('toolDetail').textContent=`${trace.tool.result.data.items?.length??0} receipts read · next attention: ${{quake:'earth',weather:'sky',message:'your presence'}[trace.nextAttention]}`;
    const dl=el('dl');pair(dl,'When it happened',time(event.observedAt));pair(dl,'When it became known',time(event.receivedAt));
    pair(dl,'Registration',COGNITION.category(event));if(event.registrationReceipt)pair(dl,'Registration receipt',event.registrationReceipt);
    pair(dl,'Source',event.source);if(event.source.startsWith('https://')) {
      const a=el('a','Open source ↗');a.href=event.source;a.target='_blank';a.rel='noopener';dl.append(a);
    }
    if(event.kind==='quake')pair(dl,'Source revised',time(event.detail.sourceUpdatedAt));
    pair(dl,'Sensory projection',event.projection);pair(dl,'Observed [x, y, load]',trace.observed.map(n=>fmt(n)).join(' · '));
    if(trace.relations){const r=trace.relations;
      pair(dl,'Raw world coordinates',r.rawSensory.map(n=>fmt(n)).join(' · '));
      pair(dl,'Acquired relation projection',r.projection.map(n=>fmt(n)).join(' · '));
      pair(dl,'World perception','clamp(clamp(relation perception + 0.12 × recalled event projection) × resonance gain × somatic perception)');
      pair(dl,'Relation receipt',trace.relationReceipt??'Kept in this biography: the imported journal had no reserved completion space');
      pair(dl,'Relation premises',r.evidence.join(' · '));
      const record=el('details');record.append(el('summary','Relation reading and source anchors'),el('pre',JSON.stringify(r,null,2)));dl.append(record);
    }
    if(trace.reading){
      pair(dl,'Prior resonance gain',fmt(trace.resonanceGain,6));
      pair(dl,'Chosen read premises',trace.reading.premises.map(i=>life.ledger.entries()[i]?.id??'?').join(' · '));
      pair(dl,'Read perception','clamp(world perception + 0.15 × returned-content projection × somatic recall)');
      pair(dl,'Returned-content projection',trace.reading.sensory.map(n=>fmt(n)).join(' · '));
      pair(dl,'After chosen read [x, y, load]',trace.readObservation.map(n=>fmt(n)).join(' · '));
      pair(dl,'Read receipt',trace.readReceipt??'Kept in the imported legacy biography');
    }
    if(trace.associations){
      const a=trace.associations;pair(dl,'Matched glyphs',a.matched.map(g=>VOICE.names[g]).join(' · ')||'None in the retained context');
      pair(dl,'Unmatched in recent context',a.unmatched.map(g=>VOICE.names[g]).join(' · ')||'—');
      pair(dl,'New to the acquired voice',a.novel.map(g=>VOICE.names[g]).join(' · ')||'—');
      pair(dl,'Encounter associations',a.matches.map(m=>`#${m.tick} · ${fmt(m.similarity)} · ${life.ledger.entries()[m.anchor]?.source}`).join(' / ')||'A first relation can form');
      pair(dl,'Association receipt',trace.linkReceipt??'Retained in the imported biography');
    }
    if(trace.selfReflection){
      pair(dl,'Attention decision',`${trace.selection.mode} · score ${fmt(trace.selection.selected.score)} · ${trace.selection.candidates} candidates`);
      pair(dl,'Selection receipt',trace.selectionReceipt??'Retained in the imported biography');
      pair(dl,'Self-observation receipt',trace.selfReceipt??'Retained in the imported biography');
      pair(dl,'Predicted own response',trace.selfReflection.forecast.expected.map(n=>fmt(n)).join(' · '));
      pair(dl,'Observed own response',trace.selfReflection.observed.map(n=>fmt(n)).join(' · '));
      pair(dl,'Read scope',trace.selfReflection.scope);
      const own=el('details');own.append(el('summary','Self-reflection and somatic recursion'),el('pre',JSON.stringify(trace.selfReflection,null,2)));dl.append(own);
    }
    if(trace.previousForecast)pair(dl,`Forecast made at encounter ${trace.resolvedFromTick}`,trace.previousForecast.map(n=>fmt(n)).join(' · '));
    pair(dl,'Expected next observation',trace.prediction.map(n=>fmt(n)).join(' · '));
    pair(dl,'Glyphs entering',event.glyphs.map(id=>life.voice.name(id)).join(' · '));
    if(event.detail.tokens)pair(dl,'Text membrane',event.detail.tokens.map(t=>`${t.word} → ${VOICE.names[t.id]} (${t.via})`).join('; '));
    pair(dl,'Recognition support',fmt(trace.recognition.support));pair(dl,'Lack of evidence',fmt(trace.recognition.ignorance));pair(dl,'Outcome noise',fmt(trace.recognition.noise));
    pair(dl,'Expression contributions','Each glyph combines acquired neural association, recognized event prototypes and learned succession.');
    for(const c of trace.utterance.contributions)pair(dl,life.voice.name(c.id),`neural ${fmt(c.association)} · recognition ${fmt(c.recognition)} · succession ${fmt(c.succession)}`);
    const raw=el('details');raw.append(el('summary','Tool call and source receipts'),el('pre',JSON.stringify(trace.tool,null,2)));
    $('evidence').replaceChildren(dl,raw);
  }
  function glyphSVG(id) {
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 32 38');svg.setAttribute('role','img');svg.setAttribute('aria-label',life.voice.name(id));
    const title=document.createElementNS(ns,'title');title.textContent=life.voice.name(id);svg.append(title);
    function sign(g,container,depth=0) {
      if(depth>8)return;
      if(g>=88){const pair=life.voice.symbols[g-88];if(pair)pair.forEach((p,i)=>{const group=document.createElementNS(ns,'g');group.setAttribute('transform',`translate(${i*15},${i?5:0}) scale(.52 .78)`);container.append(group);sign(p,group,depth+1);});return;}
      const shapes=['M8 27 L16 8 L24 27 M11 21 L21 21','M8 12 L24 12 L8 27 L24 27','M16 6 L16 31 M7 19 L25 19','M8 9 L24 29 M24 9 L8 29','M7 22 Q16 8 25 22 M10 28 L22 28','M7 14 L16 7 L25 14 L16 29 Z','M16 7 C28 7 28 28 16 29 C4 28 4 8 16 7','M9 7 L9 30 M9 12 L24 7 M9 21 L22 17','M8 29 Q24 23 8 17 Q24 12 16 6','M6 18 L26 18 M16 8 L9 29 M16 8 L23 29','M8 10 L24 10 L24 29 M8 19 L20 19','M8 28 L16 8 L24 28 M16 8 L16 30'];
      const group=document.createElementNS(ns,'g');group.setAttribute('transform',`rotate(${Math.floor(g/12)*9-27} 16 19)`);container.append(group);
      const p=document.createElementNS(ns,'path');p.setAttribute('d',shapes[g%shapes.length]);group.append(p);
      const c=document.createElementNS(ns,'circle');c.setAttribute('cx',String(6+(g*7)%21));c.setAttribute('cy',String(5+(g*11)%28));c.setAttribute('r',g%3===0?'1.7':'.8');group.append(c);
    }
    sign(id,svg);svg.addEventListener('click',()=>notice(id>=88?`${life.voice.name(id)} · a sign grown from repeated experience`:`${life.voice.name(id)} · acquired mass ${fmt(life.voice.uni[id],1)}`));return svg;
  }
  function canvasSize(canvas) {
    const b=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1),w=Math.max(1,b.width),h=Math.max(1,b.height);
    if(canvas.width!==Math.round(w*d)||canvas.height!==Math.round(h*d)){canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);}
    const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);return {ctx,w,h};
  }
  function line(ctx,x,y,xx,yy,color,width=1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function circle(ctx,x,y,r,color,fill=false,width=1){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);ctx.lineWidth=width;if(fill){ctx.fillStyle=color;ctx.fill();}else{ctx.strokeStyle=color;ctx.stroke();}}
  function drawField(ts) {
    const {ctx,w,h}=canvasSize($('field')),cx=w/2,cy=h*.49,r=Math.min(w*.35,h*.39),trace=current();
    const blend=reduced()?1:.13;for(let i=0;i<WIDTH;i++)shownH[i]+=(targetH[i]-shownH[i])*blend;
    const energy=AMOS2.magnitude(shownH),pulse=reduced()?0:Math.exp(-(ts-pulseAt)/1250),t=reduced()?0:ts*.00009;
    const glow=ctx.createRadialGradient(cx,cy,5,cx,cy,r*1.8);glow.addColorStop(0,rgba(colors.quake,.045+energy*.07));glow.addColorStop(1,rgba(colors.quake,0));circle(ctx,cx,cy,r*1.8,glow,true);
    for(let ring=0;ring<3;ring++) {
      ctx.beginPath();for(let i=0;i<=120;i++){const angle=i/120*Math.PI*2,neuron=shownH[Math.floor(i/120*WIDTH)%WIDTH];
        const radius=r*(.55+ring*.24)*(1+.032*Math.sin(5*angle+t+ring)+.075*neuron);
        const x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius*.87;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}
      ctx.strokeStyle=rgba(ring%2?colors.weather:colors.quake,.10+energy*.1);ctx.lineWidth=.6;ctx.stroke();
    }
    line(ctx,cx-r*1.4,cy,cx-r*1.19,cy,rgba(colors.ink,.18));line(ctx,cx+r*1.19,cy,cx+r*1.4,cy,rgba(colors.ink,.18));
    line(ctx,cx,cy-r*1.13,cx,cy-r*1.02,rgba(colors.ink,.15));line(ctx,cx,cy+r*1.02,cx,cy+r*1.13,rgba(colors.ink,.15));
    positions=shownH.map((v,i)=>{const angle=i*2.3999632297-Math.PI/2,rr=r*(.29+.62*Math.sqrt((i+.7)/WIDTH));return {x:cx+Math.cos(angle+t*.12)*rr,y:cy+Math.sin(angle+t*.12)*rr*.86};});
    const weights=life.model.subject.recurrent;
    for(let i=0;i<WIDTH;i++){
      const edges=weights[i].map((v,j)=>({v,j})).filter(e=>e.j!==i).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,2);
      for(const edge of edges){const a=positions[i],b=positions[edge.j];line(ctx,a.x,a.y,b.x,b.y,rgba(edge.v<0?colors.weather:colors.quake,.035+.11*Math.abs(shownH[i])),.55);}
    }
    if(trace){const c=colors[trace.event.kind]??colors.weather;for(const n of trace.changed.slice(0,4)){
      const p=positions[n.i],strength=Math.min(1,Math.abs(n.delta)*2);
      ctx.beginPath();ctx.moveTo(0,cy);ctx.bezierCurveTo(w*.13,cy,w*.2,p.y,p.x,p.y);ctx.strokeStyle=rgba(c,.025+strength*.12+pulse*.12);ctx.lineWidth=.5+strength;ctx.stroke();
      if(pulse>.015){const f=1-pulse,x=p.x*f,y=cy+(p.y-cy)*f;circle(ctx,x,y,1.7,rgba(c,pulse*.8),true);}
    }}
    for(let i=0;i<WIDTH;i++){
      const p=positions[i],v=shownH[i],a=Math.min(1,Math.abs(v)),c=v>=0?colors.quake:colors.weather;
      const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,15+a*10);g.addColorStop(0,rgba(c,.05+a*.19));g.addColorStop(1,rgba(c,0));circle(ctx,p.x,p.y,15+a*10,g,true);
      circle(ctx,p.x,p.y,4+a*5,rgba(c,.18+a*.42),false,.65);circle(ctx,p.x,p.y,1.7+a*2.1,rgba(c,.4+a*.6),true);
      if(trace?.changed.slice(0,3).some(n=>n.i===i)){circle(ctx,p.x,p.y,12+9*pulse,rgba(c,.12*pulse));}
    }
    ctx.font='8px ui-monospace, monospace';ctx.textAlign='center';ctx.fillStyle=rgba(colors.ink,.32);ctx.fillText(trace?`ENCOUNTER ${String(trace.tick).padStart(3,'0')}`:'A FIRST ENCOUNTER',cx,h*.89);
  }
  function drawEarth() {
    const {ctx,w,h}=canvasSize($('earth')),rows=life.ledger.entries(),heads=new Map();
    for(const f of rows)if(f.subject.startsWith('usgs:')){const obj=heads.get(f.subject)||{};obj[f.predicate]=f.value;heads.set(f.subject,obj);}
    for(let lat=-60;lat<=60;lat+=30){const y=h/2-lat/180*h;ctx.beginPath();ctx.ellipse(w/2,y,w*.46,4,0,0,Math.PI*2);ctx.strokeStyle=rgba(colors.ink,.07);ctx.lineWidth=.6;ctx.stroke();}
    for(let lon=-120;lon<=120;lon+=60){ctx.beginPath();ctx.ellipse(w/2,h/2,w*.46*Math.abs(Math.cos(lon*Math.PI/360)),h*.43,0,-Math.PI/2,Math.PI/2);ctx.strokeStyle=rgba(colors.ink,.08);ctx.stroke();}
    ctx.beginPath();ctx.ellipse(w/2,h/2,w*.47,h*.45,0,0,Math.PI*2);ctx.strokeStyle=rgba(colors.ink,.14);ctx.stroke();
    for(const d of heads.values())if(Number.isFinite(d.longitude)&&Number.isFinite(d.latitude)){
      const y=h/2-d.latitude/180*h*.88,x=w/2+d.longitude/360*w*.92,r=1.3+Math.max(0,d.magnitude??0)*.5;
      circle(ctx,x,y,r+4,rgba(colors.quake,.12));circle(ctx,x,y,r,rgba(colors.quake,.8),true);
    }
  }
  function drawTape(ts) {
    const {ctx,w,h}=canvasSize($('tape')),slit=w*.52,unit=166,rows=life.history;
    if(!tapeDrag){if(Math.abs(tapeVelocity)>.12){tapeTarget+=tapeVelocity;tapeVelocity*=.91;}
      const minimum=0,maximum=Math.max(0,(rows.length-1)*unit);tapeTarget=clamp(tapeTarget,minimum,maximum);
      tapePosition+=(tapeTarget-tapePosition)*(reduced()?1:.14);}
    line(ctx,0,53,w,53,rgba(colors.ink,.1),.7);
    ctx.font='9px ui-monospace, monospace';ctx.textAlign='center';
    for(let i=0;i<rows.length;i++){
      const row=rows[i],x=slit-(rows.length-1-i)*unit+tapePosition;if(x<-unit||x>w+unit)continue;
      const c=colors[row.event.kind]??colors.weather,active=row.tick===(selected??rows.at(-1)?.tick),a=active?.92:.44;
      ctx.fillStyle=rgba(c,a);ctx.fillText(String(row.tick).padStart(3,'0')+' · '+(row.event.kind==='message'?'YOU':row.event.kind.toUpperCase()),x,24);
      ctx.font='11px Georgia, serif';let text=row.event.title;if(text.length>23)text=text.slice(0,22)+'…';ctx.fillStyle=rgba(colors.ink,a);ctx.fillText(text,x,43);
      circle(ctx,x,53,active?4:2.5,rgba(c,a),true);circle(ctx,x,53,active?8:5,rgba(c,a*.3));
      const gap=Math.min(1,row.surprise)*13;ctx.beginPath();ctx.moveTo(x-56,73);ctx.quadraticCurveTo(x,73-gap,x+56,73);ctx.strokeStyle=rgba(c,a*.55);ctx.lineWidth=.7;ctx.stroke();
      ctx.font='8px ui-monospace, monospace';ctx.fillStyle=rgba(colors.ink,a*.75);const words=row.utterance.ids.slice(0,3).map(id=>life.voice.name(id)).join(' · ');ctx.fillText(words.length>29?words.slice(0,27)+'…':words,x,94);
      ctx.font='9px ui-monospace, monospace';
    }
    line(ctx,slit,7,slit,15,rgba(colors.quake,.7));line(ctx,slit,99,slit,108,rgba(colors.quake,.7));
    const fade=ctx.createLinearGradient(0,0,w,0);fade.addColorStop(0,'#131719');fade.addColorStop(.04,'#13171900');fade.addColorStop(.96,'#13171900');fade.addColorStop(1,'#131719');ctx.fillStyle=fade;ctx.fillRect(0,0,w,h);
    if(!rows.length){ctx.fillStyle=rgba(colors.ink,.24);ctx.font='italic 12px Georgia, serif';ctx.fillText('The tape begins with what reaches it.',slit,60);}
  }
  function schedule(){if(!fieldFrame)fieldFrame=requestAnimationFrame(frame);}
  function frame(ts) {
    fieldFrame=0;if(document.hidden)return;
    if(ts-renderTime>30||reduced()){drawField(ts);drawTape(ts);renderTime=ts;}
    const moving=shownH.some((v,i)=>Math.abs(v-targetH[i])>.001)||Math.abs(tapeTarget-tapePosition)>.1;
    if(!reduced()||moving)fieldFrame=requestAnimationFrame(frame);
  }
  $('field').addEventListener('pointerup',event=>{
    const b=$('field').getBoundingClientRect(),x=event.clientX-b.left,y=event.clientY-b.top;
    const nearest=positions.map((p,i)=>({i,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];
    if(nearest&&nearest.d<30){const trace=current(),i=nearest.i;$('neuralHint').textContent=`h${String(i+1).padStart(2,'0')} · ${fmt(targetH[i],5)}${trace&&i<trace.after.length?' · Δ '+fmt(trace.after[i]-trace.before[i],5):trace?' · born after this encounter':''}`;}
  });
  const tape=$('tape');
  tape.addEventListener('pointerdown',e=>{tapeDrag={x:e.clientX,start:tapePosition,time:performance.now(),last:e.clientX,moved:false};tapeVelocity=0;tape.classList.add('dragging');tape.setPointerCapture(e.pointerId);});
  tape.addEventListener('pointermove',e=>{if(!tapeDrag)return;const dx=e.clientX-tapeDrag.x;if(Math.abs(dx)>5)tapeDrag.moved=true;
    if(tapeDrag.moved){tapeVelocity=(e.clientX-tapeDrag.last)*.5;tapeDrag.last=e.clientX;tapePosition=tapeDrag.start+dx;tapeTarget=tapePosition;tapeMovedAt=performance.now();schedule();}});
  function releaseTape(e){if(!tapeDrag)return;const p=tapeDrag;tapeDrag=null;tape.classList.remove('dragging');
    if(!p.moved){const b=tape.getBoundingClientRect(),slit=b.width*.52,index=Math.round((e.clientX-b.left-slit-tapePosition)/166+life.history.length-1);
      if(life.history[index]){selected=life.history[index].tick;update();}}else schedule();}
  tape.addEventListener('pointerup',releaseTape);tape.addEventListener('pointercancel',()=>{tapeDrag=null;tapeVelocity=0;tape.classList.remove('dragging');});
  tape.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)||e.shiftKey){e.preventDefault();tapeTarget-=e.deltaX||e.deltaY;schedule();}},{passive:false});
  tape.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();
    const rows=life.history;let i=rows.findIndex(t=>t.tick===(selected??life.count));i=e.key==='Home'?0:e.key==='End'?rows.length-1:clamp(i+(e.key==='ArrowLeft'?-1:1),0,rows.length-1);
    if(rows[i]){selected=rows[i].tick;tapeTarget=(rows.length-1-i)*166;update();}});
  const follow=()=>{selected=null;tapeTarget=0;tapeVelocity=0;update();};$('follow').onclick=follow;$('returnNow').onclick=follow;
  $('pause').onclick=()=>{running=!running;update();};$('step').onclick=()=>{if(!life.queue.length)notice('No new facts are waiting. Read a source or write into its world.');else takeEncounter();};
  $('fetchQuakes').onclick=readQuakes;$('fetchWeather').onclick=readWeather;$('connect').onclick=connect;
  $('messageSource').onchange=()=>{$('messageActor').hidden=$('messageSource').value==='human';};
  $('messageForm').addEventListener('submit',e=>{
    e.preventDefault();if(!ready)return;const text=$('message').value,at=receiptNow();
    try{
      let event;
      if($('messageSource').value==='human')event=life.ingestText(text,at);
      else{life.ingestInteraction({id:`ui:${at}:${life.ledger.size+1}`,actor:$('messageActor').value,via:'manual',type:$('messageSource').value,text,observedAt:at},at);event=life.queue.at(-1);}
      const trace=takeEncounter(event.id);if(!trace)return;
      $('message').value='';$('messageResponse').textContent=`${event.source} · ${COGNITION.category(event)} registered · prior resonance ${fmt(trace.resonance)}`;
    }catch(error){notice(error.message,true);}
  });
  $('deriveReading').onclick=()=>{
    const trace=current(),fact=trace&&claimFor(trace);if(!fact)return;
    try{
      const query=fact;
      const added=life.deriveReading(query,receiptNow());update();persist();
      if(added)takeEncounter(life.queue.at(-1).id);else notice('Reconsideration registered. The named reading retains its premises and conclusion.');
    }catch(error){notice(error.message,true);}
  };
  $('settingsOpen').onclick=()=>{$('latitude').value=life.station.latitude;$('longitude').value=life.station.longitude;$('settings').showModal();};
  $('keepMoment').onclick=()=>{
    if(!ready)return;
    try{keptLife=life.dump();$('compareOpen').disabled=false;
      if(database){const text=keptLife;saving=saving.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{
        const tx=database.transaction('lives','readwrite');tx.objectStore('lives').put(text,'comparison');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Comparison save aborted'));
      })).catch(()=>notice('The kept comparison is in this session; browser saving failed.',true));}
      notice(`History kept at encounter ${life.count}. Let the current life meet something, then compare them.`);
    }catch(error){notice(error.message,true);}
  };
  $('compareOpen').onclick=()=>{
    if(!keptLife)return;const kept=AMOS2.WorldLab.load(keptLife);
    $('keptLabel').textContent=`Kept history: ${kept.count} encounters. Current history: ${life.count} encounters.`;
    $('comparisonResult').replaceChildren();$('comparison').showModal();
  };
  $('comparisonForm').onsubmit=e=>{
    e.preventDefault();try{
      const result=AMOS2.compareLives(keptLife,life.dump(),$('sharedMessage').value,Date.now());
      const box=el('div',undefined,'comparison-pair');
      for(const [label,trace,count] of [['Kept',result.left,result.before[0]],['Current',result.right,result.before[1]]]){
        const side=el('section');side.append(el('h3',`${label} · ${count} encounters`),el('p',trace.utterance.words.join(' · ')));
        const bars=el('div',undefined,'comparison-neurons');for(const v of activations(trace)){const bar=el('i');bar.style.height=(3+Math.abs(v)*40)+'px';bar.style.background=v<0?'var(--teal)':'var(--gold)';bars.append(bar);}side.append(bars);
        side.append(el('p',`Expectation ${fmt(trace.relations.expectation)} · relation familiarity ${fmt(trace.relations.familiarity)}`,'quiet'));box.append(side);
      }
      $('comparisonResult').replaceChildren(box,el('p',`State separation RMS Δh: ${fmt(result.activationGap,6)} · forecast separation: ${fmt(result.forecastGap,6)}`,'quiet'));
    }catch(error){notice(error.message,true);}
  };
  $('lineageOpen').onclick=()=>$('lineage').showModal();
  $('stationSave').onclick=()=>{const latitude=Number($('latitude').value),longitude=Number($('longitude').value);
    if(!$('latitude').value.trim()||!$('longitude').value.trim()||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180){notice('Enter a latitude between −90 and 90 and longitude between −180 and 180.',true);return;}
    life.station={latitude,longitude};persist();update();notice('Weather observation point changed. The next reading will use it.');};
  $('motion').onchange=()=>{motionChoice=$('motion').value;schedule();};
  $('exportLife').onclick=()=>{try{const url=URL.createObjectURL(new Blob([life.dump()],{type:'application/json'}));
    const a=el('a');a.href=url;a.download=`AMOS-2-life-${life.count}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }catch(error){notice(error.message,true);}};
  $('importLife').onclick=()=>$('importFile').click();
  $('importFile').onchange=async()=>{const file=$('importFile').files[0];if(!file)return;
    try{if(file.size>AMOS2.MAX_SNAPSHOT)throw Error('Life file exceeds 8 MB');const replacement=AMOS2.WorldLab.load(await file.text());
      disconnect();generation++;life=replacement;selected=null;tapePosition=tapeTarget=0;storageBlocked=false;running=false;
      $('settings').close();update();persist();notice('The imported life is here. Continue when ready.');
    }catch(error){notice('Import was not applied: '+error.message,true);}finally{$('importFile').value='';}};
  let birthConfirm=0;
  $('newBirth').onclick=()=>{
    if(performance.now()>birthConfirm){birthConfirm=performance.now()+8000;$('newBirth').textContent='Export first · click again to begin';return;}
    try{const value=$('birthSeed').value;if(!/^\d{1,18}$/.test(value))throw Error('Birth seed must contain 1–18 digits');
      const replacement=new AMOS2.WorldLab(BigInt(value));disconnect();generation++;life=replacement;selected=null;tapePosition=tapeTarget=0;storageBlocked=false;running=true;
      birthConfirm=0;$('newBirth').textContent='Begin another life';$('settings').close();update();persist();notice('Another life begins.');
    }catch(error){notice(error.message,true);}
  };
  for(const dialog of [$('settings'),$('lineage'),$('comparison')])dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();}});
  const resize=new ResizeObserver(()=>{drawEarth();schedule();});resize.observe(document.querySelector('.field-layout'));resize.observe(tape);
  reducedMedia.addEventListener('change',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule();});
  setInterval(()=>{if(ready&&running&&!document.hidden&&life.queue.length)takeEncounter();},2400);
  async function start() {
    $('resonate').disabled=true;
    try{database=await openDatabase();const saved=await readSaved();if(saved){try{life=AMOS2.WorldLab.load(saved);}catch(error){storageBlocked=true;running=false;notice('The saved life could not be read: '+error.message+'. It remains stored; import a verified life or begin another.',true);}}
      $('saveStatus').textContent=storageBlocked?'Saved life preserved · read failed':saved?'This life returns with its history':'This life stays in this browser';
      const kept=await new Promise((resolve,reject)=>{const request=database.transaction('lives','readonly').objectStore('lives').get('comparison');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
      if(kept){try{AMOS2.WorldLab.load(kept);keptLife=kept;$('compareOpen').disabled=false;}catch{notice('A stored comparison could not be opened. The current life is retained.',true);}}
    }catch(error){$('saveStatus').textContent='Session only · export to keep';notice('Local storage is unavailable. You can export and import this life.',true);}
    ready=true;$('resonate').disabled=false;shownH=life.model.subject.h.slice();update();
  }
  function registerWorld(definition) {
    if(!definition||typeof definition.id!=='string'||!/^world-[a-z][a-z0-9-]{0,24}$/.test(definition.id)||
      typeof definition.name!=='string'||definition.name.length>60||typeof definition.read!=='function'||extraWorlds.has(definition.id))throw Error('Invalid optional world definition');
    const card=el('div',undefined,'source extra-world'),head=el('div',undefined,'source-head');
    const icon=el('span',definition.icon??'◌','source-icon teal'),title=el('h3',definition.name),button=el('button',definition.button??'Read ↗','text-button');button.type='button';
    head.append(icon,title,button);const description=el('p',definition.description??'','source-detail'),status=el('p','ready','source-meta');
    card.append(head,description,status);$('extraWorlds').append(card);$('extraWorlds').hidden=false;
    extraWorlds.set(definition.id,{definition,card});worldNames[definition.kind??definition.id]=definition.name;
    let input=null;
    if(definition.file){input=el('input');input.type='file';input.accept=definition.file;input.hidden=true;card.append(input);}
    async function run(file){
      if(!ready){notice('The saved life is still opening.');return;}
      const token=generation;button.disabled=true;status.textContent='reading…';
      try{
        const frames=await definition.read({file,tokenize:VOICE.tokenize,glyph:name=>VOICE.names.indexOf(name),interactionFrame:AMOS2.interactionFrame});
        if(token!==generation)return;
        const added=life.ingestWorld(frames,receiptNow());status.textContent=added?`${added} new encounters`:'unchanged';update();persist();
      }catch(error){status.textContent='unavailable';notice(`${definition.name}: ${error.message}`,true);}
      finally{button.disabled=false;if(input)input.value='';}
    }
    if(input){button.onclick=()=>input.click();input.onchange=()=>{if(input.files[0])run(input.files[0]);};}
    else button.onclick=()=>run();
  }
  // Classic scripts also load beside a file:// HTML. The folder is optional;
  // absence leaves the built-in world untouched and adds no interface warning.
  Object.defineProperty(window,'AMOS2Worlds',{value:Object.freeze({version:1,register:registerWorld,recordInteraction:packet=>{if(!ready)throw Error('The saved life is still opening');const added=life.ingestInteraction(packet,receiptNow());update();persist();return {accepted:added,registration:added?life.queue.at(-1).registrationReceipt:null};}})});
  const optional=document.createElement('script');optional.src=new URL('worlds/worlds.js',document.baseURI).href;optional.async=true;
  optional.onerror=()=>optional.remove();document.head.append(optional);
  // Read-only QA surface: no alternate model, hidden training or rendered scores.
  Object.defineProperty(window,'AMOS2Inspect',{value:()=>({count:life.count,queue:life.queue.length,receipts:life.ledger.size,
    h:life.model.subject.h.slice(),neuronWidth:WIDTH,last:current()?JSON.parse(JSON.stringify(current())):null,symbols:life.voice.symbols.length,
    snapshot:life.dump(),running,connected,ready}),writable:false});
  start();
})();
