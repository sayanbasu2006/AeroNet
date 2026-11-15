# AeroNet study guide · Experiments 9–12

Use this guide to explain the airport topology, run each experiment, deliberately break one setting, and prove that your fix worked. The browser lab has a preset for each experiment. The saved Packet Tracer project is a separate simulation with its own configuration and interface names.

- [Open the AeroNet browser lab](https://aeronet-airport-lab-sb-1029.sayanbasu2006.chatgpt.site/)
- [Open the advanced Packet Tracer project](packet-tracer-airport/Airport-Advanced-EIGRP-SSH.pkt)
- [Open the three-router Packet Tracer project](packet-tracer-airport/Airport-Expanded-20-PCs.pkt)

## What each experiment proves

| Experiment | Preset under **Load scenario** | Question to answer | Evidence to show |
| --- | --- | --- | --- |
| 9A and 9B · PPP and HDLC | **PPP serial WAN**, then **HDLC serial WAN** | Can the two serial interfaces carry frames? | Matching encapsulation, working ping, one-sided mismatch, then recovery |
| 10 · BGP | **BGP autonomous systems** | How does an airport router learn a prefix from a different AS? | Established peers, AS path, a `B` route, and withdrawal |
| 11 · EIGRP | **Expanded airport · EIGRP** | How does routing recover when one WAN link fails? | EIGRP neighbors, a `D` route, and a different traceroute after failover |
| 12 · Telnet and SSH | **Telnet & SSH management** | Can an authorized workstation open a router console over the network? | Successful login, remote command output, and rejection when access settings change |

### How to navigate the lab

Select a router on the topology to open its inspector. **Config** holds interface settings, **CLI** accepts IOS-style commands, **Routing** shows protocol settings and learned routes, and **Access** opens remote management. Use **Readable 1:1** for full-size topology labels or **Overview** for the whole diagram. **Load scenario** gives you a clean preset before each experiment. **Reset** restores the current scenario.

For connectivity tests, open **Network tools**, set **Source device** to **Check-in-Desk-01** and **Destination device** to **Flight-API-Server**, then choose **Send ping** or **Traceroute**. Use **Custom IP / NAT global…** when the target is a specific router interface. The browser models ping delivery and the return path, and displays a forward hop path for traceroute. Its displayed latency and TTL are simulated. Record protocol state and the path alongside ping, since ping alone cannot show which protocol supplied the route.

### Know your airport network

The three-router presets for Experiments 9 and 10 use a linear WAN, **Terminal → Control Tower → ISP**. The four-router presets for Experiments 11 and 12 add **Maintenance**, which links to Terminal and ISP and forms a ring. The routers forward between subnets, and each access switch connects devices in its local LAN. The Flight API server connects directly to the ISP router.

| Segment | Prefix | Gateway | Example endpoint |
| --- | --- | --- | --- |
| Check-in | `10.10.10.0/27` | `10.10.10.1` | Check-in-Desk-01 `10.10.10.10` |
| Security | `10.10.20.0/27` | `10.10.20.1` | Security-PC-01 `10.10.20.10` |
| Baggage and tower | `10.20.10.0/27` | `10.20.10.1` | Baggage-Server `10.20.10.10`, Control-Tower-PC-01 `10.20.10.11` |
| External server | `203.0.113.0/27` | `203.0.113.1` | Flight-API-Server `203.0.113.10` |
| Maintenance and services | `10.30.10.0/27` | `10.30.10.1` | Operations-Server `10.30.10.15` |

| WAN | Subnet | Endpoint IPs | Website interfaces in endpoint order | Advanced Packet Tracer interfaces in endpoint order |
| --- | --- | --- | --- | --- |
| Terminal → Tower | `172.16.0.0/30` | `172.16.0.1` → `172.16.0.2` | `S0/0/0` → `S0/0/0` | `Se2/0` → `Se2/0` |
| Tower → ISP | `172.16.0.4/30` | `172.16.0.5` → `172.16.0.6` | `S0/0/1` → `S0/0/0` | `Se3/0` → `Se2/0` |
| Terminal → Maintenance | `172.16.0.8/30` | `172.16.0.9` → `172.16.0.10` | `S0/0/1` → `S0/0/0` | `Se3/0` → `Se2/0` |
| Maintenance → ISP | `172.16.0.12/30` | `172.16.0.13` → `172.16.0.14` | `S0/0/1` → `S0/0/1` | `Se3/0` → `Se3/0` |

A `/27` has mask `255.255.255.224` and wildcard `0.0.0.31`. A `/30` has mask `255.255.255.252`, wildcard `0.0.0.3` and two usable addresses. A host sends traffic for a remote subnet to its gateway. The routers need a route in each direction for an ICMP echo and reply to complete.

In CLI examples, enter commands one line at a time. `enable` opens privileged EXEC mode, `configure terminal` enters global configuration, `exit` steps back one mode, and `end` returns to privileged EXEC.

## Experiment 9 · PPP and Cisco HDLC

### Theory

PPP (Point-to-Point Protocol) and Cisco HDLC (High-Level Data Link Control encapsulation) carry Layer 3 packets inside Layer 2 frames across a point-to-point serial link. PPP uses LCP to establish and configure the link. It can optionally authenticate a peer using PAP or CHAP, then use an NCP such as IPCP to configure support for IPv4. PAP sends credentials without challenge-response protection. CHAP uses a challenge and a response derived from a shared secret. Cisco HDLC uses a protocol type field to distinguish payloads and is the default on the Cisco IOS serial interfaces described in the Cisco reference. [PPP specification](https://www.rfc-editor.org/rfc/rfc1661) · [Cisco serial configuration](https://www.cisco.com/c/en/us/td/docs/routers/access/800M/software/800MSCG/serconf.html)

In AeroNet, matching encapsulation allows an otherwise healthy serial link to carry packets. OSPF supplies the IP routes in both presets. The browser models the match and its effect on reachability. PPP negotiation, peer authentication, and serial timing are outside the model.

### Website demonstration

1. Load **PPP serial WAN**. Select Terminal Router → **Config** → **Serial encapsulation**. Verify PPP on `Serial0/0/0`. Tower uses PPP on the other end.
2. Ping Flight-API-Server from Check-in-Desk-01. Expected router order is **Terminal → Tower → ISP**. An `O` entry for the external network on Terminal identifies OSPF as the route source.
3. Change Terminal `Serial0/0/0` to **HDLC** only. Leave Tower on PPP. The link becomes unusable and the ping fails because the linear topology has no alternate WAN path. A same-LAN ping to Check-in-Desk-02 still works.
4. Restore Terminal to **PPP**. Repeat the remote ping to show recovery.
5. Load **HDLC serial WAN** and repeat the baseline. Change just one side to **PPP**, observe the failure, and restore **HDLC**.

The browser CLI can make the same one-sided change. Run this while in the PPP preset, then repeat with `encapsulation ppp` to restore it.

```text
enable
configure terminal
interface s0/0/0
encapsulation hdlc
end
show interfaces
show ip route
```

The browser's `show interfaces` reports the local configured state and encapsulation. It can show the interface as up even during a mismatch. Check the topology cable state and ping to prove the link is actually usable.

### Packet Tracer demonstration

Use **Save As** to work on a copy of the three-router OSPF project. Identify the Terminal and Tower serial ports by hovering over the cable and checking `show ip interface brief`. Apply the following on **both** connected interfaces, substituting the actual port if needed.

```text
enable
configure terminal
interface serial2/0
encapsulation ppp
no shutdown
end
show interfaces serial2/0
```

Keep serial clocking on the DCE end. If rebuilding the link, identify DCE with `show controllers serial 2/0` if supported and use `clock rate 64000` on that end, as in the airport lab. Test from the check-in PC with `ping 203.0.113.10`. Switch one side to HDLC and inspect the serial line protocol. Switch the other end to HDLC and test again. In the four-router ring, an alternate path can keep end-to-end ping working during a single link mismatch, so inspect the link directly.

**What to say in your viva.** “PPP and HDLC determine how a serial link carries frames. Both ends must agree. OSPF determines which IP route to use after the link becomes available.”

## Experiment 10 · eBGP between autonomous systems

### Theory

An autonomous system is a routing domain under common administration. eBGP exchanges reachable prefixes between different ASes. iBGP exchanges BGP information within an AS. BGP uses TCP port 179. `AS_PATH` records the ASes along an advertised path and helps prevent loops, since a router rejects a path containing its own AS. Real BGP path selection is policy-driven. AeroNet models direct reciprocal eBGP, exact connected prefix origination, AS loop prevention, and preference for shorter AS paths. [BGP-4 specification](https://www.rfc-editor.org/rfc/rfc4271) · [Cisco eBGP and iBGP configuration](https://www.cisco.com/c/en/us/support/docs/ip/border-gateway-protocol-bgp/13751-23.html)

| Router | Local AS | Neighbor IP and remote AS | Originated LAN prefix |
| --- | --- | --- | --- |
| Terminal | `65001` | `172.16.0.2` · `65002` | `10.10.10.0/27`, `10.10.20.0/27` |
| Tower | `65002` | `172.16.0.1` · `65001`, `172.16.0.6` · `65003` | `10.20.10.0/27` |
| ISP | `65003` | `172.16.0.5` · `65002` | `203.0.113.0/27` |

### Website demonstration

1. Load **BGP autonomous systems**. On Terminal → **Routing**, verify local AS 65001 and the neighbor at `172.16.0.2` in AS 65002 with state **Established**.
2. Find `203.0.113.0/27` via `172.16.0.2` in Terminal's forwarding table or CLI. The AS path is `65002 65003`. The leftmost AS is the next AS, and the rightmost is the origin AS. On ISP, the return prefix `10.10.10.0/27` should have AS path `65002 65001`.
3. Ping the Flight API server. Then in **Neighbors · IP / remote AS**, change Terminal's line to `172.16.0.2 65003` and click **Apply BGP configuration**. Terminal's session should show **Idle**, the remote `B` route should disappear, and ping should fail. Restore 65002.
4. For a separate experiment, remove the external prefix from ISP's **Advertised networks · network / mask** field and click **Apply BGP configuration**. The sessions remain established while the external route disappears. Restore `203.0.113.0 255.255.255.224` and retest.

```text
enable
show ip bgp summary
show ip bgp
show ip route
```

The summary answers whether neighbors are exchanging routes. The BGP table shows learned prefixes and AS paths. The forwarding table shows what the router can use. A `B` route learned by eBGP has administrative distance 20 in this lab. BGP needs reachability both to the peer and to the route's next hop. In this preset, the peers use directly connected serial IPs.

### Packet Tracer configuration practice

Use a separate copy of the three-router project. Keep its interface IPs, serial clocking and host gateways. Identify existing routing with `show ip protocols` and remove the active OSPF process on each router in the BGP copy with `no router ospf <process-id>`, substituting the actual number. Verify that both adjacent serial pairs can ping each other before configuring BGP. The same BGP configuration below can be entered in the AeroNet CLI.

**Terminal**

```text
enable
configure terminal
router bgp 65001
 neighbor 172.16.0.2 remote-as 65002
 network 10.10.10.0 mask 255.255.255.224
 network 10.10.20.0 mask 255.255.255.224
end
```

**Tower**

```text
enable
configure terminal
router bgp 65002
 neighbor 172.16.0.1 remote-as 65001
 neighbor 172.16.0.6 remote-as 65003
 network 10.20.10.0 mask 255.255.255.224
end
```

**ISP**

```text
enable
configure terminal
router bgp 65003
 neighbor 172.16.0.5 remote-as 65002
 network 203.0.113.0 mask 255.255.255.224
end
```

The BGP `network` command originates a prefix when an exact prefix and mask exist in the local routing table on IOS. These examples originate connected routes, which is what AeroNet supports. Use a subnet mask here. For example, `203.0.113.10` is the server address and `203.0.113.0/27` is the network to advertise. On IOS, a numeric value in the summary's `State/PfxRcd` column can indicate an established session and the number of received prefixes. Check `show ip bgp` to confirm the expected route. Packet Tracer command availability depends on the router image, so check `router bgp ?` if the command is rejected. [Cisco basic BGP configuration](https://www.cisco.com/c/en/us/td/docs/ios-xml/ios/iproute_bgp/configuration/xe-16-9/irg-xe-16-9-book/configuring-a-basic-bgp-network.pdf)

**What to say in your viva.** “Terminal learns the Flight API subnet from Tower. The AS path says to go through AS 65002 to reach the origin, AS 65003. If the peer configuration is wrong, the session drops. If only the advertisement is removed, the session can stay established.”

## Experiment 11 · EIGRP and WAN failover

### Theory

EIGRP is an advanced distance-vector interior routing protocol. In classic EIGRP, neighbors must share the AS number and compatible settings and have participating interfaces on a working link. The default classic metric uses minimum bandwidth and cumulative delay. DUAL (Diffusing Update Algorithm) keeps routing loop-free while converging. The **successor** is the best path. A **feasible successor** is a candidate whose reported distance is strictly less than the local feasible distance. A second physical path may exist without meeting that condition. The neighbor table lists adjacencies, the topology table holds route candidates, and the routing table shows installed routes. [Cisco EIGRP protocol and DUAL guide](https://www.cisco.com/c/en/us/support/docs/ip/enhanced-interior-gateway-routing-protocol-eigrp/16406-eigrp-toc.html)

AeroNet uses AS 100 on all four routers. Its EIGRP model uses fixed costs of 2,169,856 for serial and 28,160 for Ethernet and recalculates shortest paths. It does not model DUAL's query/reply process or feasible-successor selection. Say **alternate path** when describing the website failover. `D` denotes an internal EIGRP route and its administrative distance is 90.

### Website demonstration

1. Load **Expanded airport · EIGRP**. Select **Terminal-Router → Routing**. Show AS 100 and its neighbors `172.16.0.2` (Tower) and `172.16.0.10` (Maintenance). Show the `D` route to the Flight API subnet.
2. Run ping and traceroute from Check-in-Desk-01 to Flight-API-Server. The browser preset chooses **Terminal → Tower → ISP**, with Terminal's next hop `172.16.0.2`. The ring has another path with equal teaching cost.
3. Click **WAN failover**. This disables Terminal's `Serial0/0/0`. The direct Tower adjacency disappears. Repeat ping and traceroute. The destination remains reachable by **Terminal → Maintenance → ISP**, with next hop `172.16.0.10`.
4. Click **Restore WAN** and repeat. Capture the route and trace before failure, during failover, and after restoration.
5. For a different failure, change only **Maintenance-Router → Routing → Autonomous system** to `200` and apply. Test Check-in-Desk-01 → Operations-Server. The maintenance LAN becomes unreachable from check-in because Maintenance no longer peers with its AS 100 neighbors. Restore AS 100.

```text
enable
show ip eigrp neighbors
show ip eigrp topology
show ip route
```

### EIGRP network statements

The wildcard selects which local interfaces participate. The route advertised for a participating LAN uses the configured interface subnet. `0.0.0.31` ignores the last five bits of a `/27` and `0.0.0.3` ignores the last two bits of a `/30`.

| Router | Networks to match under `router eigrp 100` |
| --- | --- |
| Terminal | `10.10.10.0 0.0.0.31`, `10.10.20.0 0.0.0.31`, `172.16.0.0 0.0.0.3`, `172.16.0.8 0.0.0.3` |
| Tower | `10.20.10.0 0.0.0.31`, `172.16.0.0 0.0.0.3`, `172.16.0.4 0.0.0.3` |
| ISP | `203.0.113.0 0.0.0.31`, `172.16.0.4 0.0.0.3`, `172.16.0.12 0.0.0.3` |
| Maintenance | `10.30.10.0 0.0.0.31`, `172.16.0.8 0.0.0.3`, `172.16.0.12 0.0.0.3` |

For example, to configure Terminal on a fresh lab router with the interfaces already addressed:

```text
enable
configure terminal
router eigrp 100
 network 10.10.10.0 0.0.0.31
 network 10.10.20.0 0.0.0.31
 network 172.16.0.0 0.0.0.3
 network 172.16.0.8 0.0.0.3
 no auto-summary
end
```

### Packet Tracer demonstration

Open **Airport-Advanced-EIGRP-SSH.pkt**, which has EIGRP AS 100 configured. From Check-in-Desk-01 → **Desktop → Command Prompt**, run `ping 203.0.113.10` and `tracert 203.0.113.10`. On Terminal, run `show ip route` and `show ip eigrp neighbors`. Native equal-cost behavior may differ from the browser, so record the baseline next hops shown. In a copy, disable the Terminal-to-Tower link:

```text
enable
configure terminal
interface serial2/0
 shutdown
end
show ip eigrp neighbors
show ip route
```

After convergence, rerun the ping and trace. The remaining path to ISP goes through Maintenance. Restore the link with `configure terminal`, `interface serial2/0`, `no shutdown`, `end`. If the first ping loses a packet while ARP resolves, repeat before concluding that the path is broken.

**What to say in your viva.** “EIGRP learns the other LANs within AS 100. When I disable the Tower link, Terminal loses that direct neighbor and can still reach the ISP through Maintenance. The changed next hop and traceroute prove that failover occurred.”

## Experiment 12 · Telnet and SSH router management

### Theory

Telnet and SSH give a workstation an interactive router console over IP. Telnet uses TCP port 23 and ordinary Telnet carries the login and command traffic in cleartext. SSH uses TCP port 22 and provides an encrypted transport with server authentication and integrity protection. Cisco **VTY** lines are logical terminals for incoming remote sessions. `login local` checks the router's local username database, and `transport input` controls which protocols can connect. SSH host keys identify the router, and the login password authenticates the user. [Telnet specification](https://www.rfc-editor.org/rfc/rfc854) · [SSH transport specification](https://www.rfc-editor.org/rfc/rfc4253) · [Cisco SSH configuration](https://www.cisco.com/c/en/us/support/docs/security-vpn/secure-shell-ssh/4145-ssh.html)

### Website demonstration

1. Load **Telnet & SSH management**. Open **Maintenance-Router → Access → Open remote management**. The upper form configures the router. The lower form initiates a connection.
2. Confirm domain `airport.lab`, local user `admin`, simulated RSA keys and both transports. Choose **Check-in-Desk-01** as source, `10.30.10.1` as **Target router interface**, and **SSH** as transport. Enter demo password `AirportLab123` and click **Connect**.
3. Send `show ip route` or `show ip eigrp neighbors` in the remote command field. The output is from **MAINT-R4**. Disconnect and repeat with **Telnet** to the same router.
4. Try a wrong password. The output should say **Authentication failed**. Correct it and try again.
5. Disconnect, clear **Permit Telnet**, click **Apply VTY configuration**, and try a new Telnet connection. Expect a VTY transport rejection. An SSH connection should still work with its keys and transport enabled.
6. Disconnect, clear **Simulated RSA keys / SSH v2**, apply, and try SSH. Expect a domain/key/version requirement error. Re-enable keys and restore the desired transports.
7. To demonstrate the network prerequisite, verify a ping to `10.30.10.1`, then disable the source PC interface and try again. Expect a reachability error. Re-enable the PC interface after testing.

The website runs the sessions locally in the browser. It checks reachability, permitted transports, SSH settings and credentials, then feeds commands to the selected router's simulated CLI. It does not open network sockets or encrypt a real session.

### Packet Tracer demonstration

Use **Airport-Advanced-EIGRP-SSH.pkt**. Start from **Check-in-Desk-01 → Desktop → Command Prompt**.

```text
ping 10.30.10.1
telnet 10.30.10.1
```

Enter `admin` and `AirportLab123` when prompted, show a command available at the current privilege level, such as `show ip interface brief` if accepted, then use `exit`. Next run:

```text
ssh -l admin 10.30.10.1
```

Enter the same demo password. The router prompt identifies which router accepted the session. Use the router's local CLI for privileged verification with `show ip ssh`, `show users`, or `show running-config` as supported. The advanced project was configured for SSH and Telnet. The native login walkthrough is a procedure to verify in Packet Tracer.

If configuring a fresh copy of the native Maintenance router, use the local CLI:

```text
enable
configure terminal
hostname MAINT-R4
ip domain-name airport.lab
username admin secret AirportLab123
crypto key generate rsa
```

When prompted for the key modulus, enter `1024` if supported by the lab image. Continue:

```text
ip ssh version 2
line vty 0 4
 login local
 transport input all
end
show ip ssh
```

The project's Router-PT image accepted `transport input all` to permit both transports. In the **website CLI** you can use `transport input telnet ssh` and `crypto key generate rsa modulus 1024`. To demonstrate SSH-only access on the native router, change the VTY transport to `transport input ssh` from its local console and repeat both connection attempts. An ordinary remote login opens user EXEC mode. Privileged access depends on the account and enable configuration.

**What to say in your viva.** “Routing gets the workstation to the router. VTY settings decide whether the router accepts Telnet or SSH, and local login checks the account. Both can provide a console, but real SSH protects traffic in transit.”

## Troubleshooting during the demonstration

| What you see | What to check next |
| --- | --- |
| Same-LAN ping fails | Source and destination IP/mask, NIC state, switch ports, cable and duplicate IPs |
| Same-LAN ping works but a remote host fails | Host gateway, serial link state, forward route and return route |
| Serial port is administratively down | Correct interface and `no shutdown` |
| Serial link fails after an encapsulation change | Compare both ends. In Packet Tracer also check DCE clocking and interface/line protocol |
| BGP peer is Idle | Ping the peer IP, verify both `remote-as` values and check the reciprocal neighbor statements |
| BGP peer is established but prefix is missing | Check the origin router's exact subnet and mask, the advertised network, and the BGP table |
| EIGRP neighbor disappears while link is up | Verify matching AS, participating network/wildcard entries and, on IOS, compatible metric settings |
| EIGRP failover changes nothing in your trace | Trace to the Flight API server. The maintenance LAN already has a direct Terminal–Maintenance path |
| Ping to the router works but remote login fails | Check VTY transport, username/password and SSH key/domain/version requirements |
| Ping fails even before remote login | Fix reachability first. Check the exact target IP, host gateway and route in each direction |

## Viva questions and short answers

1. **Can PPP replace OSPF?** PPP handles serial framing. OSPF exchanges IP routes.
2. **Can PPP and Cisco HDLC share one serial link with different settings on each end?** Both ends need matching encapsulation for this lab.
3. **What is the DCE clock for?** It supplies the timing that the DTE uses on the back-to-back serial connection.
4. **Why does PPP have LCP and NCP?** LCP establishes and configures the link. An NCP configures a particular network-layer protocol over it.
5. **What makes the BGP session external?** The neighboring routers have different AS numbers.
6. **What is the path to the Flight API network on Terminal in Experiment 10?** `65002 65003`, with next hop `172.16.0.2`.
7. **Can a BGP session stay up after a route disappears?** Yes. Withdrawing a network advertisement removes the prefix while the peer session can continue.
8. **Why must check-in routes be advertised as well as the Flight API prefix?** The ISP router needs a route back to check-in for the echo reply.
9. **What do C, O, B and D mean?** Connected, OSPF, BGP and EIGRP. The codes identify the route's source.
10. **What is the difference between administrative distance and metric?** For competing routes to the same prefix, administrative distance compares route sources and a metric ranks paths within a protocol. Forwarding uses the longest matching prefix.
11. **Why do EIGRP neighbors use the same AS while eBGP neighbors use different ASes here?** EIGRP is operating inside the airport routing domain. eBGP is demonstrating route exchange across separate domains.
12. **Does every backup cable supply a feasible successor?** A feasible successor must satisfy the reported-distance condition. The existence of another physical path alone does not establish that.
13. **What proves failover better than one successful ping?** Compare the next hop or traceroute before and after disabling the link, and show the failed adjacency.
14. **Does SSH fix a routing problem?** SSH needs IP reachability first. Its transport protects the remote session after a connection can be made.
15. **Why can Telnet work while SSH fails?** Telnet may be permitted while SSH is disabled or missing its required host key or configuration.
16. **Does successful AeroNet SSH prove real encryption?** It demonstrates the access prerequisites and a simulated console. The browser does not run a real SSH transport.

## Lab record and presentation

For each experiment, capture **scenario and topology → baseline → one change → observed failure or alternate path → restoration**. Write down the exact interface, route prefix, next hop, AS, or transport setting you changed. Record actual output separately from the expected result.

| Experiment | Suggested screenshots or command output |
| --- | --- |
| 9 | Both ends showing PPP or HDLC, successful ping, one-sided mismatch, restored ping |
| 10 | BGP summary, external prefix and AS path on Terminal, withdrawn route, restored ping |
| 11 | Terminal neighbors and `D` route, baseline trace, disabled serial link, alternate trace |
| 12 | Successful SSH login and remote output, successful Telnet comparison, rejection after disabling Telnet |

If you have five minutes, spend the first 30 seconds locating the four routers and the server. Use about a minute for each experiment. Finish by showing the change and restoration you can explain most clearly.

### Where the project implements this

- [`dist/network.js`](airport-network-lab/dist/network.js) defines interfaces, serial link checks, BGP peering and advertisements, routing lookup, and simulated packet forwarding.
- [`dist/enterprise.js`](airport-network-lab/dist/enterprise.js) adds Maintenance and the redundant WAN, EIGRP calculations, VTY configuration, and remote session checks.
- [`dist/app.js`](airport-network-lab/dist/app.js) connects the scenario presets, topology, inspector, CLI and connectivity tools to the simulator state.
- [`tests/network.test.js`](airport-network-lab/tests/network.test.js) and [`tests/enterprise.test.js`](airport-network-lab/tests/enterprise.test.js) cover mismatch and recovery, BGP route withdrawal, EIGRP failover, and remote-login checks.
