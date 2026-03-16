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
  <img src="https://raw.githubusercontent.com/bobsilesia/UiMatic/main/preview-layouts.png" alt="UiMatic – classic and modern layout preview" width="720" />
</p>

**Features:**
- 🌡️ Temperature control (20–60°C) – arc dial or drum picker
- 💧 Water ON/OFF button with ripple animation
- 🌊 Flow rate control (0–10 L/min) – arc dial or drum picker
- 🔵 Drain open/close toggle
- 🔔 Toast notifications on action
- 🎨 Two layouts: `classic` (arc dials) and `modern` (iOS drum pickers)

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

Your entity IDs will look like (replace `192.168.1.36` with your device IP):
```
switch.water_flow_192.168.1.36
sensor.temperature_192.168.1.36
sensor.flow_rate_192.168.1.36
binary_sensor.bath_drain_192.168.1.36
number.temperature_192.168.1.36
number.flow_rate_192.168.1.36
```

> **Note:** The card automatically handles entity IDs with dots in the IP address.

### Step 2 – Add the card

In Lovelace dashboard, add a **Manual card** with this YAML (replace `192.168.1.36` with your device IP):

```yaml
type: custom:oblamatik-card
name: Bath Controller
entity_switch: switch.water_flow_192.168.1.36
entity_temperature: sensor.temperature_192.168.1.36
entity_flow: sensor.flow_rate_192.168.1.36
entity_drain: binary_sensor.bath_drain_192.168.1.36
entity_number_temp: number.temperature_192.168.1.36
entity_number_flow: number.flow_rate_192.168.1.36
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
| `card_height` | number \| string | — | Card height in px (e.g. `400`) or any CSS value (e.g. `"50vh"`, `"500px"`). If omitted, the card uses its natural height. |
| `layout` | string | `classic` | UI layout: `"classic"` – arc dial knobs; `"modern"` – iOS-style drum pickers (scroll wheel). |

---

## Setting card height

By default the card sizes itself automatically. Use `card_height` when you want a **fixed height** – for example to make all cards in a grid the same size.

**Fixed height in pixels:**
```yaml
type: custom:oblamatik-card
name: Bath Controller
# ... other options ...
card_height: 400
```

**Any CSS value** (viewport-relative, etc.):
```yaml
type: custom:oblamatik-card
name: Bath Controller
# ... other options ...
card_height: "50vh"
```

> **Tip:** When `card_height` is set, the card applies `box-sizing: border-box` so padding is included in the specified height.

---

## Choosing a layout

The card supports two visual layouts:

### `classic` (default)
Arc dial knobs – drag around the ring to set temperature or flow. Backward-compatible with all existing configurations.
```yaml
layout: "classic"
```

### `modern`
iOS-style drum pickers – swipe up/down to scroll through values. Clean, minimal, phone-friendly.
```yaml
layout: "modern"
```

> **Tip:** All other options (`card_height`, entity IDs, min/max ranges) work identically in both layouts.

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
