# Airport Packet Tracer lab — build notes

This folder contains the native Packet Tracer project and prepared IOS configuration files. The `.cfg` files are plain text configurations, not `.pkt` projects. Native project completion and connectivity checks are tracked separately below.

## Airport topology and cabling plan

Three Router-PT devices have built-in copper Ethernet and serial modules. Three 2960 switches serve the airport LANs. The native interface names differ from the web simulator:

| Airport device | Interface | Peer device | Peer interface | Cable |
| --- | --- | --- | --- | --- |
| Terminal-Router | Serial2/0 (DCE) | Control-Tower-Router | Serial2/0 | Serial DCE |
| Control-Tower-Router | Serial3/0 (DCE) | ISP-Router | Serial2/0 | Serial DCE |
| Terminal-Router | FastEthernet0/0 | Check-in-LAN | FastEthernet0/1 | Copper straight-through |
| Terminal-Router | FastEthernet1/0 | Security-LAN | FastEthernet0/1 | Copper straight-through |
| Control-Tower-Router | FastEthernet0/0 | Baggage-LAN | FastEthernet0/1 | Copper straight-through |
| Check-in-Desk-01 | FastEthernet0 | Check-in-LAN | FastEthernet0/2 | Copper straight-through |
| Check-in-Desk-02 | FastEthernet0 | Check-in-LAN | FastEthernet0/3 | Copper straight-through |
| Security-Workstation | FastEthernet0 | Security-LAN | FastEthernet0/2 | Copper straight-through |
| Baggage-Server | FastEthernet0 | Baggage-LAN | FastEthernet0/2 | Copper straight-through |
| Control-Tower-PC | FastEthernet0 | Baggage-LAN | FastEthernet0/3 | Copper straight-through |
| ISP-Router | FastEthernet0/0 | Flight-API-Server | FastEthernet0 | Copper cross-over |

DCE sides use `clock rate 64000`.

## Host addresses

All masks in this table are `255.255.255.224` (/27).

| Host | IPv4 | Gateway |
| --- | --- | --- |
| Check-in-Desk-01 | 10.10.10.10 | 10.10.10.1 |
| Check-in-Desk-02 | 10.10.10.11 | 10.10.10.1 |
| Security-Workstation | 10.10.20.10 | 10.10.20.1 |
| Baggage-Server | 10.20.10.10 | 10.20.10.1 |
| Control-Tower-PC | 10.20.10.11 | 10.20.10.1 |
| Flight-API-Server | 203.0.113.10 | 203.0.113.1 |

The RIP v1 configuration files use classful /24 LANs to avoid discontiguous 10/8 networks: check-in `192.168.10.0/24`, security `192.168.20.0/24`, baggage/tower `192.168.30.0/24`, and external `203.0.113.0/24`. Hosts retain the last octet, and gateways use `.1`. Serial links retain their /30 addressing within 172.16.0.0/16.

## Configuration variants

- `01-04-Foundation`: interface addresses only, for commands, cables, LANs, console configuration and subnetting.
- `05-Static-Default`: explicit return routes and defaults through the tower to the ISP.
- `06A-Static-NAT`: Check-in-Desk-01 maps to `172.16.0.10` at Terminal-Router.
- `06B-Dynamic-NAT`: Terminal-Router allocates `172.16.0.10` through `172.16.0.14`.
- `06C-PAT`: check-in and security hosts share Terminal-Router's `172.16.0.1` serial outside address.
- `07A-RIPv1`: classful LAN addressing, RIP version 1 and automatic summaries.
- `07B-RIPv2`: original /27 LANs, RIP version 2 and `no auto-summary`.
- `08A-Single-Area-OSPF`: all participating networks in area 0.
- `08B-Multi-Area-OSPF`: terminal LANs in area 1, baggage/tower LAN in area 2, WAN and external networks in area 0.

These are complete configurations intended for clean router states. Importing a `.cfg` through Config → Merge does not automatically remove an old routing protocol, static route, or NAT statement. Use the appropriate native experiment project when available, or remove previous configuration before merging a different variant.

## Verification commands

On routers:

```text
show ip interface brief
show ip route
show ip protocols
show ip ospf neighbor
show ip nat translations
show ip nat statistics
```

On Check-in-Desk-01, use Desktop → Command Prompt:

```text
ipconfig
ping 10.10.10.11
ping 10.20.10.10
ping 203.0.113.10
tracert 203.0.113.10
arp -a
```

The foundation lab should deliver local-LAN traffic and fail remote-LAN traffic until routes are added. NAT labs should deliver inside-to-outside traffic; inspect NAT translations immediately after ping. Static NAT can also be tested from the Flight API Server toward `172.16.0.10`. Repeat ping if the first request times out during ARP resolution or routing convergence.

## Native build status

- Placed 3 routers, 3 switches, 4 PCs and 2 servers.
- Configured and saved the three router interface/OSPF configurations in `Airport-08A-Single-Area-OSPF.pkt`.
- Added and saved all 11 physical links. The native link table shows both ends green for every link.
- Remaining: host addressing, descriptive switch/host names, end-to-end verification, and saved experiment variants.

The current native project is a work in progress until these remaining steps are completed. Prepared `.cfg` files do not themselves demonstrate a tested network.
