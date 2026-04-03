/**
 * SSMLタグ解析のための共通ユーティリティ
 */

export interface TextRange {
  start: number;
  end: number;
}

export interface ParsedAttribute {
  name: string;
  value: string;
  raw: string;
  hasExplicitValue: boolean;
  sourceRange: TextRange;
  nameRange: TextRange;
  valueRange?: TextRange;
}

export interface TagStructure {
  tagName: string;
  attributes: ParsedAttribute[];
  isSelfClosing: boolean;
  isClosingTag: boolean;
  rawContent: string;
  rawAttributes: string;
  tagNameRange: TextRange;
  attributeSourceRange: TextRange;
  invalidFragments: TextRange[];
}

const SYNTAX_TAG_NAME_PATTERN =
  /^(?:[A-Za-z_]|[\p{L}])(?:[\w.-]|:|[\p{L}\p{N}])*$/u;

const ATTRIBUTE_TOKEN_PATTERN =
  /(?:^|\s+)([a-zA-Z_][\w-]*(?::[a-zA-Z_][\w-]*)?)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

/**
 * タグからタグ名を抽出する
 * @param tag - 完全なタグ文字列 (例: "<speak>", "</speak>", "<break time='500ms'/>")
 * @returns タグ名、または無効な場合はnull
 */
export function extractTagName(tag: string): string | null {
  const structure = parseTagStructure(tag);
  return structure?.tagName ?? null;
}

/**
 * タグの完全な構造を解析する
 * @param tag - 完全なタグ文字列
 * @returns 解析されたタグ構造、または無効な場合はnull
 */
export function parseTagStructure(tag: string): TagStructure | null {
  if (!tag || !tag.startsWith("<") || !tag.endsWith(">")) {
    return null;
  }

  const content = tag.slice(1, -1);
  if (
    content.length === 0 ||
    content.startsWith(" ") ||
    content.startsWith("　")
  ) {
    return null;
  }

  const isClosingTag = content.startsWith("/");
  const tagNameOffsetInContent = isClosingTag ? 1 : 0;
  const nameMatch = content
    .slice(tagNameOffsetInContent)
    .match(/^([^\s/>]+)/u);

  if (!nameMatch) {
    return null;
  }

  const tagName = nameMatch[1];
  if (!SYNTAX_TAG_NAME_PATTERN.test(tagName)) {
    return null;
  }

  const tagNameStart = 1 + tagNameOffsetInContent;
  const tagNameEnd = tagNameStart + tagName.length;

  if (isClosingTag) {
    const trailing = content.slice(tagNameOffsetInContent + tagName.length).trim();
    if (trailing.length > 0) {
      return null;
    }

    return {
      tagName,
      attributes: [],
      isSelfClosing: false,
      isClosingTag: true,
      rawContent: content,
      rawAttributes: "",
      tagNameRange: { start: tagNameStart, end: tagNameEnd },
      attributeSourceRange: { start: tag.length - 1, end: tag.length - 1 },
      invalidFragments: [],
    };
  }

  const trimmedContent = content.trimEnd();
  const isSelfClosing = trimmedContent.endsWith("/");
  const contentWithoutSlash = isSelfClosing
    ? trimmedContent.slice(0, -1)
    : content;
  const rawAttributes = contentWithoutSlash.slice(tagName.length);
  const attributeSourceStart = 1 + tagName.length;
  const attributes = parseAttributesFromString(
    rawAttributes,
    attributeSourceStart
  );
  const invalidFragments = collectInvalidFragments(
    rawAttributes,
    attributes,
    attributeSourceStart
  );

  return {
    tagName,
    attributes,
    isSelfClosing,
    isClosingTag: false,
    rawContent: content,
    rawAttributes,
    tagNameRange: { start: tagNameStart, end: tagNameEnd },
    attributeSourceRange: {
      start: attributeSourceStart,
      end: attributeSourceStart + rawAttributes.length,
    },
    invalidFragments,
  };
}

/**
 * タグの内容から属性を解析する
 * @param tagContent - タグ全体、または属性文字列
 * @returns 解析された属性の配列
 */
