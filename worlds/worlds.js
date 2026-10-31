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
})();
