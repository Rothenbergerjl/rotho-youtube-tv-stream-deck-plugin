import {
  action,
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import { FEATURES } from "@rotho/shared";
import { focusKeySvg, toDataUrl } from "../render";
import type { ExtensionServer } from "../server";
import { teamColorsSetting } from "../settings";
import type { Store } from "../store";

type FocusSettings = {
  teamColors?: boolean;
};

/** Focus Heard Game: shows the game you're hearing; pressing brings its window and tab forward. */
@action({ UUID: "com.rotho.yttv-multiview.focus" })
export class FocusAction extends SingletonAction<FocusSettings> {
  /** The Team colors setting for each visible key, by action id. */
  private readonly teamColors = new Map<string, boolean>();

  constructor(
    private readonly store: Store,
    private readonly server: ExtensionServer,
  ) {
    super();
    store.subscribe(() => void this.renderAll());
  }

  override async onWillAppear(ev: WillAppearEvent<FocusSettings>): Promise<void> {
    this.teamColors.set(ev.action.id, teamColorsSetting(ev.payload.settings.teamColors));
    await this.renderAll();
  }

  override onWillDisappear(ev: WillDisappearEvent<FocusSettings>): void {
    this.teamColors.delete(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<FocusSettings>): Promise<void> {
    this.teamColors.set(ev.action.id, teamColorsSetting(ev.payload.settings.teamColors));
    await this.renderAll();
  }

  override async onKeyDown(ev: KeyDownEvent<FocusSettings>): Promise<void> {
    const heard = this.store.current.games.find((g) => g.heard);
    if (
      this.store.current.mismatch ||
      !this.store.has(FEATURES.focus) ||
      !heard ||
      !this.server.send({ type: "focus", slot: heard.slot })
    ) {
      await ev.action.showAlert();
    }
  }

  private async renderAll(): Promise<void> {
    const state = this.store.current;
    // Keys differ only by their Team colors setting, so draw each variant once.
    const image = (teamColors: boolean) =>
      toDataUrl(
        focusKeySvg({
          connected: state.connected,
          mismatch: state.mismatch,
          featureMissing: !this.store.has(FEATURES.focus),
          title: state.games.find((g) => g.heard)?.title,
          updateAvailable: state.update !== undefined,
          teamColors,
        }),
      );
    const images = { true: image(true), false: image(false) };
    await Promise.all(
      this.actions.map((a) =>
        a.isKey() ? a.setImage(images[`${this.teamColors.get(a.id) ?? true}`]) : undefined,
      ),
    );
  }
}
