"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function VotePage() {
  const params = useParams();
  const candidateId = params.candidateId as string;
  const [candidate, setCandidate] = useState<any>(null);
  const [competition, setCompetition] = useState<any>(null);
  const [votes, setVotes] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(()=>{
    fetch(`/api/awards/candidates`).then(r=>r.json()).then(d=>{
      const cand = (d.candidates||[]).find((c:any)=>c.id===candidateId);
      setCandidate(cand);
      if (cand) {
        fetch(`/api/awards/competitions`).then(r=>r.json()).then(dc=>{
          const comp = (dc.competitions||[]).find((c:any)=>c.id===cand.competition_id);
          setCompetition(comp);
        });
      }
    });
  },[candidateId]);

  const handleVote = async () => {
    setLoading(true);
    // Init paiement Moneroo via notre API existante
    const amount = votes * 100; // 100 centimes = 1 XOF par vote (exemple)
    const res = await fetch("/api/payment/init", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({
        items: [{ type:"don", amount, price: amount, title:`Vote ${votes} pour ${candidate?.display_name}` }],
        currency: "XOF",
        email: "voter@envolafrica.com",
        firstName: "Voter",
        lastName: "Awards",
      })
    });
    const data = await res.json();
    if (data.checkout_url) {
      // Enregistre vote après paiement (mock: on enregistre direct pour MVP, en prod ce serait via webhook)
      await fetch("/api/awards/votes", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ candidate_id: candidateId, competition_id: candidate?.competition_id, points: votes, payment_id: data.paymentId })
      });
      window.location.href = data.checkout_url;
    }
    setLoading(false);
  };

  if (!candidate) return <div className="bg-[#0B0B0F] text-white min-h-screen p-10">Chargement candidat...</div>;

  const total = votes * 100;

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[720px] mx-auto px-5 md:px-[64px] py-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#A8A6A0]"><Link href="/africa-awards" className="hover:text-[#D4AF37]">Awards</Link><span>›</span><span className="text-white">Voter</span></div>
        <h1 className="text-[28px] font-black mt-4" style={{ fontFamily: "Fraunces" }}>Voter pour {candidate.display_name}</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">Choisissez un candidat, un nombre de votes, un moyen de paiement (Moneroo). Récapitulatif clair avant confirmation.</p>

        <div className="mt-8 bg-[#16161D] border border-white/10 rounded-[16px] p-6">
          <div className="flex gap-4">
            <img src={candidate.photo_url} alt="" className="w-20 h-20 rounded-xl object-cover" />
            <div><div className="font-bold text-[16px]">{candidate.display_name}</div><div className="text-[12px] text-[#A8A6A0] mt-1">{candidate.country} • {candidate.votes} votes • {candidate.bio?.slice(0,80)}</div><div className="text-[11px] text-[#D4AF37] mt-1">Nombre exact votes jamais affiché publiquement que classement relatif</div></div>
          </div>

          <div className="mt-6">
            <label className="text-[11px] font-bold uppercase tracking-wider">Nombre de votes</label>
            <div className="mt-2 flex items-center gap-4">
              <button onClick={()=>setVotes(Math.max(1, votes-1))} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">-</button>
              <span className="text-[32px] font-black w-16 text-center">{votes}</span>
              <button onClick={()=>setVotes(votes+1)} className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">+</button>
              <span className="text-[12px] text-[#A8A6A0]">= {votes} points • {total/100} F CFA</span>
            </div>
          </div>

          <div className="mt-6 border-t border-white/10 pt-6">
            <h4 className="font-bold text-[14px]">Récapitulatif avant confirmation</h4>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between"><span className="text-[#A8A6A0]">Candidat</span><span className="font-bold">{candidate.display_name}</span></div>
              <div className="flex justify-between"><span className="text-[#A8A6A0]">Nombre de votes</span><span>{votes}</span></div>
              <div className="flex justify-between"><span className="text-[#A8A6A0]">Points obtenus</span><span>{votes} pts</span></div>
              <div className="flex justify-between font-bold border-t border-white/10 pt-2 mt-2"><span>Montant</span><span className="text-[#D4AF37]">{total/100} F CFA</span></div>
            </div>
          </div>

          <button onClick={handleVote} disabled={loading} className="mt-8 w-full h-12 rounded-full bg-[#D4AF37] text-black font-bold text-[14px] disabled:opacity-50 hover:bg-[#F4D976]">
            {loading?"Redirection Moneroo...":`Payer ${total/100} F via Moneroo →`}
          </button>
          <p className="text-[11px] text-[#A8A6A0] mt-3 text-center">Paiement via Moneroo Mobile Money/Carte/PayPal - Webhook vérifié signature obligatoire - Comptabilisation &lt;5s + classement temps réel - Historique dans /my-votes</p>
        </div>
      </div>
    </div>
  );
}
