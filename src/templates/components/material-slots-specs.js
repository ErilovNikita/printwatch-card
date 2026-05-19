import { html } from 'lit';
import { localize } from '../../utils/localize';

export const materialSlotsSpecsTemplate = (entities) => html`
  <div class="materials-specs">
    <span class="specs-temperature">${entities.ams_temp}</span>
    <span class="specs-humidity">${entities.ams_humidity}</span>
  </div>
`;