import { describe, it, expect, vi } from "vitest";
import { highlightChildren } from "../children";
import { SSMLDAG, Result, success, failure } from "@ssml-utilities/core";
import { HighlightOptions } from "../../interfaces";
import * as nodeModule from "../node";

describe("highlightChildren", () => {
  // テスト用のデフォルトオプション
  const defaultOptions: HighlightOptions = {
    classes: {
      tag: "tag",
      attribute: "attr",
      attributeValue: "attr-value",
      text: "text",
    },
    indentation: 2,
  };

  // テスト用のダミーDAGを作成する関数
  function createTestDAG(): SSMLDAG {
    const dag = new SSMLDAG();
    return dag;
  }

  // ヘルパー関数：Success結果を期待してアサーションする
  function expectSuccess(result: Result<string, string>): string {
    expect(result.ok).toBe(true);
    return (result as { ok: true; value: string }).value;
  }

  // ヘルパー関数：Failure結果を期待してアサーションする
  function expectFailure(result: Result<string, string>): string {
    expect(result.ok).toBe(false);
    return (result as { ok: false; error: string }).error;
  }

  it("should return empty string when the node has no children", () => {
    const dag = createTestDAG();
    const rootNodeResult = dag.createNode("root");
    if (!rootNodeResult.ok) {
      throw new Error(`Failed to create root node: ${rootNodeResult.error}`);
    }
    const rootNode = rootNodeResult.value;

    const result = highlightChildren(rootNode, dag, defaultOptions);
    expect(result.ok).toBe(true);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe("");
  });

  it("should highlight a single text child node", () => {
    const dag = createTestDAG();

    // ルートノードを作成
    const rootNodeResult = dag.createNode("root");
    if (!rootNodeResult.ok) {
      throw new Error(`Failed to create root node: ${rootNodeResult.error}`);
    }
    const rootNode = rootNodeResult.value;

    // テキストノードを作成
    const textNodeResult = dag.createNode("text", undefined, "Hello");
    if (!textNodeResult.ok) {
      throw new Error(`Failed to create text node: ${textNodeResult.error}`);
    }
    const textNode = textNodeResult.value;

    // エッジを追加
    const edgeResult = dag.addEdge(rootNode.id, textNode.id);
    if (!edgeResult.ok) {
      throw new Error(`Failed to add edge: ${edgeResult.error}`);
    }

    // highlightNodeのモック
    vi.spyOn(nodeModule, "highlightNode").mockImplementation(
      (nodeId: string, _dag: SSMLDAG, _options: HighlightOptions) => {
        expect(nodeId).toBe(textNode.id);
        return success('<span class="text">Hello</span>');
      }
    );

    const result = highlightChildren(rootNode, dag, defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe('<span class="text">Hello</span>');

    // モックのリセット
    vi.restoreAllMocks();
  });

  it("should highlight multiple child nodes", () => {
    const dag = createTestDAG();

    // ルートノードを作成
    const rootNodeResult = dag.createNode("root");
    if (!rootNodeResult.ok) {
      throw new Error(`Failed to create root node: ${rootNodeResult.error}`);
    }
    const rootNode = rootNodeResult.value;

    // 子ノードを作成
    const child1Result = dag.createNode("element", undefined, "<p>");
    const child2Result = dag.createNode("text", undefined, "Hello");
    const child3Result = dag.createNode("element", undefined, "</p>");

    if (!child1Result.ok || !child2Result.ok || !child3Result.ok) {
      throw new Error("Failed to create child nodes");
    }

    const child1 = child1Result.value;
    const child2 = child2Result.value;
    const child3 = child3Result.value;

    // エッジを追加
    dag.addEdge(rootNode.id, child1.id);
    dag.addEdge(rootNode.id, child2.id);
    dag.addEdge(rootNode.id, child3.id);

    // highlightNodeのモック
    vi.spyOn(nodeModule, "highlightNode").mockImplementation(
      (nodeId: string, _dag: SSMLDAG, _options: HighlightOptions) => {
        if (nodeId === child1.id) {
          return success('<span class="tag">&lt;p&gt;</span>');
        } else if (nodeId === child2.id) {
          return success('<span class="text">Hello</span>');
        } else if (nodeId === child3.id) {
          return success('<span class="tag">&lt;/p&gt;</span>');
        }
        return failure("Unknown node");
      }
    );

    const result = highlightChildren(rootNode, dag, defaultOptions);
    const highlighted = expectSuccess(result);

    expect(highlighted).toBe(
      '<span class="tag">&lt;p&gt;</span>' +
        '<span class="text">Hello</span>' +
        '<span class="tag">&lt;/p&gt;</span>'
    );

    // モックのリセット
    vi.restoreAllMocks();
  });

  it("should filter out attribute nodes", () => {
    const dag = createTestDAG();

    // ルートノードを作成
    const rootNodeResult = dag.createNode("root");
    if (!rootNodeResult.ok) {
      throw new Error(`Failed to create root node: ${rootNodeResult.error}`);
    }
    const rootNode = rootNodeResult.value;

    // 子ノードを作成
    const textNodeResult = dag.createNode("text", undefined, "Hello");
    const attrNodeResult = dag.createNode("attribute", "class", "main");

    if (!textNodeResult.ok || !attrNodeResult.ok) {
      throw new Error("Failed to create child nodes");
    }

    const textNode = textNodeResult.value;
    const attrNode = attrNodeResult.value;

    // エッジを追加
    dag.addEdge(rootNode.id, textNode.id);
    dag.addEdge(rootNode.id, attrNode.id);

    // highlightNodeのモック
    vi.spyOn(nodeModule, "highlightNode").mockImplementation(
      (nodeId: string, _dag: SSMLDAG, _options: HighlightOptions) => {
        if (nodeId === textNode.id) {
          return success('<span class="text">Hello</span>');
        }
        return failure("Attribute node should not be processed");
      }
    );

    const result = highlightChildren(rootNode, dag, defaultOptions);
    const highlighted = expectSuccess(result);

    // 属性ノードはフィルタリングされるため、テキストノードのみハイライトされる
    expect(highlighted).toBe('<span class="text">Hello</span>');

    // モックのリセット
    vi.restoreAllMocks();
  });

  it("should handle errors from child nodes", () => {
    const dag = createTestDAG();

    // ルートノードを作成
    const rootNodeResult = dag.createNode("root");
    if (!rootNodeResult.ok) {
      throw new Error(`Failed to create root node: ${rootNodeResult.error}`);
    }
    const rootNode = rootNodeResult.value;

    // 子ノードを作成
    const child1Result = dag.createNode("element", undefined, "<p>");
    const child2Result = dag.createNode("text", undefined, "Hello");

    if (!child1Result.ok || !child2Result.ok) {
      throw new Error("Failed to create child nodes");
    }

    const child1 = child1Result.value;
    const child2 = child2Result.value;

    // エッジを追加
    dag.addEdge(rootNode.id, child1.id);
    dag.addEdge(rootNode.id, child2.id);

    // highlightNodeのモック - 2番目の子ノードでエラーを発生させる
    vi.spyOn(nodeModule, "highlightNode").mockImplementation(
      (nodeId: string, _dag: SSMLDAG, _options: HighlightOptions) => {
        if (nodeId === child1.id) {
          return success('<span class="tag">&lt;p&gt;</span>');
        } else if (nodeId === child2.id) {
          return failure("Error highlighting text node");
        }
        return failure("Unknown node");
      }
    );

    const result = highlightChildren(rootNode, dag, defaultOptions);
    expect(result.ok).toBe(false);

    const error = expectFailure(result);
    expect(error).toBe("Error highlighting text node");

    // モックのリセット
    vi.restoreAllMocks();
  });

  it("should combine multiple errors from child nodes", () => {
    const dag = createTestDAG();

    // ルートノードを作成
    const rootNodeResult = dag.createNode("root");
    if (!rootNodeResult.ok) {
      throw new Error(`Failed to create root node: ${rootNodeResult.error}`);
    }
    const rootNode = rootNodeResult.value;

    // 子ノードを作成
    const child1Result = dag.createNode("element", undefined, "<p>");
    const child2Result = dag.createNode("text", undefined, "Hello");
    const child3Result = dag.createNode("element", undefined, "</p>");

    if (!child1Result.ok || !child2Result.ok || !child3Result.ok) {
      throw new Error("Failed to create child nodes");
    }

    const child1 = child1Result.value;
    const child2 = child2Result.value;
    const child3 = child3Result.value;

    // エッジを追加
    dag.addEdge(rootNode.id, child1.id);
    dag.addEdge(rootNode.id, child2.id);
    dag.addEdge(rootNode.id, child3.id);

    // highlightNodeのモック - 複数のノードでエラーを発生させる
    vi.spyOn(nodeModule, "highlightNode").mockImplementation(
      (nodeId: string, _dag: SSMLDAG, _options: HighlightOptions) => {
        if (nodeId === child1.id) {
          return success('<span class="tag">&lt;p&gt;</span>');
        } else if (nodeId === child2.id) {
          return failure("Error in text node");
        } else if (nodeId === child3.id) {
          return failure("Error in close tag");
        }
        return failure("Unknown node");
      }
    );

    const result = highlightChildren(rootNode, dag, defaultOptions);
    expect(result.ok).toBe(false);

    const error = expectFailure(result);
    expect(error).toBe("Error in text node, Error in close tag");

    // モックのリセット
    vi.restoreAllMocks();
  });

  it("should handle undefined child nodes", () => {
    const dag = createTestDAG();

    // ルートノードを作成し、存在しない子ノードIDを追加
    const rootNodeResult = dag.createNode("root");
    if (!rootNodeResult.ok) {
      throw new Error(`Failed to create root node: ${rootNodeResult.error}`);
    }
    const rootNode = rootNodeResult.value;

    // 存在しないIDを子として追加（通常はaddEdgeがエラーを返すが、テストのために直接追加）
    rootNode.children.add("non_existent_node");

    // ダミーのテキストノードを作成して追加（正常なノード）
    const textNodeResult = dag.createNode("text", undefined, "Hello");
    if (!textNodeResult.ok) {
      throw new Error(`Failed to create text node: ${textNodeResult.error}`);
    }
    const textNode = textNodeResult.value;
    dag.addEdge(rootNode.id, textNode.id);

    // highlightNodeのモック
    vi.spyOn(nodeModule, "highlightNode").mockImplementation(
      (nodeId: string, _dag: SSMLDAG, _options: HighlightOptions) => {
        if (nodeId === textNode.id) {
          return success('<span class="text">Hello</span>');
        }
        return failure("Unknown node");
      }
    );

    // undefined子ノードはフィルタリングされるべき
    const result = highlightChildren(rootNode, dag, defaultOptions);
    const highlighted = expectSuccess(result);

    // 存在しないノードはフィルタリングされるため、テキストノードのみハイライトされる
    expect(highlighted).toBe('<span class="text">Hello</span>');

    // モックのリセット
    vi.restoreAllMocks();
  });
});
