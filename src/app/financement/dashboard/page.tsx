import Link from "next/link";
export default function DashboardCrowd() {
  return (
    <div className="bg-[#fcf9f8] min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Montserrat" }}>Dashboard Crowdfunding</h1>
        <p className="text-[#5c403f] text-[13px] mt-2">Espace du porteur de projet + Espace de l'investisseur + Suivi des collectes + Cagnottes - Même entête/pieds de page que toutes les plateformes, même paiement Moneroo, mêmes APIs</p>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Link href="/financement/dashboard/porteur" className="bg-white rounded-xl border p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-[#9e001f]/10 flex items-center justify-center text-xl">🚀</div>
            <div className="font-bold text-[18px] mt-4">Je suis porteur de projet</div>
            <div className="text-[13px] text-[#5c403f] mt-2">Créer compte avec email/tel/mdp + code vérif SMS/mail + docs identité/entreprise + Google/Facebook login - Créer projet nom/secteur/description/vidéos/images/PDF/montant/risque/durée/types financement - Gérer collecte modifier/historique/docs/chiffres utiles/messagerie/retraits - Suivi après collecte rapports mensuels/trimestriels + remboursement automatique prêts</div>
            <div className="mt-4 h-10 rounded-full bg-[#9e001f] text-white flex items-center justify-center font-bold text-[13px]">Espace porteur →</div>
          </Link>
          <Link href="/financement/dashboard/investisseur" className="bg-[#303030] text-white rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">💰</div>
            <div className="font-bold text-[18px] mt-4">Je suis investisseur</div>
            <div className="text-[13px] text-[#e4e2e1] mt-2">Créer compte email/tel + code vérif + docs identité + niveau connaissance finance - Parcourir projets filtres secteur/montant/type/pays/risque/avancement - 3 façons investir don/prise part/pret + contrat PDF auto + calendrier remboursement - Suivre investissements historique/docs/contrats/calendrier/évolution/messagerie/parts valeur mise à jour</div>
            <div className="mt-4 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-[13px]">Espace investisseur →</div>
          </Link>
        </div>
        <div className="mt-8 bg-white rounded-xl border p-6">
          <h3 className="font-bold">Suivi des collectes - 6 étapes</h3>
          <div className="mt-4 grid md:grid-cols-6 gap-2 text-[11px]">
            {["En attente validation","En cours","Objectif atteint/dépassé","Terminé sans objectif","Clôturé","En litige"].map(s=>(
              <div key={s} className="bg-[#f6f3f2] border rounded-lg p-3 text-center"><div className="font-bold">{s}</div></div>
            ))}
          </div>
          <div className="mt-4 grid md:grid-cols-4 gap-3 text-[11px]">
            <div className="bg-[#f6f3f2] rounded-lg p-3"><div className="font-bold">Barre progression %</div><div className="text-[#5c403f] mt-1">Montant collecté / recherché</div></div>
            <div className="bg-[#f6f3f2] rounded-lg p-3"><div className="font-bold">Nb investisseurs</div><div className="text-[#5c403f]">Personnes ayant investi</div></div>
            <div className="bg-[#f6f3f2] rounded-lg p-3"><div className="font-bold">Répartition</div><div className="text-[#5c403f]">Dons / Parts / Prêts</div></div>
            <div className="bg-[#f6f3f2] rounded-lg p-3"><div className="font-bold">Temps restant</div><div className="text-[#5c403f]">Avant fin collecte</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
