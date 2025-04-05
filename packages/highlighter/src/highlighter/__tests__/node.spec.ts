import { describe, it, expect, vi } from "vitest";
import { highlightNode } from "../node";
import {
  DAGNode,
  SSMLDAG,
  Result,
  success,
  failure,
} from "@ssml-utilities/core";
import { HighlightOptions } from "../../interfaces";
import * as attributesModule from "../attributes";
import * as childrenModule from "../children";

// NodeTypeの定義
type NodeType = "root" | "element" | "attribute" | "text";

describe("highlightNode", () => {
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
  function createTestDAG(nodes: DAGNode[] = []): SSMLDAG {
    const dag = new SSMLDAG();
    for (const node of nodes) {
      // 既存のノードIDを使用
      dag.nodes.set(node.id, node);
    }
    return dag;
  }

  // ヘルパー関数：Node オブジェクトを作成
  function createTestNode(
    id: string,
    type: NodeType,
    value?: string,
    name?: string
  ): DAGNode {
    return {
      id,
      type,
      name,
      value,
      children: new Set(),
      parents: new Set(),
    };
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

  it("should return error when node is not found", () => {
    const dag = createTestDAG();
    const result = highlightNode("non_existent_node", dag, defaultOptions);
    const error = expectFailure(result);
    expect(error).toBe("Node with id non_existent_node not found");
  });

  describe("element nodes", () => {
    it("should highlight opening tag", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ""
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success("")
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success("")
      );

      const elementNode = createTestNode("node1", "element", "<p>");
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toContain('<span class="tag">&lt;p&gt;</span>');
      expect(attributesModule.extractAttributesFromNode).toHaveBeenCalledWith(
        elementNode
      );
      expect(childrenModule.highlightChildren).toHaveBeenCalledWith(
        elementNode,
        dag,
        defaultOptions
      );

      vi.restoreAllMocks();
    });

    it("should highlight closing tag", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ""
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success("")
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success("")
      );

      const elementNode = createTestNode("node1", "element", "</p>");
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toContain('<span class="tag">&lt;/p&gt;</span>');

      vi.restoreAllMocks();
    });

    it("should highlight self-closing tag", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ' time="2s"'
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success(
          ' <span class="attr">time</span>="<span class="attr-value">2s</span>"'
        )
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success("")
      );

      const elementNode = createTestNode(
        "node1",
        "element",
        '<break time="2s"/>'
      );
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toContain(
        '<span class="tag">&lt;break <span class="attr">time</span>="<span class="attr-value">2s</span>"/&gt;</span>'
      );

      vi.restoreAllMocks();
    });

    it("should handle tag with attributes", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ' class="main"'
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success(
          ' <span class="attr">class</span>="<span class="attr-value">main</span>"'
        )
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success("")
      );

      const elementNode = createTestNode(
        "node1",
        "element",
        '<div class="main">'
      );
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toContain(
        '<span class="tag">&lt;div <span class="attr">class</span>="<span class="attr-value">main</span>"&gt;</span>'
      );

      vi.restoreAllMocks();
    });

    it("should handle tag with children", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ""
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success("")
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success('<span class="text">Hello</span>')
      );

      const elementNode = createTestNode("node1", "element", "<p>");
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toBe(
        '<span class="tag">&lt;p&gt;</span><span class="text">Hello</span>'
      );

      vi.restoreAllMocks();
    });

    it("should handle invalid element tag format", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ""
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success("")
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success("")
      );

      const elementNode = createTestNode("node1", "element", "invalid-element");
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toBe('<span class="tag">invalid-element</span>');

      vi.restoreAllMocks();
    });

    it("should handle error from highlightAttributes", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ' class="main"'
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        failure("Attribute error")
      );

      const elementNode = createTestNode(
        "node1",
        "element",
        '<div class="main">'
      );
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const error = expectFailure(result);

      expect(error).toBe("Attribute error");

      vi.restoreAllMocks();
    });

    it("should handle error from highlightChildren", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ""
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success("")
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        failure("Children error")
      );

      const elementNode = createTestNode("node1", "element", "<p>");
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const error = expectFailure(result);

      expect(error).toBe("Children error");

      vi.restoreAllMocks();
    });

    it("should handle tags with namespace", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ' style="customerservice"'
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success(
          ' <span class="attr">style</span>="<span class="attr-value">customerservice</span>"'
        )
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success("")
      );

      const elementNode = createTestNode(
        "node1",
        "element",
        '<mstts:express-as style="customerservice">'
      );
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toContain(
        '<span class="tag">&lt;mstts:express-as <span class="attr">style</span>="<span class="attr-value">customerservice</span>"&gt;</span>'
      );

      vi.restoreAllMocks();
    });

    it("should handle self-closing tags with namespace", () => {
      // highlightAttributes と highlightChildren のモック
      vi.spyOn(attributesModule, "extractAttributesFromNode").mockReturnValue(
        ' time="500ms"'
      );
      vi.spyOn(attributesModule, "highlightAttributes").mockReturnValue(
        success(
          ' <span class="attr">time</span>="<span class="attr-value">500ms</span>"'
        )
      );
      vi.spyOn(childrenModule, "highlightChildren").mockReturnValue(
        success("")
      );

      const elementNode = createTestNode(
        "node1",
        "element",
        '<mstts:break time="500ms"/>'
      );
      const dag = createTestDAG([elementNode]);

      const result = highlightNode("node1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toContain(
        '<span class="tag">&lt;mstts:break <span class="attr">time</span>="<span class="attr-value">500ms</span>"/&gt;</span>'
      );

      vi.restoreAllMocks();
    });
  });

  describe("attribute nodes", () => {
    it("should highlight attribute with value", () => {
      const attrNode = createTestNode("attr1", "attribute", "main", "class");
      const dag = createTestDAG([attrNode]);

      const result = highlightNode("attr1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toBe(
        ' <span class="attr">class</span>=<span class="attr-value">"main"</span>'
      );
    });

    it("should highlight attribute without value", () => {
      const attrNode = createTestNode(
        "attr1",
        "attribute",
        undefined,
        "disabled"
      );
      const dag = createTestDAG([attrNode]);

      const result = highlightNode("attr1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toBe(' <span class="attr">disabled</span>');
    });

    it("should escape HTML in attribute name and value", () => {
      const attrNode = createTestNode(
        "attr1",
        "attribute",
        "<value>",
        "<name>"
      );
      const dag = createTestDAG([attrNode]);

      const result = highlightNode("attr1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toContain("&lt;name&gt;");
      expect(html).toContain("&lt;value&gt;");
    });
  });

  describe("text nodes", () => {
    it("should highlight text node", () => {
      const textNode = createTestNode("text1", "text", "Hello, world!");
      const dag = createTestDAG([textNode]);

      const result = highlightNode("text1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toBe('<span class="text">Hello, world!</span>');
    });

    it("should escape HTML in text content", () => {
      const textNode = createTestNode(
        "text1",
        "text",
        "<script>alert('XSS')</script>"
      );
      const dag = createTestDAG([textNode]);

      const result = highlightNode("text1", dag, defaultOptions);
      const html = expectSuccess(result);

      expect(html).toBe(
        '<span class="text">&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;</span>'
      );
    });
  });

  describe("invalid node types", () => {
    it("should return error for unknown node type", () => {
      const invalidNode = createTestNode(
        "invalid1",
        "unknown_type" as unknown as NodeType,
        "value"
      );
      const dag = createTestDAG([invalidNode]);

      const result = highlightNode("invalid1", dag, defaultOptions);
      const error = expectFailure(result);

      expect(error).toBe("Unknown node type: unknown_type");
    });
  });
});
