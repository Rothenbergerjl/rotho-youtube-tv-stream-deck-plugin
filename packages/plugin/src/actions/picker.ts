import streamDeck, {
  action,
  DeviceType,
  type KeyDownEvent,
  SingletonAction,
} from "@elgato/streamdeck";
import { FEATURES, MAX_SLOTS, SERVICES_PROFILE } from "@rotho/shared";
import { type PickerKeyView, pickerKeySvg, toDataUrl } from "../render";
import type { Store } from "../store";

/**
 * Open Service Picker: switches the deck to the bundled Services profile, which holds an Open
 * Service key per service and a Back key. The profile is made for the 15-key Stream Deck only;
 * on other devices the key shows "Not supported".
 */
@action({ UUID: "com.rotho.yttv-multiview.picker" })
export class PickerAction extends SingletonAction {
  constructor(private readonly store: Store) {
    super();
    store.subscribe(() => void this.renderAll());
  }

  override async onWillAppear(): Promise<void> {
    await this.renderAll();
  }

  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    const view = this.view(ev.action.device.type);
    // Nothing inside the picker could open, so don't open it.
    if (view.unsupported || !view.connected || view.mismatch || view.featureMissing || view.full) {
      await ev.action.showAlert();
      return;
    }
    await streamDeck.profiles.switchToProfile(ev.action.device.id, SERVICES_PROFILE);
  }

  private view(deviceType: DeviceType): PickerKeyView {
    const state = this.store.current;
    return {
      connected: state.connected,
      mismatch: state.mismatch,
      featureMissing:
        !this.store.has(FEATURES.openYouTubeTv) && !this.store.has(FEATURES.openService),
      full: state.games.length >= MAX_SLOTS,
      unsupported: deviceType !== DeviceType.StreamDeck,
      updateAvailable: state.update !== undefined,
    };
  }

  private async renderAll(): Promise<void> {
    // Keys differ only by whether their device is supported, so draw each case once.
    const images = new Map<boolean, string>();
    const image = (deviceType: DeviceType) => {
      const view = this.view(deviceType);
      let url = images.get(!!view.unsupported);
      if (!url) images.set(!!view.unsupported, (url = toDataUrl(pickerKeySvg(view))));
      return url;
    };
    await Promise.all(
      this.actions.map((a) => (a.isKey() ? a.setImage(image(a.device.type)) : undefined)),
    );
  }
}
