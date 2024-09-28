export type TokenType = "openTag" | "closeTag" | "selfClosingTag" | "text";

export interface Token {
  type: TokenType;
  value: string;
}

export interface ParsedAttribute {
  name: string;
  value: string;
}
