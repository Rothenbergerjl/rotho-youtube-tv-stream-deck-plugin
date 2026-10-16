import streamDeck from "@elgato/streamdeck";
import {
  EXTENSION_ORIGIN,
  formatMatchup,
  PLUGIN_UUID,
  PROTOCOL_VERSION,
  WS_PORT,
} from "@rotho/shared";
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
        store.setProtocol(message.protocolVersion);
        if (store.current.mismatch) {
          logger.warn(
            `Protocol mismatch: plugin speaks ${PROTOCOL_VERSION}; update the ${store.current.mismatch}`,
          );
        }
        break;
      case "state":
        // e.g. "State: 1:SF @ SEA*, 2:BUF @ LAR (* = heard)"
        logger.info(
          `State: ${message.games.map((g) => `${g.slot}:${formatMatchup(g.title)}${g.heard ? "*" : ""}`).join(", ") || "no games"}${message.allMuted ? " (all muted)" : ""}`,
        );
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
