// Options page: a switch per service. YouTube TV is always on. Paramount+ needs optional host
// access (for its live-page content script), requested when it is turned on.
import { SERVICE_IDS, SERVICES, type ServiceId } from "@rotho/shared";
import {
  loadServices,
  PARAMOUNT_ORIGINS,
  SERVICES_KEY,
  setServiceEnabled,
} from "./service-settings";

const NOTES: Record<ServiceId, string> = {
  youtubeTv: "Always on.",
  peacock: "Live events and on-demand videos.",
  paramountPlus: "Live TV and on-demand videos. Asks for access to paramountplus.com.",
};

const list = document.getElementById("services")!;
const inputs = new Map<ServiceId, HTMLInputElement>();
const notes = new Map<ServiceId, HTMLElement>();

for (const id of SERVICE_IDS) {
  const { name, badge } = SERVICES[id];
  const item = document.createElement("li");

  const disc = document.createElement("span");
  disc.className = "badge";
  disc.textContent = badge.monogram;
  disc.style.background = badge.color;
  disc.style.color = badge.text;
  disc.setAttribute("aria-hidden", "true");

  const label = document.createElement("label");
  label.className = "label";
  label.htmlFor = `service-${id}`;
  const title = document.createElement("div");
  title.className = "name";
  title.textContent = name;
  const note = document.createElement("div");
  note.className = "note";
  note.textContent = NOTES[id];
  label.append(title, note);

  const toggle = document.createElement("span");
  toggle.className = "switch";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = `service-${id}`;
  input.setAttribute("role", "switch");
  input.disabled = true;
  const track = document.createElement("span");
  track.className = "track";
  toggle.append(input, track);

  item.append(disc, label, toggle);
  list.append(item);
  inputs.set(id, input);
  notes.set(id, note);

  if (id !== "youtubeTv") input.addEventListener("change", () => onToggle(id, input.checked));
}

function showNote(id: ServiceId, text: string, error = false): void {
  const note = notes.get(id)!;
  note.textContent = text;
  note.classList.toggle("error", error);
}

function onToggle(id: ServiceId, on: boolean): void {
  showNote(id, NOTES[id]);
  if (id !== "paramountPlus") {
    void setServiceEnabled(id, on).catch(showSaveError(id));
    return;
  }
  if (on) {
    // Must be called straight from the click, before any await, to count as a user gesture.
    chrome.permissions
      .request({ origins: PARAMOUNT_ORIGINS })
      .then(async (granted) => {
        if (granted) {
          await setServiceEnabled(id, true);
        } else {
          showNote(
            id,
            "Access to paramountplus.com wasn't allowed, so Paramount+ stays off.",
            true,
          );
          await render();
        }
      })
      .catch(showSaveError(id));
  } else {
    setServiceEnabled(id, false)
      .then(() => chrome.permissions.remove({ origins: PARAMOUNT_ORIGINS }))
      .catch(showSaveError(id));
  }
}

const showSaveError = (id: ServiceId) => (err: unknown) => {
  console.error("[yttv-multiview] options", err);
  showNote(id, "Couldn't save. Try again.", true);
  void render();
};

/** Shows the saved state. Paramount+ counts as on only while access is granted. */
async function render(): Promise<void> {
  const enabled = await loadServices();
  const granted = await chrome.permissions.contains({ origins: PARAMOUNT_ORIGINS });
  for (const [id, input] of inputs) {
    input.checked = enabled.includes(id) && (id !== "paramountPlus" || granted);
    input.disabled = id === "youtubeTv";
  }
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[SERVICES_KEY]) void render();
});
chrome.permissions.onAdded.addListener(() => void render());
chrome.permissions.onRemoved.addListener(() => void render());

void render();
