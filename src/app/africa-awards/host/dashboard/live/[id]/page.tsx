"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Candidate = { id: string; display_name?: string };
type CandidateState = { invited?: boolean; removed?: boolean; muted?: boolean };

export default function HostDashboard() {
  const params = useParams();
  const id = params.id as string;
  const [isLive, setIsLive] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateStates, setCandidateStates] = useState<Record<string, CandidateState>>({});
  const [spectators, setSpectators] = useState(0);
  const [invitee, setInvitee] = useState("");
  const [notice, setNotice] = useState("");
  const [comments, setComments] = useState([{ id: "demo-comment", author: "Aminata", content: "Go go!" }]);

  useEffect(() => {
    fetch(`/api/awards/candidates?competition_id=${id}`).then((response) => response.json()).then((data) => setCandidates(data.candidates || [])).catch(() => setCandidates([{ id: "1", display_name: "Candidat 1" }, { id: "2", display_name: "Candidat 2" }]));
    const interval = window.setInterval(() => setSpectators((value) => value + Math.floor(Math.random() * 3)), 2000);
    return () => window.clearInterval(interval);
  }, [id]);

  const updateCandidate = (candidateId: string, patch: CandidateState) => setCandidateStates((states) => ({ ...states, [candidateId]: { ...states[candidateId], ...patch } }));
  const invite = () => { if (!invitee.trim()) return; setNotice(`Invitation envoyée à ${invitee.trim()}.`); setInvitee(""); };

  return (
    <div className="min-h-screen bg-[#0B0B0F] p-6 text-white">
      <h1 className="text-[24px] font-black" style={{ fontFamily: "Fraunces" }}>Dashboard Animateur — Live {id.slice(0, 8)}</h1>
      <p className="mt-2 text-[12px] text-[#A8A6A0]">Contrôle du live, candidats présents, invités, commentaires, classement et statistiques.</p>
      {notice && <p role="status" className="mt-4 rounded-xl bg-[#D4AF37]/15 p-3 text-[12px] text-[#D4AF37]">{notice}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#16161D] p-4"><div><div className="font-bold">Statut : {isLive ? "🔴 EN DIRECT" : "⚫ Hors ligne"}</div><div className="text-[11px] text-[#A8A6A0]">Spectateurs : {spectators}</div></div><div className="flex gap-2"><button onClick={() => { setIsLive(true); setNotice("Le live est démarré."); }} className="h-9 rounded-full bg-green-600 px-4 text-[12px] font-bold">Démarrer Live</button><button onClick={() => { setIsLive(false); setNotice("Le live est arrêté."); }} className="h-9 rounded-full bg-red-600 px-4 text-[12px] font-bold">Arrêter Live</button></div></div>
          <div className="rounded-xl border border-white/10 bg-[#16161D] p-4"><h3 className="font-bold text-[14px]">Candidats présents</h3><div className="mt-3 space-y-2">{candidates.filter((candidate) => !candidateStates[candidate.id]?.removed).map((candidate) => { const state = candidateStates[candidate.id] || {}; return <div key={candidate.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0B0B0F] p-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[12px]">{candidate.display_name?.[0]}</div><span className="text-[13px] font-bold">{candidate.display_name}</span></div><div className="flex gap-1"><button onClick={() => { updateCandidate(candidate.id, { invited: !state.invited }); setNotice(state.invited ? "Candidat retiré de l’antenne." : "Candidat invité à l’antenne."); }} className="h-7 rounded-full bg-[#D4AF37] px-2 text-[10px] font-bold text-black">{state.invited ? "Retirer antenne" : "Inviter à l’antenne"}</button><button onClick={() => updateCandidate(candidate.id, { removed: true })} className="h-7 rounded-full bg-white/10 px-2 text-[10px]">Retirer</button><button onClick={() => updateCandidate(candidate.id, { muted: !state.muted })} className="h-7 rounded-full bg-white/10 px-2 text-[10px]">{state.muted ? "Réactiver" : "Couper audio"}</button></div></div>; })}</div></div>
          <div className="rounded-xl border border-white/10 bg-[#16161D] p-4"><h3 className="font-bold text-[14px]">Inviter un membre du public</h3><div className="mt-3 flex gap-2"><input value={invitee} onChange={(event) => setInvitee(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") invite(); }} placeholder="Email ou pseudo..." className="h-9 flex-1 rounded-full border border-white/10 bg-[#0B0B0F] px-4 text-[12px]" /><button onClick={invite} className="h-9 rounded-full bg-white/10 px-4 text-[11px]">Inviter</button></div></div>
        </div>
        <div className="space-y-4"><div className="rounded-xl border border-white/10 bg-[#16161D] p-4"><h4 className="font-bold text-[13px]">Commentaires — modération</h4><div className="mt-3 max-h-[200px] space-y-2 overflow-y-auto">{comments.map((comment) => <div key={comment.id} className="rounded bg-[#0B0B0F] p-2 text-[12px]"><span>{comment.author}: {comment.content}</span><button onClick={() => setComments((items) => items.filter((item) => item.id !== comment.id))} className="ml-2 text-[10px] text-red-400">Supprimer</button><button onClick={() => { setComments((items) => items.filter((item) => item.id !== comment.id)); setNotice(`${comment.author} a été banni du live.`); }} className="ml-1 text-[10px] text-red-400">Bannir</button></div>)}</div></div><div className="rounded-xl border border-white/10 bg-[#16161D] p-4"><h4 className="font-bold text-[13px]">Statistiques live</h4><div className="mt-3 space-y-2 text-[12px]"><div className="flex justify-between"><span className="text-[#A8A6A0]">Spectateurs</span><span className="font-bold">{spectators}</span></div><div className="flex justify-between"><span className="text-[#A8A6A0]">Cagnotte</span><span className="font-bold text-[#D4AF37]">5 200 F</span></div><div className="flex justify-between"><span className="text-[#A8A6A0]">Votes</span><span className="font-bold">1,2 k</span></div></div></div><div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-4"><div className="text-[11px] font-bold text-[#D4AF37]">À l’arrêt du live : clôture automatique des votes et génération du replay.</div></div></div>
      </div>
    </div>
  );
}
