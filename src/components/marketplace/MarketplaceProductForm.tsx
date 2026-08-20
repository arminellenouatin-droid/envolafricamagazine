"use client";

import { useState } from "react";
import { marketplaceCategories } from "@/lib/marketplace-seed";

const productTypes = [
  ["physical", "Produit physique", "Motos, voitures, vêtements, électroménager et tout produit livré."],
  ["service", "Service", "Prestations, conseil, maintenance ou accompagnement."],
  ["training", "Formation", "Cours, programme ou accompagnement pédagogique en ligne."],
  ["digital", "Produit digital", "Ressource numérique accessible après confirmation du paiement."],
  ["downloadable", "Fichier téléchargeable", "PDF, document, audio, vidéo ou archive protégée après paiement."],
] as const;

export default function MarketplaceProductForm({ onCreated }: { onCreated?: () => void }) {
  const [productType, setProductType] = useState("physical");
  const [deliveryType, setDeliveryType] = useState("shipping");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(marketplaceCategories[1] || "Autres produits");
  const [priceXof, setPriceXof] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [countryCode, setCountryCode] = useState("BJ");
  const [city, setCity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [digitalExternalUrl, setDigitalExternalUrl] = useState("");
  const [digitalAccessInstructions, setDigitalAccessInstructions] = useState("");
  const [digitalDownloadLimit, setDigitalDownloadLimit] = useState("5");
  const [serviceDurationMinutes, setServiceDurationMinutes] = useState("60");
  const [trainingAccessDays, setTrainingAccessDays] = useState("30");
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const digital = productType === "digital" || productType === "downloadable";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage(""); setError("");
    try {
      if (Number(priceXof) < 100) throw new Error("Le prix minimum est de 100 XOF.");
      if (digital && !digitalFile && !digitalExternalUrl.trim()) throw new Error("Ajoutez un fichier ou un lien de livraison pour ce produit numérique.");
      const response = await fetch("/api/marketplace/products", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ title, description, category, countryCode, city, priceXof: Number(priceXof), stockQuantity: productType === "physical" ? Number(stockQuantity) : 999, productType, deliveryType: digitalFile ? "download" : deliveryType, digitalExternalUrl: digitalExternalUrl.trim() || undefined, digitalAccessInstructions, digitalDownloadLimit: Number(digitalDownloadLimit), serviceDurationMinutes: productType === "service" ? Number(serviceDurationMinutes) : undefined, trainingAccessDays: productType === "training" ? Number(trainingAccessDays) : undefined, media: imageUrl.trim() ? [{ url: imageUrl.trim(), mimeType: "image/*" }] : [] }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publication impossible.");
      if (digitalFile && data.product?.id) {
        const form = new FormData(); form.append("file", digitalFile); form.append("productId", data.product.id);
        const uploadResponse = await fetch("/api/marketplace/products/digital/upload", { method: "POST", body: form, credentials: "include" });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "Le produit a été créé mais le fichier n’a pas pu être chargé.");
      }
      setMessage("Produit envoyé en revue. Il sera visible après validation."); setTitle(""); setDescription(""); setPriceXof(""); setDigitalFile(null); onCreated?.();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Publication impossible."); }
    finally { setBusy(false); }
  };

  return <form id="publier" onSubmit={submit} className="mt-6 rounded-[24px] border border-[#eadfce] bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#a36300]">Nouvelle offre</p><h2 className="mt-1 font-display text-2xl font-black">Publier un produit</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#725f4d]">Choisissez le type d’offre. Les produits numériques restent protégés et ne sont accessibles à l’acheteur qu’après confirmation du paiement.</p></div><span className="rounded-full bg-[#e9f7f5] px-3 py-2 text-[10px] font-black text-[#087e8b]">Minimum 100 XOF</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{productTypes.map(([value, label, detail]) => <button type="button" key={value} onClick={() => { setProductType(value); setDeliveryType(value === "physical" ? "shipping" : value === "service" || value === "training" ? "online" : "download"); }} className={`rounded-2xl border p-4 text-left transition ${productType === value ? "border-[#9e001f] bg-[#fff3f2]" : "border-[#eadfce] bg-[#fffdfb]"}`}><strong className="block text-sm">{label}</strong><span className="mt-1 block text-[11px] leading-4 text-[#806c58]">{detail}</span></button>)}</div><div className="mt-5 grid gap-3 md:grid-cols-2"><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Nom du produit ou de l’offre" className="h-11 rounded-xl border border-[#eadfce] px-4 text-sm" /><select required value={category} onChange={(event) => setCategory(event.target.value)} className="h-11 rounded-xl border border-[#eadfce] px-3 text-sm">{marketplaceCategories.filter((item) => item !== "Toutes les catégories").map((item) => <option key={item}>{item}</option>)}</select><textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description détaillée" className="min-h-28 rounded-xl border border-[#eadfce] p-4 text-sm md:col-span-2" /></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="text-xs font-bold">Prix XOF<input required min="100" type="number" value={priceXof} onChange={(event) => setPriceXof(event.target.value)} placeholder="100" className="mt-2 h-11 w-full rounded-xl border border-[#eadfce] px-3 text-sm" /></label>{productType === "physical" ? <label className="text-xs font-bold">Stock<input required min="1" type="number" value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#eadfce] px-3 text-sm" /></label> : <div className="rounded-xl bg-[#fff8f6] p-3 text-xs text-[#725f4d]">Disponibilité gérée par l’offre</div>}<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)} className="h-11 rounded-xl border border-[#eadfce] px-3 text-sm"><option value="BJ">Bénin</option><option value="CI">Côte d’Ivoire</option><option value="SN">Sénégal</option><option value="TG">Togo</option><option value="CM">Cameroun</option><option value="NG">Nigeria</option><option value="GH">Ghana</option></select><input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" className="h-11 rounded-xl border border-[#eadfce] px-3 text-sm" /></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="URL de l’image principale (facultatif)" className="h-11 rounded-xl border border-[#eadfce] px-3 text-sm" />{productType === "physical" ? <select value={deliveryType} onChange={(event) => setDeliveryType(event.target.value)} className="h-11 rounded-xl border border-[#eadfce] px-3 text-sm"><option value="shipping">Livraison / remise physique</option></select> : <select value={deliveryType} onChange={(event) => setDeliveryType(event.target.value)} className="h-11 rounded-xl border border-[#eadfce] px-3 text-sm"><option value="online">Accès en ligne</option><option value="download">Téléchargement protégé</option><option value="external_link">Lien externe après paiement</option></select>}</div>{digital && <div className="mt-4 rounded-2xl border border-[#e5bdbb] bg-[#fff8f6] p-4"><p className="text-xs font-black uppercase tracking-wider text-[#9e001f]">Livraison numérique</p><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-xs font-bold">Fichier privé<input type="file" onChange={(event) => setDigitalFile(event.target.files?.[0] || null)} className="mt-2 block w-full text-xs" /></label><input type="url" value={digitalExternalUrl} onChange={(event) => setDigitalExternalUrl(event.target.value)} placeholder="Ou lien externe HTTPS" className="h-10 rounded-xl border border-[#eadfce] bg-white px-3 text-xs" /><textarea value={digitalAccessInstructions} onChange={(event) => setDigitalAccessInstructions(event.target.value)} placeholder="Instructions visibles après paiement" className="min-h-20 rounded-xl border border-[#eadfce] bg-white p-3 text-xs md:col-span-2" /><label className="text-xs font-bold">Nombre maximal de téléchargements<input type="number" min="1" max="50" value={digitalDownloadLimit} onChange={(event) => setDigitalDownloadLimit(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-xs" /></label></div></div>}{productType === "service" && <label className="mt-3 block text-xs font-bold">Durée du service en minutes<input type="number" min="15" value={serviceDurationMinutes} onChange={(event) => setServiceDurationMinutes(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#eadfce] px-3 text-sm" /></label>}{productType === "training" && <label className="mt-3 block text-xs font-bold">Durée d’accès à la formation en jours<input type="number" min="1" value={trainingAccessDays} onChange={(event) => setTrainingAccessDays(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#eadfce] px-3 text-sm" /></label>}<div className="mt-5 flex items-center justify-between gap-3"><span className="text-[11px] text-[#806c58]">Après validation, le produit apparaît dans le catalogue.</span><button type="submit" disabled={busy} className="rounded-full bg-[#9e001f] px-6 py-3 text-xs font-black text-white disabled:opacity-60">{busy ? "Publication…" : "Envoyer le produit"}</button></div>{message && <p className="mt-4 rounded-xl bg-[#e9f7f5] p-3 text-xs font-semibold text-[#087e8b]">{message}</p>}{error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-800">{error}</p>}</form>;
}
