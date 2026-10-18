import streamDeck, {
  action,
  type DidReceiveSettingsEvent,
  type KeyAction,
  type KeyDownEvent,
  type KeyUpEvent,
  type SendToPluginEvent,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import { FEATURES, MAX_SLOTS } from "@rotho/shared";
import { HoldTimers } from "../long-press";
import { slotKeySvg, toDataUrl } from "../render";
import { alertFrame, FRAME_MS, type KeyScoreState, nextScoreState } from "../score-alerts";
import type { ScoreTracker } from "../scores/tracker";
import type { ExtensionServer } from "../server";
import {
  type LongPress,
  longPressSetting,
  scoreAlertsSetting,
  scoreDelaySetting,
  showScoreSetting,
  teamColorsSetting,
} from "../settings";
import type { Store } from "../store";
import type { UpdateInfo } from "../updates";

type SlotSettings = {
  slot?: number;
  teamColors?: boolean;
  showScore?: boolean;
  scoreAlerts?: boolean;
  /** Seconds; see scoreDelaySetting. */
  scoreDelay?: number;
  /** See longPressSetting. */
  longPress?: string;
};

/** A visible key's settings, parsed. */
interface KeyOptions {
  teamColors: boolean;
  showScore: boolean;
  scoreAlerts: boolean;
  scoreDelayMs: number;
  longPress: LongPress;
}

// Messages with ui/slot.html. The property inspector asks for the update status when it loads
// (it may load after propertyInspectorDidAppear) and asks the plugin to open the release page.
type FromPropertyInspector = { type: "getUpdate" } | { type: "openUpdate" };

/** While a key shows a score, keys re-render this often so delayed scores appear on time. */
const SCORE_TICK_MS = 1000;

/**
 * Game Slot: shows the game in its slot; pressing it plays only that game, and holding it also
 * brings that game's tab and window to the front.
 */
@action({ UUID: "com.rotho.yttv-multiview.slot" })
export class SlotAction extends SingletonAction<SlotSettings> {
  /** Slot number for each visible key, by action id. */
  private readonly slots = new Map<string, number>();
  /** The other settings for each visible key, by action id. */
  private readonly options = new Map<string, KeyOptions>();
  /** What each key showing a score last showed, and its running alert. */
  private readonly scoreStates = new Map<string, KeyScoreState>();
  /** The last image sent to each key, so an unchanged one isn't sent again. */
  private readonly images = new Map<string, string>();
  /** Long-press timers for keys that are held down. */
  private readonly holds = new HoldTimers();
  private tick: ReturnType<typeof setTimeout> | null = null;
  private sentUpdate: UpdateInfo | undefined;

  constructor(
    private readonly store: Store,
    private readonly server: ExtensionServer,
    private readonly scores: ScoreTracker,
  ) {
    super();
    store.subscribe((state) => {
      void this.renderAll();
      if (state.update !== this.sentUpdate) void this.sendUpdate();
    });
    this.scores.subscribe(() => void this.renderAll());
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
      await ev.action.setSettings({ ...ev.payload.settings, slot });
    }
    this.slots.set(ev.action.id, slot);
    this.options.set(ev.action.id, keyOptions(ev.payload.settings));
    this.images.delete(ev.action.id);
    await this.render(ev.action.id);
    this.scheduleTick();
  }

  override onWillDisappear(ev: WillDisappearEvent<SlotSettings>): void {
    this.slots.delete(ev.action.id);
    this.options.delete(ev.action.id);
    this.scoreStates.delete(ev.action.id);
    this.images.delete(ev.action.id);
    this.holds.cancel(ev.action.id);
    this.scheduleTick();
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<SlotSettings>): Promise<void> {
    this.slots.set(ev.action.id, validSlot(ev.payload.settings.slot) ?? 1);
    this.options.set(ev.action.id, keyOptions(ev.payload.settings));
    await this.render(ev.action.id);
    this.scheduleTick();
  }

  override async onKeyDown(ev: KeyDownEvent<SlotSettings>): Promise<void> {
    const slot = this.slots.get(ev.action.id);
    const game = slot === undefined ? undefined : this.store.gameInSlot(slot);
    if (
      this.store.current.mismatch ||
      !game ||
      !this.server.send({ type: "solo", slot: game.slot })
    ) {
      // The alert covers a long press too, so no hold timer starts.
      await ev.action.showAlert();
      return;
    }
    if (this.options.get(ev.action.id)?.longPress !== "off") {
      const key = ev.action;
      this.holds.start(key.id, () => void this.focusSlot(key, game.slot));
    }
  }

  override onKeyUp(ev: KeyUpEvent<SlotSettings>): void {
    this.holds.cancel(ev.action.id);
  }

  /** Long press: brings the slot's game forward, if it's still there, else shows the alert. */
  private async focusSlot(key: KeyAction<SlotSettings>, slot: number): Promise<void> {
    const game = this.store.gameInSlot(slot);
    if (
      this.store.current.mismatch ||
      !this.store.has(FEATURES.focus) ||
      !game ||
      !this.server.send({ type: "focus", slot })
    ) {
      await key.showAlert();
    }
  }

  private async renderAll(): Promise<void> {
    await Promise.all([...this.slots.keys()].map((id) => this.render(id)));
    this.scheduleTick();
  }

  private async render(id: string): Promise<void> {
    const slot = this.slots.get(id);
    const key = this.actions.find((a) => a.id === id);
    if (slot === undefined || !key?.isKey()) return;
    const { connected, mismatch, update } = this.store.current;
    const game = this.store.gameInSlot(slot);
    const options = this.options.get(id) ?? keyOptions({});
    // Two keys can show the same slot with different delays, so each key keeps its own state.

    // The score as it was `delay` ago; an alert runs when that delayed score goes up.
    const now = Date.now();
    const snapshot =
      game && connected && !mismatch && options.showScore
        ? this.scores.scoreFor(slot, options.scoreDelayMs)
        : undefined;
    const state = nextScoreState(this.scoreStates.get(id), snapshot, now, options.scoreAlerts);
    if (state) this.scoreStates.set(id, state);
    else this.scoreStates.delete(id);
    const alert = alertFrame(state, now);

    const image = toDataUrl(
      slotKeySvg({
        slot,
        connected,
        title: game?.title,
        heard: game?.heard,
        service: game?.service,
        mismatch,
        updateAvailable: update !== undefined,
        teamColors: options.teamColors,
        ...(snapshot && { score: { ...snapshot, ...(alert && { alert }) } }),
      }),
    );
    if (this.images.get(id) === image) return;
    this.images.set(id, image);
    await key.setImage(image);
  }

  /**
   * Re-renders on a timer while any key shows a score: every alert frame while one runs, else
   * every second so a delayed score appears on time. Stops when no key shows a score.
   */
  private scheduleTick(): void {
    if (this.tick) clearTimeout(this.tick);
    this.tick = null;
    const states = [...this.scoreStates.values()];
    if (states.length === 0) return;
    const ms = states.some((s) => s.alert) ? FRAME_MS : SCORE_TICK_MS;
    this.tick = setTimeout(() => {
      this.tick = null;
      void this.renderAll();
    }, ms);
    this.tick.unref?.();
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

function keyOptions(settings: SlotSettings): KeyOptions {
  return {
    teamColors: teamColorsSetting(settings.teamColors),
    showScore: showScoreSetting(settings.showScore),
    scoreAlerts: scoreAlertsSetting(settings.scoreAlerts),
    scoreDelayMs: scoreDelaySetting(settings.scoreDelay) * 1000,
    longPress: longPressSetting(settings.longPress),
  };
}

function validSlot(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isInteger(n) && (n as number) >= 1 && (n as number) <= MAX_SLOTS
    ? (n as number)
    : undefined;
}
