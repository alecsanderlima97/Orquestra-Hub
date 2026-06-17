import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#061827",
    description: "Orquestra Hub: gestão financeira empresarial com IA.",
    display: "standalone",
    icons: [
      { purpose: "any", sizes: "192x192", src: "/icons/orquestra-icon-192.png", type: "image/png" },
      { purpose: "any", sizes: "512x512", src: "/icons/orquestra-icon-512.png", type: "image/png" },
      { purpose: "maskable", sizes: "512x512", src: "/icons/orquestra-icon-maskable-512.png", type: "image/png" },
      { purpose: "any", sizes: "512x512", src: "/icons/orquestra-icon.svg", type: "image/svg+xml" },
    ],
    name: "Orquestra Hub",
    short_name: "Orquestra Hub",
    start_url: "/",
    theme_color: "#0891b2",
  };
}
