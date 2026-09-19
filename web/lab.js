'use strict';
const $=id=>document.getElementById(id),fmt=(x,n=3)=>Number(x).toFixed(n);
let amos=new AMOS.Amos(17,1,4),running=false,timer=null,checkpoint=null,abandoned=null,last=null;
const colors=['#547da0','#799882','#b99466','#8b7eaa','#699a9c','#aa8186','#8e9570','#7e8d9e'];
function message(text){$('message').textContent=text;}
function pause(){running=false;clearInterval(timer);timer=null;$('play').textContent='Run';$('status').textContent='Paused';}
function play(){pause();running=true;$('play').textContent='Pause';$('status').textContent='Running';timer=setInterval(()=>advance(1),1000/Number($('speed').value));}
function advance(n){
  try{for(let i=0;i<n;i++) last=amos.step(null,$('learning').checked,Number($('explore').value));render();}
  catch(e){pause();message(e.message);}
}
function glyph(index,alpha=1){
  const angle=index*Math.PI/4,x=12+8*Math.cos(angle),y=12+8*Math.sin(angle);
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="${colors[index]}" opacity="${alpha}" stroke-width="1.5"/><path d="M12 12L${x} ${y}" stroke="${colors[index]}" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="${colors[index]}"/></svg>`;
}
function render(){
  const w=amos.world,s=amos.subject,g=s.glyph,o=w.observe();
  $('tick').textContent=w.tick;$('updates').textContent=s.updates+' updates';
  $('worldName').textContent=w.kind?'Sequence':'Inertial';
  $('obsA').textContent=fmt(o[0]);$('obsB').textContent=fmt(o[1]);$('load').textContent=fmt(o[2]);
  $('phase').textContent=w.kind?['Rest','First landmark','Second landmark','Decision','Consequence','Recovery'][w.tick%6]:'Continuous motion';
  $('action').textContent=last?'Action '+(last.action>0?'+':'')+last.action:'No action yet';
  let scene='<path d="M60 235H540" stroke="#e0e4e8"/><path d="M60 120H540" stroke="#edf0f2" stroke-dasharray="3 5"/>';
  if(w.kind){
    for(let k=0;k<2;k++){
      const x=210+180*k,y=205-135*Math.min(1,Math.max(0,o[k])),color=k?'#859e89':'#809cb6';
      scene+=`<line x1="${x}" y1="235" x2="${x}" y2="65" stroke="#e4e8eb"/><circle cx="${x}" cy="${y}" r="35" fill="${color}" opacity="${.25+.6*Math.min(1,Math.abs(o[k]))}"/><circle cx="${x}" cy="${y}" r="4" fill="white"/><text x="${x}" y="266" text-anchor="middle" fill="#8b9198" font-size="12">${k?'B':'A'}</text>`;
    }
  }else{
    const target=60+(w.target+1)*240;
    scene+=`<path d="M${target} 55V235" stroke="#c6cbd0" stroke-dasharray="4 5"/><text x="${target}" y="43" text-anchor="middle" fill="#8b9198" font-size="11">target</text>`;
    for(let k=0;k<2;k++){
      const x=60+(o[k]+1)*240,y=105+85*k;
      scene+=`<circle cx="${x}" cy="${y}" r="25" fill="${k?'#859e89':'#809cb6'}"/><text x="${x}" y="${y+4}" text-anchor="middle" fill="white" font-size="12">${k?'B':'A'}</text>`;
    }
  }
  $('world').innerHTML=scene;
  $('hidden').textContent=`Birth ${amos.birth.toString(16)} · actuator polarity ${w.polarity>0?'+1':'−1'}${w.kind?' · landmark order '+w.order:' · wired channel '+(w.controlled?'B':'A')}.`;
  $('neurons').innerHTML=s.h.map((v,i)=>`<div class="neuron" title="h${i}: ${fmt(v,5)}"><i style="height:${Math.max(2,Math.abs(v)*48)}%;${v>=0?'bottom:50%':'top:50%'};background:${v>=0?'#7f9bb7':'#abb8c4'}"></i></div>`).join('');
  $('alphabet').textContent=g.enabled?g.prototypes.length+' acquired glyphs':'Inactive in this world';
  document.querySelector('.note').textContent=g.enabled?'Glyphs are acquired from neural responses. No names, meanings or world labels are supplied.':'This world uses recurrent state and its learned readout. Glyph retrieval and its uncertainty are inactive.';
  $('events').innerHTML=Array.from({length:4},(_,t)=>{
    const row=g.sequence.slice(t*8,t*8+8),index=row.reduce((best,x,i)=>x>row[best]?i:best,0);
    return `<div class="event" title="${g.enabled===4?'Event':'Observation'} ${t+1}; ${g.duration[t]} samples">${glyph(index,g.duration[t]?1:.2)}<span>${g.duration[t]?g.duration[t]+'×':'—'}</span></div>`;
  }).join('');
  const r=last?.recognition??{ignorance:1,noise:0};
  $('ignorance').textContent=g.enabled?fmt(r.ignorance,2):'—';$('noise').textContent=g.enabled?fmt(r.noise,2):'—';
  $('ignoranceMeter').value=g.enabled?r.ignorance:0;$('noiseMeter').value=g.enabled?Math.min(1,r.noise):0;
  $('decisionTick').textContent=last?'tick '+last.tick:'—';
  $('expected').textContent=last?fmt(last.predicted[2]):'—';$('actual').textContent=last?fmt(last.next[2]):'—';
  $('error').textContent=last?fmt(Math.sqrt(last.next.reduce((sum,v,k)=>sum+(v-last.predicted[k])**2,0)/3)):'—';
  const rows=amos.memory,max=Math.max(1,...rows.map(t=>Math.abs(t.predicted[2]))),min=Math.min(0,...rows.map(t=>t.predicted[2]));
  const points=key=>rows.map((t,i)=>`${22+i*1056/127},${110-(t[key][2]-min)/(max-min)*90}`).join(' ');
  $('history').innerHTML=`<path d="M22 20H1078M22 65H1078M22 110H1078" stroke="#eef0f2"/><polyline points="${points('predicted')}" fill="none" stroke="#3478c7" stroke-width="1.4" opacity=".8"/><polyline points="${points('next')}" fill="none" stroke="#368777" stroke-width="1.7"/>`;
  $('restore').disabled=!checkpoint;
  const source=abandoned??amos;
  $('scar').disabled=!checkpoint||source.world.tick<=checkpoint.world.tick;
  $('checkpointLabel').textContent=checkpoint?'Moment retained at tick '+checkpoint.world.tick:'No moment retained';
}
$('play').onclick=()=>running?pause():play();
$('step').onclick=()=>{pause();advance(1);};
$('advance').onclick=()=>{pause();advance(120);};
$('speed').onchange=()=>{if(running)play();};
$('reverse').onclick=()=>{amos.world.polarity*=-1;message('The actuator law changed at tick '+amos.world.tick+'. Learned expectations are intact.');render();};
$('checkpoint').onclick=()=>{checkpoint=amos.clone();abandoned=null;$('branches').hidden=true;message('Kept the complete world, subject, history and random streams.');render();};
$('restore').onclick=()=>{
  pause();if(amos.world.tick>checkpoint.world.tick)abandoned=amos.clone();amos=checkpoint.clone();last=amos.memory.at(-1)??null;
  message('Restored tick '+amos.world.tick+'. The later experience is absent from this branch.');render();
};
$('scar').onclick=()=>{
  pause();const future=abandoned??amos;
  try{
    const scar=checkpoint.clone();scar.scar(future);
    // Counterfactual comparisons happen on copies, leaving the displayed past untouched.
    const cleanBranch=checkpoint.clone(),scarBranch=scar.clone();let clean=0,changed=0,scarLoad=0;
    for(let i=0;i<60;i++){
      const a=cleanBranch.step(null,false,0),b=scarBranch.step(null,false,0);
      clean+=a.next[2];scarLoad+=b.next[2];changed+=a.action!==b.action;
    }
    $('branches').hidden=false;
    $('branches').textContent=`60 frozen steps from the same past: mean load ${fmt(clean/60)} clean / ${fmt(scarLoad/60)} with scar. Actions differ on ${changed}/60 steps. Neither branch is guaranteed to be better.`;
    amos=scar;last=amos.memory.at(-1)??null;abandoned=future.clone();
    message('Past restored with learned future associations. World, live neural state and random streams stay in the past.');render();
  }catch(e){message(e.message);}
};
$('settingsToggle').onclick=()=>{const open=$('settings').hidden;$('settings').hidden=!open;$('settingsToggle').setAttribute('aria-expanded',String(open));};
$('birth').onclick=()=>{
  try{
    const seed=BigInt($('seed').value),explore=Number($('explore').value);
    if(seed<0n||seed>0xffffffffffffffffn||!Number.isFinite(explore)||explore<0||explore>1)throw Error('Use a uint64 seed and exploration between 0 and 1.');
    pause();amos=new AMOS.Amos(seed,Number($('kind').value),Number($('glyphMode').value));checkpoint=abandoned=last=null;
    $('branches').hidden=true;message('A new birth. Random recurrent connections; no learned experience.');render();
  }catch(e){message(e.message);}
};
$('download').onclick=()=>{
  const url=URL.createObjectURL(new Blob([amos.dumps()+'\n'],{type:'application/json'}));
  const link=document.createElement('a');link.href=url;link.download=`amos-${amos.world.tick}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
$('upload').onclick=()=>$('file').click();
$('file').onchange=async()=>{
  try{
    const file=$('file').files[0];if(!file)return;
    if(file.size>4000000)throw Error('Snapshot exceeds 4 MB.');
    const loaded=AMOS.Amos.loads(await file.text());pause();amos=loaded;checkpoint=abandoned=null;last=amos.memory.at(-1)??null;
    $('kind').value=amos.world.kind;$('glyphMode').value=amos.subject.glyph.enabled||4;$('seed').value=amos.seed.toString();
    $('branches').hidden=true;message('Restored complete state from file.');render();
  }catch(e){message('Import rejected: '+e.message);}finally{$('file').value='';}
};
render();
