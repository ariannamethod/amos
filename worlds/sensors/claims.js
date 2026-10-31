/* Optional independently sourced claims; conclusions use the core named rules. */
(() => {
  'use strict';const api=window.AMOS2Worlds;if(!api||api.version!==1)return;
  api.register({id:'world-claims',kind:'claim',name:'Claims and corrections',icon:'⋈',button:'Open claims ↗',file:'.json,application/json',
    description:'Sources can disagree; reconsider their premises through a named rule.',
    async read({file,tokenize,glyph}){
      if(!file||file.size>128000)throw Error('Choose claims of at most 128 kB');
      const data=JSON.parse(await file.text());
      if(data?.format!=='amos/claims'||data.version!==1||!Array.isArray(data.claims)||!data.claims.length||data.claims.length>32)throw Error('Expected amos/claims version 1 with 1–32 claims');
      return data.claims.map(row=>{
        if(!row||typeof row.key!=='string'||!/^[a-zA-Z0-9:_-]{1,160}$/.test(row.key)||typeof row.source!=='string'||!row.source.trim()||
          typeof row.predicate!=='string'||!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(row.predicate)||!Number.isSafeInteger(row.time)||
          !(row.value===null||typeof row.value==='boolean'||typeof row.value==='number'&&Number.isFinite(row.value)||typeof row.value==='string'&&row.value.length<=4096))throw Error('Invalid sourced claim');
        const parsed=tokenize(`${row.predicate} ${String(row.value)}`);
        return {kind:'claim',key:row.key,source:row.source,observedAt:row.time,title:`${row.predicate}: ${String(row.value).slice(0,200)}`,
          values:{[row.predicate]:row.value},sensory:[typeof row.value==='number'?Math.tanh(row.value/6):row.value===true?1:row.value===false?-1:0,0],
          projection:'Numeric/boolean claim projection; source-local revisions retain their predecessors',
          glyphs:[glyph('know'),glyph('speak'),...parsed.ids],detail:{tokens:parsed.tokens,contentGlyphs:parsed.ids,acquisition:'file',origin:String(file.name??'file').slice(0,256)}};
      });
    }});
})();
