/**
 * UiMatic – Oblamatik Lovelace Card v0.5.0
 * Modern, minimalist bath controller UI for Home Assistant
 * https://github.com/bobsilesia/UiMatic
 *
 * Layouts:
 *   layout: "classic"  – arc dial knobs (default, backward compatible)
 *   layout: "modern"   – iOS-style drum pickers (flat scroll wheel)
 */

class OblamatikCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config     = {};
    this._hass       = null;
    this._flowValue  = 0;
    this._tempValue  = 38;
    this._waterOn    = false;
    this._drainOpen  = true;   // default: drain is OPEN (flood-safe)
    // classic
    this._draggingFlow = false;
    this._draggingTemp = false;
    // modern pickers
    this._tempPicker = null;
    this._flowPicker = null;
    this._rendered   = false;
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
      min_temp:           config.min_temp            != null ? config.min_temp : 10,
      max_temp:           config.max_temp            != null ? config.max_temp : 45,
      min_flow:           config.min_flow            != null ? config.min_flow : 0,
      max_flow:           config.max_flow            != null ? config.max_flow : 10,
      card_height:        config.card_height         != null ? config.card_height : null,
      layout:             config.layout === "modern" ? "modern" : "classic",
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
      if (on !== this._waterOn) { this._waterOn = on; this._updateWaterBtn(); }
    }

    // Drain
    if (c.entity_drain && s[c.entity_drain]) {
      const st   = s[c.entity_drain].state;
      const open = st === "on" || st === "open" || st === "true";
      if (open !== this._drainOpen) { this._drainOpen = open; this._updateDrainBtn(); }
    }

    // Temperature
    const notDraggingTemp = c.layout === "modern" ? true : !this._draggingTemp;
    if (notDraggingTemp) {
      const tempEnt = c.entity_number_temp || c.entity_temperature;
      if (tempEnt && s[tempEnt]) {
        const v = parseFloat(s[tempEnt].state);
        if (!isNaN(v) && v !== this._tempValue) {
          this._tempValue = v;
          if (c.layout === "modern") this._tempPicker && this._tempPicker.snapToValue(v);
          else { this._updateTempDisplay(); this._updateTempArc(); }
        }
      }
    }

    // Flow
    const notDraggingFlow = c.layout === "modern" ? true : !this._draggingFlow;
    if (notDraggingFlow) {
      const flowEnt = c.entity_number_flow || c.entity_flow;
      if (flowEnt && s[flowEnt]) {
        const v = parseFloat(s[flowEnt].state);
        if (!isNaN(v) && v !== this._flowValue) {
          this._flowValue = v;
          if (c.layout === "modern") this._flowPicker && this._flowPicker.snapToValue(v);
          else { this._updateFlowDisplay(); this._updateFlowArc(); }
        }
      }
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  _render() {
    if (this._rendered) return;
    this._rendered = true;
    const c = this._config;

    this.shadowRoot.innerHTML = `
      <style>
        ${this._baseCSS()}
        ${c.layout === "modern" ? this._modernCSS() : this._classicCSS()}
      </style>
      <div class="card">
        <div class="header">
          <span class="header-title">${c.name}</span>
          <div class="status-dot" id="statusDot"></div>
        </div>

        <div class="controls">
          ${c.layout === "modern" ? this._modernHTML() : this._classicHTML()}
        </div>

        <div class="bottom-row">
          <button class="water-wide-btn" id="waterWideBtn" type="button" aria-label="Toggle water">
            <div class="ripple-ring"></div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2C6 8 4 12 4 15a8 8 0 0016 0c0-3-2-7-8-13z"/>
              <path d="M9 18c0 1.7 1.3 3 3 3s3-1.3 3-3"/>
            </svg>
            <span id="waterWideLabel">Water</span>
          </button>
        </div>

        <div class="toast" id="toast"></div>
      </div>
    `;

    this._attachEvents();

    if (c.layout === "modern") {
      this._initPickers();
    } else {
      this._updateTempArc();
      this._updateFlowArc();
    }
    this._updateWaterBtn();
    this._updateDrainBtn();
  }

  // ── Base CSS (shared) ─────────────────────────────────────────────────────

  _baseCSS() {
    const { card_height } = this._config;
    const heightRule = card_height != null
      ? `height: ${typeof card_height === "number" ? card_height + "px" : card_height}; box-sizing: border-box;`
      : "";
    return `
      :host { display: block; font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }

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
        ${heightRule}
      }

      .header {
        display: flex; align-items: center;
        justify-content: space-between; margin-bottom: 28px;
      }
      .header-title { font-size: 18px; font-weight: 600; color: #6b7a8d; letter-spacing: 0.3px; }
      .status-dot {
        width: 8px; height: 8px; border-radius: 50%; background: #3a4050;
        transition: background 0.4s ease, box-shadow 0.4s ease;
      }
      .status-dot.active { background: #40c4ff; box-shadow: 0 0 10px rgba(64,196,255,0.6); }

      .controls {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; flex: 1; min-height: 0; margin-bottom: 20px;
      }

      /* ── Drain round button – neumorphic ── */
      .drain-round-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
      .drain-round-btn {
        width: clamp(46px, 13.5cqw, 66px); height: clamp(46px, 13.5cqw, 66px);
        border-radius: 50%; border: none;
        background: #1a1f2e;
        box-shadow: -4px -4px 9px rgba(255,255,255,0.05), 5px 5px 13px rgba(0,0,0,0.65);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: box-shadow 0.25s ease, color 0.25s ease;
        color: #3a4a5e;
      }
      .drain-round-btn:active {
        box-shadow: inset -2px -2px 5px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.65);
      }
      .drain-round-btn.closed {
        color: #40c4ff;
        box-shadow: inset -2px -2px 5px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.65), 0 0 10px rgba(64,196,255,0.18);
      }
      .drain-round-btn svg { width: clamp(18px, 5.3cqw, 24px); height: clamp(18px, 5.3cqw, 24px); }
      .drain-round-label { font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7a8d; }

      /* ── Water wide button – neumorphic pill / Bottom row ── */
      .bottom-row { display: flex; gap: 10px; }
      .water-wide-btn {
        flex: 1; height: 50px; border-radius: 25px; border: none;
        background: #1a1f2e;
        box-shadow: -4px -4px 9px rgba(255,255,255,0.05), 5px 5px 13px rgba(0,0,0,0.65);
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
        color: #4a5568; font-size: 12px; font-weight: 500; letter-spacing: 0.3px;
        transition: box-shadow 0.3s ease, color 0.3s ease; font-family: inherit;
        position: relative; overflow: hidden;
      }
      .water-wide-btn:active {
        box-shadow: inset -2px -2px 5px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.65);
      }
      .water-wide-btn.on {
        box-shadow: inset -2px -2px 5px rgba(255,255,255,0.04), inset 3px 3px 8px rgba(0,0,0,0.65), 0 0 14px rgba(64,196,255,0.2);
        color: #40c4ff;
      }
      .water-wide-btn svg { width: 17px; height: 17px; flex-shrink: 0; }
      .water-wide-btn .ripple-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(64,196,255,0.25); pointer-events: none; }
      @keyframes rippleWide {
        0%   { width: 40px; height: 40px; top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0.6; }
        100% { width: 220px; height: 220px; top: 50%; left: 50%; transform: translate(-50%,-50%); opacity: 0; }
      }
      .water-wide-btn.on .ripple-ring { animation: rippleWide 2s ease-out infinite; }

      /* ── Toast (shared) ── */
      .toast {
        position: absolute; bottom: 8px; left: 50%;
        transform: translateX(-50%);
        background: rgba(15,20,30,0.95);
        border: 1px solid rgba(64,196,255,0.3);
        border-radius: 10px; padding: 7px 14px;
        font-size: 11px; color: #40c4ff; white-space: nowrap;
        opacity: 0; transition: opacity 0.3s ease;
        pointer-events: none; box-shadow: 0 4px 20px rgba(0,0,0,0.4); z-index: 10;
      }
      .toast.show { opacity: 1; }
    `;
  }

  // ── Classic CSS ───────────────────────────────────────────────────────────

  _classicCSS() {
    return `
      .dial-wrapper { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; min-width: 0; }
      .dial-label { font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7a8d; white-space: nowrap; }
      .dial-container {
        position: relative;
        width: clamp(80px, 24cqw, 130px); height: clamp(80px, 24cqw, 130px);
        cursor: grab; touch-action: none; flex-shrink: 0;
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
    `;
  }

  // ── Classic HTML ──────────────────────────────────────────────────────────

  _classicHTML() {
    return `
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

      ${this._waterBtnHTML()}

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
    `;
  }

  // ── Modern CSS ────────────────────────────────────────────────────────────

  _modernCSS() {
    return `
      .picker-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; }
      .picker-label { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.4px; color: #6b7a8d; }
      .picker {
        position: relative; width: 100%; height: 160px;
        overflow: hidden; cursor: ns-resize; touch-action: none;
        border-radius: 16px; background: #141820; border: 1px solid #1e2535;
      }
      .picker::before, .picker::after {
        content: ''; position: absolute; left: 0; right: 0; height: 50px; z-index: 2; pointer-events: none;
      }
      .picker::before { top: 0; background: linear-gradient(to bottom, #141820 0%, transparent 100%); }
      .picker::after  { bottom: 0; background: linear-gradient(to top, #141820 0%, transparent 100%); }
      .picker-line {
        position: absolute; left: 16px; right: 16px; height: 1px;
        background: #2a3550; z-index: 3; pointer-events: none;
      }
      .picker-line-top    { top: calc(50% - 22px); }
      .picker-line-bottom { top: calc(50% + 22px); }
      .picker-list {
        position: absolute; top: 0; left: 0; right: 0;
        display: flex; flex-direction: column; align-items: center;
        will-change: transform;
      }
      .picker-item {
        height: 44px; display: flex; align-items: center; justify-content: center;
        width: 100%; font-weight: 700; color: #242c3d; font-size: 16px;
        transition: color 0.12s, font-size 0.12s; pointer-events: none; flex-shrink: 0;
      }
      .picker-item.near   { color: #4a5a72; font-size: 19px; }
      .picker-item.active { color: #e8f0fe; font-size: 30px; }
      /* temp color tinting */
      .picker-temp .picker-item.active.cold { color: #60a5fa; }
      .picker-temp .picker-item.active.warm { color: #f59e0b; }
      .picker-temp .picker-item.active.hot  { color: #ef4444; }
      .picker-unit { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 1.2px; color: #6b7a8d; }
    `;
  }

  // ── Modern HTML ───────────────────────────────────────────────────────────

  _modernHTML() {
    return `
      <div class="picker-wrapper">
        <span class="picker-label">Temperature</span>
        <div class="picker picker-temp" id="tempPicker">
          <div class="picker-line picker-line-top"></div>
          <div class="picker-line picker-line-bottom"></div>
          <div class="picker-list" id="tempList"></div>
        </div>
        <span class="picker-unit">°C</span>
      </div>

      ${this._waterBtnHTML()}

      <div class="picker-wrapper">
        <span class="picker-label">Flow</span>
        <div class="picker" id="flowPicker">
          <div class="picker-line picker-line-top"></div>
          <div class="picker-line picker-line-bottom"></div>
          <div class="picker-list" id="flowList"></div>
        </div>
        <span class="picker-unit">L/min</span>
      </div>
    `;
  }

  // ── Drain round button HTML (center) ─────────────────────────────────────

  _waterBtnHTML() {
    return `
      <div class="drain-round-wrapper">
        <button class="drain-round-btn" id="drainRoundBtn" type="button" aria-label="Toggle drain">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="12" r="9"/>
            <line x1="5"   y1="9"    x2="19"   y2="9"/>
            <line x1="3.3" y1="11.5" x2="20.7" y2="11.5"/>
            <line x1="3.3" y1="14"   x2="20.7" y2="14"/>
            <line x1="5"   y1="16.5" x2="19"   y2="16.5"/>
          </svg>
        </button>
        <span class="drain-round-label" id="drainRoundLabel">Drain Open</span>
      </div>
    `;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _attachEvents() {
    const root          = this.shadowRoot;
    const waterWideBtn  = root.getElementById("waterWideBtn");
    const drainRoundBtn = root.getElementById("drainRoundBtn");
    if (waterWideBtn)  waterWideBtn.addEventListener("click",  () => this._toggleWater());
    if (drainRoundBtn) drainRoundBtn.addEventListener("click", () => this._toggleDrain());

    if (this._config.layout === "modern") {
      // pickers are set up after render in _initPickers()
    } else {
      this._attachDial("tempDial", "temp");
      this._attachDial("flowDial", "flow");
    }
  }

  // ── Classic: dial drag ────────────────────────────────────────────────────

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
      if (type === "temp") this._draggingTemp = true; else this._draggingFlow = true;
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
      if (type === "temp") { this._draggingTemp = false; this._sendTemp(); }
      else { this._draggingFlow = false; this._sendFlow(); }
    });
    dial.addEventListener("pointercancel", () => {
      if (type === "temp") this._draggingTemp = false; else this._draggingFlow = false;
    });
  }

  // ── Classic: arc helpers ──────────────────────────────────────────────────

  _setArc(arcId, ratio) {
    const el = this.shadowRoot.getElementById(arcId);
    if (!el) return;
    const CIRC   = 2 * Math.PI * 44;
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
  _updateTempArc()     { this._setArc("tempArc", this._tempRatio()); }
  _updateFlowArc()     { this._setArc("flowArc", this._flowRatio()); }
  _updateTempDisplay() {
    const el = this.shadowRoot.getElementById("tempVal");
    if (el) el.textContent = this._tempValue;
  }
  _updateFlowDisplay() {
    const el = this.shadowRoot.getElementById("flowVal");
    if (el) el.textContent = this._flowValue;
  }

  // ── Modern: drum pickers ──────────────────────────────────────────────────

  _buildValues(min, max, step) {
    const vals = [];
    for (let v = min; v <= max + 0.001; v = Math.round((v + step) * 1000) / 1000) {
      vals.push(Math.round(v * 100) / 100);
    }
    return vals;
  }

  _tempColorClass(v) {
    if (v < 30) return "cold";
    if (v < 42) return "warm";
    return "hot";
  }

  _initPickers() {
    const c    = this._config;
    const TEMP = this._buildValues(c.min_temp, c.max_temp, 1);
    const FLOW = this._buildValues(c.min_flow, c.max_flow, 0.5);

    const self = this;

    function populateList(listEl, vals, colorFn) {
      const PAD = 2;
      for (let i = 0; i < PAD; i++) {
        const d = document.createElement("div"); d.className = "picker-item"; listEl.appendChild(d);
      }
      vals.forEach((v, i) => {
        const d = document.createElement("div");
        d.className = "picker-item";
        d.dataset.idx = i;
        if (colorFn) d.dataset.color = colorFn(v);
        d.textContent = v % 1 === 0 ? String(v) : v.toFixed(1);
        listEl.appendChild(d);
      });
      for (let i = 0; i < PAD; i++) {
        const d = document.createElement("div"); d.className = "picker-item"; listEl.appendChild(d);
      }
    }

    const tempList = this.shadowRoot.getElementById("tempList");
    const flowList = this.shadowRoot.getElementById("flowList");
    populateList(tempList, TEMP, v => this._tempColorClass(v));
    populateList(flowList, FLOW, null);

    const makePicker = (pickerId, listId, vals, initVal, onSet, onCommit) => {
      const picker = this.shadowRoot.getElementById(pickerId);
      const list   = this.shadowRoot.getElementById(listId);
      const ITEM_H = 44, PAD = 2, H = 160;

      let currentOffset = 0, dragging = false, startY = 0, startIdx = 0;

      const idxToOffset  = idx => H / 2 - (PAD + idx) * ITEM_H - ITEM_H / 2;
      const offsetToIdx  = off => {
        const raw = (H / 2 - off - ITEM_H / 2) / ITEM_H - PAD;
        return Math.round(Math.max(0, Math.min(vals.length - 1, raw)));
      };

      const updateHighlight = idx => {
        list.querySelectorAll(".picker-item[data-idx]").forEach(el => {
          const i = parseInt(el.dataset.idx);
          el.classList.remove("active", "near", "cold", "warm", "hot");
          if (i === idx) {
            el.classList.add("active");
            if (el.dataset.color) el.classList.add(el.dataset.color);
          } else if (Math.abs(i - idx) === 1) {
            el.classList.add("near");
          }
        });
      };

      const applyOffset = (offset, animate) => {
        list.style.transition = animate ? "transform 0.2s ease-out" : "none";
        list.style.transform  = `translateY(${offset}px)`;
        currentOffset = offset;
        updateHighlight(offsetToIdx(offset));
      };

      const snapToIdx = idx => {
        const clamped = Math.max(0, Math.min(vals.length - 1, idx));
        applyOffset(idxToOffset(clamped), true);
        onSet(vals[clamped]);
        return clamped;
      };

      const snapToValue = val => {
        const idx = vals.findIndex(v => Math.abs(v - val) < 0.001);
        if (idx >= 0) snapToIdx(idx);
      };

      // init
      const initIdx = vals.findIndex(v => Math.abs(v - initVal) < 0.001);
      applyOffset(idxToOffset(Math.max(0, initIdx)), false);

      picker.addEventListener("pointerdown", e => {
        dragging = true; startY = e.clientY; startIdx = offsetToIdx(currentOffset);
        list.style.transition = "none";
        picker.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      picker.addEventListener("pointermove", e => {
        if (!dragging) return;
        const dy = e.clientY - startY;
        const newOff = idxToOffset(startIdx) + dy;
        const minOff = idxToOffset(vals.length - 1), maxOff = idxToOffset(0);
        applyOffset(Math.max(minOff, Math.min(maxOff, newOff)), false);
      });
      picker.addEventListener("pointerup", () => {
        if (!dragging) return; dragging = false;
        const idx = snapToIdx(offsetToIdx(currentOffset));
        onCommit(vals[idx]);
      });
      picker.addEventListener("pointercancel", () => { dragging = false; snapToIdx(offsetToIdx(currentOffset)); });

      return { snapToValue };
    };

    this._tempPicker = makePicker(
      "tempPicker", "tempList", TEMP, this._tempValue,
      v => { this._tempValue = v; },
      v => { this._sendTemp(); this._toast(`🌡 ${v}°C`); }
    );
    this._flowPicker = makePicker(
      "flowPicker", "flowList", FLOW, this._flowValue,
      v => { this._flowValue = v; },
      v => { this._sendFlow(); this._toast(`🌊 ${v} L/min`); }
    );
  }

  // ── Shared update helpers ─────────────────────────────────────────────────

  _updateWaterBtn() {
    const btn   = this.shadowRoot.getElementById("waterWideBtn");
    const dot   = this.shadowRoot.getElementById("statusDot");
    const label = this.shadowRoot.getElementById("waterWideLabel");
    if (btn)   btn.classList.toggle("on", this._waterOn);
    if (dot)   dot.classList.toggle("active", this._waterOn);
    if (label) label.textContent = this._waterOn ? "Running" : "Water";
  }

  _updateDrainBtn() {
    const btn   = this.shadowRoot.getElementById("drainRoundBtn");
    const label = this.shadowRoot.getElementById("drainRoundLabel");
    if (btn)   btn.classList.toggle("closed", !this._drainOpen);
    if (label) label.textContent = this._drainOpen ? "Drain Open" : "Drain Closed";
  }

  // ── Commands ──────────────────────────────────────────────────────────────

  _slugifyEntityId(entityId) {
    if (!entityId || !entityId.includes(".")) return entityId;
    const dot    = entityId.indexOf(".");
    const domain = entityId.substring(0, dot);
    const obj    = entityId.substring(dot + 1).replace(/\./g, "_");
    return `${domain}.${obj}`;
  }

  _callService(domain, service, entityId, serviceData = {}) {
    const safe = this._slugifyEntityId(entityId);
    this._hass.callService(domain, service, serviceData, { entity_id: safe });
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
  }

  _sendFlow() {
    if (!this._hass) return;
    const { entity_number_flow } = this._config;
    if (!entity_number_flow) { this._toast("No flow entity"); return; }
    this._callService("number", "set_value", entity_number_flow, { value: this._flowValue });
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
    return {
      name: "Bath Controller",
      entity_switch:      "switch.water_flow_192.168.1.36",
      entity_temperature: "sensor.temperature_192.168.1.36",
      entity_flow:        "sensor.flow_rate_192.168.1.36",
      entity_drain:       "binary_sensor.bath_drain_192.168.1.36",
      entity_number_temp: "number.temperature_192.168.1.36",
      entity_number_flow: "number.flow_rate_192.168.1.36",
      min_temp: 10, max_temp: 45,
      min_flow: 0,  max_flow: 10,
      layout: "classic",           // "classic" (arc dials) | "modern" (drum pickers)
      // card_height: 400,          // optional – fixed card height: number (px) or CSS string e.g. "50vh"
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
