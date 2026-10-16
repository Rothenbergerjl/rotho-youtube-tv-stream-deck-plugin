import {
  action,
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import { MAX_SLOTS } from "@rotho/shared";
import { slotKeySvg, toDataUrl } from "../render";
import type { ExtensionServer } from "../server";
import type { Store } from "../store";

type SlotSettings = {
  slot?: number;
};

/** Game Slot: shows the game in its slot; pressing it plays only that game. */
@action({ UUID: "com.rotho.yttv-multiview.slot" })
export class SlotAction extends SingletonAction<SlotSettings> {
  /** Slot number for each visible key, by action id. */
  private readonly slots = new Map<string, number>();

  constructor(
    private readonly store: Store,
    private readonly server: ExtensionServer,
  ) {
    super();
    store.subscribe(() => void this.renderAll());
  }

  override async onWillAppear(ev: WillAppearEvent<SlotSettings>): Promise<void> {
    let slot = validSlot(ev.payload.settings.slot);
    if (slot === undefined) {
      // New key: default to the lowest slot no other visible key uses.
      const used = new Set(this.slots.values());
      slot = Array.from({ length: MAX_SLOTS }, (_, i) => i + 1).find((s) => !used.has(s)) ?? 1;
      await ev.action.setSettings({ slot });
    }
    this.slots.set(ev.action.id, slot);
    await this.render(ev.action.id);
  }

  override onWillDisappear(ev: WillDisappearEvent<SlotSettings>): void {
    this.slots.delete(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<SlotSettings>): Promise<void> {
    this.slots.set(ev.action.id, validSlot(ev.payload.settings.slot) ?? 1);
    await this.render(ev.action.id);
  }

  override async onKeyDown(ev: KeyDownEvent<SlotSettings>): Promise<void> {
    const slot = this.slots.get(ev.action.id);
    const game = slot === undefined ? undefined : this.store.gameInSlot(slot);
    if (
      this.store.current.mismatch ||
      !game ||
      !this.server.send({ type: "solo", slot: game.slot })
    ) {
      await ev.action.showAlert();
    }
  }

  private async renderAll(): Promise<void> {
    await Promise.all([...this.slots.keys()].map((id) => this.render(id)));
  }

  private async render(id: string): Promise<void> {
    const slot = this.slots.get(id);
    const key = this.actions.find((a) => a.id === id);
    if (slot === undefined || !key?.isKey()) return;
    const { connected, mismatch } = this.store.current;
    const game = this.store.gameInSlot(slot);
    await key.setImage(
      toDataUrl(slotKeySvg({ slot, connected, title: game?.title, heard: game?.heard, mismatch })),
    );
  }
}

function validSlot(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= MAX_SLOTS
    ? (n as number)
    : undefined;
}
