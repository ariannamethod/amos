const {Amos}=require('../web/amos.js');
const [seed='1',mode='4',steps='240']=process.argv.slice(2);
const a=new Amos(BigInt(seed),Number(mode)!==0?1:0,Number(mode));
for(let i=0;i<Number(steps);i++) {
  const t=a.step((i*7+Math.floor(i/5))%3-1,true,0);
  if(i%13 && i+1!==Number(steps)) continue;
  const s=a.subject,saved=s.rng.state,decision=s.action(a.world.target,.1);s.rng.state=saved;
  console.log(JSON.stringify({tick:t.tick,action:t.action,predicted:t.predicted,next:t.next,
    h:s.h,weights:s.weights[2],body_error:s.body.error,decision,rng:a.world.rng.state.toString(16).padStart(16,'0'),support:s.glyph.enabled?t.recognition.support:0}));
}
