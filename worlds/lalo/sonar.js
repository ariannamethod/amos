/* AMOS somatic loop, adapted from klaus.c 6fad88329538f0a820d5266796d456c9133559c6.
 * Arianna Method / Oleg Ataeff. GPL-3.0; license embedded in Amos-2.html.
 * Six chambers, 24 coupled phases, slow scars, Hebbian residue, coefficient
 * modulation and bounded re-inhale. The semantic input is AMOS's glyph membrane. */
const SONAR = (() => {
  'use strict';
  const names=['FEAR','LOVE','RAGE','VOID','FLOW','COMPLEX'];
  const coupling=[[0,-.3,.5,.4,-.2,.1],[-.3,0,-.4,-.5,.5,.2],[.5,-.3,0,.2,-.3,.3],
    [.4,-.5,.3,0,-.3,.4],[-.2,.4,-.2,-.3,0,.3],[.1,.2,.3,.4,.3,0]];
  const frequencies=[[.3,.4,.8,.1,.5,.35],[1.2,.6,1.5,.2,.7,.55],[.6,.5,.9,.15,.6,.45],[.9,.3,1.1,.08,.4,.65]];
  const intra=[[0,.3,.2,.1],[.3,0,.15,-.1],[.2,.15,0,.1],[.1,-.1,.1,0]];
  const anchors=['fear pain death stress','love bond help joy','anger conflict break','grief longing never dark',
    'music go free agree','think question idea how cause know'];
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),copy=x=>JSON.parse(JSON.stringify(x));
  const vector=a=>Array.isArray(a)&&a.length===6&&a.every(x=>Number.isFinite(x)&&x>=0&&x<=1);
  function semantic(ids,symbols=[]){
    const cache=new Map();
    function meaning(id){
      if(!Number.isSafeInteger(id)||id<0||id>=88+symbols.length)throw Error('Unknown returned representation');
      if(cache.has(id))return cache.get(id);
      let out;
      if(id<88)out=anchors.map(words=>Number(words.split(' ').includes(VOICE.names[id])));
      else{const pair=symbols[id-88];if(!Array.isArray(pair)||pair.length!==2||!pair.every(p=>Number.isSafeInteger(p)&&p>=0&&p<id))throw Error('Invalid returned compound');
        const a=meaning(pair[0]),b=meaning(pair[1]);out=a.map((v,c)=>(v+b[c])/2);}
      cache.set(id,out);return out;
    }
    const out=Array(6).fill(0);for(const id of ids){const v=meaning(id);for(let c=0;c<6;c++)out[c]+=v[c]/Math.max(1,ids.length);}return out;
  }
  class SomaticSonar {
    constructor(){
      this.act=[0,.15,0,0,.1,0];this.soma=Array(6).fill(0);this.scar=Array(6).fill(0);
      this.phases=Array.from({length:6},(_,c)=>Array.from({length:4},(_,s)=>c*Math.PI/3+s*Math.PI/12));
      this.hebb=Array.from({length:6},()=>Array(6).fill(0));this.memory=[];this.coherence=0;this.phaseLock=0;
      this.deepTicks=0;this.turns=0;
    }
    crossfire(){
      for(let t=0;t<4;t++){
        const old=copy(this.phases),acts=this.act.slice(),drive=Array(6).fill(0);
        for(let c=0;c<6;c++)for(let s=0;s<4;s++){
          let velocity=frequencies[s][c];
          for(let j=0;j<4;j++)velocity+=intra[s][j]*Math.sin(old[c][j]-old[c][s]);
          for(let d=0;d<6;d++)if(d!==c)velocity+=.03*coupling[c][d]*Math.sin(old[d].reduce((a,b)=>a+b,0)/4-old[c][s]);
          this.phases[c][s]=((old[c][s]+.1*velocity)%(2*Math.PI)+2*Math.PI)%(2*Math.PI);
          // Klaus couples phase velocity back into activation; a saved phase
          // must change the body's next response, rather than just its display.
          drive[c]+=.003*Math.sin(velocity)/4;
        }
        this.act=acts.map((v,c)=>clamp(.97*v+.03*coupling[c].reduce((sum,w,d)=>sum+w*acts[d],0)+drive[c]));
      }
    }
    inhale(ids,{surprise=0,resonance=0,familiarity=0,revision=0,selfError=0,unmatched=0}={}){
      this.crossfire();const input=semantic(ids),memory=Array(6).fill(0);let mass=0;
      for(let i=0;i<this.memory.length;i++){const w=.85**(this.memory.length-1-i);mass+=w;for(let c=0;c<6;c++)memory[c]+=w*this.memory[i][c];}
      if(mass)for(let c=0;c<6;c++)memory[c]/=mass;
      const body=[Math.tanh(surprise)*.35,resonance*.25,revision*.12,(1-familiarity)*.08,
        familiarity*.2,Math.tanh(selfError)*.3+revision*.2+.15*unmatched];
      this.act=this.act.map((v,c)=>{
        const echo=this.hebb[c].reduce((s,w,j)=>s+w*input[j],0)/6;
        return clamp(.35*v+.3*input[c]+.15*memory[c]+.1*this.soma[c]+body[c]+.08*echo+.05*this.scar[c]);
      });
      this.scar=this.scar.map((v,c)=>clamp(.985*v+(this.act[c]>.75?.04*this.act[c]:0)));
      this.refresh();return input;
    }
    refresh(){
      const total=this.act.reduce((s,v)=>s+v,0),entropy=total?this.act.reduce((s,v)=>v?s-(v/total)*Math.log(v/total):s,0):0;
      this.coherence=clamp(1-entropy/Math.log(6));this.phaseLock=.85*this.phaseLock+.15*this.coherence;
      if(this.coherence>.35)this.deepTicks=5;else if(this.deepTicks)this.deepTicks--;
    }
    gate(){return clamp(.5+1.35*(.5*this.coherence+.34*this.phaseLock-.42+.06*this.deepTicks/5));}
    coefficients(){
      const [fear,love,rage,void_,flow,complex]=this.act;
      return {perception:clamp(1+.12*flow-.08*fear+.04*complex,.8,1.2),
        plasticity:clamp(1+.3*love-.2*rage+.1*flow,.5,2),
        recall:clamp(1+.4*void_+.2*complex-.1*love,.5,2),
        exploration:clamp(.18+.12*complex+.08*flow-.1*fear,.03,.4),
        temperature:clamp(1+.5*flow-.3*fear,.5,2),novelty:1+.3*complex-.2*fear};
    }
    reinhale(ids,symbols=[]){
      const meta=semantic(ids,symbols),before=this.act.slice();
      this.act=this.act.map((v,c)=>clamp(.85*v+.15*(.6*meta[c]+.4*this.soma[c])));
      this.refresh();return {before,after:this.act.slice(),gate:this.gate(),projection:this.projection()};
    }
    projection(){
      const xy=[0,0];for(let c=0;c<6;c++){xy[0]+=this.act[c]*Math.cos((c+1)*2.3999632297)/6;xy[1]+=this.act[c]*Math.sin((c+1)*2.3999632297)/6;}return xy;
    }
    settle(input){
      for(let c=0;c<6;c++)for(let d=0;d<6;d++)this.hebb[c][d]=clamp(.999*this.hebb[c][d]+.05*this.act[c]*input[d]);
      this.soma=this.soma.map((v,c)=>.92*v+.08*this.act[c]);
      this.memory.push(this.act.slice());if(this.memory.length>32)this.memory.shift();this.turns++;
    }
    dump(){return copy(this);}
    static load(d){
      if(!d||![d.act,d.soma,d.scar].every(vector)||!Array.isArray(d.phases)||d.phases.length!==6||
        !d.phases.every(row=>Array.isArray(row)&&row.length===4&&row.every(v=>Number.isFinite(v)&&v>=0&&v<2*Math.PI))||
        !Array.isArray(d.hebb)||d.hebb.length!==6||!d.hebb.every(vector)||!Array.isArray(d.memory)||d.memory.length>32||!d.memory.every(vector)||
        !Number.isSafeInteger(d.turns)||d.turns<0||![d.coherence,d.phaseLock].every(v=>Number.isFinite(v)&&v>=0&&v<=1)||
        !Number.isSafeInteger(d.deepTicks)||d.deepTicks<0||d.deepTicks>5||d.memory.length!==Math.min(32,d.turns))throw Error('Invalid somatic sonar');
      return Object.assign(new SomaticSonar(),copy(d));
    }
  }
  return {SomaticSonar,names,semantic};
})();
