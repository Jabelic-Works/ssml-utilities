import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/server.ts",
  format: ["esm"],
  clean: true,
  dts: false,
});
