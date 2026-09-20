"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

function Field({ field, value, onChange }: { field: any; value: string; onChange: (value: string) => void }) {
  const common = { value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value), required: field.is_required, className: "mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" };
  return <div><label className="text-[11px] font-bold uppercase tracking-wider">{field.label}{field.is_required ? " *" : ""}</label>{field.field_type === "textarea" ? <textarea {...common} rows={4} /> : field.field_type === "select" ? <select {...common}><option value="">Sélectionner</option>{(Array.isArray(field.options) ? field.options : []).map((option: string) => <option key={option} value={option}>{option}</option>)}</select> : <input {...common} type={field.field_type === "phone" ? "tel" : field.field_type === "number" ? "number" : field.field_type === "url" ? "url" : field.field_type === "date" ? "date" : "text"} />}</div>;
}

export default function ApplyCompetition() {
  const params = useParams();
  const slug = params.competitionSlug as string;
  const [comp, setComp] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [form, setForm] = useState({ display_name: "", phone: "", country: "BJ", bio: "", project_description: "", video_url: "", identity: "", project_need: "", current_level: "", business_plan: "" });
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [configMissing, setConfigMissing] = useState(false);
  const [message, setMessage] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    let active = true;
    setPageLoading(true);
    fetch(`/api/awards/competitions?slug=${encodeURIComponent(slug)}`).then(async (response) => {
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Compétition introuvable");
      const competition = data.competition || data.competitions?.[0];
      if (!competition) throw new Error("Compétition introuvable");
      if (!active) return;
      setComp(competition);
      const registrationResponse = await fetch(`/api/awards/applications?competition_id=${competition.id}`);
      const registrationText = await registrationResponse.text();
      const registration = registrationText ? JSON.parse(registrationText) : { config: null, fields: [] };
      if (!registrationResponse.ok) throw new Error(registration.error || "Configuration d’inscription indisponible");
      if (!active) return;
      setConfig(registration.config || { form_mode: "simple", registration_fee_xof: 0, currency: "XOF" });
      setConfigMissing(!registration.config);
      setFields(Array.isArray(registration.fields) ? registration.fields : []);
    }).catch((error) => { if (active) { setConfig({ form_mode: "simple", registration_fee_xof: 0, currency: "XOF" }); setConfigMissing(true); setMessage(error instanceof Error ? error.message : "Impossible de charger la configuration"); } }).finally(() => { if (active) setPageLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comp) return;
    setLoading(true); setMessage(""); setAuthRequired(false);
    const response = await fetch("/api/awards/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        competition_id: comp.id,
        display_name: form.display_name,
        phone: form.phone,
        country: form.country,
        bio: form.bio,
        project_description: form.project_description,
        video_url: form.video_url,
        identity_data: { summary: form.identity },
        business_data: { project_need: form.project_need, current_level: form.current_level, business_plan: form.business_plan },
        custom_fields: customFields,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      setAuthRequired(true);
      setMessage("Vous devez être connecté à votre compte pour déposer votre candidature.");
    } else if (response.status === 402 && data.requires_payment && data.application?.id && data.payment?.amount_xof) {
      setMessage("Redirection vers le paiement sécurisé des frais d’inscription...");
      const payment = await fetch("/api/awards/payments/init", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ product: "award_registration_fee", competition_id: comp.id, application_id: data.application.id, amount_xof: data.payment.amount_xof }) }).then((r) => r.json()).catch(() => ({}));
      if (payment.checkout_url) window.location.href = payment.checkout_url;
      else setMessage(payment.error || "Le paiement d’inscription n’a pas pu être initialisé");
    } else {
      setMessage(response.ok ? "Candidature envoyée avec succès ! Elle sera examinée avant la nomination et l’ouverture du lien de vote." : data.error || "La candidature n’a pas pu être envoyée");
    }
    setLoading(false);
  };

  if (pageLoading) return <div className="bg-[#0B0B0F] text-white min-h-screen p-10">Chargement de la compétition…</div>;
  if (!comp || !config) return <div className="bg-[#0B0B0F] text-white min-h-screen p-10">{message || "Compétition introuvable"}</div>;
  const entrepreneurship = config.form_mode === "entrepreneurship" || String(comp.category).toLowerCase().includes("entrepreneuriat");
  const registrationClosed = comp.status !== "registrations_open" || Boolean(config.registrations_end_at && new Date(config.registrations_end_at).getTime() < Date.now()) || Boolean(config.registrations_start_at && new Date(config.registrations_start_at).getTime() > Date.now());

  return (
    <div className="bg-[#0B0B0F] text-[#F5F3EE] min-h-screen pb-20">
      <div className="max-w-[760px] mx-auto px-5 md:px-[64px] py-10">
        <h1 className="text-[28px] font-black" style={{ fontFamily: "Fraunces" }}>Participer — {comp.title}</h1>
        <p className="text-[#A8A6A0] text-[13px] mt-2">{entrepreneurship ? "Formulaire Entrepreneuriat : identité, projet, besoin, niveau actuel et plan d’affaires." : "Formulaire candidat : photo, nom, téléphone et informations complémentaires configurées par l’administrateur."}</p>
        {configMissing && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-[13px] text-amber-100">La configuration d’inscription n’a pas encore été publiée par l’administrateur. Le formulaire sera activé après définition des règles et ouverture des inscriptions.</div>}
        {comp.status !== "registrations_open" && <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-[13px] text-[#A8A6A0]">Les inscriptions ne sont pas ouvertes actuellement. La compétition est encore en préparation.</div>}
        {config.registration_fee_xof > 0 && <div className="mt-4 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4 text-[13px]">Frais d’inscription : <strong>{Number(config.registration_fee_xof).toLocaleString("fr-FR")} {config.currency}</strong>. Le paiement sera demandé avant la finalisation.</div>}
        {registrationClosed && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-[13px]">La période d’inscription est fermée.</div>}
        
        <form onSubmit={submit} className="mt-8 bg-[#16161D] border border-white/10 rounded-[16px] p-6 space-y-4">
          <div><label className="text-[11px] font-bold uppercase">Nom complet ou nom public *</label><input required value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Téléphone *</label><input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Pays</label><select value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]"><option value="BJ">Bénin</option><option value="CI">Côte d’Ivoire</option><option value="SN">Sénégal</option><option value="NG">Nigeria</option><option value="GH">Ghana</option></select></div>
          {entrepreneurship && (
            <>
              <div><label className="text-[11px] font-bold uppercase">Identité</label><textarea value={form.identity} onChange={(event) => setForm({ ...form, identity: event.target.value })} rows={3} className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" placeholder="Identité du porteur et de l’entreprise" /></div>
              <div><label className="text-[11px] font-bold uppercase">Besoin du projet *</label><textarea required value={form.project_need} onChange={(event) => setForm({ ...form, project_need: event.target.value })} rows={3} className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
              <div><label className="text-[11px] font-bold uppercase">Niveau actuel *</label><textarea required value={form.current_level} onChange={(event) => setForm({ ...form, current_level: event.target.value })} rows={3} className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
              <div><label className="text-[11px] font-bold uppercase">Plan d’affaires *</label><textarea required value={form.business_plan} onChange={(event) => setForm({ ...form, business_plan: event.target.value })} rows={5} className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
            </>
          )}
          {!entrepreneurship && (
            <>
              <div><label className="text-[11px] font-bold uppercase">Biographie</label><textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
            </>
          )}
          <div><label className="text-[11px] font-bold uppercase">Projet ou présentation</label><textarea value={form.project_description} onChange={(event) => setForm({ ...form, project_description: event.target.value })} rows={4} className="mt-1 w-full rounded-xl bg-[#0B0B0F] border border-white/10 p-4 text-[13px]" /></div>
          <div><label className="text-[11px] font-bold uppercase">Vidéo ou lien</label><input type="url" value={form.video_url} onChange={(event) => setForm({ ...form, video_url: event.target.value })} className="mt-1 w-full h-11 rounded-full bg-[#0B0B0F] border border-white/10 px-4 text-[13px]" /></div>
          {fields.map((field) => <Field key={field.id} field={field} value={customFields[field.field_key] || ""} onChange={(value) => setCustomFields({ ...customFields, [field.field_key]: value })} />)}
          
          {message && (
            <div className={`rounded-xl border p-4 text-[13px] ${authRequired ? "border-amber-500/40 bg-amber-500/10 text-amber-200" : "border-white/10 bg-white/5 text-[#F5F3EE]"}`}>
              <p>{message}</p>
              {authRequired && (
                <div className="mt-3">
                  <a
                    href={`/auth/login?redirect=${encodeURIComponent(`/africa-awards/apply/${slug}`)}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-2 text-[12px] font-bold text-black hover:bg-[#F4D976]"
                  >
                    <span>Se connecter pour continuer →</span>
                  </a>
                </div>
              )}
            </div>
          )}

          <button disabled={loading || registrationClosed} className="w-full h-12 rounded-full bg-[#D4AF37] text-black font-bold text-[14px] disabled:opacity-50">
            {loading ? "Envoi..." : config.registration_fee_xof > 0 ? "Soumettre et payer les frais →" : "Soumettre ma candidature →"}
          </button>
          <p className="text-[11px] text-[#A8A6A0] text-center">Après validation administrative, vous recevrez votre lien de vote partageable. Les votes ne sont pas ouverts avant le lancement de la compétition.</p>
        </form>
      </div>
    </div>
  );
}
