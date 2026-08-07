import Link from "next/link";

export default function Footer() {
  return (
    <footer>
      {/* Level 1 - newsletter CTA inverse-surface */}
      <div className="bg-[#303030] py-12 px-5 md:px-[64px] border-b border-[#474646]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-bold text-[32px] text-white tracking-tighter" style={{ fontFamily: "Montserrat, sans-serif" }}>Envol Africa</h2>
            <p className="text-[#e4e2e1] text-[14px] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>L'excellence économique panafricaine.</p>
          </div>
          <div className="flex gap-3">
            <a className="w-10 h-10 rounded-full border border-[#e4e2e1] flex items-center justify-center text-white hover:bg-[#9e001f] hover:border-[#9e001f] transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
            <a className="w-10 h-10 rounded-full border border-[#e4e2e1] flex items-center justify-center text-white hover:bg-[#9e001f] transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
            <a className="w-10 h-10 rounded-full border border-[#e4e2e1] flex items-center justify-center text-white hover:bg-[#9e001f] transition-colors" href="#"><span className="material-symbols-outlined">share</span></a>
          </div>
        </div>
      </div>

      {/* Level 2 - 4 cols inverse-surface */}
      <div className="bg-[#303030] py-[80px] px-5 md:px-[64px]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h4 className="text-white text-[14px] mb-6 uppercase tracking-widest" style={{ fontFamily: "Inter, sans-serif", color: "#ffdad8" }}>Tous nos sites</h4>
            <ul className="text-[#e4e2e1] flex flex-col gap-3 text-[12px]" style={{ fontFamily: "Inter, sans-serif" }}>
              <li><Link className="hover:text-white transition-colors" href="/emploi">Envol Finance</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/marketplace">Envol Tech</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/financement">Envol Lifestyle</Link></li>
              <li><Link className="hover:text-white transition-colors" href="/marketplace">Marketplace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-[14px] mb-6 uppercase tracking-widest" style={{ color: "#ffdad8" }}>Nos accompagnements</h4>
            <ul className="text-[#e4e2e1] flex flex-col gap-3 text-[12px]">
              <li><Link className="hover:text-white" href="/abonnement">Formations Certifiées</Link></li>
              <li><Link className="hover:text-white" href="/service">Mentorat & Coaching</Link></li>
              <li><Link className="hover:text-white" href="/financement">Recherche de Fonds</Link></li>
              <li><Link className="hover:text-white" href="/salons">Networking</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-[14px] mb-6 uppercase tracking-widest" style={{ color: "#ffdad8" }}>Applications mobiles</h4>
            <ul className="text-[#e4e2e1] flex flex-col gap-3 text-[12px]">
              <li><a className="hover:text-white" href="#">App Store</a></li>
              <li><a className="hover:text-white" href="#">Google Play</a></li>
              <li><a className="hover:text-white" href="#">Version Liseuse</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-[14px] mb-6 uppercase tracking-widest" style={{ color: "#ffdad8" }}>Publicité</h4>
            <ul className="text-[#e4e2e1] flex flex-col gap-3 text-[12px]">
              <li><Link className="hover:text-white" href="/service">Annoncer avec nous</Link></li>
              <li><a className="hover:text-white" href="#">Nos Tarifs 2024</a></li>
              <li><a className="hover:text-white" href="#">Partenariats Événements</a></li>
              <li><Link className="hover:text-white" href="/service">Contact Régie</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Level 3 - surface-container-high */}
      <div className="bg-[#eae7e7] py-6 px-5 md:px-[64px]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-[#474646] text-[12px] gap-4" style={{ fontFamily: "Inter, sans-serif" }}>
          <p>© 2024 Envol Africa. Tous droits réservés. Conçu à Cotonou & Dakar avec passion pour l'Afrique | Paiement sécurisé par Moneroo</p>
          <div className="flex gap-6">
            <Link className="hover:text-[#9e001f] transition-colors" href="#">Terms</Link>
            <Link className="hover:text-[#9e001f] transition-colors" href="#">Privacy</Link>
            <Link className="hover:text-[#9e001f] transition-colors" href="#">Cookies</Link>
            <span className="flex items-center gap-2"><span className="w-2 h-2 bg-green-600 rounded-full"></span> Tous systèmes opérationnels</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
