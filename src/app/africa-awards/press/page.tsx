import Link from "next/link";
export default function PressPage() {
  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[960px] mx-auto px-5 md:px-[64px] py-16">
        <h1 className="text-[36px] font-black">Presse - Logo, communiqués, photos</h1>
        <p className="text-[#A8A6A0] mt-3">Téléchargez notre kit presse - Logo téléchargeable, communiqués, photos haute résolution éditions passées</p>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-6"><div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-2xl">🖼️</div><h3 className="font-bold mt-4">Logo pack</h3><p className="text-[12px] text-[#A8A6A0] mt-2">PNG, SVG, noir, blanc, or</p><button className="mt-4 h-9 px-4 rounded-full bg-white/10 text-white text-[12px]">Télécharger</button></div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-6"><div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-2xl">📰</div><h3 className="font-bold mt-4">Communiqués</h3><p className="text-[12px] text-[#A8A6A0] mt-2">Derniers communiqués de presse</p><button className="mt-4 h-9 px-4 rounded-full bg-white/10 text-white text-[12px]">Voir</button></div>
          <div className="bg-[#16161D] border border-white/10 rounded-xl p-6"><div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-2xl">📸</div><h3 className="font-bold mt-4">Photos</h3><p className="text-[12px] text-[#A8A6A0] mt-2">Photos haute résolution éditions passées</p><button className="mt-4 h-9 px-4 rounded-full bg-white/10 text-white text-[12px]">Voir galerie</button></div>
        </div>
      </div>
    </div>
  );
}
