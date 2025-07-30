/**
 * SSML要素のバリデーション機能
 */

import {
  extractTagName,
  parseAttributesFromString,
  parseTagStructure,
} from "./tag-parser";
import {
  CUSTOM_TAG_PATTERN,
  ATTRIBUTE_NAME_PATTERN,
  ATTRIBUTE_VALUE_PATTERN,
} from "./regex";

// SSMLで標準的にサポートされるタグ名
// 複数のTTSプロバイダー（Microsoft, Google, Amazon等）の仕様に基づく
export const STANDARD_SSML_TAGS = [
  // 基本SSML要素（W3C SSML仕様 + 主要プロバイダー共通）
  "speak",
  "voice",
  "prosody",
  "emphasis",
  "break",
  "sub",
  "phoneme",
  "say-as",
  "audio",
  "p",
  "s",
  "lang",
  "mark",

  // Microsoft固有のSSML要素
  "bookmark",
  "lexicon",
  "math",
  "mstts:audioduration",
  "mstts:backgroundaudio",
  "mstts:voiceconversion",
  "mstts:ttsembedding",
  "mstts:embedding",
  "mstts:express-as",
  "mstts:silence",
  "mstts:viseme",

  // Google固有のSSML要素
  "par",
  "seq",
  "media",
  "desc",

  // Amazon固有のSSML要素
  "amazon:domain",
  "amazon:effect",
  "amazon:emotion",
  "amazon:auto-breaths",

  // その他のSSML要素
  "sentence",
  "lookup",
  "token",
  "w",
];

// // 要素が含むことができる子要素の定義
// export const SSML_ELEMENT_CHILDREN: Record<string, string[]> = {
//   audio: ["audio", "break", "p", "s", "phoneme", "prosody", "say-as", "sub"],
//   bookmark: [], // 子要素なし
//   break: [], // 子要素なし
//   emphasis: [
//     "audio",
//     "break",
//     "emphasis",
//     "lang",
//     "phoneme",
//     "prosody",
//     "say-as",
//     "sub",
//   ],
//   lang: [], // mstts:backgroundaudio、voice、speak 以外のすべての要素（実装時に除外ルールを適用）
//   lexicon: [], // 子要素なし
//   math: [], // テキスト要素とMathML要素のみ（特別な処理が必要）
//   "mstts:audioduration": [], // 子要素なし
//   "mstts:backgroundaudio": [], // 子要素なし
//   "mstts:voiceconversion": [], // 子要素なし
//   "mstts:embedding": [
//     "audio",
//     "break",
//     "emphasis",
//     "lang",
//     "phoneme",
//     "prosody",
//     "say-as",
//     "sub",
//   ],
//   "mstts:express-as": [
//     "audio",
//     "break",
//     "emphasis",
//     "lang",
//     "phoneme",
//     "prosody",
//     "say-as",
//     "sub",
//   ],
//   "mstts:silence": [], // 子要素なし
//   "mstts:viseme": [], // 子要素なし
//   p: [
//     "audio",
//     "break",
//     "phoneme",
//     "prosody",
//     "say-as",
//     "sub",
//     "mstts:express-as",
//     "s",
//   ],
//   phoneme: [], // テキストのみ
//   prosody: ["audio", "break", "p", "phoneme", "prosody", "say-as", "sub", "s"],
//   s: [
//     "audio",
//     "break",
//     "phoneme",
//     "prosody",
//     "say-as",
//     "mstts:express-as",
//     "sub",
//   ],
//   "say-as": [], // テキストのみ
//   sub: [], // テキストのみ
//   voice: [], // mstts:backgroundaudio と speak 以外のすべての要素（実装時に除外ルールを適用）
// };

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
  //   allowCustomTags: true,
  //   allowJapaneseCharsForTag: false,
  //   strictMode: false,
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

  // 終了タグの場合は/を除去
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
      // STRICT
      return STANDARD_SSML_TAGS.includes(normalizedTagName);
  }
}

/**
 * 属性が有効かどうかをチェック
 */
export function isValidAttribute(attribute: string): boolean {
  if (!attribute || attribute.trim().length === 0) {
    return true; // 空の属性は許可
  }

  // name="value" または name='value' または name=value の形式
  const match = attribute.match(/^(\S+?)(?:=(.+))?$/);
  if (!match) {
    return false;
  }

  const [, name, value] = match;

  // 属性名をチェック
  if (!ATTRIBUTE_NAME_PATTERN.test(name)) {
    return false;
  }

  // 属性値がある場合はチェック
  if (value && !ATTRIBUTE_VALUE_PATTERN.test(value)) {
    return false;
  }

  return true;
}

export function isValidTag(
  tag: string,
  options: ValidationOptions = DEFAULT_VALIDATION_OPTIONS
): boolean {
  // 共通ロジックを使用してタグ構造を解析
  // const tagStructure = parseTagStructure(tag);
  const tagName = extractTagName(tag);
  if (!tagName) {
    return false;
  }

  // タグ名をバリデーション
  if (!isValidTagName(tagName, options)) {
    return false;
  }

  const attributes = parseAttributesFromString(tag);

  // 属性をバリデーション
  for (const attribute of attributes) {
    const attributeString = `${attribute.name}="${attribute.value}"`;
    if (!isValidAttribute(attributeString)) {
      return false;
    }
  }

  return true;
}

// /**
//  * 親要素が指定した子要素を含むことができるかをチェック
//  */
// export function isValidElementNesting(
//   parentElement: string,
//   childElement: string
// ): boolean {
//   // 親要素が標準SSML要素でない場合は基本的に許可（カスタム要素の場合）
//   if (!STANDARD_SSML_TAGS.includes(parentElement)) {
//     return true;
//   }

//   const allowedChildren = SSML_ELEMENT_CHILDREN[parentElement];
//   if (!allowedChildren) return true; // 定義されていない親要素は任意の子要素を保有できる

//   // 特別なルールの処理
//   if (parentElement === "lang") {
//     // langは mstts:backgroundaudio、voice、speak 以外のすべての要素を含むことができる
//     const excludedElements = ["mstts:backgroundaudio", "voice", "speak"];
//     return !excludedElements.includes(childElement);
//   }

//   if (parentElement === "voice") {
//     // voiceは mstts:backgroundaudio と speak 以外のすべての要素を含むことができる
//     const excludedElements = ["mstts:backgroundaudio", "speak"];
//     return !excludedElements.includes(childElement);
//   }

//   return allowedChildren.includes(childElement);
// }

/**
 * 要素がテキストのみを含むことができるかをチェック
 */
export function isTextOnlyElement(element: string): boolean {
  const textOnlyElements = ["phoneme", "say-as", "sub"]; // TODO: SSML_ELEMENT_CHILDRENで管理
  return textOnlyElements.includes(element);
}

/**
 * 要素が子要素を持つことができないかをチェック
 */
export function isSelfContainedElement(element: string): boolean {
  // TODO: SSML_ELEMENT_CHILDRENで管理
  const selfContainedElements = [
    "bookmark",
    "break",
    "lexicon",
    "mstts:audioduration",
    "mstts:backgroundaudio",
    "mstts:voiceconversion",
    "mstts:silence",
    "mstts:viseme",
  ];
  return selfContainedElements.includes(element);
}
