/* Experiments 11–12: EIGRP and isolated, browser-local remote access. */
(function(N){
'use strict';
const E=N.Engine.prototype;
const ep=r=>r.protocols.eigrp||(r.protocols.eigrp={enabled:false,asn:100,networks:[]});
const mg=r=>r.management||(r.management={domain:'',username:'',password:'',keys:false,sshVersion:2,transport:[],loginLocal:false,linePassword:'',login:false});
const participates=(r,name)=>{const i=r.interfaces.find(i=>i.name===name),p=ep(r);return p.enabled&&i?.ip&&p.networks.some(n=>N.wildcardMatch(i.ip,n.net,n.wc));};
E.eigrpNeighbors=function(r){return this.adjacency().filter(e=>e.a===r.id&&participates(r,e.ai)&&participates(this.get(e.b),e.bi)&&ep(r).asn===ep(this.get(e.b)).asn);};
E.eigrpRoutes=function(start){if(!ep(start).enabled)return [];const dist={[start.id]:0},paths={},done=new Set();
 while(true){const id=Object.keys(dist).filter(id=>!done.has(id)).sort((a,b)=>dist[a]-dist[b])[0];if(!id)break;done.add(id);for(const e of this.eigrpNeighbors(this.get(id))){const cost=e.ai.startsWith('Serial')?2169856:28160,n=dist[id]+cost;if(dist[e.b]===undefined||n<dist[e.b]){dist[e.b]=n;paths[e.b]=paths[id]||e;}}}
 return this.routers.filter(r=>r.id!==start.id&&paths[r.id]).flatMap(r=>this.connected(r).filter(c=>participates(r,c.iface)).map(c=>({...c,next:paths[r.id].next,iface:paths[r.id].ai,code:'D',ad:90,metric:dist[r.id],origin:r.id})));
};
const oldRoutes=E.routes;E.routes=function(r){const entries=[...oldRoutes.call(this,r),...this.eigrpRoutes(r)],best=new Map();for(const e of entries){const key=e.net+'/'+e.mask,p=best.get(key);if(!p||e.ad<p.ad||e.ad===p.ad&&e.metric<p.metric)best.set(key,e);}return [...best.values()];};
E.remoteConnect=function(source,target,transport,username,password){const r=this.findIP(target);if(!r||r.type!=='router')throw Error('Choose a router interface address.');if(!this.ping(source,target,{dry:true}).ok)throw Error('Router unreachable. Check routing and interfaces.');const m=mg(r);if(!m.transport.includes(transport))throw Error(transport.toUpperCase()+' is not permitted on VTY lines.');if(transport==='ssh'&&(!m.keys||!m.domain||m.sshVersion!==2))throw Error('SSH needs a domain, RSA keys and SSH version 2.');if(m.loginLocal){if(!m.username||username!==m.username||password!==m.password)throw Error('Authentication failed.');}else if(!m.login||!m.linePassword||password!==m.linePassword)throw Error('VTY login is not configured or password is incorrect.');return {router:r.id,source,target,transport,active:true,cli:{mode:'user',iface:null,output:[],history:[]}};};
E.remoteCommand=function(session,command){if(!session.active)return 'Session closed.';if(command.trim().toLowerCase()==='logout'){session.active=false;return 'Connection closed.';}if(!this.ping(session.source,session.target,{dry:true}).ok){session.active=false;return 'Connection lost: router unreachable.';}if(!mg(this.get(session.router)).transport.includes(session.transport)){session.active=false;return 'Connection closed: transport disabled.';}const r=this.get(session.router),local=r.cli;r.cli=session.cli;try{return this.cli(r,command);}finally{session.cli=r.cli;r.cli=local;}};
const oldCli=E.cli,oldPrompt=E.prompt,oldConfig=E.runningConfig;
E.prompt=function(r){return ['eigrp','vty'].includes(r.cli.mode)?r.short+(r.cli.mode==='vty'?'(config-line)#':'(config-router)#'):oldPrompt.call(this,r);};
E.cli=function(r,raw){const a=raw.trim().split(/\s+/),c=a.map(x=>x.toLowerCase()),s=c.join(' '),p=ep(r),m=mg(r),mode=r.cli.mode,err=x=>'% '+x;
 if(s==='show ip eigrp neighbors')return this.eigrpNeighbors(r).map(e=>`${e.next} ${e.ai} AS ${p.asn} UP`).join('\n')||'No EIGRP neighbors.';
 if(s==='show ip eigrp topology')return this.eigrpRoutes(r).map(n=>`P ${n.net}/${N.prefix(n.mask)} via ${n.next}, FD ${n.metric}`).join('\n')||'No learned EIGRP prefixes.';
 if(s==='show ip ssh')return m.keys&&m.domain?'SSH version '+m.sshVersion+' enabled (simulated RSA keys)':'SSH disabled: generate RSA keys and configure domain.';
 if(s==='show line')return 'VTY 0–4: '+m.transport.join(' ')+'; '+(m.loginLocal?'login local':m.login?'line password login':'login disabled');
 if(['eigrp','vty'].includes(mode)&&s==='exit'){r.cli.mode='config';return '';}
 if(['eigrp','vty'].includes(mode)&&s==='end'){r.cli.mode='priv';return '';}
 if(mode==='config'&&c[0]==='router'&&c[1]==='eigrp'){if(a.length!==3||!/^\d+$/.test(a[2])||+a[2]<1||+a[2]>65535)return err('EIGRP AS must be 1–65535.');p.enabled=true;p.asn=+a[2];r.cli.mode='eigrp';return '';}
 if(mode==='config'&&s.startsWith('no router eigrp')){p.enabled=false;return '';}
 if(mode==='eigrp'){
  if(s==='no auto-summary')return 'Classless prefixes enabled in this model.';
  if(c[0]==='network'&&a.length>=2&&a.length<=3&&N.ipNum(a[1])!==null){const wc=a[2]||N.wildcard(N.classMask(a[1]));if(N.ipNum(wc)===null)return err('Invalid wildcard mask.');p.networks=p.networks.filter(n=>n.net!==a[1]);p.networks.push({net:a[1],wc});return '';}
  if(c[0]==='no'&&c[1]==='network'){p.networks=p.networks.filter(n=>n.net!==a[2]);return '';}
 }
 if(mode==='config'){
  if(c[0]==='ip'&&c[1]==='domain-name'&&a.length===3){m.domain=a[2];return '';}
  if(c[0]==='username'&&['secret','password'].includes(c[2])&&a.length===4){m.username=a[1];m.password=a[3];return '';}
  if(s==='crypto key generate rsa'||s==='crypto key generate rsa modulus 1024'||s==='crypto key generate rsa modulus 2048'){if(!m.domain)return err('Configure ip domain-name first.');m.keys=true;return 'Simulated RSA key pair generated.';}
  if(s==='crypto key zeroize rsa'){m.keys=false;return '';}
  if(s==='ip ssh version 2'){m.sshVersion=2;return '';}
  if(c[0]==='line'&&c[1]==='vty'&&a.length===4){r.cli.mode='vty';return '';}
 }
 if(mode==='vty'){
  if(s==='login local'){m.loginLocal=true;return '';}
  if(s==='login'){m.login=true;m.loginLocal=false;return '';}
  if(c[0]==='password'&&a.length===2){m.linePassword=a[1];return '';}
  if(c[0]==='transport'&&c[1]==='input'){const v=c.slice(2);if(v.length&&v.every(x=>['telnet','ssh','all','none'].includes(x))){m.transport=v.includes('all')?['telnet','ssh']:v.includes('none')?[]:[...new Set(v)];return '';}return err('Use transport input telnet ssh, ssh, or none.');}
 }
 const out=oldCli.call(this,r,raw);return ['?','help'].includes(s)?out+'\nrouter eigrp AS · network NETWORK WILDCARD · no auto-summary\nshow ip eigrp neighbors · show ip eigrp topology\nip domain-name DOMAIN · username USER secret PASSWORD\ncrypto key generate rsa modulus 1024 · ip ssh version 2\nline vty 0 4 · login local · transport input telnet ssh\nshow ip ssh · show line':out;
};
E.runningConfig=function(r){const p=ep(r),m=mg(r);return oldConfig.call(this,r).replace(/\nend$/,'')+(p.enabled?'\nrouter eigrp '+p.asn+'\n no auto-summary\n'+p.networks.map(n=>' network '+n.net+' '+n.wc).join('\n'):'')+'\nip domain-name '+m.domain+'\nusername '+m.username+' secret '+(m.password?'[configured]':'[unset]')+'\nline vty 0 4\n '+(m.loginLocal?'login local':'login')+'\n transport input '+(m.transport.join(' ')||'none')+'\nend';};
const oldScenario=N.makeScenario;
N.makeScenario=function(kind='enterprise'){
 if(!['enterprise','eigrp','remote'].includes(kind))return oldScenario(kind);
 const s=oldScenario('basic'),e=new N.Engine(s);s.scenario=kind;s.lab=kind==='remote'?12:11;s.enterprise=true;
 e.get('r1').interfaces.push(N.iface('Serial0/0/1','172.16.0.9','255.255.255.252'));
 e.get('r3').interfaces.push(N.iface('Serial0/0/1','172.16.0.14','255.255.255.252'));
 const r=N.router('r4','Maintenance Router','MAINT-R4',1800,210,[N.iface('GigabitEthernet0/0','10.30.10.1'),N.iface('Serial0/0/0','172.16.0.10','255.255.255.252'),N.iface('Serial0/0/1','172.16.0.13','255.255.255.252')]);s.devices.push(r,N.sw('s4','Services LAN',1800,390));
 e.addLink('r1','r4','serial','Serial0/0/1','Serial0/0/0');e.addLink('r4','r3','serial','Serial0/0/1','Serial0/0/1');e.addLink('r4','s4','straight','GigabitEthernet0/0','FastEthernet0/1');
 ['Maintenance-PC-01','Maintenance-PC-02','Maintenance-PC-03','Maintenance-PC-04','DNS-Server','Operations-Server'].forEach((name,i)=>{const id='service'+i,d=N.pc(id,name,'10.30.10.'+(10+i),'10.30.10.1',1640+(i%3)*160,570+Math.floor(i/3)*150,i<4?'pc':'server');s.devices.push(d);e.addLink(id,'s4','straight','FastEthernet0','FastEthernet0/'+(i+2));});
 e.routers.forEach(r=>{ep(r).enabled=true;ep(r).networks=r.interfaces.map(i=>({net:N.network(i.ip,i.mask),wc:N.wildcard(i.mask)}));Object.assign(mg(r),{domain:'airport.lab',username:'admin',password:'AirportLab123',keys:true,transport:['telnet','ssh'],loginLocal:true});});
 return s;
};
})(typeof module!=='undefined'?require('./network.js'):window.AeroNet);
