/* Predictions and interventions over the subject's actual state transitions.
 * NETTA.SONAR informs the trace-driven view; this organ learns AMOS's own body.
 * No clock, presentation, source acquisition or random draw occurs here. */
const TRANSITIONS = (() => {
  'use strict';
  const phases=['world','read','return'],copy=x=>JSON.parse(JSON.stringify(x));
  const rms=a=>Math.sqrt(a.reduce((s,v)=>s+v*v,0)/Math.max(1,a.length));
  const mean=a=>a.reduce((s,v)=>s+v,0)/Math.max(1,a.length);
  const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(a),Math.abs(b));
  const vector=(a,n)=>Array.isArray(a)&&a.length===n&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<1e6);
  const same=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>close(v,b[i]));
  const measure=(before,after)=>[mean(after),rms(after),rms(after.map((v,i)=>v-before[i]))];
  const features=(before,observation,action,signal)=>[1,...before,...observation,action,Math.tanh(signal)];
  class TransitionMind {
    constructor(width=40){
      this.width=width;this.heads=Object.fromEntries(phases.map(phase=>[phase,{weights:Array.from({length:3},()=>Array(width+6).fill(0)),updates:0,errorMean:0,lastError:0}]));
      this.last=[];this.lastProbe=-2;
    }
    forecast(phase,before,observation,action,signal){
      const head=this.heads[phase],f=features(before,observation,action,signal);
      const expected=head.weights.map((row,k)=>Math.max(k===0?-2:0,Math.min(k===0?2:3,row.reduce((s,v,i)=>s+v*f[i],0))));
      return {phase,before:before.slice(),observation:observation.slice(),action,signal,expected,updatesBefore:head.updates};
    }
    learn(prediction,after,premises,control=null){
      const head=this.heads[prediction.phase],observed=measure(prediction.before,after),delta=observed.map((v,i)=>v-prediction.expected[i]),error=rms(delta);
      const f=features(prediction.before,prediction.observation,prediction.action,prediction.signal),rate=.18/(1+f.reduce((s,v)=>s+v*v,0));
      const baseline=head.errorMean;
      head.weights=head.weights.map((row,k)=>row.map((v,i)=>v+rate*delta[k]*f[i]));
      head.updates++;head.lastError=error;head.errorMean+=.08*(error-head.errorMean);
      return {policy:'amos/transition-v1',...copy(prediction),after:after.slice(),observed,error,baseline,premises:premises.slice(),control:control?{
        observation:control.observation.slice(),after:control.after.slice(),steps:control.steps,
        effect:rms(after.map((v,i)=>v-control.after[i]))}:null};
    }
    remember(records,receipts,tick,ledger,probe){
      const rows=ledger.entries();this.last=records.map((r,i)=>({phase:r.phase,id:receipts[i],tick,error:r.error,
        premise:rows.findIndex(f=>f.id===receipts[i]),sourcePremise:r.premises[0]??null}));
      if(probe)this.lastProbe=this.heads.world.updates;
    }
    plan(ledger,knownAt){
      const age=this.heads.world.updates;if(age<3||age-this.lastProbe<2)return null;
      const candidates=this.last.filter(r=>r.error>.04&&r.error>1.25*this.heads[r.phase].errorMean)
        .sort((a,b)=>b.error/(.02+this.heads[b.phase].errorMean)-a.error/(.02+this.heads[a.phase].errorMean));
      const previous=candidates[0];if(!previous)return null;
      const rows=ledger.entries(),anchor=rows[previous.phase==='world'?previous.sourcePremise:previous.premise];if(!anchor)return null;
      const target=previous.phase==='world'?rows.findLast(f=>f.subject===anchor.subject&&f.predicate===anchor.predicate&&f.source===anchor.source&&f.recordedAt<=knownAt):anchor;
      return {policy:'amos/transition-probe-v1',phase:previous.phase,fromTick:previous.tick,error:previous.error,
        baseline:this.heads[previous.phase].errorMean,premise:rows.findIndex(f=>f.id===target.id),scope:previous.phase==='world'?'world':'self',
        tool:'lalo_lineage',arguments:{id:target.id,knownAt,offset:ledger.lineage(target.id).length-1,limit:1}};
    }
    dump(){return copy(this);}
    static load(d,width=40){
      if(!d||d.width!==width||!d.heads||Object.keys(d.heads).length!==3||!phases.every(p=>{
        const h=d.heads[p];return h&&Array.isArray(h.weights)&&h.weights.length===3&&h.weights.every(row=>vector(row,width+6))&&
          Number.isSafeInteger(h.updates)&&h.updates>=0&&Number.isFinite(h.errorMean)&&h.errorMean>=0&&Number.isFinite(h.lastError)&&h.lastError>=0;
      })||!Array.isArray(d.last)||![0,3].includes(d.last.length)||!Number.isSafeInteger(d.lastProbe)||d.lastProbe< -2||d.lastProbe>d.heads.world.updates||
        !d.last.every((r,i)=>r.phase===phases[i]&&typeof r.id==='string'&&Number.isSafeInteger(r.tick)&&r.tick>0&&Number.isSafeInteger(r.premise)&&r.premise>=0&&Number.isFinite(r.error)&&r.error>=0&&
          (r.sourcePremise===null||Number.isSafeInteger(r.sourcePremise)&&r.sourcePremise>=0)))throw Error('Invalid acquired transition model');
      return Object.assign(new TransitionMind(width),copy(d));
    }
  }
  function validate(trace,ledger,width=40,birth){
    const records=trace.transitions,rows=ledger.entries(),legacy=trace.receiptState==='legacy-full-journal'&&trace.event.legacyCompletion===true;
    if(!Array.isArray(records)||records.length!==3||!Array.isArray(trace.transitionReceipts)||trace.transitionReceipts.length!==3||
      !Array.isArray(trace.trajectory)||trace.trajectory.length!==3+trace.selfReflection.passes.length)throw Error('Invalid transition trace');
    const states=[trace.before,trace.worldAfter,trace.readAfter,trace.after];
    for(let i=0;i<3;i++){
      const r=records[i],index=rows.findIndex(f=>f.id===trace.transitionReceipts[i]),receipt=rows[index];
      if(r?.policy!=='amos/transition-v1'||r.phase!==phases[i]||!vector(r.before,width)||!vector(r.after,width)||
        !same(r.before,states[i])||!same(r.after,states[i+1])||!vector(r.observation,3)||![-1,0,1].includes(r.action)||!Number.isFinite(r.signal)||
        !same(r.observation,i===0?trace.observed:trace.readObservation)||i>0&&r.action!==trace.action||
        !vector(r.expected,3)||!same(r.observed,measure(r.before,r.after))||!close(r.error,rms(r.observed.map((v,k)=>v-r.expected[k])))||
        !Number.isFinite(r.baseline)||r.baseline<0||!Number.isSafeInteger(r.updatesBefore)||r.updatesBefore<0||
        (birth!==undefined&&trace.tick>birth&&r.updatesBefore!==trace.tick-birth-1)||
        !Array.isArray(r.premises)||!r.premises.every(n=>Number.isSafeInteger(n)&&n>=0&&!!rows[n]&&(legacy||n<index)&&rows[n].recordedAt<=trace.encounterAt)||
        (!legacy&&(!receipt||receipt.source!=='amos:transition/v1'||receipt.value!==JSON.stringify(r))))throw Error('Transition differs from its state or premises');
      if(i===0&&r.control!==null||i>0&&(!r.control||!vector(r.control.after,width)||!same(r.control.observation,i===1?trace.observed:trace.readObservation)||
        r.control.steps!==(i===1?1:trace.selfReflection.passes.length)||!close(r.control.effect,rms(r.after.map((v,k)=>v-r.control.after[k])))))throw Error('Invalid controlled transition');
    }
    const labels=['before','world','read',...trace.selfReflection.passes.map((p,i)=>'return-'+(i+1))];
    const anchors=[trace.before,trace.worldAfter,trace.readAfter];
    if(!trace.trajectory.every((node,i)=>node.name===labels[i]&&vector(node.h,width)&&(i>=3||same(node.h,anchors[i])))||
      !same(trace.trajectory.at(-1).h,trace.after))throw Error('Trajectory differs from the acquired states');
    for(let i=3;i<trace.trajectory.length;i++)if(!close(rms(trace.trajectory[i].h.map((v,k)=>v-trace.trajectory[i-1].h[k])),trace.selfReflection.passes[i-3].shift))throw Error('Return trajectory differs from its measured shift');
    const probe=trace.investigation;
    if(trace.selection.investigation!==undefined&&JSON.stringify(trace.selection.investigation)!==JSON.stringify(probe))throw Error('Investigation differs from its archived attention decision');
    if(probe!==null&&(!probe||probe.policy!=='amos/transition-probe-v1'||!phases.includes(probe.phase)||!Number.isSafeInteger(probe.fromTick)||probe.fromTick>=trace.tick||
      !Number.isSafeInteger(probe.premise)||!rows[probe.premise]||rows[probe.premise].id!==probe.arguments?.id||
      probe.scope!==(probe.phase==='world'?'world':'self')||probe.tool!==trace.tool.name||JSON.stringify(probe.arguments)!==JSON.stringify(trace.tool.arguments)||!records[1].premises.includes(probe.premise)))throw Error('Invalid self investigation');
  }
  return {TransitionMind,phases,measure,validate,rms};
})();
