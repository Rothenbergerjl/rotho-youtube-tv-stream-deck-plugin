import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { FEATURES, MAX_SLOTS, type OpenTarget } from "@rotho/shared";
import { openKeySvg, toDataUrl } from "../render";
import type { ExtensionServer } from "../server";
import type { Store } from "../store";

type OpenSettings = {
  target?: OpenTarget;
};

/** Open YouTube TV: opens tv.youtube.com in a new Chrome window or tab (a key setting). */
@action({ UUID: "com.rotho.yttv-multiview.open" })
export class OpenAction extends SingletonAction<OpenSettings> {
  constructor(
    private readonly store: Store,
    private readonly server: ExtensionServer,
  ) {
    super();
    store.subscribe(() => void this.renderAll());
  }

  override async onWillAppear(): Promise<void> {
    await this.renderAll();
  }

  override async onKeyDown(ev: KeyDownEvent<OpenSettings>): Promise<void> {
    const { mismatch, games } = this.store.current;
    const target: OpenTarget = ev.payload.settings.target === "tab" ? "tab" : "window";
    if (
      mismatch ||
      !this.store.has(FEATURES.openYouTubeTv) ||
      games.length >= MAX_SLOTS ||
      !this.server.send({ type: "openYouTubeTv", target })
    ) {
      await ev.action.showAlert();
    }
  }

  private async renderAll(): Promise<void> {
    const state = this.store.current;
    const image = toDataUrl(
      openKeySvg({
        connected: state.connected,
        mismatch: state.mismatch,
        featureMissing: !this.store.has(FEATURES.openYouTubeTv),
        full: state.games.length >= MAX_SLOTS,
        updateAvailable: state.update !== undefined,
      }),
    );
    await Promise.all(this.actions.map((a) => (a.isKey() ? a.setImage(image) : undefined)));
  }
}
