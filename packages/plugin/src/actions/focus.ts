import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { FEATURES } from "@rotho/shared";
import { focusKeySvg, toDataUrl } from "../render";
import type { ExtensionServer } from "../server";
import type { Store } from "../store";

/** Focus Heard Game: shows the game you're hearing; pressing brings its window and tab forward. */
@action({ UUID: "com.rotho.yttv-multiview.focus" })
export class FocusAction extends SingletonAction {
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

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
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
    const image = toDataUrl(
      focusKeySvg({
        connected: state.connected,
        mismatch: state.mismatch,
        featureMissing: !this.store.has(FEATURES.focus),
        title: state.games.find((g) => g.heard)?.title,
        updateAvailable: state.update !== undefined,
      }),
    );
    await Promise.all(this.actions.map((a) => (a.isKey() ? a.setImage(image) : undefined)));
  }
}
