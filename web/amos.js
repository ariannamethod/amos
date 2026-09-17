/* AMOS — Arianna Method Ontological Subjectivity. No runtime dependencies.
 * Same recurrent field and acquired readout as amos.c and ports/amos.py.
 * Usable as a browser global or a Node module. Never reads DOM or host time.
 */
'use strict';
const AMOS = (() => {
const H=24, F=54, G=8, L=4, K=32, E=64, MASK=(1n<<64n)-1n;
const zeros=n=>Array(n).fill(0), matrix=(n,m)=>Array.from({length:n},()=>zeros(m));
const clip=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
const sum=a=>a.reduce((s,x)=>s+x,0);
const argmax=a=>a.reduce((b,x,i)=>x>a[b]?i:b,0);
function mix64(x) {
  x=(BigInt(x)+0x9e3779b97f4a7c15n)&MASK;
  x=((x^(x>>30n))*0xbf58476d1ce4e5b9n)&MASK;
  x=((x^(x>>27n))*0x94d049bb133111ebn)&MASK;
  return x^(x>>31n);
}
class Random {
  constructor(state) { this.state=BigInt(state); }
  next() {
    let x=this.state; x^=x>>12n; x^=(x<<25n)&MASK; x^=x>>27n;
    this.state=x; return (x*0x2545f4914f6cdd1dn)&MASK;
  }
  uniform() { return Number(this.next()>>11n)*2**-53; }
  signed() { return 2*this.uniform()-1; }
  toJSON() { return {random64:this.state.toString(16).padStart(16,'0')}; }
}
class Glyphs {
  constructor(enabled=0) {
    Object.assign(this,{enabled,learning:1,anchored:0,anchor:zeros(2),prototypes:[],
      sequence:zeros(K),familiarity:zeros(L),duration:zeros(L),evidence:[],clock:0});
  }
  observe(signature) {
    const distance=this.prototypes.map(p=>sum(p.map((v,j)=>(signature[j]-v)**2/H)));
    let best=Math.min(...distance);
    if(this.learning && this.prototypes.length<G && best>.025) {
      this.prototypes.push(signature.slice());distance.push(0);best=0;
    }
    let mixture=distance.map(d=>Math.exp(-(d-best)/.008)), total=sum(mixture);
    if(total) mixture=mixture.map(p=>p/total);
    mixture.push(...zeros(G-mixture.length));
    const repeat=this.enabled===4 && this.duration[L-1] && best<=.025 &&
      argmax(mixture)===argmax(this.sequence.slice(-G));
    if(!repeat) {
      this.sequence=this.sequence.slice(G).concat(zeros(G));
      this.familiarity=this.familiarity.slice(1).concat(0);
      this.duration=this.duration.slice(1).concat(0);
    }
    this.duration[L-1]=Math.min(Number.MAX_SAFE_INTEGER,this.duration[L-1]+1);
    this.familiarity[L-1]=Math.exp(-best/.025);
    this.sequence.splice(K-G,G,...mixture);
  }
  similarity(a,b) {
    let d=0;
    if(this.enabled===2) {
      for(let i=0;i<G;i++) {
        let x=0;for(let t=0;t<L;t++) x+=a[t*G+i]-b[t*G+i];d+=x*x/(L*L);
      }
    } else for(let i=0;i<K;i++) {const x=a[i]-b[i];d+=x*x/L;}
    return Math.exp(-d/.08);
  }
  predict(action) {
    let familiarity=1, support=0, similarity=0, variance=0;
    for(const f of this.familiarity) familiarity*=f;
    familiarity=Math.sqrt(Math.sqrt(familiarity));
    const delta=zeros(3),weights=[];
    for(const e of this.evidence) {
      let match=familiarity*this.similarity(this.sequence,e.key);
      if(Math.abs(e.action-action)>.25) match=0;
      similarity=Math.max(similarity,match);
      const w=match*e.mass;weights.push(w);support+=w;
      for(let k=0;k<3;k++) delta[k]+=w*e.mean[k];
    }
    if(support>1e-12) {
      for(let k=0;k<3;k++) delta[k]/=support;
      this.evidence.forEach((e,i)=>{variance+=weights[i]*(e.variance[2]+(e.mean[2]-delta[2])**2)/support;});
    }
    return [delta,{similarity,support,uncertainty:Math.sqrt(variance+1/(1+support)),
      ignorance:1/Math.sqrt(1+support),noise:Math.sqrt(Math.max(0,variance))}];
  }
  learn(key,action,delta) {
    let best=0,chosen=-1;
    this.evidence.forEach((e,i)=>{
      const match=this.similarity(key,e.key);
      if(Math.abs(action-e.action)<=.25 && match>best) {best=match;chosen=i;}
    });
    if(best<.72) {
      const e={key:key.slice(),mean:zeros(3),variance:zeros(3),mass:0,action,age:0};
      if(this.evidence.length<E) {chosen=this.evidence.length;this.evidence.push(e);}
      else {chosen=this.evidence.reduce((b,x,i)=>x.age<this.evidence[b].age?i:b,0);this.evidence[chosen]=e;}
    }
    const e=this.evidence[chosen];e.mass=Math.min(32,e.mass+1);
    const alpha=1/Math.min(8,e.mass);
    for(let k=0;k<3;k++) {
      const d=delta[k]-e.mean[k];e.mean[k]+=alpha*d;e.variance[k]=(1-alpha)*(e.variance[k]+alpha*d*d);
    }
    e.age=++this.clock;
  }
}
class Embodiment {
  constructor() {this.weights=matrix(2,3);this.covariance=[matrix(3,3),matrix(3,3)];this.error=zeros(2);this.samples=0;}
  learn(o,next) {
    for(let c=0;c<2;c++) {
      const f=[1,o[2],(next[c]-o[c])**2],p=this.covariance[c],pf=zeros(3);
      if(!this.samples) for(let i=0;i<3;i++) p[i][i]=100;
      let prediction=0,denominator=1;
      for(let i=0;i<3;i++) {
        prediction+=this.weights[c][i]*f[i];
        for(let j=0;j<3;j++) pf[i]+=p[i][j]*f[j];
        denominator+=f[i]*pf[i];
      }
      const error=next[2]-prediction;this.error[c]+=error*error;
      for(let i=0;i<3;i++) this.weights[c][i]+=error*pf[i]/denominator;
      for(let i=0;i<3;i++) for(let j=i;j<3;j++) p[i][j]=p[j][i]=p[i][j]-pf[i]*pf[j]/denominator;
    }
    this.samples++;
  }
  channel() {
    const total=sum(this.error);
    if(this.samples<32 || total<1e-12 || Math.abs(this.error[0]-this.error[1])<.05*total) return -1;
    return this.error[1]<this.error[0]?1:0;
  }
}
class Subject {
  constructor(seed,mode=0,glyphs=0) {
    this.mode=mode;this.rng=new Random(mix64(BigInt(seed)^0x5355424a454354n)|1n);
    this.h=zeros(H);this.win=matrix(H,5);this.recurrent=matrix(H,H);
    for(let i=0;i<H;i++) {
      let total=0;
      for(let j=0;j<5;j++) this.win[i][j]=(j===4?.2:.8)*this.rng.signed();
      for(let j=0;j<H;j++) {this.recurrent[i][j]=this.rng.signed();total+=Math.abs(this.recurrent[i][j]);}
      for(let j=0;j<H;j++) this.recurrent[i][j]*=.75/total;
    }
    this.weights=matrix(3,F);this.covariance=matrix(F,F);
    for(let i=0;i<F;i++) this.covariance[i][i]=100;
    this.previous_action=0;this.updates=0;this.observation=zeros(3);
    this.glyph=new Glyphs(glyphs);this.body=new Embodiment();
  }
  observe(observation) {
    this.observation=observation.slice();const view=observation.slice(),g=this.glyph;
    if(g.enabled) {
      if(!g.anchored) {g.anchor=view.slice(0,2);g.anchored=1;}
      for(let j=0;j<2;j++) view[j]-=g.anchor[j];
      const norm=Math.max(.2,Math.hypot(view[0],view[1]));
      for(let j=0;j<2;j++) view[j]/=norm;
    }
    const next=zeros(H),signature=zeros(H);
    for(let i=0;i<H;i++) {
      let v=this.win[i][4];for(let j=0;j<3;j++) v+=this.win[i][j]*view[j];
      signature[i]=Math.tanh(v);
      if(this.mode===0) {
        v+=this.win[i][3]*this.previous_action;
        for(let j=0;j<H;j++) v+=this.recurrent[i][j]*this.h[j];
        next[i]=.5*this.h[i]+.5*Math.tanh(v);
      } else if(this.mode===1) next[i]=Math.tanh(v);
    }
    this.h=next;if(g.enabled) g.observe(signature);
  }
  features(action) {return [1,...this.observation,action,...this.h,...this.h.map(h=>action*h),action*action];}
  predict(action) {
    const f=this.features(action),p=this.observation.slice();
    for(let k=0;k<3;k++) for(let j=0;j<F;j++) p[k]+=this.weights[k][j]*f[j];
    if(this.glyph.enabled && this.glyph.enabled!==3) {
      const [delta,r]=this.glyph.predict(action),blend=r.similarity*r.support/(1+r.support);
      for(let k=0;k<3;k++) p[k]+=blend*(this.observation[k]+delta[k]-p[k]);
    }
    return p;
  }
  influence() {const lo=this.predict(-1),hi=this.predict(1);return [Math.abs(hi[0]-lo[0]),Math.abs(hi[1]-lo[1])];}
  action(target,exploration) {
    const influence=this.influence(),c=influence[1]>influence[0]?1:0;
    if(exploration>0 && this.rng.uniform()<exploration) return Number(this.rng.next()%3n)-1;
    let best=Infinity,chosen=0;
    for(const action of [0,-1,1]) {
      const p=this.predict(action),d=p[c]-target;
      let cost=d*d+.03*clip(p[2],0,1)+.0001*action*action;
      if(this.glyph.enabled) {
        cost=p[2]+.0001*action*action;
        if(this.glyph.enabled!==3 && this.glyph.learning && exploration>0)
          cost-=exploration*this.glyph.predict(action)[1].ignorance;
      }
      if(cost<best) {best=cost;chosen=action;}
    }
    return chosen;
  }
  regress(f,delta) {
    const p=this.covariance,pf=zeros(F);let denominator=.997;
    for(let i=0;i<F;i++) {
      for(let j=0;j<F;j++) pf[i]+=p[i][j]*f[j];denominator+=f[i]*pf[i];
    }
    for(let k=0;k<3;k++) {
      let error=delta[k];for(let j=0;j<F;j++) error-=this.weights[k][j]*f[j];
      for(let j=0;j<F;j++) this.weights[k][j]+=error*pf[j]/denominator;
    }
    for(let i=0;i<F;i++) for(let j=i;j<F;j++) p[i][j]=p[j][i]=(p[i][j]-pf[i]*pf[j]/denominator)/.997;
    for(let i=0;i<F;i++) if(p[i][i]>1e8) {
      const scale=Math.sqrt(1e8/p[i][i]);
      for(let j=0;j<F;j++) p[i][j]*=scale;
      for(let j=0;j<F;j++) p[j][i]*=scale;
    }
    this.updates++;
  }
}
class World {
  constructor(seed,kind=0) {
    this.rng=new Random(mix64(BigInt(seed)^0x574f524c44n)|1n);
    this.controlled=Number(this.rng.next()&1n);this.polarity=(this.rng.next()&1n)?1:-1;
    this.pos=[.5*this.rng.signed(),.5*this.rng.signed()];this.velocity=zeros(2);this.load=0;
    this.target=.65;this.gain=1;this.tick=0;this.kind=kind;this.order=0;
    this.offset=zeros(2);this.jitter=0;this.cue_noise=zeros(2);
    if(kind) {this.target=0;this.jitter=.02;this.landmarks();}
  }
  landmarks() {this.order=(this.rng.next()&1n)?1:-1;this.cue_noise=[this.rng.signed(),this.rng.signed()];}
  observe() {
    const o=[...this.pos,this.load];
    if(this.kind) {
      const phase=this.tick%6;
      for(let k=0;k<2;k++) {
        let v=0;
        if(phase===1 || phase===2) {
          const first=this.order>0?0:1,cue=phase===1?first:1-first;
          v=(k===cue?.8:0)+this.jitter*this.cue_noise[k];
        }
        o[k]=this.offset[k]+this.gain*v;
      }
    }
    return o;
  }
  step(action) {
    action=clip(action,-1,1);
    if(this.kind) {
      const phase=this.tick%6;
      if(phase===3) this.load=action*this.order*this.polarity>.5?.05:.95;
      else if(phase===4) this.load*=.5;
      else if(phase===5) {this.load=0;this.landmarks();}
    } else {
      const c=this.controlled,other=1-c;
      this.velocity[c]=.65*this.velocity[c]+.35*this.polarity*(1-.5*this.load)*action;
      this.velocity[other]=.8*this.velocity[other]+.2*this.rng.signed();
      for(const k of [c,other]) this.pos[k]=clip(.94*this.pos[k]+.14*this.velocity[k],-1,1);
      this.load=.9*this.load+.1*this.velocity[c]*this.velocity[c];
    }
    this.tick++;
  }
}
class Amos {
  constructor(seed=1,kind=0,glyphs=4,mode=0) {
    this.seed=BigInt(seed);this.birth=mix64(this.seed^0x414d4f532d424952n);
    this.world=new World(this.seed,kind);this.subject=new Subject(this.seed,mode,kind?glyphs:0);this.memory=[];
  }
  step(action=null,learn=true,exploration=.25) {
    const w=this.world,s=this.subject;
    if(s.glyph.enabled) s.glyph.learning=learn?1:0;
    const o=w.observe();s.observe(o);
    action=action===null?s.action(w.target,exploration):clip(action,-1,1);
    const predicted=s.predict(action),influence=s.influence(),features=s.features(action);
    const recognition=s.glyph.predict(action)[1],sequence=s.glyph.sequence.slice();
    w.step(action);const next=w.observe();
    const t={tick:w.tick,observation:o,next,action,predicted,influence,features,sequence,recognition};
    if(learn) {
      const delta=next.map((x,k)=>x-o[k]);s.regress(features,delta);s.body.learn(o,next);
      if(s.glyph.enabled) s.glyph.learn(sequence,action,delta);
    }
    s.previous_action=action;this.memory.push(t);if(this.memory.length>128) this.memory.shift();return t;
  }
  scar(future) {
    const a=this.subject,b=future.subject,eq=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
    if(this.birth!==future.birth || this.seed!==future.seed || a.mode!==b.mode ||
       !eq(a.win,b.win) || !eq(a.recurrent,b.recurrent) || this.world.tick>=future.world.tick ||
       a.glyph.enabled!==b.glyph.enabled || !eq(a.glyph.prototypes,b.glyph.prototypes.slice(0,a.glyph.prototypes.length)))
      throw Error('Incompatible temporal origin or neural/glyph basis');
    const rows=future.memory.filter(t=>this.world.tick<t.tick && t.tick<=future.world.tick);
    if(!rows.length) throw Error('No retained future experience');
    if(a.glyph.enabled) a.glyph.prototypes=b.glyph.prototypes.map(p=>p.slice());
    for(const t of rows) {
      const delta=t.next.map((x,k)=>x-t.observation[k]);a.regress(t.features,delta);
      if(a.glyph.enabled) a.glyph.learn(t.sequence,t.action,delta);
    }
  }
  dumps() {
    return JSON.stringify({format:'AMOS-JSON-1',amos:this},(k,v)=>typeof v==='bigint'?v.toString(16).padStart(16,'0'):v);
  }
  static loads(text) {
    const d=JSON.parse(text);
    if(d.format!=='AMOS-JSON-1') throw Error('Unsupported snapshot format');
    const keys=(x,names)=>{if(!x || typeof x!=='object' || Array.isArray(x) || Object.keys(x).sort().join('|')!==[...names].sort().join('|')) throw Error('Unexpected snapshot fields');};
    keys(d,['format','amos']);const data=d.amos;
    keys(data,['seed','birth','world','subject','memory']);
    if(!/^[0-9a-f]{16}$/.test(data.seed)||!/^[0-9a-f]{16}$/.test(data.birth)) throw Error('Invalid hexadecimal origin');
    const a=new Amos(BigInt('0x'+data.seed));
    keys(data.world,Object.keys(a.world));keys(data.subject,Object.keys(a.subject));
    keys(data.subject.glyph,Object.keys(a.subject.glyph));keys(data.subject.body,Object.keys(a.subject.body));
    for(const rng of [data.world.rng,data.subject.rng]) {
      keys(rng,['random64']);if(!/^[0-9a-f]{16}$/.test(rng.random64))throw Error('Invalid random state');
    }
    a.birth=BigInt('0x'+data.birth);
    if(a.birth!==mix64(a.seed^0x414d4f532d424952n)) throw Error('Invalid birth origin');
    Object.assign(a.world,data.world);a.world.rng=new Random(BigInt('0x'+data.world.rng.random64));
    Object.assign(a.subject,data.subject);a.subject.rng=new Random(BigInt('0x'+data.subject.rng.random64));
    a.subject.glyph=Object.assign(new Glyphs(),data.subject.glyph);
    a.subject.body=Object.assign(new Embodiment(),data.subject.body);a.memory=data.memory;
    validate(a);return a;
  }
  clone() {return Amos.loads(this.dumps());}
}
function validate(a) {
  const s=a.subject,w=a.world,g=s.glyph;
  const shape=(x,...dims)=>dims.length?Array.isArray(x) && x.length===dims[0] && x.every(v=>shape(v,...dims.slice(1))):typeof x==='number' && Number.isFinite(x) && Math.abs(x)<=1e30;
  if(!(a.seed>=0n && a.seed<=MASK && w.rng.state>0n && w.rng.state<=MASK && s.rng.state>0n && s.rng.state<=MASK &&
    [0,1,2].includes(s.mode) && [0,1].includes(w.kind) && [0,1].includes(w.controlled) && [-1,1].includes(w.polarity) && w.load>=0 && w.load<=1 && w.gain>0 &&
    [0,1,2,3,4].includes(g.enabled) && [0,1].includes(g.learning) && [0,1].includes(g.anchored) &&
    shape(s.h,H) && shape(s.win,H,5) && shape(s.recurrent,H,H) && shape(s.weights,3,F) && shape(s.covariance,F,F) &&
    shape(s.observation,3) && shape(g.sequence,K) && shape(g.familiarity,L) && shape(g.anchor,2) &&
    g.prototypes.length<=G && g.prototypes.every(p=>shape(p,H)) && g.evidence.length<=E &&
    g.duration.length===L && g.duration.every(x=>Number.isSafeInteger(x) && x>=0) &&
    shape(s.body.weights,2,3) && shape(s.body.covariance,2,3,3) && shape(s.body.error,2) && a.memory.length<=128)) throw Error('Invalid snapshot structure');
  const counter=x=>Number.isSafeInteger(x)&&x>=0;
  if(!(counter(w.tick)&&counter(s.updates)&&counter(g.clock)&&counter(s.body.samples)&&s.body.error.every(x=>x>=0)&&
    shape(w.pos,2)&&shape(w.velocity,2)&&shape(w.offset,2)&&shape(w.cue_noise,2)&&
    [w.load,w.target,w.polarity,w.gain,w.jitter,s.previous_action].every(x=>shape(x))&&w.jitter>=0&&Math.abs(s.previous_action)<=1&&
    (!w.kind||[-1,1].includes(w.order))&&[...g.sequence,...g.familiarity].every(x=>x>=0&&x<=1)))throw Error('Invalid snapshot values');
  let previous=0;
  for(const t of a.memory) {
    if(!(Object.keys(t).sort().join('|')==='action|features|influence|next|observation|predicted|recognition|sequence|tick' && counter(t.tick) && shape(t.predicted,3) && shape(t.influence,2) && Object.keys(t.recognition).sort().join('|')==='ignorance|noise|similarity|support|uncertainty' && Object.values(t.recognition).every(x=>shape(x)&&x>=0) && previous<t.tick && t.tick<=w.tick && Math.abs(t.action)<=1 && shape(t.observation,3) && shape(t.next,3) && shape(t.features,F) && shape(t.sequence,K))) throw Error('Invalid retained transition');
    previous=t.tick;
  }
  for(const e of g.evidence) if(!(Object.keys(e).sort().join('|')==='action|age|key|mass|mean|variance' && counter(e.age) && shape(e.mass) && shape(e.action) && e.key.every(x=>x>=0&&x<=1) && shape(e.key,K) && shape(e.mean,3) && shape(e.variance,3) && e.variance.every(x=>x>=0) && e.mass>=1 && e.mass<=32 && Math.abs(e.action)<=1 && e.age>0 && e.age<=g.clock)) throw Error('Invalid association');
}
return {Amos,World,Subject,Glyphs,Embodiment,Random,mix64,validate,H,F,G,L,K,E};
})();
if(typeof module!=='undefined') module.exports=AMOS;
