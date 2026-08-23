// Route de compatibilité : le formulaire de contact public est servi par /service.
import { redirect } from "next/navigation";

export default function ContactRedirect() {
  redirect("/service");
}
