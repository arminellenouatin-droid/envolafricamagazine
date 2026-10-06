export function detectBinaryMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  // PDF: %PDF-
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-") {
    return "application/pdf";
  }

  // MP4 / QuickTime: ....ftyp
  if (buffer.length >= 8 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.length >= 12 ? buffer.toString("ascii", 8, 12) : "";
    if (brand.startsWith("qt")) return "video/quicktime";
    return "video/mp4";
  }

  // WebM / Matroska: 1A 45 DF A3
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x1a &&
    buffer[1] === 0x45 &&
    buffer[2] === 0xdf &&
    buffer[3] === 0xa3
  ) {
    return "video/webm";
  }

  return null;
}

export function isValidBinaryContent(buffer: Buffer, declaredContentType: string): boolean {
  const detected = detectBinaryMimeType(buffer);
  if (!detected) return false;

  // Compatibilité MP4 / QuickTime
  if (
    (declaredContentType === "video/mp4" || declaredContentType === "video/quicktime") &&
    (detected === "video/mp4" || detected === "video/quicktime")
  ) {
    return true;
  }

  return detected === declaredContentType;
}
