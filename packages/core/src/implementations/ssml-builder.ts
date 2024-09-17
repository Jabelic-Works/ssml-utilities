// src/implementations/ssml-builder.ts

import { SSMLBuilder } from "../interfaces/ssml-builder";
import { speech } from "./speech";

const createSSMLBuilder = (): SSMLBuilder => {
  let ssml: string[] = [];

  const build = (): string => `<speak>${ssml.join("")}</speak>`;

  const reset = (): void => {
    ssml = [];
  };

  const add = (content: string): SSMLBuilder => {
    ssml.push(content);
    return builder;
  };

  const builder: SSMLBuilder = {
    speech,
    build,
    reset,
    add,
  };

  return builder;
};

export { createSSMLBuilder };
