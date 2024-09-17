// import { SSMLDAG, DAGNode } from "./ssml-dag";

// export function parseSSML(ssml: string): SSMLDAG {
//   const dag = new SSMLDAG();
//   const stack: DAGNode[] = [dag.root];
//   let currentNode = dag.root;

//   const tokenizer = /(<[^>]*>?)|([^<]+)/g;
//   let match;

//   while ((match = tokenizer.exec(ssml)) !== null) {
//     const [fullMatch, tag, text] = match;

//     if (tag) {
//       const tagNode = dag.createNode("element", undefined, tag);
//       dag.addEdge(currentNode.id, tagNode.id);
//     } else if (text) {
//       const textNode = dag.createNode("text", undefined, text);
//       dag.addEdge(currentNode.id, textNode.id);
//     }
//   }

//   return dag;
// }
import { SSMLDAG, DAGNode } from "./ssml-dag";

interface Token {
  type: "openTag" | "closeTag" | "selfClosingTag" | "attribute" | "text";
  value: string;
}

// const tokenPatterns: [RegExp, Token["type"]][] = [
//   [/^<[a-zA-Z][a-zA-Z0-9]*(?=[\s>])/, "openTag"],
//   [/^<\/[a-zA-Z][a-zA-Z0-9]*>/, "closeTag"],
//   [/^<[a-zA-Z][a-zA-Z0-9]*\s*\/>/, "selfClosingTag"],
//   [/^[a-zA-Z][a-zA-Z0-9]*=(?:"[^"]*"|'[^']*'|[^\s>"']+)/, "attribute"],
//   [/^[^<>\s]+/, "text"],
//   [/^\s+/, "text"],
// ];
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

// export function parseSSML(ssml: string): SSMLDAG {
//   const dag = new SSMLDAG();
//   const root = dag.createNode("root");
//   const tokens = tokenize(ssml);

//   for (const token of tokens) {
//     switch (token.type) {
//       case "openTag":
//       case "closeTag":
//       case "selfClosingTag":
//         dag.addEdge(
//           root.id,
//           dag.createNode("element", undefined, token.value).id
//         );
//         break;
//       case "attribute":
//         const [name, value] = token.value.split("=");
//         dag.addEdge(
//           root.id,
//           dag.createNode(
//             "attribute",
//             name.trim(),
//             value.trim().replace(/^["']|["']$/g, "")
//           ).id
//         );
//         break;
//       case "text":
//         dag.addEdge(root.id, dag.createNode("text", undefined, token.value).id);
//         break;
//     }
//   }

//   return dag;
// }

// // デバッグ用の関数
// export function debugParseSSML(ssml: string): string {
//   const dag = parseSSML(ssml);
//   return Array.from(dag.root.children)
//     .map((childId) => {
//       const node = dag.nodes.get(childId)!;
//       return `${node.type}: ${node.value || node.name}`;
//     })
//     .join("\n");
// }

export function parseSSML(ssml: string, existingDag?: SSMLDAG): SSMLDAG {
  const dag = existingDag || new SSMLDAG();
  let root: DAGNode;

  if (dag.nodes.size === 0) {
    root = dag.createNode("root");
  } else {
    root = Array.from(dag.nodes.values()).find((node) => node.type === "root")!;
    // Clear existing children
    root.children.clear();
    for (const nodeId of dag.nodes.keys()) {
      if (nodeId !== root.id) {
        dag.nodes.delete(nodeId);
      }
    }
  }

  const stack: DAGNode[] = [root];
  let currentElement = root;

  const tokenizer = /<[^>]+>|[^<]+/g;
  let match;

  while ((match = tokenizer.exec(ssml)) !== null) {
    const token = match[0];

    if (token.startsWith("</")) {
      // Closing tag
      const closeTagNode = dag.createNode("element", undefined, token);
      dag.addEdge(currentElement.id, closeTagNode.id);
      if (stack.length > 1) {
        stack.pop();
        currentElement = stack[stack.length - 1];
      }
    } else if (token.startsWith("<")) {
      // Opening tag or self-closing tag
      const isOpenTag = !token.endsWith("/>");
      const tagParts = token.slice(1, isOpenTag ? -1 : -2).split(/\s+/);
      const tagName = tagParts[0];

      const newElement = dag.createNode("element", undefined, `<${tagName}`);
      dag.addEdge(currentElement.id, newElement.id);

      // Process attributes
      for (let i = 1; i < tagParts.length; i++) {
        const attrPart = tagParts[i];
        if (attrPart.includes("=")) {
          const [name, value] = attrPart.split("=");
          const attrNode = dag.createNode(
            "attribute",
            name,
            value.replace(/^["']|["']$/g, "")
          );
          dag.addEdge(newElement.id, attrNode.id);
        }
      }

      if (isOpenTag) {
        currentElement = newElement;
        stack.push(currentElement);
      } else {
        // Self-closing tag
        const closingNode = dag.createNode("element", undefined, "/>");
        dag.addEdge(newElement.id, closingNode.id);
      }
    } else {
      // Text content
      const trimmedToken = token.trim();
      if (trimmedToken) {
        const textNode = dag.createNode("text", undefined, trimmedToken);
        dag.addEdge(currentElement.id, textNode.id);
      }
    }
  }

  return dag;
}
// デバッグ用の関数
export function debugParseSSML(ssml: string): string {
  const dag = parseSSML(ssml);
  return dag.debugPrint();
}
