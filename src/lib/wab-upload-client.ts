export type UploadedWabMedia = {
  path: string;
  mimeType: string;
  name: string;
  size?: number;
  mediaUrl?: string;
  thumbnailUrl?: string;
};

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  if (response.status === 413) {
    throw new Error(
      "Le fichier dépasse la taille maximale autorisée pour l'envoi direct (HTTP 413). Veuillez utiliser un fichier de moins de 50 Mo ou compresser la vidéo."
    );
  }
  if (!raw.trim()) {
    throw new Error(`Le serveur a renvoyé une réponse vide (HTTP ${response.status}).`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Réponse serveur inattendue (HTTP ${response.status}). Veuillez réessayer.`);
  }
}

/**
 * Capture un instantané d'une vidéo dans le navigateur sous forme de Blob JPEG
 */
export async function captureVideoThumbnail(file: File): Promise<Blob | null> {
  if (typeof window === "undefined" || !file.type.startsWith("video/")) return null;

  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      let resolved = false;
      const cleanUp = () => {
        if (!resolved) {
          resolved = true;
          URL.revokeObjectURL(url);
          video.remove();
        }
      };

      video.onloadedmetadata = () => {
        const targetTime = Math.min(1.0, video.duration > 0.5 ? video.duration * 0.25 : 0.1);
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const maxDim = 1200;
          let w = video.videoWidth || 640;
          let h = video.videoHeight || 360;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            canvas.toBlob(
              (blob) => {
                cleanUp();
                resolve(blob);
              },
              "image/jpeg",
              0.85
            );
          } else {
            cleanUp();
            resolve(null);
          }
        } catch {
          cleanUp();
          resolve(null);
        }
      };

      video.onerror = () => {
        cleanUp();
        resolve(null);
      };

      // Sécurité timeout si le navigateur met trop de temps à chercher la frame
      setTimeout(() => {
        cleanUp();
        resolve(null);
      }, 3500);
    } catch {
      resolve(null);
    }
  });
}

export async function uploadWabMedia(file: File, onProgress?: (status: string) => void): Promise<UploadedWabMedia> {
  let generatedThumbnailUrl: string | undefined = undefined;

  // Si c'est une vidéo, générer d'abord sa miniature dans le navigateur
  if (file.type.startsWith("video/")) {
    try {
      onProgress?.("Génération de l'aperçu de la vidéo…");
      const thumbBlob = await captureVideoThumbnail(file);
      if (thumbBlob) {
        const thumbName = `thumb_${file.name.replace(/\.[^/.]+$/, "")}.jpg`;
        const thumbFile = new File([thumbBlob], thumbName, { type: "image/jpeg" });
        const thumbForm = new FormData();
        thumbForm.set("file", thumbFile);
        const thumbRes = await fetch("/api/wab/upload", {
          method: "POST",
          body: thumbForm,
        });
        if (thumbRes.ok) {
          const thumbData = await readJsonResponse<{ mediaUrl?: string }>(thumbRes);
          if (thumbData.mediaUrl) {
            generatedThumbnailUrl = thumbData.mediaUrl;
          }
        }
      }
    } catch (e) {
      console.warn("Échec génération miniature vidéo:", e);
    }
  }

  // Pour les fichiers volumineux (> 3.5 Mo, ex: vidéos de 5 Mo ou plus),
  // on utilise l'upload direct signé vers Supabase Storage pour contourner la limite de 4.5 Mo de Vercel.
  if (file.size > 3.5 * 1024 * 1024) {
    try {
      onProgress?.("Préparation du téléversement sécurisé…");
      const prepareRes = await fetch("/api/wab/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prepare",
          name: file.name,
          type: file.type,
          size: file.size,
        }),
      });

      if (prepareRes.ok) {
        const prep = await readJsonResponse<{ uploadUrl?: string; token?: string; path?: string }>(prepareRes);
        if (prep.uploadUrl && prep.path) {
          onProgress?.("Téléversement direct du fichier…");
          // Upload direct avec FormData multipart comme attendu par le endpoint Supabase Storage upload/sign
          const formData = new FormData();
          formData.append("cacheControl", "3600");
          formData.append("", file);

          let putSuccess = false;
          try {
            const putRes = await fetch(prep.uploadUrl, {
              method: "PUT",
              body: formData,
            });
            if (putRes.ok) putSuccess = true;
          } catch {}

          if (!putSuccess) {
            // Tenter avec body direct si le endpoint accepte le binaire brut
            const directPut = await fetch(prep.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });
            if (directPut.ok) putSuccess = true;
          }

          if (putSuccess) {
            onProgress?.("Finalisation du média…");
            const confirmRes = await fetch("/api/wab/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "confirm",
                path: prep.path,
                name: file.name,
                mimeType: file.type,
                size: file.size,
              }),
            });

            const confirmed = await readJsonResponse<UploadedWabMedia>(confirmRes);
            if (!confirmRes.ok) throw new Error("Impossible de confirmer l'envoi du média.");
            return {
              ...confirmed,
              thumbnailUrl: generatedThumbnailUrl || confirmed.thumbnailUrl,
            };
          }
        }
      }
    } catch (directErr) {
      console.warn("Échec upload direct, tentative via API standard:", directErr);
    }
  }

  // Upload standard multipart via /api/wab/upload
  onProgress?.("Téléversement du fichier…");
  const form = new FormData();
  form.set("file", file);
  const uploadResponse = await fetch("/api/wab/upload", {
    method: "POST",
    body: form,
  });

  const uploadData = await readJsonResponse<{
    error?: string;
    path?: string;
    mimeType?: string;
    name?: string;
    size?: number;
    mediaUrl?: string;
    thumbnailUrl?: string;
  }>(uploadResponse);

  if (!uploadResponse.ok || !uploadData.path) {
    throw new Error(uploadData.error || "Téléversement impossible.");
  }

  return {
    ...uploadData,
    thumbnailUrl: generatedThumbnailUrl || uploadData.thumbnailUrl,
  } as UploadedWabMedia;
}
