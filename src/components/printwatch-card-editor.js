import { LitElement, html, css } from 'lit';

class PrintwatchCardEditor extends LitElement {
    static properties = {
        hass: { type: Object },
        _config: { state: true }
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
        }

        .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--primary-text-color);
        }

        ha-textfield,
        ha-entity-picker {
            display: block;
            margin-bottom: 16px;
        }

        .hint {
            font-size: 12px;
            color: var(--secondary-text-color);
            margin-top: -8px;
            margin-bottom: 12px;
        }
    `;

    setConfig(config) {
        this._config = { ...(config || {}) };
    }

    _fireConfigChanged(config) {
        this.dispatchEvent(
            new CustomEvent('config-changed', {
                detail: { config },
                bubbles: true,
                composed: true
            })
        );
    }

    _updateKey(key, value) {
        const newConfig = { ...this._config, [key]: value };
        this._config = newConfig;
        this._fireConfigChanged(newConfig);
    }

    _updateNested(path, value) {
        const newConfig = structuredClone(this._config || {});
        let target = newConfig;

        if (typeof path === 'string' && path) path = path.split('.');

        for (let i = 0; i < path.length - 1; i++) {
            target[path[i]] = target[path[i]] ?? {};
            target = target[path[i]];
        }

        target[path[path.length - 1]] = value;

        this._config = newConfig;
        this._fireConfigChanged(newConfig);
    }

    render() {
        const config = this._config || {};
        const cameraConfig = this._config?.camera || {};
        const controlConfig = this._config?.control || {};
        const layersConfig = this._config?.layers || {};
        const temperatureConfig = this._config?.temperature || {};
        const modelConfig = this._config?.model || {};
        const amsConfig = this._config?.ams_slots || [];

        return html`
            <div class="section">
                <div class="section-title">Основная информация</div>

                <ha-textfield
                    label="Название"
                    .value=${config.title || ''}
                    @input=${e => this._updateKey('title', e.detail.value ?? e.target.value)}
                ></ha-textfield>

                <ha-entity-picker
                    label="Статус принтера"
                    .hass=${this.hass}
                    .value=${config.status || ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateKey('status', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Этап печати"
                    .hass=${this.hass}
                    .value=${config.stage || ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateKey('stage', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Прогресс печати"
                    .hass=${this.hass}
                    .value=${config.progress || ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateKey('progress', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Остаток времени печати"
                    .hass=${this.hass}
                    .value=${config.remaining_time || ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateKey('remaining_time', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Профиль скорости печати"
                    .hass=${this.hass}
                    .value=${config.speed_profile || ''}
                    .includeDomains=${['select']}
                    allow-custom-entity
                    @value-changed=${e => this._updateKey('speed_profile', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

            </div>

            <div class="section">
                <div class="section-title">Камера</div>

                <ha-entity-picker
                    label="Камера"
                    .hass=${this.hass}
                    .value=${cameraConfig.entity ?? ''}
                    .includeDomains=${['camera', 'image']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('camera.entity', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>
                <div class="hint">Используется для отображения в реальном времени</div>

                <ha-textfield
                    label="Частота обновления камеры (в секундах)"
                    .value=${cameraConfig.refresh_rate ?? '1000'}
                    @input=${e => this._updateNested('camera.refresh_rate', e.detail.value ?? e.target.value)}
                ></ha-textfield>
            </div>

            <div class="section">
                <div class="section-title">Управление</div>

                <ha-entity-picker
                    label="Пуск печати"
                    .hass=${this.hass}
                    .value=${controlConfig.resume_button ?? ''}
                    .includeDomains=${['button']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('control.resume_button', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Пауза печати"
                    .hass=${this.hass}
                    .value=${controlConfig.pause_button ?? ''}
                    .includeDomains=${['button']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('control.pause_button', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Остановка печати"
                    .hass=${this.hass}
                    .value=${controlConfig.stop_button ?? ''}
                    .includeDomains=${['button']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('control.stop_button', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>
                
            </div>

            <div class="section">
                <div class="section-title">Слои</div>

                <ha-entity-picker
                    label="Текущий слой"
                    .hass=${this.hass}
                    .value=${layersConfig.current_layer ?? ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('layers.current_layer', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Общее кол-во слоев"
                    .hass=${this.hass}
                    .value=${layersConfig.total_layers ?? ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('layers.total_layers', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>
                
            </div>

            <div class="section">
                <div class="section-title">Модель</div>

                <ha-entity-picker
                    label="Название"
                    .hass=${this.hass}
                    .value=${modelConfig.name ?? ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('model.name', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Превью"
                    .hass=${this.hass}
                    .value=${modelConfig.preview ?? ''}
                    .includeDomains=${['image']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('model.preview', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Длинна"
                    .hass=${this.hass}
                    .value=${modelConfig.length ?? ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('model.length', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Вес"
                    .hass=${this.hass}
                    .value=${modelConfig.weight ?? ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('model.weight', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>
                
            </div>

            <div class="section">
                <div class="section-title">Температура</div>

                <ha-entity-picker
                    label="Стол"
                    .hass=${this.hass}
                    .value=${temperatureConfig.bed ?? ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('temperature.bed', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Управление столом"
                    .hass=${this.hass}
                    .value=${temperatureConfig.bed_number ?? ''}
                    .includeDomains=${['number']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('temperature.bed_number', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Споло"
                    .hass=${this.hass}
                    .value=${temperatureConfig.nozzle ?? ''}
                    .includeDomains=${['sensor']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('temperature.nozzle', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Управление соплом"
                    .hass=${this.hass}
                    .value=${temperatureConfig.nozzle_number ?? ''}
                    .includeDomains=${['number']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('temperature.nozzle_number', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>
                
            </div>

            <div class="section">
                <div class="section-title">Филамент</div>

                <ha-form
                    .hass=${this.hass}
                    label="Катушки"
                    .data=${config}
                    .schema=${[
                        {
                            name: 'ams_slots',
                            label: false,
                            selector: {
                                entity: {
                                    domain: 'sensor',
                                    multiple: true
                                }
                            }
                        }
                    ]}
                    @value-changed=${e => {
                        this._config = e.detail.value;
                        this._fireConfigChanged(this._config);
                    }}
                ></ha-form>
            </div>

            <div class="section">
                <div class="section-title">Дополнительно</div>

                <ha-entity-picker
                    label="Освещение камеры"
                    .hass=${this.hass}
                    .value=${controlConfig.chamber_light ?? ''}
                    .includeDomains=${['switch', 'light']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('control.chamber_light', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>

                <ha-entity-picker
                    label="Вентилятор"
                    .hass=${this.hass}
                    .value=${controlConfig.fan ?? ''}
                    .includeDomains=${['fan']}
                    allow-custom-entity
                    @value-changed=${e => this._updateNested('control.fan', e.detail.value ?? e.target.value)}
                ></ha-entity-picker>
                
            </div>
            `;
    }
}

customElements.define('printwatch-card-editor', PrintwatchCardEditor);