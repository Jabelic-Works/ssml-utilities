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
          const [, tagName, rest] = tagMatch;
          const attributesResult = highlightAttributes(node);
          if (!attributesResult.ok) {
            return failure(attributesResult.error);
          }
          const contentResult = highlightChildren(node);
          if (!contentResult.ok) {
            return failure(contentResult.error);
          }

          let tagContent = `&lt;${escapeHtml(tagName)}${
            attributesResult.value
          }`;
          if (node.value!.trim().endsWith("/>") || rest.trim().endsWith("/")) {
            tagContent += " /";
          }
          tagContent += "&gt;";

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

  function highlightAttributes(node: DAGNode): Result<string, string> {
    console.log(
      "Highlight Attributes",
      Array.from(node.children).map((childId) => dag.nodes.get(childId))
    );
    const results = Array.from(node.children)
      .map((childId) => dag.nodes.get(childId))
      .filter(
        (child): child is DAGNode =>
          child !== undefined && child.type === "attribute"
      )
      .map((attr) => highlightNode(attr.id));

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
