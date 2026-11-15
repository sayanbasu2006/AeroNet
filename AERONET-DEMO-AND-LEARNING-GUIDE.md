# AeroNet: learning and demonstration guide

Website: https://aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site/

Repository: https://github.com/sayanbasu2006/AeroNet

This guide describes the current browser simulator and the separate Cisco Packet Tracer projects. Loading a scenario replaces the current working network. Reset returns that scenario to its starting configuration. Use prepared scenarios when presenting, and make one deliberate change at a time.

## 1. Understand the airport network

A LAN is a local network. Your project separates airport departments into different IP subnets. Switches connect the devices within a department; routers carry packets between departments. Serial WAN links connect routers.

| Department | Subnet | Gateway | Devices |
| --- | --- | --- | --- |
| Check-in | 10.10.10.0/27 | 10.10.10.1 | Eight PCs, .10–.17 |
| Security | 10.10.20.0/27 | 10.10.20.1 | Six PCs, .10–.15 |
| Baggage / tower | 10.20.10.0/27 | 10.20.10.1 | Baggage server .10, six tower PCs .11–.16 |
| Maintenance / services | 10.30.10.0/27 | 10.30.10.1 | Four PCs .10–.13, DNS server .14, Operations server .15 |
| External server | 203.0.113.0/27 | 203.0.113.1 | Flight API server .10 |

The expanded scenario has 36 devices: four routers, four switches, 24 PCs and four servers. Older experiment scenarios intentionally use the original three-router topology. The DNS server is an addressed endpoint; the website does not simulate DNS resolution. The Flight API server is also an endpoint, not a live API.

### What the addressing fields mean

- **IP address:** identifies an interface, for example 10.10.10.10.
- **Subnet mask:** identifies which part describes the network. /27 is 255.255.255.224.
- **Default gateway:** the router interface a host uses for destinations outside its subnet.
- **Next hop:** the next router on a route, rather than the final destination.
- **Interface:** a device port, such as GigabitEthernet0/0 or Serial2/0.

A /27 has 32 total addresses and normally 30 usable host addresses. A /30 has four total addresses and normally two usable host addresses. The first address is the network and the last is broadcast for these prefixes.

### Follow one packet

Example: Check-in-Desk-01 → Flight-API-Server.

1. The PC compares the destination with its own subnet.
2. The destination is remote, so it sends the frame toward 10.10.10.1.
3. The check-in switch forwards it to the Terminal Router.
4. The router looks up the destination prefix in its routing table.
5. Each router chooses a next hop until the ISP Router reaches the external LAN.
6. The server returns an echo reply. That reply also needs a valid route.

In the expanded EIGRP scenario, the primary route normally uses Terminal → Tower → ISP. A redundant Terminal → Maintenance → ISP path is available. Routing tie-breaking can affect equally good paths.

What to say: “Switches connect local devices; routers connect subnets. Successful communication requires both the forward path and the reply path.”

## 2. Learn the website controls

| Control | How to demonstrate it |
| --- | --- |
| Navigation | Open Network topology, Routing tables, Network tools and Subnet calculator. On a phone, use the menu button. |
| Experiment buttons | Open an experiment’s explanation, then Load suggested scenario. They are teaching guides, not completion grades. |
| Load scenario | Select a prepared routing or NAT lab. This replaces the current working state. |
| Device search | Type a device name or IP and press Locate. Ctrl/Cmd+K focuses search. |
| Select | Click a device to inspect it. Desktop mouse dragging changes its position. |
| Touch navigation | Swipe to pan inside the canvas; tap a device to select it. |
| Expand workspace | Open the larger workspace view; click the control again or press Escape to leave it. |
| Zoom / Fit | Change diagram scale or return to 100%. Fit is a zoom reset. |
| Config | Change a PC’s IP/mask/gateway or a router interface’s IP/mask/enabled state. |
| CLI | Practice simplified Cisco commands with mode-specific prompts. Type `?` for supported commands. |
| Routing | Configure the active protocol and inspect learned routes; EIGRP and BGP scenarios have dedicated forms. |
| NAT | Set translation mode, inside/outside roles, ACL, pool and static mappings; inspect translations. |
| Access | Open Telnet/SSH configuration and a simulated remote console. |
| Switch Config | Inspect ports and disable a port to interrupt its attached device. |
| PC ARP table | After a successful ping, inspect the PC’s generated ARP entry. |
| Event log | Show configuration and connectivity events. Clear log clears these displayed events. |
| Packet inspector | After a test, show hop-by-hop forwarding steps and echo/reply decisions. |
| Theme | Switch between dark and light; preference is saved in browser storage when available. |
| Save lab | Stores a snapshot in localStorage for that browser/origin. Current UI has no visible Restore control and does not auto-restore it. Do not present it as a complete save/load workflow. |
| Reset | Restore the currently loaded scenario. It is the easiest way to undo a demonstration. |

