import Link from "next/link";

const cardClass = "bg-[#16161D] border border-white/10 rounded-xl p-6";
const actionClass = "mt-4 inline-flex h-9 items-center rounded-full bg-white/10 px-4 text-[12px] text-white transition hover:bg-[#D4AF37] hover:text-black";

export default function PressPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] pb-20 text-white">
      <div className="mx-auto max-w-[960px] px-5 py-16 md:px-[64px]">
        <div className="mb-8 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-[#A8A6A0]"><Link href="/africa-awards" className="transition hover:text-[#D4AF37]">Africa Awards</Link><span>›</span><span>Presse</span></div>
        <h1 className="text-[36px] font-black">Presse — logo, communiqués, photos</h1>
        <p className="mt-3 text-[#A8A6A0]">Accédez aux ressources publiques d’Africa Awards. Les téléchargements et galeries disponibles sont ouverts sans connexion.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className={cardClass}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20 text-2xl">🖼️</div><h3 className="mt-4 font-bold">Logo Envol Africa</h3><p className="mt-2 text-[12px] text-[#A8A6A0]">Version couleur PNG disponible immédiatement.</p><a href="/logo-couleur-entete.png" download="envol-africa-logo.png" className={actionClass}>Télécharger PNG</a></div>
          <div className={cardClass}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20 text-2xl">📰</div><h3 className="mt-4 font-bold">Communiqués</h3><p className="mt-2 text-[12px] text-[#A8A6A0]">Retrouvez les annonces et informations éditoriales publiées.</p><Link href="/africa-awards/about#actualites" className={actionClass}>Voir les informations</Link></div>
          <div className={cardClass}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/20 text-2xl">📸</div><h3 className="mt-4 font-bold">Photos</h3><p className="mt-2 text-[12px] text-[#A8A6A0]">Consultez la galerie des éditions et événements disponibles.</p><Link href="/africa-awards/gallery" className={actionClass}>Voir la galerie</Link></div>
        </div>
      </div>
    </div>
  );
}