export function parseAttributesFromString(
  tagContent: string,
  baseOffset = 0
): ParsedAttribute[] {
  const { attributeSource, attributeOffset } = normalizeAttributeSource(
    tagContent,
    baseOffset
  );
  const attributes: ParsedAttribute[] = [];
  let match: RegExpExecArray | null;

  ATTRIBUTE_TOKEN_PATTERN.lastIndex = 0;
  while ((match = ATTRIBUTE_TOKEN_PATTERN.exec(attributeSource)) !== null) {
    const [fullMatch, name, doubleQuotedValue, singleQuotedValue, unquotedValue] =
      match;
    const nameStartInMatch = fullMatch.indexOf(name);
    const attributeStart = attributeOffset + match.index + nameStartInMatch;
    const attributeEnd = attributeOffset + match.index + fullMatch.length;
    const nameRange = {
      start: attributeStart,
      end: attributeStart + name.length,
    };

    const hasExplicitValue =
      doubleQuotedValue !== undefined ||
      singleQuotedValue !== undefined ||
      unquotedValue !== undefined;
    const nextCharAfterMatch = attributeSource[match.index + fullMatch.length];
    if (!hasExplicitValue && nextCharAfterMatch === "=") {
      continue;
    }

    const value = doubleQuotedValue ?? singleQuotedValue ?? unquotedValue ?? "";
    const rawValueToken =
      doubleQuotedValue !== undefined
        ? `"${doubleQuotedValue}"`
        : singleQuotedValue !== undefined
          ? `'${singleQuotedValue}'`
          : unquotedValue;
    const rawValueIndex =
      rawValueToken !== undefined ? fullMatch.lastIndexOf(rawValueToken) : -1;
    const valueRange =
      rawValueToken !== undefined && rawValueIndex >= 0
        ? {
            start:
              attributeOffset +
              match.index +
              rawValueIndex +
              (rawValueToken.startsWith('"') || rawValueToken.startsWith("'")
                ? 1
                : 0),
            end:
              attributeOffset +
              match.index +
              rawValueIndex +
              rawValueToken.length -
              (rawValueToken.startsWith('"') || rawValueToken.startsWith("'")
                ? 1
                : 0),
          }
        : undefined;

    attributes.push({
      name,
      value,
      raw: attributeSource.slice(
        attributeStart - attributeOffset,
        attributeEnd - attributeOffset
      ),
      hasExplicitValue,
      sourceRange: { start: attributeStart, end: attributeEnd },
      nameRange,
      valueRange,
    });
  }

  return attributes;
}

/**
 * 2つのタグ名が一致するかチェック（開始タグと終了タグのマッチング用）
 * @param openTagName - 開始タグのタグ名
 * @param closeTagName - 終了タグのタグ名
 * @returns タグ名が一致するかどうか
 */
export function isMatchingTagPair(
  openTagName: string,
  closeTagName: string
): boolean {
  return openTagName === closeTagName;
}

/**
 * タグから開始タグと終了タグをマッチングするための情報を抽出
 * @param openTag - 開始タグの完全な文字列
 * @param closeTag - 終了タグの完全な文字列
 * @returns タグペアが一致するかどうか
 */
export function areMatchingTagPair(openTag: string, closeTag: string): boolean {
  const openTagName = extractTagName(openTag);
  const closeTagName = extractTagName(closeTag);

  if (!openTagName || !closeTagName) return false;

  return isMatchingTagPair(openTagName, closeTagName);
}

function normalizeAttributeSource(
  source: string,
  baseOffset: number
): { attributeSource: string; attributeOffset: number } {
  if (baseOffset !== 0) {
    return { attributeSource: source, attributeOffset: baseOffset };
  }

  if (!source.startsWith("<") || !source.endsWith(">")) {
    const leadingTagLikeMatch = source.match(/^([^\s=/>]+)(\s+[\s\S]*)$/u);
    if (
      leadingTagLikeMatch &&
      leadingTagLikeMatch[2].trim().length > 0 &&
      SYNTAX_TAG_NAME_PATTERN.test(leadingTagLikeMatch[1])
    ) {
      return {
        attributeSource: leadingTagLikeMatch[2],
        attributeOffset: leadingTagLikeMatch[1].length,
      };
    }

    return { attributeSource: source, attributeOffset: baseOffset };
  }

  const structure = parseTagStructure(source);
  if (!structure || structure.isClosingTag) {
    return { attributeSource: "", attributeOffset: baseOffset };
  }

  return {
    attributeSource: structure.rawAttributes,
    attributeOffset: structure.attributeSourceRange.start,
  };
}

function collectInvalidFragments(
  attributeSource: string,
  attributes: ParsedAttribute[],
  attributeOffset: number
): TextRange[] {
  const invalidFragments: TextRange[] = [];
  let cursor = 0;

  for (const attribute of attributes) {
    const start = attribute.sourceRange.start - attributeOffset;
    if (start > cursor) {
      collectNonWhitespaceRanges(
        attributeSource.slice(cursor, start),
        cursor,
        attributeOffset,
        invalidFragments
      );
    }

    cursor = attribute.sourceRange.end - attributeOffset;
  }

  if (cursor < attributeSource.length) {
    collectNonWhitespaceRanges(
      attributeSource.slice(cursor),
      cursor,
      attributeOffset,
      invalidFragments
    );
  }

  return invalidFragments;
}

function collectNonWhitespaceRanges(
  source: string,
  localOffset: number,
  attributeOffset: number,
  ranges: TextRange[]
): void {
  let fragmentStart = -1;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const isWhitespace = /\s/.test(char);

    if (!isWhitespace && fragmentStart === -1) {
      fragmentStart = index;
      continue;
    }

    if (isWhitespace && fragmentStart !== -1) {
      ranges.push({
        start: attributeOffset + localOffset + fragmentStart,
        end: attributeOffset + localOffset + index,
      });
      fragmentStart = -1;
    }
  }

  if (fragmentStart !== -1) {
    ranges.push({
      start: attributeOffset + localOffset + fragmentStart,
      end: attributeOffset + localOffset + source.length,
    });
  }
}
