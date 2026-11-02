/* Acquired attention and predictions of the subject's own response to a read.
 * All inputs are explicit; no host clock, I/O, RNG or presentation state. */
const COGNITION = (() => {
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x)),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/Math.max(1,a.length));
  const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
  const finite=a=>Array.isArray(a)&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<1e6);
  function category(event){
    return event.kind==='message'||event.kind==='llm'&&event.detail.acquisition==='bridge'?'interaction':
      event.kind==='inference'?'derived-reading':'source-report';
  }
  function registration(event,ledger,version=2){
    const all=ledger.entries();
    const base={policy:'amos/registration-v1',category:category(event),subject:event.subject,source:event.source,
      worldAt:event.observedAt,receivedAt:event.receivedAt,acquiredVia:event.detail.acquisition??'adapter',origin:event.detail.origin??null,premises:event.factIds.map(id=>all.findIndex(f=>f.id===id))};
    if(version===1)return base;
    delete base.source;base.policy='amos/registration-v2';base.sensory=event.sensory.slice();base.glyphs=[...new Set(event.detail.contentGlyphs??event.glyphs)];return base;
  }
  function link(event,history,voice,ledger){
    const incoming=[...new Set(event.detail.contentGlyphs??event.glyphs)],window=history.slice(-64),all=ledger.entries();
    const contexts=window.map(t=>({trace:t,glyphs:[...new Set(t.event.detail.contentGlyphs??t.event.glyphs)]}));
    const weight=g=>1+Math.log((1+contexts.length)/(1+contexts.filter(c=>c.glyphs.includes(g)).length));
    const matches=contexts.map(({trace,glyphs})=>{
      const shared=incoming.filter(g=>glyphs.includes(g)),union=[...new Set([...incoming,...glyphs])];
      const similarity=shared.reduce((s,g)=>s+weight(g),0)/Math.max(1,union.reduce((s,g)=>s+weight(g),0));
      return {tick:trace.tick,id:trace.event.id,anchor:all.findIndex(f=>f.id===trace.event.factIds[0]),
        registration:all.findIndex(f=>f.id===trace.event.registrationReceipt),shared,similarity,sensory:trace.event.sensory.slice()};
    }).filter(m=>m.shared.length).sort((a,b)=>b.similarity-a.similarity||b.tick-a.tick).slice(0,3).map(({shared,...m})=>({...m,sharedSample:shared.slice(0,12),sharedCount:shared.length}));
    const matched=incoming.filter(g=>contexts.some(c=>c.glyphs.includes(g))),strength=matches[0]?.similarity??0,sensory=[0,0];
    const mass=matches.reduce((s,m)=>s+m.similarity,0);
    if(mass)for(const m of matches)for(let i=0;i<2;i++)sensory[i]+=strength*m.similarity*m.sensory[i]/mass;
    const evidence=matched.map(g=>{const c=contexts.find(c=>c.glyphs.includes(g));return [g,all.findIndex(f=>f.id===c.trace.event.factIds[0]),all.findIndex(f=>f.id===c.trace.event.registrationReceipt)];});
    return {policy:'amos/encounter-links-v1',evidence,considered:window.length,incoming,known:incoming.filter(g=>voice.uni[g]>0),
      novel:incoming.filter(g=>voice.uni[g]===0),matched,unmatched:incoming.filter(g=>!matched.includes(g)),matches,strength,sensory};
  }
  function measure(before,after,worldObservation,readObservation){
    return [mean(after),rms(after),rms(after.map((v,i)=>v-before[i])),rms(readObservation.slice(0,2).map((v,i)=>v-worldObservation[i]))];
  }
  class FactMind {
    constructor(width=40){
      this.width=width;this.weights=Array.from({length:4},()=>Array(width+6).fill(0));
      this.updates=0;this.kinds=[];this.focus=[];this.lastError=0;this.errorMean=0;this.lastSelf=null;
    }
    forecast(h,action,load,resonance,familiarity,surprise){
      const features=[1,...h,action,load,resonance,familiarity,Math.tanh(surprise)];
      const expected=this.weights.map((row,k)=>clamp(row.reduce((s,v,i)=>s+v*features[i],0),k===0?-1:0,k===0?1:2));
      return {features,expected,updatesBefore:this.updates};
    }
    learn(prediction,observed,event,worldSurprise){
      const delta=observed.map((v,k)=>v-prediction.expected[k]),error=rms(delta);
      const rate=.18/(1+prediction.features.reduce((s,v)=>s+v*v,0));
      this.weights=this.weights.map((row,k)=>row.map((v,i)=>v+rate*delta[k]*prediction.features[i]));
      this.updates++;this.focus=[...new Set(event.detail.contentGlyphs??event.glyphs)];this.lastError=error;this.errorMean+=.08*(error-this.errorMean);
      let stats=this.kinds.find(x=>x.kind===event.kind);
      if(!stats){if(this.kinds.length===32)this.kinds.sort((a,b)=>a.last-b.last).shift();stats={kind:event.kind,count:0,impact:0,last:0};this.kinds.push(stats);}
      stats.count++;stats.last=this.updates;
      const impact=Math.tanh(.5*worldSurprise+.5*observed[2]+error);
      stats.impact+=(impact-stats.impact)/Math.min(16,stats.count);
      return error;
    }
    rank(queue,voice,ledger,preferred,count,selectedId,controls={novelty:1}){
      const all=ledger.entries(),replaced=new Set(all.map(f=>f.supersedes));
      const ranked=queue.map((event,index)=>{
        const stats=this.kinds.find(x=>x.kind===event.kind),prior=stats?.impact??0;
        const glyphs=event.detail.contentGlyphs??event.glyphs,contextRelevance=glyphs.filter(g=>this.focus.includes(g)).length/Math.max(1,glyphs.length);
        const novelty=1-voice.resonance(event.detail.contentGlyphs??event.glyphs);
        const revision=event.detail.archivedVersion||event.factIds.some(id=>all.find(f=>f.id===id)?.supersedes!==null)?1:0;
        const stale=event.factIds.every(id=>replaced.has(id));
        const waiting=Math.max(0,count-(event.acceptedAtCount??0));
        const uncertainty=1/Math.sqrt(1+(stats?.count??0));
        const selfNeed=this.updates?this.lastError/(.05+this.errorMean):0;
        const evidenceNeed=Math.min(1,selfNeed)*revision;
        const score=.35*prior+.2*controls.novelty*novelty+.15*uncertainty+.2*revision+.08*Math.log1p(waiting)+
          .08*evidenceNeed+.1*contextRelevance+(event.kind===preferred?.08:0)-(stale?.1:0);
        return {id:event.id,index,score,priorImpact:prior,novelty,revision,waiting,uncertainty,evidenceNeed,contextRelevance,stale};
      }).sort((a,b)=>b.score-a.score||a.index-b.index);
      const explicit=ranked.find(x=>x.id===selectedId),chosen=explicit??ranked[0];
      return chosen?{policy:'amos/acquired-attention-v1',mode:explicit?'explicit':'acquired',selected:chosen,
        candidates:ranked.length,noveltyGain:controls.novelty,alternatives:ranked.filter(x=>x.id!==chosen.id).slice(0,3)}:null;
    }
    readScope(action){
      return this.lastSelf!==null&&this.updates>=2&&action<0&&this.lastError>this.errorMean?'self':'world';
    }
    dump(){return copy(this);}
    static load(d,width=40){
      if(d&&d.focus===undefined)d={...d,focus:[]};
      if(!d||!Array.isArray(d.focus)||d.focus.length>88||!d.focus.every(g=>Number.isSafeInteger(g)&&g>=0&&g<88)||d.width!==width||!Array.isArray(d.weights)||d.weights.length!==4||
        !d.weights.every(r=>finite(r)&&r.length===width+6)||!Number.isSafeInteger(d.updates)||d.updates<0||
        !Array.isArray(d.kinds)||d.kinds.length>32||new Set(d.kinds.map(k=>k.kind)).size!==d.kinds.length||
        !d.kinds.every(k=>typeof k.kind==='string'&&Number.isSafeInteger(k.count)&&k.count>0&&Number.isFinite(k.impact)&&k.impact>=0&&k.impact<=1&&Number.isSafeInteger(k.last)&&k.last>0&&k.last<=d.updates)||
        !Number.isFinite(d.lastError)||d.lastError<0||!Number.isFinite(d.errorMean)||d.errorMean<0||
        !(d.lastSelf===null||typeof d.lastSelf==='string'))throw Error('Invalid acquired self model');
      return Object.assign(new FactMind(width),copy(d));
    }
  }
  const readTools=['lalo_history','lalo_lineage','lalo_facts'],readPolicy='amos/read-consequence-v1';
  const readFeatures=(h,load,resonance,familiarity,surprise,revision)=>[1,mean(h),rms(h),load,resonance,familiarity,Math.tanh(surprise),revision?1:0];
  const scoreRead=(expected,updates)=>.5*(expected[0]+expected[1])+.5/Math.sqrt(1+updates);
  class ReadMind {
    constructor(){
      this.policy=readPolicy;this.enabled=true;this.updates=0;this.seen=[];
      this.heads=Object.fromEntries(readTools.map(tool=>[tool,{weights:Array.from({length:2},()=>Array(9).fill(0)),updates:0}]));
    }
    plan(proposals,features,preferred,forced=false){
      if(!this.enabled)return null;
      const candidates=proposals.map(p=>{
        const head=this.heads[p.tool],f=features.concat(p.scope==='self'?1:0);
        const expected=head.weights.map(row=>clamp(row.reduce((s,v,i)=>s+v*f[i],0),0,1));
        return {tool:p.tool,scope:p.scope,expected,updatesBefore:head.updates,score:scoreRead(expected,head.updates)};
      });
      const selected=forced?candidates.find(c=>c.tool===preferred):candidates.slice().sort((a,b)=>b.score-a.score||(a.tool===preferred?-1:b.tool===preferred?1:readTools.indexOf(a.tool)-readTools.indexOf(b.tool)))[0];
      return {policy:readPolicy,mode:forced?'investigation':'acquired',features:features.slice(),preferred,selected:copy(selected),alternatives:candidates.filter(c=>c.tool!==selected.tool)};
    }
    learn(decision,reading,ledger,effect){
      const head=this.heads[decision.selected.tool],rows=ledger.entries(),premises=[...new Set(reading.premises)];
      const novel=premises.filter(i=>!this.seen.includes(rows[i].id)),observed=[Math.tanh(4*effect),premises.length?novel.length/premises.length:0];
      const delta=observed.map((v,i)=>v-decision.selected.expected[i]),f=decision.features.concat(decision.selected.scope==='self'?1:0),rate=.3/(1+f.reduce((s,v)=>s+v*v,0));
      head.weights=head.weights.map((row,k)=>row.map((v,i)=>v+rate*delta[k]*f[i]));head.updates++;this.updates++;
      for(const i of premises){const id=rows[i].id;this.seen=this.seen.filter(x=>x!==id);this.seen.push(id);}this.seen=this.seen.slice(-512);
      decision.outcome={effect,novelPremises:novel,total:premises.length,observed,error:rms(delta)};
      return decision;
    }
    dump(){return copy(this);}
    static load(d){
      if(!d||d.policy!==readPolicy||typeof d.enabled!=='boolean'||!Number.isSafeInteger(d.updates)||d.updates<0||
        !d.heads||Object.keys(d.heads).length!==3||!readTools.every(tool=>{const h=d.heads[tool];return h&&Number.isSafeInteger(h.updates)&&h.updates>=0&&
          Array.isArray(h.weights)&&h.weights.length===2&&h.weights.every(row=>finite(row)&&row.length===9);})||
        readTools.reduce((n,tool)=>n+d.heads[tool].updates,0)!==d.updates||!Array.isArray(d.seen)||d.seen.length>512||
        new Set(d.seen).size!==d.seen.length||!d.seen.every(id=>typeof id==='string'&&id.length>0&&id.length<=512))throw Error('Invalid acquired read consequences');
      return Object.assign(new ReadMind(),copy(d));
    }
  }
  function validateRead(trace,ledger){
    const d=trace.selection?.read;if(!d)return;
    const r=d.outcome,all=ledger.entries(),revision=trace.event.detail.archivedVersion||trace.event.factIds.some(id=>all.find(f=>f.id===id)?.supersedes!==null);
    const features=readFeatures(trace.worldAfter,trace.load,trace.resonance,trace.relations.familiarity,trace.surprise,revision),candidates=[d.selected,...d.alternatives??[]];
    const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(a),Math.abs(b));
    if(d.policy!==readPolicy||!['acquired','investigation'].includes(d.mode)||!readTools.includes(d.preferred)||!finite(d.features)||d.features.length!==8||
      !features.every((v,i)=>close(v,d.features[i]))||candidates.length!==3||new Set(candidates.map(c=>c.tool)).size!==3||
      !candidates.every(c=>readTools.includes(c.tool)&&['world','self'].includes(c.scope)&&finite(c.expected)&&c.expected.length===2&&c.expected.every(v=>v>=0&&v<=1)&&
        Number.isSafeInteger(c.updatesBefore)&&c.updatesBefore>=0&&close(c.score,scoreRead(c.expected,c.updatesBefore)))||
      d.selected.tool!==trace.tool.name||d.selected.scope!==trace.selfReflection.scope||
      d.mode!==(trace.investigation?'investigation':'acquired')||d.mode==='investigation'&&d.selected.tool!==d.preferred||
      d.mode==='acquired'&&candidates.some(c=>c.score>d.selected.score+1e-12)||
      !r||!close(r.effect,trace.transitions[1].control.effect)||!finite(r.observed)||r.observed.length!==2||
      !Array.isArray(r.novelPremises)||new Set(r.novelPremises).size!==r.novelPremises.length||
      !r.novelPremises.every(i=>trace.reading.premises.includes(i))||r.total!==new Set(trace.reading.premises).size||
      !close(r.observed[0],Math.tanh(4*r.effect))||!close(r.observed[1],r.total?r.novelPremises.length/r.total:0)||
      !close(r.error,rms(r.observed.map((v,i)=>v-d.selected.expected[i]))))throw Error('Read consequence differs from its executed decision');
  }
  return {FactMind,ReadMind,readFeatures,validateRead,category,registration,link,measure,rms};
})();
