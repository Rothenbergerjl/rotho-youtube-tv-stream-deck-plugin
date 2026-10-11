// Latest view of the extension's state plus connection status. Actions subscribe to it.
import type { Game, StateMessage } from "@rotho/shared";

export interface PluginState {
  connected: boolean;
  /** Sorted by slot; empty while disconnected. */
  games: Game[];
  allMuted: boolean;
  /** True when Mute All has a game to restore. */
  canRestore: boolean;
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

  applyState(message: StateMessage): void {
    this.update({
      connected: true,
      games: [...message.games].sort((a, b) => a.slot - b.slot),
      allMuted: message.allMuted,
      canRestore:
        message.lastHeardTabId !== undefined &&
        message.games.some((g) => g.tabId === message.lastHeardTabId),
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
