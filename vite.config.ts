import { vitePlugin as remix } from "@remix-run/dev";
import { vercelPreset } from "@vercel/remix/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

declare module "@remix-run/node" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    entries: ["app/**/*.{ts,tsx}"],
    include: ["react", "react-dom", "react/jsx-runtime", "lucide-react"],
    exclude: ["docx"],
  },
  plugins: [
    remix({
      presets: [vercelPreset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
    }),
    tailwindcss(),
  ],
});
