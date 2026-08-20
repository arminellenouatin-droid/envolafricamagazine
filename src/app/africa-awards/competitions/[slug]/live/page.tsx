"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function LivePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [competition, setCompetition] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [spectators] = useState(0);
  const [pot, setPot] = useState(0);
  const [liveSession, setLiveSession] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(()=>{
    fetch(`/api/awards/competitions?slug=${slug}`).then(r=>r.json()).then(d=>{
      setCompetition(d.competition);
      if (d.competition) {
        fetch(`/api/awards/candidates?competition_id=${d.competition.id}`).then(r=>r.json()).then(cd=>setCandidates(cd.candidates||[]));
      }
    });

    let active = true;
    const loadLive = async () => {
      const live = await fetch(`/api/awards/live?competition_id=${encodeURIComponent(slug)}`).then(r=>r.json()).catch(() => null);
      if (!active || !live) return;
      setLiveSession(live.session || null);
      if (live.events) {
        setComments(live.events.filter((event:any) => ["comment","gift","donation","pot_increase"].includes(event.event_type)).map((event:any) => ({ user: event.payload?.user_name || "Participant", text: event.payload?.content || event.event_type, time: new Date(event.created_at).toLocaleTimeString().slice(0,5), isGift: event.event_type === "gift" })));
        setPot(live.events.reduce((sum:number,event:any) => sum + Number(event.payload?.amount_xof || 0), 0));
      }
    };
    loadLive();
    const interval = setInterval(loadLive, 5000);
    return () => { active = false; clearInterval(interval); };
  },[slug]);

  useEffect(()=>{
    // Simule classement live top 5 avec flèches
    if (candidates.length>0) {
      setRanking(candidates.slice(0,5).map((c:any,i:number)=>({
        id: c.id,
        name: c.display_name,
        votes: c.votes,
        change: "stable",
        pos: i+1
      })).sort((a:any,b:any)=>b.votes-a.votes).map((r:any,i:number)=>({ ...r, pos: i+1 })));
    }
  },[candidates]);

  const sendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const session = await fetch(`/api/awards/live?competition_id=${encodeURIComponent(slug)}`).then(r=>r.json()).catch(()=>null);
    if (!session?.session?.id) return;
    await fetch("/api/awards/live", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action:"event", session_id:session.session.id, event_type:"comment", payload:{ content:newComment.trim() } }) });
    setNewComment("");
  };

  const sendGift = async (gift: any) => {
    const candidate = candidates[0];
    if (!candidate || !competition) return;
    const giftCatalog = await fetch("/api/awards/gifts").then(r=>r.json()).catch(()=>null);
    const selected = giftCatalog?.gifts?.find((item:any)=>item.name===gift.name);
    if (!selected) return;
    const payment = await fetch("/api/awards/payments/init", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ product:"award_gift", competition_id:competition.id, candidate_id:candidate.id, gift_id:selected.id, gift_name:selected.name }) }).then(r=>r.json()).catch(()=>null);
    if (payment?.checkout_url) window.location.href = payment.checkout_url;
  };

  if (!competition) return <div className="bg-[#0B0B0F] text-white min-h-screen p-10">Chargement live...</div>;

  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen">
      {/* Live Overlay complet - cœur du produit */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B2A6B]/40 to-[#0B0B0F]/60"></div>
        <div className="w-full h-full bg-[#16161D] flex items-center justify-center text-[24px] font-bold">{liveSession?.mux_playback_id ? <video className="w-full h-full object-cover" controls autoPlay muted src={`https://stream.mux.com/${liveSession.mux_playback_id}.m3u8`} /> : liveSession?.status === "live" ? `🔴 LIVE - ${competition.title} — flux en attente` : `Le live de ${competition.title} n’est pas démarré`}</div>
        
        {/* Haut: spectateurs, durée, cagnotte, logo compétition */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
          <div className="flex items-center gap-3">
            <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full animate-pulse">● LIVE</span>
            <span className="bg-black/60 backdrop-blur text-white text-[11px] px-3 py-1 rounded-full flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span>{spectators} spectateurs</span>
            <span className="bg-black/60 backdrop-blur text-white text-[11px] px-3 py-1 rounded-full">⏱ 12:34</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold px-3 py-1 rounded-full">Cagnotte: {(pot/100).toLocaleString()} F</span>
            <span className="bg-black/60 backdrop-blur text-white text-[11px] px-3 py-1 rounded-full">{competition.title.slice(0,20)}...</span>
          </div>
        </div>

        {/* Gauche: classement live 5 premiers avec flèches évolution */}
        <div className="absolute left-4 top-20 bottom-20 w-64 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 p-3 z-20 hidden lg:block">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#D4AF37] mb-3">Classement Live Top 5</div>
          <div className="space-y-2">
            {ranking.map((r:any)=>(
              <div key={r.id} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                <div className="flex items-center gap-2"><span className="text-[12px] font-black w-4">{r.pos}</span><span className="text-[12px] truncate max-w-[100px]">{r.name}</span></div>
                <div className="flex items-center gap-1"><span className="text-[11px]">{r.votes}</span><span className={`text-[12px] ${r.change==="up"?"text-green-400":"text-red-400"}`}>{r.change==="up"?"↑":"↓"}</span></div>
              </div>
            ))}
          </div>
        </div>

        {/* Droite: commentaires, réactions, cadeaux */}
        <div className="absolute right-4 top-20 bottom-20 w-80 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex flex-col z-20 hidden lg:flex">
          <div className="p-3 border-b border-white/10 text-[11px] font-bold uppercase tracking-wider">Chat Live • {comments.length} messages</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {comments.map((c:any,i:number)=>(
              <div key={i} className={`text-[12px] ${c.isGift?"bg-[#D4AF37]/20 border border-[#D4AF37]/30 rounded-lg p-2":""}`}><span className="font-bold text-[#D4AF37]">{c.user}:</span> {c.text} <span className="text-[10px] text-white/40">{c.time}</span></div>
            ))}
          </div>
          <form onSubmit={sendComment} className="p-3 border-t border-white/10 flex gap-2">
            <input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Commenter..." className="flex-1 h-9 rounded-full bg-white/10 border border-white/10 px-4 text-[12px] placeholder-white/40" />
            <button type="submit" className="w-9 h-9 rounded-full bg-[#D4AF37] text-black flex items-center justify-center">➤</button>
          </form>
        </div>

        {/* Bas: boutons Voter/Soutenir/Cadeau/Don/Rejoindre */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
          <Link href={`/africa-awards/vote/${candidates[0]?.id||"demo"}`} className="h-11 px-6 rounded-full bg-[#D4AF37] text-black font-bold text-[13px] flex items-center gap-2 hover:bg-[#F4D976]"><span>🗳️</span> Voter</Link>
          <button onClick={()=>sendGift({name:"Cœur"})} className="h-11 px-5 rounded-full bg-white/10 border border-white/10 backdrop-blur text-white font-bold text-[13px] hover:bg-white/15">🎁 Cadeau</button>
          <button onClick={async()=>{ if(!competition) return; const payment=await fetch("/api/awards/payments/init",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({product:"award_donation",competition_id:competition.id,amount_xof:100})}).then(r=>r.json()); if(payment.checkout_url) window.location.href=payment.checkout_url; }} className="h-11 px-5 rounded-full bg-white/10 border border-white/10 backdrop-blur text-white font-bold text-[13px] hover:bg-white/15">💰 Don (100 F min.)</button>
          <button className="h-11 px-5 rounded-full bg-[#1B2A6B] text-white font-bold text-[13px] border border-white/10">Cagnotte {(pot/100).toLocaleString()} F</button>
        </div>
      </div>

      {/* Mobile overlay bas fixe */}
      <div className="lg:hidden bg-[#16161D] border-t border-white/10 p-4">
        <h3 className="font-bold text-[14px]">Classement Live</h3>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {ranking.map((r:any)=>(
            <div key={r.id} className="flex-none w-32 bg-white/5 rounded-xl p-3 text-center"><div className="font-bold">{r.pos}. {r.name.split(' ')[0]}</div><div className="text-[11px] text-[#A8A6A0]">{r.votes} votes</div><div className={`text-[12px] ${r.change==="up"?"text-green-400":"text-red-400"}`}>{r.change==="up"?"↑":"↓"}</div></div>
          ))}
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-8 grid lg:grid-cols-[2fr_1fr] gap-8">
        <div>
          <h2 className="text-[20px] font-bold">Candidats en direct</h2>
          <div className="mt-4 grid md:grid-cols-3 gap-4">
            {candidates.slice(0,6).map((c:any)=>(
              <div key={c.id} className="bg-[#16161D] border border-white/10 rounded-xl p-4">
                <img src={c.photo_url} alt="" className="w-full aspect-[4/3] object-cover rounded-lg" />
                <div className="font-bold mt-3 text-[14px]">{c.display_name}</div>
                <div className="text-[11px] text-[#A8A6A0] mt-1">{c.votes} votes • {c.gifts} cadeaux • {(c.donations/100).toLocaleString()} F dons</div>
                <Link href={`/africa-awards/candidates/${c.id}`} className="mt-3 block text-center h-9 rounded-full bg-white/10 border border-white/10 text-[12px] font-bold leading-9">Voir profil</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-5">
            <h3 className="font-bold text-[14px]">Cadeaux virtuels - Catalogue (visible que pendant live)</h3>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { name:"Cœur", icon:"❤️", price:"1 F", points:10 },
                { name:"Étoile", icon:"⭐", price:"2 F", points:25 },
                { name:"Fusée", icon:"🚀", price:"5 F", points:60 },
                { name:"Couronne", icon:"👑", price:"10 F", points:120 },
                { name:"Diamant", icon:"💎", price:"20 F", points:250 },
                { name:"Coffre", icon:"💰", price:"50 F", points:600 },
              ].map(g=>(
                <button key={g.name} onClick={()=>sendGift(g.name)} className="bg-[#0B0B0F] border border-white/10 rounded-xl p-3 text-center hover:border-[#D4AF37]/30 group">
                  <div className="text-[24px] group-hover:scale-110 transition-transform">{g.icon}</div>
                  <div className="text-[11px] font-bold mt-1">{g.name}</div>
                  <div className="text-[10px] text-[#A8A6A0]">{g.price} • {g.points} pts</div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#A8A6A0] mt-3">Envoi → paiement Moneroo → webhook vérifié → animation temps réel diffusée à tous spectateurs (nom expéditeur + cadeau + candidat)</p>
          </div>

          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl p-5">
            <h4 className="font-bold text-[13px] text-[#D4AF37]">Cagnotte temps réel - 3 types dons distincts</h4>
            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex justify-between"><span className="text-[#A8A6A0]">Soutien candidat</span><span>Don libre + animation donateur/candidat/montant</span></div>
              <div className="flex justify-between"><span className="text-[#A8A6A0]">Soutien plateforme</span><span>Don dev Awards</span></div>
              <div className="flex justify-between"><span className="text-[#A8A6A0]">Augmentation cagnotte</span><span>Disponible pendant live → grand prix affiché</span></div>
              <div className="flex justify-between"><span className="text-[#A8A6A0]">Capital Angel</span><span>Startup - objectif barre progression + investisseurs anonymat</span></div>
            </div>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#D4AF37]" style={{ width: `${Math.min(100, (pot/100000)*100)}%` }}></div></div>
            <div className="text-[11px] text-[#A8A6A0] mt-1">Objectif: 100000 F - Actuel: {(pot/100).toLocaleString()} F</div>
          </div>
        </div>
      </div>
    </div>
  );
}
