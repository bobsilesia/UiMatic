/**
 * UiMatic – Oblamatik Lovelace Card v0.4.2
 * Modern, minimalist bath controller UI for Home Assistant
 * https://github.com/bobsilesia/UiMatic
 */

class OblamatikCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._flowValue = 0;
    this._tempValue = 38;
    this._waterOn = false;
    this._drainOpen = false;
    this._draggingFlow = false;
    this._draggingTemp = false;
    this._rendered = false;
  }

  // ── Config ────────────────────────────────────────────────────────────────

  setConfig(config) {
    this._config = {
      name:               config.name               || "Bath Controller",
      entity_switch:      config.entity_switch       || null,
      entity_temperature: config.entity_temperature  || null,
      entity_flow:        config.entity_flow         || null,
      entity_drain:       config.entity_drain        || null,
      entity_number_temp: config.entity_number_temp  || null,
      entity_number_flow: config.entity_number_flow  || null,
      min_temp:           config.min_temp            != null ? config.min_temp : 20,
      max_temp:           config.max_temp            != null ? config.max_temp : 60,
      min_flow:           config.min_flow            != null ? config.min_flow : 0,
      max_flow:           config.max_flow            != null ? config.max_flow : 10,
      card_height:        config.card_height         != null ? config.card_height : null,
    };
    this._rendered = false;
    this._render();
  }

  // ── HA state updates ──────────────────────────────────────────────────────

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._render();
    this._syncFromHass();
  }

  _syncFromHass() {
    if (!this._hass || !this._rendered) return;
    const s = this._hass.states;
    const c = this._config;

    // Water switch
    if (c.entity_switch && s[c.entity_switch]) {
      const on = s[c.entity_switch].state === "on";
      if (on !== this._waterOn) {
        this._waterOn = on;
        this._updateWaterBtn();
      }
    }

    // Drain
    if (c.entity_drain && s[c.entity_drain]) {
      const st = s[c.entity_drain].state;
      const open = st === "on" || st === "open" || st === "true";
      if (open !== this._drainOpen) {
        this._drainOpen = open;
        this._updateDrainBtn();
      }
    }

    // Temperature
    if (!this._draggingTemp) {
      const tempEnt = c.entity_number_temp || c.entity_temperature;
      if (tempEnt && s[tempEnt]) {
        const v = parseFloat(s[tempEnt].state);
        if (!isNaN(v) && v !== this._tempValue) {
          this._tempValue = v;
          this._updateTempDisplay();
          this._updateTempArc();
        }
      }
    }

    // Flow
    if (!this._draggingFlow) {
      const flowEnt = c.entity_number_flow || c.entity_flow;
      if (flowEnt && s[flowEnt]) {
        const v = parseFloat(s[flowEnt].state);
        if (!isNaN(v) && v !== this._flowValue) {
          this._flowValue = v;
          this._updateFlowDisplay();
          this._updateFlowArc();
        }
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  _render() {
    if (this._rendered) return;
    this._rendered = true;
    const { name } = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        ha-card, .card {
          background: linear-gradient(145deg, #1a1f2e 0%, #0f1318 100%) !important;
          border-radius: 24px !important;
          padding: 24px;
          color: #fff;
          user-select: none;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          overflow: visible;
          position: relative;
          display: flex;
          flex-direction: column;
          container-type: inline-size;
          container-name: uimatic-card;
          ${this._config.card_height != null ? `height: ${typeof this._config.card_height === 'number' ? this._config.card_height + 'px' : this._config.card_height}; box-sizing: border-box;` : ''}
        }

        .header {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 28px;
        }
        .header-title { font-size: 18px; font-weight: 600; color: #e0e8f0; letter-spacing: 0.3px; }
        .status-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #3a4050;
          transition: background 0.4s ease, box-shadow 0.4s ease;
        }
        .status-dot.active { background: #40c4ff; box-shadow: 0 0 10px rgba(64,196,255,0.6); }

        .controls {
          display: flex; gap: 16px; justify-content: center;
          align-items: center;
          flex: 1;
          min-height: 0;
          margin-bottom: 24px;
        }

        .dial-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; flex: 1; }
        .dial-label { font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7a8d; }
        .dial-container {
          position: relative;
          width: clamp(90px, 28cqw, 150px);
          height: clamp(90px, 28cqw, 150px);
          cursor: grab; touch-action: none;
        }
        .dial-container:active { cursor: grabbing; }
        .dial-svg { width: 100%; height: 100%; display: block; }
        .dial-track { fill: none; stroke: #1e2535; stroke-width: 8; stroke-linecap: round; }
        .dial-fill  { fill: none; stroke-width: 8; stroke-linecap: round; }
        .dial-center {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%); text-align: center; pointer-events: none;
        }
        .dial-value { font-size: clamp(16px, 5cqw, 26px); font-weight: 700; color: #e8f0fe; line-height: 1; }
        .dial-unit  { font-size: clamp(8px, 2cqw, 11px); color: #6b7a8d; margin-top: 2px; }



        .water-btn-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .water-btn {
          width: clamp(62px, 18cqw, 92px);
          height: clamp(62px, 18cqw, 92px);
          border-radius: 50%; border: none;
          background: linear-gradient(145deg, #1e2535, #161b27);
          box-shadow: 6px 6px 16px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.03), inset 0 0 0 2px #252d3d;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .water-btn:active { transform: scale(0.94); }
        .water-btn.on {
          background: linear-gradient(145deg, #0d4f7a, #0a3d5e);
          box-shadow: 6px 6px 16px rgba(0,0,0,0.5), inset 0 0 0 2px #1a6fa0, 0 0 22px rgba(64,196,255,0.25);
        }
        .water-btn svg { width: clamp(24px, 7cqw, 34px); height: clamp(24px, 7cqw, 34px); }
        .icon-off { color: #3a4a5c; }
        .water-btn.on .icon-off { display: none; }
        .icon-on { display: none; color: #40c4ff; }
        .water-btn.on .icon-on { display: block; }

        .ripple-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(64,196,255,0.3); pointer-events: none; }
        @keyframes ripple {
          0%   { width: 76px; height: 76px; top: 0; left: 0; opacity: 0.6; }
          100% { width: 140px; height: 140px; top: -32px; left: -32px; opacity: 0; }
        }
        .water-btn.on .ripple-ring { animation: ripple 1.8s ease-out infinite; }
        .water-btn-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7a8d; }

        .bottom-row { display: flex; gap: 10px; justify-content: center; }
        .drain-btn {
          flex: 1; height: 50px; border-radius: 14px; border: none;
          background: linear-gradient(145deg, #1e2535, #161b27);
          box-shadow: 4px 4px 10px rgba(0,0,0,0.4), inset 0 0 0 1.5px #252d3d;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          color: #4a5568; font-size: 12px; font-weight: 500; letter-spacing: 0.3px;
          transition: all 0.3s; font-family: inherit;
        }
        .drain-btn:active { transform: scale(0.97); }
        .drain-btn.open {
          background: linear-gradient(145deg, #1a3a2a, #122a1e);
          box-shadow: 4px 4px 10px rgba(0,0,0,0.4), inset 0 0 0 1.5px #1e5c3a, 0 0 14px rgba(52,211,153,0.2);
          color: #34d399;
        }
        .drain-btn svg { width: 17px; height: 17px; flex-shrink: 0; }

        .toast {
          position: absolute; bottom: 8px; left: 50%;
          transform: translateX(-50%);
          background: rgba(15,20,30,0.95);
          border: 1px solid rgba(64,196,255,0.3);
          border-radius: 10px; padding: 7px 14px;
          font-size: 11px; color: #40c4ff; white-space: nowrap;
          opacity: 0; transition: opacity 0.3s ease;
          pointer-events: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          z-index: 10;
        }
        .toast.show { opacity: 1; }
      </style>

      <div class="card">
        <div class="header">
          <span class="header-title">${name}</span>
          <div class="status-dot" id="statusDot"></div>
        </div>

        <div class="controls">
          <!-- Temperature dial -->
          <div class="dial-wrapper">
            <span class="dial-label">Temperature</span>
            <div class="dial-container" id="tempDial">
              <svg class="dial-svg" viewBox="0 0 110 110">
                <defs>
                  <linearGradient id="tg" x1="100%" y1="0%" x2="0%" y2="0%">
                    <stop offset="0%"   stop-color="#3b82f6"/>
                    <stop offset="50%"  stop-color="#f59e0b"/>
                    <stop offset="100%" stop-color="#ef4444"/>
                  </linearGradient>
                </defs>
                <g transform="rotate(-130 55 55)">
                  <circle class="dial-track" cx="55" cy="55" r="44" stroke-dasharray="199 77"/>
                  <circle class="dial-fill" id="tempArc" cx="55" cy="55" r="44"
                    stroke="url(#tg)" stroke-dasharray="0 276"/>
                </g>
              </svg>
              <div class="dial-center">
                <div class="dial-value" id="tempVal">${this._tempValue}</div>
                <div class="dial-unit">°C</div>
              </div>
            </div>
          </div>

          <!-- Water button -->
          <div class="water-btn-wrapper">
            <button class="water-btn" id="waterBtn" type="button" aria-label="Toggle water">
              <div class="ripple-ring"></div>
              <svg class="icon-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>
              </svg>
              <svg class="icon-on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>
                <path d="M9 18c0 1.7 1.3 3 3 3s3-1.3 3-3"/>
              </svg>
            </button>
            <span class="water-btn-label" id="waterLabel">Water</span>
          </div>

          <!-- Flow dial -->
          <div class="dial-wrapper">
            <span class="dial-label">Flow</span>
            <div class="dial-container" id="flowDial">
              <svg class="dial-svg" viewBox="0 0 110 110">
                <defs>
                  <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#1e40af"/>
                    <stop offset="100%" stop-color="#40c4ff"/>
                  </linearGradient>
                </defs>
                <g transform="rotate(-130 55 55)">
                  <circle class="dial-track" cx="55" cy="55" r="44" stroke-dasharray="199 77"/>
                  <circle class="dial-fill" id="flowArc" cx="55" cy="55" r="44"
                    stroke="url(#fg)" stroke-dasharray="0 276"/>
                </g>
              </svg>
              <div class="dial-center">
                <div class="dial-value" id="flowVal">${this._flowValue}</div>
                <div class="dial-unit">L/min</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Drain -->
        <div class="bottom-row">
          <button class="drain-btn" id="drainBtn" type="button" aria-label="Toggle drain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 5v2M12 17v2M5 12H7M17 12h2M7.05 7.05l1.41 1.41M15.54 15.54l1.41 1.41M7.05 16.95l1.41-1.41M15.54 8.46l1.41-1.41"/>
            </svg>
            <span id="drainLabel">Drain</span>
          </button>
        </div>

        <div class="toast" id="toast"></div>
      </div>
    `;

    this._attachEvents();
    this._updateTempArc();
    this._updateFlowArc();
    this._updateWaterBtn();
    this._updateDrainBtn();
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _attachEvents() {
    const root = this.shadowRoot;
    const waterBtn = root.getElementById("waterBtn");
    const drainBtn = root.getElementById("drainBtn");

    if (waterBtn) waterBtn.addEventListener("click", () => this._toggleWater());
    if (drainBtn) drainBtn.addEventListener("click", () => this._toggleDrain());

    this._attachDial("tempDial", "temp");
    this._attachDial("flowDial", "flow");
  }

  _attachDial(dialId, type) {
    const dial = this.shadowRoot.getElementById(dialId);
    if (!dial) return;

    const ARC = 260;

    const angleFromEvent = (e) => {
      const rect = dial.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      let deg = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      deg = ((deg + 40) % 360 + 360) % 360;
      return Math.min(ARC, Math.max(0, deg));
    };

    const applyAngle = (deg) => {
      const ratio = deg / ARC;
      const { min_temp, max_temp, min_flow, max_flow } = this._config;
      if (type === "temp") {
        this._tempValue = Math.round(min_temp + ratio * (max_temp - min_temp));
        this._updateTempDisplay();
        this._updateTempArc();
      } else {
        this._flowValue = Math.round((min_flow + ratio * (max_flow - min_flow)) * 10) / 10;
        this._updateFlowDisplay();
        this._updateFlowArc();
      }
    };

    dial.addEventListener("pointerdown", (e) => {
      if (type === "temp") this._draggingTemp = true;
      else this._draggingFlow = true;
      dial.setPointerCapture(e.pointerId);
      applyAngle(angleFromEvent(e));
      e.preventDefault();
    });

    dial.addEventListener("pointermove", (e) => {
      const dragging = type === "temp" ? this._draggingTemp : this._draggingFlow;
      if (!dragging) return;
      applyAngle(angleFromEvent(e));
    });

    dial.addEventListener("pointerup", () => {
      const dragging = type === "temp" ? this._draggingTemp : this._draggingFlow;
      if (!dragging) return;
      if (type === "temp") {
        this._draggingTemp = false;
        this._sendTemp();
      } else {
        this._draggingFlow = false;
        this._sendFlow();
      }
    });

    dial.addEventListener("pointercancel", () => {
      if (type === "temp") this._draggingTemp = false;
      else this._draggingFlow = false;
    });
  }

  // ── Arc helpers ───────────────────────────────────────────────────────────

  _setArc(arcId, ratio) {
    const el = this.shadowRoot.getElementById(arcId);
    if (!el) return;
    const CIRC = 2 * Math.PI * 44;
    const filled = Math.max(0, Math.min(1, ratio)) * CIRC;
    const gap    = CIRC - filled + 77;
    el.setAttribute("stroke-dasharray", `${filled.toFixed(2)} ${gap.toFixed(2)}`);
  }

  _tempRatio() {
    const { min_temp, max_temp } = this._config;
    return (this._tempValue - min_temp) / (max_temp - min_temp);
  }

  _flowRatio() {
    const { min_flow, max_flow } = this._config;
    return (this._flowValue - min_flow) / (max_flow - min_flow);
  }

  _updateTempArc() {
    this._setArc("tempArc", this._tempRatio());
  }

  _updateFlowArc() {
    this._setArc("flowArc", this._flowRatio());
  }

  _updateTempDisplay() {
    const el = this.shadowRoot.getElementById("tempVal");
    if (el) el.textContent = this._tempValue;
  }

  _updateFlowDisplay() {
    const el = this.shadowRoot.getElementById("flowVal");
    if (el) el.textContent = this._flowValue;
  }

  _updateWaterBtn() {
    const btn   = this.shadowRoot.getElementById("waterBtn");
    const dot   = this.shadowRoot.getElementById("statusDot");
    const label = this.shadowRoot.getElementById("waterLabel");
    if (btn)   btn.classList.toggle("on", this._waterOn);
    if (dot)   dot.classList.toggle("active", this._waterOn);
    if (label) label.textContent = this._waterOn ? "Running" : "Water";
  }

  _updateDrainBtn() {
    const btn   = this.shadowRoot.getElementById("drainBtn");
    const label = this.shadowRoot.getElementById("drainLabel");
    if (btn)   btn.classList.toggle("open", this._drainOpen);
    if (label) label.textContent = this._drainOpen ? "Drain Open" : "Drain";
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  _slugifyEntityId(entityId) {
    // HA entity_id format: domain.object_id
    // object_id cannot contain dots – they must be replaced with underscores
    if (!entityId || !entityId.includes(".")) return entityId;
    const dotIndex = entityId.indexOf(".");
    const domain = entityId.substring(0, dotIndex);
    const objectId = entityId.substring(dotIndex + 1).replace(/\./g, "_");
    return `${domain}.${objectId}`;
  }

  _callService(domain, service, entityId, serviceData = {}) {
    // Slugify entity_id: replace dots in object_id with underscores
    const safeEntityId = this._slugifyEntityId(entityId);
    this._hass.callService(domain, service, serviceData, { entity_id: safeEntityId });
  }

  _toggleWater() {
    if (!this._hass) { this._toast("HA not connected"); return; }
    const { entity_switch } = this._config;
    if (!entity_switch) { this._toast("No switch entity"); return; }

    const newState = !this._waterOn;
    this._callService("switch", newState ? "turn_on" : "turn_off", entity_switch);
    this._waterOn = newState;
    this._updateWaterBtn();
    this._toast(newState ? "💧 Water ON" : "⏹ Water OFF");
  }

  _toggleDrain() {
    if (!this._hass) { this._toast("HA not connected"); return; }
    const { entity_drain } = this._config;
    if (!entity_drain) { this._toast("No drain entity"); return; }

    const newState = !this._drainOpen;
    this._callService("switch", newState ? "turn_on" : "turn_off", entity_drain);
    this._drainOpen = newState;
    this._updateDrainBtn();
    this._toast(newState ? "🔵 Drain open" : "⚫ Drain closed");
  }

  _sendTemp() {
    if (!this._hass) return;
    const { entity_number_temp } = this._config;
    if (!entity_number_temp) { this._toast("No temp entity"); return; }
    this._callService("number", "set_value", entity_number_temp, { value: this._tempValue });
    this._toast(`🌡 ${this._tempValue}°C`);
  }

  _sendFlow() {
    if (!this._hass) return;
    const { entity_number_flow } = this._config;
    if (!entity_number_flow) { this._toast("No flow entity"); return; }
    this._callService("number", "set_value", entity_number_flow, { value: this._flowValue });
    this._toast(`🌊 ${this._flowValue} L/min`);
  }

  // ── Toast ─────────────────────────────────────────────────────────────────

  _toast(msg) {
    const t = this.shadowRoot.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
  }

  // ── Card metadata ─────────────────────────────────────────────────────────

  getCardSize() { return 4; }

  static getStubConfig() {
    // Check exact entity names in Developer Tools → States (filter by "oblamatik")
    // Entity IDs may contain dots, e.g.: switch.water_flow_192.168.1.36
    return {
      name: "Bath Controller",
      entity_switch:      "switch.water_flow_192.168.1.36",
      entity_temperature: "sensor.temperature_192.168.1.36",
      entity_flow:        "sensor.flow_rate_192.168.1.36",
      entity_drain:       "binary_sensor.bath_drain_192.168.1.36",
      entity_number_temp: "number.temperature_192.168.1.36",
      entity_number_flow: "number.flow_rate_192.168.1.36",
      min_temp: 20, max_temp: 60,
      min_flow: 0,  max_flow: 10,
      // card_height: 400,   // optional – fixed card height: number (px) or CSS string e.g. "50vh"
    };
  }
}

customElements.define("oblamatik-card", OblamatikCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:             "oblamatik-card",
  name:             "UiMatic – Oblamatik Bath Controller",
  description:      "Modern, minimalist bath controller card for Oblamatik / KWC / Viega devices",
  preview:          true,
  documentationURL: "https://github.com/bobsilesia/UiMatic",
});
