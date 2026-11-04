# AeroNet — Airport Network Lab

A browser-only, interactive airport network simulation for Experiments 1–8 of the SRM **21CSC302J Computer Networks** lab manual (July–November 2025). All networking is simulated locally. There are no real packets, accounts, backend services, framework dependencies, or installation steps.

## Run

1. Extract the ZIP if using the download.
2. Open **`dist/index.html`** in a current desktop browser (Chrome, Edge, Firefox, or Safari).
3. Start exploring the preloaded single-area OSPF airport.

Keep `index.html`, `styles.css`, `theme.js`, `network.js`, and `app.js` together in `dist/`. The app works offline, including its icons and fonts. Save/Restore uses browser localStorage; some browsers restrict storage for `file:` pages. The simulator still works without storage. To use a consistent local origin, optionally run `python3 -m http.server 8080 --directory dist` from the project folder and visit `http://localhost:8080`.

## First five minutes

- Click **Terminal Router** and inspect its three interfaces. The right panel provides Config, CLI, Routing and NAT tabs.
- Open **Network tools** (or **Test connectivity** in the inspector). Select Check-in Desk 01 → Flight API Server, then Send ping or Traceroute. Inspect the packet path and event log.
- In the Terminal Router CLI, enter `enable`, `configure terminal`, `interface s0/0/0`, then `shutdown`. Test again: the path fails. Enter `no shutdown` to restore it.
- Load **Multi-area OSPF**. Inspect Terminal Router’s routing table and OSPF neighbors. Notice the `O IA` inter-area routes.
- Load a NAT scenario. Send a ping from a check-in desk to the Flight API Server, then open Terminal Router → NAT to see the translation.
- Use **Save lab** before switching scenarios. The former Restore saved lab footer control has been removed; restoring is not exposed in the current UI. **Reset** restores the current scenario’s original configuration without deleting your saved lab.

## Experiments and features

| Manual experiment | Features in AeroNet |
| --- | --- |
| 1a Introduction to Packet Tracer; 1b Networking Commands; 1c Cables | Interactive device canvas; ping and traceroute; three colored cable types; packet forwarding inspector |
| 2a P2P; 2b Simple LAN; 2c Topologies | Two-PC cross-over scenario; three switched star LANs; hybrid airport topology; add, drag, connect and delete devices |
| 3 Router configuration through a console | Stateful Cisco-style CLI, user/privileged/config/interface/protocol modes, prompts, history, show commands |
| 4a Router IP addressing; 4b Subnetting in WAN | PC/router IP forms, mask and gateway validation; /27 airport LANs; /30 serial links; subnet calculator |
| 5 Static and default routing | GUI/CLI routes, longest prefix matching, routing tables, default routes, return-route and loop checks |
| 6a Static NAT; 6b Dynamic NAT | Fixed local/global mappings, address-pool allocation, inside/outside roles, ACL matching, translation table; PAT extension |
| 7 RIP v1 and v2 | Per-router GUI and CLI configuration, hop-count propagation, v1 major-network summaries, v2 subnet prefixes |
| 8a Single-area OSPF; 8b Multi-area OSPF | Area participation, FULL neighbors, shortest-cost routes, area 0 backbone, ABRs and O IA routes |

Use the eight experiment buttons or the **?** button for the in-app field guide. The command reference is available from each router’s CLI. The airport addressing plan is original; it is not a copy of the manual’s addressing tables.

## Preloaded airport

The main scenarios contain **3 routers, 3 switches, 22 end devices and 27 cables**: 8 check-in PCs, 6 security PCs, 6 control-tower PCs and 2 servers. Switches provide 24 ports. Host names, IP addresses, masks and gateways match the expanded native Packet Tracer project.

| Segment | Addresses | Gateway |
| --- | --- | --- |
| Check-in | `10.10.10.0/27` — desks `.10`–`.17` | `10.10.10.1` |
| Security | `10.10.20.0/27` — security PCs `.10`–`.15` | `10.10.20.1` |
| Baggage / tower | `10.20.10.0/27` — server `.10`, tower PCs `.11`–`.16` | `10.20.10.1` |
| External network | `203.0.113.0/27` — Flight API `.10` | `203.0.113.1` |
| Terminal–tower WAN | `172.16.0.0/30` — Terminal `.1`, Tower `.2` | — |
| Tower–ISP WAN | `172.16.0.4/30` — Tower `.5`, ISP `.6` | — |

