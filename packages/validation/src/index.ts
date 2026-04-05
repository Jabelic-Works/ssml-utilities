export { validateSSML } from "./validate";
export {
  GENERIC_SSML_PROFILE,
  AZURE_SSML_PROFILE,
  GOOGLE_SSML_PROFILE,
  getValidationProfile,
} from "./profiles";
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
} from "./types";
