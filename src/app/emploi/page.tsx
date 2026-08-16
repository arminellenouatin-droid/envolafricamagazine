import type { Metadata } from "next";
import JobsClient from "./JobsClient";

export const metadata: Metadata = {
  title: "Envol Africa Jobs | Emploi dans les 54 pays d’Afrique",
  description: "Trouvez une opportunité, publiez votre candidature ou recrutez les meilleurs talents africains avec Envol Africa Jobs.",
};

export default function EmploiPage() {
  return <JobsClient />;
}
