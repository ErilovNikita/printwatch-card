/**
 * Device discovery utility for auto-configuring printers
 * Discovers entities from a Home Assistant device and maps them to card configuration
 */

/**
 * Entity type patterns for different integrations
 */
const ENTITY_PATTERNS = {
  bambu_lab: {
    status: ["sensor", "print_status"],
    progress: ["sensor", "print_progress"],
    remaining_time: ["sensor", "remaining_time"],
    speed_profile: ["select", "printing_speed"],
    camera: ["camera", "camera"],
    preview: ["image", "pick_image"],
    nozzle_temp: ["sensor", "nozzle_temperature"],
    nozzle_target: ["number", "nozzle_target_temperature"],
    bed_temp: ["sensor", "bed_temperature"],
    bed_target: ["number", "bed_target_temperature"],
    pause_button: ["button", "pause"],
    resume_button: ["button", "resume"],
    stop_button: ["button", "stop"],
    chamber_light: ["light", "chamber_light"],
    fan: ["fan", "fan"],
    print_name: ["sensor", "task_name"],
    print_length: ["sensor", "print_length"],
    print_weight: ["sensor", "print_weight"],
    filament_slots: ["sensor", "ams_slot"],
    external_spool: ["sensor", "external_spool"],
  },
  elegoo_printer: {
    status: ["sensor", "current_status"],
    progress: ["sensor", "percent_complete"],
    remaining_time: ["sensor", "remaining_print_time"],
    speed_profile: ["select", "print_speed"],
    camera: ["camera", "chamber_camera"],
    preview: ["image", "cover_image"],
    nozzle_temp: ["sensor", "nozzle_temperature"],
    nozzle_target: ["number", "target_nozzle_temp"],
    bed_target: ["number", "target_bed_temp"],
    pause_button: ["button", "pause_print"],
    resume_button: ["button", "resume_print"],
    stop_button: ["button", "stop_print"],
    chamber_light: ["light", "chamber_light"],
    fan: ["fan", "enclosure_fan"],
    print_name: ["sensor", "file_name"],
    current_layer: ["sensor", "current_layer"],
    total_layers: ["sensor", "total_layers"],
  },
};

/**
 * Detect the integration type of a device based on its identifier
 * @param {string} deviceId - Home Assistant device ID
 * @param {Object} devices - Map of devices from Home Assistant
 * @returns {string|null} - Integration name ('bambu_lab', 'elegoo_printer') or null
 */
export const detectIntegration = (deviceId, devices) => {
  const device = devices[deviceId];
  if (!device) return null;

  // Check identifiers to determine integration
  if (device.identifiers) {
    for (const identifier of device.identifiers) {
      const [integration] = identifier;
      if (integration === "bambu_lab") return "bambu_lab";
      if (integration === "elegoo_printer") return "elegoo_printer";
    }
  }

  return null;
};

/**
 * Discover and map entities from a device
 * @param {string} deviceId - Home Assistant device ID
 * @param {Object} devices - Map of devices from Home Assistant
 * @param {Object} entities - Map of entities from Home Assistant
 * @returns {Object|null} - Mapped configuration or null if device not found
 */
