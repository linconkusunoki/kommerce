import { S3Client } from "bun";

export interface ObjectStorage {
  upload(file: File): Promise<string>;
  delete(url: string): Promise<void>;
  owns(url: string): boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export class S3ObjectStorage implements ObjectStorage {
  private client: S3Client | null = null;
  private publicUrl = process.env.S3_PUBLIC_URL?.replace(/\/$/, "") ?? "";

  private getClient(): S3Client {
    return (this.client ??= new S3Client());
  }

  async upload(file: File): Promise<string> {
    if (!IMAGE_TYPES.has(file.type)) throw new Error("Image must be JPEG, PNG, or WebP");
    if (file.size > MAX_IMAGE_SIZE) throw new Error("Image must be 5 MB or smaller");
    if (!this.publicUrl) throw new Error("Image storage is not configured");
    const bytes = new Uint8Array((await file.arrayBuffer()).slice(0, 12));
    const validSignature =
      (file.type === "image/jpeg" && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) ||
      (file.type === "image/png" && bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index])) ||
      (file.type === "image/webp" && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP");
    if (!validSignature) throw new Error("Uploaded file is not a valid image");

    const key = `products/${crypto.randomUUID()}`;
    await this.getClient().file(key).write(file);
    return `${this.publicUrl}/${key}`;
  }

  async delete(url: string): Promise<void> {
    if (!this.owns(url)) return;
    await this.getClient().delete(url.slice(`${this.publicUrl}/`.length));
  }

  owns(url: string): boolean {
    return !!this.publicUrl && url.startsWith(`${this.publicUrl}/products/`);
  }
}
