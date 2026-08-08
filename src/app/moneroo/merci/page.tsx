"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function MerciContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transaction_id") || searchParams.get("payment_id");
  const orderId = searchParams.get("order_id");
  const mockSuccess = searchParams.get("mock_success");

  const [status, setStatus] = useState<"loading"|"success"|"pending"|"failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(()=>{
    if (mockSuccess) {
      setStatus("success");
      setMessage("Paiement confirmé en mode test");
      // Update order if orderId present
      if (orderId) {
        fetch("/api/payment/verify", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ orderId, paymentId: transactionId }) }).catch(()=>{});
      }
      return;
    }
    if (!transactionId) {
      setStatus("failed");
      setMessage("Transaction introuvable");
      return;
    }
    // Verify via API
    fetch(`/api/payment/verify`, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ orderId, paymentId: transactionId }) })
      .then(r=>r.json())
      .then(data=>{
        if (data.success || data.verification?.status==="success" || data.order?.status==="paid") {
          setStatus("success");
        } else if (data.verification?.status==="pending" || data.order?.status==="pending") {
          setStatus("pending");
        } else {
          setStatus("failed");
        }
      }).catch(()=>{
        setStatus("failed");
        setMessage("Impossible de vérifier le paiement");
      });
  },[transactionId, orderId, mockSuccess]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#fcf9f8] p-6">
      <div className="max-w-[640px] w-full bg-white rounded-[16px] border border-[#e5bdbb] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)] text-center">
        {status==="loading" && <><div className="text-[48px]">⏳</div><h1 className="text-[22px] font-bold mt-4">Vérification en cours...</h1><p className="text-[#5c403f] mt-2">Transaction {transactionId}</p></>}
        {status==="success" && <><div className="text-[48px]">✅</div><div className="inline-block bg-[#ffdad8] text-[#9e001f] px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mt-4">PAIEMENT CONFIRMÉ</div><h1 className="text-[28px] font-bold mt-4 leading-tight" style={{ fontFamily:"Montserrat" }}>Merci pour votre commande, votre paiement est confirmé !</h1><p className="text-[#5c403f] mt-4">Transaction <strong>{transactionId}</strong> {orderId && <>• Commande <strong>{orderId}</strong></>} est payée. Vos accès (magazines PDF/audio, abonnement) sont actifs. Liens sécurisés expirent en 24h (JWT).</p><div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center"><Link href="/compte" className="h-12 px-8 rounded-full bg-[#9e001f] text-white font-bold flex items-center justify-center">Mon espace →</Link><Link href="/kiosque" className="h-12 px-8 rounded-full border border-[#e5bdbb] font-bold flex items-center justify-center">Kiosque</Link></div><p className="text-[11px] text-[#906f6e] mt-6">Paiement sécurisé par Moneroo - Aucune donnée bancaire stockée - Webhook HMAC-SHA256 vérifié - Le webhook reste source de vérité</p></>}
        {status==="pending" && <><div className="text-[48px]">⏳</div><h1 className="text-[22px] font-bold mt-4">Paiement en cours de traitement</h1><p className="text-[#5c403f] mt-2">Transaction {transactionId} - Vous recevrez une confirmation sous peu. Le webhook Moneroo reste source de vérité.</p><Link href="/" className="mt-6 inline-block text-[#9e001f] font-bold">Retour accueil</Link></>}
        {status==="failed" && <><div className="text-[48px]">❌</div><h1 className="text-[22px] font-bold mt-4">Le paiement n'a pas abouti</h1><p className="text-[#5c403f] mt-2">Transaction {transactionId} - Statut: {message} <br/><Link href="/panier" className="text-[#9e001f] font-bold">Réessayez</Link> ou contactez support.</p></>}
      </div>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Chargement...</div>}>
      <MerciContent />
    </Suspense>
  );
}
