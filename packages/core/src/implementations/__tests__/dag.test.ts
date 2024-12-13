import { SSMLDAG, NodeType } from "../dag";

describe("SSMLDAG Tests", () => {
  test("Node creation", () => {
    const dag = new SSMLDAG();
    const result = dag.createNode(NodeType.element, "div");
    expect(result.ok).toBe(true);
    if (result.ok) {
      const node = result.value;
      expect(node.type).toBe("element");
      expect(node.name).toBe("div");
    }
  });

  test("Add edge successfully", () => {
    const dag = new SSMLDAG();
    const parentResult = dag.createNode(NodeType.element, "parent");
    const childResult = dag.createNode(NodeType.element, "child");
    expect(parentResult.ok).toBe(true);
    expect(childResult.ok).toBe(true);
    if (parentResult.ok && childResult.ok) {
      const parent = parentResult.value;
      const child = childResult.value;
      const edgeResult = dag.addEdge(parent.id, child.id);
      expect(edgeResult.ok).toBe(true);
      // 親と子の関係が正しく設定されていることを確認
      expect(parent.children.has(child.id)).toBe(true);
      expect(child.parents.has(parent.id)).toBe(true);
    }
  });

  test("Detect cycle and prevent edge addition", () => {
    const dag = new SSMLDAG();
    const nodeAResult = dag.createNode(NodeType.element, "A");
    const nodeBResult = dag.createNode(NodeType.element, "B");
    expect(nodeAResult.ok).toBe(true);
    expect(nodeBResult.ok).toBe(true);
    if (nodeAResult.ok && nodeBResult.ok) {
      const nodeA = nodeAResult.value;
      const nodeB = nodeBResult.value;
      // エッジ A -> B を追加
      let edgeResult = dag.addEdge(nodeA.id, nodeB.id);
      expect(edgeResult.ok).toBe(true);
      // サイクルを作るエッジ B -> A の追加を試みる
      edgeResult = dag.addEdge(nodeB.id, nodeA.id);
      expect(edgeResult.ok).toBe(false);
      if (!edgeResult.ok) {
        expect(edgeResult.error).toBe("Adding this edge would create a cycle");
      }
      // エッジが追加されていないことを確認
      expect(nodeB.children.has(nodeA.id)).toBe(false);
      expect(nodeA.parents.has(nodeB.id)).toBe(false);
    }
  });

  test("Complex DAG creation and cycle detection", () => {
    const dag = new SSMLDAG();
    const node1Result = dag.createNode(NodeType.element, "1");
    const node2Result = dag.createNode(NodeType.element, "2");
    const node3Result = dag.createNode(NodeType.element, "3");
    const node4Result = dag.createNode(NodeType.element, "4");
    expect(node1Result.ok).toBe(true);
    expect(node2Result.ok).toBe(true);
    expect(node3Result.ok).toBe(true);
    expect(node4Result.ok).toBe(true);
    if (node1Result.ok && node2Result.ok && node3Result.ok && node4Result.ok) {
      const node1 = node1Result.value;
      const node2 = node2Result.value;
      const node3 = node3Result.value;
      const node4 = node4Result.value;
      // DAG 構造を構築
      // ノード 1 -> ノード 2 -> ノード 3
      //       \-> ノード 4 ->/
      dag.addEdge(node1.id, node2.id);
      dag.addEdge(node2.id, node3.id);
      dag.addEdge(node1.id, node4.id);
      dag.addEdge(node4.id, node3.id);
      // サイクルを作るエッジ 3 -> 1 の追加を試みる
      const edgeResult = dag.addEdge(node3.id, node1.id);
      expect(edgeResult.ok).toBe(false);
      if (!edgeResult.ok) {
        expect(edgeResult.error).toBe("Adding this edge would create a cycle");
      }
      // エッジが追加されていないことを確認
      expect(node3.children.has(node1.id)).toBe(false);
      expect(node1.parents.has(node3.id)).toBe(false);
    }
  });

  test("Invalid node types", () => {
    const dag = new SSMLDAG();
    const result = dag.createNode("invalidType" as NodeType, "name");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid node type: invalidType");
    }
  });

  test("Adding edge with non-existent nodes", () => {
    const dag = new SSMLDAG();
    const nodeResult = dag.createNode(NodeType.element, "node");
    expect(nodeResult.ok).toBe(true);
    if (nodeResult.ok) {
      const node = nodeResult.value;
      // 存在しないノードへのエッジ追加を試みる
      let edgeResult = dag.addEdge(node.id, "nonexistent");
      expect(edgeResult.ok).toBe(false);
      if (!edgeResult.ok) {
        expect(edgeResult.error).toBe(
          "Child node with id nonexistent not found"
        );
      }
      // 存在しないノードからのエッジ追加を試みる
      edgeResult = dag.addEdge("nonexistent", node.id);
      expect(edgeResult.ok).toBe(false);
      if (!edgeResult.ok) {
        expect(edgeResult.error).toBe(
          "Parent node with id nonexistent not found"
        );
      }
    }
  });

  test("Debug print output", () => {
    const dag = new SSMLDAG();
    const nodeResult = dag.createNode(NodeType.element, "testNode");
    expect(nodeResult.ok).toBe(true);
    if (nodeResult.ok) {
      const output = dag.debugPrint();
      expect(output).toContain(`Node ${nodeResult.value.id}:`);
      expect(output).toContain("Type: element");
      expect(output).toContain("Name: testNode");
    }
  });
});
