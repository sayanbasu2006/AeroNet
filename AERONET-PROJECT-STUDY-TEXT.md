# AeroNet Airport Network Lab
## Project Study Text and Demonstration Guide

**Project:** AeroNet — Airport Management Network Simulation  
**Course:** Computer Networks  
**Website:** [Open AeroNet](https://aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site/)  
**Repository:** [sayanbasu2006/AeroNet](https://github.com/sayanbasu2006/AeroNet)

---

## 1. Project overview

AeroNet is an educational airport network project. It presents an airport as a set of connected departments: passenger check-in, security, baggage and control tower, maintenance, and external services. Each department has its own local area network (LAN). Switches connect devices inside a department, and routers move traffic between different IP networks. Serial point-to-point links connect the routers across the airport WAN.

The project has two complementary parts. The website is a browser-based teaching simulator. It lets a learner inspect a topology, change device settings, run simulated connectivity tools, and explore routing protocols. Cisco Packet Tracer contains separate native network files, where users can configure Cisco devices and run Packet Tracer simulations. The two parts illustrate the same airport design, but they do not synchronize configuration with one another.

The project covers the foundations of addressing and routing as well as Experiments 9–12: PPP and HDLC, BGP, EIGRP, and Telnet/SSH. The expanded airport also includes redundant WAN paths so that routing and failover can be demonstrated.

## 2. Learning outcomes

After studying and demonstrating the project, a learner should be able to:

- Explain how end devices, switches, routers, LANs, and WAN links fit together.
- Assign an IPv4 address, subnet mask, and default gateway to a host or router interface.
- Calculate basic /27 LAN and /30 point-to-point subnets.
- Distinguish a connected route, static route, default route, and dynamically learned route.
- Use ping and traceroute to investigate reachability and packet paths.
- Describe how RIP, OSPF, BGP, and EIGRP exchange or select routes at a high level.
- Explain why the serial link encapsulation must match at both ends.
- Explain the roles of NAT and PAT in translating addresses.
- Compare Telnet with SSH and identify basic remote-access prerequisites.
- Relate a browser simulation to a native Cisco Packet Tracer configuration.

## 3. Network design

The expanded website scenario contains 36 devices and 36 links: four routers, four switches, 24 PCs, and four servers. It represents four internal airport LANs, an external services LAN, and a redundant ring of four routers.

| Segment | Network | Gateway or router addresses | Example endpoints |
| --- | --- | --- | --- |
| Check-in | `10.10.10.0/27` | Gateway `10.10.10.1` | Desk PCs `10.10.10.10`–`.17` |
| Security | `10.10.20.0/27` | Gateway `10.10.20.1` | Security PCs `10.10.20.10`–`.15` |
| Baggage and tower | `10.20.10.0/27` | Gateway `10.20.10.1` | Baggage server `.10`, tower PCs `.11`–`.16` |
| Maintenance and services | `10.30.10.0/27` | Gateway `10.30.10.1` | PCs `.10`–`.13`, DNS `.14`, Operations `.15` |
| External services | `203.0.113.0/27` | Gateway `203.0.113.1` | Flight API server `203.0.113.10` |

WAN point-to-point links use /30 networks, which provide two usable addresses for the two router interfaces:

| Router connection | WAN network | Endpoint addresses |
| --- | --- | --- |
| Terminal–Control Tower | `172.16.0.0/30` | Terminal `.1`, Tower `.2` |
| Control Tower–ISP | `172.16.0.4/30` | Tower `.5`, ISP `.6` |
| Terminal–Maintenance | `172.16.0.8/30` | Terminal `.9`, Maintenance `.10` |
| Maintenance–ISP | `172.16.0.12/30` | Maintenance `.13`, ISP `.14` |

The two routes from Terminal toward ISP create redundancy. When the primary Terminal–Tower connection is unavailable, routing can use Terminal–Maintenance–ISP instead. A routing protocol must know about the networks and have a valid path before end-to-end traffic can pass.

### Addressing concepts

An IPv4 address identifies an interface. A subnet mask separates the network prefix from the host portion. A default gateway is the local router address a host uses when the destination is outside its own subnet. A next hop is the neighboring router to which a router forwards a packet.

A `/27` has 32 total addresses, with 30 conventionally usable host addresses. For example, `10.10.10.0/27` has network address `10.10.10.0`, usable addresses `10.10.10.1`–`10.10.10.30`, and broadcast address `10.10.10.31`. A `/30` has four total addresses and two usable addresses. For `172.16.0.0/30`, those endpoints are `.1` and `.2`.

## 4. How a packet travels

Use Check-in-Desk-01 (`10.10.10.10`) to Flight-API-Server (`203.0.113.10`) as an example.

1. The PC applies its subnet mask and determines that the server is outside its local `/27` network.
2. The PC sends the frame to its configured default gateway, `10.10.10.1`, through the Check-in switch.
3. The Terminal Router looks up the destination in its routing table and chooses a next hop.
4. The selected router forwards the packet across the WAN. Each router performs a new route lookup.
5. The ISP Router forwards the packet onto the external services LAN, where the Flight API server receives it.
6. The server sends an echo reply. That reply also needs a route back through the routers to the check-in network.

The return route matters. A request can reach a server while its reply fails if the server-side routers do not know how to reach the source network. A green physical link alone does not prove that end-to-end communication works. Addressing, gateways, routes, protocol adjacencies, and the return path all matter.

## 5. Website guide

Open the [AeroNet website](https://aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site/) in a current browser. The application runs its teaching model in the browser. The default theme is dark, and a light theme is available. The workspace is responsive, with navigation and controls adapted for smaller screens.

### Main areas

- **Network topology** shows devices, cables, interface status, and labels. Select a device to inspect or configure it. Use the cable and delete tools to edit the lab topology.
- **Routing tables** helps inspect the routes a selected router knows and their route sources.
- **Network tools** provides ping and traceroute. Their result panels show the modeled path and the reason a test succeeds or fails.
- **Subnet calculator** helps inspect network, mask, usable address range, and broadcast information.
- **Device configuration** includes interface settings, a simplified IOS-style CLI, routing settings, NAT, and remote-access settings where applicable.
- **Scenarios and experiment guides** provide prepared starting points for particular topics. Loading a scenario replaces the current working network; reset returns the loaded scenario to its baseline.
- **Search, zoom, fit, and expanded workspace** make it easier to find devices and read larger topologies.

### Recommended first demonstration

1. Load the expanded airport EIGRP scenario.
2. Identify the four internal departments, their switches, router gateways, and the Flight API server.
3. Open Network tools and ping from Check-in-Desk-01 to Flight-API-Server.
4. Run traceroute and describe the router hops.
5. Inspect Terminal Router’s routing table and EIGRP neighbors.
6. Activate WAN failover and repeat the test. Explain how the alternate path keeps the server reachable.
7. Restore the WAN and reset the scenario before demonstrating another experiment.

### Configuration workflow

When changing a device, use a deliberate sequence:

1. Identify the device and the network it belongs to.
2. Check its IP address, mask, gateway or interface state.
3. Check the relevant router route or protocol configuration.
4. Predict the result of the change before applying it.
5. Apply one change and test with ping or traceroute.
6. Explain the observed result, then reset or restore the scenario.

The CLI is an educational command parser with selected Cisco-style commands. Use `?` in the console to see supported commands. It is not a complete IOS implementation.

## 6. Experiment-by-experiment study text

### Experiment 1 — Commands and cables

**Purpose:** Recognize common network devices, cable types, and basic connectivity commands.

Identify a PC, switch, router, and server in the topology. Explain that straight-through and cross-over are Ethernet cable types, while Serial DCE is used on a serial WAN link. Use ping to check reachability and traceroute to view router hops. A cable only creates a physical connection; it does not automatically configure IP addresses or routing.

**Demonstrate:** Compare a ping between two same-LAN check-in PCs with a ping to a remote department. Explain why a remote test also depends on the gateway and routes.

### Experiment 2 — Peer-to-peer and LAN topologies

**Purpose:** Compare a direct link between two peers with a switched LAN.

A peer-to-peer link joins two devices directly. If both endpoints have addresses in the same subnet, they can communicate without a router. A LAN uses a switch to connect multiple local devices. The airport department networks use switched star layouts, with a switch at the center of each local group.

**Demonstrate:** Load the peer-to-peer scenario, inspect both addresses, and ping between the PCs. Change one address to another subnet and repeat. Then compare the direct link with a check-in LAN.

### Experiment 3 — Router console

**Purpose:** Practice moving between IOS configuration modes and configuring an interface.

The command line uses different modes. `enable` enters privileged EXEC. `configure terminal` enters global configuration. `interface g0/0` selects an interface. `ip address` assigns its IPv4 address and mask. `no shutdown` enables it. `show ip interface brief` and `show running-config` inspect the result.

```text
enable
configure terminal
interface g0/0
ip address 10.10.10.1 255.255.255.224
no shutdown
end
show ip interface brief
```

**Demonstrate:** Configure or inspect a LAN gateway interface, then explain why an interface must have both appropriate addressing and an active state.

### Experiment 4 — IP addressing and subnetting

**Purpose:** Relate a host address, mask, network prefix, and gateway.

The check-in LAN uses `10.10.10.0/27`. Its gateway is `10.10.10.1`; a sample host is `10.10.10.10`. The mask `255.255.255.224` means the first 27 bits identify the subnet. Router-to-router links use `/30` subnets because only two interface addresses are required.

**Demonstrate:** Inspect a PC’s configuration and calculate `10.10.10.10/27`. Explain the network address, usable range, and broadcast address. Temporarily remove the host’s gateway and show that same-subnet communication can still work while remote communication fails.

### Experiment 5 — Static and default routing

**Purpose:** Configure routes manually and understand the default route.

A static route records a destination network and a next hop. Each router along the path needs appropriate route information, including a return route. A default route (`0.0.0.0/0`) is used when no more specific route matches. Routers use the most specific matching prefix first.

**Demonstrate:** Inspect an `S` route or an `S*` default route in the table. Compare the route table before and after adding a static route, then ping a remote department. Explain which router forwards the request and how the reply returns.

### Experiment 6 — NAT and PAT

**Purpose:** Show how a router can translate internal addresses for communication with an outside network.

Static NAT pairs a fixed inside-local address with an inside-global address. Dynamic NAT allocates a global address from a configured pool. PAT allows many inside hosts to share one outside address by distinguishing sessions with port or identifier information. The AeroNet teaching model displays translations in a table.

**Demonstrate:** Load static NAT, dynamic NAT, and PAT scenarios separately. Generate traffic from check-in PCs to the Flight API server and inspect the translation table. Explain that routing and the return path are still required for NAT traffic to succeed.

### Experiment 7 — RIP v1 and RIP v2

**Purpose:** Understand distance-vector routing and compare classful and classless behavior.

RIP shares reachable network information with neighboring routers and uses hop count as its metric. RIP v1 is classful and does not carry subnet masks in updates. RIP v2 carries subnet information and supports classless routing. In both cases, peers need compatible configuration and reachable interfaces.

**Demonstrate:** Load a RIP v1 or v2 scenario, inspect `R` routes and compare the learned prefixes. Explain that a route can disappear if interfaces or protocol configuration stop neighbor exchange. The website models route exchange immediately rather than waiting for real RIP timers.

### Experiment 8a — Single-area OSPF

**Purpose:** Observe link-state routing inside one OSPF area.

OSPF routers form neighbor relationships on compatible, active links and exchange topology information. They calculate routes using costs. In a single-area example, all participating networks belong to area 0. The routing table identifies OSPF-learned routes with `O`.

**Demonstrate:** Inspect OSPF neighbors and `O` routes, then run a ping across the topology. Relate a formed adjacency to route learning.

### Experiment 8b — Multi-area OSPF

**Purpose:** Explain why OSPF networks can be divided into areas and why area 0 is important.

The backbone area is area 0. Other areas connect through routers that participate in more than one area, called area border routers. The project’s multi-area scenario shows inter-area routes as `O IA`. The website implements a simplified multi-area model for learning.

**Demonstrate:** Inspect the area assignments, neighbors, and `O IA` routes. Change one side’s area assignment to create a mismatch and observe the adjacency or route exchange change.

### Experiment 9a — PPP and 9b — HDLC

**Purpose:** Compare serial point-to-point link encapsulation.

PPP and HDLC define how network-layer packets are framed over a serial link. The two ends of a serial connection need compatible encapsulation. A mismatch can prevent the link from carrying traffic even if the interfaces are addressed.

**Demonstrate:** Load the PPP scenario and inspect both serial interfaces. Change one endpoint to HDLC and test connectivity. Restore PPP, then compare with the HDLC scenario. Explain that the website abstracts negotiation and timing details.

### Experiment 10 — BGP

**Purpose:** Introduce inter-domain routing between autonomous systems.

BGP exchanges reachability information between autonomous systems (AS). In the project, Terminal, Control Tower, and ISP use AS 65001, 65002, and 65003. A BGP route can carry an AS path, which indicates the sequence of autonomous systems through which the route was learned. BGP routes are marked `B` in the website’s table.

**Demonstrate:** Load the BGP scenario, inspect neighbor state and advertised networks, then find an AS path in the BGP view. Show how a wrong remote AS or unavailable neighbor prevents route exchange. AeroNet focuses on direct eBGP teaching behavior and does not model all BGP policy and convergence features.

### Experiment 11 — EIGRP

**Purpose:** Study Cisco’s interior gateway routing protocol and route recovery on a redundant network.

The expanded airport configures EIGRP with autonomous system 100. Routers form neighbors when the relevant links and EIGRP settings match, then learn routes. EIGRP routes appear as `D`. The topology has a primary Terminal–Tower–ISP path and an alternate Terminal–Maintenance–ISP path.

**Demonstrate:** Inspect the neighbors and `D` routes. Disable the primary WAN using the failover control and repeat a ping or traceroute to the Flight API server. Explain how the route changes to use the alternate path, then restore the primary link. The website uses simplified shortest-path recomputation and fixed teaching costs; it does not implement the full DUAL algorithm.

### Experiment 12 — Telnet and SSH

**Purpose:** Understand remote command-line access and compare unencrypted and encrypted management protocols.

Telnet provides remote terminal access without encrypting the session. SSH provides an encrypted remote-management channel in real networks. A router must have reachable interfaces, appropriate VTY access rules, user credentials, and SSH prerequisites. AeroNet supplies a local remote-console demonstration with demo credentials `admin` / `AirportLab123`.

**Demonstrate:** Open the router’s Access panel, select a reachable source PC, and connect using SSH. Run a simple show command in the remote console. Disconnect and compare with Telnet. Try a wrong credential or disallowed transport and explain the result. The browser checks modeled prerequisites but does not create a real TCP connection, encrypt traffic, or generate cryptographic keys.

## 7. Routing table quick reference

| Code | Route source | Meaning |
| --- | --- | --- |
| `C` | Connected | Network directly attached to a router interface |
| `S` | Static | Manually configured route |
| `S*` | Static default | Manually configured fallback route |
| `R` | RIP | Learned through RIP |
| `O` | OSPF | Learned within an OSPF area |
| `O IA` | OSPF inter-area | Learned from another OSPF area |
| `B` | BGP | Learned through BGP |
| `D` | EIGRP | Learned through EIGRP |

When a router forwards a packet, it first chooses the longest matching prefix. If multiple routes match equally, route-source preference and then the protocol’s metric help select a route. A specific `/27` route takes precedence over a `/0` default because it is more specific.

## 8. Cisco Packet Tracer companion

Open `packet-tracer-airport/Airport-Advanced-EIGRP-SSH.pkt` in Cisco Packet Tracer for the expanded airport. Other `.pkt` files provide earlier or focused scenarios, including the expanded 20-PC and single-area OSPF versions.

The advanced Packet Tracer project uses native Packet Tracer routers, switches, PCs, and servers. Its labels identify device roles, subnet information, gateways, interface addresses, and WAN links. Interface names differ from those shown by the website. For example, the native project uses FastEthernet and Serial names such as `Fa0/0`, `Se2/0`, and `Se3/0`, while the browser model may show `g0/0` and `s0/0/0`.

### Suggested Packet Tracer presentation

1. Open the advanced `.pkt` file in Logical view and introduce the four routers and four departmental switches.
2. Point out the four `/27` LANs and the `/30` WAN links using the diagram labels.
3. Open Check-in-Desk-01 and show its static IPv4 address, mask, and gateway.
4. Open a router CLI and use `show ip interface brief` and `show ip route` to inspect interfaces and routing.
5. Use `show ip eigrp neighbors` and `show ip eigrp topology` to discuss EIGRP.
6. Send a ping from a check-in PC to the Flight API server, then use `tracert` to inspect the path.
7. Disable the primary Terminal–Tower serial interface, wait for routing to adjust, and repeat the connectivity test.
8. Restore the interface and demonstrate SSH configuration or login if the lab file and Packet Tracer version support the configured endpoint behavior.

In Packet Tracer, the user can inspect real simulated IOS configuration and control simulation time. The browser makes it easier to compare prepared protocol scenarios and visual results. Treat them as related learning tools, not as a shared live network.

## 9. Website model versus real networking

The website is a client-side educational simulator. It does not send real ICMP packets, create actual router interfaces, run DNS, call the Flight API, or open real Telnet/SSH sessions. Its CLI accepts a supported subset of commands. Protocol convergence is simplified, and some values such as latency and TTL are teaching values. EIGRP uses a simplified path calculation, BGP focuses on direct eBGP, and OSPF and RIP behavior is limited to the teaching scenarios.

Cisco Packet Tracer is a separate network simulation application with its own device models and IOS behavior. A configuration change in the website does not update Packet Tracer, and a Packet Tracer change does not update the website. The project uses both to connect a clear web demonstration with native network-device practice.

## 10. Presentation plan

For a short project presentation, follow this order:

1. **Problem and idea:** Explain that an airport needs connected operational departments and external services.
2. **Design:** Show the topology, explain subnets, gateways, and redundant WAN connections.
3. **Website:** Demonstrate device configuration, ping, traceroute, routing tables, and the subnet calculator.
4. **Routing:** Show one prepared protocol scenario, then demonstrate EIGRP failover.
5. **Experiments 9–12:** Briefly demonstrate PPP/HDLC matching, a BGP AS path, EIGRP neighbors, and an SSH/Telnet access check.
6. **Packet Tracer:** Open the advanced project and show the labeled topology, IOS output, and an end-to-end ping.
7. **Limitations and conclusion:** Explain what is simplified in the browser and why Packet Tracer is also included.

For each feature, state the expected result before changing anything. Apply one change, run a test, explain the result, and reset before the next demonstration. This makes the networking principle clear and helps avoid confusing several simultaneous changes.

## 11. Common questions and concise answers

**Why does a PC need a default gateway?**  
It sends traffic for destinations outside its local subnet to the gateway router.

**Why can a ping fail when all cables look connected?**  
The host address, mask, gateway, router interface, route, protocol neighbor, or return path may be incorrect.

**Why use `/27` for LANs and `/30` for router links?**  
The LAN prefix provides up to 30 conventional host addresses, while a `/30` provides exactly two usable addresses for the ends of a point-to-point link.

**What is the difference between ping and traceroute?**  
Ping tests whether a destination responds. Traceroute reveals the sequence of router hops toward it.

**Why is the backup path useful?**  
It gives traffic another route if the primary WAN link fails, provided the routers have learned and selected that alternative.

**What is the main difference between RIP and OSPF?**  
RIP is a distance-vector protocol that uses hop count. OSPF is a link-state protocol that builds a topology view and selects paths using cost.

**What is BGP used for in this project?**  
It demonstrates route exchange between autonomous systems and how AS paths describe inter-AS reachability.

**What does EIGRP demonstrate?**  
It demonstrates neighbor relationships, learned routes, and route recovery across redundant airport WAN links.

**Why prefer SSH over Telnet?**  
SSH encrypts a real remote management session. Telnet does not protect the session contents.

**Is the website a Cisco emulator?**  
No. It is a simplified browser teaching model. Use Packet Tracer for native Cisco device configuration and simulation practice.

## 12. Project team

- Sayan Basu — `RA2411003011220`
- Rashal Jeet Singh — `RA2411003011206`
- Ansh Agarwal — `RA2411003011210`
- Akshat Sharma — `RA2411003011204`
- Shivam Kumar — `RA2411003011208`

**Faculty:** Dr R.S Ponmangal  
**Degree specialization:** Computer Science Engineering

## 13. Final review checklist

Before presenting, make sure you can explain the following without relying only on the interface:

- The role of every router, switch, LAN, WAN, and server in the topology.
- One host’s IP, mask, and gateway, and the subnet it belongs to.
- How a packet reaches the gateway and how a router chooses a next hop.
- Why the reply path is necessary for a successful ping.
- The difference among static routing, RIP, OSPF, BGP, and EIGRP at the level demonstrated.
- What PPP/HDLC encapsulation changes on a serial link.
- What NAT and PAT translate.
- Why SSH protects remote access better than Telnet.
- Which behaviors the website simplifies and what Packet Tracer adds.

**Closing summary:** AeroNet models an airport as connected departmental networks with routed WAN links and external services. Its website makes network concepts interactive and accessible, while Cisco Packet Tracer offers a separate place to practice with simulated Cisco devices and native-style configuration.
