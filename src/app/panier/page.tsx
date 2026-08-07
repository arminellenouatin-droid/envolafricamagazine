"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SHIPPING_RATES } from "@/lib/constants";

export default function PanierPage() {
  const [cart, setCart] = useState<any[]>([]);
  const [country, setCountry] = useState<string>("BJ");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string|null>(null);
  const [affiliate, setAffiliate] = useState<string>("");

  useEffect(()=>{
    const saved = localStorage.getItem("eam_cart");
    if (saved) setCart(JSON.parse(saved));
    const aff = localStorage.getItem("eam_affiliate") || "";
    setAffiliate(aff);
    // check if return from payment
    const params = new URLSearchParams(window.location.search);
    const oid = params.get("order_id");
    const verify = params.get("verify");
    const mock = params.get("mock_success");
    if (oid && (verify || mock)) {
      setOrderId(oid);
      // verify
      fetch("/api/payment/verify", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ orderId: oid, paymentId: params.get("payment_id") }) })
        .then(r=>r.json()).then(data=>{
          if (data.success) {
            alert("Paiement confirmé ! Merci pour votre commande. Vous recevrez vos accès par email.");
            localStorage.removeItem("eam_cart");
            setCart([]);
          }
        });
    }
  },[]);

  const subtotal = cart.reduce((s,i)=>s+(i.price||0),0);
  const hasPrint = cart.some(i=>i.format==="papier" || i.format==="audio_papier");
  const shipping = hasPrint ? (SHIPPING_RATES[country] || SHIPPING_RATES.default) : 0;
  const total = subtotal + shipping;

  const removeItem = (idx:number) => {
    const newCart = cart.filter((_,i)=>i!==idx);
    setCart(newCart);
    localStorage.setItem("eam_cart", JSON.stringify(newCart));
  };

  const checkout = async () => {
    if (cart.length===0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payment/init", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ items: cart, currency: "XOF", shippingCountry: country, affiliateCode: affiliate, email, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur paiement");
      // redirect to checkout_url
      window.location.href = data.checkout_url;
    } catch (e:any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 xl:px-8 pt-8">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500"><Link href="/" className="hover:text-[#0A1931]">Accueil</Link><span>›</span><span className="text-[#0A1931]">Panier</span></div>
        <h1 className="font-serif font-black text-[28px] md:text-[36px] text-[#0A1931] mt-4">Votre panier • {cart.length} article{cart.length!==1 && 's'}</h1>

        {cart.length===0 ? (
          <div className="mt-16 text-center bg-white rounded-[24px] border border-zinc-100 p-12">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-2xl">🛒</div>
            <div className="font-serif font-bold text-xl text-[#0A1931] mt-5">Votre panier est vide</div>
            <p className="text-zinc-500 text-sm mt-2">Découvrez notre kiosque ou nos abonnements</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/kiosque" className="h-11 px-6 rounded-full bg-[#0A1931] text-white font-bold text-sm flex items-center gap-2">Kiosque →</Link>
              <Link href="/abonnement" className="h-11 px-6 rounded-full border border-zinc-200 bg-white font-medium text-sm">Voir les abonnements</Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="space-y-3">
              {cart.map((item, idx)=>(
                <div key={idx} className="bg-white rounded-[18px] border border-zinc-100 p-4 flex gap-4">
                  {item.cover ? <img src={item.cover} alt="" className="w-20 h-28 rounded-[10px] object-cover" /> : <div className="w-20 h-28 rounded-[10px] bg-zinc-100 flex items-center justify-center text-xs">{item.type}</div>}
                  <div className="flex-1">
                    <div className="font-bold text-[14px] text-[#0A1931]">{item.title}</div>
                    <div className="text-[12px] text-zinc-500 mt-1">{item.type==="magazine" ? `Format: ${item.format} • Langue: ${item.language?.toUpperCase()} • N°${item.numero}` : `Plan: ${item.planId}`}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-[16px] text-[#0A1931]">{item.price?.toLocaleString()} F CFA</span>
                      <button onClick={()=>removeItem(idx)} className="text-[12px] text-zinc-500 hover:text-red-600">Retirer</button>
                    </div>
                  </div>
                </div>
              ))}
              {affiliate && (
                <div className="bg-amber-50 border border-amber-200 rounded-[14px] p-4 flex items-center gap-3 text-[13px] text-amber-900">
                  <span className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center font-bold">%</span>
                  Code parrainage actif: <strong>{affiliate}</strong> • -10% sera appliqué si éligible (actualisation au paiement)
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white rounded-[24px] border border-zinc-100 p-6">
                <h3 className="font-bold text-[16px] text-[#0A1931]">Résumé</h3>
                <div className="mt-4 space-y-2.5 text-[13px]">
                  <div className="flex justify-between"><span className="text-zinc-500">Sous-total</span><span className="font-semibold">{subtotal.toLocaleString()} F CFA</span></div>
                  {hasPrint && (
                    <div>
                      <div className="flex justify-between"><span className="text-zinc-500">Livraison</span><span className="font-semibold">{shipping.toLocaleString()} F CFA</span></div>
                      <select value={country} onChange={e=>setCountry(e.target.value)} className="mt-2 w-full h-10 rounded-full border border-zinc-200 bg-zinc-50 px-4 text-[13px]">
                        <option value="BJ">Bénin • 2 000 F</option>
                        <option value="CI">Côte d'Ivoire • 2 500 F</option>
                        <option value="SN">Sénégal • 3 000 F</option>
                        <option value="NG">Nigeria • 4 000 F</option>
                        <option value="FR">France • 8 000 F</option>
                        <option value="US">USA • 12 000 F</option>
                      </select>
                    </div>
                  )}
                  <div className="border-t border-zinc-100 pt-3 flex justify-between text-[15px] font-black"><span>Total</span><span className="text-[#0A1931]">{total.toLocaleString()} F CFA</span></div>
                </div>

                <div className="mt-6 space-y-3">
                  <input placeholder="Email (si invité)" value={email} onChange={e=>setEmail(e.target.value)} className="w-full h-11 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[13px] focus:outline-none focus:border-[#0A1931] focus:bg-white" />
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="Prénom" value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full h-11 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[13px]" />
                    <input placeholder="Nom" value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full h-11 rounded-full border border-zinc-200 bg-zinc-50 px-5 text-[13px]" />
                  </div>
                </div>

                <button onClick={checkout} disabled={loading} className="mt-6 w-full h-12 rounded-full bg-[#0A1931] text-white font-bold text-[14px] hover:bg-black disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? "Redirection..." : <>Payer via Moneroo → <span className="text-[11px] bg-white/20 rounded-full px-2 py-0.5">Mobile Money & Carte</span></>}
                </button>
                <div className="mt-3 text-center text-[11px] text-zinc-500">
                  Paiement sécurisé • Aucune donnée bancaire stockée • Vérification anti-fraude
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {["MTN","Orange","Moov","Wave","Visa","Mastercard"].map(m=>(
                    <div key={m} className="h-8 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600">{m}</div>
                  ))}
                </div>
              </div>

              <div className="mt-4 bg-[#0A1931] rounded-[18px] p-4 text-white flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center text-[#0A1931] font-bold shrink-0">!</div>
                <div className="text-[12px] leading-5"><strong>Liens expirants protégés</strong><br/>Vos téléchargements PDF/audio sont protégés par des liens sécurisés expirant en 24h. Impossible à partager publiquement.</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
