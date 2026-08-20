import Link from "next/link";
import { readAwardsDB } from "@/lib/awards-db";

export default function AdminDashboardAwards() {
  const db = readAwardsDB();
  const totalVotes = db.votes.length;
  const totalCompetitions = db.competitions.length;
  const totalCandidates = db.candidates.length;
  const pendingRequests = db.requests.filter(r=>r.status==="submitted").length;
  const liveCompetitions = db.competitions.filter(c=>c.status==="live_running").length;

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[32px] font-black" style={{ fontFamily: "Fraunces" }}>Admin Dashboard - Africa Awards</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Vue d'ensemble, validation demandes, création/lancement compétitions, gestion utilisateurs, paiements, rapports, paramètres - Statistiques globales - Chiffre d'affaires global, nombre lives, utilisateurs actifs, répartition par pays - Export CSV</p>

        <div className="mt-8 grid md:grid-cols-4 gap-4">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Compétitions totales</div><div className="text-[28px] font-black mt-1">{totalCompetitions}</div><div className="text-[11px] text-[#D4AF37] mt-1">{liveCompetitions} en live</div></div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Candidats</div><div className="text-[28px] font-black mt-1">{totalCandidates}</div><div className="text-[11px] text-[#A8A6A0] mt-1">12 pays représentés</div></div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Votes totaux</div><div className="text-[28px] font-black mt-1 text-[#D4AF37]">{totalVotes}</div><div className="text-[11px] text-green-400 mt-1">+12% ce mois</div></div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5"><div className="text-[11px] uppercase tracking-wider text-[#A8A6A0]">Demandes en attente</div><div className="text-[28px] font-black mt-1">{pendingRequests}</div><div className="text-[11px] text-amber-400 mt-1">À valider</div></div>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link href="/africa-awards/admin/dashboard/requests" className="bg-[#16161D] border border-white/10 rounded-xl p-6 hover:border-[#D4AF37]/30">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-xl">📋</div>
            <div className="font-bold mt-4">Validation demandes</div>
            <div className="text-[12px] text-[#A8A6A0] mt-2">{pendingRequests} demandes en attente • Étude + validation/refus avec motif</div>
          </Link>
          <Link href="/africa-awards/admin/dashboard/competitions/new" className="bg-[#D4AF37] text-black rounded-xl p-6 hover:bg-[#F4D976]">
            <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center text-xl">➕</div>
            <div className="font-bold mt-4">Créer compétition (ADMIN UNIQUEMENT)</div>
            <div className="text-[12px] text-black/70 mt-2">Seul admin peut créer/lancer - Test 403 organizer - Règle absolue gouvernance</div>
          </Link>
          <Link href="/africa-awards/admin/dashboard/applications" className="bg-[#16161D] border border-white/10 rounded-xl p-6 hover:border-[#D4AF37]/30">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">🧾</div>
            <div className="font-bold mt-4">Valider les candidatures</div>
            <div className="text-[12px] text-[#A8A6A0] mt-2">Examiner les dossiers, approuver et créer les nominés officiels</div>
          </Link>
          <Link href="/africa-awards/competitions" className="bg-[#16161D] border border-white/10 rounded-xl p-6 hover:border-[#D4AF37]/30">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-xl">🏆</div>
            <div className="font-bold mt-4">Gérer compétitions</div>
            <div className="text-[12px] text-[#A8A6A0] mt-2">Faire progresser statut cycle vie 14 états + attribution orga/animateurs/jury</div>
          </Link>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
            <h3 className="font-bold">Statistiques avancées - Recharts à venir</h3>
            <div className="mt-4 h-[160px] bg-[#0B0B0F] rounded-lg flex items-center justify-center text-[#A8A6A0] text-[12px]">Graphique CA global par mois - Recharts BarChart (Phase 3)</div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-[#0B0B0F] rounded-lg p-3 text-center"><div className="font-black text-[16px]">2.5M F</div><div className="text-[#A8A6A0]">CA global</div></div>
              <div className="bg-[#0B0B0F] rounded-lg p-3 text-center"><div className="font-black text-[16px]">150</div><div className="text-[#A8A6A0]">Lives</div></div>
              <div className="bg-[#0B0B0F] rounded-lg p-3 text-center"><div className="font-black text-[16px]">5k</div><div className="text-[#A8A6A0]">Users actifs</div></div>
            </div>
          </div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-6">
            <h3 className="font-bold">Sponsors & Publicité</h3>
            <p className="text-[12px] text-[#A8A6A0] mt-2">Gérer sponsors par compétition (logo, financement, cadeaux), espaces pub bannière/vidéo sponsorisée/pre-roll</p>
            <Link href="/africa-awards/admin/dashboard/sponsors" className="mt-4 inline-block h-9 px-4 rounded-full bg-white/10 border border-white/10 text-white text-[12px] font-bold">Gérer sponsors →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
