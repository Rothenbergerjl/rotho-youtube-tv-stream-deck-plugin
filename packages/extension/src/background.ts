import { PLUGIN_UUID, WS_PORT } from "@rotho/shared";

// Placeholder service worker; tab tracking and the plugin connection arrive in Phase 2.
console.info(`[${PLUGIN_UUID}] extension loaded; plugin expected on ws://127.0.0.1:${WS_PORT}`);
