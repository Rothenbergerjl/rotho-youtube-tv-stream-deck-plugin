import streamDeck from "@elgato/streamdeck";
import { PLUGIN_UUID } from "@rotho/shared";

// Placeholder entry point; the WebSocket server and actions arrive in Phase 4.
streamDeck.logger.setLevel("info");
streamDeck.logger.info(`${PLUGIN_UUID} starting`);

streamDeck.connect();
