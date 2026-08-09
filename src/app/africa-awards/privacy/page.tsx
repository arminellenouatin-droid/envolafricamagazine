export default function PrivacyPage() {
  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[800px] mx-auto px-5 md:px-[64px] py-16">
        <h1 className="text-[36px] font-black">Politique de confidentialité</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-4">Dernière mise à jour: 07/08/2026 - Conforme RGPD + lois locales concours/paiements</p>
        <div className="mt-8 space-y-6 text-[13px] leading-7 text-[#A8A6A0]">
          <p>Nous collectons uniquement les données réellement nécessaires: email, nom, avatar, votes, paiements (références transaction Moneroo uniquement, pas de données carte), candidatures.</p>
          <p>Droit d'accès, rectification, suppression: via /profile → Export RGPD / Droit à l'effacement.</p>
          <p>Données paiement jamais stockées directement (Moneroo gère). Minimisation des données.</p>
          <p>Cookies: nécessaires, analytics (Plausible), marketing (avec consentement).</p>
          <p>Contact DPO: dpo@africaawards.com</p>
        </div>
      </div>
    </div>
  );
}
