const PRINTING_STATES = ['printing', 'running', 'pause'];
const NON_PRINTING_STATES = ['idle', 'offline', 'unknown'];
const PRINTING_PROCESS_STATES = [
  'heatbed_preheating',
  'heating_hotend',
  'checking_extruder_temperature',
  'auto_bed_leveling',
  'scanning_bed_surface',
  'inspecting_first_layer',
  'calibrating_extrusion',
  'calibrating_extrusion_flow'
];

export const isPrinting = (hass, config) => {
  const currentStage = hass.states[config.stage]?.state;
  const printStatus = hass.states[config.status]?.state;
  
  if (PRINTING_STATES.includes(printStatus)) return true;
  if (NON_PRINTING_STATES.includes(currentStage)) return false;
  if (currentStage === 'printing' || (typeof currentStage === 'string' && currentStage.startsWith('paused_'))) return true;
  
  return PRINTING_PROCESS_STATES.includes(currentStage);
};

export const isPaused = (hass, config) => 
  hass.states[config.status]?.state === 'pause';

export const getAmsSlots = (hass, config) => {
  // First, check for explicit external spool configuration
  const externalSpoolEntity = config.external_spool_entity;
  
  // Check if any AMS slot entities are defined and not null
  const amsSlotEntities = [
    config.ams_slot1_entity,
    config.ams_slot2_entity,
    config.ams_slot3_entity,
    config.ams_slot4_entity,
    config.ams_slot5_entity,
    config.ams_slot6_entity,
    config.ams_slot7_entity,
    config.ams_slot8_entity,
    config.ams_slot9_entity,
    config.ams_slot10_entity,
    config.ams_slot11_entity,
    config.ams_slot12_entity,
    config.ams_slot13_entity,
    config.ams_slot14_entity,
    config.ams_slot15_entity,
    config.ams_slot16_entity
  ].filter(entity => entity != null && entity.trim() !== '');

  // If external spool is defined and has a valid state, use it
  if (externalSpoolEntity) {
    const externalSpool = hass.states[externalSpoolEntity];
    if (externalSpool?.state && externalSpool.state !== 'unknown') {
      return [{
        type: externalSpool.state || 'External Spool',
        color: externalSpool.attributes?.color || '#E0E0E0',
        empty: false,
        name: externalSpool.attributes?.name || 'External Spool',
        active: true
      }];
    }
  }

  // If no AMS slot entities are defined, return empty array
  if (amsSlotEntities.length === 0) {
    return [];
  }

  // Process AMS slots if they exist
  const processedSlots = amsSlotEntities
    .map(entity => {
      const state = hass.states[entity];
      if (!state) return null;
      
      return {
        type: state.state || 'Empty',
        color: state.attributes?.color || '#E0E0E0',
        empty: state.attributes?.empty || false,
        active: state.attributes?.active || false,
        name: state.attributes?.name || 'Unknown'
      };
    })
    .filter(Boolean);

  return processedSlots.length > 0 ? processedSlots : [];
};

const getLastPrintName = (hass, config) => {
  const printStatus = hass.states[config.status]?.state;
  const taskName = hass.states[config.model.name]?.state;
  
  return ['idle', 'finish'].includes(printStatus) && 
         taskName && 
         !['unavailable', 'unknown'].includes(taskName) 
    ? taskName 
    : null;
};

export const showElement = (hass, config) => {
  const getState = (configValue, defaultValue = true) => {
    if (configValue === undefined || configValue === null) return defaultValue;
    const norm = String(configValue).trim().toLowerCase();
    if (norm === '' || norm === 'null' || norm === 'undefined') return defaultValue;
    return ['true', '1', 'yes'].includes(norm);
  };

  // Guard access to config.show (may be undefined)
  const show = config?.show || {};

  return {
    title: getState(show.title),
    camera: getState(show.camera),
    control: getState(show.control),
    ams_slots: getState(show.ams_slots)
  };
}

export const getEntityStates = (hass, config) => {
  const getState = (entity, defaultValue = '0') => 
    hass.states[entity]?.state || defaultValue;

  // Guard access
  const control = config?.control || {};
  const camera = config?.camera || {};
  const layers = config?.layers || {};
  const temperature = config?.temperature || {};
  const model = config?.model || {};

  return {
    name: config.title || 'Unnamed Printer',

    status: getState(config.status, 'idle'),
    currentStage: getState(config.stage, 'unknown'),

    progress: parseFloat(getState(config.progress)),
    remainingTime: parseInt(parseFloat(getState(config.remaining_time)) * 60),

    speedProfile: getState(config.speed_profile, 'standard'),
    speed_profile: config.speed_profile,

    isPrinting: isPrinting(hass, config),
    isPaused: isPaused(hass, config),

    resume_button: control.resume_button,
    pause_button: control.pause_button,
    stop_button: control.stop_button,
    chamber_light_entity: control.chamber_light,
    aux_fan_entity: control.fan && hass.states[control.fan] ? control.fan : null,

    camera_entity: camera.entity,

    currentLayer: parseInt(getState(layers.current_layer)),
    totalLayers: parseInt(getState(layers.total_layers)),

    bed_temp_entity: temperature.bed,
    nozzle_temp_entity: temperature.nozzle,
    bed_target_temp_entity: temperature.bed_number,
    nozzle_target_temp_entity: temperature.nozzle_number,
    bed_temp: parseFloat(getState(temperature.bed)),
    nozzle_temp: parseFloat(getState(temperature.nozzle)),

    cover_image_entity: model.preview,
    print_weight_entity: parseInt(getState(model.weight)),
    print_length_entity: parseInt(getState(model.length)),
    taskName: getState(model.name, 'No active print'),
    lastPrintName: getLastPrintName(hass, config)
  };
};