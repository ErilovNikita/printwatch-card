import { LitElement, html, css } from "lit";
import { localize } from "../utils/localize";
import {
  PRINTER_PRESETS,
  getPreset,
  mergePresetWithCustom,
} from "../constants/printer-presets";
import {
  discoverDeviceEntities,
  getAvailableDevices,
} from "../utils/device-discovery";

class PrintwatchCardEditor extends LitElement {
  static properties = {
    hass: { type: Object },
    _config: { state: true },
    _selectedPreset: { state: true },
    _selectedDevice: { state: true },
    _expandedSections: { state: true },
    _availableDevices: { state: true },
  };

  static styles = css`
    :host {
      display: block;
    }

    .section {
      margin-bottom: 24px;
      border-radius: 12px;
      background: var(--card-background-color);
      box-shadow: var(--ha-card-box-shadow);
      padding: 16px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--primary-text-color);
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .section-title-icon {
      display: inline-block;
      margin-right: 8px;
      transition: transform 0.2s;
    }

    .section-title-icon.collapsed {
      transform: rotate(-90deg);
    }

    .section-content {
      max-height: 1000px;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .section-content.collapsed {
      max-height: 0;
    }

    ha-textfield,
    ha-entity-picker,
    ha-select {
      display: block;
      margin-bottom: 16px;
    }

    .hint {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: -8px;
      margin-bottom: 12px;
    }

    .entity-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .optional-badge {
      font-size: 11px;
      color: var(--secondary-text-color);
      font-weight: 500;
      margin-left: 8px;
    }

    .preset-info {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-bottom: 12px;
      padding: 8px;
      background: var(--card-background-color);
      border-left: 3px solid var(--primary-color);
      border-radius: 4px;
    }

    .field-row {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      margin-bottom: 16px;
    }

    .field-row ha-entity-picker,
    .field-row ha-textfield {
      flex: 1;
      margin-bottom: 0;
    }

    .reset-button {
      padding: 8px 12px;
      background: var(--mdc-theme-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .reset-button:hover {
      background: var(--mdc-theme-primary-dark);
    }

    .device-section {
      margin-bottom: 24px;
      padding: 16px;
      background: var(--card-background-color);
      border-radius: 12px;
      box-shadow: var(--ha-card-box-shadow);
    }

    .device-discovery-info {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-bottom: 12px;
      padding: 8px;
      background: var(--primary-color, #1976d2);
      color: white;
      border-radius: 4px;
      line-height: 1.5;
    }

    .discovered-entities {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 12px;
      padding: 8px;
      background: var(--background-color);
      border-left: 3px solid var(--primary-color);
      border-radius: 4px;
    }
  `;

  constructor() {
    super();
    this._expandedSections = {
      general: true,
      camera: true,
      control: false,
      model: false,
      temperature: false,
      filament: false,
      visibility: false,
    };
    this._selectedDevice = null;
    this._availableDevices = [];
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    this._selectedPreset = config?.printer_preset || "custom";
    this._selectedDevice = config?.device_id || null;
    this._updateAvailableDevices();
  }

  _updateAvailableDevices() {
    if (!this.hass) return;
    this._availableDevices = getAvailableDevices(this.hass.devices, [
      "bambu_lab",
      "elegoo_printer",
    ]);
  }

  _onDeviceSelected(deviceId) {
    this._selectedDevice = deviceId;

    if (!deviceId) {
      // Clear device from config
      const newConfig = { ...this._config };
      delete newConfig.device_id;
      this._config = newConfig;
      this._fireConfigChanged(newConfig);
      return;
    }

    // Discover entities from device
    const discoveredConfig = discoverDeviceEntities(
      deviceId,
      this.hass.devices,
      this.hass.states
    );

    if (discoveredConfig) {
      const newConfig = {
        ...this._config,
        device_id: deviceId,
        ...discoveredConfig,
      };
      this._config = newConfig;
      this._fireConfigChanged(newConfig);
    }
  }

