# AeroNet — Airport Network Lab
## Detailed Project Explanation

**Project type:** Interactive browser-based computer networks teaching simulator  
**Application:** Airport Management System network  
**Technologies:** HTML, CSS, vanilla JavaScript and SVG  
**Scope:** Concepts from Computer Networks lab Experiments 1–8  
**Documentation date:** 3 November 2026  
**Live website:** https://aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site/

---

## Contents

1. [Project overview](#1-project-overview)
2. [Problem statement and objectives](#2-problem-statement-and-objectives)
3. [Scope and relationship to Packet Tracer](#3-scope-and-relationship-to-packet-tracer)
4. [Technology choices](#4-technology-choices)
5. [Project structure](#5-project-structure)
6. [Airport topology](#6-airport-topology)
7. [Addressing and subnet design](#7-addressing-and-subnet-design)
8. [Interface and user workflow](#8-interface-and-user-workflow)
9. [Application architecture and state](#9-application-architecture-and-state)
10. [Physical links and Layer 2 connectivity](#10-physical-links-and-layer-2-connectivity)
11. [Packet forwarding, ping and traceroute](#11-packet-forwarding-ping-and-traceroute)
12. [Static and default routing](#12-static-and-default-routing)
13. [RIP routing](#13-rip-routing)
14. [OSPF routing](#14-ospf-routing)
15. [NAT and PAT](#15-nat-and-pat)
16. [Cisco-style command line](#16-cisco-style-command-line)
17. [Subnet calculator](#17-subnet-calculator)
18. [Lab experiment mapping](#18-lab-experiment-mapping)
19. [Available scenarios](#19-available-scenarios)
20. [Dark mode, interaction and local storage](#20-dark-mode-interaction-and-local-storage)
21. [Running and deploying the project](#21-running-and-deploying-the-project)
22. [Verification and troubleshooting](#22-verification-and-troubleshooting)
23. [Limitations and possible improvements](#23-limitations-and-possible-improvements)
24. [Suggested demonstration and viva preparation](#24-suggested-demonstration-and-viva-preparation)

---

## 1. Project overview

AeroNet is a single-page web application that lets students build, configure and test an airport-themed network. It represents check-in desks, a security workstation, baggage operations, a control tower and an external flight-information server as connected network devices.

Users can select devices, edit IPv4 settings, enable router interfaces, configure routes, try a simplified Cisco-style console and inspect packet paths. The browser evaluates whether communication should succeed from the current topology and configuration.

For example, a check-in desk can communicate with the Flight API Server only when its local link, addressing, gateway, intervening routers and return route are all usable. Turning off a WAN interface changes the result immediately.

The airport provides a concrete setting for otherwise abstract networking concepts. Different airport departments become separate LANs, and the connections between routers become WAN links.

The project is entirely client-side. Hosting serves the application files; it does not forward the simulated packets or execute the router commands.

## 2. Problem statement and objectives

### Problem statement

Students often learn addressing, subnetting, routing and NAT as separate topics. It can be difficult to see how these parts work together to deliver a packet across several networks, or why a seemingly small configuration mistake breaks communication.

AeroNet combines these topics in one interactive environment, with visible devices and immediate feedback.

### Objectives

- Represent an airport using routers, switches, PCs, servers and cables.
- Demonstrate local delivery versus delivery through a default gateway.
- Let users configure IPv4 addresses, subnet masks and router interfaces.
- Explain static routes, default routes and longest-prefix matching.
- Compare RIP v1, RIP v2, single-area OSPF and multi-area OSPF.
- Demonstrate static NAT, dynamic NAT pools and PAT.
- Trace the outward packet path and independently check the reply path.
- Support basic topology editing and intentional failure experiments.
- Provide a readable interface with dark mode as the default.
- Run without a backend or application framework.

## 3. Scope and relationship to Packet Tracer

AeroNet teaches concepts associated with a Cisco Packet Tracer lab. It does **not** embed Packet Tracer, run a Cisco IOS image or configure physical routers.

The website uses JavaScript objects to represent device settings and algorithms to evaluate reachability. Its console interprets a limited set of commands and updates these objects.

| AeroNet provides | Outside the website's scope |
| --- | --- |
| A simulated airport topology | Actual airport infrastructure |
| A simplified Cisco-style console | Complete Cisco IOS emulation |
| Deterministic routing and NAT calculations | Real protocol packets or network sockets |
| Educational ping and traceroute output | Measurements of the user's Internet connection |
| A browser-based lab | Import/export of native `.pkt` files |

Any native Packet Tracer project is a separate artifact. The browser application does not read or write its configuration automatically.

## 4. Technology choices

| Technology | Responsibility | Reason for use |
| --- | --- | --- |
| HTML | Page structure, forms, buttons and dialogs | Native browser controls and semantic structure |
| CSS | Layout, colors, responsive behavior and themes | Presentation without framework dependencies |
| JavaScript | Simulation, state, validation and interactions | Runs locally in the browser |
| SVG | Devices, cables, zones and packet animation | Scalable graphics with individually interactive elements |
| localStorage | Theme preference and an explicitly saved lab snapshot | Small browser-local persistence |
| Node.js test runner | Automated simulation checks | Tests the model independently of the browser |
| Sites hosting | Delivery of static application files | Publishes the application without a custom backend |

The implementation uses SVG rather than HTML Canvas. SVG elements participate in the document structure, making device selection, labels and keyboard interaction easier to implement.

There is no React, Angular, Vue, Express server or database dependency.

## 5. Project structure

```text
airport-network-lab/
├── PROJECT-EXPLANATION.md  # This detailed guide
├── README.md              # Original quick-start and technical overview
├── package.json           # Developer commands
├── .openai/
│   └── hosting.json       # Existing Site identity and static output directory
├── dist/
│   ├── index.html         # Page structure and application controls
│   ├── styles.css         # Layout, SVG styles, light and dark palettes
│   ├── theme.js           # Initial theme and theme-switching behavior
│   ├── network.js         # Independent networking model
│   └── app.js             # UI rendering and interaction handlers
└── tests/
    └── network.test.js    # Automated model tests
```

### `index.html`

Defines the sidebar, header, metrics, topology workspace, event log, device inspector and shared modal dialog. It loads the theme script early so the chosen appearance can be applied before the page is painted.

### `styles.css`

Controls the page layout and device graphics. It includes desktop and narrow-screen rules, focus states, light/dark colors and topology text-selection prevention.

### `theme.js`

Chooses dark mode when no valid preference has been saved. It reads and writes the theme preference, changes the root `data-theme` attribute and updates the toggle's label and pressed state.

### `network.js`

Contains the `Engine` class, scenario factories, IPv4 helpers, forwarding logic, routing protocols, NAT and CLI parser. It does not depend on the page DOM. The same model can therefore run under Node.js for tests.

### `app.js`

Connects browser events to the model. It renders SVG devices, reads forms, displays routes, processes console input, handles device dragging and animates packet paths.

## 6. Airport topology

The expanded web topology matches the native Packet Tracer host addressing. It uses a wider SVG coordinate system and two rows of end devices where needed for screen readability. All three switches now have 24 ports, including enough ports for the check-in uplink plus eight PCs.

The main airport scenarios contain **28 devices and 27 physical links**:

| Type | Count | Devices |
| --- | ---: | --- |
| Router | 3 | Terminal Router, Control Tower Router, ISP Router |
| Switch | 3 | Check-in LAN, Security LAN, Baggage LAN |
| PC | 20 | Check-in-Desk-01–08, Security-PC-01–06, Control-Tower-PC-01–06 |
| Server | 2 | Baggage Server, Flight API Server |

### Logical arrangement

```text
Check-in Desk 01 ─┐
                 ├─ Check-in LAN ─ Terminal Router ─ Control Tower Router ─ ISP Router ─ Flight API Server
Check-in Desk 02 ─┘                      │                    │
                                  Security LAN          Baggage LAN
                                        │                 ├─ Baggage Server
                               Security Workstation       └─ Control Tower PC
```

This is a hybrid topology: switched star LANs connect to a chain of routers.

### Router responsibilities

**Terminal Router (`TERM-R1`)** connects the check-in and security LANs to the tower WAN. It also performs translation in the NAT scenarios.

**Control Tower Router (`TWR-R2`)** connects the baggage/tower LAN to both neighboring routers. It is the transit router between the terminal and ISP.

**ISP Router (`ISP-R3`)** connects the airport WAN to the simulated external server network.

The Flight API Server is an addressable teaching endpoint. The website does not run a flight-data API, baggage database or application-layer airport service.

## 7. Addressing and subnet design

### LAN and WAN plan

| Segment | Network | Mask | Device addresses |
| --- | --- | --- | --- |
| Check-in LAN | `10.10.10.0/27` | `255.255.255.224` | Router `.1`; desks `.10`–`.17` |
| Security LAN | `10.10.20.0/27` | `255.255.255.224` | Router `.1`; security PCs `.10`–`.15` |
| Baggage/tower LAN | `10.20.10.0/27` | `255.255.255.224` | Router `.1`; server `.10`; tower PCs `.11`–`.16` |
| External server LAN | `203.0.113.0/27` | `255.255.255.224` | Router `.1`; server `.10` |
| Terminal–tower WAN | `172.16.0.0/30` | `255.255.255.252` | Terminal `.1`; tower `.2` |
| Tower–ISP WAN | `172.16.0.4/30` | `255.255.255.252` | Tower `.5`; ISP `.6` |

All end devices use the `.1` router address in their own LAN as the default gateway.

### Router interface table

| Router | Interface | IPv4 address | Prefix |
| --- | --- | --- | --- |
| TERM-R1 | GigabitEthernet0/0 | `10.10.10.1` | `/27` |
| TERM-R1 | GigabitEthernet0/1 | `10.10.20.1` | `/27` |
| TERM-R1 | Serial0/0/0 | `172.16.0.1` | `/30` |
| TWR-R2 | GigabitEthernet0/0 | `10.20.10.1` | `/27` |
| TWR-R2 | Serial0/0/0 | `172.16.0.2` | `/30` |
| TWR-R2 | Serial0/0/1 | `172.16.0.5` | `/30` |
| ISP-R3 | GigabitEthernet0/0 | `203.0.113.1` | `/27` |
| ISP-R3 | Serial0/0/0 | `172.16.0.6` | `/30` |

### Why `/27` and `/30`?

A `/27` subnet leaves five host bits: `2^5 = 32` addresses, normally 30 usable host addresses. For `10.10.10.0/27`, the usable range is `.1`–`.30` and the broadcast address is `.31`.

A `/30` subnet leaves two host bits: four addresses, normally two usable hosts. That fits a two-router WAN. For `172.16.0.4/30`, `.4` is the network, `.5` and `.6` are hosts, and `.7` is broadcast.

The external `203.0.113.0/24` block is documentation address space; the application uses a `/27` within it. The NAT global addresses in this lab are also simulated teaching addresses, not actual public Internet allocations.

## 8. Interface and user workflow

### Sidebar

The sidebar provides Network topology, Routing tables, Network tools and Subnet calculator. Eight experiment buttons open explanations and suggested scenarios. The Lab field guide provides the broader reference.

The previous “Lab ready” sidebar status panel has been removed.

### Header and overview

The header contains the theme toggle. The main controls include Save lab and Load scenario. Overview cards show the number of devices, number of links, enabled routing protocol and physical link health.

An “Operational” physical status does not prove every host can communicate. A topology can have active cables and still have incorrect IP settings or missing routes.

### Topology workspace

- **Select:** click to configure; drag to reposition.
- **Cable:** choose a medium and click two devices.
- **Delete:** remove a cable, or review removal of a device.
- **+ Device:** add a PC, server, switch or router.
- **Zoom/Fit:** change the visual scale or return to the default scale.
- **Reset:** restore the current scenario's initial configuration after confirmation.

Device names and IP addresses sit beneath their icons. Router identifiers are inside their device frames. The preloaded layout has been adjusted so names and addresses fit within the airport zones.

### Device inspector

PCs and servers provide address, mask and gateway configuration. Router controls include Config, CLI, Routing and NAT. Switch controls allow ports to be enabled or disabled.

GUI changes and CLI commands modify the same underlying state, so they affect subsequent packet tests consistently.

### Event log and packet inspector

The event log records configuration changes and connectivity results. The packet inspector explains forwarding and translation decisions for the latest test.

The former bottom page footer—including the slogan, experiment subtitle and Restore saved lab button—has been removed.

## 9. Application architecture and state

```text
User action
    ↓
app.js reads the control or pointer event
    ↓
Model configuration changes in JavaScript state
    ↓
network.js evaluates links, routes and packet delivery
    ↓
app.js renders updated SVG, tables, messages and animations
```

### Main state fields

| Field | Purpose |
| --- | --- |
| `version` | Saved-data format version |
| `scenario` | Current scenario identifier |
| `devices` | Device identity, coordinates, interfaces and configuration |
| `links` | Cable endpoints, port names and cable types |
| `translations` | Active simulated NAT translations |
| `packets` | Recent packet-test records |
| `events` | Recent activity messages |
| `lab` | Selected experiment number |

A router contains interface settings, static routes, RIP/OSPF configuration, NAT configuration and its own console mode/history. A host contains an interface, gateway and simulated ARP entries. A switch contains Ethernet ports.

### Example link representation

```json
{
  "id": "l1",
  "a": "r1",
  "ai": "Serial0/0/0",
  "b": "r2",
  "bi": "Serial0/0/0",
  "type": "serial"
}
```

This records the relationship between devices; it does not open a real connection.

### Important model functions

| Function | Responsibility |
| --- | --- |
| `makeScenario()` | Build a predefined topology and configuration |
| `linkUp()` | Check cable medium, roles and port state |
| `l2Path()` | Find a usable path through switches |
| `adjacency()` | Find compatible neighboring router interfaces |
| `dynamicRoutes()` | Calculate RIP or OSPF candidates |
| `routes()` / `routeFor()` | Build and select routing entries |
| `walk()` | Forward one direction, including NAT transitions |
| `ping()` | Evaluate outward and reply delivery |
| `cli()` | Interpret supported console commands |
| `subnet()` | Calculate subnet properties |

## 10. Physical links and Layer 2 connectivity

Both cable type and interface state matter.

| Cable | Expected role in this model | Appearance |
| --- | --- | --- |
| Copper straight-through | Switch to host or switch to router | Solid line |
| Copper cross-over | Host to host, router to host, or like Ethernet roles | Purple dashed line |
| Serial DCE | Router serial interface to router serial interface | Amber dashed line |

Both endpoints must be enabled. Serial cables require serial interfaces on routers. A port cannot be connected to two cables at once.

The model deliberately does not simulate Auto-MDIX. Choosing an incorrect Ethernet cable can therefore make a link unusable even though some modern physical equipment would correct the wiring automatically.

Layer 2 traversal uses a queue to search active links. Intermediate switches can carry the path onward, but routers and hosts do not transparently bridge unrelated interfaces. This prevents a router from accidentally acting like a switch.

## 11. Packet forwarding, ping and traceroute

### Forwarding sequence

1. Validate the source interface and its addressing.
2. Check for duplicate source addresses.
3. Determine whether the destination is local to the host subnet.
4. For a local destination, find a valid Layer 2 path.
5. For a remote destination, resolve the configured gateway on the local segment.
6. At each router, select a matching route and usable outgoing interface.
7. Resolve the next hop through an active segment.
8. Apply NAT where an inside/outside transition requires it.
9. Repeat until delivery succeeds or a failure is found.
10. Independently evaluate the echo reply path.

Route selection prefers the longest destination prefix. For equal prefixes, administrative distance and then metric determine the preferred entry.

| Route source | Administrative distance in the model |
| --- | ---: |
| Connected | 0 |
| Static | 1 |
| OSPF | 110 |
| RIP | 120 |

A more specific RIP route can beat a less specific static route: prefix length is considered first.

### Successful example

With the preloaded OSPF scenario, Check-in Desk 01 reaches Flight API Server along:

```text
Check-in Desk 01 → Check-in LAN → Terminal Router
→ Control Tower Router → ISP Router → Flight API Server
```

The simulator must also find a valid reply route back to the desk.

### Ping output

The interface displays four echo replies or a failure summary. It evaluates deterministic reachability rather than transmitting four independent physical packets. Displayed latency and TTL are generated teaching values.

### Traceroute output

Traceroute displays router hops and the destination using the calculated path. It is not implemented using real progressively increasing TTL probes. It also checks the reply path and uses a dry run so it does not retain newly allocated NAT sessions.

### Typical failures

- Down source or router interface.
- Incorrect cable type.
- Missing or unreachable gateway.
- Invalid mask or duplicate address.
- Missing route or unreachable next hop.
- Successful outward delivery but no return route.
- A routing loop or hop limit failure.
- Missing NAT roles or exhausted dynamic pool.

## 12. Static and default routing

A static route explicitly specifies a destination network, subnet mask and next-hop address.

```text
ip route 10.10.10.0 255.255.255.224 172.16.0.1
```

This example belongs on the Control Tower Router: it sends traffic for the check-in subnet toward the Terminal Router.

A default route matches destinations without a more specific route:

```text
ip route 0.0.0.0 0.0.0.0 172.16.0.2
```

On the Terminal Router, this sends otherwise unmatched traffic toward the tower.

The static scenario includes terminal and tower defaults, specific return routes at the tower, and a summary route back toward the airport at the ISP. Static routing must provide both outward and return reachability.

The model requires a static next hop to be directly reachable through a usable segment. Recursive static next-hop resolution is not implemented.

Routing tables use `C`, `S`, `S*`, `R`, `O` and `O IA` to distinguish connected, static, default, RIP, OSPF and inter-area OSPF entries.

## 13. RIP routing

RIP is represented as a distance-vector teaching model using router hop count.

1. Identify participating interfaces from configured major-network statements.
2. Find adjacent routers with RIP enabled on their connecting interfaces.
3. Require matching RIP versions at the two ends.
4. Calculate shortest router-hop paths.
5. Generate routes to participating connected networks.
6. Reject learned paths with a metric of 16 or more.

### RIP v1

RIP v1 applies classful summaries when advertising across different major-network boundaries. It illustrates the information lost when subnet masks are not preserved in advertisements.

### RIP v2

RIP v2 retains subnet prefixes in this model, allowing the `/27` LANs and `/30` WANs to be represented explicitly.

### Implementation boundary

Routes are recalculated immediately; there are no 30-second update packets, hold-down timers or count-to-infinity exchanges. The `no auto-summary` command explains the model's behavior rather than changing a separate auto-summary flag. The implementation is intended to compare concepts, not reproduce every real RIPv1/VLSM or discontiguous-network behavior.

## 14. OSPF routing

OSPF is represented as a link-state-style shortest-cost calculation.

### Neighbor requirements

Neighboring routers need an active Layer 2 path, matching interface masks, addresses in the same subnet, OSPF participation and the same area on the link. A compatible adjacency is displayed as `FULL`.

The simulator does not animate the real progression through Down, Init, 2-Way, ExStart, Exchange, Loading and Full.

### Cost model

- Ethernet router adjacency: cost 1.
- Serial router adjacency: cost 64.
- A destination connected-network contribution is added when constructing learned routes.

The algorithm uses a Dijkstra-style search: process the reachable router with the lowest current cost and update its neighbors.

### Single-area OSPF

All participating interfaces use area `0`. Routers learn the remote LANs and WANs over the backbone.

### Multi-area OSPF

The terminal LAN interfaces belong to area `1`, the baggage/tower LAN interface belongs to area `2`, and WAN links remain in area `0`. The ISP's participating interfaces remain in area `0`.

Routers that attach non-backbone areas to area `0` demonstrate area border router behavior. Routes learned across areas can appear as `O IA`.

Area transitions require a backbone attachment in the simplified model. Full LSA databases, area types, designated-router elections and authentication are outside its scope.

## 15. NAT and PAT

NAT changes addressing at a boundary. It supplements routing; it does not replace the need for routes to translated addresses.

In the airport NAT scenarios, the Terminal Router's two LAN interfaces are **inside**, and its serial WAN interface is **outside**.

### Static NAT

A fixed one-to-one mapping is configured:

```text
10.10.10.10 → 172.16.0.10
```

A check-in desk can use the translated address outward. The Flight API Server can also test inbound reachability to `172.16.0.10`, which maps back to the desk.

### Dynamic NAT pool

The `AIRPORT` pool contains `172.16.0.10` through `172.16.0.14`. Matching inside hosts obtain an available global address when traffic is evaluated.

Existing allocations are reused for the same inside host. When no address remains, the test can fail with a pool-exhaustion explanation.

### PAT / NAT overload

PAT lets matching inside hosts share the outside interface address, `172.16.0.1`. The simulator distinguishes clients using generated ICMP identifiers, displayed in the translation data. It does not create actual TCP or UDP sockets.

### ACL matching

A standard-style permit statement selects sources eligible for dynamic translation:

```text
access-list 1 permit 10.10.0.0 0.0.255.255
```

This is a NAT source-selection rule, not a complete firewall implementation.

### Translation state

Successful packet tests can retain translation entries. Configuration edits or Clear sessions can clear dynamic sessions. There are no real inactivity timeouts.

Outside routers in the NAT scenarios deliberately lack routes to the terminal private LANs but do have routes toward the simulated global addresses. This makes translation necessary for the intended external tests.

## 16. Cisco-style command line

Each router has a separate mode, prompt and history.

| Mode | Example prompt | Purpose |
| --- | --- | --- |
| User | `TERM-R1>` | Entry mode |
| Privileged | `TERM-R1#` | Inspection and entry to configuration |
| Global configuration | `TERM-R1(config)#` | Routes, protocols and NAT rules |
| Interface configuration | `TERM-R1(config-if)#` | Address, enable state and NAT role |
| Routing protocol configuration | `TERM-R1(config-router)#` | RIP or OSPF network participation |

Commands are trimmed and split into words. The parser checks the current mode, recognizes supported syntax, updates configuration and returns output or a `%` error. It is a purpose-built parser, not a general Cisco command interpreter.

### Interface configuration example

Run on Terminal Router, one line at a time:

```text
enable
configure terminal
interface g0/0
ip address 10.10.10.1 255.255.255.224
no shutdown
exit
end
show ip interface brief
```

### Static/default route example

```text
enable
configure terminal
ip route 0.0.0.0 0.0.0.0 172.16.0.2
end
show ip route
```

### RIP v2 example

This configures Terminal Router only. Other routers also need participating RIP configuration; use the RIP v2 scenario for a complete setup.

```text
enable
configure terminal
no router ospf 1
router rip
version 2
network 10.0.0.0
network 172.16.0.0
end
show ip protocols
```

### Single-area OSPF example

```text
enable
configure terminal
no router rip
router ospf 1
network 10.10.10.0 0.0.0.31 area 0
network 10.10.20.0 0.0.0.31 area 0
network 172.16.0.0 0.0.0.3 area 0
end
show ip ospf neighbor
show ip route
```

### NAT configuration examples

Begin with an appropriate NAT scenario so outside routes are already configured. On Terminal Router:

```text
enable
configure terminal
interface g0/0
ip nat inside
exit
interface g0/1
ip nat inside
exit
interface s0/0/0
ip nat outside
exit
ip nat inside source static 10.10.10.10 172.16.0.10
end
show ip nat translations
```

Dynamic pool commands, entered in global configuration mode:

```text
access-list 1 permit 10.10.0.0 0.0.255.255
ip nat pool AIRPORT 172.16.0.10 172.16.0.14 netmask 255.255.255.248
ip nat inside source list 1 pool AIRPORT
```

PAT alternative, entered in global configuration mode:

```text
access-list 1 permit 10.10.0.0 0.0.255.255
ip nat inside source list 1 interface s0/0/0 overload
```

Use separate scenarios to compare NAT modes rather than layering these examples over unrelated previous configurations.

### Useful inspection commands

```text
show ip route
show ip interface brief
show running-config
show ip protocols
show ip ospf neighbor
show ip nat translations
```

`enable`, `configure terminal`, `exit`, `end`, `shutdown`, `no shutdown`, `hostname` and `clock rate` are also supported. Selected aliases include `en`, `conf t`, `int`, `sh` and abbreviated interface names.

`write memory` acknowledges in-memory configuration. It does not itself write browser storage. Ping and traceroute are available through Network tools, not as router CLI commands.

## 17. Subnet calculator

The calculator accepts an IPv4 address and CIDR prefix, for example:

```text
10.10.10.10/27
```

It returns the network address, subnet mask, wildcard mask, broadcast/upper address, first and last usable addresses, usable-host count and total-address count.

The implementation converts IPv4 octets to an unsigned 32-bit number and uses bitwise operations:

```text
Network   = IP address AND subnet mask
Wildcard  = inverse of subnet mask
Broadcast = network OR wildcard
Total     = 2^(32 − prefix)
```

For `/0` through `/30`, usable addresses exclude the network and broadcast. `/31` is treated as a point-to-point subnet with two usable addresses; `/32` is a single-host subnet.

Address forms also reject malformed octets, noncontiguous masks and inappropriate network/broadcast host assignments. A supplied host gateway must be a different address within the host's subnet.

## 18. Lab experiment mapping

| Experiment | Concept | Project demonstration | Suggested observation |
| --- | --- | --- | --- |
| 1 | Packet Tracer introduction, commands and cables | Interactive workspace, three cable types, ping/traceroute | A wrong cable can prevent delivery |
| 2 | P2P, LAN and topologies | Two-PC scenario and switched airport LANs | Local peers communicate without a router |
| 3 | Router console configuration | Stateful CLI and interface settings | Modes control which commands are accepted |
| 4 | IP addressing and WAN subnetting | `/27` LANs, `/30` WANs and calculator | A gateway must be locally reachable |
| 5 | Static and default routing | Explicit routes and route tables | Both outward and return routes matter |
| 6 | Static and dynamic NAT | Mapping, pool and translation table; PAT extension | Outside addresses identify translated inside hosts |
| 7 | RIP v1/v2 | Hop-count routing and classful/prefix comparison | Version and participating networks affect routes |
| 8 | Single/multi-area OSPF | Area 0, FULL neighbors, ABRs and `O IA` routes | A WAN area mismatch removes adjacency |

The airport address plan is an original example. The project follows the requested experiment themes; it is not a literal reproduction of every procedure or addressing table in the manual.

## 19. Available scenarios

| Scenario | Main learning purpose |
| --- | --- |
| Airport basic LAN | Interfaces and local LAN communication; no learned remote routes initially |
| Peer-to-peer link | Two `/24` hosts joined directly by a cross-over cable |
| Static & default routing | Explicit next hops and default-route behavior |
| Static NAT | Fixed inside-local to inside-global mapping |
| Dynamic NAT pool | Address allocation and pool exhaustion |
| NAT overload · PAT | Multiple clients sharing an outside address |
| RIP version 1 | Classful route summaries |
| RIP version 2 | Subnet-aware hop-count routes |
| Single-area OSPF | Preloaded, connected airport using area 0 |
| Multi-area OSPF | Non-backbone LAN areas joined through area 0 |

Loading a scenario replaces the current working state. Reset rebuilds the current scenario rather than preserving later edits.

## 20. Dark mode, interaction and local storage

### Dark mode

Dark mode is the default when there is no valid saved theme. A previous explicit light preference remains respected. The header toggle can select either mode, and the choice is stored under `aeronet-theme`.

The dark palette covers the sidebar, topology, labels, route tables, forms, dialogs and terminal. Bright text, visible borders and focus indicators provide contrast against dark surfaces.

Theme application works even when browser storage throws an error: the page falls back to dark and the toggle still works for the current session.

### Copy and selection behavior

Text selection is disabled in the topology drawing region with `user-select: none` and the WebKit equivalent. Scoped event handlers prevent normal copy, cut and native drag-start actions there, while custom pointer-based device dragging remains available.

This is a UI interaction choice, not content protection or a security boundary. Browser source, developer tools and screenshots are not made inaccessible. Text elsewhere, such as configuration fields, is not globally blocked.

### Saving a lab

Save lab stores a JSON snapshot under `aeronet-lab-v1`. It excludes packet history and retains at most 25 saved event entries. The in-session event history is capped at 100 entries; recent packet records are capped at 25.

**Current UI limitation:** the footer's Restore saved lab button was removed as requested. The restore function remains in the source, but there is currently no visible restore control and no automatic restore on page load. Save lab should therefore not be presented as a complete user-facing save/load workflow in this revision.

Theme persistence is separate from lab snapshots. Browser-local data does not sync across browsers or devices, and clearing site storage removes it.

## 21. Running and deploying the project

### Direct file use

Keep the six application files together in `dist/` and open `dist/index.html` in a desktop browser. The model requires no installation. Browser storage behavior for `file:` URLs can vary.

### Local HTTP preview

From the project directory:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open:

```text
http://127.0.0.1:4173/
```

This server only delivers files. The simulation still runs in the browser. Stopping it makes the local preview unavailable but does not affect the deployed website.

### Developer checks

Node.js is needed for these checks, not for normal use:

```sh
npm run check
node --check dist/theme.js
npm test
```

### Deployment

The existing hosting manifest declares `dist` as the static application directory. Publication packages those assets from the matching pushed source revision and deploys a saved Site version.

The deployed application is:

https://aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site/

Asset query versions are used to make browsers request updated scripts and styling after a release. There are no app database migrations or application-server processes to run.

## 22. Verification and troubleshooting

### Automated verification

The model test suite contains 28 tests covering:

- All host pairs in OSPF, multi-area OSPF, RIP and static scenarios.
- Local versus remote delivery and P2P cable requirements.
- Disabled interfaces, wrong cable types and missing gateways.
- Missing return paths, longest prefixes and routing loops.
- OSPF area mismatches and RIP version differences.
- Static NAT, dynamic pools, PAT, retained translations and pool exhaustion.
- Inbound static translation and inside/outside roles.
- Traceroute dry-run behavior.
- Invalid/duplicate addresses and subnet edge cases.
- CLI modes, configuration edits and occupied-port rejection.

All 28 passed during the label-spacing revision. The later workspace cleanup also passed JavaScript syntax checks, and browser checks confirmed the footer/status removal, disabled text selection and working device selection. These checks do not establish full Cisco protocol compliance.

### Troubleshooting guide

| Symptom | Check |
| --- | --- |
| Local page cannot be reached | Start the local server, or use the deployed link |
| Page looks outdated | Reload; check that current versioned assets are served |
| Host cannot reach its gateway | Address/mask, gateway subnet, cable type, host/switch/router ports |
| Local LAN works but remote LAN fails | Router routes, protocol participation and WAN addresses |
| OSPF shows no neighbor | Active link, equal masks, same subnet and matching WAN area |
| RIP does not learn routes | Matching RIP version and participating major-network statements |
| Request reaches destination but ping fails | Return route and return NAT translation |
| NAT does not translate | Inside/outside roles, ACL, selected pool/PAT mode and outside routes |
| Dynamic NAT pool is exhausted | Active allocations and pool size; clear sessions or revise the pool |
| Reload does not restore device settings | Current revision has no automatic lab restore |
| Device labels cannot be selected | Intentional topology-only interaction behavior |

## 23. Limitations and possible improvements

### Implemented simplifications

- No real packet transmission, IOS runtime or physical-device configuration.
- Immediate routing recalculation, without real protocol convergence delays.
- Synthetic latency, TTL and ping reply display.
- Simplified OSPF areas and RIP summaries.
- No full OSPF LSA database, DR/BDR elections or protocol authentication.
- No recursive static next-hop resolution or equal-cost multipath forwarding.
- No VLANs, STP, DHCP, DNS resolution, wireless propagation or collision model.
- No bandwidth contention, congestion, queuing or cable-distance effects.
- Stored DCE clock rate does not change forwarding timing.
- Simulated ARP entries use generated teaching MAC addresses.
- Dynamic translations do not expire by inactivity timer.
- No native Packet Tracer `.pkt` import/export.
- No actual flight-information service, airport database or application traffic.
- Physical health is distinct from end-to-end reachability.
- No currently exposed lab restore control after the footer removal.

### Possible future enhancements

1. Add an explicit restore/import/export workflow in a dedicated workspace menu.
2. Add guided exercises with clear completion criteria and expected results.
3. Introduce VLANs, access/trunk ports and inter-VLAN routing.
4. Simulate DHCP address assignment and DNS lookups.
5. Add protocol update timers and a step-by-step event scheduler.
6. Add adjustable link cost, bandwidth and failure scheduling.
7. Improve automatic label placement for arbitrary dragged/custom devices.
8. Expand keyboard editing and mobile topology controls.
9. Add downloadable experiment reports and configuration exports.
10. Support more IOS syntax with clear validation and mode behavior.

These are proposals, not current features.

## 24. Suggested demonstration and viva preparation

### Demonstration sequence

1. Open the site and identify the three airport zones.
2. Explain the 3 routers, 3 switches, 22 hosts and 27 links.
3. Show Check-in Desk 01's `/27` addressing and gateway.
4. Calculate its subnet in the subnet calculator.
5. Ping Flight API Server in the preloaded OSPF scenario.
6. Show traceroute and the packet inspector's forwarding decisions.
7. Open a router's routing table and OSPF neighbor list.
8. Shut down a WAN interface through CLI and repeat the test.
9. Restore the interface and explain the return to reachability.
10. Load Static routing, RIP v2 and Multi-area OSPF to compare tables.
11. Load a NAT scenario, send traffic and inspect translations.
12. Show the theme toggle and describe browser-local execution.

### Common questions

**Why does a host need a default gateway?**  
For a remote subnet, it sends traffic to a router reachable on its own LAN. Local peers can communicate directly.

**Why are separate LANs used?**  
They represent different airport departments and demonstrate subnet boundaries and routed communication.

**Why can a ping fail when all cables are up?**  
Physical connectivity does not guarantee correct masks, gateways, routes or return paths.

**How are competing routes selected?**  
Longest prefix first, then administrative distance and metric for equal prefixes.

**How do RIP and OSPF differ here?**  
RIP selects paths by router hop count; OSPF uses assigned link costs and area participation.

**What does OSPF area 0 do?**  
It is the backbone through which the model joins different non-backbone areas.

**What distinguishes static NAT, dynamic NAT and PAT?**  
Static NAT has a fixed mapping; dynamic NAT allocates from a pool; PAT shares an interface address using client identifiers.

**Does the server run the networking calculations?**  
No. Static hosting serves the files, and JavaScript in the browser evaluates the network.

**Is this equivalent to Cisco Packet Tracer?**  
No. It demonstrates selected concepts through an independent, simplified browser model.

**Does disabling copy secure the diagram?**  
No. It prevents normal text selection/copy interactions in the topology region; it is not a security mechanism.

### Suggested project description

> AeroNet is a browser-based airport network teaching simulator built with HTML, CSS, JavaScript and SVG. It demonstrates addressing, subnetting, physical connectivity, static routing, RIP, OSPF and NAT through an editable airport topology. An independent JavaScript model checks both outward and reply delivery, while configuration panels, a simplified Cisco-style console and packet-path explanations make network behavior visible to students.


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
