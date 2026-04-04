import {
  DAGNode,
  failure,
  parseTagStructure,
  Result,
  SSMLDAG,
  success,
} from "@ssml-utilities/core";
import { HighlightOptions } from "../interfaces";
import { extractAttributesFromNode, highlightAttributes } from "./attributes";
import { highlightChildren } from "./children";
import { escapeHtml, getIntersectingDiagnostics, mergeClasses } from "../utils";

export function highlightNode(
  nodeId: string,
  dag: SSMLDAG,
  options: HighlightOptions
): Result<string, string> {
  const node = dag.nodes.get(nodeId);
  if (!node) {
    return failure(`Node with id ${nodeId} not found`);
  }

  switch (node.type) {
    case "element": {
      return highlightElementNode(node, dag, options);
    }
    case "attribute": {
      const attributeClasses = mergeClasses(
        options.classes.attribute,
        ...getSpanClasses(
          options,
          node.sourceSpan,
          ["invalid-attribute", "invalid-attribute-value"],
          "attribute"
        )
      );
      const attributeValueClasses = mergeClasses(
        options.classes.attributeValue,
        ...getSpanClasses(
          options,
          node.sourceSpan,
          ["invalid-attribute-value"],
          "attributeValue"
        )
      );

      if (node.value) {
        return success(
          ` <span class="${attributeClasses}">${escapeHtml(
            node.name!
          )}</span>=<span class="${attributeValueClasses}">"${escapeHtml(
            node.value
          )}"</span>`
        );
      } else {
        return success(
          ` <span class="${attributeClasses}">${escapeHtml(
            node.name!
          )}</span>`
        );
      }
    }
    case "text": {
      const textClasses = mergeClasses(
        options.classes.text,
        ...getSpanClasses(options, node.sourceSpan, ["text-not-allowed"], "text")
      );

      return success(
        `<span class="${textClasses}">${escapeHtml(
          node.value!
        )}</span>`
      );
    }
    default: {
      return failure(`Unknown node type: ${node.type}`);
    }
  }
}

function highlightElementNode(
  node: DAGNode,
  dag: SSMLDAG,
  options: HighlightOptions
): Result<string, string> {
  if (!node.value) {
    return success(
      `<span class="${options.classes.tag}">${escapeHtml("")}</span>`
    );
  }

  const structure = parseTagStructure(node.value);
  if (!structure) {
    return success(
      `<span class="${options.classes.tag}">${escapeHtml(node.value)}</span>`
    );
  }

  const tagClasses = mergeClasses(
    options.classes.tag,
    ...getSpanClasses(
      options,
      node.sourceSpan,
      [
        "unsupported-tag",
        "invalid-nesting",
        "unclosed-tag",
        "unexpected-closing-tag",
      ],
      "tag"
    )
  );

  const attributeSource = extractAttributesFromNode(node);
  const attributeOffset =
    node.sourceSpan && structure.rawAttributes.length > 0
      ? node.sourceSpan.start.offset + structure.attributeSourceRange.start
      : undefined;
  const attributesResult =
    attributeOffset === undefined
      ? highlightAttributes(attributeSource, options)
      : highlightAttributes(attributeSource, options, attributeOffset);
  if (!attributesResult.ok) {
    return failure(attributesResult.error);
  }

  if (structure.isClosingTag) {
    return success(
      `<span class="${tagClasses}">&lt;/${escapeHtml(structure.tagName)}&gt;</span>`
    );
  }

  const contentResult = highlightChildren(node, dag, options);
  if (!contentResult.ok) {
    return failure(contentResult.error);
  }

  const closeSuffix = structure.isSelfClosing ? "/&gt;" : "&gt;";
  const tagContent = `&lt;${escapeHtml(structure.tagName)}${attributesResult.value}${closeSuffix}`;

  return success(
    `<span class="${tagClasses}">${tagContent}</span>${contentResult.value}`
  );
}

function getSpanClasses(
  options: HighlightOptions,
  sourceSpan: DAGNode["sourceSpan"],
  codes: string[],
  target: "tag" | "attribute" | "attributeValue" | "text"
): string[] {
  if (!sourceSpan) {
    return [];
  }

  const diagnostics = getIntersectingDiagnostics(
    options.diagnostics,
    sourceSpan.start.offset,
    sourceSpan.end.offset,
    codes
  );
  const classes = new Set<string>();

  for (const diagnostic of diagnostics) {
    if (diagnostic.code === "unsupported-tag" && options.classes.unsupportedTag) {
      classes.add(options.classes.unsupportedTag);
    }

    if (
      ["invalid-nesting", "unclosed-tag", "unexpected-closing-tag"].includes(
        diagnostic.code
      ) &&
      options.classes.invalidNesting
    ) {
      classes.add(options.classes.invalidNesting);
    }

    if (
      diagnostic.code === "invalid-attribute" &&
      options.classes.invalidAttribute &&
      target === "attribute"
    ) {
      classes.add(options.classes.invalidAttribute);
    }

    if (
      diagnostic.code === "invalid-attribute-value" &&
      target === "attributeValue"
    ) {
      if (options.classes.invalidAttributeValue) {
        classes.add(options.classes.invalidAttributeValue);
      } else if (options.classes.invalidAttribute) {
        classes.add(options.classes.invalidAttribute);
      }
    }

    if (
      diagnostic.code === "text-not-allowed" &&
      target === "text" &&
      options.classes.invalidText
    ) {
      classes.add(options.classes.invalidText);
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
