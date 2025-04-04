import { SSMLDAG, DAGNode } from ".";
import { Token, ParsedAttribute } from "../parser/types";
import { failure, Result, success } from "../result"; // Result型の定義をimport

export function buildDAGFromTokens(tokens: Token[]): Result<SSMLDAG, string> {
  const dag = new SSMLDAG();
  const rootResult = dag.createNode("root");
  if (!rootResult.ok) {
    return failure(`Failed to create root node: ${rootResult.error}`);
  }
  const root = rootResult.value;
  const stack: DAGNode[] = [root];
  let currentElement = root;
  for (const token of tokens) {
    switch (token.type) {
      case "openTag":
        const [tagNodeResult, attributes] = createElementNode(dag, token.value);
        if (!tagNodeResult.ok) {
          return failure(
            `Failed to create element node: ${tagNodeResult.error}`
          );
        }
        const tagNode = tagNodeResult.value;
        const addEdgeResult = dag.addEdge(currentElement.id, tagNode.id);
        if (!addEdgeResult.ok) {
          return failure(`Failed to add edge: ${addEdgeResult.error}`);
        }
        for (const attr of attributes) {
          const attrNodeResult = createAttributeNode(dag, attr);
          if (!attrNodeResult.ok) {
            return failure(
              `Failed to create attribute node: ${attrNodeResult.error}`
            );
          }
          const addAttrEdgeResult = dag.addEdge(
            tagNode.id,
            attrNodeResult.value.id
          );
          if (!addAttrEdgeResult.ok) {
            return failure(
              `Failed to add attribute edge: ${addAttrEdgeResult.error}`
            );
          }
        }
        currentElement = tagNode;
        stack.push(currentElement);
        break;
      case "closeTag":
        // 対応するopenTagがなければfailture. stackから探す
        const openTagNode = stack.find((node) => {
          if (!node.value || !token.value) return false;

          // タグ名を抽出
          const openTagMatch = node.value.match(/^<([\w-:]+)[\s>]/);
          const closeTagMatch = token.value.match(/^<\/([\w-:]+)>/);

          if (!openTagMatch || !closeTagMatch) return false;

          // タグ名だけを比較
          return openTagMatch[1] === closeTagMatch[1];
        });
        if (!openTagNode) {
          // 対応するopenTagが見つからない場合は、テキストとして扱う
          const textNodeResult = dag.createNode("text", undefined, token.value);
          if (!textNodeResult.ok) {
            return failure(
              `Failed to create text node: ${textNodeResult.error}`
            );
          }
          const addTextEdgeResult = dag.addEdge(
            currentElement.id,
            textNodeResult.value.id
          );
          if (!addTextEdgeResult.ok) {
            return failure(
              `Failed to add text edge: ${addTextEdgeResult.error}`
            );
          }
          break;
        }
        const closeTagNodeResult = dag.createNode(
          "element",
          undefined,
          token.value
        );
        if (!closeTagNodeResult.ok) {
          return failure(
            `Failed to create close tag node: ${closeTagNodeResult.error}`
          );
        }
        const addCloseEdgeResult = dag.addEdge(
          currentElement.id,
          closeTagNodeResult.value.id
        );
        if (!addCloseEdgeResult.ok) {
          return failure(
            `Failed to add close tag edge: ${addCloseEdgeResult.error}`
          );
        }
        if (stack.length > 1) {
          stack.pop();
          currentElement = stack[stack.length - 1];
        }
        break;
      case "text":
        const textNodeResult = dag.createNode("text", undefined, token.value);
        if (!textNodeResult.ok) {
          return failure(`Failed to create text node: ${textNodeResult.error}`);
        }
        const addTextEdgeResult = dag.addEdge(
          currentElement.id,
          textNodeResult.value.id
        );
        if (!addTextEdgeResult.ok) {
          return failure(`Failed to add text edge: ${addTextEdgeResult.error}`);
        }
        break;
      case "selfClosingTag":
        const [selfClosingNodeResult, selfClosingAttributes] =
          createElementNode(dag, token.value);
        if (!selfClosingNodeResult.ok) {
          return failure(
            `Failed to create self-closing node: ${selfClosingNodeResult.error}`
          );
        }
        const selfClosingNode = selfClosingNodeResult.value;
        const addSelfClosingEdgeResult = dag.addEdge(
          currentElement.id,
          selfClosingNode.id
        );
        if (!addSelfClosingEdgeResult.ok) {
          return failure(
            `Failed to add self-closing edge: ${addSelfClosingEdgeResult.error}`
          );
        }
        for (const attr of selfClosingAttributes) {
          const attrNodeResult = createAttributeNode(dag, attr);
          if (!attrNodeResult.ok) {
            return failure(
              `Failed to create attribute node for self-closing tag: ${attrNodeResult.error}`
            );
          }
          const addSelfClosingAttrEdgeResult = dag.addEdge(
            selfClosingNode.id,
            attrNodeResult.value.id
          );
          if (!addSelfClosingAttrEdgeResult.ok) {
            return failure(
              `Failed to add attribute edge for self-closing tag: ${addSelfClosingAttrEdgeResult.error}`
            );
          }
        }
        break;

      default:
        return failure(`無効なトークンタイプです: ${token.type}`);
    }
  }

  return success(dag);
}

function createElementNode(
  dag: SSMLDAG,
  tagContent: string
): [Result<DAGNode, string>, ParsedAttribute[]] {
  const tagNodeResult = dag.createNode("element", undefined, tagContent);
  const attributes = parseAttributes(tagContent);
  return [tagNodeResult, attributes];
}

function createAttributeNode(
  dag: SSMLDAG,
  attr: ParsedAttribute
): Result<DAGNode, string> {
  return dag.createNode("attribute", attr.name, attr.value);
}

export function parseAttributes(tagContent: string): ParsedAttribute[] {
  const attrRegex = /([\w-:]+)=["']([^"']*)["']/g;
  const attributes: ParsedAttribute[] = [];
  let match;
  while ((match = attrRegex.exec(tagContent)) !== null) {
    const [, name, value] = match;
    attributes.push({ name, value });
  }
  return attributes;
}
