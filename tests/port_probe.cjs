// Probe the default 24-neuron reference body; AMOS II opts into width 28 separately.
const fs=require('node:fs');
const AMOS=require('../web/amos.js');
const [seed,kind,mode,steps,path]=process.argv.slice(2);
let life=path?AMOS.Amos.loads(fs.readFileSync(path,'utf8')):new AMOS.Amos(BigInt(seed),Number(kind),4,Number(mode));
for(let i=0;i<Number(steps);i++)console.log(JSON.stringify(life.step(null,true,.25)));
console.log(JSON.stringify({checkpoint:life.dumps()}));
