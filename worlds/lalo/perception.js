/* A read has content. Project actual returned receipts through the same
 * semantic membrane, retaining exact append-only journal indices as premises. */
const PERCEPTION = (() => {
  'use strict';
  const hash=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.codePointAt(0),16777619);return n>>>0;};
  function read(result,ledger,tool,args) {
    if(!result?.ok||!Array.isArray(result.data?.items))throw Error('Invalid tool reading');
    const rows=ledger.entries(),premises=[],glyphs=[],sensory=[0,0];
    for(const fact of result.data.items){
      const index=rows.findIndex(f=>f.id===fact.id);
      if(index<0||fact.recordedAt>args.knownAt||JSON.stringify(rows[index])!==JSON.stringify(fact))throw Error('Tool reading differs from its source receipt');
      premises.push(index);
      const words=fact.predicate.replaceAll('_',' ')+(typeof fact.value==='string'?' '+fact.value:'');
      const parsed=VOICE.tokenize(words),vector=[0,0];
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
    return {policy:'amos/read-indices-v1',tool,arguments:args,premises,glyphs,sensory,
      total:result.data.total,complete:result.data.complete,nextOffset:result.data.nextOffset};
  }
  return {read};
})();
