/* Navigation and viewport behavior are independent of the network engine. */
(()=>{
 const sidebar=document.querySelector('.sidebar'),toggle=document.getElementById('nav-toggle'),scrim=document.getElementById('nav-scrim'),close=document.getElementById('nav-close');
 let priorFocus;
 function setDrawer(open){document.body.classList.toggle('drawer-open',open);toggle.setAttribute('aria-expanded',String(open));const small=matchMedia('(max-width:1100px)').matches;sidebar.inert=small&&!open;if(open){priorFocus=document.activeElement;close.focus();}else if(priorFocus){priorFocus.focus();priorFocus=null;}}
 toggle.onclick=()=>setDrawer(!document.body.classList.contains('drawer-open'));close.onclick=()=>setDrawer(false);scrim.onclick=()=>setDrawer(false);
 sidebar.addEventListener('click',e=>{if(e.target.closest('.nav-item,.exp-item,#guide-button,.brand')&&matchMedia('(max-width:1100px)').matches)setDrawer(false);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')setDrawer(false);if(e.key==='Tab'&&document.body.classList.contains('drawer-open')){const items=[...sidebar.querySelectorAll('button,a,input')].filter(x=>!x.disabled&&x.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('device-search').focus();}});
 const mq=matchMedia('(max-width:1100px)');mq.addEventListener('change',()=>{document.body.classList.remove('drawer-open');toggle.setAttribute('aria-expanded','false');sidebar.inert=mq.matches;});sidebar.inert=mq.matches;
 const finder=document.getElementById('device-finder'),search=document.getElementById('device-search'),list=document.getElementById('device-options'),wrap=document.querySelector('.topology-wrap');
 const baseTopology=renderTopology;
 renderTopology=function(){baseTopology();wrap.classList.toggle('enterprise-view',!!state.enterprise);list.replaceChildren(...state.devices.map(d=>{const o=document.createElement('option');o.value=d.name;return o;}));};
 function showDevice(){const d=engine.get(selected);if(!d)return;const node=document.querySelector(`[data-device="${CSS.escape(d.id)}"]`);node?.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});if(matchMedia('(max-width:820px)').matches){document.getElementById('inspector').scrollIntoView({block:'start',behavior:'smooth'});}}
 finder.onsubmit=e=>{e.preventDefault();const q=search.value.trim().toLowerCase();if(!q)return;const d=state.devices.find(d=>d.name.toLowerCase()===q)||state.devices.find(d=>d.name.toLowerCase().includes(q)||d.interfaces.some(i=>i.ip===q));if(!d)return notify('No matching device. Try a name or IP address.',true);selectDevice(d.id);showDevice();};
 document.getElementById('configure-jump').onclick=()=>{document.getElementById('inspector').scrollIntoView({block:'start',behavior:'smooth'});};
 // Touch pans the canvas; a tap still selects a device. Mouse dragging remains available.
 const svg=document.getElementById('topology');let touchStart=null;
 svg.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||tool!=='select')return;touchStart={x:e.clientX,y:e.clientY};e.stopImmediatePropagation();},true);
 svg.addEventListener('click',e=>{if(!touchStart||tool!=='select')return;const start=touchStart;touchStart=null;const node=e.target.closest('[data-device]');if(node&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<16){selectDevice(node.dataset.device);if(matchMedia('(max-width:820px)').matches)document.getElementById('inspector').scrollIntoView({block:'start',behavior:'smooth'});}});
 const expand=document.getElementById('expand-workspace'),card=document.querySelector('.canvas-card');let expanded=false;
 function setExpanded(value){expanded=value;card.classList.toggle('workspace-fullscreen',value);document.body.classList.toggle('body-workspace-full',value);expand.textContent=value?'↙':'↗';expand.setAttribute('aria-label',value?'Close expanded workspace':'Expand workspace');expand.setAttribute('aria-pressed',String(value));}
 expand.onclick=()=>setExpanded(!expanded);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expanded)setExpanded(false);});
 const oldScenario=loadScenario;loadScenario=function(...args){oldScenario(...args);search.value='';wrap.scrollLeft=0;};
 renderTopology();
})();
