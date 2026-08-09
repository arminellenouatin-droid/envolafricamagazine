export default function PartnersPage() {
  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-16">
        <h1 className="text-[36px] font-black">Partenaires - Sponsors, médias, incubateurs, investisseurs</h1>
        <div className="mt-10 grid md:grid-cols-4 gap-6">
          {["Orange Money", "MTN", "Wave", "Ecobank", "SGBS", "Sonatel", "Canal+", "RFI"].map(name=>(
            <div key={name} className="bg-[#16161D] border border-white/10 rounded-xl p-8 text-center hover:border-[#D4AF37]/30">
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 mx-auto flex items-center justify-center text-xl">🏢</div>
              <div className="font-bold mt-4">{name}</div>
              <div className="text-[11px] text-[#A8A6A0] mt-1">Sponsor officiel • 2024-2026</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