### Add, connect and remove a device

1. Load Airport basic LAN.
2. Click + Device and add a PC named Demo-PC.
3. Select Cable → Copper straight-through.
4. Click Demo-PC, then Check-in LAN. A free Ethernet port is selected automatically.
5. Return to Select; configure Demo-PC as 10.10.10.18, mask 255.255.255.224, gateway 10.10.10.1.
6. Ping Check-in-Desk-01. It should be reachable on the same LAN.
7. Select Delete and click Demo-PC. Confirm its removal. Its attached cable is removed too.
8. Reset when finished.

A new router starts with interfaces disabled and no addressing. It needs cables, enabled interfaces, IPs and routes before it can forward traffic. Wrong cable types can make a link inactive in the teaching model.

## 3. Your first demonstration

1. Load Expanded airport · EIGRP.
2. Explain the four departmental LANs and external server.
3. Open Network tools.
4. Source: Check-in-Desk-01. Destination: Flight-API-Server.
5. Click Send ping. Show four simulated replies and zero loss.
6. Click Traceroute. Identify router hops; switches are part of the topology path but do not create IP TTL hops.
7. Return to topology and open Packet inspector.
8. Select Terminal Router → Routing. Identify D routes and its EIGRP neighbors.
9. Click WAN failover. Repeat the ping and traceroute; communication should use the backup path.
10. Click Restore WAN when finished.

What to say: “The network has redundant WAN paths. EIGRP learns reachable networks and recalculates a route after a link fails.”

## 4. Experiment-by-experiment walkthrough

### Experiment 1: commands and cables

Load Airport basic LAN. Identify a PC, switch, router and server. Explain straight-through, cross-over and Serial DCE using the legend. Click a cable to display its endpoint interfaces and status. Demonstrate Network tools → ping and traceroute.

Compare a successful same-LAN ping, Check-in-Desk-01 → Check-in-Desk-02, with a remote ping to Control-Tower-PC-01. In Basic LAN, remote routes are not preconfigured, so the remote test fails.

Key explanation: a connected physical link is only the first requirement; IP settings and routing must also be correct. “Operational” summarizes physical link state, not guaranteed reachability between every pair.

### Experiment 2: peer-to-peer and LAN topology

Load Peer-to-peer link. The PCs use 192.168.1.1/24 and 192.168.1.2/24 with a cross-over cable. Ping between them. Explain why no gateway is needed for direct same-subnet communication.

Change one PC to 192.168.2.2 with mask 255.255.255.0. Apply, then ping again: they no longer share a subnet. Reset. Load Airport basic LAN and compare its switched star LANs with the direct P2P link.

### Experiment 3: router console

Load Airport basic LAN. Select Terminal Router → CLI. Enter each line separately:

```text
enable
configure terminal
interface g0/0
ip address 10.10.10.1 255.255.255.224
no shutdown
end
show ip interface brief
show running-config
```

Explain the prompts:

| Prompt | Mode |
| --- | --- |
| `TERM-R1>` | User EXEC |
| `TERM-R1#` | Privileged EXEC |
| `(config)#` | Global configuration |
| `(config-if)#` | Interface configuration |
| `(config-router)#` | Routing protocol configuration |
| `(config-line)#` | VTY configuration |

`exit` moves out of the current configuration level; `end` returns to privileged mode. Use arrow keys for history. Website ping/traceroute are in Network tools rather than its router CLI.

