'use strict';
// Controller regression tests with a minimal DOM adapter. Visual layout still
// needs a browser review; these tests exercise the real app and network engine.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function workspace() {
  const nodes = new Map();
  const collections = new Map();
  function element(key = '') {
    const classes = new Set();
    const attributes = new Map();
    let html = '';
    const el = {
      dataset: {}, style: {setProperty(k,v){this[k]=v;}}, children: [], hidden: false,
      textContent: '', value: '', clientWidth: 1100, clientHeight: 560,
      scrollLeft: 0, scrollTop: 0, isConnected: true,
      viewBox: {baseVal: {width:1600,height:820}},
      classList: {add: (...a)=>a.forEach(x=>classes.add(x)),remove: (...a)=>a.forEach(x=>classes.delete(x)),contains: x=>classes.has(x),toggle(x,on){on=on??!classes.has(x);on?classes.add(x):classes.delete(x);return on;}},
      setAttribute(k,v){attributes.set(k,String(v));if(k==='viewBox'){const p=v.split(' ').map(Number);this.viewBox.baseVal={width:p[2],height:p[3]};}},
      getAttribute: k=>attributes.get(k),
      toggleAttribute(k,on){if(on)attributes.set(k,'');else attributes.delete(k);},
      addEventListener(){}, append(...a){this.children.push(...a);}, prepend(...a){this.children.unshift(...a);},
      replaceChildren(...a){this.children=a;}, after(){}, insertBefore(n){this.children.push(n);},
      remove(){this.isConnected=false;}, focus(){}, scrollIntoView(){},
      showModal(){this.open=true;},close(){this.open=false;},click(){this.onclick?.();},
      querySelector: s=>get(s),querySelectorAll: s=>collections.get(s)||[],
      get innerHTML(){return html;},
      set innerHTML(value){
        html=value;
        for (const attr of ['exp','scenario','device','link','inspect-tab']) {
          const matches=[...value.matchAll(new RegExp('data-'+attr+'="([^"]+)"','g'))];
          if (matches.length || (key==='#topology' && ['device','link'].includes(attr))) collections.set('[data-'+attr+']', matches.map(m=>{const n=element();n.dataset[attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=m[1];return n;}));
        }
      }
    };
    Object.defineProperty(el,'id',{set(value){nodes.set('#'+value,this);}});
    Object.defineProperty(el,'parentElement',{get:()=>get(key==='#topology'?'.topology-wrap':'.canvas-tool-right')});
    return el;
  }
  function get(key){if(!nodes.has(key))nodes.set(key,element(key));return nodes.get(key);}
  const document={querySelector:get,querySelectorAll:s=>collections.get(s)||[],getElementById:id=>get('#'+id),createElement:()=>element(),createElementNS:()=>element(),addEventListener(){},body:element(),documentElement:element()};
  const context={document,console,CSS:{escape:x=>x},setTimeout:()=>0,clearTimeout(){},matchMedia:()=>({matches:false,addEventListener(){}}),performance:{now:()=>0},requestAnimationFrame:()=>{},localStorage:{getItem:()=>null,setItem(){}},FormData,Date};
  context.window=context;
  vm.createContext(context);
  get('.topology-wrap').classList.add('overview-fit');
  for(const name of ['network','enterprise','app','ui','glass'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/'+name+'.js'),'utf8'),context,{filename:name+'.js'});
  return {run:code=>vm.runInContext(code,context),get,collections};
}

test('landing shows the complete basic topology without selecting EIGRP or a device',()=>{
  const w=workspace();
  assert.equal(w.run('state.scenario'),'basic');
  assert.equal(w.run('state.lab'),null);
  assert.equal(w.run('selected'),null);
  assert.equal(w.get('#inspector').hidden,true);
  assert.equal(w.get('#protocol-label').textContent,'Connected');
  assert.equal(w.get('#zoom-label').textContent,'Fit');
  assert.equal(w.collections.get('[data-device]').length,28);
  assert.equal(w.run('state.events.some(e=>e.message.includes("EIGRP"))'),false);
});

test('scenario picker follows lab order and clicking a scenario displays its topology',()=>{
  const w=workspace();w.get('#scenario-button').click();
  const entries=w.collections.get('[data-scenario]');
  assert.equal(entries[0].dataset.scenario,'basic');
  assert.equal(entries.at(-2).dataset.scenario,'enterprise');
  assert.equal(entries.at(-1).dataset.scenario,'remote');
  const nums=w.run('scenarios.map(s=>Number(s.exp.match(/[0-9]+/)[0]))');
  assert.deepEqual(Array.from(nums),Array.from(nums).sort((a,b)=>a-b));
  entries.find(e=>e.dataset.scenario==='enterprise').click();
  assert.equal(w.run('state.lab'),11);
  assert.equal(w.get('#protocol-label').textContent,'EIGRP');
  assert.equal(w.collections.get('[data-device]').length,36);
  assert.equal(w.get('#modal').open,false);
  assert.equal(w.get('#inspector').hidden,true);
  assert.equal(w.get('#wan-failover').hidden,false);
});

test('all twelve experiment buttons load the matching lab without opening a guide',()=>{
  const w=workspace();
  for(let lab=1;lab<=12;lab++){
    w.collections.get('[data-exp]')[lab-1].click();
    assert.equal(w.run('state.lab'),lab);
    assert.equal(w.run('state.scenario===experiments[state.lab-1].scenario'),true);
    assert.equal(w.get('#modal').open,false);
    assert.equal(w.get('#inspector').hidden,true);
    assert.equal(w.get('#zoom-label').textContent,'Fit');
  }
});

test('ping distinguishes a local reply from an unreachable remote LAN and clears on scenario change',()=>{
  const w=workspace();w.get('#ping-launch').click();
  w.run("runTest('p1','p2','ping')");
  assert.equal(w.run('lastPacket.ok'),true);
  assert.match(w.get('#tool-result').innerHTML,/Connection verified/);
  assert.match(w.get('#tool-result').innerHTML,/Replies received/);
  assert.equal(w.get('#ping-summary').hidden,false);
  w.run("runTest('p1','p5','ping')");
  assert.equal(w.run('lastPacket.ok'),false);
  assert.match(w.get('#tool-result').innerHTML,/Connection unsuccessful/);
  assert.match(w.get('#tool-result').innerHTML,/100%/);
  w.run("loadScenario('ospf')");
  assert.equal(w.get('#ping-summary').hidden,true);
  assert.equal(w.run('lastPacket'),null);
  w.get('#ping-launch').click();w.run("runTest('p1','p5','trace')");
  assert.equal(w.run('lastPacket.ok'),true);
  assert.match(w.get('#tool-result').innerHTML,/Destination reached/);
  assert.match(w.get('#hop-path').innerHTML,/FORWARD PATH/);
});

test('zoom changes the scrollable SVG dimensions and fit restores the complete overview',()=>{
  const w=workspace();
  w.get('#zoom-in').click();
  assert.equal(w.get('.topology-wrap').classList.contains('overview-fit'),false);
  const width=parseFloat(w.get('#topology').style['--map-width']);
  w.get('#zoom-in').click();
  assert.ok(parseFloat(w.get('#topology').style['--map-width'])>width);
  w.get('#fit-button').click();
  assert.equal(w.get('.topology-wrap').classList.contains('overview-fit'),true);
  assert.equal(w.get('#zoom-label').textContent,'Fit');
  assert.equal(w.get('.topology-wrap').scrollLeft,0);
});

test('device configuration opens on selection and closing it restores an undimmed map',()=>{
  const w=workspace();
  w.run("selectDevice('r1')");
  assert.equal(w.get('#inspector').hidden,false);
  assert.match(w.get('#inspector').innerHTML,/Terminal Router/);
  w.get('#focus-network').click();
  assert.equal(w.get('#focus-network').getAttribute('aria-pressed'),'true');
  w.get('#close-inspector').click();
  assert.equal(w.get('#inspector').hidden,true);
  assert.equal(w.run('selected'),null);
  assert.equal(w.get('#focus-network').getAttribute('aria-pressed'),'false');
  assert.equal(w.collections.get('[data-device]').some(n=>n.classList.contains('network-dimmed')),false);
});
