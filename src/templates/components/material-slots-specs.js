import { html } from 'lit';
import { localize } from '../../utils/localize';

export const materialSlotsSpecsTemplate = (entities) => 
  html`
    <div class="materials-specs">
      ${entities.ams_temp? html`<div class="specs-item">
        <div class="value">
          ${entities.ams_temp}°C
        </div>
        <div>${localize.t('materials.temperature')}</div>
      </div>` : ''}
      ${entities.ams_humidity ? html`<div class="specs-item">
        <div class="value">
          ${entities.ams_humidity}%
        </div>
        <div>${localize.t('materials.humidity')}</div>
      </div>` : ''}
    </div>
  `