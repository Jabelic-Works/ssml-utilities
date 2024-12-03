import { Token, TokenType } from "./parser/types";

export function determineTagType(tag: string): TokenType {
  if (tag.startsWith("</")) return "closeTag";
  if (tag.endsWith("/>")) return "selfClosingTag";
  return "openTag";
}

export function tokenize(ssml: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";
  let inTag = false;

  for (let i = 0; i < ssml.length; i++) {
    const char = ssml[i];

    if (char === "<") {
      if (!inTag) {
        // タグの開始を検出
        if (buffer) tokens.push({ type: "text", value: buffer });
        buffer = char;
        inTag = true;
      } else {
        // タグ内で < を検出した場合、前の < をテキストとして扱う
        tokens.push({ type: "text", value: buffer });
        buffer = char;
      }
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

  if (buffer) {
    // 残ったバッファをテキストとして扱う
    if (inTag && isValidTag(buffer)) {
      const type = determineTagType(buffer);
      tokens.push({ type, value: buffer });
    } else {
      tokens.push({ type: "text", value: buffer });
    }
  }

  return tokens;
}

function isValidTag(tag: string): boolean {
  return /^<[\w-\\n]+(\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?>$/.test(
    tag
  );
}
