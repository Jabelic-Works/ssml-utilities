export { DAGNode, SSMLDAG, NodeType } from "./implementations/dag";
export { Result, success, failure } from "./implementations/result";
export { parseSSML } from "./implementations/parser/index";
export {
  isValidTag,
  isValidTagName,
  isValidAttribute,
  isTextOnlyElement,
  isSelfContainedElement,
  STANDARD_SSML_TAGS,
  ValidationOptions,
  DEFAULT_VALIDATION_OPTIONS,
} from "./implementations/tag/validate";
export {
  Token,
  TokenType,
  SourcePosition,
  SourceSpan,
} from "./implementations/parser/types";
export { tokenize } from "./implementations/lexer";
export {
  parseAttributesFromString,
  extractTagName,
  parseTagStructure,
  SYNTAX_TAG_NAME_PATTERN,
  ATTRIBUTE_TOKEN_PATTERN,
} from "./implementations/tag/tag-parser";
export {
  VALID_TAG_NAME_PATTERN,
  CUSTOM_TAG_PATTERN,
  ATTRIBUTE_NAME_PATTERN,
  ATTRIBUTE_VALUE_PATTERN,
} from "./implementations/tag/regex";
export { validateSSML } from "./implementations/validation";
export {
  GENERIC_SSML_PROFILE,
  AZURE_SSML_PROFILE,
  GOOGLE_SSML_PROFILE,
  getValidationProfile,
} from "./implementations/validation/profiles";
export type {
  SSMLProvider,
  ValidationAttributeRule,
  ValidationAttributePatternRule,
  ValidationTagRule,
  SSMLValidationProfile,
  SSMLValidationOptions,
  SSMLDiagnosticCode,
  SSMLDiagnosticSeverity,
  SSMLDiagnostic,
} from "./implementations/validation/types";
