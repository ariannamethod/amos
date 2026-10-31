/* AMOS-2 expression organ. The 88-glyph alphabet, orthographic mouth,
 * online co-occurrence field and recursive symbol birth descend from
 * actually.life/l.c (Oleg Ataeff & Claude, GPL-3.0). The neural association
 * and resonance bridge below are specific to this AMOS world. */
const VOICE = (() => {
  'use strict';
  const BASE = 88, MAX = 152, WIDTH = 24, GROWTH = 14;
  const russian = {
    water:'вода воды воду дождь море океан река', fire:'огонь огня горит пламя жар',
    earth:'земля земли землю землетрясение землетрясения мир', stone:'камень камни гора скала',
    tree:'дерево деревья лес',sky:'небо ветер воздух облако облака погода',light:'свет солнце день',dark:'тьма темнота ночь',cold:'холод холодно лёд снег',
    person:'человек люди кто',man:'мужчина отец',woman:'женщина мать',child:'ребёнок ребенок дети',old:'старый старость',spirit:'дух душа',AI:'ии машина компьютер',animal:'животное кот собака',
    body:'тело рука руки сердце',food:'еда есть голод',sleep:'сон спать спи отдых',pain:'боль больно рана',strength:'сила сильный',
    joy:'радость радостно',grief:'печаль горе грустно',love:'любовь люблю любить',fear:'страх боюсь страшно',anger:'злость гнев',longing:'тоска скучаю',tired:'устал усталость',stress:'стресс напряжение',
    go:'идти иду движение движется',make:'делать делаю создаю',break:'ломать сломано',see:'вижу видеть смотри',speak:'говорю говорить скажи',hear:'слышу слышишь слушай',seek:'ищу искать',give:'дай даю',want:'хочу хочешь',miss:'скучать',agree:'согласен согласна да',
    home:'дом дома',outside:'снаружи улица',work:'работа работать',internet:'интернет сеть',bond:'связь связи резонанс резонирует',conflict:'конфликт война',
    know:'знаю знать факт факты',idea:'идея мысль',think:'думаю думать сознание',dream:'мечта снится',remember:'помню помнить помнишь память',lie:'ложь лгать',
    path:'путь дорога',up:'вверх',down:'вниз',far:'далеко расстояние',back:'назад вернись',before:'раньше прежде',now:'сейчас здесь',after:'потом после',never:'никогда',always:'всегда',
    not:'не нет',many:'много многие',much:'очень',and:'и',one:'один одна',question:'вопрос почему',how:'как',cause:'причина потому',
    me:'я меня мне мной моё мое',you:'ты тебя тебе тобой твой',other:'другой другие',money:'деньги',change:'изменение изменение меняется меняешься',write:'пишу написать написал слово слова',choose:'выбор выбираю',help:'помощь помоги',have:'имею',free:'свобода свободен',death:'смерть',music:'музыка песня ритм',good:'хорошо хороший',small:'мало маленький',same:'тот одинаковый',BE:'будь быть существую существовать',wait:'жди ждать жду'
  };
  const normalize = w => w.normalize('NFKC').toLowerCase().replaceAll('ё','е');
  const stop = new Set(('a an the is are was were of to for in on at with from as it its this that these those by '+
    'это этот эта то те на в во с со к ко у по за из от для о об же бы ли ну блять короче').split(' '));
  const dictionary = new Map(), grams = new Map();
  const gramsof = word => { const s='^'+normalize(word)+'$';return Array.from({length:Math.max(1,s.length-2)},(_,i)=>s.slice(i,i+3)); };
  const add = (word,id) => {
    dictionary.set(normalize(word),id);
    for(const gram of gramsof(word)) {
      if(!grams.has(gram)) grams.set(gram,Array(BASE).fill(0));
      grams.get(gram)[id]++;
    }
  };
  LIFE_SEMANTIC.names.forEach(add);
  for(const [word,name] of LIFE_SEMANTIC.pairs) add(word,LIFE_SEMANTIC.names.indexOf(name));
  for(const [name,words] of Object.entries(russian)) for(const word of words.split(' ')) add(word,LIFE_SEMANTIC.names.indexOf(name));
  const hash = text => {let n=2166136261;for(const c of text) n=Math.imul(n^c.codePointAt(0),16777619);return n>>>0;};
  function tokenize(text) {
    const words=(text.match(/[\p{L}\p{N}]+/gu)||[]).slice(0,128), tokens=[];
    for(const word of words) {
      const w=normalize(word);if(stop.has(w)) continue;
      let id=dictionary.get(w),via='lexicon';
      if(id===undefined) {
        const votes=Array(BASE).fill(0);
        for(const g of gramsof(w)) {const row=grams.get(g);if(row)for(let i=0;i<BASE;i++)votes[i]+=row[i];}
        const max=Math.max(...votes);id=max?votes.indexOf(max):hash(w)%BASE;via=max?'orthographic':'hash';
      }
      tokens.push({word,id,via});
    }
    return {ids:tokens.map(t=>t.id),tokens};
  }
  const blank = () => Array(MAX).fill(0);
  const norm = a => Math.sqrt(a.reduce((s,v)=>s+v*v,0));
  const cosine = (a,b) => {const d=norm(a)*norm(b);return d?a.reduce((s,v,i)=>s+v*b[i],0)/d:0;};
  class GlyphVoice {
    constructor(seed=17) {
      this.symbols=[];this.uni=blank();this.bi=Array.from({length:MAX},blank);this.cooc=Array.from({length:MAX},blank);
      this.neural=Array.from({length:MAX},()=>Array(WIDTH).fill(0));
      this.prototypes=Array.from({length:8},blank);this.recent=[];this.last=[];this.utterances=0;
      this.rng=new AMOS.Random(AMOS.mix64(BigInt(seed)^0x564f494345n)|1n);
    }
    name(id,depth=0) {
      if(id<BASE)return LIFE_SEMANTIC.names[id];
      if(depth>64)return '?';
      const pair=this.symbols[id-BASE];if(!pair)return '?';
      const parts=pair.map(v=>v>=BASE?'('+this.name(v,depth+1)+')':this.name(v));return parts.join('+');
    }
    resonance(ids) {
      if(!ids.length)return 0;
      const high=Math.max(...this.uni);if(!high)return 0;
      return ids.reduce((s,id)=>s+this.uni[id]/high,0)/ids.length;
    }
    ingest(ids,h,mixture) {
      let compressed=ids.slice();
      for(let n=0;n<this.symbols.length;n++){
        const [a,b]=this.symbols[n],next=[];
        for(let i=0;i<compressed.length;i++){
          if(compressed[i]===a&&compressed[i+1]===b){next.push(BASE+n);i++;}else next.push(compressed[i]);
        }
        compressed=next;
      }
      const eaten=ids.concat(compressed.filter(id=>id>=BASE));
      for(const id of eaten) {
        this.uni[id]++;
        for(let j=0;j<WIDTH;j++)this.neural[id][j]=.94*this.neural[id][j]+.06*h[j];
        for(let k=0;k<8;k++)this.prototypes[k][id]+=(mixture[k]||0);
      }
      for(let i=1;i<ids.length;i++){this.bi[ids[i-1]][ids[i]]++;this.cooc[ids[i-1]][ids[i]]++;}
      if(compressed.some(id=>id>=BASE))for(let i=1;i<compressed.length;i++){
        if(compressed[i-1]>=BASE||compressed[i]>=BASE){
          this.bi[compressed[i-1]][compressed[i]]++;this.cooc[compressed[i-1]][compressed[i]]++;
        }
      }
      this.recent=this.recent.concat(compressed).slice(-24);
    }
    consolidate() {
      if(this.symbols.length>=64)return null;
      let best=GROWTH-1,pair=null;const high=BASE+this.symbols.length;
      for(let a=0;a<high;a++)for(let b=0;b<high;b++) {
        if(this.cooc[a][b]>best&&!this.symbols.some(p=>p[0]===a&&p[1]===b)){best=this.cooc[a][b];pair=[a,b];}
      }
      if(!pair)return null;
      const id=BASE+this.symbols.length;this.symbols.push(pair);
      this.uni[id]=(this.uni[pair[0]]+this.uni[pair[1]])/2;
      this.neural[id]=this.neural[pair[0]].map((x,i)=>(x+this.neural[pair[1]][i])/2);
      for(let k=0;k<8;k++)this.prototypes[k][id]=(this.prototypes[k][pair[0]]+this.prototypes[k][pair[1]])/2;
      for(let g=0;g<id;g++) {
        this.bi[g][id]=(this.bi[g][pair[0]]+this.bi[g][pair[1]])/2;
        this.bi[id][g]=(this.bi[pair[0]][g]+this.bi[pair[1]][g])/2;
      }
      return {id,pair,support:best,name:this.name(id)};
    }
    express(h,mixture,arousal=0) {
      const born=this.consolidate();if(!this.recent.length)return {ids:[],words:[],born,contributions:[]};
      const ids=[],contributions=[];let previous=this.recent.at(-1);
      const temperature=.52+.28*Math.min(1,arousal),high=BASE+this.symbols.length;
      for(let n=0;n<5;n++) {
        const scores=Array(high).fill(-1e6),pieces=[];
        for(let id=0;id<high;id++)if(this.uni[id]>0) {
          const association=5*cosine(this.neural[id],h);
          const recognition=mixture.reduce((s,p,k)=>s+p*Math.log1p(this.prototypes[k][id]),0);
          const succession=.8*Math.log(.05+this.bi[previous][id]);
          const score=.2*Math.log1p(this.uni[id])+association+recognition+succession-(ids.filter(x=>x===id).length*1.8);
          scores[id]=score;pieces[id]={association,recognition,succession};
        }
        const max=Math.max(...scores),weights=scores.map(v=>v<-1e5?0:Math.exp((v-max)/temperature));
        let remaining=this.rng.uniform()*weights.reduce((s,v)=>s+v,0),chosen=previous;
        for(let id=0;id<high;id++){remaining-=weights[id];if(remaining<=0&&weights[id]){chosen=id;break;}}
        ids.push(chosen);contributions.push({id:chosen,...pieces[chosen]});previous=chosen;
      }
      this.last=ids;this.utterances++;
      return {ids,words:ids.map(id=>this.name(id)),born,contributions};
    }
    dump() {return {...this,rng:this.rng.state.toString(16)};}
    static load(data) {
      const valid=(a,rows,cols)=>Array.isArray(a)&&a.length===rows&&a.every(v=>cols?valid(v,cols):typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<1e12);
      if(!data||!Array.isArray(data.symbols)||data.symbols.length>64||
        !data.symbols.every((p,i)=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isInteger(v)&&v>=0&&v<BASE+i))||
        !valid(data.uni,MAX)||!valid(data.bi,MAX,MAX)||!valid(data.cooc,MAX,MAX)||!valid(data.neural,MAX,WIDTH)||!valid(data.prototypes,8,MAX)||
        !Array.isArray(data.recent)||data.recent.length>24||!Array.isArray(data.last)||data.last.length>5||
        ![...data.recent,...data.last].every(v=>Number.isInteger(v)&&v>=0&&v<BASE+data.symbols.length)||
        !Number.isSafeInteger(data.utterances)||data.utterances<0||!/^[0-9a-f]{1,16}$/.test(data.rng))throw Error('Invalid expression state');
      if(data.uni.some(v=>v<0)||data.bi.some(row=>row.some(v=>v<0))||data.cooc.some(row=>row.some(v=>v<0))||data.prototypes.some(row=>row.some(v=>v<0)))throw Error('Negative expression count');
      const voice=new GlyphVoice();Object.assign(voice,data);voice.rng=new AMOS.Random(BigInt('0x'+data.rng));
      if(!voice.rng.state)throw Error('Invalid expression random stream');return voice;
    }
  }
  return {GlyphVoice,tokenize,BASE,MAX,names:LIFE_SEMANTIC.names,cosine};
})();
