import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Calyrn",
    short_name: "Calyrn",
    description:
      "Personal crypto intelligence for market research, exposure, risk, and relevant signals.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B100E",
    theme_color: "#111A16",
    icons: [
      {
        src: "/previews/calyrn-apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
