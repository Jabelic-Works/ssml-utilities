import { Token, TokenType, SourcePosition, SourceSpan } from "./parser/types";
import { parseTagStructure } from "./tag/tag-parser";

export function determineTagType(tag: string): TokenType {
  if (tag.startsWith("</")) return "closeTag";
  if (tag.endsWith("/>")) return "selfClosingTag";
  return "openTag";
}

export function tokenize(ssml: string): Token[] {
  const tokens: Token[] = [];
  let buffer = "";
  let inTag = false;
  let quoteChar: '"' | "'" | null = null;
  let bufferStart: SourcePosition | null = null;
  let position: SourcePosition = { offset: 0, line: 1, column: 1 };

  for (let i = 0; i < ssml.length; i++) {
    const char = ssml[i];
    const charStart = clonePosition(position);
    const charEnd = advancePosition(position, char);

    if (!inTag) {
      if (char === "<") {
        if (buffer && bufferStart) {
          pushToken(tokens, "text", buffer, createSpan(bufferStart, charStart));
        }

        buffer = char;
        bufferStart = charStart;
        inTag = true;
      } else {
        if (!bufferStart) {
          bufferStart = charStart;
        }

        buffer += char;
      }
    } else {
      if (quoteChar) {
        buffer += char;
        if (char === quoteChar) {
          quoteChar = null;
        }
      } else if (char === '"' || char === "'") {
        buffer += char;
        quoteChar = char;
      } else if (char === ">") {
        buffer += char;
        if (bufferStart) {
          pushTagOrTextToken(tokens, buffer, createSpan(bufferStart, charEnd));
        }

        buffer = "";
        bufferStart = null;
        inTag = false;
      } else if (char === "<") {
        if (buffer && bufferStart) {
          pushToken(tokens, "text", buffer, createSpan(bufferStart, charStart));
        }

        buffer = char;
        bufferStart = charStart;
        inTag = true;
      } else {
        buffer += char;
      }
    }

    position = charEnd;
  }

  if (buffer && bufferStart) {
    pushTagOrTextToken(tokens, buffer, createSpan(bufferStart, position));
  }

  return tokens;
}

function pushTagOrTextToken(tokens: Token[], value: string, sourceSpan: SourceSpan) {
  if (parseTagStructure(value)) {
    pushToken(tokens, determineTagType(value), value, sourceSpan);
  } else {
    pushToken(tokens, "text", value, sourceSpan);
  }
}

function pushToken(
  tokens: Token[],
  type: TokenType,
  value: string,
  sourceSpan: SourceSpan
): void {
  if (value.length === 0) {
    return;
  }

  tokens.push({ type, value, sourceSpan });
}

function createSpan(start: SourcePosition, end: SourcePosition): SourceSpan {
  return {
    start,
    end,
  };
}

function clonePosition(position: SourcePosition): SourcePosition {
  return {
    offset: position.offset,
    line: position.line,
    column: position.column,
  };
}

function advancePosition(
  position: SourcePosition,
  char: string
): SourcePosition {
  const next = clonePosition(position);
  next.offset += 1;

  if (char === "\n") {
    next.line += 1;
    next.column = 1;
  } else {
    next.column += 1;
  }

  return next;
}
