"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function JuryScoring() {
  const params = useParams();
  const competitionId = params.competitionId as string;
  const [candidates, setCandidates] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number, comment: string }>>({});

  useEffect(()=>{
    fetch(`/api/awards/candidates?competition_id=${competitionId}`).then(r=>r.json()).then(d=>setCandidates(d.candidates||[]));
  },[competitionId]);

  const saveScore = (candidateId: string) => {
    const s = scores[candidateId];
    if (!s) return;
    fetch("/api/awards/jury-scores", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ competition_id: competitionId, candidate_id: candidateId, score: s.score, comment: s.comment }) })
      .then(()=>alert(`Note ${s.score} enregistrée pour ${candidateId} - modifiable jusqu'à clôture délibération`));
  };

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen p-6">
      <h1 className="text-[24px] font-black" style={{ fontFamily: "Fraunces" }}>Dashboard Jury - Notation - {competitionId.slice(0,8)}</h1>
      <p className="text-[#A8A6A0] text-[12px] mt-2">Grille de notation définie par admin, notes et commentaires modifiables jusqu'à clôture délibération, classement jury en cours, calcul final combine auto vote public/jury selon pondération admin, admin visualise détail calcul avant publication officielle</p>

      <div className="mt-8 space-y-4 max-w-[800px]">
        {candidates.map((c:any)=>(
          <div key={c.id} className="bg-[#16161D] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-4">
              <img src={c.photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
              <div><div className="font-bold">{c.display_name}</div><div className="text-[11px] text-[#A8A6A0]">{c.country} • {c.votes} votes</div></div>
            </div>
            <div className="mt-4 grid grid-cols-[100px_1fr] gap-4 items-start">
              <div><label className="text-[11px] font-bold uppercase">Note /20</label><input type="number" min="0" max="20" step="0.5" value={scores[c.id]?.score||""} onChange={e=>setScores({...scores, [c.id]: { ...scores[c.id], score: parseFloat(e.target.value), comment: scores[c.id]?.comment||"" }})} className="mt-1 w-full h-10 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[14px]" /></div>
              <div><label className="text-[11px] font-bold uppercase">Observations</label><textarea value={scores[c.id]?.comment||""} onChange={e=>setScores({...scores, [c.id]: { score: scores[c.id]?.score||0, comment: e.target.value }})} placeholder="Commentaires..." className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-3 text-[13px]" rows={2} /></div>
            </div>
            <button onClick={()=>saveScore(c.id)} className="mt-3 h-8 px-4 rounded-full bg-[#D4AF37] text-black font-bold text-[11px]">Enregistrer note</button>
          </div>
        ))}
        {candidates.length===0 && <div className="text-center py-20 text-[#A8A6A0]">Aucun candidat - Les candidats apparaissent ici après validation admin</div>}
      </div>

      <div className="mt-10 max-w-[800px] bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-5">
        <h4 className="font-bold text-[13px] text-[#D4AF37]">Classement final calculé automatiquement</h4>
        <p className="text-[12px] text-[#A8A6A0] mt-2">Fonction serveur compute_final_ranking(competition_id) selon pondération définie (ex: 70% public / 30% jury). Appelable uniquement par admin. Admin peut visualiser détail calcul avant publication officielle.</p>
      </div>
    </div>
  );
}
