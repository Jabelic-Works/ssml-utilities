import {
  HighlightOptions,
  HighlightedSSML,
  SSMLHighlighter,
} from "../interfaces";
import {
  failure,
  parseSSML,
  Result,
  SSMLDAG,
  SSMLDiagnostic,
  success,
  validateSSML,
} from "@ssml-utilities/core";
import { highlightChildren } from "./children";

export const ssmlHighlighter: SSMLHighlighter = {
  highlight: (
    ssmlOrDag: string | Result<SSMLDAG, string>,
    options: HighlightOptions
  ): Result<string, string> => {
    const detailedResult = highlightDetailed(ssmlOrDag, options);
    if (!detailedResult.ok) {
      return failure(detailedResult.error);
    }

    return success(detailedResult.value.html);
  },
  highlightDetailed,
};

function highlightDetailed(
  ssmlOrDag: string | Result<SSMLDAG, string>,
  options: HighlightOptions
): Result<HighlightedSSML, string> {
  const dagResult =
    typeof ssmlOrDag === "string" ? parseSSML(ssmlOrDag) : ssmlOrDag;
  if (!dagResult.ok) {
    return failure(`Failed to parse SSML: ${dagResult.error}`);
  }

  const diagnostics = resolveDiagnostics(ssmlOrDag, options);
  const htmlResult = highlightSSML(dagResult.value, {
    ...options,
    diagnostics,
  });
  if (!htmlResult.ok) {
    return failure(htmlResult.error);
  }

  return success({
    html: htmlResult.value,
    diagnostics,
  });
}

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

function resolveDiagnostics(
  ssmlOrDag: string | Result<SSMLDAG, string>,
  options: HighlightOptions
): SSMLDiagnostic[] {
  if (options.diagnostics) {
    return options.diagnostics;
  }

  if (typeof ssmlOrDag !== "string") {
    return [];
  }

  return validateSSML(ssmlOrDag, {
    profile: options.profile,
  });
}