export const discoverDeviceEntities = (deviceId, devices, entities) => {
  const device = devices[deviceId];
  if (!device) return null;

  const integration = detectIntegration(deviceId, devices);
  if (!integration || !ENTITY_PATTERNS[integration]) return null;

  const patterns = ENTITY_PATTERNS[integration];
  const config = {
    general: {},
    camera: { refresh_rate: integration === "elegoo_printer" ? 2000 : 1000 },
    control: {},
    model: {},
    temperature: {},
    filament: { ams_slots: [] },
  };

  // Get all entity IDs associated with this device
  const deviceEntityIds = Object.keys(entities).filter(
    (entityId) => entities[entityId].device_id === deviceId
  );

  // Map entities based on patterns
  const matchEntity = (entityIds, patterns) => {
    for (const entityId of entityIds) {
      const entity = entities[entityId];
      if (!entity) continue;

      const [domain, name] = entityId.split(".");
      if (domain !== patterns[0]) continue;

      // Check if entity name contains the pattern
      if (name.includes(patterns[1])) {
        return entityId;
      }
    }
    return null;
  };

  // Populate configuration
  const status = matchEntity(deviceEntityIds, patterns.status);
  const progress = matchEntity(deviceEntityIds, patterns.progress);
  const remainingTime = matchEntity(deviceEntityIds, patterns.remaining_time);
  const speedProfile = matchEntity(deviceEntityIds, patterns.speed_profile);
  const camera = matchEntity(deviceEntityIds, patterns.camera);
  const preview = matchEntity(deviceEntityIds, patterns.preview);
  const nozzleTemp = matchEntity(deviceEntityIds, patterns.nozzle_temp);
  const nozzleTarget = matchEntity(deviceEntityIds, patterns.nozzle_target);
  const bedTemp = matchEntity(deviceEntityIds, patterns.bed_temp);
  const bedTarget = matchEntity(deviceEntityIds, patterns.bed_target);
  const pauseBtn = matchEntity(deviceEntityIds, patterns.pause_button);
  const resumeBtn = matchEntity(deviceEntityIds, patterns.resume_button);
  const stopBtn = matchEntity(deviceEntityIds, patterns.stop_button);
  const chamberLight = matchEntity(deviceEntityIds, patterns.chamber_light);
  const fan = matchEntity(deviceEntityIds, patterns.fan);
  const printName = matchEntity(deviceEntityIds, patterns.print_name);
  const printLength = matchEntity(deviceEntityIds, patterns.print_length);
  const printWeight = matchEntity(deviceEntityIds, patterns.print_weight);

  // General section
  if (status) config.general.status = status;
  if (status) config.general.stage = status; // Use status as stage fallback
  if (progress) config.general.progress = progress;
  if (remainingTime) config.general.remaining_time = remainingTime;
  if (speedProfile) config.general.speed_profile = speedProfile;

  // Camera section
  if (camera) config.camera.entity = camera;

  // Control section
  if (pauseBtn) config.control.pause_button = pauseBtn;
  if (resumeBtn) config.control.resume_button = resumeBtn;
  if (stopBtn) config.control.stop_button = stopBtn;
  if (chamberLight) config.control.chamber_light = chamberLight;
  if (fan) config.control.fan = fan;

  // Model section
  if (printName) config.model.name = printName;
  if (preview) config.model.preview = preview;
  if (printLength) config.model.length = printLength;
  if (printWeight) config.model.weight = printWeight;

  // Temperature section
  if (bedTemp) config.temperature.bed = bedTemp;
  if (bedTarget) config.temperature.bed_number = bedTarget;
  if (nozzleTemp) config.temperature.nozzle = nozzleTemp;
  if (nozzleTarget) config.temperature.nozzle_number = nozzleTarget;

  // Filament section - find AMS/material slots
  const filamentSlots = deviceEntityIds
    .filter((entityId) => {
      const entity = entities[entityId];
      const [domain, name] = entityId.split(".");
      return (
        domain === "sensor" &&
        (name.includes("ams_slot") || name.includes("external_spool"))
      );
    })
    .sort(); // Sort for consistent ordering

  if (filamentSlots.length > 0) {
    config.filament.ams_slots = filamentSlots;
  }

  return config;
};

/**
 * Get list of available devices for a specific integration
 * @param {Object} devices - Map of devices from Home Assistant
 * @param {string[]} integrations - Array of integration names to filter by
 * @returns {Array} - Array of devices with matching integrations
 */
export const getAvailableDevices = (devices, integrations = []) => {
  return Object.entries(devices)
    .filter(([, device]) => {
      if (!device.identifiers) return false;

      for (const identifier of device.identifiers) {
        const [integration] = identifier;
        if (integrations.length === 0 || integrations.includes(integration)) {
          return true;
        }
      }
      return false;
    })
    .map(([id, device]) => ({
      id,
      name: device.name || "Unknown Device",
      manufacturer: device.manufacturer || "",
      model: device.model || "",
    }));
};
