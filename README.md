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
- 🌡️ Temperature control (10–45°C, safe for humans) – arc dial or drum picker
- 💧 Water ON/OFF button with ripple animation
- 🌊 Flow rate control (0–10 L/min) – arc dial or drum picker
- 🔵 Drain open/close toggle
- 🔔 Toast notifications on action
- 🎨 Two layouts: `classic` (arc dials) and `modern` (iOS drum pickers)

---

## How it works?

**Interactive simulator** – runs directly in the browser, no Home Assistant required:


<p align="center">
  <a href="https://bobsilesia.github.io/UiMatic/demo-picker.html">
    <img src="https://img.shields.io/badge/▶%20Live%20Demo-Open%20interactive%20simulator-40c4ff?style=for-the-badge&logo=html5&logoColor=white" alt="Live Demo"/>
  </a>
</p>


The simulator shows both layouts side-by-side with fully working controls:

| Control | Function |
|---------|----------|
| 🔘 Round button (center) | **Drain** open / closed — default: **open** (flood-safe) |
| ▬ Wide button (bottom) | **Water** ON / OFF with ripple animation |
| Arc dials *(classic)* | Drag to set temperature & flow |
| Drum pickers *(modern)* | Swipe up/down to scroll values |

**Drain color logic:**
- ⚫ Dark (no accent) = drain is **open** — safe, no alert needed
- 🔵 Blue = drain is **closed** — alert! water may flood if turned on

> **Safety note:** The drain is **open by default**. This prevents bathroom flooding if water is accidentally turned on before closing the drain.

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
min_temp: 10
max_temp: 45
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
| `min_temp` | number | `10` | Minimum temperature (°C) |
| `max_temp` | number | `45` | Maximum temperature (°C, safe upper limit for human comfort) |
| `min_flow` | number | `0` | Minimum flow (L/min) |
| `max_flow` | number | `10` | Maximum flow (L/min) |
| `card_height`  | number \| string | —          | Card height in px (e.g. `400`) or any CSS value (e.g. `"50vh"`, `"500px"`). If omitted, the card uses its natural height. |
| `card_color`        | string | `#1a1f2e` | Card background color (hex or CSS color). Buttons inherit this color for neumorphic depth. |
| `picker_color`      | string | `#141820` | Background color of the drum pickers (`modern` layout). Defaults to slightly darker than the card for visual depth. |
| `picker_text_color` | string | `#e8f0fe` | Color of the active (selected) value in drum pickers. Set to a **dark** color (e.g. `"#1a1f2e"`) when using a light `picker_color` to ensure readability. |
| `title_color`       | string | `#6b7a8d` | Color of the card header title only. |
| `labels_color`      | string | `#6b7a8d` | Color of all control labels and units (Temperature, Flow, °C, L/min). |
| `text_color`        | string | —         | Shorthand alias: sets both `title_color` and `labels_color` at once. Overridden by explicit `title_color` / `labels_color`. |
| `accent_color`      | string | `#40c4ff` | Accent color used for active states (water ON, drain closed, status dot, glow). |
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

## Customization & Theming

The card supports full color theming through configuration options. All colors accept any valid CSS color value (hex, `rgb()`, `hsl()`, named colors).

> **Neumorphic rule:** For the best neumorphic (soft UI) depth effect, `card_color` and `picker_color` should be **dark desaturated** colors. Light colors invert the shadow model and may look flat.

### Color variables

| Variable | CSS var | Affects |
|----------|---------|---------|
| `card_color` | `--card-bg` | Card background + all neumorphic button backgrounds |
| `picker_color` | `--picker-bg` | Drum picker background + fade gradients (`modern` only) |
| `picker_text_color` | `--picker-text` | Active (selected) value in drum pickers |
| `title_color` | `--title-color` | Header title text |
| `labels_color` | `--labels-color` | All labels (Temperature, Flow) and units (°C, L/min) |
| `accent_color` | `--accent` | Status dot, water ON, drain CLOSED glow |

> **`text_color` alias:** Sets both `title_color` and `labels_color` at once (backward-compatible shorthand).

### Example: Default dark blue (built-in)

```yaml
type: custom:oblamatik-card
name: Bath Controller
layout: modern
card_color: "#1a1f2e"
picker_color: "#141820"
picker_text_color: "#e8f0fe"
title_color: "#6b7a8d"
labels_color: "#6b7a8d"
accent_color: "#40c4ff"
```

### Example: Light picker on dark card

```yaml
type: custom:oblamatik-card
name: Bath Controller
layout: modern
card_color: "#1a1f2e"
picker_color: "#e8ecf0"
picker_text_color: "#1a1f2e"
title_color: "#6b7a8d"
labels_color: "#6b7a8d"
accent_color: "#40c4ff"
```

> **Note:** When `picker_color` is light (e.g. `"#ffffff"`), the active value would be white-on-white without `picker_text_color`. Always pair a light `picker_color` with a dark `picker_text_color`.

### Example: Deep navy theme

```yaml
type: custom:oblamatik-card
name: Bath Controller
layout: modern
card_color: "#0d1b2a"
picker_color: "#091523"
text_color: "#5f7a8a"
accent_color: "#00bcd4"
```

### Example: Dark slate theme

```yaml
type: custom:oblamatik-card
name: Bath Controller
layout: classic
card_color: "#1e2029"
text_color: "#7a8599"
accent_color: "#7c3aed"
```

### Example: Dark warm graphite

```yaml
type: custom:oblamatik-card
name: Bath Controller
layout: modern
card_color: "#1f1c1a"
picker_color: "#161412"
text_color: "#8a7a6d"
accent_color: "#ff8a65"
```

> **Tip:** The `picker_color` is most visible when set lighter than `card_color` (reversed depth) or darker (deeper well). Default is darker for a "pressed into the card" feel.

### Fixed card height for grid layouts

When placing multiple cards side-by-side in a grid, use `card_height` to keep them uniform:

```yaml
type: custom:oblamatik-card
name: Bath Controller
card_height: 380
layout: modern
```

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
