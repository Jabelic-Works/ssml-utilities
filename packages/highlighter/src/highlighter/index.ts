import { SSMLHighlighter, HighlightOptions } from "../interfaces";
import { SSMLDAG } from "@ssml-utilities/core";
import { Result, success, failure } from "@ssml-utilities/core";
import { parseSSML } from "@ssml-utilities/core";
import { highlightChildren } from "./children";

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

export function highlightSSML(
  dag: SSMLDAG,
  options: HighlightOptions
): Result<string, string> {
  const rootNode = Array.from(dag.nodes.values()).find(
    (node) => node.type === "root"
  );
  if (!rootNode) {
    return failure("Root node not found");
  }

  const result = highlightChildren(rootNode, dag, options);
  if (!result.ok) {
    return failure(`Failed to highlight SSML: ${result.error}`);
  }

  return success(result.value);
}
