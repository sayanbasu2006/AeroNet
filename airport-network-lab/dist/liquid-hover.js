/* Pointer-driven reflections only; network positions and click targets stay put. */
(()=>{
  const finePointer=matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const controls='button:not(.nav-scrim),a.btn';
  const surfaces='.metrics>div,.scenario-card,.guide-card,.canvas-card,.inspector,.activity-card';
  const movable='.metrics>div,.guide-card';
  let active=new Set(),frame=0,pointer=null;

  function release(el){
    el.classList.remove('liquid-active');
    el.style.removeProperty('--liquid-rx');
    el.style.removeProperty('--liquid-ry');
  }
  function clear(){
    if(frame)cancelAnimationFrame(frame);
    frame=0;pointer=null;
    active.forEach(release);active.clear();
  }
  function paint(){
    frame=0;
    if(!pointer||!finePointer.matches)return clear();
    const {target,x,y}=pointer;
    if(!target.isConnected)return clear();
    const next=new Set();
    for(const selector of [controls,surfaces,'.device-node']){
      const el=target.closest(selector);
      if(el&&!el.matches(':disabled,[aria-disabled="true"]'))next.add(el);
    }
    for(const el of active)if(!next.has(el))release(el);
    for(const el of next){
      const node=el.matches('.device-node');
      if(!node){
        if(!el.classList.contains('liquid-hover')){
          if(getComputedStyle(el).position==='static')el.classList.add('liquid-relative');
          el.classList.add('liquid-hover');
          if(el.matches(movable))el.classList.add('liquid-tilt');
          if(el.matches(controls))el.classList.add('liquid-control');
        }
        const rect=el.getBoundingClientRect();
        if(!rect.width||!rect.height)continue;
        const px=reducedMotion.matches ? .5 : Math.max(0,Math.min(1,(x-rect.left)/rect.width));
        const py=reducedMotion.matches ? .5 : Math.max(0,Math.min(1,(y-rect.top)/rect.height));
        el.style.setProperty('--liquid-x',(px*100).toFixed(2)+'%');
        el.style.setProperty('--liquid-y',(py*100).toFixed(2)+'%');
        if(!reducedMotion.matches&&el.matches(movable)){
          el.style.setProperty('--liquid-rx',((.5-py)*2).toFixed(2)+'deg');
          el.style.setProperty('--liquid-ry',((px-.5)*2).toFixed(2)+'deg');
        }
      }
      el.classList.add('liquid-active');
    }
    active=next;
  }
  function track(event){
    if(!finePointer.matches||event.pointerType!=='mouse'||event.buttons)return clear();
    if(!(event.target instanceof Element))return;
    pointer={target:event.target,x:event.clientX,y:event.clientY};
    if(!frame)frame=requestAnimationFrame(paint);
  }
  document.addEventListener('pointerover',track,{passive:true});
  document.addEventListener('pointermove',track,{passive:true});
  document.addEventListener('pointerout',event=>{if(!event.relatedTarget)clear();},{passive:true});
  document.addEventListener('pointercancel',clear,{passive:true});
  // Stop reflections while dragging a topology device or scrolling the map.
  document.addEventListener('pointerdown',event=>{if(event.target.closest?.('.device-node'))clear();},{passive:true});
  document.addEventListener('scroll',clear,{passive:true,capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
  window.addEventListener('blur',clear);
  finePointer.addEventListener('change',clear);
  reducedMotion.addEventListener('change',clear);
})();
