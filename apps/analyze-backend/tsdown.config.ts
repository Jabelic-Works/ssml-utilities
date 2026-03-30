import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/server.ts",
  format: ["esm"],
  deps: {
    alwaysBundle: ["@ssml-utilities/accent-ir"],
  },
  clean: true,
  dts: false,
});
