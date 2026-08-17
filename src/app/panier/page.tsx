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
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [affiliate, setAffiliate] = useState<string>("");

  useEffect(()=>{
    const saved = localStorage.getItem("eam_cart");
    if (saved) setCart(JSON.parse(saved));
    const aff = localStorage.getItem("eam_affiliate") || "";
    setAffiliate(aff);
    const params = new URLSearchParams(window.location.search);
    const oid = params.get("order_id");
    const verify = params.get("verify");
    const mock = params.get("mock_success");
    if (oid && (verify || mock)) {
      fetch("/api/payment/verify", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ orderId: oid, paymentId: params.get("payment_id") }) })
        .then(r=>r.json()).then(data=>{
          if (data.success) {
            alert("Paiement confirmé ! Merci pour votre commande.");
            localStorage.removeItem("eam_cart");
            setCart([]);
          }
        });
    }
  },[]);

  const subtotal = cart.reduce((s,i)=>s+(i.price||0),0);
  const hasPrint = cart.some(i=>i.format==="papier" || i.format==="audio_papier");
  const shipping = hasPrint ? (SHIPPING_RATES[country] || SHIPPING_RATES.default) : 0;
  const discount = affiliate ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal - discount + shipping;

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
        body: JSON.stringify({ items: cart, currency: "XOF", shippingCountry: country, affiliateCode: affiliate, email, firstName, lastName, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur paiement");
      window.location.href = data.checkout_url;
    } catch (e:any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#fcf9f8] min-h-screen">
      <main className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-[80px]">
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Cart List 8 cols */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[32px] md:text-[40px] font-bold" style={{ fontFamily: "Montserrat" }}>Votre Panier ({cart.length})</h2>
              <span className="text-[#5c403f] text-[12px] uppercase tracking-wider font-semibold">Récapitulatif</span>
            </div>

            {cart.length===0 ? (
              <div className="text-center bg-white rounded-[16px] border p-12">
                <div className="w-16 h-16 bg-[#f6f3f2] rounded-full flex items-center justify-center mx-auto text-2xl">🛒</div>
                <div className="font-bold text-xl mt-4" style={{ fontFamily: "Montserrat" }}>Votre panier est vide</div>
                <div className="mt-6 flex justify-center gap-3">
                  <Link href="/kiosque" className="h-11 px-6 rounded-full bg-[#9e001f] text-white font-bold text-sm flex items-center gap-2">Kiosque →</Link>
                  <Link href="/abonnement" className="h-11 px-6 rounded-full border text-sm">Voir abonnements</Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item:any, idx:number)=>(
                  <div key={idx} className="flex flex-col sm:flex-row gap-6 bg-[#f6f3f2] p-4 rounded-xl border border-[#e5bdbb] hover:shadow-md transition-shadow">
                    <div className="w-32 h-44 flex-shrink-0 bg-[#dcd9d9] rounded-lg overflow-hidden shadow-sm relative">
                      {item.cover ? <img src={item.cover} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{item.type}</div>}
                      <div className="absolute inset-y-0 left-0 w-1 bg-black/10"></div>
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start">
                          <span className="text-[12px] text-[#9e001f] uppercase tracking-wider font-medium">{item.type==='magazine'?`Mensuel • N°${item.numero||''}`:item.type}</span>
                          <button onClick={()=>removeItem(idx)} className="material-symbols-outlined text-[#5c403f] hover:text-[#9e001f]">delete</button>
                        </div>
                        <h3 className="text-[20px] font-bold leading-tight" style={{ fontFamily: "Montserrat" }}>{item.title}</h3>
                        <p className="text-[14px] text-[#5c403f] italic">{item.type==="magazine"?`Format: ${item.format} • Langue: ${item.language?.toUpperCase()}`:`Plan: ${item.planId}`}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center border border-[#e5bdbb] rounded-lg px-2 bg-white">
                          <button className="p-1 hover:text-[#9e001f]">-</button><span className="px-4 font-bold">1</span><button className="p-1 hover:text-[#9e001f]">+</button>
                        </div>
                        <span className="text-[20px] font-bold" style={{ fontFamily: "Montserrat" }}>{item.price?.toLocaleString()} F CFA</span>
                      </div>
                    </div>
                  </div>
                ))}

                {affiliate && (
                  <div className="bg-[#eae7e7] border border-dashed border-[#9e001f]/40 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#9e001f]">verified</span>
                      <div>
                        <p className="text-[14px] font-bold uppercase tracking-tight">Code "{affiliate}" Activé</p>
                        <p className="text-[12px] text-[#5c403f]">Promotion partenaire : -10% sur les abonnements</p>
                      </div>
                    </div>
                    <button onClick={()=>{setAffiliate(""); localStorage.removeItem("eam_affiliate");}} className="text-[#9e001f] hover:underline text-[14px]">Retirer</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Sidebar 4 cols */}
          <aside className="col-span-12 lg:col-span-4 sticky top-32 space-y-4">
            <div className="bg-[#f0eded] p-6 rounded-xl border border-[#e5bdbb] shadow-sm">
              <h3 className="text-[20px] font-bold mb-4 border-b border-[#e5bdbb] pb-2" style={{ fontFamily: "Montserrat" }}>Total</h3>
              <div className="space-y-2 mb-4 text-[14px]">
                <div className="flex justify-between text-[#5c403f]"><span>Sous-total</span><span>{subtotal.toLocaleString()} F CFA</span></div>
                {affiliate && <div className="flex justify-between text-[#9e001f]"><span>Remise partenaire</span><span>-{discount.toLocaleString()} F CFA</span></div>}
                {hasPrint && <div className="flex justify-between text-[#5c403f]"><span>Livraison (Est.)</span><span>{shipping.toLocaleString()} F CFA</span><select value={country} onChange={e=>setCountry(e.target.value)} className="ml-2 text-[11px] border rounded px-1"><option value="BJ">BJ 2k</option><option value="CI">CI 2.5k</option><option value="SN">SN 3k</option><option value="NG">NG 4k</option><option value="FR">FR 8k</option><option value="US">US 12k</option></select></div>}
                <div className="pt-2 border-t border-[#e5bdbb] flex justify-between font-bold text-[18px]"><span>NET À PAYER</span><span className="text-[#9e001f]">{total.toLocaleString()} F CFA</span></div>
              </div>

              <div className="mb-6 rounded-xl border border-[#e5bdbb] bg-white p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[#9e001f]">payments</span>
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#5c403f]">Moyens de paiement</p>
                    <p className="mt-1 text-[12px] leading-5 text-[#5c403f]">Moneroo détecte automatiquement votre pays et affiche les moyens disponibles : carte bancaire, Mobile Money et autres options proposées par ses agrégateurs.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full h-11 rounded-lg border border-[#e5bdbb] bg-white px-4 text-[13px]" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Prénom" value={firstName} onChange={e=>setFirstName(e.target.value)} className="w-full h-11 rounded-lg border px-4 text-[13px]" />
                  <input placeholder="Nom" value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full h-11 rounded-lg border px-4 text-[13px]" />
                </div>
                <input placeholder="Téléphone Mobile Money (ex. +229...)" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full h-11 rounded-lg border border-[#e5bdbb] bg-white px-4 text-[13px]" />
              </div>

              <button onClick={checkout} disabled={loading || cart.length===0} className="w-full bg-[#9e001f] text-white py-4 rounded-lg font-bold text-[16px] hover:brightness-90 transition-all shadow-md active:scale-95 disabled:opacity-50">
                {loading?"Redirection...":"VALIDER MA COMMANDE"}
              </button>
              <p className="text-center text-[12px] text-[#5c403f] mt-4">Paiement 100% sécurisé via passerelle cryptée. Aucune donnée bancaire stockée.</p>
            </div>

            <div className="bg-[#f6f3f2] p-4 rounded-xl border border-[#e5bdbb] flex gap-3 items-start">
              <span className="material-symbols-outlined text-[#5c403f]">local_shipping</span>
              <div><p className="text-[14px] font-bold">Livraison estimée</p><p className="text-[12px] text-[#5c403f]">Zone : {country} • {hasPrint?"3-5 jours ouvrés":"Instantané digital"} • Liens sécurisés 24h</p></div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
