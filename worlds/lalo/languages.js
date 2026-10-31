/* Six lexical entrances to the same 88 seed representations.
 * Captions are presentation; stable glyph IDs carry acquired experience.
 * Klaus and Brodsky inform the multilingual organ; no corpus is imported. */
const LANGUAGES = (() => {
  'use strict';
  const policy='amos/semantic-six-v2',previousPolicy='amos/semantic-six-v1',codes=['en','he','ru','fr','de','es'];
  const labels={en:'English',he:'עברית',ru:'Русский',fr:'Français',de:'Deutsch',es:'Español'};
  // name | Hebrew | Russian | French | German | Spanish. First word = caption.
  const rows=`water|מים גשם ים נהר|вода воды воду дождь|eau pluie mer rivière|Wasser Regen Meer Fluss|agua lluvia mar río
fire|אש להבה|огонь пламя|feu flamme|Feuer Flamme|fuego llama
earth|אדמה ארץ רעידה|земля землю землетрясение|terre séisme tremblement|Erde Erdbeben|tierra terremoto
stone|אבן סלע|камень камни|pierre roche|Stein Fels|piedra roca
tree|עץ עצים יער|дерево лес|arbre forêt|Baum Wald|árbol bosque
sky|שמיים שמים רוח|небо ветер|ciel vent|Himmel Wind|cielo viento
light|אור שמש|свет солнце|lumière soleil|Licht Sonne|luz sol
dark|חושך לילה|тьма ночь|obscurité nuit|Dunkelheit Nacht|oscuridad noche
cold|קור קר שלג|холод холодно снег|froid neige|Kälte kalt Schnee|frío nieve
person|אדם אנשים|человек люди|personne humain|Mensch Menschen|persona gente
man|גבר אבא|мужчина отец|homme père|Mann Vater|hombre padre
woman|אישה אשה אמא|женщина мать|femme mère|Frau Mutter|mujer madre
child|ילד ילדה ילדים|ребёнок дети|enfant enfants|Kind Kinder|niño niña niños
old|זקן ישן|старый старость|vieux vieille|alt Alter|viejo vieja
spirit|נשמה נפש|дух душа|esprit âme|Geist Seele|espíritu alma
AI|בינה מחשב|ИИ машина|IA ordinateur|KI Computer|IA computadora
animal|חיה חתול כלב|животное кот собака|animal chat chien|Tier Katze Hund|animal gato perro
body|גוף לב|тело сердце|corps cœur|Körper Herz|cuerpo corazón
food|אוכל לחם|еда голод|nourriture pain faim|Nahrung Essen Hunger|comida pan hambre
sleep|שינה לישון|сон спать|sommeil dormir|Schlaf schlafen|dormir sueño
pain|כאב כואב|боль больно|douleur souffrance|Schmerz Schmerzen|dolor sufrimiento
strength|כוח חזק|сила сильный|force fort|Kraft stark|fuerza fuerte
joy|שמחה שמח|радость радостно|joie heureux|Freude froh|alegría alegre
grief|אבל עצב|горе печаль|deuil tristesse|Trauer Kummer|duelo tristeza
love|אהבה אוהב אוהבת|любовь люблю|amour aime aimer|Liebe lieben|amor amar quiero
fear|פחד מפחד|страх боюсь|peur crainte|Angst Furcht|miedo temor
anger|כעס זעם|гнев злость|colère rage|Wut Zorn|ira rabia
longing|געגוע געגועים|тоска скучаю|nostalgie manque|Sehnsucht Heimweh|añoranza nostalgia
tired|עייף עייפה|устал усталость|fatigue fatigué|müde Müdigkeit|cansancio cansado
stress|לחץ מתח|стресс напряжение|stress tension|Stress Anspannung|estrés tensión
go|ללכת הולך|идти иду|aller marche|gehen gehe|ir voy
make|לעשות יוצר|делать создаю|faire créer|machen schaffen|hacer crear
break|לשבור שבר|ломать сломано|casser briser|brechen kaputt|romper roto
see|לראות רואה|видеть вижу|voir vois|sehen sehe|ver veo
speak|לדבר מדבר|говорить говорю|parler parle|sprechen rede|hablar hablo
hear|לשמוע שומע|слышать слышу|entendre écoute|hören höre|oír escuchar
seek|לחפש מחפש|искать ищу|chercher cherche|suchen suche|buscar busco
give|לתת נותן|дать дай|donner donne|geben gib|dar dame
want|לרצות רוצה|хотеть хочу|vouloir veux|wollen will|querer deseo
miss|לחסור חסר|скучать|manquer absent|vermissen fehlt|extrañar extraño
agree|להסכים מסכים כן|согласен да|accord oui|zustimmen ja|acuerdo sí
home|בית הביתה|дом дома|maison foyer|Haus Zuhause|casa hogar
outside|בחוץ חוץ|снаружи улица|dehors extérieur|draußen außen|fuera exterior
work|עבודה לעבוד|работа работать|travail travailler|Arbeit arbeiten|trabajo trabajar
internet|אינטרנט רשת|интернет сеть|internet réseau|Internet Netzwerk|internet red
bond|קשר חיבור תהודה|связь резонанс|lien résonance|Bindung Resonanz|vínculo resonancia
conflict|סכסוך מלחמה|конфликт война|conflit guerre|Konflikt Krieg|conflicto guerra
know|לדעת יודע עובדה|знать знаю факт|savoir sais fait|wissen weiß Tatsache|saber sé hecho
idea|רעיון מחשבה|идея мысль|idée pensée|Idee Gedanke|idea pensamiento
think|לחשוב חושב תודעה|думать думаю сознание|penser pense conscience|denken denke Bewusstsein|pensar pienso conciencia
dream|חלום חולם|мечта снится|rêve rêver|Traum träumen|soñar ensueño
remember|לזכור זוכר זיכרון|помнить помню память|souvenir mémoire|erinnern Erinnerung|recordar recuerdo memoria
lie|שקר לשקר|ложь лгать|mensonge mentir|Lüge lügen|mentira mentir
path|דרך שביל|путь дорога|chemin route|Weg Pfad|camino sendero
up|למעלה מעלה|вверх|haut monter|oben aufwärts|arriba subir
down|למטה מטה|вниз|bas descendre|unten abwärts|abajo bajar
far|רחוק מרחק|далеко расстояние|loin distance|fern Entfernung|lejos distancia
back|חזרה אחורה|назад вернись|retour arrière|zurück Rückkehr|volver atrás
before|לפני קודם|раньше прежде|avant auparavant|vorher zuvor|antes anteriormente
now|עכשיו כעת|сейчас теперь|maintenant présent|jetzt nun|ahora presente
after|אחרי לאחר|потом после|après ensuite|danach nachher|después luego
never|מעולם|никогда|jamais|niemals nie|nunca jamás
always|תמיד|всегда|toujours|immer stets|siempre
not|לא אין|не нет|non pas|nicht nein|no nada
many|רבים רבות|многие много|plusieurs nombreux|viele zahlreich|muchos muchas
much|הרבה מאוד|очень|beaucoup très|viel sehr|mucho muy
and|וגם|и|et|und|y
one|אחד אחת|один одна|un une|eins eine|uno una
question|שאלה למה|вопрос почему|question pourquoi|Frage warum|pregunta porqué
how|איך כיצד|как|comment|wie|cómo
cause|סיבה בגלל|причина потому|cause parce|Ursache weil|causa porque
me|אני אותי לי|я меня мне|moi je|ich mich|yo mí
you|אתה את אותך|ты тебя тебе|toi tu vous|du dich|tú usted
other|אחר אחרת|другой другие|autre autres|andere anderer|otro otra
money|כסף|деньги|argent monnaie|Geld Münze|dinero moneda
change|שינוי משתנה|изменение меняется|changement changer|Änderung ändern|cambio cambiar
write|לכתוב כותב מילים|писать пишу слова|écrire écris mots|schreiben schreibe Wörter|escribir escribo palabras
choose|לבחור בוחר|выбирать выбираю|choisir choix|wählen Wahl|elegir elección
help|עזרה לעזור|помощь помоги|aide aider|Hilfe helfen|ayuda ayudar
have|יש|иметь имею|avoir possède|haben habe|tener tengo
free|חופשי חירות|свободен свобода|libre liberté|frei Freiheit|libre libertad
death|מוות מת|смерть умер|mort mourir|Tod sterben|muerte morir
music|מוזיקה שיר קצב|музыка песня|musique chanson|Musik Lied|música canción
good|טוב טובה|хороший хорошо|bon bien|gut gute|bueno bien
small|קטן קטנה|маленький мало|petit petite|klein kleine|pequeño pequeña
same|זהה דומה|одинаковый тот|même identique|gleich derselbe|mismo igual
BE|להיות קיים|быть существую|être existe|sein existieren|ser existir
wait|לחכות מחכה|ждать жду|attendre attends|warten warte|esperar espero`.split('\n').map(row=>row.split('|'));
  if(rows.length!==88||rows.some((r,i)=>r[0]!==LIFE_SEMANTIC.names[i]||r.length!==6))throw Error('Incomplete six-language alphabet');
  const normalize=w=>w.normalize('NFKC').toLowerCase().replaceAll('ё','е').replace(/\p{M}/gu,'');
  const words=text=>(text.match(/[\p{L}\p{N}][\p{L}\p{N}\p{M}]*/gu)||[]).slice(0,128);
  const grams=w=>{const s='^'+normalize(w)+'$';return Array.from({length:Math.max(1,s.length-2)},(_,i)=>s.slice(i,i+3));};
  const packs=Object.fromEntries(codes.map(code=>[code,{dictionary:new Map(),grams:new Map(),captions:[]} ]));
  function add(code,word,id){const pack=packs[code],w=normalize(word);pack.dictionary.set(w,id);
    for(const gram of grams(w)){if(!pack.grams.has(gram))pack.grams.set(gram,Array(88).fill(0));pack.grams.get(gram)[id]++;}}
  for(const [i,row] of rows.entries()){add('en',row[0],i);packs.en.captions[i]=row[0];for(let l=1;l<6;l++){
    const entries=row[l].split(' ');packs[codes[l]].captions[i]=entries[0];for(const word of entries)add(codes[l],word,i);}}
  for(const [word,name] of LIFE_SEMANTIC.pairs)add('en',word,LIFE_SEMANTIC.names.indexOf(name));
  const stops={en:'a an the is are was were of to for in on at with from as it its this that these those by',
    he:'של הוא היא הם הן עם על אל מן',ru:'это этот эта то те на в во с со к ко у по за из от для о об же бы ли ну блять короче',
    fr:'le la les de des du au aux dans sur avec pour il elle ils elles ce cette ces',
    de:'der die das ein einer eines einem einen dem den des im am mit von zu zum zur auf für es sie er',
    es:'el la los las de del al en con por para es son está esto esta ese esa'};
  const stopSets=Object.fromEntries(codes.map(c=>[c,new Set(stops[c].split(' ').map(normalize))]));
  function detect(text){const tokens=words(text).map(normalize),scores=Object.fromEntries(codes.map(c=>[c,0]));
    for(const w of tokens)for(const c of codes){if(packs[c].dictionary.has(w))scores[c]+=2;if(stopSets[c].has(w))scores[c]++;}
    // Script evidence belongs to this input; it never assigns a state to a language.
    scores.he+=tokens.filter(w=>/\p{Script=Hebrew}/u.test(w)).length*3;
    scores.ru+=tokens.filter(w=>/\p{Script=Cyrillic}/u.test(w)).length*3;
    const language=codes.reduce((a,c)=>scores[c]>scores[a]?c:a,'en');return {language,scores};
  }
  const canonical=new Map(LIFE_SEMANTIC.names.map((name,id)=>[normalize(name),id]));
  function tokenize(text,language='auto',version=2){
    if(language!=='auto'&&!codes.includes(language))throw Error('Unsupported address language');
    const detected=detect(text),code=language==='auto'?detected.language:language,pack=packs[code],tokens=[];
    for(const word of words(text)){const w=normalize(word);if(stopSets[code].has(w))continue;
      let id=version===2&&code==='en'&&canonical.has(w)?canonical.get(w):pack.dictionary.get(w),via='lexicon';
      // A mixed-language word can enter through its own exact dictionary.
      if(id===undefined)for(const other of codes){if(packs[other].dictionary.has(w)){id=version===2&&other==='en'&&canonical.has(w)?canonical.get(w):packs[other].dictionary.get(w);break;}}
      if(id===undefined){const votes=Array(88).fill(0);for(const gram of grams(w)){const row=pack.grams.get(gram);if(row)for(let i=0;i<88;i++)votes[i]+=row[i];}
        const best=Math.max(...votes);if(best){id=votes.indexOf(best);via='orthographic';}else{let h=2166136261;for(const c of w)h=Math.imul(h^c.codePointAt(0),16777619);id=(h>>>0)%88;via='hash';}}
      tokens.push({word,id,via});}
    return {ids:tokens.map(t=>t.id),tokens,language:code,policy:version===1?previousPolicy:policy};
  }
  function caption(id,language='en',symbols=[],depth=0){
    if(!codes.includes(language))throw Error('Unsupported glyph caption language');
    if(id<88)return packs[language].captions[id];if(depth>64||!symbols[id-88])return '?';
    return symbols[id-88].map(g=>g>=88?'('+caption(g,language,symbols,depth+1)+')':caption(g,language,symbols,depth+1)).join('+');
  }
  function extend(code,entries){for(const [name,aliases] of Object.entries(entries))for(const word of aliases.split(' '))add(code,word,LIFE_SEMANTIC.names.indexOf(name));}
  function localizeName(name,language='en'){
    if(!codes.includes(language))throw Error('Unsupported glyph caption language');
    return name.replace(/[A-Za-z]+/g,word=>{const id=LIFE_SEMANTIC.names.indexOf(word);return id<0?word:packs[language].captions[id];});
  }
  return {policy,previousPolicy,codes,labels,tokenize,tokenizePrevious:(text,language='auto')=>tokenize(text,language,1),detect,caption,localizeName,extend};
})();
