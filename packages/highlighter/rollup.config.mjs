import typescript from "@rollup/plugin-typescript";
import tslib from "tslib";

const config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.js",
        format: "es",
      },
    ],
    plugins: [
      typescript({
        tslib: tslib,
      }),
    ],
  },
];

export default config;
