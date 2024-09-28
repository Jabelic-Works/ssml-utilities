import {
  SSMLHighlighter,
  HighlightOptions,
} from "../interfaces/ssml-highlighter";
import { SSMLDAG, DAGNode } from "./ssml-dag";
import { Result, success, failure } from "./parser/result";
import { parseSSML } from "./parser";

export const ssmlHighlighter: SSMLHighlighter = {
  highlight: (
    ssmlOrDag: string | Result<SSMLDAG, string>,
    options: HighlightOptions
  ): Result<string, string> => {
    const dagResult =
      typeof ssmlOrDag === "string" ? parseSSML(ssmlOrDag) : ssmlOrDag;
    if (!dagResult.ok) {
      return failure(`Failed to parse SSML: ${dagResult.error}`);
    }
    return highlightSSML(dagResult.value, options);
  },
};

function highlightSSML(
  dag: SSMLDAG,
  options: HighlightOptions
): Result<string, string> {
  function highlightNode(nodeId: string): Result<string, string> {
    const node = dag.nodes.get(nodeId);
    if (!node) {
      return failure(`Node with id ${nodeId} not found`);
    }
    switch (node.type) {
      case "element":
        const tagMatch = node.value!.match(/^<(\/?[^\s>]+)(.*)>?$/);
        if (tagMatch) {
          const [nodeValue, tagName, rest] = tagMatch;
          const attributesResult = highlightAttributes(
            extractAttributesFromNode(node)
          );
          if (!attributesResult.ok) {
            return failure(attributesResult.error);
          }
          const contentResult = highlightChildren(node);
          if (!contentResult.ok) {
            return failure(contentResult.error);
          }
          let tagContent: string;
          if (attributesResult.value) {
            tagContent = `&lt;${escapeHtml(tagName)}${attributesResult.value}`;
            if (
              node.value!.trim().endsWith("/>") ||
              rest.trim().endsWith("/")
            ) {
              tagContent += "/";
            }
            tagContent += "&gt;"; // > 文字実体参照
          } else {
            tagContent = `&lt;${escapeHtml(tagName)}${rest}`;
          }

          return success(
            `<span class="${options.classes.tag}">${tagContent}</span>${contentResult.value}`
          );
        }
        return success(
          `<span class="${options.classes.tag}">${escapeHtml(
            node.value!
          )}</span>`
        );
      case "attribute":
        if (node.value) {
          return success(
            ` <span class="${options.classes.attribute}">${escapeHtml(
              node.name!
            )}</span>=<span class="${
              options.classes.attributeValue
            }">"${escapeHtml(node.value)}"</span>`
          );
        } else {
          return success(
            ` <span class="${options.classes.attribute}">${escapeHtml(
              node.name!
            )}</span>`
          );
        }
      case "text":
        return success(
          `<span class="${options.classes.text}">${escapeHtml(
            node.value!
          )}</span>`
        );
      default:
        return failure(`Unknown node type: ${node.type}`);
    }
  }

  function highlightAttributes(attributes: string): Result<string, string> {
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
      const nameMatch = remaining.match(/^\w+/);
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

  function highlightChildren(node: DAGNode): Result<string, string> {
    const results = Array.from(node.children)
      .map((childId) => dag.nodes.get(childId))
      .filter(
        (child): child is DAGNode =>
          child !== undefined && child.type !== "attribute"
      )
      .map((child) => highlightNode(child.id));

    const errors = results.filter(
      (result): result is Result<string, string> & { ok: false } => !result.ok
    );
    if (errors.length > 0) {
      return failure(errors.map((err) => err.error).join(", "));
    }

    return success(
      results
        .filter(
          (result): result is Result<string, string> & { ok: true } => result.ok
        )
        .map((result) => result.value)
        .join("")
    );
  }

  const rootNode = Array.from(dag.nodes.values()).find(
    (node) => node.type === "root"
  );
  if (!rootNode) {
    return failure("Root node not found");
  }

  const result = highlightChildren(rootNode);
  if (!result.ok) {
    return failure(`Failed to highlight SSML: ${result.error}`);
  }

  return success(result.value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function extractAttributesFromNode(node: DAGNode): string {
  if (!node.value) {
    return "";
  }

  const value = node.value;

  // 自己閉じタグ: <tag ... />
  const selfClosingMatch = value.match(/^<(\w+)([\s\S]*?)\/>/);
  if (selfClosingMatch) {
    // タグ名の直後から、'/>' の直前までを抽出（末尾のスペースを保持）
    const extracted = value.substring(
      selfClosingMatch[1].length + 1,
      value.lastIndexOf("/>")
    );
    return extracted;
  }

  // 開始タグ: <tag ...>
  const openingTagMatch = value.match(/^<(\w+)([\s\S]*?)>/);
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
