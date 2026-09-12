import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Envol Africa",
    short_name: "Envol Africa",
    description: "Magazine, opportunités et écosystème économique panafricain.",
    start_url: "/",
    display: "standalone",
    background_color: "#fcf9f8",
    theme_color: "#9e001f",
    lang: "fr",
    icons: [
      { src: "/mobile-header-logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
