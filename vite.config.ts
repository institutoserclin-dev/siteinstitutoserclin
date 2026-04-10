import path from "path";
import react from "@vitejs/plugin-react-swc"; // Trocamos para o SWC
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(), // Limpo e ultra-rápido
    tailwindcss(),
  ],
  resolve: { 
    alias: { "@": path.resolve(__dirname, "./src") } 
  },
  base: "/", 
  build: { 
    outDir: "dist", 
    emptyOutDir: true,
    // Garante que o build final seja otimizado
    minify: 'esbuild',
    sourcemap: false
  },
});