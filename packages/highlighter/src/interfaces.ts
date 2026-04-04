import {
  Result,
  SSMLDAG,
  SSMLDiagnostic,
  SSMLProvider,
  SSMLValidationProfile,
} from "@ssml-utilities/core";

export interface HighlightClasses {
  tag: string;
  attribute: string;
  attributeValue: string;
  text: string;
  unsupportedTag?: string;
  invalidAttribute?: string;
  invalidAttributeValue?: string;
  invalidNesting?: string;
  invalidText?: string;
  error?: string;
  warning?: string;
}

export interface HighlightOptions {
  classes: HighlightClasses;
  indentation?: number;
  profile?: SSMLProvider | SSMLValidationProfile;
  diagnostics?: SSMLDiagnostic[];
}

export interface HighlightedSSML {
  html: string;
  diagnostics: SSMLDiagnostic[];
}

export interface SSMLProcessor {
  highlighter: SSMLHighlighter;
}

export interface SSMLHighlighter {
  highlight: (
    ssmlOrDag: string | Result<SSMLDAG, string>,
    options: HighlightOptions
  ) => Result<string, string>;
  highlightDetailed: (
    ssmlOrDag: string | Result<SSMLDAG, string>,
    options: HighlightOptions
  ) => Result<HighlightedSSML, string>;
}
