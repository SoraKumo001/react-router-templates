import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import serverAdapter from "hono-react-router-adapter/vite";
import type { cloudflareAdapter } from "@hono/vite-dev-server/cloudflare";
import { getPlatformProxy } from "wrangler";
import { defaultOptions } from "@hono/vite-dev-server";

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
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  experimental: { enableNativePlugin: true },
});
