import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";

const isReactExternal = (id: string) =>
  /^react($|\/)/.test(id) || /^react-dom($|\/)/.test(id);

export default defineConfig({
  plugins: [react(), dts({ include: ["src"] })],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.tsx"),
      name: "SSMLEditorReact",
      fileName: (format) => `index.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: (id) =>
        isReactExternal(id) || id === "@ssml-utilities/highlighter",
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "react/jsx-dev-runtime": "jsxDevRuntime",
          "@ssml-utilities/highlighter": "SSMLHighlighter",
        },
      },
    },
  },
});
