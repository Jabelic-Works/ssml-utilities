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

  const stack: DAGNode[] = [root];
  let currentElement = root;
  let buffer = "";
  let inTag = false;

  function processAttributes(tagContent: string, parentNode: DAGNode) {
    const attrRegex = /(\w+)=["']([^"']*)["']/g;
    let match;
    while ((match = attrRegex.exec(tagContent)) !== null) {
      const [, name, value] = match;
      const attrNode = dag.createNode("attribute", name, value);
      dag.addEdge(parentNode.id, attrNode.id);
    }
  }

  for (let i = 0; i < ssml.length; i++) {
    const char = ssml[i];

    if (char === "<") {
      if (buffer) {
        const textNode = dag.createNode("text", undefined, buffer);
        dag.addEdge(currentElement.id, textNode.id);
        buffer = "";
      }
      inTag = true;
      buffer = char;
    } else if (char === ">" && inTag) {
      buffer += char;
      const fullTag = buffer;

      if (fullTag.startsWith("</")) {
        // Closing tag
        const closeTagNode = dag.createNode("element", undefined, fullTag);
        dag.addEdge(currentElement.id, closeTagNode.id);
        if (stack.length > 1) {
          stack.pop();
          currentElement = stack[stack.length - 1];
        }
      } else {
        // Opening tag or self-closing tag
        const tagNode = dag.createNode("element", undefined, fullTag);
        dag.addEdge(currentElement.id, tagNode.id);
        processAttributes(fullTag, tagNode);

        if (!fullTag.endsWith("/>")) {
          currentElement = tagNode;
          stack.push(currentElement);
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
