// src/implementations/speech.ts

import { Speech, ProsodyOptions } from "../interfaces/ssml-tags";

const say = (text: string): string => text;

const pause = (time: string): string => `<break time="${time}"/>`;

const audio = (src: string): string => `<audio src="${src}"/>`;

const emphasis = (
  level: "strong" | "moderate" | "reduced",
  text: string
): string => `<emphasis level="${level}">${text}</emphasis>`;

const prosody = (options: ProsodyOptions, text: string): string => {
  const attrs = Object.entries(options)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");
  return `<prosody ${attrs}>${text}</prosody>`;
};

const sayAs = (interpretAs: string, text: string): string =>
  `<say-as interpret-as="${interpretAs}">${text}</say-as>`;

export const speech: Speech = {
  say,
  pause,
  audio,
  emphasis,
  prosody,
  sayAs,
};
