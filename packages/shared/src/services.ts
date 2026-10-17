// Streaming services whose player tabs the extension tracks. The extension uses the URL and title
// rules to find and name tabs; the plugin uses the names and badges to draw keys.

// This package has no DOM or Node types; both the extension and the plugin have the WHATWG URL
// global, so declare just the part used here.
declare const URL: new (url: string) => { protocol: string; hostname: string; pathname: string };

/** Service ids, in display order. Sent over the wire as `Game.service` and `StateMessage.services`. */
export const SERVICE_IDS = ["youtubeTv", "peacock", "paramountPlus"] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

/**
 * Where a tracked tab's title comes from: `tab` is the tab title (cleaned by `cleanTabTitle`),
 * `content` is a content script's `pageTitle` message.
 */
export type TitleSource = "tab" | "content";

/** A page (by path prefix) on a service's host that counts as a player. */
export interface PlayerPage {
  pathPrefix: string;
  titleSource: TitleSource;
}

export interface ServiceInfo {
  id: ServiceId;
  /** Display name, e.g. on the Open key and the options page. */
  name: string;
  /** Page the Open key opens. */
  homeUrl: string;
  /** Exact hostname of the player pages. */
  host: string;
  players: readonly PlayerPage[];
  /** Monogram disc drawn on keys showing this service's game. */
  badge: { monogram: string; color: string; text: string };
}

// Player URL patterns checked live on 2026-10-17 (see the findings comment on #10).
export const SERVICES: Readonly<Record<ServiceId, ServiceInfo>> = {
  youtubeTv: {
    id: "youtubeTv",
    name: "YouTube TV",
    homeUrl: "https://tv.youtube.com",
    host: "tv.youtube.com",
    // Every page counts, as before: the content script reports the program title.
    players: [{ pathPrefix: "/", titleSource: "content" }],
    badge: { monogram: "TV", color: "#ff0033", text: "#ffffff" },
  },
  peacock: {
    id: "peacock",
    name: "Peacock",
    homeUrl: "https://www.peacocktv.com",
    host: "www.peacocktv.com",
    players: [{ pathPrefix: "/watch/playback/", titleSource: "tab" }],
    badge: { monogram: "P", color: "#000000", text: "#ffffff" },
  },
  paramountPlus: {
    id: "paramountPlus",
    name: "Paramount+",
    homeUrl: "https://www.paramountplus.com",
    host: "www.paramountplus.com",
    players: [
      // The live tab title is only the channel; a content script reads the program.
      { pathPrefix: "/live-tv/stream/", titleSource: "content" },
      { pathPrefix: "/shows/video/", titleSource: "tab" },
      { pathPrefix: "/movies/video/", titleSource: "tab" },
    ],
    badge: { monogram: "P+", color: "#0064ff", text: "#ffffff" },
  },
};

export function isServiceId(v: unknown): v is ServiceId {
  return typeof v === "string" && (SERVICE_IDS as readonly string[]).includes(v);
}

/** The service and title source for a player page URL, or undefined if it isn't one. */
export function serviceForUrl(
  url: string | undefined,
): { service: ServiceId; titleSource: TitleSource } | undefined {
  if (!url) return undefined;
  let protocol: string, hostname: string, pathname: string;
  try {
    ({ protocol, hostname, pathname } = new URL(url));
  } catch {
    return undefined;
  }
  if (protocol !== "https:") return undefined;
  const id = SERVICE_IDS.find((s) => SERVICES[s].host === hostname);
  if (!id) return undefined;
  const page = SERVICES[id].players.find((p) => pathname.startsWith(p.pathPrefix));
  return page ? { service: id, titleSource: page.titleSource } : undefined;
}

/** Strips a service's branding from a tab title, leaving the program name. */
export function cleanTabTitle(service: ServiceId, title: string): string {
  let t = title.trim();
  switch (service) {
    case "peacock":
      t = t.replace(/\s+-\s+Peacock$/, "");
      break;
    case "paramountPlus":
      t = t.replace(/^Watch\s+/, "").replace(/\s+-\s+Paramount\+$/, "");
      break;
    case "youtubeTv":
      break;
  }
  return t.trim();
}
