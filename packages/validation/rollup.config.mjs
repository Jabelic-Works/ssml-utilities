import typescript from "@rollup/plugin-typescript";

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
        tslib: require.resolve("tslib"),
      }),
    ],
  },
];

export default config;
