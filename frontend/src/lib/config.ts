/**
 * Environment configuration for the frontend
 * Uses Vite's import.meta.env for environment variables
 */

// API Configuration
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  timeout: import.meta.env.VITE_API_TIMEOUT || 30000,
};

export const VOICE_CONFIG = {
  mode: import.meta.env.VITE_VOICE_MODE || "local", // local | agentkit_live
};

// Feature flags
export const FEATURES = {
  enableDebug: import.meta.env.DEV,
};

export default {
  api: API_CONFIG,
  voice: VOICE_CONFIG,
  features: FEATURES,
};