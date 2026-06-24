import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@adaptlearn/shared-foundation": fileURLToPath(new URL("../shared/src/index.ts", import.meta.url)),
      zod: fileURLToPath(new URL("./node_modules/zod/index.js", import.meta.url)),
    },
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
