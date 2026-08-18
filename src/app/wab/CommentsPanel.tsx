"use client";

import { useEffect, useState } from "react";

type Comment = { id: string; author: string; content: string; createdAt: string };

export default function CommentsPanel({ postId, openSignal = 0, onCountChange }: { postId: string; openSignal?: number; onCountChange?: (count: number) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (openSignal > 0) setOpen(true); }, [openSignal]);
  useEffect(() => { if (!open) return; fetch(`/api/wab/posts/${postId}/comments`).then((response) => response.json()).then((data) => setItems(data.comments ?? [])).catch(() => setError("Commentaires indisponibles.")); }, [open, postId]);

  async function add() {
    if (!content.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/wab/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await response.json();
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (!response.ok) throw new Error(data.error);
      setItems((values) => { const next = [...values, data.comment]; onCountChange?.(next.length); return next; }); setContent("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Commentaire impossible."); }
    finally { setBusy(false); }
  }

  return <div className="pt-1"><button type="button" onClick={() => setOpen((value) => !value)} className="text-xs font-bold text-[#006874]">{open ? "Masquer les commentaires" : "Voir et commenter"}</button>{open && <div className="mt-3 rounded-xl bg-[#eefcfa] p-4"><div className="space-y-3">{items.map((item) => <div key={item.id} className="text-sm"><strong>{item.author}</strong><p className="mt-1 text-[#43474d]">{item.content}</p></div>)}{!items.length && <p className="text-sm text-[#43474d]">Aucun commentaire pour le moment.</p>}</div><div className="mt-4 flex gap-2"><input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Ajouter une contribution professionnelle…" className="min-w-0 flex-1 rounded-lg border border-[#c3c6ce] px-3 py-2 text-sm" /><button type="button" disabled={busy} onClick={add} className="rounded-lg bg-[#006874] px-3 py-2 text-xs font-bold text-white">Envoyer</button></div>{error && <p className="mt-2 text-xs text-red-700">{error}</p>}</div>}</div>;
}
