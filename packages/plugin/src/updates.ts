// Checks GitHub for a newer plugin release so the keys can show an "update available" badge.
// The request is anonymous and any failure is ignored (logged at info).

export const LATEST_RELEASE_URL =
  "https://api.github.com/repos/Rothenbergerjl/rotho-youtube-tv-stream-deck-plugin/releases/latest";

/** A newer release than the running plugin. */
export interface UpdateInfo {
  version: string;
  /** Release page to open. */
  url: string;
}

export interface UpdateCheckerOptions {
  /** The running plugin's version, e.g. "0.2.0". */
  currentVersion: string;
  /** Called after each successful check: the newer release, or undefined when up to date. */
  onResult: (update: UpdateInfo | undefined) => void;
  intervalMs?: number;
  fetch?: typeof fetch;
  logger?: { info(message: string): void };
}

const TWELVE_HOURS = 12 * 60 * 60 * 1000;

/** Parses "1.2.3" or "v1.2.3"; returns null for anything else, including prereleases. */
export function parseVersion(value: string): [number, number, number] | null {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Positive when `a` is newer than `b`, negative when older, 0 when equal. */
export function compareVersions(a: [number, number, number], b: [number, number, number]): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

export class UpdateChecker {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly options: UpdateCheckerOptions) {}

  /** Checks now and then every `intervalMs` (12 hours by default). */
  start(): void {
    this.stop();
    void this.check();
    this.timer = setInterval(() => void this.check(), this.options.intervalMs ?? TWELVE_HOURS);
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async check(): Promise<void> {
    const { currentVersion, onResult, fetch: doFetch = fetch, logger } = this.options;
    try {
      const current = parseVersion(currentVersion);
      if (!current) throw new Error(`can't parse own version ${JSON.stringify(currentVersion)}`);
      const res = await doFetch(LATEST_RELEASE_URL, {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "rotho-yttv-multiview" },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { tag_name?: unknown; html_url?: unknown };
      const latest = typeof body.tag_name === "string" ? parseVersion(body.tag_name) : null;
      if (!latest || typeof body.html_url !== "string") throw new Error("unexpected response");
      const newer = compareVersions(latest, current) > 0;
      const version = latest.join(".");
      logger?.info(newer ? `Update available: ${version}` : `Up to date (latest ${version})`);
      onResult(newer ? { version, url: body.html_url } : undefined);
    } catch (err) {
      logger?.info(`Update check failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
