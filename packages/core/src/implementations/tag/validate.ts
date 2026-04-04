/**
 * SSML要素の基本バリデーション機能
 */

import { parseTagStructure } from "./tag-parser";
import {
  CUSTOM_TAG_PATTERN,
  ATTRIBUTE_NAME_PATTERN,
  ATTRIBUTE_VALUE_PATTERN,
} from "./regex";
import { GENERIC_SSML_PROFILE } from "../validation/profiles";

const TEXT_ONLY_ELEMENTS = new Set(["phoneme", "say-as", "sub"]);
const SELF_CONTAINED_ELEMENTS = new Set([
  "bookmark",
  "break",
  "lexicon",
  "mark",
  "mstts:audioduration",
  "mstts:backgroundaudio",
  "mstts:voiceconversion",
  "mstts:silence",
  "mstts:viseme",
]);

export const STANDARD_SSML_TAGS = Object.freeze(
  Object.keys(GENERIC_SSML_PROFILE.supportedTags)
);

export interface ValidationOptions {
  /**
   * tag validation mode
   * STRICT: 厳密モード（標準タグのみ許可）
   * ALLOW_JAPANESE: タグ名として日本語文字を許可するか
   * ALLOW_CUSTOM_ONLY_EN_CHARS: カスタム（非標準）タグを許可するか
   */
  allowMode: "STRICT" | "ALLOW_JAPANESE" | "ALLOW_CUSTOM_ONLY_EN_CHARS";
}

export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  allowMode: "STRICT",
};

/**
 * タグ名が有効かどうかをチェック
 * @param tagName - チェックするタグ名
 * @param options - バリデーションオプション
 * @returns タグ名が有効かどうか
 */
export function isValidTagName(
  tagName: string,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
): boolean {
  if (!tagName || tagName.length === 0) {
    return false;
  }

  const normalizedTagName = tagName.startsWith("/")
    ? tagName.slice(1)
    : tagName;

  switch (options.allowMode) {
    case "STRICT":
      return STANDARD_SSML_TAGS.includes(normalizedTagName);
    case "ALLOW_CUSTOM_ONLY_EN_CHARS":
      return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(normalizedTagName);
    case "ALLOW_JAPANESE":
      return CUSTOM_TAG_PATTERN.test(normalizedTagName);
    default:
      return STANDARD_SSML_TAGS.includes(normalizedTagName);
  }
}

/**
 * 属性が有効かどうかをチェック
 */
export function isValidAttribute(attribute: string): boolean {
  if (!attribute || attribute.trim().length === 0) {
    return true;
  }

  const match = attribute.match(/^(\S+?)(?:=(.+))?$/);
  if (!match) {
    return false;
  }

  const [, name, value] = match;
  if (!ATTRIBUTE_NAME_PATTERN.test(name)) {
    return false;
  }

  if (value && !ATTRIBUTE_VALUE_PATTERN.test(value)) {
    return false;
  }

  return true;
}

export function isValidTag(
  tag: string,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
): boolean {
  const structure = parseTagStructure(tag);
  if (!structure || structure.invalidFragments.length > 0) {
    return false;
  }

  if (!isValidTagName(structure.tagName, options)) {
    return false;
  }

  return structure.attributes.every((attribute) => isValidAttribute(attribute.raw));
}

/**
 * 要素がテキストのみを含むことができるかをチェック
 */
export function isTextOnlyElement(element: string): boolean {
  return TEXT_ONLY_ELEMENTS.has(element);
}

/**
 * 要素が子要素を持つことができないかをチェック
 */
export function isSelfContainedElement(element: string): boolean {
  return SELF_CONTAINED_ELEMENTS.has(element);
}
