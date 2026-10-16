// Latest view of the extension's state plus connection status. Actions subscribe to it.
import { type Game, PROTOCOL_VERSION, type StateMessage } from "@rotho/shared";

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
}

const disconnected: PluginState = {
  connected: false,
  games: [],
  allMuted: true,
  canRestore: false,
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

  setConnected(connected: boolean): void {
    if (connected === this.state.connected) return;
    // Until the extension sends its state, show no games.
    this.update(connected ? { ...disconnected, connected: true } : disconnected);
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

  applyState(message: StateMessage): void {
    this.update({
      connected: true,
      games: [...message.games].sort((a, b) => a.slot - b.slot),
      allMuted: message.allMuted,
      canRestore:
        message.lastHeardTabId !== undefined &&
        message.games.some((g) => g.tabId === message.lastHeardTabId),
      ...(this.state.mismatch && { mismatch: this.state.mismatch }),
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
