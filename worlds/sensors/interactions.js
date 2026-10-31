/* Optional LLM transcript sensor; live hosts can submit the same packet contract.
 * No model endpoint or credential is needed by the standalone heart. */
(() => {
  'use strict';const api=window.AMOS2Worlds;if(!api||api.version!==1)return;
  api.register({id:'world-interactions',kind:'llm',name:'An exchange',icon:'⇄',button:'Open exchange ↗',file:'.json,application/json',
    description:'LLM requests, responses and tool messages become attributed interactions.',
    async read({file,interactionFrame}){
      if(!file||file.size>128000)throw Error('Choose an exchange of at most 128 kB');
      const data=JSON.parse(await file.text());
      if(data?.format!=='amos/interactions'||data.version!==1||!Array.isArray(data.events)||!data.events.length||data.events.length>32)throw Error('Expected amos/interactions version 1 with 1–32 events');
      return data.events.map(event=>interactionFrame({...event,via:'transcript',origin:String(file.name??'file').slice(0,256)}));
    }});
})();
