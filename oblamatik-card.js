/**
 * UiMatic – Oblamatik Lovelace Card
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
  }

  setConfig(config) {
    if (!config.entity_flow && !config.host) {
      throw new Error("UiMatic: Please define entity_flow or host");
    }
    this._config = {
      host: config.host || null,
      port: config.port || 80,
      entity_flow: config.entity_flow || null,
      entity_temperature: config.entity_temperature || null,
      entity_switch: config.entity_switch || null,
      entity_drain: config.entity_drain || null,
      entity_number_temp: config.entity_number_temp || null,
      entity_number_flow: config.entity_number_flow || null,
      min_temp: config.min_temp || 20,
      max_temp: config.max_temp || 60,
      min_flow: config.min_flow || 0,
      max_flow: config.max_flow || 20,
      name: config.name || "Bath Controller",
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._updateFromHass();
  }

  _updateFromHass() {
    if (!this._hass || !this._config) return;

    const { entity_flow, entity_temperature, entity_switch, entity_drain } = this._config;

    if (entity_switch) {
      const sw = this._hass.states[entity_switch];
      if (sw) {
        const newWaterOn = sw.state === "on";
        if (newWaterOn !== this._waterOn) {
          this._waterOn = newWaterOn;
          this._updateWaterButton();
          this._updateRipple();
        }
      }
    }

    if (entity_drain) {
      const dr = this._hass.states[entity_drain];
      if (dr) {
        const newDrain = dr.state === "on" || dr.state === "open" || dr.state === "true";
        if (newDrain !== this._drainOpen) {
          this._drainOpen = newDrain;
          this._updateDrainButton();
        }
      }
    }

    if (entity_temperature && !this._draggingTemp) {
      const te = this._hass.states[entity_temperature];
      if (te) {
        const val = parseFloat(te.state);
        if (!isNaN(val)) {
          this._tempValue = val;
          this._updateTempDisplay();
          this._updateTempArc();
        }
      }
    }

    if (entity_flow && !this._draggingFlow) {
      const fl = this._hass.states[entity_flow];
      if (fl) {
        const val = parseFloat(fl.state);
        if (!isNaN(val)) {
          this._flowValue = val;
          this._updateFlowDisplay();
          this._updateFlowArc();
        }
      }
    }
  }

  _render() {
    const { name, min_temp, max_temp, min_flow, max_flow } = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        }

        .card {
          background: linear-gradient(145deg, #1a1f2e 0%, #0f1318 100%);
          border-radius: 24px;
          padding: 24px;
          color: #ffffff;
          user-select: none;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
          overflow: hidden;
          position: relative;
        }

        .card::before {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(64,196,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
        }

        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: #e0e8f0;
          letter-spacing: 0.3px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #3a4050;
          transition: background 0.4s ease, box-shadow 0.4s ease;
        }

        .status-dot.active {
          background: #40c4ff;
          box-shadow: 0 0 10px rgba(64,196,255,0.6);
        }

        /* Controls row */
        .controls {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-bottom: 28px;
        }

        /* Arc dial */
        .dial-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .dial-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #6b7a8d;
        }

        .dial-container {
          position: relative;
          width: 120px;
          height: 120px;
          cursor: pointer;
          touch-action: none;
        }

        .dial-svg {
          width: 120px;
          height: 120px;
          transform: rotate(-220deg);
        }

        .dial-track {
          fill: none;
          stroke: #1e2535;
          stroke-width: 8;
          stroke-linecap: round;
        }

        .dial-fill-temp {
          fill: none;
          stroke: url(#tempGradient);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.15s ease;
        }

        .dial-fill-flow {
          fill: none;
          stroke: url(#flowGradient);
          stroke-width: 8;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.15s ease;
        }

        .dial-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          pointer-events: none;
        }

        .dial-value {
          font-size: 22px;
          font-weight: 700;
          color: #e8f0fe;
          line-height: 1;
        }

        .dial-unit {
          font-size: 10px;
          color: #6b7a8d;
          margin-top: 2px;
        }

        /* Main water button */
        .water-btn-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .water-btn {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #1e2535, #161b27);
          box-shadow:
            6px 6px 16px rgba(0,0,0,0.5),
            -4px -4px 12px rgba(255,255,255,0.03),
            inset 0 0 0 2px #252d3d;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          margin-top: 20px;
        }

        .water-btn:active {
          transform: scale(0.95);
        }

        .water-btn.on {
          background: linear-gradient(145deg, #0d4f7a, #0a3d5e);
          box-shadow:
            6px 6px 16px rgba(0,0,0,0.5),
            -4px -4px 12px rgba(64,196,255,0.1),
            inset 0 0 0 2px #1a6fa0,
            0 0 20px rgba(64,196,255,0.2);
        }

        .water-btn svg {
          width: 32px;
          height: 32px;
          transition: all 0.3s ease;
        }

        .water-btn .icon-off { color: #3a4a5c; }
        .water-btn.on .icon-off { display: none; }
        .water-btn .icon-on { display: none; color: #40c4ff; }
        .water-btn.on .icon-on { display: block; }

        .water-btn-label {
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: #6b7a8d;
        }

        /* Ripple animation */
        .ripple-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(64,196,255,0.3);
          animation: none;
          pointer-events: none;
        }

        @keyframes ripple {
          0% { width: 80px; height: 80px; top: 0; left: 0; opacity: 0.6; }
          100% { width: 140px; height: 140px; top: -30px; left: -30px; opacity: 0; }
        }

        .water-btn.on .ripple-ring {
          animation: ripple 1.8s ease-out infinite;
        }

        /* Bottom row */
        .bottom-row {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        /* Drain button */
        .drain-btn {
          flex: 1;
          max-width: 160px;
          height: 52px;
          border-radius: 16px;
          border: none;
          background: linear-gradient(145deg, #1e2535, #161b27);
          box-shadow:
            4px 4px 10px rgba(0,0,0,0.4),
            -2px -2px 8px rgba(255,255,255,0.02),
            inset 0 0 0 1.5px #252d3d;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #4a5568;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
        }

        .drain-btn:active {
          transform: scale(0.97);
        }

        .drain-btn.open {
          background: linear-gradient(145deg, #1a3a2a, #122a1e);
          box-shadow:
            4px 4px 10px rgba(0,0,0,0.4),
            -2px -2px 8px rgba(52,211,153,0.08),
            inset 0 0 0 1.5px #1e5c3a,
            0 0 14px rgba(52,211,153,0.15);
          color: #34d399;
        }

        .drain-btn svg {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        /* Temp indicator bar */
        .temp-bar {
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: linear-gradient(90deg, #3b82f6 0%, #f59e0b 50%, #ef4444 100%);
          margin-top: 6px;
          opacity: 0.4;
          position: relative;
        }

        .temp-bar-indicator {
          position: absolute;
          top: -3px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 6px rgba(255,255,255,0.5);
          transform: translateX(-50%);
          transition: left 0.15s ease;
        }

        /* Notification toast */
        .toast {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%) translateY(60px);
          background: rgba(64,196,255,0.15);
          border: 1px solid rgba(64,196,255,0.3);
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 12px;
          color: #40c4ff;
          white-space: nowrap;
          transition: transform 0.3s ease;
          pointer-events: none;
        }

        .toast.show {
          transform: translateX(-50%) translateY(0);
        }
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
              <svg class="dial-svg" viewBox="0 0 120 120" id="tempSvg">
                <defs>
                  <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#3b82f6"/>
                    <stop offset="50%" style="stop-color:#f59e0b"/>
                    <stop offset="100%" style="stop-color:#ef4444"/>
                  </linearGradient>
                </defs>
                <circle class="dial-track" cx="60" cy="60" r="48"
                  stroke-dasharray="263" stroke-dashoffset="0"/>
                <circle class="dial-fill-temp" id="tempArc" cx="60" cy="60" r="48"
                  stroke-dasharray="263" stroke-dashoffset="263"/>
              </svg>
              <div class="dial-center">
                <div class="dial-value" id="tempValue">${this._tempValue}</div>
                <div class="dial-unit">°C</div>
              </div>
            </div>
            <div class="temp-bar">
              <div class="temp-bar-indicator" id="tempBarIndicator"></div>
            </div>
          </div>

          <!-- Water ON/OFF button -->
          <div class="water-btn-wrapper">
            <button class="water-btn" id="waterBtn" aria-label="Toggle water">
              <div class="ripple-ring"></div>
              <!-- OFF icon -->
              <svg class="icon-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>
              </svg>
              <!-- ON icon -->
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
              <svg class="dial-svg" viewBox="0 0 120 120" id="flowSvg">
                <defs>
                  <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#1e40af"/>
                    <stop offset="100%" style="stop-color:#40c4ff"/>
                  </linearGradient>
                </defs>
                <circle class="dial-track" cx="60" cy="60" r="48"
                  stroke-dasharray="263" stroke-dashoffset="0"/>
                <circle class="dial-fill-flow" id="flowArc" cx="60" cy="60" r="48"
                  stroke-dasharray="263" stroke-dashoffset="263"/>
              </svg>
              <div class="dial-center">
                <div class="dial-value" id="flowValue">${this._flowValue}</div>
                <div class="dial-unit">L/min</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom: Drain button -->
        <div class="bottom-row">
          <button class="drain-btn" id="drainBtn" aria-label="Toggle drain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
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
    this._updateWaterButton();
    this._updateDrainButton();
  }

  _attachEvents() {
    const root = this.shadowRoot;

    // Water button
    root.getElementById("waterBtn").addEventListener("click", () => {
      this._toggleWater();
    });

    // Drain button
    root.getElementById("drainBtn").addEventListener("click", () => {
      this._toggleDrain();
    });

    // Temperature dial – mouse + touch
    this._attachDialEvents("tempDial", "temp");

    // Flow dial – mouse + touch
    this._attachDialEvents("flowDial", "flow");
  }

  _attachDialEvents(dialId, type) {
    const root = this.shadowRoot;
    const dial = root.getElementById(dialId);
    if (!dial) return;

    let isDragging = false;

    const getAngle = (e) => {
      const rect = dial.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      let angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
      // Normalize: arc starts at -220deg (bottom-left), ends at +40deg (bottom-right)
      // Total arc = 260 degrees
      angle = angle + 220; // shift so 0 = start of arc
      if (angle < 0) angle += 360;
      if (angle > 360) angle -= 360;
      return Math.min(260, Math.max(0, angle));
    };

    const updateValue = (e) => {
      const angle = getAngle(e);
      const ratio = angle / 260;
      if (type === "temp") {
        const { min_temp, max_temp } = this._config;
        this._tempValue = Math.round(min_temp + ratio * (max_temp - min_temp));
        this._updateTempDisplay();
        this._updateTempArc();
      } else {
        const { min_flow, max_flow } = this._config;
        this._flowValue = Math.round((min_flow + ratio * (max_flow - min_flow)) * 10) / 10;
        this._updateFlowDisplay();
        this._updateFlowArc();
      }
    };

    const onStart = (e) => {
      isDragging = true;
      if (type === "temp") this._draggingTemp = true;
      else this._draggingFlow = true;
      e.preventDefault();
      updateValue(e);
    };

    const onMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      updateValue(e);
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      if (type === "temp") {
        this._draggingTemp = false;
        this._sendTempCommand();
      } else {
        this._draggingFlow = false;
        this._sendFlowCommand();
      }
    };

    dial.addEventListener("mousedown", onStart);
    dial.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);
  }

  // ── Arc calculations ──────────────────────────────────────────────────────

  _calcDashOffset(value, min, max) {
    const total = 263; // circumference of r=48 arc (2*PI*48 ≈ 301, but we use 263 for 260° arc)
    const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return total - ratio * total;
  }

  _updateTempArc() {
    const arc = this.shadowRoot.getElementById("tempArc");
    if (!arc) return;
    const { min_temp, max_temp } = this._config;
    arc.style.strokeDashoffset = this._calcDashOffset(this._tempValue, min_temp, max_temp);

    // Update temp bar indicator
    const indicator = this.shadowRoot.getElementById("tempBarIndicator");
    if (indicator) {
      const ratio = (this._tempValue - min_temp) / (max_temp - min_temp);
      indicator.style.left = `${ratio * 100}%`;
    }
  }

  _updateFlowArc() {
    const arc = this.shadowRoot.getElementById("flowArc");
    if (!arc) return;
    const { min_flow, max_flow } = this._config;
    arc.style.strokeDashoffset = this._calcDashOffset(this._flowValue, min_flow, max_flow);
  }

  _updateTempDisplay() {
    const el = this.shadowRoot.getElementById("tempValue");
    if (el) el.textContent = this._tempValue;
  }

  _updateFlowDisplay() {
    const el = this.shadowRoot.getElementById("flowValue");
    if (el) el.textContent = this._flowValue;
  }

  _updateWaterButton() {
    const btn = this.shadowRoot.getElementById("waterBtn");
    const dot = this.shadowRoot.getElementById("statusDot");
    const label = this.shadowRoot.getElementById("waterLabel");
    if (btn) btn.classList.toggle("on", this._waterOn);
    if (dot) dot.classList.toggle("active", this._waterOn);
    if (label) label.textContent = this._waterOn ? "Running" : "Water";
  }

  _updateDrainButton() {
    const btn = this.shadowRoot.getElementById("drainBtn");
    const label = this.shadowRoot.getElementById("drainLabel");
    if (btn) btn.classList.toggle("open", this._drainOpen);
    if (label) label.textContent = this._drainOpen ? "Drain Open" : "Drain";
  }

  _updateRipple() {
    // Ripple is CSS-driven via .on class
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  _toggleWater() {
    this._waterOn = !this._waterOn;
    this._updateWaterButton();
    this._updateRipple();

    const { entity_switch } = this._config;
    if (entity_switch && this._hass) {
      this._hass.callService("switch", this._waterOn ? "turn_on" : "turn_off", {
        entity_id: entity_switch,
      });
    } else {
      this._callDeviceApi(this._waterOn ? "start" : "stop");
    }
    this._showToast(this._waterOn ? "Water started" : "Water stopped");
  }

  _toggleDrain() {
    this._drainOpen = !this._drainOpen;
    this._updateDrainButton();

    const { entity_drain } = this._config;
    if (entity_drain && this._hass) {
      this._hass.callService("switch", this._drainOpen ? "turn_on" : "turn_off", {
        entity_id: entity_drain,
      });
    } else {
      this._callDeviceApi(this._drainOpen ? "drain_open" : "drain_close");
    }
    this._showToast(this._drainOpen ? "Drain opened" : "Drain closed");
  }

  _sendTempCommand() {
    const { entity_number_temp } = this._config;
    if (entity_number_temp && this._hass) {
      this._hass.callService("number", "set_value", {
        entity_id: entity_number_temp,
        value: this._tempValue,
      });
    } else {
      this._callDeviceApi("set_temp", { temp: this._tempValue });
    }
    this._showToast(`Temperature → ${this._tempValue}°C`);
  }

  _sendFlowCommand() {
    const { entity_number_flow } = this._config;
    if (entity_number_flow && this._hass) {
      this._hass.callService("number", "set_value", {
        entity_id: entity_number_flow,
        value: this._flowValue,
      });
    } else {
      this._callDeviceApi("set_flow", { flow: this._flowValue });
    }
    this._showToast(`Flow → ${this._flowValue} L/min`);
  }

  async _callDeviceApi(action, params = {}) {
    const { host, port } = this._config;
    if (!host) return;
    const base = `http://${host}:${port}`;
    try {
      const actionMap = {
        start: { url: `${base}/api/tlc/1/`, method: "POST", body: { state: "b" } },
        stop: { url: `${base}/api/tlc/1/`, method: "POST", body: { state: "a" } },
        set_temp: { url: `${base}/api/tlc/1/`, method: "POST", body: { required_temp: params.temp } },
        set_flow: { url: `${base}/api/tlc/1/`, method: "POST", body: { required_flow: params.flow } },
        drain_open: { url: `${base}/api/tlc/1/`, method: "POST", body: { popup: true } },
        drain_close: { url: `${base}/api/tlc/1/`, method: "POST", body: { popup: false } },
      };
      const req = actionMap[action];
      if (!req) return;
      await fetch(req.url, {
        method: req.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
      });
    } catch (e) {
      console.warn("UiMatic API error:", e);
    }
  }

  _showToast(msg) {
    const toast = this.shadowRoot.getElementById("toast");
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove("show"), 2000);
  }

  // ── Card size hint ────────────────────────────────────────────────────────

  getCardSize() {
    return 4;
  }

  static getConfigElement() {
    return document.createElement("oblamatik-card-editor");
  }

  static getStubConfig() {
    return {
      name: "Bath Controller",
      entity_switch: "switch.oblamatik_water_flow",
      entity_temperature: "sensor.oblamatik_temperature",
      entity_flow: "sensor.oblamatik_flow_rate",
      entity_drain: "switch.oblamatik_drain",
      entity_number_temp: "number.oblamatik_temperature",
      entity_number_flow: "number.oblamatik_flow",
      min_temp: 20,
      max_temp: 60,
      min_flow: 0,
      max_flow: 20,
    };
  }
}

customElements.define("oblamatik-card", OblamatikCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "oblamatik-card",
  name: "UiMatic – Oblamatik Bath Controller",
  description: "Modern, minimalist bath controller card for Oblamatik / KWC / Viega devices",
  preview: true,
  documentationURL: "https://github.com/bobsilesia/UiMatic",
});
