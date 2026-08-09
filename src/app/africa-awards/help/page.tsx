export default function HelpPage() {
  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[800px] mx-auto px-5 md:px-[64px] py-16">
        <h1 className="text-[36px] font-black">Centre d'aide - FAQ, tutoriels</h1>
        <div className="mt-8 space-y-4">
          {[
            { q:"Comment voter ?", a:"Choisissez un candidat, un nombre de votes, payez via Moneroo Mobile Money/Carte/PayPal. Comptabilisation <5s + classement temps réel." },
            { q:"Comment devenir candidat ?", a:"Allez sur /apply/[competitionSlug], remplissez biographie, projet, photos, vidéos, documents. Suivi statut soumise → en étude → acceptée/refusée." },
            { q:"Comment soumettre une demande de compétition (organisateur) ?", a:"Allez sur /organizer/dashboard/requests/new, remplissez catégorie, titre, description, règlement, calendrier, récompenses, orga. Statut Demande soumise, non modifiable. Seul admin peut créer/lancer. Test 403 si tentative directe création." },
            { q:"Comment fonctionne le live ?", a:"Animateur démarre live avec clé RTMP sécurisée côté serveur. Overlay temps réel spectateurs/durée/cagnotte/classement. À l'arrêt: clôture auto votes + replay Mux." },
            { q:"Mes données sont-elles sécurisées ?", a:"RLS activé sur 100% tables, 2FA obligatoire admin/orga/jury, webhooks Moneroo/Mux vérifiés signature, rate limiting, Sentry." },
          ].map((faq,i)=>(
            <div key={i} className="bg-[#16161D] border border-white/10 rounded-xl p-5">
              <div className="font-bold">{faq.q}</div>
              <div className="text-[13px] text-[#A8A6A0] mt-2 leading-6">{faq.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
