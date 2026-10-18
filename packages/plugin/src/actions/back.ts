import streamDeck, { action, type KeyDownEvent, SingletonAction } from "@elgato/streamdeck";

/** Back: switches the deck to the previous profile, e.g. to leave the Services picker. */
@action({ UUID: "com.rotho.yttv-multiview.back" })
export class BackAction extends SingletonAction {
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    await streamDeck.profiles.switchToProfile(ev.action.device.id);
  }
}
