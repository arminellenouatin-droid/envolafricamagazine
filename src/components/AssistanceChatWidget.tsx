"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

const FAQ_QUICK_RESPONSES: Record<string, string> = {
  abonnement: "Nos formules d'abonnement au magazine Envol Africa démarrent dès 2 000 FCFA/mois pour le numérique. Vous pouvez vous abonner sur /abonnement ou directement dans le Kiosque.",
  kiosque: "Le Kiosque vous permet de lire les magazines au format Flipbook haute définition. Les 8 premières pages sont gratuites, et l'accès complet se fait par achat à l'unité ou abonnement.",
  paiement: "Nous acceptons tous les réseaux Mobile Money (MTN, Moov, Orange, Wave) ainsi que les cartes Visa et Mastercard via notre passerelle certifiée Moneroo.",
  retrait: "Les retraits de vos gains (affiliation, ventes marketplace, dons crowdfunding) s'effectuent depuis votre espace 'Mon Compte' vers votre numéro Mobile Money en 24h ouvrées.",
  jobs: "Pour postuler ou recruter, rendez-vous sur /emploi (Jobs). Les candidats créent leur profil gratuitement et les entreprises peuvent publier leurs offres.",
  wab: "World Africa Business (WAB) est notre réseau professionnel. Vous pouvez y partager des opportunités, échanger en messagerie directe et participer à des Salons en direct.",
  live: "Les Salons Live WAB sont accessibles depuis la section WAB > Salons. Les créateurs peuvent diffuser en vidéo avec chat et cadeaux en direct façon TikTok.",
};

export default function AssistanceChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "bot",
      text: "Bonjour et bienvenue sur Envol Africa Magazine ! 👋 Comment pouvons-nous vous aider aujourd'hui ?",
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-assistance-chat", handleOpen);
    return () => window.removeEventListener("open-assistance-chat", handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const query = input.trim().toLowerCase();
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let botReply =
        "Merci pour votre message ! Notre équipe d'assistance a bien pris note de votre demande. Vous pouvez également nous contacter directement via WhatsApp ou par email à support@envolafrica.site.";

      for (const [key, response] of Object.entries(FAQ_QUICK_RESPONSES)) {
        if (query.includes(key)) {
          botReply = response;
          break;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "bot",
          text: botReply,
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <>
      {/* Bouton Flottant d'assistance (en bas à droite) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Contacter l'Assistance Envol Africa"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#9e001f] text-white shadow-2xl hover:bg-[#c8102e] hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#9e001f]/30"
        >
          <span className="material-symbols-outlined text-2xl">
            {isOpen ? "close" : "support_agent"}
          </span>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Fenêtre de Chat d'Assistance */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[92vw] max-w-[380px] h-[520px] bg-white rounded-3xl shadow-2xl border border-[#e5bdbb]/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-[#1b1c1c] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-[#9e001f] flex items-center justify-center text-white font-bold">
                <span className="material-symbols-outlined text-xl">support_agent</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#1b1c1c]" />
              </div>
              <div>
                <h4 className="font-bold text-sm font-display text-white">Assistance Envol Africa</h4>
                <p className="text-[10px] text-emerald-400 font-medium">Service client en ligne</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-[#fcf9f8] px-3 py-2 border-b border-[#e5bdbb]/40 flex gap-1.5 overflow-x-auto text-[11px] font-bold text-[#9e001f] no-scrollbar">
            <button
              onClick={() => setInput("Comment fonctionne l'abonnement ?")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#e5bdbb] hover:bg-[#fff5f3]"
            >
              Abonnement
            </button>
            <button
              onClick={() => setInput("Quels sont les moyens de paiement ?")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#e5bdbb] hover:bg-[#fff5f3]"
            >
              Paiements
            </button>
            <button
              onClick={() => setInput("Comment accéder au kiosque ?")}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-[#e5bdbb] hover:bg-[#fff5f3]"
            >
              Kiosque
            </button>
            <Link
              href="/faq"
              onClick={() => setIsOpen(false)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-[#9e001f] text-white"
            >
              Voir la FAQ
            </Link>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf7f6]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#9e001f] text-white rounded-br-none"
                      : "bg-white text-[#1b1c1c] border border-[#e5bdbb]/60 rounded-bl-none shadow-sm"
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-[#aa8f8f] mt-1 px-1">{m.time}</span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1.5 bg-white border border-[#e5bdbb]/60 rounded-2xl px-3 py-2 w-16">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-[#e5bdbb]/60 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Posez votre question..."
              className="flex-1 bg-[#fcf9f8] border border-[#e5bdbb] rounded-full px-4 py-2.5 text-xs focus:outline-none focus:border-[#9e001f]"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-full bg-[#9e001f] text-white flex items-center justify-center hover:bg-[#c8102e] disabled:opacity-40 transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
