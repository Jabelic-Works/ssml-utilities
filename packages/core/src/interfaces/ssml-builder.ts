// src/interfaces/ssml-builder.ts

import { Speech } from "./ssml-tags";

export interface SSMLBuilder {
  speech: Speech;
  build(): string;
  reset(): void;
  add(content: string): SSMLBuilder;
}
