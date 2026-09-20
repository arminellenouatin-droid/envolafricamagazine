// Route de compatibilité : le formulaire de contact public est servi par /service.
import { permanentRedirect } from "next/navigation";

export default function ContactRedirect() {
  permanentRedirect("/service");
}
