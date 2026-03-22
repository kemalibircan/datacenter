# DC SiteLab — Monitoring Simulation Methodology

> **This is an educational simulation. All telemetry is synthetic.**  
> DC SiteLab does not connect to real DCIM, SCADA, or BMS systems.

## Overview

The Operations & Monitoring module in DC SiteLab simulates what a modern data center operations dashboard might look like. The goal is educational: to help learners understand what is monitored, what the metrics mean, and how operational scenarios change the picture.

## Simulation Architecture

### Simulation Scenarios

Six named scenarios are available:

| Scenario | Description | Key Effects |
|---|---|---|
| **Normal Operation** | Steady-state, typical facility | Baseline telemetry, low alarms |
| **AI/GPU Workload** | High-density GPU cluster under load | High IT load, thermal stress, liquid cooling pressure |
| **Cooling Stress** | Cooling system near capacity | High PUE, intake temperature rising, more alarms |
| **Utility Instability** | Grid feed degraded, UPS active | Power alerts, generator standby, capacity warnings |
| **Maintenance Backlog** | Preventive maintenance deferred | Higher failure risk, more overdue tasks, resilience warnings |
| **Traffic Spike** | Network and compute near peak | Bandwidth saturation, compute utilization high |

### Telemetry Categories

- **Power**: IT load (kW), facility total (kW), cooling overhead, auxiliary power, UPS efficiency, computed PUE
- **Cooling**: Supply/return temperature, cooling utilization %, hotspot risk indicator
- **Network**: Inbound/outbound Gbps, bandwidth utilization %
- **Capacity**: Rack occupancy %, compute utilization %, storage utilization %
- **Sustainability**: Estimated renewable share %, CO₂ rate, water consumption rate

### PUE Calculation

PUE = Total Facility Power / IT Equipment Power

- Ideal: 1.1–1.3 (advanced facilities with free cooling)
- Good: 1.3–1.5 (modern facilities)
- Average: 1.5–2.0 (typical mixed-age facilities)
- Poor: > 2.0 (legacy, inefficient facilities)

### Alarm Classification

Events are classified per industry convention:

| Severity | Meaning | Example |
|---|---|---|
| **Critical** | Immediate action required; SLA impact | UPS failure, chiller offline |
| **Warning** | Potential issue; monitor and investigate | Temperature approaching limit, bandwidth 80% |
| **Info** | Informational; logged for audit | Maintenance completed, patch applied |

Alarms are generated algorithmically based on scenario settings. Not all alarms represent real faults — they illustrate the kind of alarm traffic an NOC (Network Operations Center) might manage.

### Connection to Planning

When a planning scenario has been configured, the monitoring simulation is seeded with awareness of:

- **Rack density**: Higher density → more thermal pressure in simulation
- **Workload type**: AI/GPU workload → higher base IT load and cooling demand
- **Cooling strategy**: Liquid cooling scenarios show better PUE under high density
- **Availability tier**: Lower redundancy → more risk-focused maintenance warnings

## Service Operations Context

The module also surfaces operations management concepts from the ITIL/ITSM framework:

- **Service Desk**: Central contact for incidents and requests
- **IT Operations**: 24/7 monitoring shifts, event management
- **Technical Management**: Specialist teams for servers, network, cooling
- **Facility Operations**: Electrical, mechanical, cooling, security management
- **Security Management**: Access control, threat monitoring, policy enforcement

## Limitations

- All values are **synthetic/simulated** — not from real sensors
- Time series are generated with bounded random variation, not forecasted
- Alarm categories are illustrative, not exhaustive
- Energy efficiency estimates do not account for workload power management states
- Carbon and water intensity figures use rough regional average proxies

## References

- The Green Grid PUE Standard (ISO/IEC 30134-2)
- ASHRAE Thermal Guidelines for Data Center Equipment (Class A1–A4)
- ITIL v4 Service Operations framework
- TIA-942 Data Center Standards
- EU Energy Efficiency Directive (EED) 2023 update (>500 kW threshold)
