"use client";
import { useState, useEffect } from "react";

export default function ArticleActions({ articleId, initialLikes }: { articleId: string, initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(()=>{
    fetch(`/api/favorites`).then(r=>r.json()).then(d=>{ if(d.favorites?.includes(articleId)) setFavorited(true); }).catch(()=>{});
    fetch(`/api/comments?articleId=${articleId}`).then(r=>r.json()).then(d=>setComments(d.comments||[])).catch(()=>{});
  },[articleId]);

  const handleLike = async () => {
    if (liked) return;
    setLikes(l=>l+1);
    setLiked(true);
    // In prod, POST to /api/articles/like
    await fetch(`/api/comments`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ articleId, content: "LIKE_PLACEHOLDER" }) }).catch(()=>{});
  };

  const handleFavorite = async () => {
    const method = favorited ? "DELETE" : "POST";
    const url = favorited ? `/api/favorites?articleId=${articleId}` : "/api/favorites";
    const res = await fetch(url, { method, headers:{ "Content-Type":"application/json" }, body: method==="POST"? JSON.stringify({ articleId }) : undefined });
    if (res.ok) setFavorited(!favorited);
    else alert("Connectez-vous pour sauvegarder");
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const res = await fetch("/api/comments", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ articleId, content: newComment }) });
    const data = await res.json();
    if (res.ok) { setComments([data.comment, ...comments]); setNewComment(""); }
    else alert(data.error || "Connectez-vous pour commenter");
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        <button onClick={handleLike} className={`h-10 px-4 rounded-full ${liked?"bg-[#0A1931] text-white":"bg-zinc-900 text-white"} text-[13px] font-semibold flex items-center gap-2`}>❤️ {likes} {liked?"Liké":"J'aime"}</button>
        <button onClick={()=>setShowComments(!showComments)} className="h-10 px-4 rounded-full border border-zinc-200 text-[13px] font-medium">💬 {comments.length} Commentaires</button>
        <button onClick={handleFavorite} className={`h-10 px-4 rounded-full border text-[13px] font-medium ${favorited?"bg-amber-100 border-amber-200 text-amber-900":"border-zinc-200"}`}>🔖 {favorited?"Sauvegardé":"Sauvegarder"}</button>
        <div className="ml-auto flex items-center gap-2 text-[12px] text-zinc-500"><span>Partager:</span><span className="flex gap-1"><button className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200">𝕏</button><button className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200">f</button><button className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200">in</button></span></div>
      </div>

      {showComments && (
        <div className="mt-6 bg-white rounded-[18px] border border-zinc-100 p-5">
          <h4 className="font-bold text-[14px] text-[#0A1931]">Commentaires ({comments.length})</h4>
          <form onSubmit={handleComment} className="mt-4 flex gap-2">
            <input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Votre commentaire..." className="flex-1 h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" />
            <button type="submit" className="h-11 px-5 rounded-full bg-[#0A1931] text-white font-bold text-[13px]">Envoyer</button>
          </form>
          <div className="mt-4 space-y-3 max-h-[360px] overflow-y-auto">
            {comments.filter((c:any)=>c.content!=="LIKE_PLACEHOLDER").map((c:any)=>(
              <div key={c.id} className="p-3 rounded-[12px] bg-zinc-50 border border-zinc-100"><div className="text-[12px] font-bold">{c.userId.slice(0,8)} • {new Date(c.createdAt).toLocaleDateString('fr-FR')}</div><div className="text-[13px] mt-1">{c.content}</div></div>
            ))}
            {comments.length===0 && <div className="text-[13px] text-zinc-500 text-center py-6">Aucun commentaire - soyez le premier</div>}
          </div>
        </div>
      )}
    </div>
  );
}
