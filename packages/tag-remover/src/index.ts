/**
 * SSML Tag Remover - SSMLタグを削除してプレーンテキストを抽出
 * @augments Jabelic
 */

import { STANDARD_SSML_TAGS } from "@ssml-utilities/core";
import { SSMLTextExtractor } from "./extractor";
import { ExtractOptions } from "./interface";
import {
  ValidationOptions,
  DEFAULT_VALIDATION_OPTIONS,
} from "@ssml-utilities/core";

// Legacy interface for backward compatibility
export interface TagRemovalOptions {
  /** 改行を保持するかどうか（デフォルト: true） */
  preserveNewlines?: boolean;
  /** 複数の空白を単一スペースに変換するかどうか（デフォルト: true） */
  normalizeSpaces?: boolean;
  /** 先頭と末尾の空白を削除するかどうか（デフォルト: true） */
  trim?: boolean;
  /** SSMLタグ検証オプション（デフォルト: STRICT） */
  validationOptions?: ValidationOptions;
}

export const DEFAULT_REMOVAL_OPTIONS: TagRemovalOptions = {
  preserveNewlines: true,
  normalizeSpaces: true,
  trim: true,
  validationOptions: DEFAULT_VALIDATION_OPTIONS,
};

// Backward compatibility wrappers using the advanced extractor
const defaultExtractor = new SSMLTextExtractor();

/**
 * SSMLからすべての有効なSSMLタグを削除してプレーンテキストを返す
 * @param ssml - SSML文字列
 * @param options - タグ削除オプション
 * @returns プレーンテキスト
 */
export function removeSSMLTags(
  ssml: string,
  options: TagRemovalOptions = DEFAULT_REMOVAL_OPTIONS
): string {
  const extractOptions: Partial<ExtractOptions> = {
    preserveNewlines: options.preserveNewlines,
    normalizeSpaces: options.normalizeSpaces,
    trim: options.trim,
    validationOptions: options.validationOptions,
  };

  return defaultExtractor.extract(ssml, extractOptions).text;
}

/**
 * SSMLから特定の有効なSSMLタグのみを削除する
 * @param ssml - SSML文字列
 * @param tagNames - 削除するタグ名の配列
 * @param options - タグ削除オプション
 * @returns 指定したタグが削除されたSSML文字列
 */
export function removeSpecificTags(
  ssml: string,
  tagNames: string[],
  options: TagRemovalOptions = DEFAULT_REMOVAL_OPTIONS
): string {
  if (!ssml || typeof ssml !== "string" || !tagNames.length) {
    return ssml;
  }

  const opts = { ...DEFAULT_REMOVAL_OPTIONS, ...options };

  // 正規表現ベースの実装（特定タグのみ削除）
  let result = ssml
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<\?[\s\S]*?\?>/g, "");

  // 有効なSSMLタグ名のみをフィルタリング
  const validTagNames = tagNames.filter((tagName) =>
    STANDARD_SSML_TAGS.includes(tagName)
  );

  if (validTagNames.length === 0) {
    return result; // 有効なタグがない場合はそのまま返す
  }

  // 有効な指定されたタグのみ削除
  const tagPattern = new RegExp(
    `</?(?:${validTagNames
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})(?:\\s[^>]*)?/?>`,
    "gi"
  );

  result = result.replace(tagPattern, "");

  // 後処理
  if (!opts.preserveNewlines) {
    result = result.replace(/\r?\n/g, " ");
  }

  if (opts.normalizeSpaces) {
    if (opts.preserveNewlines) {
      result = result.replace(/[ \t\f\v]+/g, " ");
    } else {
      result = result.replace(/\s+/g, " ");
    }
  }

  if (opts.trim) {
    result = result.trim();
  }

  return result;
}

/**
 * 有効なSSMLタグから特定のタグ内のテキストのみを抽出する
 * @param ssml - SSML文字列
 * @param tagName - 抽出するタグ名
 * @param validationOptions - タグ検証オプション
 * @returns 指定したタグ内のテキストの配列
 */
export function extractTextFromTag(
  ssml: string,
  tagName: string,
  validationOptions: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
): string[] {
  if (!ssml || typeof ssml !== "string" || !tagName) {
    return [];
  }

  // STRICTモードでタグ名が有効でない場合は空配列を返す
  if (
    validationOptions.allowMode === "STRICT" &&
    !STANDARD_SSML_TAGS.includes(tagName)
  ) {
    return [];
  }

  const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tagPattern = new RegExp(
    `<${escapedTagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${escapedTagName}>`,
    "gi"
  );

  const matches: string[] = [];
  let match;

  while ((match = tagPattern.exec(ssml)) !== null) {
    const content = removeSSMLTags(match[1], { validationOptions });
    if (content.trim()) {
      matches.push(content);
    }
  }

  return matches;
}

/**
 * SSMLが有効な形式かどうかの簡易チェック（有効なSSMLタグのみ対象）
 * @param ssml - チェックするSSML文字列
 * @param validationOptions - タグ検証オプション
 * @returns 有効な形式かどうか
 */
export function isValidSSMLStructure(
  ssml: string,
  validationOptions: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
): boolean {
  if (!ssml || typeof ssml !== "string") {
    return false;
  }

  // 基本的なタグのバランスチェック（有効なSSMLタグのみ）
  const openTags: string[] = [];
  const tagShapePattern = /<\/?([a-zA-Z][a-zA-Z0-9:-]*)[^>]*>/g;
  let match;

  while ((match = tagShapePattern.exec(ssml)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1];

    // STRICTモードでは標準タグのみチェック
    if (
      validationOptions.allowMode === "STRICT" &&
      !STANDARD_SSML_TAGS.includes(tagName)
    ) {
      continue; // 無効なタグはチェック対象外
    }

    if (fullMatch.endsWith("/>")) {
      // 自己完結タグ - スタックに影響なし
      continue;
    } else if (fullMatch.startsWith("</")) {
      // 終了タグ
      if (openTags.length === 0 || openTags.pop() !== tagName) {
        return false; // 不一致または余分な終了タグ
      }
    } else {
      // 開始タグ
      openTags.push(tagName);
    }
  }

  // すべてのタグが閉じられているかチェック
  return openTags.length === 0;
}
