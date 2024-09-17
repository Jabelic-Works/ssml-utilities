// src/interfaces/ssml-highlighter.ts

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

// export interface SSMLHighlighter {
//   highlight(ssml: string, options?: Partial<HighlightOptions>): string;
// }

export interface SSMLValidator {
  validate(ssml: string): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  message: string;
  line: number;
  column: number;
}

export interface SSMLFormatter {
  format(ssml: string, indentation?: number): string;
}

export interface SSMLProcessor {
  highlighter: SSMLHighlighter;
  validator: SSMLValidator;
  formatter: SSMLFormatter;
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
  highlight: (ssml: string, options: HighlightOptions) => string;
}
