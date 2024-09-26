import { Token, TokenType } from "./types";

export function determineTagType(tag: string): TokenType {
  if (tag.startsWith("</")) return "closeTag";
  if (tag.endsWith("/>")) return "selfClosingTag";
  return "openTag";
}

export function tokenize(ssml: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";
  let inTag = false;

  for (const char of ssml) {
    if (char === "<" && !inTag) {
      if (buffer) tokens.push({ type: "text", value: buffer });
      buffer = char;
      inTag = true;
    } else if (char === ">" && inTag) {
      buffer += char;
      const type = determineTagType(buffer);
      tokens.push({ type, value: buffer });
      buffer = "";
      inTag = false;
    } else {
      buffer += char;
    }
  }

  if (buffer) tokens.push({ type: "text", value: buffer });
  return tokens;
}