### Experiment 4: addressing and subnetting

Select a PC → Config and explain IP, mask and gateway. Open Subnet calculator and enter `10.10.10.10/27`.

Expected: network 10.10.10.0, mask 255.255.255.224, broadcast 10.10.10.31, usable .1–.30, 30 usable hosts. Then enter `172.16.0.1/30`: network .0, broadcast .3, usable .1 and .2.

For a safe failure example, clear a PC’s gateway temporarily. Same-LAN traffic still works, but remote destinations do not. Reset afterward. Invalid IPs, masks, duplicate addresses and an off-subnet gateway can be rejected by the forms.

### Experiment 5: static and default routes

Load Static & default routing. Select Terminal Router → Routing or open Routing tables. Identify S routes and S* defaults. Ping and trace to the external server.

To teach configuration from scratch, load Airport basic LAN. Add these routes through CLI:

Terminal Router:

```text
enable
configure terminal
ip route 10.20.10.0 255.255.255.224 172.16.0.2
end
```

Control Tower Router:

```text
enable
configure terminal
ip route 10.10.10.0 255.255.255.224 172.16.0.1
end
```

Now ping Check-in-Desk-01 → Control-Tower-PC-01. The first route handles the request; the second handles the reply. GUI alternative: Routing tables → Add static route, entering destination network, mask and next hop.

A default route is `0.0.0.0 0.0.0.0 NEXT-HOP`. It is used only when no more specific route matches.

### Experiment 6: NAT and PAT

Use separate prepared scenarios so the required outside return routes and interface roles are already present.

**Static NAT:** Load Static NAT. Ping Check-in-Desk-01 → Flight-API-Server. Open Terminal Router → NAT and inspect `10.10.10.10 → 172.16.0.10`. For inbound access, choose Flight-API-Server as source, destination Custom IP / NAT global, and target 172.16.0.10.

**Dynamic pool:** Load Dynamic NAT pool. Ping the Flight API server from several different check-in desks. Inspect the Terminal Router’s table: addresses are allocated from .10–.14. Clear sessions to remove dynamic allocations.

**PAT:** Load NAT overload · PAT. Ping the external server from two check-in PCs. Show that they share the router’s outside address, with simulated ICMP identifiers distinguishing them.

Explain inside-local = original host address; inside-global = translated address as seen outside. NAT also requires working routes and correct inside/outside interfaces. The lab’s “global” addresses are teaching addresses, not real public Internet allocations.

### Experiment 7: RIP v1 and v2

Load RIP version 2. Select Terminal Router → Routing. Inspect participating major networks, R entries and hop-count metrics. Ping between departments.

Load RIP version 1 and compare route masks: v1 summarizes across major-network boundaries; v2 preserves subnet masks. The model requires peers to use the same RIP version. Change one router to the other version to demonstrate broken exchange, then Reset.

CLI example on a prepared RIP router:

```text
enable
configure terminal
router rip
version 2
network 10.0.0.0
network 172.16.0.0
end
show ip route
```

### Experiment 8a: single-area OSPF

Load Single-area OSPF. Select Terminal Router → Routing or Routing tables → OSPF neighbors. Show FULL adjacency, area 0 and O routes. Ping the external server.

What to say: “Participating interfaces in matching areas form adjacencies. OSPF learns paths based on cost.”

### Experiment 8b: multi-area OSPF

Load Multi-area OSPF. Terminal LANs are area 1, tower LAN is area 2, and the WAN backbone is area 0. Inspect the network/wildcard/area entries in Routing. Find O IA routes and explain area border routers.

Change the area of the Terminal–Tower WAN network on one end only. Its OSPF adjacency disappears. Reset to restore it. The browser implements a simplified multi-area backbone model.

### Experiment 9a: PPP and 9b: HDLC

Load PPP serial WAN. In Terminal Router → Config, find Serial encapsulation and change Serial0/0/0 to HDLC. The peer still uses PPP, so the WAN link becomes inactive. Ping to the external server fails. Change it back to PPP and repeat.

Then load HDLC serial WAN and compare. These scenarios use OSPF for IP routing; PPP/HDLC controls the serial link layer.

CLI alternative:

