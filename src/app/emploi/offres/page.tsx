// Route de compatibilité : la liste publique des offres est servie par la page Jobs /emploi.
import { redirect } from "next/navigation";

export default function JobsOffersRedirect() {
  redirect("/emploi");
}
