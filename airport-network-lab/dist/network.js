/* AeroNet's deterministic teaching model. No sockets, backend, or IOS runtime.
   Physical links, L2 segments, prefix matching, routing and return paths are
   evaluated from the current configuration for every packet test. */
(function (root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const ipNum = ip => {
    if (typeof ip !== 'string' || !/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return null;
    const parts = ip.split('.').map(Number);
    return parts.some(n => n > 255) ? null : parts.reduce((n, p) => (n * 256 + p) >>> 0, 0);
  };
  const numIP = n => [24,16,8,0].map(s => (n >>> s) & 255).join('.');
  const maskNum = p => p === 0 ? 0 : (0xffffffff << (32-p)) >>> 0;
  const prefix = mask => {
    const n = ipNum(mask); if (n === null) return null;
    const bits = n.toString(2).padStart(32,'0');
    return /^1*0*$/.test(bits) ? bits.indexOf('0') < 0 ? 32 : bits.indexOf('0') : null;
  };
  const inNet = (ip, net, mask) => ipNum(ip) !== null && ipNum(net) !== null && prefix(mask) !== null && ((ipNum(ip)&ipNum(mask)) >>> 0) === ((ipNum(net)&ipNum(mask)) >>> 0);
  const network = (ip, mask) => numIP((ipNum(ip)&ipNum(mask)) >>> 0);
  const wildcardMatch = (ip, net, wc) => ipNum(ip) !== null && ipNum(net) !== null && ipNum(wc) !== null && ((ipNum(ip)&~ipNum(wc)) >>> 0) === ((ipNum(net)&~ipNum(wc)) >>> 0);
  const wildcard = mask => numIP((~ipNum(mask)) >>> 0);
  const classMask = ip => Number(ip.split('.')[0]) < 128 ? '255.0.0.0' : Number(ip.split('.')[0]) < 192 ? '255.255.0.0' : '255.255.255.0';
  function validateIP(ip, mask, gateway) {
    if (ipNum(ip) === null) throw Error('Enter a valid IPv4 address (four octets from 0 to 255).');
    if (Number(ip.split('.')[0]) === 0 || Number(ip.split('.')[0]) >= 224 || Number(ip.split('.')[0]) === 127) throw Error('Use a unicast address outside 0/8, 127/8 and multicast ranges.');
    const p = prefix(mask); if (p === null) throw Error('Subnet mask must have contiguous network bits.');
    if (p < 31 && (ipNum(ip) === ipNum(network(ip,mask)) || ipNum(ip) === ((ipNum(network(ip,mask)) | ~ipNum(mask)) >>> 0))) throw Error('Use a host address, not the network or broadcast address.');
    if (gateway && (ipNum(gateway) === null || !inNet(gateway,ip,mask) || gateway === ip)) throw Error('The gateway must be a different address in this subnet.');
    return true;
  }
  function subnet(cidr) {
    const [ip, raw] = cidr.trim().split('/'); const p = Number(raw);
    if (ipNum(ip) === null || raw === undefined || !/^\d+$/.test(raw) || p < 0 || p > 32) throw Error('Enter an IPv4 address with a prefix from /0 to /32.');
    const mask=maskNum(p), net=(ipNum(ip)&mask)>>>0, broadcast=(net|~mask)>>>0;
    const count=2**(32-p), usable=p>=31?count:count-2;
    return {ip,prefix:p,mask:numIP(mask),wildcard:numIP((~mask)>>>0),network:numIP(net),broadcast:numIP(broadcast),first:numIP(p>=31?net:net+1),last:numIP(p>=31?broadcast:broadcast-1),usable,total:count};
  }
  const iface = (name,ip='',mask='255.255.255.224') => ({name,ip,mask,up:true,nat:'none',clockRate:64000});
  const protocol = () => ({rip:{enabled:false,version:2,networks:[]},ospf:{enabled:false,process:1,networks:[]}});
  const router = (id,name,short,x,y,interfaces) => ({id,name,short,type:'router',model:'ISR 2911 · Router',x,y,interfaces,routes:[],protocols:protocol(),nat:{static:[],mode:'off',acl:[],pools:[],sourceList:'1',poolName:'AIRPORT',outside:'Serial0/0/0'},cli:{mode:'user',iface:null,output:['AeroNet IOS teaching console','Type enable to enter privileged mode. Type ? for help.'],history:[]}});
  const pc = (id,name,ip,gateway,x,y,type='pc') => ({id,name,short:name,type,model:type==='server'?'Server-PT · Ethernet':'PC-PT · Fast Ethernet',x,y,interfaces:[iface('FastEthernet0',ip)],gateway,arp:[]});
  const sw = (id,name,x,y) => ({id,name,short:name,type:'switch',model:'Catalyst 2960 · 24 ports',x,y,interfaces:Array.from({length:24},(_,i)=>iface('FastEthernet0/'+(i+1),'',''))});
  function makeScenario(kind='ospf') {
    const devices=[
      router('r1','Terminal Router','TERM-R1',410,280,[iface('GigabitEthernet0/0','10.10.10.1'),iface('GigabitEthernet0/1','10.10.20.1'),iface('Serial0/0/0','172.16.0.1','255.255.255.252')]),
      router('r2','Control Tower Router','TWR-R2',745,280,[iface('GigabitEthernet0/0','10.20.10.1'),iface('Serial0/0/0','172.16.0.2','255.255.255.252'),iface('Serial0/0/1','172.16.0.5','255.255.255.252')]),
      router('r3','ISP Router','ISP-R3',745,100,[iface('GigabitEthernet0/0','203.0.113.1'),iface('Serial0/0/0','172.16.0.6','255.255.255.252')]),
      sw('s1','Check-in LAN',190,400),sw('s2','Security LAN',445,445),sw('s3','Baggage LAN',840,420),
      pc('p1','Check-in-Desk-01','10.10.10.10','10.10.10.1',100,545),pc('p2','Check-in-Desk-02','10.10.10.11','10.10.10.1',270,545),
      pc('p3','Security-PC-01','10.10.20.10','10.10.20.1',445,555),pc('p4','Baggage-Server','10.20.10.10','10.20.10.1',760,555,'server'),
      pc('p5','Control-Tower-PC-01','10.20.10.11','10.20.10.1',945,555),pc('p6','Flight-API-Server','203.0.113.10','203.0.113.1',990,100,'server')
    ];
    // Keep the original host IDs so existing saved labs and tools remain compatible.
    const positions={r1:[500,210],r2:[1050,210],r3:[1100,70],s1:[250,380],s2:[700,380],s3:[1250,380],p1:[80,570],p2:[200,570],p3:[580,570],p4:[1000,570],p5:[1160,570],p6:[1400,70]};
    devices.forEach(d=>{[d.x,d.y]=positions[d.id];});
    const extraHosts=[];
    const checkPositions=[[320,570],[440,570],[100,720],[220,720],[340,720],[460,720]];
    const securityPositions=[[700,570],[820,570],[600,720],[720,720],[840,720]];
    const towerPositions=[[1320,570],[1480,570],[1080,720],[1240,720],[1400,720]];
    function addHosts(prefix,idPrefix,points,subnet,startNumber,switchId,startPort){
      points.forEach(([x,y],i)=>{
        const number=startNumber+i,id=idPrefix+number;
        devices.push(pc(id,prefix+'-'+String(number).padStart(2,'0'),subnet+'.'+(prefix==='Control-Tower-PC'?10+number:9+number),subnet+'.1',x,y));
        extraHosts.push({id,switchId,port:'FastEthernet0/'+(startPort+i)});
      });
    }
    addHosts('Check-in-Desk','check',checkPositions,'10.10.10',3,'s1',4);
    addHosts('Security-PC','security',securityPositions,'10.10.20',2,'s2',3);
    addHosts('Control-Tower-PC','tower',towerPositions,'10.20.10',2,'s3',4);
    const links=[];
    const link=(a,ai,b,bi,type='straight')=>links.push({id:'l'+(links.length+1),a,ai,b,bi,type});
    link('r1','Serial0/0/0','r2','Serial0/0/0','serial');link('r2','Serial0/0/1','r3','Serial0/0/0','serial');
    link('r1','GigabitEthernet0/0','s1','FastEthernet0/1');link('r1','GigabitEthernet0/1','s2','FastEthernet0/1');link('r2','GigabitEthernet0/0','s3','FastEthernet0/1');
    link('p1','FastEthernet0','s1','FastEthernet0/2');link('p2','FastEthernet0','s1','FastEthernet0/3');link('p3','FastEthernet0','s2','FastEthernet0/2');
    link('p4','FastEthernet0','s3','FastEthernet0/2');link('p5','FastEthernet0','s3','FastEthernet0/3');link('r3','GigabitEthernet0/0','p6','FastEthernet0','cross');
    extraHosts.forEach(h=>link(h.id,'FastEthernet0',h.switchId,h.port));
    const state={version:1,scenario:kind,devices,links,translations:[],packets:[],events:[],lab:kind==='p2p'?2:kind==='basic'?1:kind==='static'?5:kind.startsWith('nat')?6:kind.startsWith('rip')?7:8};
    const engine=new Engine(state);
    if(kind==='ospf'||kind==='multi') engine.enableAll('ospf',kind==='multi');
    if(kind==='rip1'||kind==='rip2') engine.enableAll(kind);
    if(kind==='static') engine.staticPreset();
    if(['nat','nat-static','nat-pool'].includes(kind)) {
      const [a,b,c]=devices;
      a.routes=[{net:'0.0.0.0',mask:'0.0.0.0',next:'172.16.0.2'}];
      b.routes=[{net:'0.0.0.0',mask:'0.0.0.0',next:'172.16.0.6'},{net:'172.16.0.8',mask:'255.255.255.248',next:'172.16.0.1'}];
      c.routes=[{net:'172.16.0.0',mask:'255.255.255.240',next:'172.16.0.5'},{net:'10.20.10.0',mask:'255.255.255.224',next:'172.16.0.5'}];
      a.interfaces[0].nat='inside';a.interfaces[1].nat='inside';a.interfaces[2].nat='outside';
      a.nat.acl=[{id:'1',net:'10.10.0.0',wc:'0.0.255.255'}];
      if(kind==='nat-static') a.nat.static=[{local:'10.10.10.10',global:'172.16.0.10'}];
      else if(kind==='nat-pool') {a.nat.mode='pool';a.nat.pools=[{name:'AIRPORT',start:'172.16.0.10',end:'172.16.0.14',mask:'255.255.255.248'}];}
      else a.nat.mode='pat';
    }
    if(kind==='p2p') {
      state.devices=[pc('p1','Check-in-Desk-01','192.168.1.1','',330,310),pc('p2','Check-in-Desk-02','192.168.1.2','',750,310)];
      state.devices.forEach(d=>d.interfaces[0].mask='255.255.255.0');
      state.links=[{id:'l1',a:'p1',ai:'FastEthernet0',b:'p2',bi:'FastEthernet0',type:'cross'}];
    }
    return state;
  }
  class Engine {
    constructor(state){this.state=state;}
    get devices(){return this.state.devices;}
    get routers(){return this.devices.filter(d=>d.type==='router');}
    get(id){return this.devices.find(d=>d.id===id);}
    port(d,name){return d?.interfaces.find(i=>i.name===name);}
    linkUp(l){
      const a=this.get(l.a),b=this.get(l.b),ai=this.port(a,l.ai),bi=this.port(b,l.bi);
      if(!ai?.up||!bi?.up)return false;
      const serial=ai.name.startsWith('Serial')&&bi.name.startsWith('Serial');
      if(l.type==='serial')return a.type==='router'&&b.type==='router'&&serial&&(ai.encapsulation||'hdlc')===(bi.encapsulation||'hdlc');
      if(ai.name.startsWith('Serial')||bi.name.startsWith('Serial'))return false;
      const hasSwitch=a.type==='switch'||b.type==='switch';
      const sameSwitch=a.type==='switch'&&b.type==='switch';
      return l.type===(hasSwitch&&!sameSwitch?'straight':'cross');
    }
    // L2 traversal stops at routers and hosts, so a router cannot act as a switch.
    l2Path(a,b,firstPort=null,lastPort=null){
      const queue=[{id:a,path:[a]}],seen=new Set([a]);
      while(queue.length){const cur=queue.shift();if(cur.id===b)return cur.path;
        if(cur.id!==a&&this.get(cur.id)?.type!=='switch')continue;
        for(const l of this.state.links){if(!this.linkUp(l))continue;
          const forward=l.a===cur.id,reverse=l.b===cur.id;if(!forward&&!reverse)continue;
          const next=forward?l.b:l.a,fromPort=forward?l.ai:l.bi,toPort=forward?l.bi:l.ai;
          if(cur.id===a&&firstPort&&fromPort!==firstPort)continue;
          if(next===b&&lastPort&&toPort!==lastPort)continue;
          if(!seen.has(next)){seen.add(next);queue.push({id:next,path:[...cur.path,next]});}
        }
      }return null;
    }
    connected(r){return r.interfaces.filter(i=>i.up&&i.ip&&this.state.links.some(l=>(l.a===r.id&&l.ai===i.name||l.b===r.id&&l.bi===i.name)&&this.linkUp(l))).map(i=>({net:network(i.ip,i.mask),mask:i.mask,next:'connected',iface:i.name,code:'C',ad:0,metric:0,origin:r.id}));}
    adjacency(){const result=[];for(const a of this.routers)for(const b of this.routers){if(a.id===b.id)continue;
      for(const ai of a.interfaces.filter(i=>i.up&&i.ip))for(const bi of b.interfaces.filter(i=>i.up&&i.ip)){
        if(ai.mask!==bi.mask||!inNet(ai.ip,bi.ip,ai.mask)||ai.ip===bi.ip)continue;
        const path=this.l2Path(a.id,b.id,ai.name,bi.name);if(path)result.push({a:a.id,b:b.id,ai:ai.name,bi:bi.name,next:bi.ip,path,cost:ai.name.startsWith('Serial')?64:1});
      }}return result;}
    ospfArea(r,ifaceName){const i=this.port(r,ifaceName);return r.protocols.ospf.enabled&&i?.ip?r.protocols.ospf.networks.find(n=>wildcardMatch(i.ip,n.net,n.wc))?.area:undefined;}
    ripOn(r,ifaceName){const i=this.port(r,ifaceName);return r.protocols.rip.enabled&&i?.ip&&r.protocols.rip.networks.some(n=>inNet(i.ip,n,classMask(n)));}
    protocolEdges(type){return this.adjacency().filter(e=>{
      const a=this.get(e.a),b=this.get(e.b);
      if(type==='rip')return this.ripOn(a,e.ai)&&this.ripOn(b,e.bi)&&a.protocols.rip.version===b.protocols.rip.version;
      const aa=this.ospfArea(a,e.ai),ba=this.ospfArea(b,e.bi);return aa!==undefined&&aa===ba;
    });}
    dynamicRoutes(start,type){
      const edges=this.protocolEdges(type),dist={[start.id]:0},paths={[start.id]:[]},queue=[start.id];
      // Dijkstra for OSPF costs; hop count for RIP. Recomputed on configuration changes.
      const seen=new Set();while(queue.length){queue.sort((a,b)=>dist[a]-dist[b]);const id=queue.shift();if(seen.has(id))continue;seen.add(id);
        for(const e of edges.filter(e=>e.a===id)){
          if(type==='ospf'&&id!==start.id){const incoming=paths[id].at(-1),previous=this.ospfArea(this.get(id),incoming.bi),outgoing=this.ospfArea(this.get(id),e.ai);const areas=this.get(id).interfaces.map(i=>this.ospfArea(this.get(id),i.name));if(previous!==outgoing&&!areas.includes('0'))continue;}
          const n=dist[id]+(type==='rip'?1:e.cost);if(dist[e.b]===undefined||n<dist[e.b]){dist[e.b]=n;paths[e.b]=[...paths[id],e];queue.push(e.b);}
        }
      }
      const routes=[];for(const r of this.routers){if(r.id===start.id||dist[r.id]===undefined||type==='rip'&&dist[r.id]>=16)continue;
        for(const c of this.connected(r)){
          if(type==='rip'&&!this.ripOn(r,c.iface))continue;
          if(type==='ospf'){
            const area=this.ospfArea(r,c.iface);if(area===undefined)continue;
            const incoming=paths[r.id].at(-1);const fromArea=this.ospfArea(r,incoming.bi),areas=r.interfaces.map(i=>this.ospfArea(r,i.name));if(area!==fromArea&&!areas.includes('0'))continue;
          }
          let net=c.net,mask=c.mask;
          // RIPv1 sends classful summaries across a different major network.
          if(type==='rip'&&r.protocols.rip.version===1){const major=classMask(net);const first=paths[r.id][0];const out=this.port(start,first.ai);if(!inNet(out.ip,net,major)){mask=major;net=network(net,major);}}
          const first=paths[r.id][0],inter=type==='ospf'&&this.ospfArea(start,first.ai)!==this.ospfArea(r,c.iface);
          routes.push({net,mask,next:first.next,iface:first.ai,code:type==='rip'?'R':inter?'O IA':'O',ad:type==='rip'?120:110,metric:dist[r.id]+(type==='ospf'?1:0),origin:r.id});
        }
      }return routes;
    }
    routes(r){
      const entries=[...this.connected(r),...r.routes.map(s=>({...s,code:s.net==='0.0.0.0'?'S*':'S',ad:1,metric:0})),...this.dynamicRoutes(r,'ospf'),...this.dynamicRoutes(r,'rip'),...this.bgpRoutes(r)];
      const best=new Map();for(const e of entries){const key=e.net+'/'+prefix(e.mask),prev=best.get(key);if(!prev||e.ad<prev.ad||e.ad===prev.ad&&e.metric<prev.metric)best.set(key,e);}
      return [...best.values()].sort((a,b)=>prefix(b.mask)-prefix(a.mask)||a.ad-b.ad||ipNum(a.net)-ipNum(b.net));
    }
    routeFor(r,ip){return this.routes(r).filter(x=>inNet(ip,x.net,x.mask)).sort((a,b)=>prefix(b.mask)-prefix(a.mask)||a.ad-b.ad||a.metric-b.metric)[0];}
    enableAll(type,multi=false){for(const r of this.routers){r.protocols=protocol();if(type==='ospf'){
      r.protocols.ospf.enabled=true;r.protocols.ospf.networks=r.interfaces.filter(i=>i.ip).map(i=>({net:network(i.ip,i.mask),wc:wildcard(i.mask),area:multi&&i.name.startsWith('Gigabit')&&r.id!=='r3'?(r.id==='r1'?'1':'2'):'0'}));
    }else{r.protocols.rip={enabled:true,version:type==='rip1'?1:2,networks:[...new Set(r.interfaces.filter(i=>i.ip).map(i=>network(i.ip,classMask(i.ip))))]};}}}
    staticPreset(){for(const r of this.routers)r.protocols=protocol();const [a,b,c]=this.routers;
      a.routes=[{net:'0.0.0.0',mask:'0.0.0.0',next:'172.16.0.2'}];
      b.routes=[{net:'10.10.10.0',mask:'255.255.255.224',next:'172.16.0.1'},{net:'10.10.20.0',mask:'255.255.255.224',next:'172.16.0.1'},{net:'0.0.0.0',mask:'0.0.0.0',next:'172.16.0.6'}];
      c.routes=[{net:'10.0.0.0',mask:'255.0.0.0',next:'172.16.0.5'},{net:'172.16.0.0',mask:'255.255.255.252',next:'172.16.0.5'}];
    }
    neighbors(r){return this.protocolEdges('ospf').filter(e=>e.a===r.id).map(e=>({router:this.get(e.b).short,ip:e.next,iface:e.ai,area:this.ospfArea(r,e.ai),state:'FULL',cost:e.cost}));}
    findIP(ip){return this.devices.find(d=>d.type!=='switch'&&d.interfaces.some(i=>i.ip===ip&&i.up));}
    address(id){return this.get(id)?.interfaces.find(i=>i.ip)?.ip||'';}
    duplicate(ip){return this.devices.filter(d=>d.type!=='switch').flatMap(d=>d.interfaces.filter(i=>i.up&&i.ip===ip)).length>1;}
    natOutside(r){return r.interfaces.find(i=>i.name===r.nat.outside&&i.nat==='outside'&&i.up)||r.interfaces.find(i=>i.nat==='outside'&&i.up);}
    natSource(r,local,remote){
      const s=r.nat.static.find(n=>n.local===local);if(s)return {router:r.id,local,global:s.global,type:'Static',remote};
      const allowed=r.nat.acl.some(a=>a.id===r.nat.sourceList&&wildcardMatch(local,a.net,a.wc));if(!allowed)return null;
      if(r.nat.mode==='pat'){const out=this.natOutside(r);if(!out)return null;return {router:r.id,local,global:out.ip,type:'PAT',port:10000+(ipNum(local)%50000),remote};}
      if(r.nat.mode==='pool'){
        const pool=r.nat.pools.find(p=>p.name===r.nat.poolName);if(!pool)return null;
        const existing=this.state.translations.find(t=>t.router===r.id&&t.local===local&&t.type==='Dynamic');if(existing)return {...existing,remote};
        const used=this.state.translations.filter(t=>t.router===r.id).map(t=>t.global);let n=ipNum(pool.start);while(n<=ipNum(pool.end)&&used.includes(numIP(n)))n++;if(n>ipNum(pool.end))throw Error('Dynamic NAT pool exhausted.');
        return {router:r.id,local,global:numIP(n),type:'Dynamic',remote};
      }return null;
    }
    // Walk the forwarding table hop by hop. NAT changes packet addresses only on
    // inside/outside transitions; the echo reply is forwarded independently.
    walk(source,targetIP,sessions=[],isReply=false,sourceAddress=null){
      const src=this.get(source);if(!src||src.type==='switch')return {ok:false,reason:'Choose an IP-capable source device.',path:[]};
      const si=src.interfaces.find(i=>i.up&&i.ip&&(!sourceAddress||i.ip===sourceAddress));if(!si)return {ok:false,reason:'Source interface is down or has no IP address.',path:[source]};
      try{validateIP(si.ip,si.mask,src.type==='router'?'':src.gateway);}catch(e){return {ok:false,reason:e.message,path:[source]};}
      if(this.duplicate(si.ip))return {ok:false,reason:'Duplicate source IPv4 address detected.',path:[source]};
      const path=[source],steps=[],newSessions=[...sessions];let current=src,srcIP=si.ip,destIP=targetIP,inPort=null;
      if(src.type!=='router'){
        const dest=this.findIP(destIP);
        if(inNet(destIP,si.ip,si.mask)&&dest){const di=dest.interfaces.find(i=>i.ip===destIP);if(!inNet(si.ip,di.ip,di.mask))return {ok:false,reason:'Destination subnet mask does not match the source subnet.',path};const direct=this.l2Path(src.id,dest.id,si.name,di.name);if(direct)return {ok:!this.duplicate(destIP),reason:this.duplicate(destIP)?'Duplicate destination IP address.':'Direct delivery on the local LAN.',path:direct,steps,sessions:newSessions,srcIP,destIP};return {ok:false,reason:'Destination is on-link but cannot be reached at Layer 2. Check cable type and ports.',path};}
        if(inNet(destIP,si.ip,si.mask)&&!dest)return {ok:false,reason:'ARP unresolved: no device owns '+destIP+'.',path};
        if(!src.gateway)return {ok:false,reason:'No default gateway configured.',path};
        const gateway=this.routers.find(r=>r.interfaces.some(i=>i.up&&i.ip===src.gateway&&inNet(si.ip,i.ip,i.mask)));
        if(!gateway)return {ok:false,reason:'Default gateway is unavailable or in a different subnet.',path};
        const gi=gateway.interfaces.find(i=>i.ip===src.gateway),p=this.l2Path(src.id,gateway.id,si.name,gi.name);
        if(!p)return {ok:false,reason:'Cannot reach the default gateway. Check cables and interface status.',path};
        path.push(...p.slice(1));current=gateway;inPort=gi.name;steps.push({device:src.name,action:'ARP resolves gateway '+src.gateway});
      }
      const visited=new Set();
      for(let ttl=0;ttl<32;ttl++){
        if(visited.has(current.id+'|'+destIP))return {ok:false,reason:'Routing loop at '+current.name+'. TTL expired.',path,steps};visited.add(current.id+'|'+destIP);
        const inbound=this.port(current,inPort);
        if(inbound?.nat==='outside'){
          const t=newSessions.find(t=>t.router===current.id&&t.global===destIP)||current.nat.static.find(t=>t.global===destIP);
          if(t){steps.push({device:current.name,action:'Destination NAT: '+destIP+' → '+t.local});destIP=t.local;}
        }
        if(current.interfaces.some(i=>i.up&&i.ip===destIP))return {ok:true,path,steps,sessions:newSessions,srcIP,destIP};
        const target=this.findIP(destIP);if(target&&this.duplicate(destIP))return {ok:false,reason:'Duplicate destination IPv4 address detected.',path,steps};
        const route=this.routeFor(current,destIP);if(!route)return {ok:false,reason:current.name+' has no route to '+destIP+'.',path,steps};
        let out, nextRouter,segment;
        if(route.code==='C'){
          out=this.port(current,route.iface);
          if(!target)return {ok:false,reason:'ARP unresolved: no device owns '+destIP+'.',path,steps};
          const di=target.interfaces.find(i=>i.up&&i.ip===destIP);segment=this.l2Path(current.id,target.id,out.name,di.name);
          if(!segment)return {ok:false,reason:'Connected destination unreachable. Check LAN cables and port status.',path,steps};
          if(target.type!=='router'&&!inNet(out.ip,di.ip,di.mask))return {ok:false,reason:'Destination has an incompatible subnet mask.',path,steps};
          if(target.type==='router')nextRouter=target;
          steps.push({device:current.name,action:'Connected '+route.net+'/'+prefix(route.mask)+' via '+out.name});
        }else{
          const edge=this.adjacency().find(e=>e.a===current.id&&e.next===route.next);
          if(!edge)return {ok:false,reason:current.name+': next hop '+route.next+' is unreachable.',path,steps};
          out=this.port(current,edge.ai);nextRouter=this.get(edge.b);segment=edge.path;
          steps.push({device:current.name,action:route.code+' '+route.net+'/'+prefix(route.mask)+' via '+route.next});
        }
        if(inbound?.nat==='inside'&&out.nat==='outside'){
          let translation;try{translation=this.natSource(current,srcIP,destIP);}catch(e){return {ok:false,reason:e.message,path,steps};}
          if(translation){const key=t=>t.router===translation.router&&t.local===translation.local&&t.remote===translation.remote;newSessions.splice(0,newSessions.length,...newSessions.filter(t=>!key(t)),translation);steps.push({device:current.name,action:translation.type+' source NAT: '+srcIP+' → '+translation.global+(translation.port?':'+translation.port:'')});srcIP=translation.global;}
        }
        path.push(...segment.slice(1));
        if(!nextRouter)return {ok:true,path,steps,sessions:newSessions,srcIP,destIP};
        const nextIn=this.adjacency().find(e=>e.a===current.id&&e.b===nextRouter.id&&e.ai===out.name);current=nextRouter;inPort=nextIn.bi;
      }
      return {ok:false,reason:'TTL exceeded.',path,steps};
    }
    ping(source,dest,options={}){
      let targetIP=this.get(dest)?this.address(dest):dest;
      if(ipNum(targetIP)===null)return {ok:false,reason:'Enter a valid destination device or IPv4 address.',path:[],steps:[]};
      const forward=this.walk(source,targetIP);let result={...forward,targetIP,sourceIP:this.address(source)};
      if(forward.ok){const destination=this.findIP(forward.destIP);if(!destination)return {...result,ok:false,reason:'No endpoint can answer this address.'};
        const reverse=this.walk(destination.id,forward.srcIP,forward.sessions,true,forward.destIP);
        result={...result,ok:reverse.ok,returnPath:reverse.path,steps:[...(forward.steps||[]),...(reverse.steps||[]).map(s=>({...s,reply:true}))],reason:reverse.ok?'Echo request delivered; echo reply returned successfully.':'Echo request delivered, but reply failed: '+reverse.reason};
        if(reverse.ok&&reverse.destIP!==result.sourceIP)result={...result,ok:false,reason:'Reply did not reach the original source after translation.'};
        if(!options.dry&&result.ok){this.state.translations=[...this.state.translations.filter(t=>!forward.sessions.some(x=>x.router===t.router&&x.local===t.local&&x.remote===t.remote)),...forward.sessions];const src=this.get(source);if(src.type!=='router'){src.arp=src.arp||[];const ip=inNet(targetIP,src.interfaces[0].ip,src.interfaces[0].mask)?targetIP:src.gateway;src.arp=src.arp.filter(a=>a.ip!==ip);src.arp.push({ip,mac:'02:AE:00:'+ip.split('.').slice(1).map(n=>Number(n).toString(16).padStart(2,'0')).join(':'),iface:src.interfaces[0].name});}}
      }return result;
    }
    addRoute(r,net,mask,next){if(ipNum(net)===null||prefix(mask)===null||ipNum(next)===null)throw Error('Enter a valid network, subnet mask and next hop.');if(network(net,mask)!==net)throw Error('Destination must be the subnet network address.');const route={net,mask,next};r.routes=r.routes.filter(s=>s.net!==net||s.mask!==mask);r.routes.push(route);}
    resolveIface(r,name){const normalized=name.toLowerCase().replace(/^g(i(g(abit)?)?)?(ethernet)?/,'gigabitethernet').replace(/^f(a(st)?)?(ethernet)?/,'fastethernet').replace(/^s(e(rial)?)?/,'serial');return r.interfaces.find(i=>i.name.toLowerCase()===normalized||i.name.toLowerCase()===name.toLowerCase());}
    prompt(r){const suffix={user:'>',priv:'#',config:'(config)#',interface:'(config-if)#',rip:'(config-router)#',ospf:'(config-router)#'};return r.short+(suffix[r.cli.mode]||'>');}
    cli(r,command){
      const raw=command.trim(),words=raw.split(/\s+/),c=words.map(w=>w.toLowerCase()),mode=r.cli.mode;
      if(!raw)return '';
      const fail=m=>'% '+m;
      const requireConfig=()=>{if(!['config','interface','rip','ospf'].includes(mode))throw Error('Enter configure terminal first.');};
      try{
        if(c[0]==='?'||c[0]==='help')return 'enable · configure terminal · interface g0/0 · ip address IP MASK\nno shutdown · exit · end · ip route NETWORK MASK NEXT-HOP\nrouter rip · version 1|2 · network NETWORK\nrouter ospf 1 · network NETWORK WILDCARD area AREA\nip nat inside|outside · ip nat inside source static LOCAL GLOBAL\naccess-list 1 permit NETWORK WILDCARD\nip nat pool NAME START END netmask MASK\nip nat inside source list 1 interface s0/0/0 overload\nip nat inside source list 1 pool NAME\nshow ip route · show ip interface brief · show running-config\nshow ip ospf neighbor · show ip nat translations · show ip protocols';
        if(c[0]==='enable'||c[0]==='en'){if(mode==='user')r.cli.mode='priv';return '';}
        if(c[0]==='disable'){r.cli.mode='user';return '';}
        if(c[0]==='end'){r.cli.mode='priv';return '';}
        if(c[0]==='exit'){r.cli.mode=['interface','rip','ospf'].includes(mode)?'config':mode==='config'?'priv':'user';return '';}
        if((c[0]==='configure'&&c[1]==='terminal')||(c[0]==='conf'&&c[1]==='t')){if(mode!=='priv')return fail('Use enable first.');r.cli.mode='config';return 'Enter configuration commands, one per line. End with end.';}
        if(c[0]==='write'||c[0]==='wr'||raw==='copy running-config startup-config')return mode==='user'?fail('Use enable first.'):'Configuration retained for this lab. Use Save lab for browser storage.\n[OK]';
        if(c[0]==='show'||c[0]==='sh'){
          if(mode==='user')return fail('Use enable first.');const s=c.slice(1).join(' ');
          if(s==='ip route')return 'Codes: C - connected, S - static, R - RIP, O - OSPF, IA - inter-area, * - default\n'+this.routes(r).map(t=>`${t.code.padEnd(4)} ${t.net}/${prefix(t.mask)} [${t.ad}/${t.metric}] ${t.next==='connected'?'directly connected, '+t.iface:'via '+t.next}`).join('\n');
          if(s==='ip interface brief')return 'Interface               IP address       Status\n'+r.interfaces.map(i=>`${i.name.padEnd(23)} ${(i.ip||'unassigned').padEnd(16)} ${i.up?'up':'administratively down'}`).join('\n');
          if(s==='ip ospf neighbor')return this.neighbors(r).map(n=>`${n.router}  FULL  ${n.ip}  ${n.iface}  area ${n.area}`).join('\n')||'No OSPF neighbors.';
          if(s==='ip nat translations')return 'Type     Inside local      Inside global      Remote\n'+this.natTable(r).map(n=>`${n.type.padEnd(8)} ${n.local.padEnd(17)} ${(n.global+(n.port?':'+n.port:'')).padEnd(18)} ${n.remote||'---'}`).join('\n');
          if(s==='running-config'||s==='run')return this.runningConfig(r);
          if(s==='ip protocols')return `RIP: ${r.protocols.rip.enabled?'version '+r.protocols.rip.version:'disabled'}\nOSPF: ${r.protocols.ospf.enabled?'process '+r.protocols.ospf.process:'disabled'}\nEducational model converges immediately after a configuration change.`;
          return fail('Unsupported show command. Type ? for supported commands.');
        }
        requireConfig();
        if(c[0]==='hostname'&&words.length===2){r.short=words[1].replace(/[^a-zA-Z0-9_-]/g,'').slice(0,25)||r.short;return '';}
        if((c[0]==='interface'||c[0]==='int')&&words.length===2){const i=this.resolveIface(r,words[1]);if(!i)return fail('Unknown interface. Use show ip interface brief.');r.cli.iface=i.name;r.cli.mode='interface';return '';}
        if(mode==='interface'){
          const i=this.port(r,r.cli.iface);
          if(c[0]==='ip'&&c[1]==='address'&&words.length===4){validateIP(words[2],words[3]);i.ip=words[2];i.mask=words[3];return '';}
          if(raw.toLowerCase()==='no shutdown'||raw.toLowerCase()==='no shut'){i.up=true;return '%LINK: '+i.name+' is administratively up';}
          if(c[0]==='shutdown'||c[0]==='shut'){i.up=false;return '%LINK: '+i.name+' is administratively down';}
          if(c[0]==='clock'&&c[1]==='rate'&&Number(words[2])>0){i.clockRate=Number(words[2]);return '';}
          if(c[0]==='ip'&&c[1]==='nat'&&['inside','outside'].includes(c[2])&&words.length===3){i.nat=c[2];if(c[2]==='outside')r.nat.outside=i.name;return '';}
          if(c[0]==='no'&&c[1]==='ip'&&c[2]==='nat'){i.nat='none';return '';}
          return fail('Unsupported interface command. Use exit for global configuration.');
        }
        if(c[0]==='router'&&c[1]==='rip'&&words.length===2){r.protocols.rip.enabled=true;r.cli.mode='rip';return '';}
        if(c[0]==='router'&&c[1]==='ospf'&&/^\d+$/.test(words[2]||'')&&+words[2]>0){r.protocols.ospf.enabled=true;r.protocols.ospf.process=Number(words[2]);r.cli.mode='ospf';return '';}
        if(c[0]==='no'&&c[1]==='router'&&['ospf','rip'].includes(c[2])){r.protocols[c[2]].enabled=false;r.cli.mode='config';return '';}
        if(mode==='rip'){
          if(c[0]==='version'&&['1','2'].includes(c[1])){r.protocols.rip.version=Number(c[1]);return '';}
          if(raw.toLowerCase()==='no auto-summary')return 'RIPv2 uses subnet prefixes in this model; RIPv1 summarizes across major networks.';
          if(c[0]==='network'&&words.length===2&&ipNum(words[1])!==null){const net=network(words[1],classMask(words[1]));if(!r.protocols.rip.networks.includes(net))r.protocols.rip.networks.push(net);return '';}
          return fail('Use network NETWORK or version 1|2 in RIP mode.');
        }
        if(mode==='ospf'){
          if(c[0]==='network'&&c[3]==='area'&&words.length===5&&ipNum(words[1])!==null&&ipNum(words[2])!==null&&/^\d+$/.test(words[4])){r.protocols.ospf.networks=r.protocols.ospf.networks.filter(n=>n.net!==words[1]||n.wc!==words[2]);r.protocols.ospf.networks.push({net:words[1],wc:words[2],area:String(Number(words[4]))});return '';}
          return fail('Use network NETWORK WILDCARD area AREA in OSPF mode.');
        }
        if(c[0]==='ip'&&c[1]==='route'&&words.length===5){this.addRoute(r,words[2],words[3],words[4]);return '';}
        if(c[0]==='no'&&c[1]==='ip'&&c[2]==='route'&&words.length>=5){r.routes=r.routes.filter(s=>s.net!==words[3]||s.mask!==words[4]);return '';}
        if(c.slice(0,5).join(' ')==='ip nat inside source static'&&words.length===7){if(ipNum(words[5])===null||ipNum(words[6])===null)throw Error('Invalid NAT address.');r.nat.static=r.nat.static.filter(t=>t.local!==words[5]&&t.global!==words[6]);r.nat.static.push({local:words[5],global:words[6]});return '';}
        if(c[0]==='access-list'&&c[2]==='permit'&&words.length===5&&ipNum(words[3])!==null&&ipNum(words[4])!==null){r.nat.acl.push({id:words[1],net:words[3],wc:words[4]});return '';}
        if(c.slice(0,3).join(' ')==='ip nat pool'&&words.length===8&&c[6]==='netmask'){
          if(ipNum(words[4])===null||ipNum(words[5])===null||ipNum(words[4])>ipNum(words[5])||prefix(words[7])===null)throw Error('Invalid NAT pool.');r.nat.pools=r.nat.pools.filter(p=>p.name!==words[3]);r.nat.pools.push({name:words[3],start:words[4],end:words[5],mask:words[7]});return '';}
        if(c.slice(0,5).join(' ')==='ip nat inside source list'){
          if(c[6]==='interface'&&c[8]==='overload'&&words.length===9){const i=this.resolveIface(r,words[7]);if(!i)throw Error('Unknown outside interface.');r.nat.mode='pat';r.nat.outside=i.name;r.nat.sourceList=words[5];return '';}
          if(c[6]==='pool'&&words.length===8){if(!r.nat.pools.some(p=>p.name===words[7]))throw Error('Create that NAT pool first.');r.nat.mode='pool';r.nat.poolName=words[7];r.nat.sourceList=words[5];return '';}
        }
        return fail('Unknown or incomplete command. Type ? for supported syntax.');
      }catch(e){return fail(e.message);}
    }
    natTable(r){const all=[...r.nat.static.map(t=>({...t,type:'Static',router:r.id})),...this.state.translations.filter(t=>t.router===r.id)];return all.filter((t,i)=>all.findIndex(x=>x.local===t.local&&x.global===t.global&&x.type===t.type)===i);}
    runningConfig(r){return ['hostname '+r.short,...r.interfaces.flatMap(i=>['interface '+i.name,i.ip?' ip address '+i.ip+' '+i.mask:' no ip address',i.up?' no shutdown':' shutdown',...(i.nat!=='none'?[' ip nat '+i.nat]:[])]),...r.routes.map(s=>'ip route '+s.net+' '+s.mask+' '+s.next),...(r.protocols.rip.enabled?['router rip',' version '+r.protocols.rip.version,...r.protocols.rip.networks.map(n=>' network '+n)]:[]),...(r.protocols.ospf.enabled?['router ospf '+r.protocols.ospf.process,...r.protocols.ospf.networks.map(n=>' network '+n.net+' '+n.wc+' area '+n.area)]:[]),...r.nat.static.map(t=>'ip nat inside source static '+t.local+' '+t.global),...r.nat.acl.map(a=>'access-list '+a.id+' permit '+a.net+' '+a.wc),...r.nat.pools.map(p=>'ip nat pool '+p.name+' '+p.start+' '+p.end+' netmask '+p.mask),...(r.nat.mode==='pat'?['ip nat inside source list '+r.nat.sourceList+' interface '+r.nat.outside+' overload']:r.nat.mode==='pool'?['ip nat inside source list '+r.nat.sourceList+' pool '+r.nat.poolName]:[]),'end'].join('\n');}
    addLink(a,b,type,aiName,biName){if(a===b)throw Error('Select two different devices.');const da=this.get(a),db=this.get(b);if(!da||!db)throw Error('Device not found.');const used=(id,n)=>this.state.links.some(l=>l.a===id&&l.ai===n||l.b===id&&l.bi===n);const free=d=>d.interfaces.find(i=>!used(d.id,i.name)&&(type==='serial'?i.name.startsWith('Serial'):!i.name.startsWith('Serial')));
      const ai=aiName?this.port(da,aiName):free(da),bi=biName?this.port(db,biName):free(db);if(!ai||!bi)throw Error('No free '+(type==='serial'?'serial':'Ethernet')+' port. Remove an existing cable or add a device.');if(used(a,ai.name)||used(b,bi.name))throw Error('That port is already occupied.');
      const l={id:'l'+Date.now().toString(36),a,b,ai:ai.name,bi:bi.name,type};this.state.links.push(l);return l;
    }
  }

  // Direct eBGP teaching model: reciprocal peers, exact connected origins,
  // AS-path loop prevention and shortest-path selection; no timers or policy.
  const bgp=r=>r.protocols.bgp||(r.protocols.bgp={enabled:false,asn:65001,neighbors:[],networks:[]});
  Engine.prototype.bgpNeighbors=function(r){const p=bgp(r);return p.neighbors.map(n=>{const e=this.adjacency().find(e=>e.a===r.id&&e.next===n.ip);const peer=e&&this.get(e.b),q=peer&&bgp(peer);const local=e&&this.port(r,e.ai).ip;return {...n,router:peer?.short||'—',state:p.enabled&&q?.enabled&&q.asn===n.asn&&q.asn!==p.asn&&q.neighbors.some(x=>x.ip===local&&x.asn===p.asn)?'Established':'Idle',edge:e};});};
  Engine.prototype.bgpRoutes=function(start){
    if(!bgp(start).enabled)return [];
    const found=[],queue=[{r:start,path:[],seen:[bgp(start).asn],first:null}];
    while(queue.length){const cur=queue.shift();if(cur.r!==start)for(const n of bgp(cur.r).networks){if(this.connected(cur.r).some(c=>c.net===n.net&&c.mask===n.mask))found.push({...n,next:cur.first.next,iface:cur.first.ai,code:'B',ad:20,metric:cur.path.length,asPath:cur.path,origin:cur.r.id});}
      for(const n of this.bgpNeighbors(cur.r).filter(n=>n.state==='Established')){const peer=this.get(n.edge.b),asn=bgp(peer).asn;if(cur.seen.includes(asn))continue;queue.push({r:peer,path:[...cur.path,asn],seen:[...cur.seen,asn],first:cur.first||n.edge});}
    }return found;
  };
  const baseCli=Engine.prototype.cli,basePrompt=Engine.prototype.prompt,baseConfig=Engine.prototype.runningConfig;
  Engine.prototype.prompt=function(r){return r.cli.mode==='bgp'?r.short+'(config-router)#':basePrompt.call(this,r);};
  Engine.prototype.cli=function(r,raw){const a=raw.trim().split(/\s+/),c=a.map(x=>x.toLowerCase()),p=bgp(r),mode=r.cli.mode,err=m=>'% '+m,validAS=x=>/^\d+$/.test(x||'')&&+x>0&&+x<=4294967295;
    if(c.join(' ')==='show ip bgp summary')return 'Local AS '+p.asn+'\n'+this.bgpNeighbors(r).map(n=>`${n.ip}  AS ${n.asn}  ${n.state}`).join('\n');
    if(c.join(' ')==='show ip bgp')return this.bgpRoutes(r).map(n=>`${n.net}/${prefix(n.mask)} via ${n.next} AS_PATH ${n.asPath.join(' ')}`).join('\n')||'No BGP routes.';
    if(c[0]==='show'&&c[1]==='interfaces')return r.interfaces.filter(i=>!a[2]||this.resolveIface(r,a[2])===i).map(i=>`${i.name}: ${i.up?'up':'administratively down'}, encapsulation ${(i.encapsulation||'hdlc').toUpperCase()}${i.name.startsWith('Serial')?' (serial)':''}`).join('\n');
    if(mode==='interface'&&c[0]==='encapsulation'){const i=this.port(r,r.cli.iface);if(!i.name.startsWith('Serial'))return err('Encapsulation applies to serial interfaces.');if(a.length!==2||!['ppp','hdlc'].includes(c[1]))return err('Use encapsulation ppp or encapsulation hdlc.');i.encapsulation=c[1];return '';}
    if(['config','bgp'].includes(mode)&&c[0]==='router'&&c[1]==='bgp'){if(a.length!==3||!validAS(a[2]))return err('Enter a valid AS number (1–4294967295).');p.enabled=true;p.asn=+a[2];r.cli.mode='bgp';return '';}
    if(mode==='config'&&c.slice(0,3).join(' ')==='no router bgp'){p.enabled=false;return '';}
    if(mode==='bgp'){
      if(c[0]==='exit'){r.cli.mode='config';return '';}
      if(c[0]==='end'){r.cli.mode='priv';return '';}
      if(c[0]==='neighbor'&&c[2]==='remote-as'&&a.length===4){if(ipNum(a[1])===null||!validAS(a[3]))return err('Invalid neighbor IP or AS number.');p.neighbors=p.neighbors.filter(n=>n.ip!==a[1]);p.neighbors.push({ip:a[1],asn:+a[3]});return '';}
      if(c[0]==='network'&&c[2]==='mask'&&a.length===4){if(ipNum(a[1])===null||prefix(a[3])===null)return err('Invalid network or mask.');const net=network(a[1],a[3]);if(net!==a[1])return err('Use the network address.');p.networks=p.networks.filter(n=>n.net!==net||n.mask!==a[3]);p.networks.push({net,mask:a[3]});return '';}
      if(c[0]==='no'&&c[1]==='neighbor'){p.neighbors=p.neighbors.filter(n=>n.ip!==a[2]);return '';}
      if(c[0]==='no'&&c[1]==='network'){p.networks=p.networks.filter(n=>n.net!==a[2]);return '';}
      if(!['show','?','help'].includes(c[0]))return err('Use neighbor IP remote-as ASN or network NETWORK mask MASK.');
    }
    const result=baseCli.call(this,r,raw);return ['?','help'].includes(c[0])?result+'\nencapsulation ppp|hdlc · show interfaces\nrouter bgp ASN · neighbor IP remote-as ASN\nnetwork NETWORK mask MASK · show ip bgp · show ip bgp summary':result;
  };
  Engine.prototype.runningConfig=function(r){const p=bgp(r);return baseConfig.call(this,r).replace(/\nend$/, '')+'\n'+r.interfaces.filter(i=>i.name.startsWith('Serial')).map(i=>'interface '+i.name+'\n encapsulation '+(i.encapsulation||'hdlc')).join('\n')+(p.enabled?'\nrouter bgp '+p.asn+'\n'+p.neighbors.map(n=>' neighbor '+n.ip+' remote-as '+n.asn).join('\n')+'\n'+p.networks.map(n=>' network '+n.net+' mask '+n.mask).join('\n'):'')+'\nend';};
  const originalScenario=makeScenario;
  makeScenario=function(kind='ospf'){
    if(!['ppp','hdlc','bgp'].includes(kind))return originalScenario(kind);
    const state=originalScenario(kind==='bgp'?'basic':'ospf'),e=new Engine(state);state.scenario=kind;state.lab=kind==='bgp'?10:9;
    for(const r of e.routers)for(const i of r.interfaces.filter(i=>i.name.startsWith('Serial')))i.encapsulation=kind==='ppp'?'ppp':'hdlc';
    if(kind==='bgp'){
      e.routers.forEach((r,i)=>{const p=bgp(r);p.enabled=true;p.asn=65001+i;p.networks=e.connected(r).filter(n=>!n.iface.startsWith('Serial')).map(n=>({net:n.net,mask:n.mask}));});
      for(const r of e.routers)bgp(r).neighbors=e.adjacency().filter(n=>n.a===r.id).map(n=>({ip:n.next,asn:bgp(e.get(n.b)).asn}));
    }return state;
  };
  const API={Engine,makeScenario,subnet,validateIP,ipNum,numIP,prefix,network,inNet,wildcard,wildcardMatch,classMask,iface,router,pc,sw,clone};
  if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.AeroNet=API;
})(typeof globalThis!=='undefined'?globalThis:this);
