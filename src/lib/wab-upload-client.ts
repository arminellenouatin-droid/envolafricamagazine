export type UploadedWabMedia = {
  path: string;
  mimeType: string;
  name: string;
  size?: number;
  mediaUrl?: string;
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

export async function uploadWabMedia(file: File, onProgress?: (status: string) => void): Promise<UploadedWabMedia> {
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
            return confirmed;
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
  }>(uploadResponse);

  if (!uploadResponse.ok || !uploadData.path) {
    throw new Error(uploadData.error || "Téléversement impossible.");
  }

  return uploadData as UploadedWabMedia;
}