```text
enable
configure terminal
interface s0/0/0
encapsulation ppp
end
show interfaces
```

Key explanation: the two ends need matching encapsulation. PPP negotiation/authentication and serial timing are abstracted in the website.

### Experiment 10: BGP

Load BGP autonomous systems. Terminal, Tower and ISP use AS 65001, 65002 and 65003. Select Terminal Router → Routing.

Show its neighbor 172.16.0.2 with remote AS 65002 and Established status. Explain the advertised network/mask list. Find the external prefix and AS path `65002 65003`. Show B entries in the forwarding table.

Change Terminal’s neighbor remote AS to an incorrect value, apply, and show Idle or loss of routes. Reset afterward. The model requires reciprocal directly connected peers, matching remote AS values and exact connected origin prefixes.

Useful CLI commands:

```text
enable
show ip bgp summary
show ip bgp
show ip route
```

### Experiment 11: EIGRP

Load Expanded airport · EIGRP. All four routers use AS 100. Select Terminal Router → Routing; inspect network/wildcard entries, neighbors and D routes. Use WAN failover and Restore WAN to demonstrate the alternate route.

For another failure case, change only Maintenance Router’s EIGRP AS to 200. Its peers remain AS 100, so maintenance LAN route exchange is interrupted. Reset afterward.

Useful CLI:

```text
enable
show ip eigrp neighbors
show ip eigrp topology
show ip route
```

Explain: EIGRP peers need the same AS number and participating interfaces. Internal EIGRP routes use administrative distance 90. The website uses fixed teaching costs and shortest-path recalculation; it does not implement full DUAL or feasible-successor selection.

### Experiment 12: Telnet and SSH

Load Telnet & SSH management. Select Maintenance Router → Access → Open remote management.

1. Show the domain, local account, simulated RSA keys and permitted transports.
2. In the connection form, choose Check-in-Desk-01 as source and target 10.30.10.1.
3. Choose SSH. Username: `admin`; password: `AirportLab123`.
4. Connect. Enter `show ip eigrp neighbors` in the remote IOS command field and Send command.
5. Disconnect, select Telnet, and reconnect.
6. Try an incorrect password to show authentication failure.
7. Disable Permit Telnet in the configuration section and Apply VTY configuration. A new Telnet attempt is rejected.
8. Disable simulated RSA keys; a new SSH attempt is rejected. Restore the settings afterward.

Telnet normally sends traffic without encryption; SSH encrypts a real remote session. In this website both are local simulations: it checks access rules and credentials but does not perform real encryption or open network sockets.

CLI configuration practice:

```text
enable
configure terminal
ip domain-name airport.lab
username admin secret AirportLab123
crypto key generate rsa modulus 1024
ip ssh version 2
line vty 0 4
login local
transport input telnet ssh
end
show ip ssh
show line
```

Use demo credentials only. A remote console has its own CLI mode. You can end it with Disconnect or `logout`.

## 5. Read the routing table

| Code | Meaning |
| --- | --- |
| C | Directly connected network |
| S | Static route |
| S* | Static default route |
| R | RIP |
| O | OSPF within an area |
| O IA | OSPF inter-area |
| B | BGP |
| D | EIGRP |

The most specific destination prefix wins. If competing routes have the same prefix, administrative distance selects the source; metrics select among routes from that source. In the teaching model, connected is 0, static 1, eBGP 20, internal EIGRP 90, OSPF 110 and RIP 120.

Example: a /27 route matches more specifically than a /0 default, even if its administrative distance is higher. Administrative distance is not compared before prefix length.

## 6. How the code works

- `index.html` defines the navigation, canvas, inspector, dialogs and controls.
- `network.js` stores devices/interfaces/links and evaluates addressing, switching paths, routes, NAT, ping, BGP and CLI commands.
- `enterprise.js` adds the expanded topology, EIGRP and simulated remote management.
- `app.js` renders the SVG and forms, handles editing, scenarios, logs and animations.
- `ui.js` adds mobile navigation, device search, touch selection/panning and expanded workspace behavior.
- `styles.css` and `responsive.css` style the application across screen sizes.
- `theme.js` applies the saved theme or the default dark theme before paint.

