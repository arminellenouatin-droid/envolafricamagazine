import { randomUUID } from "node:crypto";
import { MIME_TO_EXTENSION, type StorageModule } from "./storage-rules";

export function generateStorageKey(params: {
  prefix?: string;
  module: StorageModule;
  ownerId: string;
  contentType: string;
}): string {
  const extension = MIME_TO_EXTENSION[params.contentType];
  if (!extension) {
    throw new Error(`Extension inconnue pour le type MIME : ${params.contentType}`);
  }

  // Nettoyage strict anti-traversal
  const safeOwnerId = params.ownerId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safePrefix = (params.prefix || "").replace(/\.\./g, "").replace(/^\/+/, "");

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = randomUUID();

  return `${safePrefix}${params.module}/${safeOwnerId}/${year}/${month}/${uuid}.${extension}`;
}