  _fireConfigChanged(config) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  _updateKey(key, value) {
    const newConfig = { ...this._config, [key]: value };
    if (key === "printer_preset") {
      this._selectedPreset = value;
      // When switching presets, merge the preset entities with any existing custom overrides
      const preset = getPreset(value);
      const customOverrides = this._extractCustomOverrides();
      const mergedEntities = mergePresetWithCustom(value, customOverrides);

      // Flatten the merged entities into the config
      Object.keys(mergedEntities).forEach((category) => {
        if (typeof mergedEntities[category] === "object") {
          newConfig[category] = mergedEntities[category];
        }
      });
    }
    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _updateNested(path, value) {
    const newConfig = structuredClone(this._config || {});
    let target = newConfig;

    if (typeof path === "string" && path) path = path.split(".");

    for (let i = 0; i < path.length - 1; i++) {
      target[path[i]] = target[path[i]] ?? {};
      target = target[path[i]];
    }

    target[path[path.length - 1]] = value;

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _toggleSection(sectionName) {
    this._expandedSections = {
      ...this._expandedSections,
      [sectionName]: !this._expandedSections[sectionName],
    };
    this.requestUpdate();
  }

  _extractCustomOverrides() {
    // Extract only the fields that differ from the current preset
    const customOverrides = {};
    const currentPreset = getPreset(this._selectedPreset || "custom");
    const config = this._config || {};

    Object.keys(currentPreset.entities).forEach((category) => {
      const presetCategoryEntities = currentPreset.entities[category];
      const configCategoryEntities = config[category] || {};

      Object.keys(presetCategoryEntities).forEach((field) => {
        const presetValue = presetCategoryEntities[field];
        const configValue = configCategoryEntities[field];

        if (JSON.stringify(presetValue) !== JSON.stringify(configValue)) {
          if (!customOverrides[category]) {
            customOverrides[category] = {};
          }
          customOverrides[category][field] = configValue;
        }
      });
    });

    return customOverrides;
  }

  _resetToPreset() {
    const preset = getPreset(this._selectedPreset || "custom");
    const newConfig = {
      ...this._config,
      title: this._config.title || "My Printer",
    };

    // Copy preset entities into config
    Object.keys(preset.entities).forEach((category) => {
      newConfig[category] = structuredClone(preset.entities[category]);
    });

    this._config = newConfig;
    this._fireConfigChanged(newConfig);
  }

  _renderSectionTitle(titleKey, sectionName, optionalCount = 0) {
    const isCollapsed = !this._expandedSections[sectionName];
    return html`
      <div
        class="section-title"
        @click=${() => this._toggleSection(sectionName)}
      >
        <span class="section-title-icon ${isCollapsed ? "collapsed" : ""}"
          >▼</span
        >
        ${localize.e(titleKey)}
        ${optionalCount > 0
          ? html`<span class="optional-badge"
              >${optionalCount} ${localize.e("editor.optional")}</span
            >`
          : ""}
      </div>
    `;
  }

  _renderCollapsibleContent(content) {
    const isCollapsed = !this._expandedSections[arguments[1]];
    return html`
      <div class="section-content ${isCollapsed ? "collapsed" : ""}">
        ${content}
      </div>
    `;
  }

  render() {
    const config = this._config || {};
    const generalConfig = config.general || {};
    const cameraConfig = config.camera || {};
    const controlConfig = config.control || {};
    const layersConfig = config.layers || {};
    const temperatureConfig = config.temperature || {};
    const modelConfig = config.model || {};
    const filamentConfig = config.filament || {};
    const showConfig = config.show || {};
    const currentPreset = getPreset(this._selectedPreset || "custom");

    return html`
      <!-- Device Discovery Section -->
      <div class="device-section">
        <div class="section-title">
          ${localize.e("editor.device_discovery")}
        </div>
        <div class="device-discovery-info">
          💡 ${localize.e("editor.device_discovery_hint")}
        </div>

        <ha-device-picker
          label="${localize.e("editor.select_printer_device")}"
          .hass=${this.hass}
          .value=${this._selectedDevice || ""}
          .filter=${(device) => {
            if (!device.identifiers) return false;
            for (const identifier of device.identifiers) {
              const [integration] = identifier;
              if (
                integration === "bambu_lab" ||
                integration === "elegoo_printer"
              ) {
                return true;
              }
            }
            return false;
          }}
          @value-changed=${(e) => this._onDeviceSelected(e.detail.value)}
        ></ha-device-picker>

        ${this._selectedDevice && config.general?.status
          ? html`
              <div class="discovered-entities">
                ✓ ${localize.e("editor.entities_discovered")}
                <br />
                ${config.general.status
                  ? html`Status: <code>${config.general.status}</code><br />`
                  : ""}
                ${config.general.progress
                  ? html`Progress: <code>${config.general.progress}</code
                      ><br />`
                  : ""}
                ${config.camera?.entity
                  ? html`Camera: <code>${config.camera.entity}</code>`
                  : ""}
              </div>
            `
          : ""}
      </div>

      <div class="section">
        <div class="section-title">
          ${localize.e("editor.preset_selection")}
        </div>
        <ha-select
          label="${localize.e("editor.printer_model")}"
          .value=${this._selectedPreset || "custom"}
          @change=${(e) => this._updateKey("printer_preset", e.target.value)}
        >
          ${Object.entries(PRINTER_PRESETS).map(
            ([id, preset]) => html`
              <mwc-list-item value="${id}">${preset.name}</mwc-list-item>
            `
          )}
        </ha-select>
        <div class="preset-info">${currentPreset.description}</div>
        <button class="reset-button" @click=${() => this._resetToPreset()}>
          ${localize.e("editor.reset_to_preset")}
        </button>
      </div>

      <!-- Title Section -->
      <div class="section">
        <div class="section-title">${localize.e("general.label")}</div>
        <ha-textfield
          label="${localize.e("general.title")}"
          .value=${config.title || ""}
          @input=${(e) =>
            this._updateKey("title", e.detail.value ?? e.target.value)}
        ></ha-textfield>
      </div>

      <!-- General Section -->
      <div class="section">
        ${this._renderSectionTitle("general.label", "general", 1)}
        <div
          class="section-content ${!this._expandedSections["general"]
            ? "collapsed"
            : ""}"
        >
          <ha-entity-picker
            label="${localize.e("general.status")}"
            .hass=${this.hass}
            .value=${generalConfig.status || ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "general.status",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("general.stage")}"
            .hass=${this.hass}
            .value=${generalConfig.stage || ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "general.stage",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("general.progress")}"
            .hass=${this.hass}
            .value=${generalConfig.progress || ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "general.progress",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("general.remaining_time")}"
            .hass=${this.hass}
            .value=${generalConfig.remaining_time || ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "general.remaining_time",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("general.speed_profile")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${generalConfig.speed_profile || ""}
            .includeDomains=${["select"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "general.speed_profile",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>
        </div>
      </div>

      <!-- Camera Section -->
      <div class="section">
        ${this._renderSectionTitle("camera.label", "camera")}
        <div
          class="section-content ${!this._expandedSections["camera"]
            ? "collapsed"
            : ""}"
        >
          <ha-entity-picker
            label="${localize.e("camera.entity")}"
            .hass=${this.hass}
            .value=${cameraConfig.entity ?? ""}
            .includeDomains=${["camera", "image"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "camera.entity",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>
          <div class="hint">${localize.e("camera.hint.entity")}</div>

          <ha-textfield
            label="${localize.e("camera.refresh_rate")}"
            type="number"
            .value=${cameraConfig.refresh_rate ?? "1000"}
            @input=${(e) =>
              this._updateNested(
                "camera.refresh_rate",
                parseInt(e.detail.value ?? e.target.value) || 1000
              )}
          ></ha-textfield>
          <div class="hint">${localize.e("camera.hint.refresh_rate")}</div>
        </div>
      </div>

      <!-- Control Section -->
      <div class="section">
        ${this._renderSectionTitle("control.label", "control", 2)}
        <div
          class="section-content ${!this._expandedSections["control"]
            ? "collapsed"
            : ""}"
        >
          <ha-entity-picker
            label="${localize.e("control.resume")}"
            .hass=${this.hass}
            .value=${controlConfig.resume_button ?? ""}
            .includeDomains=${["button"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "control.resume_button",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("control.pause")}"
            .hass=${this.hass}
            .value=${controlConfig.pause_button ?? ""}
            .includeDomains=${["button"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "control.pause_button",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("control.stop")}"
            .hass=${this.hass}
            .value=${controlConfig.stop_button ?? ""}
            .includeDomains=${["button"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "control.stop_button",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("additional.chamber_light")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${controlConfig.chamber_light ?? ""}
            .includeDomains=${["switch", "light"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "control.chamber_light",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("additional.fan")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${controlConfig.fan ?? ""}
            .includeDomains=${["fan"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "control.fan",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>
        </div>
      </div>

      <!-- Model Section -->
      <div class="section">
        ${this._renderSectionTitle("model.label", "model", 3)}
        <div
          class="section-content ${!this._expandedSections["model"]
            ? "collapsed"
            : ""}"
        >
          <ha-entity-picker
            label="${localize.e("model.name")}"
            .hass=${this.hass}
            .value=${modelConfig.name ?? ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "model.name",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("model.preview")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${modelConfig.preview ?? ""}
            .includeDomains=${["image"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "model.preview",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("model.length")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${modelConfig.length ?? ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "model.length",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("model.weight")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${modelConfig.weight ?? ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "model.weight",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>
        </div>
      </div>

      <!-- Temperature Section -->
      <div class="section">
        ${this._renderSectionTitle("temperature.label", "temperature", 2)}
        <div
          class="section-content ${!this._expandedSections["temperature"]
            ? "collapsed"
            : ""}"
        >
          <ha-entity-picker
            label="${localize.e("temperature.bed")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${temperatureConfig.bed ?? ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "temperature.bed",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("temperature.bed_number")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${temperatureConfig.bed_number ?? ""}
            .includeDomains=${["number"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "temperature.bed_number",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("temperature.nozzle")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${temperatureConfig.nozzle ?? ""}
            .includeDomains=${["sensor"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "temperature.nozzle",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>

          <ha-entity-picker
            label="${localize.e("temperature.nozzle_number")} (${localize.e(
              "editor.optional"
            )})"
            .hass=${this.hass}
            .value=${temperatureConfig.nozzle_number ?? ""}
            .includeDomains=${["number"]}
            allow-custom-entity
            @value-changed=${(e) =>
              this._updateNested(
                "temperature.nozzle_number",
                e.detail.value ?? e.target.value
              )}
          ></ha-entity-picker>
        </div>
      </div>

      <!-- Filament Section -->
      <div class="section">
        ${this._renderSectionTitle("filament.label", "filament")}
        <div
          class="section-content ${!this._expandedSections["filament"]
            ? "collapsed"
            : ""}"
        >
          <ha-form
            .hass=${this.hass}
            label="${localize.e("filament.spools")}"
            .data=${config}
            .schema=${[
              {
                name: "filament",
                label: false,
                selector: {
                  entity: {
                    domain: "sensor",
                    multiple: true,
                  },
                },
              },
            ]}
            @value-changed=${(e) => {
              const newCfg = {
                ...this._config,
                filament: { ams_slots: e.detail.value?.filament || [] },
              };
              this._config = newCfg;
              this._fireConfigChanged(newCfg);
            }}
          ></ha-form>
          <div class="hint">${localize.e("editor.filament_hint")}</div>
        </div>
      </div>

      <!-- Visibility Section -->
      <div class="section">
        ${this._renderSectionTitle("editor.visibility", "visibility")}
        <div
          class="section-content ${!this._expandedSections["visibility"]
            ? "collapsed"
            : ""}"
        >
          <div style="margin-bottom: 12px;">
            <ha-checkbox
              ?checked=${showConfig.title !== false}
              @change=${(e) =>
                this._updateNested("show.title", e.target.checked)}
            ></ha-checkbox>
            <label>${localize.e("editor.show_title")}</label>
          </div>
          <div style="margin-bottom: 12px;">
            <ha-checkbox
              ?checked=${showConfig.camera !== false}
              @change=${(e) =>
                this._updateNested("show.camera", e.target.checked)}
            ></ha-checkbox>
            <label>${localize.e("editor.show_camera")}</label>
          </div>
          <div style="margin-bottom: 12px;">
            <ha-checkbox
              ?checked=${showConfig.control !== false}
              @change=${(e) =>
                this._updateNested("show.control", e.target.checked)}
            ></ha-checkbox>
            <label>${localize.e("editor.show_control")}</label>
          </div>
          <div style="margin-bottom: 12px;">
            <ha-checkbox
              ?checked=${showConfig.ams_slots !== false}
              @change=${(e) =>
                this._updateNested("show.ams_slots", e.target.checked)}
            ></ha-checkbox>
            <label>${localize.e("editor.show_filament")}</label>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("printwatch-card-editor", PrintwatchCardEditor);
