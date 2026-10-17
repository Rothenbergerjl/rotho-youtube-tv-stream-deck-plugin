import { beforeEach, describe, expect, it, vi } from "vitest";
import { focusTab, openYouTubeTv, type WindowsApi, YOUTUBE_TV_URL } from "../src/windows";

let windowStates: Map<number, string>;
let tabWindows: Map<number, number>;
let lastFocused: number | undefined;
let api: WindowsApi;

beforeEach(() => {
  windowStates = new Map([
    [1, "normal"],
    [2, "maximized"],
    [3, "minimized"],
  ]);
  tabWindows = new Map([
    [10, 1],
    [20, 2],
    [30, 3],
  ]);
  lastFocused = 1;
  api = {
    windows: {
      create: vi.fn(async () => ({})),
      getLastFocused: vi.fn(async () => {
        if (lastFocused === undefined) throw new Error("No last-focused window");
        return { id: lastFocused };
      }),
      get: vi.fn(async (id: number) => ({ state: windowStates.get(id) })),
      update: vi.fn(async () => ({})),
    },
    tabs: {
      create: vi.fn(async () => ({})),
      get: vi.fn(async (id: number) => {
        const windowId = tabWindows.get(id);
        if (windowId === undefined) throw new Error(`No tab with id: ${id}.`);
        return { windowId };
      }),
      update: vi.fn(async () => ({})),
    },
  };
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("openYouTubeTv", () => {
  it("opens a focused window", async () => {
    await openYouTubeTv(api, "window");
    expect(api.windows.create).toHaveBeenCalledWith({ url: YOUTUBE_TV_URL, focused: true });
    expect(api.tabs.create).not.toHaveBeenCalled();
  });

  it("opens a tab in the last-focused normal window and focuses it", async () => {
    await openYouTubeTv(api, "tab");
    expect(api.windows.getLastFocused).toHaveBeenCalledWith({ windowTypes: ["normal"] });
    expect(api.tabs.create).toHaveBeenCalledWith({
      windowId: 1,
      url: YOUTUBE_TV_URL,
      active: true,
    });
    expect(api.windows.update).toHaveBeenCalledWith(1, { focused: true });
    expect(api.windows.create).not.toHaveBeenCalled();
  });

  it("restores a minimized last-focused window when opening a tab", async () => {
    lastFocused = 3;
    await openYouTubeTv(api, "tab");
    expect(api.windows.update).toHaveBeenCalledWith(3, { focused: true, state: "normal" });
  });

  it("falls back to a new window when no normal window is open", async () => {
    lastFocused = undefined;
    await openYouTubeTv(api, "tab");
    expect(api.tabs.create).not.toHaveBeenCalled();
    expect(api.windows.create).toHaveBeenCalledWith({ url: YOUTUBE_TV_URL, focused: true });
  });

  it("logs instead of throwing when Chrome refuses", async () => {
    vi.mocked(api.windows.create).mockRejectedValueOnce(new Error("nope"));
    await expect(openYouTubeTv(api, "window")).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("focusTab", () => {
  it("activates the tab and focuses its window", async () => {
    await focusTab(api, 10);
    expect(api.tabs.update).toHaveBeenCalledWith(10, { active: true });
    expect(api.windows.update).toHaveBeenCalledWith(1, { focused: true });
  });

  it("restores a minimized window", async () => {
    await focusTab(api, 30);
    expect(api.windows.update).toHaveBeenCalledWith(3, { focused: true, state: "normal" });
  });

  it("leaves a maximized window maximized", async () => {
    await focusTab(api, 20);
    expect(api.windows.update).toHaveBeenCalledWith(2, { focused: true });
  });

  it("logs instead of throwing when the tab is gone", async () => {
    await expect(focusTab(api, 99)).resolves.toBeUndefined();
    expect(api.tabs.update).not.toHaveBeenCalled();
    expect(api.windows.update).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });
});
