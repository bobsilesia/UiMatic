# UiMatic – Oblamatik Lovelace Card

<p align="center">
  <img src="https://img.shields.io/badge/Home%20Assistant-Lovelace-blue?logo=home-assistant" />
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" />
  <img src="https://img.shields.io/github/v/release/bobsilesia/UiMatic?sort=semver" />
</p>

A modern, minimalist **Lovelace custom card** for Home Assistant to control **Oblamatik / KWC / Viega / Crosswater** bath controllers.

---

## Preview

<p align="center">
  <img src="preview.png" alt="UiMatic Card Preview" width="420" />
</p>

**Features:**
- 🌡️ Temperature dial (arc slider, 20–60°C)
- 💧 Water ON/OFF button with ripple animation
- 🌊 Flow rate dial (arc slider, 0–20 L/min)
- 🔵 Drain open/close toggle
- 🔔 Toast notifications on action
- 📡 Works via HA entities **or** direct device IP

---

## Installation

### HACS (recommended)
1. Add this repository as a **Custom Repository** in HACS → Frontend
2. Install **UiMatic**
3. Restart Home Assistant

### Manual
1. Copy `oblamatik-card.js` to `/config/www/`
2. Add to Lovelace resources:
   ```yaml
   resources:
     - url: /local/oblamatik-card.js
       type: module
   ```
3. Restart Home Assistant

---

## Configuration

### Minimal (via HA entities)

> **Note:** Entity IDs include the device IP with dots replaced by underscores.
> For a device at `192.168.1.36`, the entity IDs look like:
> `switch.oblamatik_192_168_1_36_water_flow`
>
> Check your exact entity names in **Developer Tools → States** (filter by `oblamatik`).

```yaml
type: custom:oblamatik-card
name: My Bath
entity_switch: switch.oblamatik_192_168_1_36_water_flow
entity_temperature: sensor.oblamatik_192_168_1_36_temperature
entity_flow: sensor.oblamatik_192_168_1_36_flow_rate
entity_drain: binary_sensor.oblamatik_192_168_1_36_bath_drain
entity_number_temp: number.oblamatik_192_168_1_36_temperature
entity_number_flow: number.oblamatik_192_168_1_36_flow_rate
```

### Full configuration

```yaml
type: custom:oblamatik-card
name: Bath Controller
entity_switch: switch.oblamatik_192_168_1_36_water_flow
entity_temperature: sensor.oblamatik_192_168_1_36_temperature
entity_flow: sensor.oblamatik_192_168_1_36_flow_rate
entity_drain: binary_sensor.oblamatik_192_168_1_36_bath_drain
entity_number_temp: number.oblamatik_192_168_1_36_temperature
entity_number_flow: number.oblamatik_192_168_1_36_flow_rate
min_temp: 20
max_temp: 60
min_flow: 0
max_flow: 10
```

### Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `Bath Controller` | Card title |
| `entity_switch` | entity | — | Switch entity for water on/off |
| `entity_temperature` | entity | — | Sensor entity for current temperature |
| `entity_flow` | entity | — | Sensor entity for current flow rate |
| `entity_drain` | entity | — | Switch entity for drain |
| `entity_number_temp` | entity | — | Number entity to set target temperature |
| `entity_number_flow` | entity | — | Number entity to set target flow |
| `min_temp` | number | `20` | Minimum temperature (°C) |
| `max_temp` | number | `60` | Maximum temperature (°C) |
| `min_flow` | number | `0` | Minimum flow (L/min) |
| `max_flow` | number | `20` | Maximum flow (L/min) |
| `host` | string | — | Device IP (direct API mode) |
| `port` | number | `80` | Device port (direct API mode) |

---

## Compatibility

- Home Assistant 2025.2+
- Oblamatik integration ([bobsilesia/oblamatik](https://github.com/bobsilesia/oblamatik))
- KWC ZOE touch light PRO
- Viega Multiplex Trio E
- Crosswater Digital
- Any device based on Oblamatik TLC controller

---

## License

Apache-2.0 © [bobsilesia](https://github.com/bobsilesia)
