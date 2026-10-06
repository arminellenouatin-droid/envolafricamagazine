import "server-only";

export type StorageObjectRecord = {
  id: string;
  owner_id: string;
  module: string;
  kind: string;
  visibility: "public" | "private";
  bucket: string;
  key: string;
  content_type: string;
  bytes: number;
  status: "pending" | "ready" | "deleted";
  ref_type?: string | null;
  ref_id?: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  role?: string;
};

export async function canReadObject(user: AuthUser | null, object: StorageObjectRecord): Promise<boolean> {
  // Les objets publics sont lisibles par tous
  if (object.visibility === "public") {
    return true;
  }

  // Si l'objet est privé, une session est obligatoire
  if (!user) {
    return false;
  }

  // L'administrateur a accès à tout pour l'audit et la modération
  if (user.role === "admin") {
    return true;
  }

  // Le propriétaire du fichier a toujours accès à son fichier
  if (user.id === object.owner_id) {
    return true;
  }

  // Points d'extension métier spécifiques par module (CV d'emploi, fichiers vendus, etc.)
  // Les vérifications supplémentaires par entité liée peuvent s'insérer ici
  return false;
}
