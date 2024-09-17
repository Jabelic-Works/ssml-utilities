import { SSMLDAG, DAGNode } from "./ssml-dag";

interface Token {
  type: "openTag" | "closeTag" | "selfClosingTag" | "attribute" | "text";
  value: string;
}

const tokenPatterns: [RegExp, Token["type"]][] = [
  [/^<[a-zA-Z][a-zA-Z0-9]*(?=[\s>])/, "openTag"],
  [/^<\/[a-zA-Z][a-zA-Z0-9]*>/, "closeTag"],
  [/^<[a-zA-Z][a-zA-Z0-9]*[^>]*\/>/, "selfClosingTag"],
  [/^[a-zA-Z][a-zA-Z0-9]*=(?:"[^"]*"|'[^']*'|[^\s>"']+)/, "attribute"],
  [/^[^<>]+/, "text"],
  [/^>/, "text"],
];
function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let remainingInput = input;

  while (remainingInput.length > 0) {
    let matched = false;
    for (const [pattern, type] of tokenPatterns) {
      const match = remainingInput.match(pattern);
      if (match) {
        tokens.push({ type, value: match[0] });
        remainingInput = remainingInput.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: "text", value: remainingInput[0] });
      remainingInput = remainingInput.slice(1);
    }
  }

  return tokens;
}
export function parseSSML(ssml: string, existingDag?: SSMLDAG): SSMLDAG {
  const dag = existingDag || new SSMLDAG();
  let root: DAGNode;

  if (dag.nodes.size === 0) {
    root = dag.createNode("root");
  } else {
    root = Array.from(dag.nodes.values()).find((node) => node.type === "root")!;
    root.children.clear();
    for (const nodeId of dag.nodes.keys()) {
      if (nodeId !== root.id) {
        dag.nodes.delete(nodeId);
      }
    }
  }

  let currentElement = root;
  let buffer = "";
  let inTag = false;

  for (let i = 0; i < ssml.length; i++) {
    const char = ssml[i];

    if (char === "<") {
      if (buffer) {
        const textNode = dag.createNode("text", undefined, buffer);
        dag.addEdge(currentElement.id, textNode.id);
        buffer = "";
      }
      buffer += char;
      inTag = true;
    } else if (char === ">" && inTag) {
      buffer += char;
      const tagNode = dag.createNode("element", undefined, buffer);
      dag.addEdge(currentElement.id, tagNode.id);

      if (!buffer.startsWith("</") && !buffer.endsWith("/>")) {
        currentElement = tagNode;
      } else if (buffer.startsWith("</")) {
        // Close tag found, move back to parent
        const parentId = Array.from(currentElement.parents)[0];
        if (parentId) {
          currentElement = dag.nodes.get(parentId)!;
        }
      }

      buffer = "";
      inTag = false;
    } else {
      buffer += char;
    }
  }

  if (buffer) {
    const textNode = dag.createNode("text", undefined, buffer);
    dag.addEdge(currentElement.id, textNode.id);
  }

  return dag;
}
// デバッグ用の関数
export function debugParseSSML(ssml: string): string {
  const dag = parseSSML(ssml);
  return dag.debugPrint();
}
