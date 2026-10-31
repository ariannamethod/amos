/* A read has content. Project actual returned receipts through the same
 * semantic membrane, retaining exact append-only journal indices as premises. */
const PERCEPTION = (() => {
  'use strict';
  const hash=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.codePointAt(0),16777619);return n>>>0;};
  function read(result,ledger,tool,args,knownThrough,semanticVersion=2) {
    if(![1,2].includes(semanticVersion))throw Error('Unknown read membrane');
    const tokenize=semanticVersion===1?VOICE.tokenizeLegacy:VOICE.tokenize;
    if(knownThrough!==undefined&&(!Number.isSafeInteger(knownThrough)||knownThrough<0||knownThrough>ledger.size))throw Error('Invalid read boundary');
    if(!result?.ok||!Array.isArray(result.data?.items))throw Error('Invalid tool reading');
    const rows=ledger.entries(),premises=[],glyphs=[],sensory=[0,0];
    for(const fact of result.data.items){
      const index=rows.findIndex(f=>f.id===fact.id);
      if(index<0||(knownThrough!==undefined&&index>=knownThrough)||fact.recordedAt>args.knownAt||JSON.stringify(rows[index])!==JSON.stringify(fact))throw Error('Tool reading differs from its source receipt');
      premises.push(index);
      if(fact.source==='amos:transition/v1'&&fact.predicate.startsWith('transition_')){
        const own=JSON.parse(fact.value);if(own.policy!=='amos/transition-v1'||!Number.isFinite(own.error)||!Array.isArray(own.observed)||own.observed.length!==3)throw Error('Invalid remembered transition');
        sensory[0]+=Math.tanh(own.error*4);sensory[1]+=Math.tanh((own.control?.effect??own.observed[2])*4);
        glyphs.push(...tokenize('me change cause remember').ids.slice(0,Math.max(0,128-glyphs.length)));continue;
      }
      if(fact.source==='amos:links/v1'&&fact.predicate==='encounter_links'){
        const own=JSON.parse(fact.value);if(own.policy!=='amos/encounter-links-v1'||!Array.isArray(own.sensory)||own.sensory.length!==2)throw Error('Invalid remembered association');
        sensory[0]+=own.sensory[0];sensory[1]+=own.sensory[1];glyphs.push(...own.matched.slice(0,Math.max(0,128-glyphs.length)));continue;
      }
      if(fact.source==='amos:tool-read/v1'&&fact.predicate==='tool_reading'){
        const own=JSON.parse(fact.value);if(!['amos/read-indices-v1','amos/read-indices-v2'].includes(own.policy)||!Array.isArray(own.sensory)||own.sensory.length!==2)throw Error('Invalid remembered reading');
        sensory[0]+=own.sensory[0];sensory[1]+=own.sensory[1];glyphs.push(...own.glyphs.slice(0,Math.max(0,128-glyphs.length)));continue;
      }
      if(fact.source==='amos:attention/v1'&&fact.predicate==='fact_selection'){
        const own=JSON.parse(fact.value);if(own.policy!=='amos/acquired-attention-v1'||!Number.isFinite(own.selected?.score))throw Error('Invalid remembered choice');
        sensory[0]+=Math.tanh(own.selected.score);sensory[1]+=own.selected.novelty;
        glyphs.push(...tokenize('me choose remember').ids.slice(0,Math.max(0,128-glyphs.length)));continue;
      }
      if(fact.source==='amos:self/v1'&&fact.predicate==='self_reflection'){
        const own=JSON.parse(fact.value);
        if(own.policy!=='amos/self-sonar-v1'||!Number.isFinite(own.error)||!Array.isArray(own.observed)||own.observed.length!==4)throw Error('Invalid somatic self observation');
        sensory[0]+=Math.tanh(own.error*4);sensory[1]+=Math.tanh(own.observed[2]*4);
        glyphs.push(...tokenize('me think change remember').ids.slice(0,Math.max(0,128-glyphs.length)));continue;
      }
      const words=fact.predicate.replaceAll('_',' ')+(typeof fact.value==='string'?' '+fact.value:'');
      const parsed=tokenize(words),vector=[0,0];
      glyphs.push(...parsed.ids.slice(0,Math.max(0,128-glyphs.length)));
      for(const g of parsed.ids){vector[0]+=Math.cos(g*2.3999632297);vector[1]+=Math.sin(g*2.3999632297);}
      if(parsed.ids.length){vector[0]/=parsed.ids.length;vector[1]/=parsed.ids.length;}
      if(typeof fact.value==='number'||typeof fact.value==='boolean'){
        const value=typeof fact.value==='boolean'?(fact.value?1:-1):Math.tanh(Math.sign(fact.value)*Math.log1p(Math.abs(fact.value))/6);
        const angle=(hash(fact.predicate)%4096)*Math.PI*2/4096;
        vector[0]=(vector[0]+value*Math.cos(angle))/2;vector[1]=(vector[1]+value*Math.sin(angle))/2;
      }
      sensory[0]+=vector[0];sensory[1]+=vector[1];
    }
    if(premises.length){sensory[0]/=premises.length;sensory[1]/=premises.length;}
    const reading={policy:`amos/read-indices-v${semanticVersion}`,tool,arguments:args,premises,glyphs,sensory,
      total:result.data.total,complete:result.data.complete,nextOffset:result.data.nextOffset};
    if(knownThrough!==undefined)reading.knownThrough=knownThrough;return reading;
  }
  return {read};
})();
