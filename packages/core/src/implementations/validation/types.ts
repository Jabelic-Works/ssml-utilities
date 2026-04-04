import { SourceSpan } from "../parser/types";

export type SSMLProvider = "generic" | "azure" | "google";

export interface ValidationAttributeRule {
  allowedValues?: readonly string[];
  validateValue?: (value: string) => boolean;
  allowEmpty?: boolean;
}

export interface ValidationAttributePatternRule {
  pattern: RegExp;
  rule?: ValidationAttributeRule;
}

export interface ValidationTagRule {
  attributes?: Record<string, ValidationAttributeRule>;
  attributePatterns?: ValidationAttributePatternRule[];
  allowedChildren?: readonly string[] | "any";
  allowUnknownChildren?: boolean;
  allowText?: boolean;
  selfContained?: boolean;
  textOnly?: boolean;
}

export interface SSMLValidationProfile {
  provider: SSMLProvider;
  supportedTags: Record<string, ValidationTagRule>;
}

export interface SSMLValidationOptions {
  profile?: SSMLProvider | SSMLValidationProfile;
}

export type SSMLDiagnosticCode =
  | "unsupported-tag"
  | "invalid-attribute"
  | "invalid-attribute-value"
  | "invalid-nesting"
  | "text-not-allowed"
  | "unclosed-tag"
  | "unexpected-closing-tag";

export type SSMLDiagnosticSeverity = "error" | "warning";

export interface SSMLDiagnostic {
  code: SSMLDiagnosticCode;
  severity: SSMLDiagnosticSeverity;
  message: string;
  span: SourceSpan;
  tagName?: string;
  attributeName?: string;
}
