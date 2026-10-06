export const STORAGE_MODULES = [
  "wab",
  "magazine",
  "marketplace",
  "crowdfunding",
  "jobs",
  "awards",
  "messaging",
  "profile",
] as const;

export type StorageModule = (typeof STORAGE_MODULES)[number];

export const STORAGE_KINDS = ["image", "video", "document", "attachment"] as const;
export type StorageKind = (typeof STORAGE_KINDS)[number];

export type StorageRule = {
  allowedMimes: string[];
  maxSizeBytes: number;
  visibility: "public" | "private";
};

// Types MIME strictement autorisés
const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];
const VIDEO_MIMES = ["video/mp4", "video/webm", "video/quicktime"];
const DOCUMENT_MIMES = ["application/pdf"];

export const MODULE_RULES: Record<StorageModule, Record<StorageKind, StorageRule | null>> = {
  wab: {
    image: { allowedMimes: IMAGE_MIMES, maxSizeBytes: 10 * 1024 * 1024, visibility: "public" },
    video: { allowedMimes: VIDEO_MIMES, maxSizeBytes: 150 * 1024 * 1024, visibility: "public" },
    document: null,
    attachment: { allowedMimes: [...IMAGE_MIMES, ...DOCUMENT_MIMES], maxSizeBytes: 10 * 1024 * 1024, visibility: "private" },
  },
  magazine: {
    image: { allowedMimes: IMAGE_MIMES, maxSizeBytes: 10 * 1024 * 1024, visibility: "public" },
    video: null,
    document: { allowedMimes: DOCUMENT_MIMES, maxSizeBytes: 100 * 1024 * 1024, visibility: "private" }, // Magazines complets protégés
    attachment: null,
  },
  marketplace: {
    image: { allowedMimes: IMAGE_MIMES, maxSizeBytes: 10 * 1024 * 1024, visibility: "public" },
    video: { allowedMimes: VIDEO_MIMES, maxSizeBytes: 150 * 1024 * 1024, visibility: "public" },
    document: { allowedMimes: DOCUMENT_MIMES, maxSizeBytes: 50 * 1024 * 1024, visibility: "private" }, // Fichiers numériques protégés
    attachment: { allowedMimes: [...IMAGE_MIMES, ...DOCUMENT_MIMES], maxSizeBytes: 10 * 1024 * 1024, visibility: "private" },
  },
  crowdfunding: {
    image: { allowedMimes: IMAGE_MIMES, maxSizeBytes: 10 * 1024 * 1024, visibility: "public" },
    video: { allowedMimes: VIDEO_MIMES, maxSizeBytes: 150 * 1024 * 1024, visibility: "public" },
    document: { allowedMimes: DOCUMENT_MIMES, maxSizeBytes: 15 * 1024 * 1024, visibility: "private" }, // Business plan / Pièces d'identité
    attachment: null,
  },
  jobs: {
    image: null,
    video: null,
    document: { allowedMimes: DOCUMENT_MIMES, maxSizeBytes: 10 * 1024 * 1024, visibility: "private" }, // CVs candidats
    attachment: null,
  },
  awards: {
    image: { allowedMimes: IMAGE_MIMES, maxSizeBytes: 10 * 1024 * 1024, visibility: "public" },
    video: { allowedMimes: VIDEO_MIMES, maxSizeBytes: 150 * 1024 * 1024, visibility: "public" },
    document: null,
    attachment: null,
  },
  messaging: {
    image: { allowedMimes: IMAGE_MIMES, maxSizeBytes: 10 * 1024 * 1024, visibility: "private" },
    video: null,
    document: { allowedMimes: DOCUMENT_MIMES, maxSizeBytes: 15 * 1024 * 1024, visibility: "private" },
    attachment: { allowedMimes: [...IMAGE_MIMES, ...DOCUMENT_MIMES], maxSizeBytes: 15 * 1024 * 1024, visibility: "private" },
  },
  profile: {
    image: { allowedMimes: IMAGE_MIMES, maxSizeBytes: 5 * 1024 * 1024, visibility: "public" }, // Avatars / Bannières
    video: null,
    document: null,
    attachment: null,
  },
};

export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "application/pdf": "pdf",
};
