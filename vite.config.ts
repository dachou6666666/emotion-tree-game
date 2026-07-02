import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    emptyOutDir: true,
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: "src/main.tsx",
      output: {
        entryFileNames: "game-scene.js",
        chunkFileNames: "game-scene-[hash].js",
        assetFileNames: "game-scene-[hash][extname]"
      }
    }
  }
});
