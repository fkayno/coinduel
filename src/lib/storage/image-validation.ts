import sharp from "sharp";

/**
 * SERVER-ONLY. Validates and normalizes an uploaded avatar image.
 *
 * Never trusts the filename extension or the client-declared MIME type —
 * both are attacker-controlled. Instead:
 *  1. Sniffs the actual file signature (magic bytes) to confirm it's really
 *     a JPEG/PNG/WEBP, rejecting anything else (including a renamed .exe,
 *     .html, or SVG with an embedded script).
 *  2. Re-decodes and re-encodes the image through sharp/libvips. This is a
 *     real security boundary, not just validation theater — a polyglot
 *     file (valid image bytes + appended malicious payload) gets fully
 *     discarded, since only the decoded pixel data survives re-encoding.
 *  3. Normalizes every upload to a fixed-size square WEBP, which is also
 *     the compression/performance step (large uploads never get stored
 *     at their original size).
 */

export const MAX_AVATAR_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const AVATAR_OUTPUT_SIZE = 512;

export class InvalidImageError extends Error {}

type SniffedType = "jpeg" | "png" | "webp";

function sniffImageType(bytes: Buffer): SniffedType | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)) {
    return "png";
  }

  const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46;
  const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (isRiff && isWebp) return "webp";

  return null;
}

/**
 * Validates an uploaded avatar and returns normalized, safe-to-store WEBP
 * bytes. Throws InvalidImageError with a user-facing message on any
 * rejection (unsupported/spoofed format, corrupt data, oversized).
 */
export async function processAvatarUpload(bytes: Buffer): Promise<Buffer> {
  if (bytes.length === 0) {
    throw new InvalidImageError("The uploaded file is empty.");
  }
  if (bytes.length > MAX_AVATAR_UPLOAD_BYTES) {
    throw new InvalidImageError("Image must be 5MB or smaller.");
  }

  const sniffed = sniffImageType(bytes);
  if (!sniffed) {
    throw new InvalidImageError("Unsupported file. Please upload a JPG, PNG, or WEBP image.");
  }

  try {
    return await sharp(bytes, { failOn: "error" })
      .rotate() // apply EXIF orientation before the square crop
      .resize(AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new InvalidImageError("Could not process this image. Try a different file.");
  }
}
