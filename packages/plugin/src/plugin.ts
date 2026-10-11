import streamDeck from "@elgato/streamdeck";
import { EXTENSION_ORIGIN, PLUGIN_UUID, PROTOCOL_VERSION, WS_PORT } from "@rotho/shared";
import { MuteAllAction } from "./actions/mute-all";
import { SlotAction } from "./actions/slot";
import { ExtensionServer } from "./server";
import { Store } from "./store";

const logger = streamDeck.logger.createScope("yttv");
streamDeck.logger.setLevel("info");
logger.info(`${PLUGIN_UUID} starting`);

const store = new Store();
const server = new ExtensionServer({
  port: WS_PORT,
  allowedOrigin: EXTENSION_ORIGIN,
  logger,
  onConnected: () => store.setConnected(true),
  onDisconnected: () => store.setConnected(false),
  onMessage: (message) => {
    switch (message.type) {
      case "hello":
        logger.info(`Extension ${message.extensionVersion}, protocol ${message.protocolVersion}`);
        if (message.protocolVersion !== PROTOCOL_VERSION) {
          logger.warn(`Protocol mismatch: plugin speaks ${PROTOCOL_VERSION}`);
        }
        break;
      case "state":
        store.applyState(message);
        break;
      case "heartbeat":
        break;
    }
  },
});

streamDeck.actions.registerAction(new SlotAction(store, server));
streamDeck.actions.registerAction(new MuteAllAction(store, server));

await streamDeck.connect();
await server.start();