GUI and CLI update the same router/interface state. A test computes active links, connected networks, learned routes, the forward path and the reply path. The animation visualizes this calculation; it is not a capture of real packets. Latency, TTL and ARP MAC addresses are teaching values. Health is a physical-link summary.

## 7. Cisco Packet Tracer: open the right project

Use `packet-tracer-airport/Airport-Advanced-EIGRP-SSH.pkt` for the expanded, labeled network. The older `Airport-Expanded-20-PCs.pkt` is the three-router OSPF version. The older static/RIP/NAT configuration files are separate experiment presets, not all simultaneously active in the advanced file.

Packet Tracer is a separate Cisco simulation. The website does not synchronize settings with it. It has its own device operating systems, event timing and saved project files.

### Interface naming differs

| Purpose | Website | Advanced Packet Tracer |
| --- | --- | --- |
| Terminal check-in LAN | g0/0 | Fa0/0 |
| Terminal security LAN | g0/1 | Fa1/0 |
| Terminal–Tower | Terminal s0/0/0 / Tower s0/0/0 | Terminal Se2/0 / Tower Se2/0 |
| Tower–ISP | Tower s0/0/1 / ISP s0/0/0 | Tower Se3/0 / ISP Se2/0 |
| Terminal–Maintenance | Terminal s0/0/1 / Maintenance s0/0/0 | Terminal Se3/0 / Maintenance Se2/0 |
| Maintenance–ISP | Maintenance s0/0/1 / ISP s0/0/1 | Maintenance Se3/0 / ISP Se3/0 |

The WAN address pairs are .1/.2 in 172.16.0.0/30, .5/.6 in 172.16.0.4/30, .9/.10 in 172.16.0.8/30, and .13/.14 in 172.16.0.12/30.

### Explain the native diagram

- Router icons connect different subnets.
- Each switch creates a star LAN for one department.
- Red lines represent serial cable styling; red does not by itself mean a failed connection.
- Black Ethernet lines connect routers/switches/hosts. The direct ISP-server link uses cross-over.
- Green endpoint indicators normally mean the interface/link is up. Amber can indicate a switch port transitioning. Use CLI and pings to diagnose actual reachability.
- DCE endpoints supply serial clocking; this project uses clock rate 64000.
- Notes show host IPs, gateways, LAN masks and WAN interface endpoints.

### Configure a PC

Click PC → Desktop → IP Configuration. Select Static and enter IP, subnet mask and default gateway. Example Check-in-Desk-01: 10.10.10.10, 255.255.255.224, 10.10.10.1.

Desktop → Command Prompt:

```text
ipconfig
ping 10.10.10.11
ping 10.20.10.11
ping 10.30.10.15
ping 203.0.113.10
tracert 203.0.113.10
arp -a
```

Allow time for switching/routing to converge. The first ping may lose a request during address resolution; repeat it before concluding that the route is broken.

### Inspect a router

Click router → CLI. Press Enter if necessary, then:

```text
enable
show ip interface brief
show ip route
show ip protocols
show ip eigrp neighbors
show ip eigrp topology
show running-config
```

Use Space when output pauses at `--More--`. Do not paste a second command while the current output is paused. `show ip interface brief` lists addresses and interface/line-protocol state. `show ip route` shows forwarding decisions. `show ip eigrp neighbors` shows directly adjacent EIGRP routers.

Native EIGRP configuration on Terminal Router:

```text
enable
configure terminal
router eigrp 100
network 10.0.0.0
network 172.16.0.0
no auto-summary
end
write memory
```

Do not enable other lower-AD routing sources if you want EIGRP routes to be the ones demonstrated. The advanced file already uses EIGRP; you normally only need show commands.

### Native failover demonstration

1. From a check-in PC, ping the Flight API server and run traceroute.
2. On Terminal Router:

```text
enable
configure terminal
interface serial2/0
shutdown
end
```

3. Allow EIGRP to converge; repeat the PC ping/traceroute.
4. Restore the interface:

```text
configure terminal
interface serial2/0
no shutdown
end
```

The alternate physical route is Terminal → Maintenance → ISP. Restore the link before saving if you want the normal starting topology.

