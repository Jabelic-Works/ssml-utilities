export type TokenType = "openTag" | "closeTag" | "selfClosingTag" | "text";

export interface SourcePosition {
  offset: number;
  line: number;
  column: number;
}

export interface SourceSpan {
  start: SourcePosition;
  end: SourcePosition;
}

export interface Token {
  type: TokenType;
  value: string;
  sourceSpan?: SourceSpan;
}
