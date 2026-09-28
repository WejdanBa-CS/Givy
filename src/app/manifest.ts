import type { MetadataRoute } from "next";

/** Home-screen / install name must stay short — do not use the marketing title. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Givy",
    short_name: "Givy",
    description:
      "Create one list, share one link, and let friends claim gifts privately.",
    start_url: "/",
    display: "standalone",
    background_color: "#FEF6EE",
    theme_color: "#FEF6EE",
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
