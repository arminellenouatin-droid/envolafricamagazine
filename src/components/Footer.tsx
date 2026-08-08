import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      {/* Niveau 1 - fond noir - logo + texte 2 lignes */}
      <div className="bg-[#1b1c1c] py-10 px-5 md:px-[64px] border-b border-white/10">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start gap-6">
          <img src="/logo-blanc-footer.png" alt="ENVOL AFRICA MAG" className="h-[56px] w-auto object-contain" />
          <p className="text-white text-[13px] leading-6 max-w-[720px]" style={{ fontFamily: "Inter, sans-serif" }}>
            Une chaine regroupant toutes les valeurs pour votre succès en entreprises. Plus qu'un magazine, c'est le seul outil qui vous apporte tout pour réussir en affaires et prospérer à tout égard.
          </p>
        </div>
      </div>

      {/* Niveau 2 - fond noir - 4 listes */}
      <div className="bg-[#1b1c1c] py-12 px-5 md:px-[64px]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Col 1 - Tous nos sites */}
          <div>
            <h4 className="text-white text-[13px] font-bold uppercase tracking-widest mb-4" style={{ color: "#ffdad8" }}>Tous nos sites</h4>
            <ul className="space-y-3 text-[12px] text-[#e4e2e1]" style={{ fontFamily: "Inter" }}>
              <li><a href="https://crowfunding.envolafrica.net/" target="_blank" className="hover:text-white transition-colors">Crowdfunding</a></li>
              <li><a href="https://kiosque.envolafrica.net/" target="_blank" className="hover:text-white">Kiosque</a></li>
              <li><a href="https://wab.envolafrica.net/" target="_blank" className="hover:text-white">World Africa Business</a></li>
              <li><a href="https://marketplace.envolafrica.net/" target="_blank" className="hover:text-white">Marketplace</a></li>
              <li><a href="https://jobs.envolafrica.net/" target="_blank" className="hover:text-white">Jobs</a></li>
              <li><a href="https://aa.envolafrica.net/" target="_blank" className="hover:text-white">Africa Awards</a></li>
            </ul>
          </div>

          {/* Col 2 - Nos accompagnements */}
          <div>
            <h4 className="text-white text-[13px] font-bold uppercase tracking-widest mb-4" style={{ color: "#ffdad8" }}>Nos accompagnements</h4>
            <ul className="space-y-3 text-[12px] text-[#e4e2e1]">
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Ingénierie digitale</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Newsletters</a></li>
              <li><Link href="/abonnement" className="hover:text-white">Abonnement</Link></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Levée de fonds et accompagnement</a></li>
              <li><Link href="/affiliation" className="hover:text-white">Programme d'affiliation</Link></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Kit média</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Recherche de financement</a></li>
            </ul>
          </div>

          {/* Col 3 - Applications / Externalisation */}
          <div>
            <h4 className="text-white text-[13px] font-bold uppercase tracking-widest mb-4" style={{ color: "#ffdad8" }}>Applications & Services</h4>
            <ul className="space-y-3 text-[12px] text-[#e4e2e1]">
              <li><a href="https://direct.kkiapay.me/4788/business-angel-1" target="_blank" className="hover:text-white">Sur Android</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Sur iPhone</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Sur Huawei</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Externalisation / Applications</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Recherche de financement</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Formation et recyclage</a></li>
            </ul>
          </div>

          {/* Col 4 - Publicité / Suivi */}
          <div>
            <h4 className="text-white text-[13px] font-bold uppercase tracking-widest mb-4" style={{ color: "#ffdad8" }}>Publicité & Suivi</h4>
            <ul className="space-y-3 text-[12px] text-[#e4e2e1]">
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Publicité</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Suivi complet</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Applications</a></li>
              <li><Link href="/service" className="hover:text-white">Contact Régie</Link></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">Mentions Légales</a></li>
              <li><a href="https://envolafrica.net/" target="_blank" className="hover:text-white">CGU / Confidentialité</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Niveau 3 - fond gris légèrement clair */}
      <div className="bg-[#eae7e7] py-5 px-5 md:px-[64px]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#1c1b1b] text-[12px]">©2026 <a href="https://envolafrica.net/" target="_blank" className="font-bold hover:text-[#9e001f]">Envol Africa</a> Groupe. Tous droits réservés</p>
          <div className="flex items-center gap-6 text-[12px] text-[#474646]">
            <a href="https://envolafrica.net/" target="_blank" className="hover:text-[#9e001f]">Terms</a>
            <span className="text-[#e5bdbb]">;</span>
            <a href="https://envolafrica.net/" target="_blank" className="hover:text-[#9e001f]">Privacy</a>
            <span className="text-[#e5bdbb]">;</span>
            <a href="https://envolafrica.net/" target="_blank" className="hover:text-[#9e001f]">Cookies</a>
            <span className="hidden md:flex items-center gap-2 ml-4"><span className="w-2 h-2 bg-green-600 rounded-full"></span> Paiement Moneroo sécurisé</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
