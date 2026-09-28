export type WabBackgroundPreset = {
  id: string;
  name: string;
  gradient: string;
  previewBg: string;
  textColor: string;
  tagColor: string;
};

export const WAB_BACKGROUND_PRESETS: WabBackgroundPreset[] = [
  {
    id: "noir",
    name: "Noir Onyx",
    gradient: "linear-gradient(135deg, #0a0f18 0%, #111827 50%, #030712 100%)",
    previewBg: "#0a0f18",
    textColor: "#ffffff",
    tagColor: "#8ee0c0",
  },
  {
    id: "bleu-nuit",
    name: "Bleu Envol",
    gradient: "linear-gradient(135deg, #071b36 0%, #082843 50%, #0c3960 100%)",
    previewBg: "#071b36",
    textColor: "#ffffff",
    tagColor: "#8ee0c0",
  },
  {
    id: "bleu-ocean",
    name: "Bleu Océan",
    gradient: "linear-gradient(135deg, #005f73 0%, #0a9396 50%, #006874 100%)",
    previewBg: "#006874",
    textColor: "#ffffff",
    tagColor: "#ffe6a7",
  },
  {
    id: "vert-emeraude",
    name: "Émeraude Panafricain",
    gradient: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
    previewBg: "#047857",
    textColor: "#ffffff",
    tagColor: "#a7f3d0",
  },
  {
    id: "bordeaux",
    name: "Bordeaux Impérial",
    gradient: "linear-gradient(135deg, #4a0404 0%, #7f1d1d 50%, #991b1b 100%)",
    previewBg: "#7f1d1d",
    textColor: "#ffffff",
    tagColor: "#fecaca",
  },
  {
    id: "violet-royal",
    name: "Violet Royal",
    gradient: "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #6b21a8 100%)",
    previewBg: "#581c87",
    textColor: "#ffffff",
    tagColor: "#e9d5ff",
  },
  {
    id: "sunset-africain",
    name: "Coucher de Soleil",
    gradient: "linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)",
    previewBg: "#ea580c",
    textColor: "#ffffff",
    tagColor: "#fef08a",
  },
  {
    id: "or-bronze",
    name: "Or & Bronze",
    gradient: "linear-gradient(135deg, #713f12 0%, #854d0e 50%, #a16207 100%)",
    previewBg: "#a16207",
    textColor: "#ffffff",
    tagColor: "#fef3c7",
  },
];

export function getWabBackground(id?: string | null): WabBackgroundPreset | null {
  if (!id) return null;
  return WAB_BACKGROUND_PRESETS.find((p) => p.id === id) || null;
}
