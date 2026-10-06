"use client";

import { useState, useRef, useCallback } from "react";
import type { StorageModule, StorageKind } from "./storage-rules";

export type UploadResult = {
  id: string;
  key: string;
  url?: string;
  thumbnailKey?: string;
  thumbnailUrl?: string;
};

export type UseFileUploadOptions = {
  module: StorageModule;
  kind: StorageKind;
  onProgress?: (percent: number) => void;
};

/**
 * Compresse une image côté client en WebP (qualité 0.8) avec max 1920px (512px pour avatars).
 */
async function compressImage(file: File, isAvatar: boolean = false): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file; // Ne pas compresser les GIFs animés ou non-images
  }

  return new Promise((resolve) => {
    const maxDimension = isAvatar ? 512 : 1920;
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(file); // Fallback
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
            type: "image/webp",
            lastModified: Date.now(),
          });
          // Ne conserver que si la taille compressée est effectivement plus petite
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/webp",
        0.8
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Extrait une miniature d'une vidéo côté client.
 */
async function extractVideoThumbnail(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;
    const url = URL.createObjectURL(file);

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(1280, video.videoWidth || 640);
      canvas.height = Math.min(720, video.videoHeight || 360);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) {
              resolve(new File([blob], "thumbnail.webp", { type: "image/webp" }));
            } else {
              resolve(null);
            }
          },
          "image/webp",
          0.8
        );
      } else {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    video.src = url;
  });
}

export function useFileUpload({ module, kind, onProgress }: UseFileUploadOptions) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
  }, []);

  const uploadDirect = useCallback(
    async (fileToUpload: File, presignUrl: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
            onProgress?.(percent);
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Échec de l'envoi vers le stockage distant (statut ${xhr.status})`));
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("Erreur réseau lors du transfert direct."));
        };

        xhr.onabort = () => {
          xhrRef.current = null;
          reject(new Error("Upload annulé."));
        };

        xhr.open("PUT", presignUrl, true);
        xhr.setRequestHeader("Content-Type", fileToUpload.type);
        xhr.send(fileToUpload);
      });
    },
    [onProgress]
  );

  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        // 1. Prétraitement : compression ou extraction de miniature
        let processedFile = file;
        let thumbnailFile: File | null = null;

        if (kind === "image") {
          processedFile = await compressImage(file, module === "profile");
        } else if (kind === "video") {
          thumbnailFile = await extractVideoThumbnail(file);
        }

        // 2. Présignature du fichier principal
        const presignRes = await fetch("/api/storage/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            module,
            kind,
            contentType: processedFile.type,
            size: processedFile.size,
          }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json().catch(() => ({}));
          throw new Error(data.message || data.error || "Impossible d'initialiser l'envoi du fichier.");
        }

        const presignData = await presignRes.json();

        // 3. Envoi direct vers Cloudflare R2 avec reprise automatique (3 tentatives)
        let attempts = 0;
        let uploaded = false;
        while (attempts < 3 && !uploaded) {
          try {
            attempts++;
            await uploadDirect(processedFile, presignData.uploadUrl);
            uploaded = true;
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            if (msg === "Upload annulé.") throw e;
            if (attempts >= 3) throw e;
            await new Promise((r) => setTimeout(r, 1000 * attempts));
          }
        }

        // 4. Confirmation de l'objet
        const confirmRes = await fetch("/api/storage/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: presignData.id }),
        });

        if (!confirmRes.ok) {
          const data = await confirmRes.json().catch(() => ({}));
          throw new Error(data.message || data.error || "Échec de validation du fichier.");
        }

        const confirmData = await confirmRes.json();

        // 5. Envoi optionnel de la miniature vidéo
        let thumbnailResult: UploadResult | null = null;
        if (thumbnailFile) {
          try {
            const thumbPresign = await fetch("/api/storage/presign", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                module,
                kind: "image",
                contentType: thumbnailFile.type,
                size: thumbnailFile.size,
              }),
            });
            if (thumbPresign.ok) {
              const thumbData = await thumbPresign.json();
              await uploadDirect(thumbnailFile, thumbData.uploadUrl);
              const thumbConfirm = await fetch("/api/storage/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: thumbData.id }),
              });
              if (thumbConfirm.ok) {
                thumbnailResult = await thumbConfirm.json();
              }
            }
          } catch {
            // La miniature est optionnelle, ne bloque pas le résultat principal
          }
        }

        setIsUploading(false);
        setProgress(100);

        return {
          id: confirmData.id,
          key: confirmData.key,
          url: confirmData.publicUrl,
          thumbnailKey: thumbnailResult?.key,
          thumbnailUrl: thumbnailResult?.url,
        };
      } catch (err: unknown) {
        setIsUploading(false);
        const errMsg = err instanceof Error ? err.message : "Une erreur est survenue lors du chargement.";
        setError(errMsg);
        return null;
      }
    },
    [module, kind, uploadDirect]
  );

  return { upload, progress, isUploading, error, cancel };
}
