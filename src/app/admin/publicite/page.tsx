import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUserFromCookie } from "@/lib/auth";
import AdminPubliciteClient from "./AdminPubliciteClient";

export const metadata: Metadata = {
  title: "Administration Régie Envol Ads | Envol Africa Magazine",
  description: "Modération des annonces, gestion des 16 slots, paramétrage CPM/CPC et traitement des signalements.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPublicitePage() {
  const user = await getCurrentUserFromCookie();
  if (!user) {
    redirect("/auth/login?redirect=/admin/publicite");
  }

  if (!["admin", "gerant", "redacteur_chef"].includes(user.role)) {
    redirect("/");
  }

  const safeUser = {
    id: user.id,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    role: user.role,
  };

  return <AdminPubliciteClient user={safeUser} />;
}
