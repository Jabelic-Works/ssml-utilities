/**
 * SSMLタグ解析のための共通ユーティリティ
 */

export interface ParsedAttribute {
  name: string;
  value: string;
}

export interface TagStructure {
  tagName: string;
  attributes: ParsedAttribute[];
  isSelfClosing: boolean;
  isClosingTag: boolean;
  rawContent: string; // < と > を除いた内容
}

/**
 * タグからタグ名を抽出する
 * @param tag - 完全なタグ文字列 (例: "<speak>", "</speak>", "<break time='500ms'/>")
 * @returns タグ名、または無効な場合はnull
 */
export function extractTagName(tag: string): string | null {
  if (!tag || !tag.startsWith("<") || !tag.endsWith(">")) {
    return null;
  }

  const content = tag.slice(1, -1);
  if (content.length === 0) {
    return null;
  }

  // 終了タグの場合
  if (content.startsWith("/")) {
    const tagName = content.slice(1).split(/\s/)[0];
    return tagName || null;
  }

  // セルフクロージングタグまたは開始タグの場合
  const isSelfClosing = content.endsWith("/");
  const tagContent = isSelfClosing ? content.slice(0, -1).trim() : content;

  // タグ名を抽出（最初のスペースまで）
  const tagName = tagContent.split(/\s/)[0];
  return tagName || null;
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

  if (isClosingTag) {
    // 終了タグの場合は属性なし
    const tagName = extractTagName(tag);
    if (!tagName) return null;

    return {
      tagName,
      attributes: [],
      isSelfClosing: false,
      isClosingTag: true,
      rawContent: content,
    };
  }

  const isSelfClosing = content.endsWith("/");
  const tagContent = isSelfClosing ? content.slice(0, -1).trim() : content;

  const tagName = extractTagName(tag);
  if (!tagName) return null;

  const attributes = parseAttributesFromString(tagContent);

  return {
    tagName,
    attributes,
    isSelfClosing,
    isClosingTag: false,
    rawContent: content,
  };
}

/**
 * タグの内容から属性を解析する
 * @param tagContent - タグの内容（< > を除いた部分）
 * @returns 解析された属性の配列
 */
export function parseAttributesFromString(
  tagContent: string
): ParsedAttribute[] {
  // コロンを含む属性名をサポートしつつ、正しい形式の属性のみマッチする正規表現
  // XMLの名前空間（ns:name）形式をサポートし、属性名の検証を強化
  // 属性名は英字またはアンダースコアで始まり、数字や不正な形式で始まる属性名を除外
  const attrRegex =
    /(?:^|\s)([a-zA-Z_][\w-]*(?::[\w][\w-]*)?)=["']([^"']*)["']/g;
  const attributes: ParsedAttribute[] = [];
  let match;

  while ((match = attrRegex.exec(tagContent)) !== null) {
    const [, name, value] = match;
    attributes.push({ name, value });
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
