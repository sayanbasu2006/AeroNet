# Expanded Airport — Packet Tracer Project

Saved project: `Airport-Expanded-20-PCs.pkt`

## Topology

- 3 Router-PT routers and 3 Cisco 2960 switches.
- 8 check-in PCs, 6 security PCs, 6 control-tower PCs, Baggage Server, and Flight API Server.
- 28 devices and 27 links.
- Single-area OSPF retained on the three routers.
- All 54 link endpoints were green in the native link table at final verification.

## Host addressing

All host subnet masks: `255.255.255.224` (/27).

| Host | IP address | Gateway | Connected device | Peer port |
| --- | --- | --- | --- | --- |
| Check-in-Desk-01 | 10.10.10.10 | 10.10.10.1 | Check-in-LAN | FastEthernet0/2 |
| Check-in-Desk-02 | 10.10.10.11 | 10.10.10.1 | Check-in-LAN | FastEthernet0/3 |
| Check-in-Desk-03 | 10.10.10.12 | 10.10.10.1 | Check-in-LAN | FastEthernet0/4 |
| Check-in-Desk-04 | 10.10.10.13 | 10.10.10.1 | Check-in-LAN | FastEthernet0/5 |
| Check-in-Desk-05 | 10.10.10.14 | 10.10.10.1 | Check-in-LAN | FastEthernet0/6 |
| Check-in-Desk-06 | 10.10.10.15 | 10.10.10.1 | Check-in-LAN | FastEthernet0/7 |
| Check-in-Desk-07 | 10.10.10.16 | 10.10.10.1 | Check-in-LAN | FastEthernet0/8 |
| Check-in-Desk-08 | 10.10.10.17 | 10.10.10.1 | Check-in-LAN | FastEthernet0/9 |
| Security-PC-01 | 10.10.20.10 | 10.10.20.1 | Security-LAN | FastEthernet0/2 |
| Security-PC-02 | 10.10.20.11 | 10.10.20.1 | Security-LAN | FastEthernet0/3 |
| Security-PC-03 | 10.10.20.12 | 10.10.20.1 | Security-LAN | FastEthernet0/4 |
| Security-PC-04 | 10.10.20.13 | 10.10.20.1 | Security-LAN | FastEthernet0/5 |
| Security-PC-05 | 10.10.20.14 | 10.10.20.1 | Security-LAN | FastEthernet0/6 |
| Security-PC-06 | 10.10.20.15 | 10.10.20.1 | Security-LAN | FastEthernet0/7 |
| Control-Tower-PC-01 | 10.20.10.11 | 10.20.10.1 | Baggage-LAN | FastEthernet0/3 |
| Control-Tower-PC-02 | 10.20.10.12 | 10.20.10.1 | Baggage-LAN | FastEthernet0/4 |
| Control-Tower-PC-03 | 10.20.10.13 | 10.20.10.1 | Baggage-LAN | FastEthernet0/5 |
| Control-Tower-PC-04 | 10.20.10.14 | 10.20.10.1 | Baggage-LAN | FastEthernet0/6 |
| Control-Tower-PC-05 | 10.20.10.15 | 10.20.10.1 | Baggage-LAN | FastEthernet0/7 |
| Control-Tower-PC-06 | 10.20.10.16 | 10.20.10.1 | Baggage-LAN | FastEthernet0/8 |
| Baggage-Server | 10.20.10.10 | 10.20.10.1 | Baggage-LAN | FastEthernet0/2 |
| Flight-API-Server | 203.0.113.10 | 203.0.113.1 | ISP-Router | FastEthernet0/0 |

## Router and WAN addresses

| Router | Interface | Address |
| --- | --- | --- |
| Terminal-Router | FastEthernet0/0 | 10.10.10.1/27 |
| Terminal-Router | FastEthernet1/0 | 10.10.20.1/27 |
| Terminal-Router | Serial2/0 (DCE) | 172.16.0.1/30 |
| Control-Tower-Router | FastEthernet0/0 | 10.20.10.1/27 |
| Control-Tower-Router | Serial2/0 | 172.16.0.2/30 |
| Control-Tower-Router | Serial3/0 (DCE) | 172.16.0.5/30 |
| ISP-Router | FastEthernet0/0 | 203.0.113.1/27 |
| ISP-Router | Serial2/0 | 172.16.0.6/30 |

DCE clock rate: 64000. Router-to-switch and host-to-switch connections are copper straight-through. ISP-to-Flight-API-Server is copper cross-over. Red serial lines are normal Packet Tracer cable styling; endpoint indicators show operational state.

## Verification performed

Source: Check-in-Desk-08 (`10.10.10.17`).

- `ipconfig` confirmed the /27 mask and gateway `10.10.10.1`.
- Ping to Security-PC-06 (`10.10.20.15`) received 3 of 4 replies on the initial post-fix test.
- Ping to Control-Tower-PC-06 (`10.20.10.16`) received 3 of 4 replies on the initial test.
- Ping to Flight-API-Server (`203.0.113.10`) received 3 of 4 replies initially, then 4 of 4 replies on repeat.
- Initial single-request timeouts occurred during address resolution.
- Traceroute reached `10.10.10.1` → `172.16.0.2` → `172.16.0.6` → `203.0.113.10`.

The raw PC command transcript includes an earlier failed test before gateway settings were corrected. The final tests above are the results after correction. Every host configuration was entered and read back, and every cable was checked in the link table. An exhaustive all-host-pairs ping test was not performed.

## Open

Open the `.pkt` file in Cisco Packet Tracer 9.0.1. It is also left open in the application. Allow switch ports and routing to converge after loading; repeat a first ping if ARP resolution consumes its first request.

The earlier smaller project is preserved separately. This expanded saved project implements the reference topology with OSPF; the prepared RIP/NAT/static `.cfg` files are separate experiment configurations and have not been merged into this expanded project.
