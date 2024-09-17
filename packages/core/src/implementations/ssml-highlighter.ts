import { SSMLDAG, DAGNode } from "./ssml-dag";
import { parseSSML, debugParseSSML } from "./ssml-parser";
import {
  SSMLHighlighter,
  HighlightOptions,
} from "../interfaces/ssml-highlighter";

function highlightSSML(dag: SSMLDAG, options: HighlightOptions): string {
  console.log("Highlighting DAG:", dag.debugPrint()); // ハイライト処理前のDAG構造をログ出力s
  function highlightNode(nodeId: string): string {
    const node = dag.nodes.get(nodeId)!;
    console.log("Highlighting node:", node); // 各ノードの処理をログ出力
    switch (node.type) {
      case "element":
        const tagMatch = node.value!.match(/^<(\/?[^\s>]+)(.*)>?$/);
        if (tagMatch) {
          const [, tagName, rest] = tagMatch;
          const attributes = Array.from(node.children)
            .map((childId) => dag.nodes.get(childId)!)
            .filter((child) => child.type === "attribute")
            .map((attr) => highlightNode(attr.id))
            .join("");
          const content = Array.from(node.children)
            .map((childId) => dag.nodes.get(childId)!)
            .filter((child) => child.type !== "attribute")
            .map((child) => highlightNode(child.id))
            .join("");

          let tagContent = `&lt;${escapeHtml(tagName)}${attributes}`;
          if (node.value!.trim().endsWith("/>") || rest.trim().endsWith("/")) {
            tagContent += " /";
          }
          tagContent += "&gt;";

          return `<span class="${options.classes.tag}">${tagContent}</span>${content}`;
        }
        return `<span class="${options.classes.tag}">${escapeHtml(
          node.value!
        )}</span>`;
      case "attribute":
        return ` <span class="${options.classes.attribute}">${escapeHtml(
          node.name!
        )}</span>=<span class="${options.classes.attributeValue}">"${escapeHtml(
          node.value!
        )}"</span>`;
      case "text":
        return `<span class="${options.classes.text}">${escapeHtml(
          node.value!
        )}</span>`;
      default:
        return "";
    }
  }

  const result = Array.from(dag.root.children)
    .map((childId) => highlightNode(childId))
    .join("");
  console.log("Highlighted result:", result); // ハイライト処理後の結果をログ出力
  return result;
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
