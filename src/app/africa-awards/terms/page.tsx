export default function TermsPage() {
  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[800px] mx-auto px-5 md:px-[64px] py-16">
        <h1 className="text-[36px] font-black">CGU - Conditions Générales d'Utilisation</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-4">Dernière mise à jour: 07/08/2026</p>
        <div className="mt-8 space-y-6 text-[13px] leading-7 text-[#A8A6A0]">
          <p>Bienvenue sur Africa Awards. En utilisant la plateforme, vous acceptez les présentes CGU. Seul l'administrateur peut créer et lancer une compétition. Les organisateurs ne peuvent que soumettre une demande. Les votes payants sont gérés via Moneroo avec vérification signature webhook obligatoire. Aucune donnée de paiement n'est stockée par nos serveurs.</p>
          <p>Le nombre exact de votes d'un candidat n'est jamais affiché publiquement, seul le classement relatif est visible, pour limiter les incitations à la fraude.</p>
          <p>Pour toute question: contact@africaawards.com</p>
        </div>
      </div>
    </div>
  );
}
