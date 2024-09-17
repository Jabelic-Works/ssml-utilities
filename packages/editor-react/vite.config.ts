import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), dts({ include: ["src"] })],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "SSMLEditorReact",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "@ssml-utilities/core"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@ssml-utilities/core": "SSMLUtilitiesCore",
        },
      },
    },
  },
});
