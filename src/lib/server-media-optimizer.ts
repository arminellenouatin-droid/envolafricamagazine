import sharp from "sharp";

const MAX_IMAGE_DIMENSION = 2400;
const INITIAL_QUALITY = 82;
const MIN_SAVING_RATIO = 0.92;

export type OptimizedUpload = {
  buffer: Buffer;
  contentType: string;
  extension: string;
  originalSize: number;
  finalSize: number;
  optimized: boolean;
};

export async function optimizeImageBuffer(input: Buffer, originalName: string, contentType: string): Promise<OptimizedUpload> {
  if (!contentType.startsWith("image/") || contentType === "image/svg+xml" || contentType === "image/gif") {
    return { buffer: input, contentType, extension: extensionFromName(originalName, contentType), originalSize: input.length, finalSize: input.length, optimized: false };
  }
  const output = await sharp(input, { failOn: "none" })
    .rotate()
    .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: INITIAL_QUALITY, effort: 4 })
    .toBuffer();
  if (output.length >= input.length * MIN_SAVING_RATIO) {
    return { buffer: input, contentType, extension: extensionFromName(originalName, contentType), originalSize: input.length, finalSize: input.length, optimized: false };
  }
  return { buffer: output, contentType: "image/webp", extension: "webp", originalSize: input.length, finalSize: output.length, optimized: true };
}

function extensionFromName(name: string, contentType: string) {
  const fromName = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (fromName) return fromName;
  return contentType.split("/")[1]?.replace("jpeg", "jpg") || "bin";
}
