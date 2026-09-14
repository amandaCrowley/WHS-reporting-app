import crypto from "node:crypto";
import { fileTypeFromBuffer } from "file-type";

export const MAX_IMAGE_COUNT = 5;
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(["jpg", "png", "gif", "webp"]);

export class ImageValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export const hashImageBuffer = (buffer) => crypto
  .createHash("sha256")
  .update(buffer)
  .digest("hex");

export const isImageHash = (value) => (
  typeof value === "string" && /^[a-f0-9]{64}$/i.test(value)
);

export const validateImageFiles = async (files = []) => {
  if (files.length > MAX_IMAGE_COUNT) {
    throw new ImageValidationError(`Maximum ${MAX_IMAGE_COUNT} images allowed.`);
  }

  const hashes = new Set();
  const validatedFiles = [];

  for (const file of files) {
    if (!file?.buffer || file.size > MAX_IMAGE_SIZE) {
      throw new ImageValidationError("Each image must be 5MB or smaller.");
    }

    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (!detectedType || !ALLOWED_IMAGE_TYPES.has(detectedType.ext)) {
      throw new ImageValidationError("Only valid JPG, PNG, GIF and WEBP image files are allowed.");
    }

    const hash = hashImageBuffer(file.buffer);
    if (hashes.has(hash)) {
      throw new ImageValidationError("The same image cannot be attached more than once.");
    }

    hashes.add(hash);
    validatedFiles.push({ file, hash, detectedType });
  }

  return validatedFiles;
};

export const isAllowedImageUrl = (imageUrl) => {
  try {
    const url = new URL(imageUrl);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
};

export const hashRemoteImage = async (imageUrl) => {
  if (!isAllowedImageUrl(imageUrl)) {
    throw new Error("Stored image URL is not a trusted Cloudinary URL.");
  }

  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("Unable to verify an existing issue image.");

  const buffer = Buffer.from(await response.arrayBuffer());
  const detectedType = await fileTypeFromBuffer(buffer);
  if (!detectedType || !ALLOWED_IMAGE_TYPES.has(detectedType.ext)) {
    throw new Error("Stored issue image is not a supported image file.");
  }

  return hashImageBuffer(buffer);
};
