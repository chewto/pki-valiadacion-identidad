import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";

const srcPath = (path: string) =>
  fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@layouts": srcPath("layouts"),
      "@pages": srcPath("pages"),
      "@components": srcPath("components"),
      "@styles": srcPath("styles"),
      "@nucleo": srcPath("nucleo"),
      "@assets": srcPath("assets"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
