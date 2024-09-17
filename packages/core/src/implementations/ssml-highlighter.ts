// import { SSMLDAG, DAGNode } from "./ssml-dag";
// import { parseSSML } from "./ssml-parser";
// import {
//   SSMLHighlighter,
//   HighlightOptions,
// } from "../interfaces/ssml-highlighter";

// function highlightSSML(dag: SSMLDAG, options: HighlightOptions): string {
//   function highlightNode(nodeId: string): string {
//     const node = dag.nodes.get(nodeId)!;
//     switch (node.type) {
//       case "element":
//         return `<span class="${options.classes.tag}">${escapeHtml(
//           node.value!
//         )}</span>`;
//       case "text":
//         return `<span class="${options.classes.text}">${escapeHtml(
//           node.value!
//         )}</span>`;
//       case "attribute":
//         return `<span class="${options.classes.attribute}">${escapeHtml(
//           node.name!
//         )}</span>=<span class="${options.classes.attributeValue}">${escapeHtml(
//           node.value!
//         )}</span>`;
//       default:
//         return "";
//     }
//   }

//   return Array.from(dag.root.children)
//     .map((childId) => highlightNode(childId))
//     .join("");
// }

// function escapeHtml(text: string): string {
//   return text
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;")
//     .replace(/'/g, "&#039;");
// }

// export const ssmlHighlighter: SSMLHighlighter = {
//   highlight: (ssml: string, options: HighlightOptions) => {
//     const dag = parseSSML(ssml);
//     console.log(highlightSSML(dag, options));
//     return highlightSSML(dag, options);
//   },
// };
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
        if (node.value === "/>") {
          return `<span class="${options.classes.tag}">${escapeHtml(
            node.value
          )}</span>`;
        }
        const attributes = Array.from(node.children)
          .map((childId) => dag.nodes.get(childId)!)
          .filter((child) => child.type === "attribute")
          .map((attr) => highlightNode(attr.id))
          .join(" ");
        const content = Array.from(node.children)
          .map((childId) => dag.nodes.get(childId)!)
          .filter((child) => child.type !== "attribute")
          .map((child) => highlightNode(child.id))
          .join("");
        return `<span class="${options.classes.tag}">${escapeHtml(
          node.value ?? ""
        )}${attributes}${
          node.value?.startsWith("</") ? "" : ">"
        }</span>${content}`;
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
