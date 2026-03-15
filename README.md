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
  <img src="https://raw.githubusercontent.com/bobsilesia/UiMatic/main/preview.png" alt="UiMatic Card Preview" width="420" />
</p>

**Features:**
- 🌡️ Temperature arc dial (20–60°C)
- 💧 Water ON/OFF button with ripple animation
- 🌊 Flow rate arc dial (0–10 L/min)
- 🔵 Drain open/close toggle
- 🔔 Toast notifications on action

---

## Installation

### HACS (recommended)

1. In HACS, click **⋮ → Custom repositories**
2. Add URL: `https://github.com/bobsilesia/UiMatic` → Category: **Dashboard**
3. Click **Download**
4. Hard refresh browser: `Ctrl+Shift+R` / `Cmd+Shift+R`

### Manual

1. Download `oblamatik-card.js` from [latest release](https://github.com/bobsilesia/UiMatic/releases/latest)
2. Copy to `/config/www/oblamatik-card.js`
3. In HA go to **Settings → Dashboards → Resources** → Add resource:
   - URL: `/local/oblamatik-card.js`
   - Type: **JavaScript module**
4. Restart Home Assistant

---

## Configuration

### Step 1 – Find your entity IDs

Go to **Developer Tools → States** and filter by `oblamatik`.

Your entity IDs will look like:
```
switch.oblamatik_192_168_1_36_water_flow
number.oblamatik_192_168_1_36_temperature
number.oblamatik_192_168_1_36_flow_rate
binary_sensor.oblamatik_192_168_1_36_bath_drain
sensor.oblamatik_192_168_1_36_temperature
sensor.oblamatik_192_168_1_36_flow_rate
```

> **Note:** IP address dots are replaced with underscores in entity IDs.
> Device at `192.168.1.36` → entities contain `192_168_1_36`.

### Step 2 – Add the card

In Lovelace dashboard, add a **Manual card** with this YAML (replace IP part with yours):

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

---

## Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `Bath Controller` | Card title |
| `entity_switch` | entity | — | Switch entity for water on/off |
| `entity_temperature` | entity | — | Sensor for current temperature |
| `entity_flow` | entity | — | Sensor for current flow rate |
| `entity_drain` | entity | — | Binary sensor / switch for drain |
| `entity_number_temp` | entity | — | Number entity to set target temperature |
| `entity_number_flow` | entity | — | Number entity to set target flow |
| `min_temp` | number | `20` | Minimum temperature (°C) |
| `max_temp` | number | `60` | Maximum temperature (°C) |
| `min_flow` | number | `0` | Minimum flow (L/min) |
| `max_flow` | number | `10` | Maximum flow (L/min) |

---

## Compatibility

- Home Assistant 2022.6+
- [Oblamatik integration](https://github.com/bobsilesia/oblamatik) required
- KWC ZOE touch light PRO
- Viega Multiplex Trio E
- Crosswater Digital
- Any device based on Oblamatik TLC controller

---

## License

Apache-2.0 © [bobsilesia](https://github.com/bobsilesia)