### Native Telnet/SSH demonstration

The routers were configured with local account `admin` / `AirportLab123`, domain airport.lab and RSA keys. On the native Router-PT image, use `transport input all` to permit both transports; `transport input telnet ssh` was rejected by that image.

From a PC Command Prompt:

```text
telnet 10.30.10.1
```

Enter username and password when requested. Use `exit` to leave. Then:

```text
ssh -l admin 10.30.10.1
```

Enter the password when prompted. Password characters may not echo. SSH and Telnet clients require successful IP connectivity first. The website demo login behavior is not evidence that the native login has been tested.

Native router setup, when configuring a fresh router:

```text
enable
configure terminal
hostname MAINT-R4
ip domain-name airport.lab
username admin secret AirportLab123
crypto key generate rsa
```

Answer `1024` at the modulus prompt. Then:

```text
ip ssh version 2
line vty 0 4
login local
transport input all
end
write memory
```

The lab does not configure an enable password in this sequence. Do not promise remote privileged-mode access until an appropriate enable secret is configured. User-level show commands are enough for the basic login demonstration.

### Native PPP/HDLC and other experiments

Work on a copy or a suitable older experiment project. On the two connected serial interfaces, use matching `encapsulation ppp` or `encapsulation hdlc`, and inspect `show interfaces serial2/0` (substitute the actual port). In a ring, a mismatched link can be bypassed by routing, so an end-to-end ping may still succeed. Inspect the actual link or use the original linear topology to make its failure obvious.

For static, NAT, RIP and OSPF, use the corresponding older configuration presets as a starting point and adapt interface names. Those three-router presets do not automatically configure the fourth maintenance router. For BGP, a clean three-router copy avoids mixing EIGRP and BGP routing sources. The website scenarios are the quickest way to demonstrate all twelve topics without rebuilding native configurations during a presentation.

### Realtime versus Simulation mode

Realtime runs the network normally. Simulation lets you step through modeled protocol events and PDUs. To illustrate ICMP, select Simulation, filter the event list for ICMP/ARP, use Add Simple PDU from a PC to a destination, and step with Capture/Forward. Observe ARP resolution, the echo request and the echo reply. The appearance and timing differ from the website’s synthetic animation.

Save native changes using File → Save or Cmd/Ctrl+S. `write memory` saves a router’s running configuration to startup configuration; saving the `.pkt` file preserves the overall project.

## 8. A presentation plan

For a short presentation: architecture → ping/traceroute → addressing → routing table → EIGRP failover → SSH login → Packet Tracer diagram. For full lab coverage, follow experiments 1–12 in order, loading a fresh scenario before each one.

Before each demonstration, say what should happen. Make one change, show the result, explain why it happened, and reset. This is more convincing than clicking many controls without connecting them to a networking principle.

Useful closing explanation:

> AeroNet connects airport departments through routed subnets. The browser makes configuration and packet-path concepts easy to explore, while the Packet Tracer project provides a separate Cisco environment with native IOS configuration and protocol behavior.

## 9. Common questions

**Why do we need a gateway?** To reach destinations outside a host’s local subnet.

**Why does ping fail even though cables are green?** The mask, gateway, route, protocol adjacency, NAT setup or reply route may be wrong.

**What does ping prove?** In this website, the calculated request and reply paths succeed. In Packet Tracer, it demonstrates ICMP reachability within its simulated network.

**How is traceroute different?** It identifies successive IP router hops rather than just reporting reachability.

**Why /27 for LANs and /30 for WANs?** /27 accommodates up to 30 conventional hosts; /30 accommodates the two router interfaces of a point-to-point link.

**Why does EIGRP use D?** Cisco route tables use D for EIGRP; E is used for another routing source. EIGRP is associated with the DUAL algorithm.

**Are all protocols active together?** No. Load scenario selects a suitable prepared experiment. The advanced native project uses EIGRP; older native presets cover other configurations separately.

**Is the website a full Cisco emulator?** No. It is a simplified teaching model with a command parser and client-side forwarding logic.

**Does the server run DNS or an API?** These named endpoints provide network roles in the topology; the website does not run DNS or an external Flight API service.
