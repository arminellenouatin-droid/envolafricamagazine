"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import Link from "next/link";

type CartItem = { title?: string; price?: number; cover?: string; type?: string; format?: string; numero?: string | number; planId?: string };

export default function CartToolbox({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { formatPrice } = useLocale();
  useEffect(() => { if (!open) return; try { setItems(JSON.parse(localStorage.getItem("eam_cart") || "[]")); } catch { setItems([]); } }, [open]);
  const remove = (index: number) => { const next = items.filter((_, itemIndex) => itemIndex !== index); setItems(next); localStorage.setItem("eam_cart", JSON.stringify(next)); window.dispatchEvent(new Event("eam-cart-updated")); };
  const total = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  if (!open) return null;
  return <div className="fixed inset-x-3 top-[64px] z-[96] max-h-[78vh] overflow-y-auto rounded-2xl border border-[#e5bdbb] bg-white p-4 text-[#242020] shadow-2xl dark:bg-[#241d1f] dark:text-white md:hidden" role="dialog" aria-label="Panier"><div className="flex items-center justify-between border-b border-[#f0dedd] pb-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#9e001f]">Votre sélection</p><h2 className="font-display text-lg font-black">Panier ({items.length})</h2></div><button type="button" onClick={onClose} aria-label="Fermer le panier" className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f3f2] text-[#9e001f]"><span className="material-symbols-outlined">close</span></button></div>{items.length === 0 ? <div className="py-10 text-center"><span className="material-symbols-outlined text-4xl text-[#9e001f]">shopping_cart</span><p className="mt-3 text-sm font-bold">Votre panier est vide</p><Link href="/marketplace" onClick={onClose} className="mt-4 inline-flex rounded-full bg-[#9e001f] px-4 py-2 text-xs font-black text-white">Explorer</Link></div> : <><div className="mt-3 divide-y divide-[#f0dedd]">{items.map((item, index) => <div key={`${item.title}-${index}`} className="flex gap-3 py-3"><div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-[#f6f3f2]">{item.cover ? <img src={item.cover} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-[10px] text-[#9e001f]">{item.type || "Article"}</span>}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{item.title || "Article"}</p><p className="mt-1 text-[11px] text-[#806c58]">{formatPrice(Number(item.price || 0))}</p></div><button type="button" onClick={() => remove(index)} aria-label={`Supprimer ${item.title || "l’article"}`} className="self-start text-[#9e001f]"><span className="material-symbols-outlined text-[18px]">delete</span></button></div>)}</div><div className="mt-4 flex items-center justify-between border-t border-[#f0dedd] pt-4"><span className="text-xs font-bold text-[#806c58]">Total</span><strong className="font-display text-lg text-[#9e001f]">{formatPrice(total)}</strong></div><Link href="/panier" onClick={onClose} className="mt-4 flex h-11 items-center justify-center rounded-xl bg-[#9e001f] text-xs font-black text-white">Voir le panier et valider</Link></>}</div>;
}
