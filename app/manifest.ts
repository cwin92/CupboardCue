import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CupboardCue",
    short_name: "CupboardCue",
    description: "A visual menu for what you already have.",
    start_url: "/app",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#5f9a4e",
    icons: [
      {
        src: "/cookie-mark.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
