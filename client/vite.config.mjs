// vite.config.mjs
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        xfwd: true,
      },
    },
  },
  resolve: {
    alias: {
      "@azure/msal-browser": "@azure/msal-browser/dist/msal-browser.esm.js",
    },
  },
});
