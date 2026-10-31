/* Optional environments for Amos-2.html. Keep this folder beside the HTML to
 * add these instruments. The same saved life also opens without the folder.
 * Arianna Method / Oleg Ataeff. Implementation: Codex. */
(() => {
  'use strict';
  const api=window.AMOS2Worlds;if(!api||api.version!==1)return;
  const nameKey=name=>{let h=2166136261;for(const c of name)h=Math.imul(h^c.codePointAt(0),16777619);return(h>>>0).toString(16);};
  api.register({
    id:'world-text-file',kind:'text-file',name:'A written world',icon:'≋',button:'Open .txt ↗',file:'.txt,text/plain',
    description:'A text you bring becomes a sequence of sourced encounters.',
    async read({file,tokenize,glyph}) {
      if(!file||file.size>32000)throw Error('Choose a text file of at most 32 kB');
      const text=await file.text();if(!text.trim())throw Error('The file is empty');
      const parts=[];for(let i=0;i<text.length;i+=1000)parts.push(text.slice(i,i+1000));
      return parts.map((part,i)=>{
        const parsed=tokenize(part),content=parsed.ids,base=content.length?content:[glyph('write')];let total=0,x=0,y=0;
        base.forEach((g,j)=>{const weight=1+j/base.length;total+=weight;x+=weight*Math.cos(g*2.3999632297);y+=weight*Math.sin(g*2.3999632297);});
        return {kind:'text-file',key:`${nameKey(file.name)}:${file.lastModified}:${file.size}:${i}`,source:'local:text-file',observedAt:file.lastModified,
          title:`${file.name} · ${i+1}/${parts.length}`,values:{name:file.name.slice(0,256),modified_at:file.lastModified,size_bytes:file.size,part:i+1,text:part},
          sensory:[x/total,y/total],projection:'Order-weighted mean of the semantic glyph basis in this text fragment',
          glyphs:[glyph('outside'),glyph('write'),glyph('now'),...content],detail:{filename:file.name,part:i+1,parts:parts.length,contentGlyphs:content,tokens:parsed.tokens}};
      });
    },
  });
  api.register({
    id:'world-facts',kind:'fact-file',name:'An archive of facts',icon:'⋈',button:'Open facts ↗',file:'.json,application/json',
    description:'Dated facts, places and changing measurements enter the relational heart.',
    async read({file,glyph}){
      if(!file||file.size>128000)throw Error('Choose a world-facts file of at most 128 kB');
      const data=JSON.parse(await file.text());
      if(data?.format!=='amos/world-facts'||data.version!==1||!Array.isArray(data.events)||!data.events.length||data.events.length>32)throw Error('Expected amos/world-facts version 1 with 1–32 events');
      const seen=new Set();
      return data.events.map(row=>{
        if(!row||typeof row.id!=='string'||!/^[a-zA-Z0-9:_-]{1,96}$/.test(row.id)||seen.has(row.id)||!Number.isSafeInteger(row.time)||
          !row.values||typeof row.values!=='object'||Array.isArray(row.values)||Object.keys(row.values).length>14||
          Object.hasOwn(row.values,'event_time')||Object.hasOwn(row.values,'original_source')||
          (row.source!==undefined&&(typeof row.source!=='string'||row.source.length>512)))throw Error('Invalid dated fact or duplicate event id');
        seen.add(row.id);
        const glyphs=(row.glyphs??['know','now']).map(name=>glyph(name));
        if(!glyphs.length||glyphs.length>132||glyphs.some(id=>id<0))throw Error('Use names from the base glyph alphabet');
        return {kind:'fact-file',key:`${nameKey(file.name)}:${row.id}`,source:'local:world-facts',observedAt:row.time,
          title:String(row.label??row.id).slice(0,256),values:{...row.values,event_time:row.time,original_source:row.source??'local file'},
          sensory:row.sensory??[0,0],projection:row.sensory?'World-file supplied sensory coordinates':'Relations-only baseline [0, 0]',
          glyphs,detail:{filename:file.name,declaredSource:row.source??null}};
      });
    },
  });
  api.register({
    id:'world-device',kind:'device',name:'A place in the world',icon:'⊙',button:'Locate once ↗',
    description:'One device position, when you ask for it.',
    async read({glyph}) {
      if(!navigator.geolocation)throw Error('This browser has no location instrument');
      const position=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:12000,maximumAge:0}));
      const {latitude,longitude,accuracy}=position.coords;
      if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180||!Number.isFinite(accuracy)||accuracy<0)throw Error('The device returned an invalid position');
      const observedAt=Math.floor(position.timestamp);
      return [{kind:'device',key:String(observedAt),source:'browser:geolocation',observedAt,
        title:`${latitude.toFixed(3)}° · ${longitude.toFixed(3)}°`,values:{latitude,longitude,accuracy_m:accuracy},
        sensory:[latitude/90,longitude/180],projection:'x = latitude / 90; y = longitude / 180',
        glyphs:[glyph('body'),glyph('earth'),glyph('now')],detail:{latitude,longitude,accuracy}}];
    },
  });
  if(typeof document!=='undefined'){
    const base=document.currentScript?.src??new URL('worlds/worlds.js',document.baseURI).href;
    for(const name of ['interactions','claims']){
      const script=document.createElement('script');script.src=new URL(`sensors/${name}.js`,base).href;script.async=true;
      script.onerror=()=>script.remove();document.head.append(script);
    }
  }
})();
