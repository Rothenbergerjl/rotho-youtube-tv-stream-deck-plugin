// Latest view of the extension's state plus connection status. Actions subscribe to it.
import {
  type Feature,
  type Game,
  PROTOCOL_VERSION,
  type ServiceId,
  type StateMessage,
} from "@rotho/shared";
import type { UpdateInfo } from "./updates";

/** Which side must be updated when the plugin and extension speak different protocols. */
export type UpdateTarget = "plugin" | "extension";

export interface PluginState {
  connected: boolean;
  /** Sorted by slot; empty while disconnected. */
  games: Game[];
  allMuted: boolean;
  /** True when Mute All has a game to restore. */
  canRestore: boolean;
  /** Set when the connected extension speaks a different protocol; keys then refuse presses. */
  mismatch?: UpdateTarget;
  /** Optional features the connected extension listed in its `hello`; empty while disconnected. */
  features: Feature[];
  /**
   * Services turned on in the extension. Extensions from before Peacock support don't send it,
   * which means only YouTube TV.
   */
  services: ServiceId[];
  /** A newer plugin release, from the GitHub check; kept across connects and disconnects. */
  update?: UpdateInfo;
}

const ONLY_YOUTUBE_TV: readonly ServiceId[] = ["youtubeTv"];

const disconnected: PluginState = {
  connected: false,
  games: [],
  allMuted: true,
  canRestore: false,
  features: [],
  services: [...ONLY_YOUTUBE_TV],
};

type Listener = (state: PluginState) => void;

export class Store {
  private state: PluginState = disconnected;
  private readonly listeners = new Set<Listener>();

  get current(): PluginState {
    return this.state;
  }

  gameInSlot(slot: number): Game | undefined {
    return this.state.games.find((g) => g.slot === slot);
  }

  /** True when `service` is turned on in the connected extension. */
  isEnabled(service: ServiceId): boolean {
    return this.state.services.includes(service);
  }

  /** True when the connected extension handles `feature`. */
  has(feature: Feature): boolean {
    return this.state.features.includes(feature);
  }

  setConnected(connected: boolean): void {
    if (connected === this.state.connected) return;
    // Until the extension sends its state, show no games.
    this.update({
      ...disconnected,
      connected,
      ...(this.state.update && { update: this.state.update }),
    });
  }

  /** Records the result of the GitHub release check. */
  setUpdate(update: UpdateInfo | undefined): void {
    if (update?.version === this.state.update?.version) return;
    const next = { ...this.state, update };
    if (!update) delete next.update;
    this.update(next);
  }

  /** Records the protocol from the extension's `hello`; the newer side's peer needs updating. */
  setProtocol(extensionProtocol: number): void {
    const mismatch: UpdateTarget | undefined =
      extensionProtocol === PROTOCOL_VERSION
        ? undefined
        : extensionProtocol > PROTOCOL_VERSION
          ? "plugin"
          : "extension";
    if (mismatch === this.state.mismatch) return;
    const next = { ...this.state, mismatch };
    if (!mismatch) delete next.mismatch;
    this.update(next);
  }

  /** Records the features from the extension's `hello`; an older extension sends none. */
  setFeatures(features: Feature[] = []): void {
    const current = this.state.features;
    if (features.length === current.length && features.every((f) => current.includes(f))) return;
    this.update({ ...this.state, features: [...features] });
  }

  applyState(message: StateMessage): void {
    this.update({
      connected: true,
      games: [...message.games].sort((a, b) => a.slot - b.slot),
      allMuted: message.allMuted,
      canRestore:
        message.lastHeardTabId !== undefined &&
        message.games.some((g) => g.tabId === message.lastHeardTabId),
      features: this.state.features,
      services: [...(message.services ?? ONLY_YOUTUBE_TV)],
      ...(this.state.mismatch && { mismatch: this.state.mismatch }),
      ...(this.state.update && { update: this.state.update }),
    });
  }

  /** Calls `listener` on every change; returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private update(next: PluginState): void {
    this.state = next;
    for (const listener of this.listeners) listener(next);
  }
}
