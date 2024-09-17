export {
  SSMLProcessor,
  SSMLValidator,
  SSMLFormatter,
  SSMLHighlighter,
  SSMLTag,
  HighlightOptions,
  ValidationResult,
  ValidationError,
} from "./interfaces/ssml-highlighter";
export { Speech, ProsodyOptions } from "./interfaces/ssml-tags";
export { SSMLBuilder } from "./interfaces/ssml-builder";
export { DAGNode, SSMLDAG } from "./implementations/ssml-dag";

export { ssmlProcessor } from "./implementations/ssml-processor";
export { speech } from "./implementations/speech";
export { createSSMLBuilder } from "./implementations/ssml-builder";
export { ssmlHighlighter } from "./implementations/ssml-highlighter";
export { ssmlValidator } from "./implementations/ssml-validator";
export { ssmlFormatter } from "./implementations/ssml-formatter";
export { parseSSML } from "./implementations/ssml-parser";
