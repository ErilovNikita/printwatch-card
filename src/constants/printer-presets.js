/**
 * Printer presets define entity mappings for different 3D printer models
 * Users can select a preset and then customize individual entity mappings
 */

export const PRINTER_PRESETS = {
  "bambu-lab-p1s": {
    name: "Bambu Lab P1S",
    description: "Bambu Lab P1S with ha-bambulab integration",
    entities: {
      general: {
        status: "sensor.bambu_lab_status",
        stage: "sensor.bambu_lab_stage",
        progress: "sensor.bambu_lab_progress",
        remaining_time: "sensor.bambu_lab_remaining_time",
        speed_profile: "select.bambu_lab_speed_profile",
      },
      camera: {
        entity: "camera.bambu_lab_camera",
        refresh_rate: 1000,
      },
      control: {
        pause_button: "button.bambu_lab_pause",
        resume_button: "button.bambu_lab_resume",
        stop_button: "button.bambu_lab_stop",
        chamber_light: "light.bambu_lab_chamber_light",
        fan: "fan.bambu_lab_auxiliary_fan",
      },
      model: {
        name: "sensor.bambu_lab_print_name",
        preview: "image.bambu_lab_preview",
        length: "sensor.bambu_lab_print_length",
        weight: "sensor.bambu_lab_print_weight",
      },
      temperature: {
        bed: "sensor.bambu_lab_bed_temp",
        bed_number: "number.bambu_lab_bed_target_temp",
        nozzle: "sensor.bambu_lab_nozzle_temp",
        nozzle_number: "number.bambu_lab_nozzle_target_temp",
      },
      filament: {
        ams_slots: [
          "sensor.bambu_lab_ams_slot_1",
          "sensor.bambu_lab_ams_slot_2",
          "sensor.bambu_lab_ams_slot_3",
          "sensor.bambu_lab_ams_slot_4",
        ],
      },
    },
  },
  "bambu-lab-a1-mini": {
    name: "Bambu Lab A1 Mini",
    description: "Bambu Lab A1 Mini with ha-bambulab integration",
    entities: {
      general: {
        status: "sensor.bambu_lab_a1_mini_print_status",
        stage: "sensor.bambu_lab_a1_mini_print_status",
        progress: "sensor.bambu_lab_a1_mini_print_progress",
        remaining_time: "sensor.bambu_lab_a1_mini_remaining_time",
        speed_profile: "select.bambu_lab_a1_mini_printing_speed",
      },
      camera: {
        entity: "image.bambu_lab_a1_mini_pick_image",
        refresh_rate: 1000,
      },
      control: {
        pause_button: "button.bambu_lab_a1_mini_pause_printing",
        resume_button: "button.bambu_lab_a1_mini_resume_printing",
        stop_button: "button.bambu_lab_a1_mini_stop_printing",
        chamber_light: null,
        fan: null,
      },
      model: {
        name: "sensor.bambu_lab_a1_mini_task_name",
        preview: "image.bambu_lab_a1_mini_pick_image",
        length: "sensor.bambu_lab_a1_mini_print_length",
        weight: "sensor.bambu_lab_a1_mini_print_weight",
      },
      temperature: {
        bed: null,
        bed_number: null,
        nozzle: "sensor.bambu_lab_a1_mini_nozzle_temperature",
        nozzle_number: "number.bambu_lab_a1_mini_nozzle_target_temperature",
      },
      filament: {
        ams_slots: ["sensor.bambu_lab_a1_mini_spool_holder_external_spool"],
      },
    },
  },
  "elegoo-centauri-carbon": {
    name: "Elegoo Centauri Carbon",
    description:
      "Elegoo Centauri Carbon resin printer with full sensor support",
    entities: {
      general: {
        status: "sensor.centauri_carbon_current_status",
        stage: "sensor.centauri_carbon_current_status",
        progress: "sensor.centauri_carbon_percent_complete",
        remaining_time: "sensor.centauri_carbon_remaining_print_time",
        speed_profile: "select.centauri_carbon_print_speed",
      },
      camera: {
        entity: "camera.centauri_carbon_chamber_camera",
        refresh_rate: 2000,
      },
      control: {
        pause_button: "button.centauri_carbon_pause_print",
        resume_button: "button.centauri_carbon_resume_print",
        stop_button: "button.centauri_carbon_stop_print",
        chamber_light: "light.centauri_carbon_chamber_light",
        fan: "fan.centauri_carbon_enclosure_fan",
      },
      model: {
        name: "sensor.centauri_carbon_file_name",
        preview: "image.centauri_carbon_cover_image",
        length: null,
        weight: null,
      },
      temperature: {
        bed: null,
        bed_number: "number.centauri_carbon_target_bed_temp",
        nozzle: "sensor.centauri_carbon_nozzle_temperature",
        nozzle_number: "number.centauri_carbon_target_nozzle_temp",
      },
      filament: {
        ams_slots: [],
      },
    },
  },
  custom: {
    name: "Custom Configuration",
    description: "Define your own entity mappings",
    entities: {
      general: {
        status: null,
        stage: null,
        progress: null,
        remaining_time: null,
        speed_profile: null,
      },
      camera: {
        entity: null,
        refresh_rate: 1000,
      },
      control: {
        pause_button: null,
        resume_button: null,
        stop_button: null,
        chamber_light: null,
        fan: null,
      },
      model: {
        name: null,
        preview: null,
        length: null,
        weight: null,
      },
      temperature: {
        bed: null,
        bed_number: null,
        nozzle: null,
        nozzle_number: null,
      },
      filament: {
        ams_slots: [],
      },
    },
  },
};

/**
 * Default entity mapping (used as fallback)
 */
export const DEFAULT_ENTITY_MAPPING = PRINTER_PRESETS["custom"].entities;

/**
 * Get a printer preset by ID
 */
export const getPreset = (presetId) => {
  return PRINTER_PRESETS[presetId] || PRINTER_PRESETS["custom"];
};

/**
 * Get all available presets
 */
export const getAllPresets = () => {
  return Object.entries(PRINTER_PRESETS).map(([id, preset]) => ({
    id,
    ...preset,
  }));
};

/**
 * Merge preset entities with custom overrides
 */
export const mergePresetWithCustom = (presetId, customOverrides = {}) => {
  const preset = getPreset(presetId);
  const merged = structuredClone(preset.entities);

  // Deep merge custom overrides
  const deepMerge = (target, source) => {
    Object.keys(source).forEach((key) => {
      if (source[key] === null || source[key] === undefined) {
        return;
      }
      if (typeof source[key] === "object" && !Array.isArray(source[key])) {
        target[key] = { ...target[key], ...source[key] };
      } else {
        target[key] = source[key];
      }
    });
    return target;
  };

  return deepMerge(merged, customOverrides);
};
