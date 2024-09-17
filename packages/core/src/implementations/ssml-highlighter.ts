import { SSMLDAG, DAGNode } from "./ssml-dag";
import { parseSSML, debugParseSSML } from "./ssml-parser";
import {
  SSMLHighlighter,
  HighlightOptions,
} from "../interfaces/ssml-highlighter";
function highlightSSML(dag: SSMLDAG, options: HighlightOptions): string {
  function highlightNode(nodeId: string): string {
    const node = dag.nodes.get(nodeId)!;
    switch (node.type) {
      case "element":
        const content = Array.from(node.children)
          .map((childId) => highlightNode(childId))
          .join("");
        return `<span class="${options.classes.tag}">${escapeHtml(
          node.value!
        )}</span>${content}`;
      case "text":
        return `<span class="${options.classes.text}">${escapeHtml(
          node.value!
        )}</span>`;
      default:
        return "";
    }
  }

  return Array.from(dag.root.children)
    .map((childId) => highlightNode(childId))
    .join("");
}
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const ssmlHighlighter: SSMLHighlighter = {
  highlight: (ssml: string, options: HighlightOptions) => {
    const dag = parseSSML(ssml);
    console.log("DAG structure:");
    console.log(debugParseSSML(ssml));
    return highlightSSML(dag, options);
  },
};
