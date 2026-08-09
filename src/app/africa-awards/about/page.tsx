import Link from "next/link";
export default function AboutPage() {
  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-5 md:px-[64px] py-16">
        <h1 className="text-[42px] font-black leading-[0.9]" style={{ fontFamily: "Fraunces" }}>À propos - Vision, Mission, Valeurs, Équipe, Partenaires</h1>
        <div className="mt-8 space-y-8">
          <section><h2 className="text-[20px] font-bold text-[#D4AF37]">Vision</h2><p className="text-[14px] leading-7 text-[#A8A6A0] mt-3">Créer la plus grande plateforme africaine de compétitions, récompenses et diffusion en direct, permettant aux talents de se faire connaître et de développer leurs projets.</p></section>
          <section><h2 className="text-[20px] font-bold text-[#D4AF37]">Mission</h2><p className="text-[14px] leading-7 text-[#A8A6A0] mt-3">Devenir la référence africaine des compétitions et cérémonies diffusées en direct, offrir un tremplin de visibilité continental, permettre aux organisations d'organiser des événements de qualité sous cadre unifié contrôlé, générer revenus votes/cadeaux/dons/sponsoring/pub, construire communauté gamification.</p></section>
          <section><h2 className="text-[20px] font-bold text-[#D4AF37]">Valeurs</h2><ul className="mt-3 space-y-2 text-[14px] text-[#A8A6A0]"><li><strong className="text-white">Transparence</strong> - vote, classements, fonds</li><li><strong className="text-white">Innovation</strong> - expérience interactive TikTok Live</li><li><strong className="text-white">Équité</strong> - cadre contrôlé cohérent</li><li><strong className="text-white">Excellence</strong> - qualité production cérémonies internationales</li><li><strong className="text-white">Inclusion</strong> - accessible à tous talents africains</li><li><strong className="text-white">Promotion talents africains</strong> - cœur raison d'être</li></ul></section>
          <section><h2 className="text-[20px] font-bold text-[#D4AF37]">Équipe</h2><p className="text-[14px] text-[#A8A6A0] mt-3">Équipe Envol Africa Groupe - Cotonou & Dakar - Passionnée par l'Afrique - 2.5M+ spectateurs - 150+ compétitions - 25 pays</p></section>
        </div>
      </div>
    </div>
  );
}
