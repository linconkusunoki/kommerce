import { describe, expect, test } from "bun:test";
import { S3ObjectStorage } from "../../services/ObjectStorage.ts";

describe("S3ObjectStorage", () => {
  test("rejects unsupported image types", async () => {
    const storage = new S3ObjectStorage();
    await expect(storage.upload(new File(["text"], "image.gif", { type: "image/gif" }))).rejects.toThrow(
      "Image must be JPEG, PNG, or WebP",
    );
  });

  test("rejects files over 5 MB", async () => {
    const storage = new S3ObjectStorage();
    await expect(storage.upload(new File([new Uint8Array(5 * 1024 * 1024 + 1)], "image.png", { type: "image/png" }))).rejects.toThrow(
      "Image must be 5 MB or smaller",
    );
  });
});