The external network uses documentation address space. The NAT lab uses `172.16.0.10` as a simulated outside/global address or `.10`–`.14` as a pool; these are teaching addresses, not public Internet allocations. PAT shares the Terminal Router’s `172.16.0.1` outside address and models ICMP identifiers. In the NAT scenarios, outside routers have routes to these global addresses but no routes to the check-in/security private LANs. Static NAT can be tested inbound by choosing Flight API Server as the source and custom destination `172.16.0.10`.

## Cable and topology editing

- **Select:** click a device to configure it; drag it to reposition it. Devices also support keyboard selection with Enter/Space.
- **Cable:** choose a type, then two devices. The simulator automatically selects the first free port of the correct medium. An occupied port cannot accept a second cable. Remove its existing cable first.
- **Delete:** click a cable to remove it, or a device to review and confirm its removal.
- **+ Device:** add a PC, server, switch, or router. New router interfaces begin down; assign an IP and enable each required port.
- Straight-through joins a switch to a router/host. Cross-over joins like Ethernet roles (including router-to-host and host-to-host). Serial DCE joins two router serial ports. Wrong cable types produce a down link. Auto-MDIX is intentionally not simulated.
- Switches are Layer 2 devices. Their port controls let you interrupt a LAN without changing its addresses.

## CLI examples

Commands are entered one line at a time. `g0/0`, `fa0/1`, and `s0/0/0` abbreviate full interface names. Each router has its own console history and configuration.

```text
enable
configure terminal
interface g0/0
ip address 10.10.10.1 255.255.255.224
no shutdown
exit
ip route 0.0.0.0 0.0.0.0 172.16.0.2
end
show ip route
show ip interface brief
show running-config
```

RIP on Terminal Router:

```text
configure terminal
router rip
version 2
network 10.0.0.0
network 172.16.0.0
end
show ip protocols
```

OSPF on Terminal Router:

```text
configure terminal
router ospf 1
network 10.10.10.0 0.0.0.31 area 1
network 10.10.20.0 0.0.0.31 area 1
network 172.16.0.0 0.0.0.3 area 0
end
show ip ospf neighbor
```

For NAT syntax, load the appropriate NAT scenario and use `show running-config`, or open the in-app command reference. Both GUI and CLI edit the same state. `no router rip`, `no router ospf 1`, and `no ip route NETWORK MASK NEXT-HOP` remove configurations. `write memory` acknowledges the current in-memory configuration; use **Save lab** to persist it across page reloads. Ping and traceroute run in Network tools, rather than inside CLI.

## How forwarding is evaluated

`network.js` is a standalone model, independent of the DOM:

1. Validate active links, cable roles and interface states.
2. Resolve Layer 2 paths through switches; routers do not bridge unrelated LANs.
3. Find a host’s local destination or reachable gateway.
4. Build connected, static, RIP and OSPF route candidates. Choose longest prefix, then administrative distance, then metric. Static next hops must be directly reachable; recursive static routing is outside the model.
5. Forward hop by hop. Apply NAT on inside-to-outside transitions and translate return traffic at the outside interface.
6. Independently route the echo reply. Detect missing routes, unavailable next hops, unresolved addresses, duplicate addresses and routing loops.

RIP uses shortest hop count and rejects metrics at 16. Version 1 sends classful summaries across major-network boundaries, while version 2 preserves masks. This model requires adjacent peers to use the same RIP version. OSPF uses shortest-path costs of 1 for Ethernet and 64 for serial; matching areas and area-0 attachments control exchange. GUI protocol selection replaces the previous protocol on that router; CLI can enable both, with OSPF preferred over RIP for an equal prefix.

## Deliberate simplifications

This is a moderate-complexity teaching simulator, not a complete Cisco emulator or a substitute for Packet Tracer lab evidence. Routing converges immediately after edits; there are no periodic 30-second RIP updates, hold-down timers, packet captures, or full OSPF LSA/state machines. It supports a simplified multi-area backbone model, not every OSPF area type or protocol rule. Serial DCE clock rate is retained by CLI but does not affect timing. Cable distance, bandwidth contention, collisions, VLANs, STP, DHCP and DNS are not modeled. Displayed latency and TTL are synthetic; four echo requests share one deterministic reachability calculation. ARP MACs are generated teaching values. Dynamic NAT sessions persist until a configuration change or Clear sessions; there are no expiry timers. PAT identifies clients with simulated ICMP identifiers, not real transport sockets. Routing health reports physical link state, not full end-to-end reachability.

## Source files and verification

```text
airport-network-lab/
  README.md
  package.json
  dist/
    index.html     # page structure
    styles.css     # responsive layout and device styling
    network.js     # topology, IPv4, forwarding, protocols, NAT and CLI
    app.js         # forms, SVG editing, packet animation and persistence
  tests/
    network.test.js
```

