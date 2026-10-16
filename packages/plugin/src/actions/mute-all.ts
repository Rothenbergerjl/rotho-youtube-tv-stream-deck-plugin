import { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";
import { muteAllKeySvg, toDataUrl } from "../render";
import type { ExtensionServer } from "../server";
import type { Store } from "../store";

/** Mute All: mutes every game; pressing again restores the last one heard. */
@action({ UUID: "com.rotho.yttv-multiview.muteall" })
export class MuteAllAction extends SingletonAction {
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
    if (this.store.current.mismatch || !this.server.send({ type: "toggleMuteAll" })) {
      await ev.action.showAlert();
    }
  }

  private async renderAll(): Promise<void> {
    const image = toDataUrl(muteAllKeySvg(this.store.current));
    await Promise.all(this.actions.map((a) => (a.isKey() ? a.setImage(image) : undefined)));
  }
}
