import {
  DAGNode,
  failure,
  Result,
  SSMLDAG,
  success,
} from "@ssml-utilities/core";
import { HighlightOptions } from "../interfaces";
import { highlightNode } from "./node";

export function highlightChildren(
  rootNode: DAGNode,
  dag: SSMLDAG,
  options: HighlightOptions
): Result<string, string> {
  const results = Array.from(rootNode.children)
    .map((childId) => dag.nodes.get(childId))
    .filter(
      (child): child is DAGNode =>
        child !== undefined && child.type !== "attribute"
    )
    .map((child) => highlightNode(child.id, dag, options));

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
