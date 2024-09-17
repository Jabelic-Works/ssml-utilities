// src/implementations/ssml-processor.ts

import { SSMLProcessor } from "../interfaces/ssml-highlighter";
import { ssmlHighlighter } from "./ssml-highlighter";
import { ssmlValidator } from "./ssml-validator";
import { ssmlFormatter } from "./ssml-formatter";

export const ssmlProcessor: SSMLProcessor = {
  highlighter: ssmlHighlighter,
  validator: ssmlValidator,
  formatter: ssmlFormatter,
};
