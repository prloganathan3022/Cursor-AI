import { defineConfig, loadEnv } from "vite";
import type { ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useDevProxy = env.VITE_DEV_API_PROXY === "true";
  const rawTarget = env.VITE_DEV_API_TARGET?.trim() || "http://127.0.0.1:5000";
  const proxyTarget = rawTarget.replace(/\/$/, "");

  const apiProxy: ProxyOptions = {
    target: proxyTarget,
    changeOrigin: true,
    configure(proxy) {
      proxy.on("error", (err) => {
        console.error(
          `\n[vite] API proxy → ${proxyTarget} failed: ${err.message}`,
          "\n  Start the Flask API first, e.g. npm run dev:flask  or  npm run dev:stack\n",
        );
      });
    },
  };

  return {
    base: process.env.VITE_BASE_PATH || "/",
    plugins: [react(), tailwindcss()],
    server: useDevProxy
      ? {
          proxy: {
            "/api": apiProxy,
          },
        }
      : {},
  };
});
