import {
  DAGNode,
  failure,
  Result,
  SSMLDAG,
  success,
} from "@ssml-utilities/core";
import { HighlightOptions } from "../interfaces";
import { extractAttributesFromNode, highlightAttributes } from "./attributes";
import { highlightChildren } from "./children";
import { escapeHtml } from "../utils";

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
    case "element":
      const tagMatch = node.value!.match(/^<(\/?[^\s>]+)(.*)>?$/);
      if (tagMatch) {
        const [nodeValue, tagName, rest] = tagMatch;
        const attributesResult = highlightAttributes(
          extractAttributesFromNode(node),
          options
        );
        if (!attributesResult.ok) {
          return failure(attributesResult.error);
        }
        const contentResult = highlightChildren(node, dag, options);
        if (!contentResult.ok) {
          return failure(contentResult.error);
        }
        let tagContent: string;
        if (attributesResult.value) {
          tagContent = `&lt;${escapeHtml(tagName)}${attributesResult.value}`;
          if (node.value!.trim().endsWith("/>") || rest.trim().endsWith("/")) {
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
        `<span class="${options.classes.tag}">${escapeHtml(node.value!)}</span>`
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
