import { DAGNode, parseTagStructure, Result, success } from "@ssml-utilities/core";
import { HighlightOptions } from "../interfaces";
import {
  escapeHtml,
  getIntersectingDiagnostics,
  mergeClasses,
} from "../utils";

export function highlightAttributes(
  attributes: string,
  options: HighlightOptions,
  baseOffset = 0
): Result<string, string> {
  let result = "";
  let remaining = attributes;
  let consumedLength = 0;

  while (remaining.length > 0) {
    // 先頭の空白を処理
    const leadingSpaceMatch = remaining.match(/^\s+/);
    if (leadingSpaceMatch) {
      result += leadingSpaceMatch[0];
      consumedLength += leadingSpaceMatch[0].length;
      remaining = remaining.slice(leadingSpaceMatch[0].length);
      continue;
    }

    // 属性名を処理（名前空間のコロンを含む場合も対応）
    const nameMatch = remaining.match(
      /^([a-zA-Z_][\w-]*(?::[a-zA-Z_][\w-]*)?)/
    );
    if (nameMatch) {
      const name = nameMatch[0];
      const nameClasses = mergeClasses(
        options.classes.attribute,
        ...getAttributeClasses(
          options,
          baseOffset + consumedLength,
          baseOffset + consumedLength + name.length,
          "name"
        )
      );
      result += `<span class="${nameClasses}">${escapeHtml(name)}</span>`;
      remaining = remaining.slice(name.length);
      consumedLength += name.length;

      // 等号と値を処理
      const valueMatch = remaining.match(
        /^(\s*=\s*)(?:("[^"]*"|'[^']*')|(\S+))/
      );
      if (valueMatch) {
        const [fullMatch, equals, quotedValue, unquotedValue] = valueMatch;
        const value = quotedValue || unquotedValue;
        const valueStart = baseOffset + consumedLength + fullMatch.lastIndexOf(value);
        const valueClasses = mergeClasses(
          options.classes.attributeValue,
          ...getAttributeClasses(
            options,
            valueStart + (quotedValue ? 1 : 0),
            valueStart + value.length - (quotedValue ? 1 : 0),
            "value"
          )
        );

        result += escapeHtml(equals);
        if (quotedValue) {
          const quote = value[0];
          const innerValue = value.slice(1, -1);
          result += `${quote}<span class="${valueClasses}">${escapeHtml(
            innerValue
          )}</span>${quote}`;
        } else {
          result += `<span class="${valueClasses}">${escapeHtml(value)}</span>`;
        }
        remaining = remaining.slice(fullMatch.length);
        consumedLength += fullMatch.length;
      }
      continue;
    }

    // マッチしない文字があれば、そのまま追加して次へ
    const invalidClasses = mergeClasses(
      options.classes.invalidAttribute,
      ...getAttributeClasses(
        options,
        baseOffset + consumedLength,
        baseOffset + consumedLength + 1,
        "name"
      )
    );
    const invalidChar = escapeHtml(remaining[0]);
    result += invalidClasses
      ? `<span class="${invalidClasses}">${invalidChar}</span>`
      : invalidChar;
    remaining = remaining.slice(1);
    consumedLength += 1;
  }

  return success(result);
}

export function extractAttributesFromNode(node: DAGNode): string {
  if (!node.value) {
    return "";
  }

  const structure = parseTagStructure(node.value);
  return structure?.rawAttributes ?? "";
}

function getAttributeClasses(
  options: HighlightOptions,
  startOffset: number,
  endOffset: number,
  target: "name" | "value"
): string[] {
  const diagnostics = getIntersectingDiagnostics(
    options.diagnostics,
    startOffset,
    endOffset,
    ["invalid-attribute", "invalid-attribute-value"]
  );
  const classes = new Set<string>();

  for (const diagnostic of diagnostics) {
    if (
      diagnostic.code === "invalid-attribute" &&
      target === "name" &&
      options.classes.invalidAttribute
    ) {
      classes.add(options.classes.invalidAttribute);
    }

    if (diagnostic.code === "invalid-attribute-value" && target === "value") {
      if (options.classes.invalidAttributeValue) {
        classes.add(options.classes.invalidAttributeValue);
      } else if (options.classes.invalidAttribute) {
        classes.add(options.classes.invalidAttribute);
      }
    }

    if (diagnostic.severity === "error" && options.classes.error) {
      classes.add(options.classes.error);
    }

    if (diagnostic.severity === "warning" && options.classes.warning) {
      classes.add(options.classes.warning);
    }
  }

  return Array.from(classes);
}
