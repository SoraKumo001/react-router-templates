import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import serverAdapter, { defaultOptions } from "@hono/vite-dev-server";
import type { cloudflareAdapter } from "@hono/vite-dev-server/cloudflare";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getPlatformProxy, unstable_getVarsForDev } from "wrangler";

// Entry file
const entry = "./workers/app.ts";

// Prevent tampering with Hono's Cloudflare parameters executed by default
const adapter: typeof cloudflareAdapter = async (options) => {
  const proxy = await getPlatformProxy(options?.proxy);
  return {
    env: proxy.env,
    executionContext: proxy.ctx,
    onServerClose: () => proxy.dispose(),
  };
};

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "../build/server/index.js",
        replacement: "virtual:react-router/server-build",
      },
    ],
  },
  ssr: {
    resolve: {
      externalConditions: ["worker"],
    },
  },
  plugins: [
    serverAdapter({
      adapter,
      entry,
      // Asset adjustment
      exclude: [...defaultOptions.exclude, /\.(webp|png|svg)(\?.*)?$/],
      // HMR adjustment
      handleHotUpdate: ({ server, modules }) => {
        const isServer = modules.some((mod) => {
          return mod._ssrModule?.id && !mod._clientModule;
        });
        if (isServer) {
          server.hot.send({ type: "full-reload" });
          return [];
        }
      },
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  experimental: { enableNativePlugin: true },
});
