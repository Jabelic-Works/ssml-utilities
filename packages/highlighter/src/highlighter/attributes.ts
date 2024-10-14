import { DAGNode, Result, success } from "@ssml-utilities/core";
import { HighlightOptions } from "../interfaces";
import { escapeHtml } from "../utils";

export function highlightAttributes(
  attributes: string,
  options: HighlightOptions
): Result<string, string> {
  let result = "";
  let remaining = attributes;

  while (remaining.length > 0) {
    // 先頭の空白を処理
    const leadingSpaceMatch = remaining.match(/^\s+/);
    if (leadingSpaceMatch) {
      result += leadingSpaceMatch[0];
      remaining = remaining.slice(leadingSpaceMatch[0].length);
      continue;
    }
    // 属性名を処理
    const nameMatch = remaining.match(/^[\w]+/); // 属性名は、\w で始まる
    if (nameMatch) {
      const name = nameMatch[0];
      result += `<span class="${options.classes.attribute}">${escapeHtml(
        name
      )}</span>`;
      remaining = remaining.slice(name.length);
      // 等号と値を処理
      const valueMatch = remaining.match(
        /^(\s*=\s*)(?:("[^"]*"|'[^']*')|(\S+))/
      );
      if (valueMatch) {
        const [fullMatch, equals, quotedValue, unquotedValue] = valueMatch;
        const value = quotedValue || unquotedValue;

        result += escapeHtml(equals);
        if (quotedValue) {
          const quote = value[0];
          const innerValue = value.slice(1, -1);
          result += `${quote}<span class="${
            options.classes.attributeValue
          }">${escapeHtml(innerValue)}</span>${quote}`;
        } else {
          result += `<span class="${
            options.classes.attributeValue
          }">${escapeHtml(value)}</span>`;
        }
        remaining = remaining.slice(fullMatch.length);
      }
      continue;
    }

    // マッチしない文字があれば、そのまま追加して次へ
    result += escapeHtml(remaining[0]);
    remaining = remaining.slice(1);
  }

  return success(result);
}

export function extractAttributesFromNode(node: DAGNode): string {
  if (!node.value) {
    return "";
  }

  const value = node.value;

  // 自己閉じタグ: <tag ... />
  const selfClosingMatch = value.match(/^<([\w-]+)([\s\S]*?)\/>/);
  if (selfClosingMatch) {
    // タグ名の直後から、'/>' の直前までを抽出（末尾のスペースを保持）
    const extracted = value.substring(
      selfClosingMatch[1].length + 1,
      value.lastIndexOf("/>")
    );
    return extracted;
  }

  // 開始タグ: <tag ...>
  const openingTagMatch = value.match(/^<([\w-]+)([\s\S]*?)>/);
  if (openingTagMatch) {
    // タグ名の直後から、'>' の直前までを抽出
    const extracted = value.substring(
      openingTagMatch[1].length + 1,
      value.lastIndexOf(">")
    );
    return extracted;
  }

  // タグとして認識できない場合は空文字列を返す
  return "";
}
