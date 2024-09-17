export interface DAGNode {
  id: string;
  type: "root" | "element" | "attribute" | "text";
  name?: string;
  value?: string;
  parents: Set<string>;
  children: Set<string>;
}

export class SSMLDAG {
  nodes: Map<string, DAGNode> = new Map();
  root: DAGNode;

  constructor() {
    this.root = this.createNode("root");
  }

  // createNode(type: DAGNode["type"], name?: string, value?: string): DAGNode {
  //   const id = Math.random().toString(36).substr(2, 9);
  //   const node: DAGNode = {
  //     id,
  //     type,
  //     name,
  //     value,
  //     parents: new Set(),
  //     children: new Set(),
  //   };
  //   this.nodes.set(id, node);
  //   return node;
  // }
  createNode(type: DAGNode["type"], name?: string, value?: string): DAGNode {
    if (type === "root" && this.nodes.size > 0) {
      throw new Error("Root node already exists");
    }
    const id = Math.random().toString(36).substr(2, 9);
    const node: DAGNode = {
      id,
      type,
      name,
      value,
      parents: new Set(),
      children: new Set(),
    };
    this.nodes.set(id, node);
    return node;
  }

  addEdge(parentId: string, childId: string) {
    const parent = this.nodes.get(parentId);
    const child = this.nodes.get(childId);
    if (parent && child) {
      parent.children.add(childId);
      child.parents.add(parentId);
    }
  }

  debugPrint(): string {
    let result = "";
    for (const [id, node] of this.nodes) {
      result += `Node ${id}:\n`;
      result += `  Type: ${node.type}\n`;
      if (node.name) result += `  Name: ${node.name}\n`;
      if (node.value) result += `  Value: ${node.value}\n`;
      result += `  Parents: ${Array.from(node.parents).join(", ")}\n`;
      result += `  Children: ${Array.from(node.children).join(", ")}\n`;
      result += "\n";
    }
    return result;
  }
}
