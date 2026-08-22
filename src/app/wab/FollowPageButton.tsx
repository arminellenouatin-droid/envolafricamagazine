/*
 * Direction Atelier de preuve WAB : action de page compacte et réversible.
 * L’état est toujours confirmé par l’API serveur avant affichage final.
 */
"use client";

import { useEffect, useState } from "react";

export default function FollowPageButton({ pageId }: { pageId?: string }) {
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!pageId) return;
    fetch(`/api/wab/pages/${encodeURIComponent(pageId)}/follow`, { credentials: "include" })
      .then((response) => response.json())
      .then((data) => setFollowing(Boolean(data.following)))
      .catch(() => undefined);
  }, [pageId]);

  async function toggle() {
    if (!pageId) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/wab/pages/${encodeURIComponent(pageId)}/follow`, { method: "POST", credentials: "include" });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) { window.location.assign(`/auth/login?next=${encodeURIComponent("/wab")}`); return; }
      if (!response.ok) throw new Error(data.error || "Action impossible.");
      setFollowing(Boolean(data.following));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Action impossible."); }
    finally { setBusy(false); }
  }

  if (!pageId) return null;
  return <div className="flex flex-col gap-1"><button type="button" onClick={() => void toggle()} disabled={busy} className="w-full rounded-xl border border-[#9adbd4] px-3 py-2 text-[10px] font-extrabold text-[#006874] hover:bg-[#eefcfa] disabled:opacity-50">{busy ? "…" : following ? "Abonné" : "S’abonner"}</button>{message && <span role="alert" className="text-[9px] leading-4 text-[#9e001f]">{message}</span>}</div>;
}
