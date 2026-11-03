from pathlib import Path
import json
base=Path(__file__).resolve().parent
routers={
 'Terminal-Router':{'host':'TERM-R1','rid':'1.1.1.1','ports':[('FastEthernet0/0','10.10.10.1','255.255.255.224','Check-in LAN'),('FastEthernet1/0','10.10.20.1','255.255.255.224','Security LAN'),('Serial2/0','172.16.0.1','255.255.255.252','WAN to Control Tower')]},
 'Control-Tower-Router':{'host':'TWR-R2','rid':'2.2.2.2','ports':[('FastEthernet0/0','10.20.10.1','255.255.255.224','Baggage and Tower LAN'),('Serial2/0','172.16.0.2','255.255.255.252','WAN to Terminal'),('Serial3/0','172.16.0.5','255.255.255.252','WAN to ISP')]},
 'ISP-Router':{'host':'ISP-R3','rid':'3.3.3.3','ports':[('FastEthernet0/0','203.0.113.1','255.255.255.224','Flight API external LAN'),('Serial2/0','172.16.0.6','255.255.255.252','WAN to Tower')]}}
import ipaddress
scenarios=['01-04-Foundation','05-Static-Default','06A-Static-NAT','06B-Dynamic-NAT','06C-PAT','07A-RIPv1','07B-RIPv2','08A-Single-Area-OSPF','08B-Multi-Area-OSPF']
for scenario in scenarios:
 folder=base/'configs'/scenario;folder.mkdir(exist_ok=True)
 for name,r in routers.items():
  lines=['hostname '+r['host'],'no ip domain-lookup']
  for iface,ip,mask,desc in r['ports']:
   if scenario=='07A-RIPv1':
    ip={'10.10.10.1':'192.168.10.1','10.10.20.1':'192.168.20.1','10.20.10.1':'192.168.30.1'}.get(ip,ip)
    if iface.startswith('Fast'):mask='255.255.255.0'
   lines+=['interface '+iface,' description '+desc,' ip address '+ip+' '+mask]
   if iface=='Serial2/0' and name=='Terminal-Router' or iface=='Serial3/0':lines+=[' clock rate 64000']
   if scenario.startswith('06') and name=='Terminal-Router':lines+=[' ip nat '+('inside' if iface.startswith('Fast') else 'outside')]
   lines+=[' no shutdown',' exit']
  if scenario.startswith('08'):
   lines+=['router ospf 1',' router-id '+r['rid']]
   for iface,ip,mask,desc in r['ports']:
    n=ipaddress.ip_network(ip+'/'+mask,strict=False)
    area=('1' if name=='Terminal-Router' else '2') if scenario.startswith('08B') and iface.startswith('Fast') and name!='ISP-Router' else '0'
    lines+=[' network '+str(n.network_address)+' '+str(n.hostmask)+' area '+area]
   lines+=[' exit']
  if scenario.startswith('07'):
   nets={'Terminal-Router':['10.0.0.0','172.16.0.0'],'Control-Tower-Router':['10.0.0.0','172.16.0.0'],'ISP-Router':['172.16.0.0','203.0.113.0']}
   if scenario.startswith('07A'):nets={'Terminal-Router':['192.168.10.0','192.168.20.0','172.16.0.0'],'Control-Tower-Router':['192.168.30.0','172.16.0.0'],'ISP-Router':['172.16.0.0','203.0.113.0']}
   lines+=['router rip',' version '+('1' if scenario.startswith('07A') else '2')]
   lines+=[' auto-summary' if scenario.startswith('07A') else ' no auto-summary']
   lines+=[' network '+n for n in nets[name]];lines+=[' exit']
  if scenario=='05-Static-Default':
   routes={'Terminal-Router':['0.0.0.0 0.0.0.0 172.16.0.2'],'Control-Tower-Router':['10.10.10.0 255.255.255.224 172.16.0.1','10.10.20.0 255.255.255.224 172.16.0.1','0.0.0.0 0.0.0.0 172.16.0.6'],'ISP-Router':['10.0.0.0 255.0.0.0 172.16.0.5','172.16.0.0 255.255.255.252 172.16.0.5']}
   lines+=['ip route '+s for s in routes[name]]
  if scenario.startswith('06'):
   routes={'Terminal-Router':['0.0.0.0 0.0.0.0 172.16.0.2'],'Control-Tower-Router':['172.16.0.8 255.255.255.248 172.16.0.1','0.0.0.0 0.0.0.0 172.16.0.6'],'ISP-Router':['172.16.0.0 255.255.255.240 172.16.0.5','10.20.10.0 255.255.255.224 172.16.0.5']}
   lines+=['ip route '+s for s in routes[name]]
   if name=='Terminal-Router':
    if scenario=='06A-Static-NAT':lines+=['ip nat inside source static 10.10.10.10 172.16.0.10']
    else:
     lines+=['access-list 1 permit 10.10.0.0 0.0.255.255']
     if scenario=='06B-Dynamic-NAT':lines+=['ip nat pool AIRPORT 172.16.0.10 172.16.0.14 netmask 255.255.255.248','ip nat inside source list 1 pool AIRPORT']
     else:lines+=['ip nat inside source list 1 interface Serial2/0 overload']
  lines+=['end']
  (folder/(r['host']+'.cfg')).write_text('\n'.join(lines)+'\n')
(base/'addressing.json').write_text(json.dumps({'routers':routers,'hosts':[
 {'name':'Check-in-Desk-01','ip':'10.10.10.10','mask':'255.255.255.224','gateway':'10.10.10.1'},
 {'name':'Check-in-Desk-02','ip':'10.10.10.11','mask':'255.255.255.224','gateway':'10.10.10.1'},
 {'name':'Security-Workstation','ip':'10.10.20.10','mask':'255.255.255.224','gateway':'10.10.20.1'},
 {'name':'Baggage-Server','ip':'10.20.10.10','mask':'255.255.255.224','gateway':'10.20.10.1'},
 {'name':'Control-Tower-PC','ip':'10.20.10.11','mask':'255.255.255.224','gateway':'10.20.10.1'},
 {'name':'Flight-API-Server','ip':'203.0.113.10','mask':'255.255.255.224','gateway':'203.0.113.1'}]},indent=2)+'\n')
print('Prepared 27 router configurations across 9 airport lab variants.')
