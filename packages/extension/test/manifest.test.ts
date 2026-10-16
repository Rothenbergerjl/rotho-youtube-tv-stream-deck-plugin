import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { EXTENSION_ID } from "@rotho/shared";
import { describe, expect, it } from "vitest";
import { ICON_SIZES, renderIcon } from "../icons/render";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));

/** Chrome derives an extension ID from the first 128 bits of SHA-256(public key), as a-p digits. */
function extensionIdFromKey(base64Key: string): string {
  const hex = createHash("sha256").update(Buffer.from(base64Key, "base64")).digest("hex");
  return [...hex.slice(0, 32)].map((h) => String.fromCharCode(97 + parseInt(h, 16))).join("");
}

describe("extension manifest", () => {
  it("has a key that produces the shared EXTENSION_ID", () => {
    expect(extensionIdFromKey(manifest.key)).toBe(EXTENSION_ID);
  });

  it("is limited to YouTube TV", () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.host_permissions).toEqual(["https://tv.youtube.com/*"]);
    expect(manifest.permissions).toEqual(["tabs", "storage", "alarms", "scripting"]);
    expect(manifest.content_scripts).toEqual([
      { matches: ["https://tv.youtube.com/*"], js: ["content.js"], run_at: "document_idle" },
    ]);
  });

  it("lists the icons the build renders", () => {
    expect(manifest.icons).toEqual(
      Object.fromEntries(ICON_SIZES.map((s) => [String(s), `icons/icon-${s}.png`])),
    );
  });
});

describe("extension icons", () => {
  it.each(ICON_SIZES)("renders a %ipx PNG", (size) => {
    const png = renderIcon(size);
    // PNG signature, then the IHDR chunk holds width and height at bytes 16 and 20.
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  });
});
