/* Acquired relations, carried by the standalone heart. Geometry and clocks
 * are derived from source receipts; familiarity and transition expectation
 * are learned from encountered relations. No timers, I/O or presentation. */
const RELATIONS = (() => {
  'use strict';
  const LIMIT=16, WINDOW=64, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const copy=x=>JSON.parse(JSON.stringify(x));
  const signedLog=x=>Math.sign(x)*Math.log1p(Math.abs(x))/Math.log1p(86400000);
  const rows=()=>Array.from({length:LIMIT},()=>Array(LIMIT).fill(0));
  const vector=a=>Array.isArray(a)&&a.length===6&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<=1);
  function distance(a,b) {
    const rad=Math.PI/180,dl=(b[0]-a[0])*rad,dn=(b[1]-a[1])*rad;
    const h=Math.sin(dl/2)**2+Math.cos(a[0]*rad)*Math.cos(b[0]*rad)*Math.sin(dn/2)**2;
    return 12742*Math.asin(Math.sqrt(clamp(h,0,1)));
  }
  function context(event,ledger) {
    const facts=event.factIds.map(id=>ledger.entries().find(f=>f.id===id));
    const values=Object.fromEntries(facts.map(f=>[f.predicate,f.value]));
    const geo=Number.isFinite(values.latitude)&&Math.abs(values.latitude)<=90&&Number.isFinite(values.longitude)&&Math.abs(values.longitude)<=180?[values.latitude,values.longitude]:null;
    return {id:event.id,kind:event.kind,subject:event.subject,source:event.source,at:event.observedAt,receivedAt:event.receivedAt,
      anchor:event.factIds[0],geo,glyphs:[...new Set(event.detail.contentGlyphs??event.glyphs)],
      magnitude:typeof values.magnitude==='number'?values.magnitude:null,
      revised:!!event.detail.archivedVersion||facts.some(f=>f.supersedes!==null),part:Number.isSafeInteger(values.part)?values.part:null,
      document:typeof values.name==='string'?`${values.name}:${values.modified_at??''}`:null,
      ...(event.kind==='temporal'?{temporal:{role:values.role,gap:values.calendar_gap,daysToHebrew:values.days_to_yahrzeit,daysToGregorian:values.days_to_gregorian}}:{})};
  }
  class RelationField {
    constructor(){this.patterns=[];this.transitions=rows();this.recent=[];this.lastPattern=null;this.seen=0;}
    observe(event,ledger) {
      const c=context(event,ledger),previous=this.recent.at(-1),same=this.recent.findLast(x=>x.kind===c.kind&&(!c.temporal||x.temporal?.role===c.temporal.role));
      const priorVersion=this.recent.findLast(x=>x.subject===c.subject&&x.source===c.source);
      const device=this.recent.findLast(x=>x.kind==='device'&&x.geo);
      const spatial=(c.geo&&same?.geo)?distance(same.geo,c.geo):null;
      const deviceDistance=c.geo&&device?.geo?distance(device.geo,c.geo):null;
      const gap=same?c.at-same.at:null;
      const oldGlyphs=new Set(previous?.glyphs??[]),all=new Set([...oldGlyphs,...c.glyphs]);
      const overlap=previous&&all.size?c.glyphs.filter(g=>oldGlyphs.has(g)).length/all.size:0;
      const revisionDelta=c.revised&&c.magnitude!==null&&priorVersion?.magnitude!==null&&priorVersion?.magnitude!==undefined?c.magnitude-priorVersion.magnitude:null;
      const fragmentGap=c.document&&same?.document===c.document&&c.part!==null&&same.part!==null?c.part-same.part:null;
      const features=[gap===null?0:clamp(signedLog(gap),-1,1),spatial===null?0:Math.exp(-spatial/500),
        previous?(previous.kind===c.kind?1:-1):0,overlap,
        revisionDelta!==null?Math.tanh(revisionDelta):fragmentGap!==null?Math.tanh(fragmentGap/2):0,
        deviceDistance===null?0:Math.exp(-deviceDistance/500)];
      if(c.temporal){features[4]=c.temporal.gap??0;features[5]=typeof c.temporal.daysToHebrew==='number'&&typeof c.temporal.daysToGregorian==='number'?
        Math.exp(-Math.min(c.temporal.daysToHebrew,c.temporal.daysToGregorian)/32):-1;}
      const d=this.patterns.map(p=>p.center.reduce((s,v,i)=>s+(v-features[i])**2,0)/6);
      const nearest=d.length?d.indexOf(Math.min(...d)):-1;
      const familiarity=nearest<0?0:Math.exp(-d[nearest]/.08);
      const known=nearest>=0&&d[nearest]<=.08;
      const transitionRow=this.lastPattern===null?null:this.transitions[this.lastPattern];
      const transitionMass=transitionRow?transitionRow.reduce((s,n)=>s+n,0):0;
      const transitionSupport=known&&transitionRow?transitionRow[nearest]:0;
      const expectation=transitionMass?transitionSupport/transitionMass:0;
      const priorSupport=known?this.patterns[nearest].mass:0;
      // The acquired channel reads the state BEFORE the current relation is learned.
      const drive=[features[0],features[1],features[2],features[3],features[4],features[5],familiarity,expectation];
      const active=!!previous,projection=[0,0];
      if(active)for(let i=0;i<drive.length;i++){
        projection[0]+=drive[i]*Math.cos((i+1)*2.3999632297)/drive.length;
        projection[1]+=drive[i]*Math.sin((i+1)*2.3999632297)/drive.length;
      }
      let chosen=nearest;
      if(!known&&this.patterns.length<LIMIT){chosen=this.patterns.length;this.patterns.push({center:features.slice(),mass:0});}
      const pattern=this.patterns[chosen];pattern.mass++;
      const alpha=1/Math.min(64,pattern.mass);
      pattern.center=pattern.center.map((v,i)=>v+alpha*(features[i]-v));
      if(this.lastPattern!==null)this.transitions[this.lastPattern][chosen]++;
      this.lastPattern=chosen;this.seen++;this.recent.push(c);if(this.recent.length>WINDOW)this.recent.shift();
      const anchors=[c.anchor,same?.anchor,device?.anchor,previous?.anchor,priorVersion?.anchor].filter(Boolean);
      const evidence=[...new Set(anchors)];
      return {policy:c.temporal?'amos/relations-time-v1':'amos/relations-v1',pattern:chosen,priorSupport,familiarity,expectation,transitionSupport,transitionMass,
        gapMs:gap,spatialKm:spatial,deviceKm:deviceDistance,glyphOverlap:overlap,revisionDelta,fragmentGap,
        features,projection,rawSensory:event.sensory.slice(),
        sensory:event.sensory.map((v,i)=>clamp(v+.35*projection[i],-1,1)),
        evidence,context:c.id,previous:previous?.id??null,patterns:this.patterns.length};
    }
    dump(){return copy(this);}
    static load(d,ledger){
      if(!d||!Number.isSafeInteger(d.seen)||d.seen<0||!Array.isArray(d.patterns)||d.patterns.length>LIMIT||
        !d.patterns.every(p=>p&&vector(p.center)&&Number.isSafeInteger(p.mass)&&p.mass>0)||
        !Array.isArray(d.transitions)||d.transitions.length!==LIMIT||!d.transitions.every(r=>Array.isArray(r)&&r.length===LIMIT&&r.every(n=>Number.isSafeInteger(n)&&n>=0))||
        !Number.isSafeInteger(d.recentBirth??0)||(d.recentBirth??0)<0||(d.recentBirth??0)>d.seen||
        !Array.isArray(d.recent)||d.recent.length>WINDOW||d.recent.length!==Math.min(WINDOW,d.seen-(d.recentBirth??0))||
        !d.recent.every(c=>c&&typeof c.id==='string'&&typeof c.kind==='string'&&typeof c.subject==='string'&&typeof c.source==='string'&&Number.isSafeInteger(c.at)&&Number.isSafeInteger(c.receivedAt)&&
          ledger.entries().some(f=>f.id===c.anchor&&f.subject===c.subject&&f.source===c.source&&f.recordedAt===c.receivedAt)&&
          (c.geo===null||Array.isArray(c.geo)&&c.geo.length===2&&c.geo.every(Number.isFinite)&&Math.abs(c.geo[0])<=90&&Math.abs(c.geo[1])<=180)&&
          Array.isArray(c.glyphs)&&c.glyphs.length<=132&&c.glyphs.every(g=>Number.isSafeInteger(g)&&g>=0&&g<88))||
        (d.seen===0?d.lastPattern!==null:!Number.isSafeInteger(d.lastPattern)||d.lastPattern<0||d.lastPattern>=d.patterns.length)||
        d.patterns.reduce((s,p)=>s+p.mass,0)!==d.seen||d.transitions.flat().reduce((s,n)=>s+n,0)!==Math.max(0,d.seen-1))throw Error('Invalid acquired relation field');
      return Object.assign(new RelationField(),copy(d));
    }
  }
  return {RelationField,distance,context,LIMIT,WINDOW};
})();
