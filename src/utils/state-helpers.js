const PRINTING_STATES = ["printing", "running", "pause"];
const NON_PRINTING_STATES = ["idle", "offline", "unknown"];
const PRINTING_PROCESS_STATES = [
  "heatbed_preheating",
  "heating_hotend",
  "checking_extruder_temperature",
  "auto_bed_leveling",
  "scanning_bed_surface",
  "inspecting_first_layer",
  "calibrating_extrusion",
  "calibrating_extrusion_flow",
];

/**
 * Get entity ID from config with fallback support
 * Config can be either string or object with 'entity' property
 */
const getEntityId = (configValue) => {
  if (typeof configValue === "string") return configValue;
  if (typeof configValue === "object" && configValue?.entity)
    return configValue.entity;
  return null;
};

export const isPrinting = (hass, config) => {
  const general = config.general || config;
  const stageEntityId = getEntityId(general.stage);
  const statusEntityId = getEntityId(general.status);

  const currentStage = stageEntityId ? hass.states[stageEntityId]?.state : null;
  const printStatus = statusEntityId
    ? hass.states[statusEntityId]?.state
    : null;

  if (PRINTING_STATES.includes(printStatus)) return true;
  if (NON_PRINTING_STATES.includes(currentStage)) return false;
  if (
    currentStage === "printing" ||
    (typeof currentStage === "string" && currentStage.startsWith("paused_"))
  )
    return true;

  return PRINTING_PROCESS_STATES.includes(currentStage);
};

export const isPaused = (hass, config) => {
  const general = config.general || config;
  const statusEntityId = getEntityId(general.status);
  return statusEntityId
    ? hass.states[statusEntityId]?.state === "pause"
    : false;
};

export const getAmsSlots = (hass, config) => {
  // Support both nested (config.filament.ams_slots) and flat (config.ams_slots) structures
  let amsSlotEntities = config.filament?.ams_slots || config.ams_slots || [];

  if (!Array.isArray(amsSlotEntities)) {
    return [];
  }

  // Build list of AMS slot entity ids
  const processedEntities = amsSlotEntities
    .map((item) => {
      if (!item && item !== 0) return null;
      if (typeof item === "string") return item.trim();
      if (typeof item === "object" && item.entity)
        return String(item.entity).trim();
      return null;
    })
    .filter((e) => e && e !== "");

  if (processedEntities.length === 0) {
    return [];
  }

  // Process AMS slots if they exist
  const processedSlots = processedEntities
    .map((entityId) => {
      const state = hass.states[entityId];
      if (!state) return null;

      return {
        type: state.state || "Empty",
        color: state.attributes?.color || "#E0E0E0",
        empty: !!state.attributes?.empty,
        active: !!state.attributes?.active,
        name:
          state.attributes?.name ||
          state.attributes?.friendly_name ||
          "Unknown",
        entity: entityId,
      };
    })
    .filter(Boolean);

  return processedSlots.length > 0 ? processedSlots : [];
};

const getLastPrintName = (hass, config) => {
  const general = config.general || config;
  const model = config.model || config;

  const statusEntityId = getEntityId(general.status);
  const modelNameEntityId = getEntityId(model.name);

  const printStatus = statusEntityId
    ? hass.states[statusEntityId]?.state
    : null;
  const taskName = modelNameEntityId
    ? hass.states[modelNameEntityId]?.state
    : null;

  return ["idle", "finish"].includes(printStatus) &&
    taskName &&
    !["unavailable", "unknown"].includes(taskName)
    ? taskName
    : null;
};

export const showElement = (hass, config) => {
  const getState = (configValue, defaultValue = true) => {
    if (configValue === undefined || configValue === null) return defaultValue;
    const norm = String(configValue).trim().toLowerCase();
    if (norm === "" || norm === "null" || norm === "undefined")
      return defaultValue;
    return ["true", "1", "yes"].includes(norm);
  };

  // Guard access to config.show (may be undefined)
  const show = config?.show || {};

  return {
    title: getState(show.title),
    camera: getState(show.camera),
    control: getState(show.control),
    ams_slots: getState(show.ams_slots),
  };
};

export const getEntityStates = (hass, config) => {
  // Extract configuration sections (support both nested and flat structures)
  const general = config.general || config;
  const control = config.control || config;
  const camera = config.camera || config;
  const layers = config.layers || config;
  const temperature = config.temperature || config;
  const model = config.model || config;

  const getState = (entity, defaultValue = "0") => {
    const entityId = getEntityId(entity);
    return entityId
      ? hass.states[entityId]?.state || defaultValue
      : defaultValue;
  };

  // Get entity IDs
  const statusId = getEntityId(general.status);
  const stageId = getEntityId(general.stage);
  const progressId = getEntityId(general.progress);
  const remainingTimeId = getEntityId(general.remaining_time);
  const speedProfileId = getEntityId(general.speed_profile);
  const cameraId = getEntityId(camera.entity);
  const currentLayerId = getEntityId(layers.current_layer);
  const totalLayersId = getEntityId(layers.total_layers);
  const bedTempId = getEntityId(temperature.bed);
  const nozzleTempId = getEntityId(temperature.nozzle);
  const bedTargetTempId = getEntityId(temperature.bed_number);
  const nozzleTargetTempId = getEntityId(temperature.nozzle_number);
  const modelNameId = getEntityId(model.name);
  const modelPreviewId = getEntityId(model.preview);
  const modelWeightId = getEntityId(model.weight);
  const modelLengthId = getEntityId(model.length);

  return {
    name: config.title || "Unnamed Printer",

    status: statusId ? hass.states[statusId]?.state || "idle" : "idle",
    currentStage: stageId
      ? hass.states[stageId]?.state || "unknown"
      : "unknown",

    progress: parseFloat(getState(progressId)),
    remainingTime: remainingTimeId
      ? parseInt(parseFloat(getState(remainingTimeId)) * 60)
      : 0,

    speedProfile: speedProfileId
      ? getState(speedProfileId, "standard")
      : "standard",
    speed_profile: speedProfileId,

    isPrinting: isPrinting(hass, config),
    isPaused: isPaused(hass, config),

    resume_button: getEntityId(control.resume_button),
    pause_button: getEntityId(control.pause_button),
    stop_button: getEntityId(control.stop_button),
    chamber_light_entity: getEntityId(control.chamber_light),
    aux_fan_entity:
      getEntityId(control.fan) && hass.states[getEntityId(control.fan)]
        ? getEntityId(control.fan)
        : null,

    camera_entity: cameraId,

    currentLayer: currentLayerId ? parseInt(getState(currentLayerId)) : 0,
    totalLayers: totalLayersId ? parseInt(getState(totalLayerId)) : 0,

    bed_temp_entity: bedTempId,
    nozzle_temp_entity: nozzleTempId,
    bed_target_temp_entity: bedTargetTempId,
    nozzle_target_temp_entity: nozzleTargetTempId,
    bed_temp: bedTempId ? parseFloat(getState(bedTempId)) : 0,
    nozzle_temp: nozzleTempId ? parseFloat(getState(nozzleTempId)) : 0,

    cover_image_entity: modelPreviewId,
    print_weight_entity: modelWeightId ? parseInt(getState(modelWeightId)) : 0,
    print_length_entity: modelLengthId ? parseInt(getState(modelLengthId)) : 0,
    taskName: modelNameId
      ? getState(modelNameId, "No active print")
      : "No active print",
    lastPrintName: getLastPrintName(hass, config),
  };
};
