/* Read-only presentation of AMOS. This file never advances or alters the model. */
(() => {
  'use strict';
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const worldCanvas=document.createElement('canvas');
  worldCanvas.className='kinetic-world';worldCanvas.setAttribute('role','img');
  worldCanvas.setAttribute('aria-label','Channel A and B observations in the current world');
  document.querySelector('.world-view').prepend(worldCanvas);
  const neuralCanvas=document.createElement('canvas');
  neuralCanvas.className='kinetic-neural';neuralCanvas.setAttribute('role','img');
  neuralCanvas.setAttribute('aria-label','24 recurrent activations; two strongest weights per neuron');
  $('neurons').before(neuralCanvas);
  const wc=worldCanvas.getContext('2d'),nc=neuralCanvas.getContext('2d');
  const gold=[210,164,94],green=[124,166,155],ink=[226,215,190];
  const rgba=(c,a)=>`rgba(${c.join(',')},${a})`;
  let shownO=amos.world.observe().slice(),shownH=amos.subject.h.slice(),targetO=shownO.slice(),targetH=shownH.slice();
  let frame=0,previous=0,pulse=0,tick=amos.world.tick,birth=amos.birth,edges=[],basis=null;
  function size(canvas,ctx){
    const b=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
    if(canvas.width!==Math.round(b.width*d)||canvas.height!==Math.round(b.height*d)){
      canvas.width=Math.round(b.width*d);canvas.height=Math.round(b.height*d);
    }
    ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,b.width,b.height);return [b.width,b.height];
  }
  function line(ctx,x,y,xx,yy,color,width=1){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function ring(ctx,x,y,r,color,width=1){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function dot(ctx,x,y,r,color){ctx.beginPath();ctx.arc(x,y,Math.max(.1,r),0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  function world(){
    const [w,h]=size(worldCanvas,wc),left=35,right=w-35,top=30,bottom=h-38;
    wc.font='9px ui-monospace, monospace';wc.textAlign='center';
    for(let k=0;k<5;k++){const y=top+(bottom-top)*k/4;line(wc,left,y,right,y,rgba(ink,.07));}
    const obs=shownO;
    for(let k=0;k<2;k++){
      const c=k?green:gold;
      const x=amos.world.kind?w*(k?.69:.31):left+(obs[k]+1)*.5*(right-left);
      const y=amos.world.kind?bottom-Math.max(0,Math.min(1,obs[k]))*(bottom-top):h*(k?.68:.34);
      if(amos.world.kind){
        line(wc,x,top,x,bottom,rgba(c,.16));
        for(let q=0;q<11;q++){const yy=top+(bottom-top)*q/10;line(wc,x-3,yy,x+3,yy,rgba(c,.25));}
        line(wc,x,bottom,x,y,rgba(c,.48));
      }
      const glow=wc.createRadialGradient(x,y,1,x,y,52);glow.addColorStop(0,rgba(c,.13));glow.addColorStop(1,rgba(c,0));
      dot(wc,x,y,52,glow);ring(wc,x,y,23,rgba(c,.24));ring(wc,x,y,30+12*pulse,rgba(c,.09+.12*pulse));
      dot(wc,x,y,5,rgba(c,.92));dot(wc,x,y,1.6,rgba(ink,.95));
      line(wc,x-38,y,x-30,y,rgba(c,.35));line(wc,x+30,y,x+38,y,rgba(c,.35));
      wc.fillStyle=rgba(c,.8);wc.fillText(k?'B':'A',amos.world.kind?x:left-15,amos.world.kind?h-12:y+3);
    }
    if(!amos.world.kind){const x=left+(amos.world.target+1)*.5*(right-left);wc.setLineDash([3,5]);line(wc,x,top,x,bottom,rgba(ink,.35));wc.setLineDash([]);wc.fillStyle=rgba(ink,.6);wc.fillText('target',x,16);}
  }
  function nodes(){
    const [w,h]=size(neuralCanvas,nc),cx=w*.5,cy=h*.5,r=Math.min(w*.31,h*.40);
    const pos=shownH.map((v,i)=>{const angle=i*Math.PI*2/24-Math.PI/2,rr=r*(i%3===0?.63:1);return [cx+Math.cos(angle)*rr,cy+Math.sin(angle)*rr];});
    nc.font='8px ui-monospace, monospace';nc.textAlign='center';
    ring(nc,cx,cy,r+17,rgba(ink,.05));ring(nc,cx,cy,r*.63,rgba(ink,.035));
    line(nc,cx-r-30,cy,cx+r+30,cy,rgba(ink,.04));line(nc,cx,cy-r-18,cx,cy+r+18,rgba(ink,.04));
    for(const e of edges){const [x,y]=pos[e.i],[xx,yy]=pos[e.j];const active=Math.abs(shownH[e.i]);
      line(nc,x,y,xx,yy,rgba(e.v>=0?gold:green,.025+.19*active),.55+active*.45);
    }
    for(let i=0;i<pos.length;i++){
      const [x,y]=pos[i],v=shownH[i],a=Math.min(1,Math.abs(v)),c=v>=0?gold:green;
      const glow=nc.createRadialGradient(x,y,1,x,y,10+8*a);glow.addColorStop(0,rgba(c,a*.18));glow.addColorStop(1,rgba(c,0));
      dot(nc,x,y,10+8*a,glow);ring(nc,x,y,4.2+a*4.3,rgba(c,.15+a*.4));dot(nc,x,y,1.5+a*2.5,rgba(c,.3+a*.7));
      if(i%3!==0){const ang=i*Math.PI*2/24-Math.PI/2;nc.fillStyle=rgba(ink,.4);nc.fillText(String(i+1).padStart(2,'0'),cx+Math.cos(ang)*(r+22),cy+Math.sin(ang)*(r+22)+3);}
    }
  }
  function redraw(time){
    const dt=previous?Math.min(64,time-previous):16;previous=time;
    const blend=reduced.matches?1:1-Math.exp(-dt/105);let difference=0;
    for(let i=0;i<shownO.length;i++){shownO[i]+=(targetO[i]-shownO[i])*blend;difference+=Math.abs(targetO[i]-shownO[i]);}
    for(let i=0;i<shownH.length;i++){shownH[i]+=(targetH[i]-shownH[i])*blend;difference+=Math.abs(targetH[i]-shownH[i]);}
    pulse=reduced.matches?0:pulse*Math.exp(-dt/180);world();nodes();
    if(!reduced.matches&&(difference>.002||pulse>.003))frame=requestAnimationFrame(redraw);else{frame=0;previous=0;}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(redraw);}
  function sync(){
    targetO=amos.world.observe().slice();targetH=amos.subject.h.slice();
    if(birth!==amos.birth||amos.world.tick<tick){shownO=targetO.slice();shownH=targetH.slice();}
    if(tick!==amos.world.tick)pulse=1;
    birth=amos.birth;tick=amos.world.tick;
    if(basis!==amos.subject.recurrent){basis=amos.subject.recurrent;edges=[];
      for(let i=0;i<24;i++){
        const row=basis[i].map((v,j)=>({i,j,v})).filter(e=>e.j!==i).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,2);edges.push(...row);
      }
    }
    document.body.classList.toggle('is-running',running);
    worldCanvas.setAttribute('aria-label',`Channel A ${targetO[0].toFixed(3)}, channel B ${targetO[1].toFixed(3)}, tick ${tick}`);
    neuralCanvas.title='Recurrent activations. Amber: positive; green: negative. Lines: two strongest weights per neuron.';
    schedule();
  }
  const laboratoryRender=render;
  render=function(){laboratoryRender();sync();};
  new ResizeObserver(schedule).observe(document.querySelector('.workspace'));
  reduced.addEventListener('change',()=>{shownO=targetO.slice();shownH=targetH.slice();schedule();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=0;}else sync();});
  document.addEventListener('click',()=>{document.body.classList.toggle('is-running',running);});
  sync();
})();
