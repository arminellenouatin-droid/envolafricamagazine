const MAX_IMAGE_DIMENSION = 2400;
const INITIAL_QUALITY = 0.82;
const MIN_QUALITY = 0.58;
const TARGET_BYTES = 2.5 * 1024 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible."));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Compression d’image impossible."));
    }, "image/webp", quality);
  });
}

export async function optimizeImageBeforeUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;

  const image = await loadImage(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return file;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = INITIAL_QUALITY;
  let blob = await canvasBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > MIN_QUALITY) {
    quality = Math.max(MIN_QUALITY, quality - 0.08);
    blob = await canvasBlob(canvas, quality);
  }

  if (blob.size >= file.size * 0.92 && scale === 1) return file;
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: Date.now() });
}

export async function optimizeSelectedImages(files: File[]): Promise<{ files: File[]; savedBytes: number }> {
  const optimized: File[] = [];
  for (const file of files) optimized.push(await optimizeImageBeforeUpload(file));
  const savedBytes = files.reduce((total, file, index) => total + Math.max(0, file.size - optimized[index].size), 0);
  return { files: optimized, savedBytes };
}
