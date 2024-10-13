import { Result, success, failure } from "./parser/result";

const NodeType = {
  root: "root",
  element: "element",
  attribute: "attribute",
  text: "text",
} as const;
export type NodeType = (typeof NodeType)[keyof typeof NodeType];

export class SSMLDAG {
  nodes: Map<string, DAGNode>;
  private idCounter: number;

  constructor() {
    this.nodes = new Map();
    this.idCounter = 0;
  }

  generateId(): string {
    return `node_${this.idCounter++}`;
  }

  createNode(
    type: NodeType,
    name?: string,
    value?: string
  ): Result<DAGNode, string> {
    if (!["root", "element", "attribute", "text"].includes(type)) {
      return failure(`Invalid node type: ${type}`);
    }
    const id = this.generateId();
    const node: DAGNode = {
      id,
      type,
      name,
      value,
      children: new Set(),
      parents: new Set(),
    };
    this.nodes.set(id, node);
    return success(node);
  }

  addEdge(parentId: string, childId: string): Result<void, string> {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);

    if (!parent) {
      return failure(`Parent node with id ${parentId} not found`);
    }
    if (!child) {
      return failure(`Child node with id ${childId} not found`);
    }

    parent.children.add(childId);
    child.parents.add(parentId);
    return success(undefined);
  }

  debugPrint(): string {
    let output = "";
    for (const [id, node] of this.nodes) {
      output += `Node ${id}:\n`;
      output += `  Type: ${node.type}\n`;
      if (node.name) output += `  Name: ${node.name}\n`;
      if (node.value) output += `  Value: ${node.value}\n`;
      output += `  Parents: ${Array.from(node.parents).join(", ")}\n`;
      output += `  Children: ${Array.from(node.children).join(", ")}\n\n`;
    }
    return output;
  }
}

export interface DAGNode {
  id: string;
  type: NodeType;
  name?: string;
  value?: string;
  children: Set<string>;
  parents: Set<string>;
}
