export default function GalleryPage() {
  return (
    <div className="bg-[#0B0B0F] text-white min-h-screen pb-20">
      <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] py-16">
        <h1 className="text-[36px] font-black">Galerie - Photos/vidéos/moments forts éditions passées</h1>
        <p className="text-[#A8A6A0] mt-3">Retrouvez les meilleurs moments des éditions précédentes - Cérémonies, remises de prix, coulisses</p>
        <div className="mt-8 grid md:grid-cols-4 gap-4">
          {[...Array(12)].map((_,i)=>(
            <div key={i} className="aspect-[4/3] rounded-xl overflow-hidden bg-[#16161D] border border-white/10">
              <img src={`https://images.unsplash.com/photo-${1486406146926 + i}-c627a92ad1ab?w=400`} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
