/** Default camera update interval in milliseconds */
export const DEFAULT_CAMERA_REFRESH_RATE = 1000;

/**
 * Configuration schema for validation
 * Defines the structure and optional fields
 */
export const CONFIG_SCHEMA = {
  title: {
    required: true,
    type: "string",
    description: "Name of your printer",
  },
  printer_preset: {
    type: "string",
    default: "custom",
    description:
      "Printer model preset (bambu-lab-p1s, elegoo-centauri-carbon, custom)",
  },
  general: {
    status: { type: "string", description: "Print status sensor entity" },
    stage: { type: "string", description: "Print stage/state sensor entity" },
    progress: {
      type: "string",
      description: "Progress percentage sensor entity",
    },
    remaining_time: {
      type: "string",
      description: "Estimated time remaining sensor entity",
    },
    speed_profile: {
      type: "string",
      description: "Speed profile select entity",
    },
  },
  camera: {
    entity: { type: "string", description: "Camera or image entity" },
    refresh_rate: { type: "number", default: DEFAULT_CAMERA_REFRESH_RATE },
  },
  control: {
    pause_button: { type: "string", description: "Pause button entity" },
    resume_button: { type: "string", description: "Resume button entity" },
    stop_button: { type: "string", description: "Stop button entity" },
    chamber_light: {
      type: "string",
      description: "Chamber light switch/light entity",
    },
    fan: { type: "string", description: "Auxiliary fan entity" },
  },
  model: {
    name: { type: "string", description: "Current print name sensor entity" },
    preview: { type: "string", description: "Print preview image entity" },
    length: { type: "string", description: "Print length sensor entity" },
    weight: { type: "string", description: "Print weight sensor entity" },
  },
  temperature: {
    bed: { type: "string", description: "Bed temperature sensor entity" },
    bed_number: {
      type: "string",
      description: "Bed target temperature number entity",
    },
    nozzle: { type: "string", description: "Nozzle temperature sensor entity" },
    nozzle_number: {
      type: "string",
      description: "Nozzle target temperature number entity",
    },
  },
  filament: {
    ams_slots: {
      type: "array",
      default: [],
      description: "Array of filament/material slot entities",
    },
  },
  show: {
    title: { type: "boolean", default: true },
    camera: { type: "boolean", default: true },
    control: { type: "boolean", default: true },
    ams_slots: { type: "boolean", default: true },
  },
};
