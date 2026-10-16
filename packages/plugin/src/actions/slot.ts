import streamDeck, {
  action,
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  type SendToPluginEvent,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import { MAX_SLOTS } from "@rotho/shared";
import { slotKeySvg, toDataUrl } from "../render";
import type { ExtensionServer } from "../server";
import type { Store } from "../store";
import type { UpdateInfo } from "../updates";

type SlotSettings = {
  slot?: number;
};

// Messages with ui/slot.html. The property inspector asks for the update status when it loads
// (it may load after propertyInspectorDidAppear) and asks the plugin to open the release page.
type FromPropertyInspector = { type: "getUpdate" } | { type: "openUpdate" };

/** Game Slot: shows the game in its slot; pressing it plays only that game. */
@action({ UUID: "com.rotho.yttv-multiview.slot" })
export class SlotAction extends SingletonAction<SlotSettings> {
  /** Slot number for each visible key, by action id. */
  private readonly slots = new Map<string, number>();
  private sentUpdate: UpdateInfo | undefined;

  constructor(
    private readonly store: Store,
    private readonly server: ExtensionServer,
  ) {
    super();
    store.subscribe((state) => {
      void this.renderAll();
      if (state.update !== this.sentUpdate) void this.sendUpdate();
    });
  }

  override async onSendToPlugin(
    ev: SendToPluginEvent<FromPropertyInspector, SlotSettings>,
  ): Promise<void> {
    const { update } = this.store.current;
    if (ev.payload?.type === "getUpdate") await this.sendUpdate();
    if (ev.payload?.type === "openUpdate" && update) await streamDeck.system.openUrl(update.url);
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
    const { connected, mismatch, update } = this.store.current;
    const game = this.store.gameInSlot(slot);
    await key.setImage(
      toDataUrl(
        slotKeySvg({
          slot,
          connected,
          title: game?.title,
          heard: game?.heard,
          mismatch,
          updateAvailable: update !== undefined,
        }),
      ),
    );
  }

  /** Tells a visible property inspector about the update; a no-op when none is open. */
  private async sendUpdate(): Promise<void> {
    this.sentUpdate = this.store.current.update;
    await streamDeck.ui.sendToPropertyInspector({
      type: "update",
      update: this.sentUpdate ? { ...this.sentUpdate } : null,
    });
  }
}

function validSlot(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= MAX_SLOTS
    ? (n as number)
    : undefined;
}
