"use client";

import { useEffect, useState } from "react";

async function readJson(response: Response): Promise<Record<string, any>> {
  const raw = await response.text();
  if (!raw.trim()) return {};
  try { return JSON.parse(raw) as Record<string, any>; } catch { return { error: `Réponse serveur invalide (HTTP ${response.status}).` }; }
}

type Comment = { id: string; author: string; content: string; createdAt: string };

export default function CommentsPanel({ postId, openSignal = 0, onCountChange }: { postId: string; openSignal?: number; onCountChange?: (count: number) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (openSignal > 0) setOpen(true); }, [openSignal]);
  useEffect(() => { if (!open) return; fetch(`/api/wab/posts/${postId}/comments`).then(async (response) => ({ response, data: await readJson(response) })).then(({ response, data }) => { if (!response.ok) throw new Error(String(data.error || "Commentaires indisponibles.")); setItems(Array.isArray(data.comments) ? data.comments as Comment[] : []); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Commentaires indisponibles.")); }, [open, postId]);

  async function add() {
    if (!content.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/wab/posts/${postId}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
      const data = await readJson(response);
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (!response.ok) throw new Error(String(data.error || "Commentaire impossible."));
      setItems((values) => { const next: Comment[] = [...values, data.comment as Comment]; onCountChange?.(next.length); return next; }); setContent("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Commentaire impossible."); }
    finally { setBusy(false); }
  }

  return <div className="pt-1"><button type="button" onClick={() => setOpen((value) => !value)} className="text-xs font-bold text-[#006874]">{open ? "Masquer les commentaires" : "Voir et commenter"}</button>{open && <div className="mt-3 rounded-xl bg-[#eefcfa] p-4"><div className="space-y-3">{items.map((item) => <div key={item.id} className="text-sm"><strong>{item.author}</strong><p className="mt-1 text-[#43474d]">{item.content}</p></div>)}{!items.length && <p className="text-sm text-[#43474d]">Aucun commentaire pour le moment.</p>}</div><div className="mt-4 flex gap-2"><input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Ajouter une contribution professionnelle…" className="min-w-0 flex-1 rounded-lg border border-[#c3c6ce] px-3 py-2 text-sm" /><button type="button" disabled={busy} onClick={add} className="rounded-lg bg-[#006874] px-3 py-2 text-xs font-bold text-white">Envoyer</button></div>{error && <p className="mt-2 text-xs text-red-700">{error}</p>}</div>}</div>;
}
