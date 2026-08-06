import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WealthDock",
    short_name: "WealthDock",
    description: "Private, local-first personal finance.",
    start_url: "/",
    display: "standalone",
    background_color: "#080a10",
    theme_color: "#8b7cff",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
