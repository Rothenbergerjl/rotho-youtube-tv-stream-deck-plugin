import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { EXTENSION_ID } from "@rotho/shared";
import { describe, expect, it } from "vitest";

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
    expect(manifest.permissions).toEqual(["tabs", "storage", "alarms"]);
  });
});
