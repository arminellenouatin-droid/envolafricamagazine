"use client";
import { useEffect, useState } from "react";

export default function ParametresPage(){
  const [user,setUser]=useState<any>(null);
  const [lang,setLang]=useState("fr");
  const [currency,setCurrency]=useState("XOF");
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [passwordMessage,setPasswordMessage]=useState("");
  const [passwordError,setPasswordError]=useState("");
  const [passwordLoading,setPasswordLoading]=useState(false);
  const [avatar, setAvatar] = useState<string | undefined>();
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  useEffect(()=>{ fetch("/api/auth/me").then(r=>r.json()).then(d=>{ setUser(d.user); if (d.user){ setLang(d.user.lang); setCurrency(d.user.currency); setAvatar(d.user.avatar); } }); },[]);

  async function saveAvatar() {
    if (!selectedAvatar) { setAvatarMessage("Choisissez d’abord une photo."); return; }
    setAvatarLoading(true); setAvatarMessage("");
    try {
      const formData = new FormData(); formData.append("file", selectedAvatar);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d’enregistrer la photo.");
      setAvatar(data.avatar); setUser((current: any) => current ? { ...current, avatar: data.avatar } : current); setSelectedAvatar(null); setAvatarMessage("Photo de profil enregistrée. Actualisation...");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) { setAvatarMessage(error instanceof Error ? error.message : "Impossible d’enregistrer la photo."); }
    finally { setAvatarLoading(false); }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPasswordMessage(""); setPasswordError(""); setPasswordLoading(true);
    try {
      const response = await fetch("/api/auth/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de modifier le mot de passe.");
      setPasswordMessage(data.message); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) { setPasswordError(error instanceof Error ? error.message : "Impossible de modifier le mot de passe."); }
    finally { setPasswordLoading(false); }
  }

  const passwordStrong = newPassword.length >= 12 && /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  return (
    <div className="space-y-6">
      <h1 className="font-serif font-black text-[24px] text-[#0A1931]">Paramètres</h1>
      <div className="bg-white rounded-[20px] border p-6 space-y-6">
        <div><div className="font-bold text-[14px]">Photo de profil</div><div className="mt-3 flex flex-wrap items-center gap-4"><div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-[#0A1931] text-xl font-bold text-white">{avatar ? <img src={avatar} alt="Votre photo de profil" className="h-full w-full object-cover" /> : `${user?.prenom?.[0] || ""}${user?.nom?.[0] || ""}`}</div><div><label className="inline-flex cursor-pointer items-center rounded-full border border-[#0A1931] px-4 py-2 text-[12px] font-bold text-[#0A1931]">Choisir une photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setSelectedAvatar(e.target.files?.[0] || null)} disabled={avatarLoading} className="sr-only" /></label><button type="button" onClick={saveAvatar} disabled={avatarLoading || !selectedAvatar} className="ml-2 rounded-full bg-[#0A1931] px-4 py-2 text-[12px] font-bold text-white disabled:opacity-50">{avatarLoading ? "Enregistrement..." : "Enregistrer la photo"}</button><p className="mt-2 text-[11px] text-zinc-500">{selectedAvatar?.name || "JPG, PNG ou WebP · 5 Mo maximum."}</p>{avatarMessage && <p className="mt-1 text-[12px] text-emerald-700">{avatarMessage}</p>}</div></div></div>
        <div><div className="font-bold text-[14px]">Informations personnelles</div><div className="mt-3 grid md:grid-cols-2 gap-3"><input defaultValue={user?.prenom} placeholder="Prénom" className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /><input defaultValue={user?.nom} placeholder="Nom" className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /><input defaultValue={user?.email} placeholder="Email" className="md:col-span-2 h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /></div></div>
        <div><div className="font-bold text-[14px]">Langue & devise</div><div className="mt-3 flex gap-2"><select value={lang} onChange={e=>setLang(e.target.value)} className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]"><option value="fr">Français</option><option value="en">English</option><option value="es">Español</option></select><select value={currency} onChange={e=>setCurrency(e.target.value)} className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]"><option value="XOF">F CFA</option><option value="EUR">EUR €</option><option value="USD">USD $</option><option value="NGN">NGN ₦</option></select></div></div>
        <form onSubmit={changePassword} className="border-t pt-6"><div className="flex items-center justify-between gap-3"><div><div className="font-bold text-[14px]">Mot de passe</div><p className="mt-1 text-[12px] leading-5 text-zinc-500">Changez votre mot de passe depuis cet espace. L’ancien mot de passe est exigé avant toute modification.</p></div><span className="material-symbols-outlined text-[#0A1931]">lock_reset</span></div><div className="mt-4 grid gap-3 md:grid-cols-3"><input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Mot de passe actuel" className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /><input required type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Nouveau mot de passe" className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /><input required type="password" autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Confirmer le nouveau mot de passe" className="h-11 rounded-full border bg-zinc-50 px-5 text-[13px]" /></div><div className={`mt-2 text-[11px] ${newPassword.length === 0 ? "text-zinc-500" : passwordStrong ? "text-emerald-700" : "text-amber-700"}`}>{newPassword.length === 0 ? "12 caractères minimum, avec majuscule, minuscule, chiffre et caractère spécial." : passwordStrong ? "Niveau de sécurité suffisant." : "Le mot de passe ne respecte pas encore tous les critères."}</div>{passwordError && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{passwordError}</div>}{passwordMessage && <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">{passwordMessage}</div>}<button disabled={passwordLoading} className="mt-4 h-11 rounded-full bg-[#0A1931] px-6 text-[13px] font-bold text-white disabled:opacity-60">{passwordLoading ? "Modification..." : "Changer mon mot de passe"}</button></form>
        <div><div className="font-bold text-[14px]">Sécurité avancée</div><div className="mt-3 rounded-[12px] bg-amber-50 border border-amber-100 p-4 text-[12px] text-amber-900">Comptes équipe (rédacteur, rédacteur-chef, gérant, admin) doivent activer la double vérification 2FA avant d'accéder au back-office. <button className="ml-2 font-bold underline">Activer 2FA</button></div></div>
        <button type="button" onClick={saveAvatar} disabled={avatarLoading || !selectedAvatar} className="h-11 px-6 rounded-full bg-[#0A1931] text-white font-bold text-[13px] disabled:opacity-50">{avatarLoading ? "Enregistrement..." : "Enregistrer les modifications"}</button>
      </div>
    </div>
  );
}
