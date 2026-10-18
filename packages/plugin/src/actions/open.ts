import streamDeck, {
  action,
  type DidReceiveSettingsEvent,
  type KeyDownEvent,
  SingletonAction,
  type WillAppearEvent,
  type WillDisappearEvent,
} from "@elgato/streamdeck";
import {
  FEATURES,
  MAX_SLOTS,
  type OpenTarget,
  type PluginMessage,
  type ServiceId,
} from "@rotho/shared";
import { type OpenKeyView, openKeySvg, toDataUrl } from "../render";
import type { ExtensionServer } from "../server";
import { returnAfterOpenSetting, serviceSetting } from "../settings";
import type { Store } from "../store";

type OpenSettings = {
  target?: OpenTarget;
  service?: ServiceId;
  returnAfterOpen?: boolean;
};

/**
 * Open Service: opens YouTube TV, Peacock or Paramount+ (the key's Service setting) in a new
 * Chrome window or tab (its Open in setting). A service that is off in the extension shows
 * "Turn on", and pressing opens the extension's options page. With "Return to previous profile"
 * on, a key that opened its service switches back to the previous profile, so the keys in the
 * Services picker close it.
 */
@action({ UUID: "com.rotho.yttv-multiview.open" })
export class OpenAction extends SingletonAction<OpenSettings> {
  /** The Service setting for each visible key, by action id. */
  private readonly services = new Map<string, ServiceId>();

  constructor(
    private readonly store: Store,
    private readonly server: ExtensionServer,
  ) {
    super();
    store.subscribe(() => void this.renderAll());
  }

  override async onWillAppear(ev: WillAppearEvent<OpenSettings>): Promise<void> {
    this.services.set(ev.action.id, serviceSetting(ev.payload.settings.service));
    await this.renderAll();
  }

  override onWillDisappear(ev: WillDisappearEvent<OpenSettings>): void {
    this.services.delete(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<OpenSettings>): Promise<void> {
    this.services.set(ev.action.id, serviceSetting(ev.payload.settings.service));
    await this.renderAll();
  }

  override async onKeyDown(ev: KeyDownEvent<OpenSettings>): Promise<void> {
    const message = this.messageFor(
      serviceSetting(ev.payload.settings.service),
      ev.payload.settings.target === "tab" ? "tab" : "window",
    );
    if (!message || !this.server.send(message)) {
      await ev.action.showAlert();
      return;
    }
    // "Turn on" opens the extension's options, which isn't a pick: stay in the picker.
    if (
      message.type !== "openOptions" &&
      returnAfterOpenSetting(ev.payload.settings.returnAfterOpen)
    ) {
      await streamDeck.profiles.switchToProfile(ev.action.device.id);
    }
  }

  /** What a press sends, or undefined when it can't do anything (the key then shows why). */
  private messageFor(service: ServiceId, target: OpenTarget): PluginMessage | undefined {
    const view = this.view(service);
    if (view.mismatch || view.featureMissing) return undefined;
    if (view.off) return { type: "openOptions" };
    if (view.full) return undefined;
    // YouTube TV keeps its own message so extensions without `openService` still open it.
    return service === "youtubeTv"
      ? { type: "openYouTubeTv", target }
      : { type: "openService", service, target };
  }

  private view(service: ServiceId): OpenKeyView {
    const state = this.store.current;
    const feature = service === "youtubeTv" ? FEATURES.openYouTubeTv : FEATURES.openService;
    return {
      connected: state.connected,
      mismatch: state.mismatch,
      service,
      featureMissing: !this.store.has(feature),
      off: !this.store.isEnabled(service),
      full: state.games.length >= MAX_SLOTS,
      updateAvailable: state.update !== undefined,
    };
  }

  private async renderAll(): Promise<void> {
    // Keys differ only by their Service setting, so draw each service once.
    const images = new Map<ServiceId, string>();
    const image = (service: ServiceId) => {
      let url = images.get(service);
      if (!url) images.set(service, (url = toDataUrl(openKeySvg(this.view(service)))));
      return url;
    };
    await Promise.all(
      this.actions.map((a) =>
        a.isKey() ? a.setImage(image(this.services.get(a.id) ?? "youtubeTv")) : undefined,
      ),
    );
  }
}
