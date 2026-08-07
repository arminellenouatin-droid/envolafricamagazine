import Link from "next/link";
export default function EmploiPage(){
  const jobs = [
    { title:"Chief Financial Officer - Fintech Dakar", company:"Wave", location:"Dakar", salary:"4-6M F CFA", type:"CDI" },
    { title:"Product Manager - Mobile Money", company:"MTN", location:"Abidjan", salary:"2,5-4M F CFA", type:"CDI" },
    { title:"Analyste Financier Senior", company:"Envol Capital", location:"Cotonou (Remote)", salary:"1,8-3M F CFA", type:"CDI" },
  ];
  return (
    <div className="bg-[#FFFCF5] min-h-screen pb-20">
      <div className="max-w-[1120px] mx-auto px-6 pt-10">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest font-bold text-zinc-500"><Link href="/" className="hover:text-[#0A1931]">Accueil</Link><span>›</span><span className="text-[#0A1931]">Emploi</span></div>
        <h1 className="font-serif font-black text-[36px] text-[#0A1931] mt-4">Envol Emploi • 2 430 offres</h1>
        <p className="text-zinc-600 mt-2">Le premier job board 100% Afrique de l'Ouest francophone. Un compte Envol Africa = accès à tout l'écosystème.</p>
        <div className="mt-8 grid gap-3">
          {jobs.map(j=>(
            <div key={j.title} className="bg-white rounded-[16px] border border-zinc-100 p-5 flex items-center justify-between">
              <div><div className="font-bold text-[15px] text-[#0A1931]">{j.title}</div><div className="text-[13px] text-zinc-500 mt-1">{j.company} • {j.location} • {j.type} • {j.salary}</div></div>
              <button className="h-10 px-5 rounded-full bg-[#0A1931] text-white text-[13px] font-bold">Postuler →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
