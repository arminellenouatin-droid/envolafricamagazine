"use client";
import { useState } from "react";

export default function MagazineModal({ editingMag, onClose, onSaved }: { editingMag?: any, onClose: () => void, onSaved: () => void }) {
  const [form, setForm] = useState({
    numero: editingMag?.numero || "",
    periode: editingMag?.periode || "",
    title: editingMag?.title || "",
    description: editingMag?.description || "",
    category: editingMag?.category || "Economie",
    year: editingMag?.year || new Date().getFullYear(),
    featured: editingMag?.featured || false,
    sommaire: (editingMag?.sommaire || []).join("\n"),
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState(editingMag?.cover || "");
  const [previewFiles, setPreviewFiles] = useState<FileList | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>(editingMag?.previewImages || []);
  const [pdfFiles, setPdfFiles] = useState<Record<string, File>>({});
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>(editingMag?.pdfs || {});
  const [audioFiles, setAudioFiles] = useState<Record<string, File>>({});
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>(editingMag?.audios || {});
  const [prices, setPrices] = useState<Record<string, number>>(editingMag?.prices || {
    numerique: 10000,
    papier: 16000,
    cd_audio: 5000,
    audio_pdf: 12000,
    audio_papier: 18000
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const uploadFile = async (file: File, type: string, lang: string = "", magazineId: string = "temp") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    fd.append("magazineId", magazineId);
    if (lang) fd.append("lang", lang);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload échoué");
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessage("Upload en cours...");
    try {
      let finalCoverUrl = coverUrl;
      let finalPreviewUrls = [...previewUrls];
      let finalPdfUrls = { ...pdfUrls };
      let finalAudioUrls = { ...audioUrls };

      const tempId = editingMag?.id || `temp_${Date.now()}`;

      // Upload cover
      if (coverFile) {
        finalCoverUrl = await uploadFile(coverFile, "cover", "", tempId);
      }

      // Upload preview images (up to 10)
      if (previewFiles) {
        const filesArray = Array.from(previewFiles).slice(0, 10);
        for (const f of filesArray) {
          const url = await uploadFile(f, "preview", "", tempId);
          finalPreviewUrls.push(url);
        }
        finalPreviewUrls = finalPreviewUrls.slice(0, 10);
      }

      // Upload PDFs 3 langues
      for (const lang of ["fr", "en", "es"]) {
        if (pdfFiles[lang]) {
          const url = await uploadFile(pdfFiles[lang], "pdf", lang, tempId);
          finalPdfUrls[lang] = url;
        }
      }

      // Upload audios 12 langues
      const audioLangs = ["fr","en","es","sw","ha","yo","ig","fon","ff","zu","ee","wo"];
      for (const lang of audioLangs) {
        if (audioFiles[lang]) {
          const url = await uploadFile(audioFiles[lang], "audio", lang, tempId);
          finalAudioUrls[lang] = url;
        }
      }

      const payload: any = {
        numero: form.numero,
        periode: form.periode,
        title: form.title,
        description: form.description,
        category: form.category,
        year: parseInt(form.year as any),
        cover: finalCoverUrl,
        previewImages: finalPreviewUrls,
        pdfs: finalPdfUrls,
        audios: finalAudioUrls,
        prices: prices,
        sommaire: form.sommaire.split("\n").filter((s:string)=>s.trim()),
        featured: form.featured,
        formats: ["numerique","papier","cd_audio","audio_pdf","audio_papier"],
        languages: ["fr","en","es"],
      };

      if (editingMag) {
        payload.id = editingMag.id;
        const res = await fetch("/api/admin/magazines", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMessage("Magazine modifié ✅");
      } else {
        const res = await fetch("/api/admin/magazines", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMessage("Magazine créé ✅");
      }

      setTimeout(()=>{ onSaved(); onClose(); }, 800);
    } catch (err:any) {
      setMessage("Erreur: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-6 w-full max-w-[900px] max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[18px]">{editingMag?"Modifier magazine - Version corrigée":"Nouveau magazine - Version corrigée"}</h3>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center">×</button>
        </div>

        {message && <div className="mb-4 p-3 rounded-full bg-amber-50 border border-amber-200 text-[12px] text-amber-900">{message}</div>}

        <div className="grid gap-6">
          {/* Numéro, Période, Catégorie, Année */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="text-[11px] font-bold uppercase">Numéro *</label><input value={form.numero} onChange={e=>setForm({...form, numero:e.target.value})} placeholder="26" required type="number" className="mt-1 w-full h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /></div>
            <div><label className="text-[11px] font-bold uppercase">Période *</label><input value={form.periode} onChange={e=>setForm({...form, periode:e.target.value})} placeholder="Mars-Avril 2024 ou Mars 2024" required className="mt-1 w-full h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /></div>
            <div><label className="text-[11px] font-bold uppercase">Année</label><input value={form.year} onChange={e=>setForm({...form, year:e.target.value})} type="number" className="mt-1 w-full h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /></div>
            <div><label className="text-[11px] font-bold uppercase">Catégorie</label><select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="mt-1 w-full h-11 rounded-full border bg-zinc-50 px-4 text-[13px]"><option>Economie</option><option>Finance</option><option>Tech</option><option>Entrepreneuriat</option><option>Énergie</option><option>Agro</option><option>Interview</option><option>Analyse</option></select></div>
          </div>

          <div><label className="text-[11px] font-bold uppercase">Titre *</label><input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Envol Africa N°26 - Spécial Fintech" required className="mt-1 w-full h-11 rounded-full border bg-zinc-50 px-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Description</label><textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} placeholder="Résumé du sommaire..." rows={3} className="mt-1 w-full rounded-[14px] border bg-zinc-50 p-3 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Sommaire (1 par ligne)</label><textarea value={form.sommaire} onChange={e=>setForm({...form, sommaire:e.target.value})} placeholder={"Dossier Spécial Fintech\nInterview : Patrice Motsepe\nBourse : Le rallye de la BRVM\nÉnergie : L'hydrogène vert"} rows={4} className="mt-1 w-full rounded-[14px] border bg-zinc-50 p-3 text-[12px]" /></div>

          {/* Couverture upload */}
          <div className="border rounded-[14px] p-4 bg-zinc-50">
            <label className="text-[11px] font-bold uppercase">Couverture - Upload image direct (pas URL) *</label>
            <div className="mt-2 flex gap-4 items-center">
              {coverUrl && <img src={coverUrl} alt="cover" className="w-20 h-28 object-cover rounded-[8px] border" />}
              <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0]; if(f){setCoverFile(f); setCoverUrl(URL.createObjectURL(f));}}} className="text-[12px]" />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Formats: JPG, PNG, WebP - Max 50MB - Recommandé 600x800px minimum</p>
          </div>

          {/* Preview images 10 */}
          <div className="border rounded-[14px] p-4 bg-zinc-50">
            <label className="text-[11px] font-bold uppercase">Premières pages - Upload jusqu'à 10 images pour flipbook aperçu</label>
            <input type="file" accept="image/*" multiple onChange={e=>setPreviewFiles(e.target.files)} className="mt-2 text-[12px] w-full" />
            <p className="text-[10px] text-zinc-500 mt-1">Le système génère un flipbook à feuilleter en aperçu sur page produit. 5 pages gratuites visibles, reste verrouillé après achat.</p>
            {previewUrls.length>0 && <div className="mt-3 grid grid-cols-5 gap-2">{previewUrls.map((url,i)=><img key={i} src={url} alt={`preview ${i}`} className="w-full h-20 object-cover rounded border" />)}</div>}
            <div className="text-[11px] mt-2">{previewUrls.length}/10 images</div>
          </div>

          {/* PDFs 3 langues */}
          <div className="border rounded-[14px] p-4 bg-white">
            <label className="text-[11px] font-bold uppercase">PDF Magazine - 3 langues (version numérique)</label>
            <div className="mt-2 grid md:grid-cols-3 gap-3">
              {["fr","en","es"].map(lang=>(
                <div key={lang} className="border rounded-[10px] p-3 bg-zinc-50">
                  <div className="text-[11px] font-bold uppercase">{lang.toUpperCase()} - {lang==="fr"?"Français":lang==="en"?"Anglais":"Espagnol"}</div>
                  {pdfUrls[lang] && <div className="text-[10px] text-green-700 mt-1 truncate">✓ {pdfUrls[lang]}</div>}
                  <input type="file" accept="application/pdf" onChange={e=>{const f=e.target.files?.[0]; if(f) setPdfFiles({...pdfFiles, [lang]: f});}} className="mt-2 text-[11px] w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Audios 12 langues */}
          <div className="border rounded-[14px] p-4 bg-white">
            <label className="text-[11px] font-bold uppercase">Version Audio - 12 langues (Fongbé, Wolof, Swahili, etc.)</label>
            <div className="mt-2 grid md:grid-cols-3 gap-3">
              {[
                {code:"fr", label:"Français"}, {code:"en", label:"English"}, {code:"es", label:"Español"},
                {code:"sw", label:"Swahili"}, {code:"ha", label:"Hausa"}, {code:"yo", label:"Yorùbá"},
                {code:"ig", label:"Igbo"}, {code:"fon", label:"Fongbé"}, {code:"ff", label:"Fulfulde"}, {code:"zu", label:"Zulu"}, {code:"ee", label:"Ewe (Mina)"}, {code:"wo", label:"Wolof"}
              ].map(l=>(
                <div key={l.code} className="border rounded-[10px] p-2 bg-zinc-50">
                  <div className="text-[10px] font-bold uppercase">{l.code.toUpperCase()} - {l.label}</div>
                  {audioUrls[l.code] && <div className="text-[9px] text-green-700 truncate">✓ {audioUrls[l.code]}</div>}
                  <input type="file" accept="audio/*" onChange={e=>{const f=e.target.files?.[0]; if(f) setAudioFiles({...audioFiles, [l.code]: f});}} className="mt-1 text-[10px] w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Prix par version */}
          <div className="border rounded-[14px] p-4 bg-amber-50 border-amber-100">
            <label className="text-[11px] font-bold uppercase">Prix par version (éditable)</label>
            <div className="mt-2 grid md:grid-cols-3 gap-3">
              {[
                {id:"numerique", label:"Numérique (PDF)"},
                {id:"papier", label:"Papier"},
                {id:"cd_audio", label:"CD Audio"},
                {id:"audio_pdf", label:"Audio + PDF"},
                {id:"audio_papier", label:"Audio + Papier"},
              ].map(f=>(
                <div key={f.id}><label className="text-[10px] font-bold uppercase">{f.label}</label><div className="flex items-center gap-1 mt-1"><input type="number" value={prices[f.id]||0} onChange={e=>setPrices({...prices, [f.id]: parseInt(e.target.value)||0})} className="w-full h-9 rounded-full border bg-white px-3 text-[13px]" /><span className="text-[11px]">F CFA</span></div></div>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form, featured:e.target.checked})}/> À la une (featured)</label>
        </div>

        <div className="mt-6 flex gap-2">
          <button type="submit" disabled={uploading} className="h-11 px-6 rounded-full bg-[#0A1931] text-white text-[13px] font-bold disabled:opacity-60">{uploading?"Upload & Enregistrement...":editingMag?"Enregistrer les modifications":"Créer le magazine"}</button>
          <button type="button" onClick={onClose} className="h-11 px-6 rounded-full border text-[13px]">Annuler</button>
        </div>
        <p className="text-[10px] text-zinc-500 mt-3">Le flipbook aperçu sera généré à partir des 10 premières pages uploadées. Les PDF dans les 3 langues seront disponibles après achat version numérique. Les audios dans 12 langues après achat version audio. Couverture upload direct, pas URL.</p>
      </form>
    </div>
  );
}
