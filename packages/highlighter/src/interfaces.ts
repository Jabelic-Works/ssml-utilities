// src/interfaces/ssml-highlighter.ts

import { Result } from "@ssml-utilities/core";
import { SSMLDAG } from "@ssml-utilities/core";

export interface SSMLTag {
  name: string;
  attributes?: Record<string, string>;
  content?: string;
  isClosing?: boolean;
}
export interface HighlightOptions {
  classes: {
    tag: string;
    attribute: string;
    attributeValue: string;
    text: string;
  };
  indentation: number;
}

// export interface SSMLValidator {
//   validate(ssml: string): ValidationResult;
// }

// export interface ValidationResult {
//   isValid: boolean;
//   errors: ValidationError[];
// }

// export interface ValidationError {
//   message: string;
//   line: number;
//   column: number;
// }

// export interface SSMLFormatter {
//   format(ssml: string, indentation?: number): string;
// }

export interface SSMLProcessor {
  highlighter: SSMLHighlighter;
  // validator: SSMLValidator;
  // formatter: SSMLFormatter;
}

export interface HighlightOptions {
  classes: {
    tag: string;
    attribute: string;
    attributeValue: string;
    text: string;
  };
}

export interface SSMLHighlighter {
  highlight: (
    ssmlOrDag: string | Result<SSMLDAG, string>,
    options: HighlightOptions
  ) => Result<string, string>;
}
