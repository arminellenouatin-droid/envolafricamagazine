"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TwoFactorPage() {
  const [user, setUser] = useState<any>(null);
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(()=>{
    fetch("/api/auth/me").then(r=>r.json()).then(d=>setUser(d.user));
  },[]);

  const enable2FA = async () => {
    // Mock 2FA enable - in prod, generate secret + QR code + verify TOTP
    const res = await fetch("/api/auth/2fa", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ action: "enable" }) });
    const data = await res.json();
    if (data.success) {
      setEnabled(true);
      alert("2FA activée ! (mock) - Secret: " + data.secret + " - Utilisez une app Authenticator avec code 123456 pour test");
    }
  };

  const verify = async () => {
    if (code==="123456" || code==="000000") {
      await fetch("/api/auth/2fa", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ action: "verify", code }) });
      window.location.href = "/admin";
    } else {
      alert("Code invalide - test: 123456");
    }
  };

  if (!user) return <div className="p-10 text-center">Chargement...</div>;

  const needs2FA = ["redacteur","redacteur_chef","gerant","admin"].includes(user.role) && !user.twoFactorEnabled && !enabled;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-[#FFFCF5]">
      <div className="w-full max-w-[480px] bg-white rounded-[24px] border border-zinc-100 shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8">
        <h1 className="font-serif font-black text-2xl text-[#0A1931]">Double vérification requise</h1>
        <p className="text-sm text-zinc-600 mt-2">Les comptes équipe (rédacteur, rédacteur_chef, gérant, admin) doivent activer la 2FA avant d'accéder au back-office. C'est une règle de sécurité non négociable.</p>
        
        <div className="mt-6 rounded-[14px] bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900">
          <strong>Utilisateur:</strong> {user.prenom} {user.nom} • {user.role} • {user.email}
        </div>

        {needs2FA ? (
          <div className="mt-6">
            <h3 className="font-bold text-sm">Activer la 2FA</h3>
            <p className="text-xs text-zinc-500 mt-1">Scannez le QR code avec Google Authenticator, Authy, etc.</p>
            <div className="mt-4 w-full h-48 bg-zinc-100 rounded-[12px] flex items-center justify-center text-zinc-400">QR Code Mock • Secret: EAM-{user.id.slice(0,8)}</div>
            <button onClick={enable2FA} className="mt-4 w-full h-11 rounded-full bg-[#0A1931] text-white font-bold text-sm">Activer 2FA</button>
          </div>
        ) : (
          <div className="mt-6">
            <h3 className="font-bold text-sm">Entrez votre code 2FA</h3>
            <input value={code} onChange={e=>setCode(e.target.value)} placeholder="123456" className="mt-2 w-full h-11 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-sm" />
            <button onClick={verify} className="mt-3 w-full h-11 rounded-full bg-[#D4AF37] text-[#0A1931] font-bold text-sm">Vérifier →</button>
            <div className="mt-2 text-xs text-zinc-500 text-center">Test code: 123456</div>
          </div>
        )}
      </div>
    </div>
  );
}
