import { Result, success, failure } from "../result";

export const NodeType = {
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

    // detect cycle
    if (this.isReachable(childId, parentId)) {
      return failure(`Adding this edge would create a cycle`);
    }

    parent.children.add(childId);
    child.parents.add(parentId);
    return success(undefined);
  }

  // helper method： childId から targetId に到達可能かを確認
  isReachable(
    fromId: string,
    toId: string,
    visited = new Set<string>()
  ): boolean {
    if (fromId === toId) return true;
    visited.add(fromId);
    const node = this.nodes.get(fromId);
    if (!node) return false;
    for (const childId of node.children) {
      if (!visited.has(childId)) {
        if (this.isReachable(childId, toId, visited)) {
          return true;
        }
      }
    }
    return false;
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
