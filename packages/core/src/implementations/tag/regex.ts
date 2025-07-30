// タグ名の基本的なバリデーションパターン（英字で始まり、英数字・ハイフン・コロンを含む）
export const VALID_TAG_NAME_PATTERN = /^[a-zA-Z][\w-:]*$/;

// カスタムタグ名のパターン（日本語文字も含む）
export const CUSTOM_TAG_PATTERN =
  /^[a-zA-Z\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF][a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF_-]*$/;

// 属性名のパターン
export const ATTRIBUTE_NAME_PATTERN =
  /^[a-zA-Z_][a-zA-Z0-9_-]*(?::[a-zA-Z_][a-zA-Z0-9_-]*)?$/;

// 属性値のパターン（引用符付きまたは引用符なし）
export const ATTRIBUTE_VALUE_PATTERN = /^(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+)$/;
