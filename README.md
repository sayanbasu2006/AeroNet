# ✈️ AeroNet — Airport Network Lab

> **A browser-based interactive computer networks simulator built around an airport theme.**  
> Covers all 8 experiments of the **SRM 21CSC302J Computer Networks** lab manual — without installing anything.

🌐 **Live Demo:** [aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site](https://aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site/)

---

## 📌 What Is This Project?

AeroNet is a **single-page web application** that lets you build, configure, and test a real-world airport network — entirely inside your browser. No Cisco hardware. No Packet Tracer required to use the simulator.

The airport setting maps naturally to networking:
- **Check-in desks** → LAN hosts
- **Security workstation** → isolated LAN segment
- **Baggage operations / Control Tower** → another LAN behind a transit router
- **Flight API Server** → external server behind the ISP
- **Routers** → connect all departments via WAN serial links

You can configure IP addresses, set up routing protocols, test NAT, run ping/traceroute, and use a Cisco-style CLI — all in the browser, with immediate visual feedback.

---

## 🗂️ Repository Structure

```
AeroNet/
├── airport-network-lab/          # Browser-based simulator (main project)
│   ├── dist/
│   │   ├── index.html            # App structure, sidebar, controls
│   │   ├── styles.css            # Layout, dark/light theme, SVG styles
│   │   ├── theme.js              # Dark mode logic and localStorage
│   │   ├── network.js            # Core networking engine (IPv4, routing, NAT, CLI)
│   │   └── app.js                # UI rendering, SVG, events, animations
│   ├── tests/
│   │   └── network.test.js       # 28 automated model tests (Node.js)
│   ├── PROJECT-EXPLANATION.md    # Deep-dive technical documentation
│   └── package.json
│
└── packet-tracer-airport/        # Cisco Packet Tracer native projects
    ├── prepare_configs.py        # Python script — generates all 27 router .cfg files
    ├── addressing.json           # Full IP addressing plan (auto-generated)
    ├── Airport-08A-Single-Area-OSPF.pkt     # Native PT project (OSPF)
    ├── Airport-Expanded-20-PCs.pkt          # Expanded native PT project
    ├── configs/                  # Generated IOS config files (9 scenarios × 3 routers)
    │   ├── 01-04-Foundation/
    │   ├── 05-Static-Default/
    │   ├── 06A-Static-NAT/
    │   ├── 06B-Dynamic-NAT/
    │   ├── 06C-PAT/
    │   ├── 07A-RIPv1/
    │   ├── 07B-RIPv2/
    │   ├── 08A-Single-Area-OSPF/
    │   └── 08B-Multi-Area-OSPF/
    └── BUILD-NOTES.md
```

---

## 🚀 How to Run

### Option 1 — Open directly in browser
```
airport-network-lab/dist/index.html
```
Open it in Chrome, Edge, Firefox, or Safari. Works offline.

### Option 2 — Local HTTP server (recommended for localStorage)
```bash
cd airport-network-lab
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```
Then visit: `http://127.0.0.1:4173/`

### Option 3 — Run the Packet Tracer config generator
```bash
cd packet-tracer-airport
python3 prepare_configs.py
# Output: Prepared 27 router configurations across 9 airport lab variants.
```

### Option 4 — Run automated tests
```bash
cd airport-network-lab
npm test
```

---

## 🌐 Airport Network Topology

The simulation models a **hybrid topology** — switched star LANs connected by a chain of 3 routers.

```
Check-in Desk 01–08 ──┐
                      ├── Check-in LAN (SW1) ──┐
Security PC 01–06 ────── Security LAN  (SW2) ──┤
                                               TERM-R1 ── TWR-R2 ── ISP-R3 ── Flight API Server
                                                               │
                                    Baggage Server ─────── Baggage LAN (SW3)
                                    Control Tower PC 01–06 ─┘
```

**28 devices total:** 3 routers, 3 switches, 20 PCs, 2 servers, 27 cables.

---

## 📡 IP Addressing Plan

### LAN & WAN Segments

| Segment | Network | Mask | Usable Range |
|---|---|---|---|
| Check-in LAN | `10.10.10.0/27` | `255.255.255.224` | `.1` (router) · `.10`–`.17` (desks) |
| Security LAN | `10.10.20.0/27` | `255.255.255.224` | `.1` (router) · `.10`–`.15` (security PCs) |
| Baggage/Tower LAN | `10.20.10.0/27` | `255.255.255.224` | `.1` (router) · `.10` (server) · `.11`–`.16` (tower PCs) |
| External LAN | `203.0.113.0/27` | `255.255.255.224` | `.1` (router) · `.10` (Flight API Server) |
| Terminal–Tower WAN | `172.16.0.0/30` | `255.255.255.252` | Terminal `.1` ↔ Tower `.2` |
| Tower–ISP WAN | `172.16.0.4/30` | `255.255.255.252` | Tower `.5` ↔ ISP `.6` |

> **Why /27 and /30?**  
> `/27` gives 30 usable hosts — enough for each airport LAN. `/30` gives exactly 2 usable hosts — perfect for a point-to-point WAN serial link between two routers.

---

## 📚 Experiments Covered

### Experiment 1 — Packet Tracer Intro, Commands & Cables
- Interactive device canvas with drag-and-drop topology editing
- Three cable types: copper straight-through, cross-over, serial DCE
- Ping and traceroute with packet path inspector
- Wrong cable type = link failure (Auto-MDIX intentionally not simulated)

### Experiment 2 — P2P, Simple LAN & Topologies
- Two-PC cross-over scenario (peer-to-peer)
- Three switched star LANs (Check-in, Security, Baggage)
- Full hybrid airport topology: star + chain of routers
- Add, delete, drag and connect devices interactively

### Experiment 3 — Router Console Configuration
- Full **Cisco-style stateful CLI** with 5 modes:
  - `TERM-R1>` User mode
  - `TERM-R1#` Privileged mode
  - `TERM-R1(config)#` Global config
  - `TERM-R1(config-if)#` Interface config
  - `TERM-R1(config-router)#` Routing protocol config
- Per-router command history
- `show ip interface brief`, `show running-config`, `show ip route`

### Experiment 4 — IP Addressing & WAN Subnetting
- Configure IP, subnet mask, and gateway on every device via GUI or CLI
- `/27` LAN subnets and `/30` WAN serial subnets
- **Built-in subnet calculator**: enter `10.10.10.10/27` → get network, broadcast, wildcard, usable range, host count
- Validates gateways, duplicate addresses, and mismatched masks

### Experiment 5 — Static & Default Routing
- Configure explicit static routes: `ip route 10.10.10.0 255.255.255.224 172.16.0.1`
- Configure default routes: `ip route 0.0.0.0 0.0.0.0 172.16.0.2`
- **Longest-prefix matching** determines best route
- Simulator checks both the **forward path AND return path** — a missing return route fails the ping
- Administrative distance: Connected (0) > Static (1) > OSPF (110) > RIP (120)

### Experiment 6 — NAT (Static, Dynamic, PAT)

#### 6A — Static NAT
- One-to-one fixed mapping: `10.10.10.10 → 172.16.0.10`
- Check-in-Desk-01 gets a permanent public identity
- Supports **inbound NAT** — Flight API Server can reach `172.16.0.10` and it maps back to the desk

#### 6B — Dynamic NAT Pool
- Pool `AIRPORT`: `172.16.0.10` through `172.16.0.14` (5 addresses)
- Inside hosts get dynamically allocated global addresses when they send traffic
- Pool exhaustion is simulated — 6th host gets a failure explanation

#### 6C — PAT (NAT Overload)
- All inside hosts share the Terminal Router's single outside IP: `172.16.0.1`
- Clients distinguished by simulated ICMP identifiers
- Translation table visible in the NAT inspector

Inside interfaces: Fa0/0, Fa1/0 (LANs). Outside interface: Serial2/0 (WAN).

### Experiment 7 — RIP Routing (v1 and v2)

#### 7A — RIP Version 1
- **Classful** routing — subnet masks are NOT advertised
- Uses major class A/B/C boundaries for summaries
- To avoid discontiguous `10.0.0.0/8`, LAN addresses are redesigned:
  - Check-in → `192.168.10.0/24`, Security → `192.168.20.0/24`, Baggage/Tower → `192.168.30.0/24`
- WAN links retain `/30` addressing within `172.16.0.0/16`
- `auto-summary` enabled

#### 7B — RIP Version 2
- **Classless** — subnet masks preserved in advertisements
- Original `/27` LAN addresses restored
- `no auto-summary` disables classful boundaries
- Both routers at each end must use the same RIP version (version mismatch = no routes learned)

Both versions use **hop count** as the metric (max 15 hops; 16 = unreachable).

### Experiment 8 — OSPF Routing

#### 8A — Single-Area OSPF
- All router interfaces participate in **area 0** (backbone)
- Neighbors form `FULL` adjacency when: active link + matching masks + same subnet + same area
- Cost: Ethernet = 1, Serial = 64
- Dijkstra shortest-path algorithm selects best routes
- `show ip ospf neighbor` shows FULL state

#### 8B — Multi-Area OSPF
- **Area 1**: Terminal Router's LAN interfaces (Check-in, Security)
- **Area 2**: Control Tower Router's LAN interface (Baggage/Tower)
- **Area 0**: All WAN links (backbone)
- ABR (Area Border Router) behavior demonstrated at TWR-R2
- Inter-area routes appear as `O IA` in routing tables
- Non-backbone areas must attach to area 0 (no stub/NSSA in this model)

---

## ⚙️ Python Config Generator (`prepare_configs.py`)

This script auto-generates **27 Cisco IOS configuration files** (3 routers × 9 scenarios):

```bash
python3 prepare_configs.py
# → Prepared 27 router configurations across 9 airport lab variants.
```

Each `.cfg` file is a complete router configuration ready to import into Packet Tracer via **Config → Merge**.

| Scenario folder | Description |
|---|---|
| `01-04-Foundation` | Interface addresses only |
| `05-Static-Default` | Static routes + default routes |
| `06A-Static-NAT` | Check-in-Desk-01 mapped to `172.16.0.10` |
| `06B-Dynamic-NAT` | Pool of 5 NAT addresses (`172.16.0.10`–`.14`) |
| `06C-PAT` | All inside hosts share `172.16.0.1` (overload) |
| `07A-RIPv1` | Classful /24 LANs, RIP v1, `auto-summary` |
| `07B-RIPv2` | Original /27 LANs, RIP v2, `no auto-summary` |
| `08A-Single-Area-OSPF` | All networks in area 0 |
| `08B-Multi-Area-OSPF` | Area 1 (terminal), area 2 (baggage), area 0 (WAN) |

It also generates `addressing.json` with the full IP plan for all routers and hosts.

> ⚠️ Importing a `.cfg` via Merge does NOT remove existing routing config. Clear old protocols before merging a different scenario.

---

## 🧪 How Packet Forwarding Works (Inside `network.js`)

1. Validate source interface is active and addressed
2. Check for duplicate IP addresses
3. If destination is in same subnet → Layer 2 delivery through switches
4. If remote → resolve default gateway on local segment
5. At each router → longest-prefix match in routing table
6. Resolve next hop through active link
7. Apply NAT on inside→outside transitions
8. **Independently evaluate the echo reply path**
9. Detect: missing routes, unreachable next-hops, loops, wrong cables, down interfaces

---

## 🔧 Useful Cisco CLI Commands (Supported in Simulator)

```text
enable
configure terminal
interface g0/0
  ip address 10.10.10.1 255.255.255.224
  no shutdown
  ip nat inside
exit
ip route 0.0.0.0 0.0.0.0 172.16.0.2
router ospf 1
  network 10.10.10.0 0.0.0.31 area 0
end
show ip route
show ip interface brief
show ip protocols
show ip ospf neighbor
show ip nat translations
show running-config
```

---

## 🧰 Tech Stack

| Technology | Used For |
|---|---|
| HTML | Page structure, forms, dialogs |
| CSS | Layout, dark/light theme, SVG styling |
| JavaScript (Vanilla) | Full simulation engine, UI interactions |
| SVG | Device icons, cables, packet animation |
| localStorage | Theme preference, lab snapshot saving |
| Node.js (optional) | Running the 28 automated tests |
| Python 3 | `prepare_configs.py` config generator |
| Cisco Packet Tracer | Native `.pkt` lab projects |

No React. No Vue. No backend. No database. No installation required.

---

## ✅ Automated Tests

28 model tests in `tests/network.test.js` cover:
- All host pairs in OSPF, multi-area OSPF, RIP, and static scenarios
- Broken interfaces, wrong cable types, missing gateways
- Missing return paths, longest-prefix matching, routing loops
- OSPF area mismatches, RIP version differences
- Static NAT, dynamic pool, PAT, pool exhaustion
- Inbound static NAT and inside/outside role validation
- Subnet edge cases and CLI mode transitions

```bash
cd airport-network-lab && npm test
```

---

## 📋 Verification Commands (in Packet Tracer)

On any router:
```
show ip interface brief
show ip route
show ip protocols
show ip ospf neighbor
show ip nat translations
show ip nat statistics
```

On Check-in-Desk-01 (Desktop → Command Prompt):
```
ipconfig
ping 10.10.10.11
ping 10.20.10.10
ping 203.0.113.10
tracert 203.0.113.10
arp -a
```

---

## 🚧 Known Simplifications

This is a teaching simulator, not a full Cisco emulator:
- Routing converges instantly (no 30-second RIP timers, no convergence delay)
- No full OSPF LSA database, DR/BDR elections, or authentication
- No VLANs, STP, DHCP, or DNS
- Latency and TTL values are synthetic (for display only)
- Dynamic NAT sessions don't expire (no inactivity timer)
- No recursive static next-hop resolution
- Serial DCE clock rate is stored but doesn't affect timing

---

## 👤 Author

**Sayan Basu** — SRM Institute of Science and Technology  
Course: 21CSC302J Computer Networks Lab · July–November 2025

---

*Built with plain HTML, CSS, and JavaScript. Zero frameworks. Zero backend.*