Optional developer checks require Node.js; running the app does not:

```sh
node --check dist/network.js
node --check dist/app.js
node --test tests/network.test.js
```

The 28 model tests cover all host pairs in routing scenarios, broken interfaces/cables, local delivery, gateway failure, missing return routes, longest prefixes, loops, OSPF area mismatches, RIP version differences, all NAT modes, retained pool/PAT mappings, pool exhaustion, static inbound NAT, subnet edge cases, CLI modes and occupied ports. Browser checks exercise the console, successful/failed ICMP, traceroute, NAT inspector, configuration forms, subnet calculator, topology editing, save/restore and responsive layouts.


## Experiments 9–10: serial encapsulation and BGP

Experiment 8b remains available as **Multi-area OSPF** in Load scenario.

**9a PPP / 9b HDLC:** Load the corresponding serial WAN scenario. In a router Config tab, select PPP or HDLC for each serial interface. Both endpoints must match; mismatch removes the active link and therefore routes and connectivity. CLI supports `encapsulation ppp`, `encapsulation hdlc`, and `show interfaces`. These scenarios use OSPF for IP routing. Authentication, LCP/NCP negotiation and timers are abstracted.

**10 BGP:** Load BGP autonomous systems. Terminal, Tower and ISP use AS 65001, 65002 and 65003. The Routing tab edits local AS, neighbor IP/remote AS pairs and advertised network/mask pairs. Direct peers need reciprocal configuration and an active matching subnet. Only exact connected network prefixes originate; learned routes carry AS paths and use administrative distance 20, with shortest AS path selection and AS loop prevention. Removal of a prefix, neighbor or link withdraws the corresponding reachability immediately. This is a direct eBGP teaching model; iBGP, policies, TCP sessions and convergence timers are abstracted.

CLI example for Terminal Router:
```text
enable
configure terminal
router bgp 65001
neighbor 172.16.0.2 remote-as 65002
network 10.10.10.0 mask 255.255.255.224
network 10.10.20.0 mask 255.255.255.224
end
show ip bgp summary
show ip bgp
show ip route
```

Use ping and traceroute to observe forwarding and the return path. BGP routes appear as B; show ip bgp includes AS paths. The field guide now contains ten experiment modules.


## Expanded airport: EIGRP and remote management (Experiments 11–12)

The default expanded airport contains 36 devices and 36 links: four routers, four switches, 24 PCs and four servers. The maintenance LAN adds 10.30.10.0/27 (gateway .1, four PCs .10–.13, DNS server .14, Operations server .15). Two /30 links complete a redundant router ring: terminal .9 to maintenance .10 in 172.16.0.8/30, and maintenance .13 to ISP .14 in 172.16.0.12/30. Earlier experiment scenarios remain available in Load scenario.

EIGRP AS 100 uses participating network/wildcard statements, matching AS numbers, active neighbors and classless D routes with administrative distance 90. The browser uses fixed serial/Ethernet teaching costs and shortest-path recomputation, rather than full DUAL, feasible successors or timers. The Routing tab edits AS, network statements and enabled state. CLI supports router eigrp, network, no auto-summary, show ip eigrp neighbors and show ip eigrp topology. WAN failover toggles the primary terminal-to-tower interface; Restore WAN re-enables it.

The Access tab opens a remote-management panel. Configure a domain, local credentials, simulated RSA keys and permitted transports, then choose a source PC, router address and SSH or Telnet. Demo login is admin / AirportLab123. Sessions validate reachability, credentials, VTY transport and SSH prerequisites. Remote commands have a separate CLI mode and stop when reachability or transport is removed. Use logout or Disconnect to end a session. These are browser-local educational sessions; real TCP, encryption and RSA generation are not performed. Demo credentials should be used only in this lab.

Native Packet Tracer counterpart: Airport-Advanced-EIGRP-SSH.pkt in the adjacent packet-tracer-airport folder. Router-PT uses FastEthernet0/0, Serial2/0 and Serial3/0 rather than the browser interface names. Native IOS EIGRP AS 100 and RSA/SSH configuration are applied to all four routers.


## Responsive workspace refresh

The workspace includes a mobile navigation drawer with keyboard focus handling, device search by name or IP (Ctrl/Cmd+K), an expandable topology canvas, larger touch targets and horizontally scrollable topology navigation. On small screens, the device inspector follows the workspace and can be reached from Configure or a device search. Touch gestures pan the topology; tapping a device selects it. Desktop mouse dragging continues to arrange devices. Cards, tables, terminal output and dialogs adapt to the available screen width. The sidebar scrolls so all twelve experiments remain accessible. Dark mode remains the default and the light theme is supported.
