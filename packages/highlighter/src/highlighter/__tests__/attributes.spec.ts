// extractAttributesFromNode.test.ts
import { describe, it, expect } from "vitest";
import { extractAttributesFromNode, highlightAttributes } from "../attributes";
import { DAGNode, Result } from "@ssml-utilities/core";
import { HighlightOptions } from "../../interfaces";

describe("extractAttributesFromNode", () => {
  // ヘルパー関数を作成して、テストデータの作成を簡略化
  function createNode(
    value: string,
    type: DAGNode["type"] = "element"
  ): DAGNode {
    return {
      id: "test-id",
      type,
      value,
      children: new Set(),
      parents: new Set(),
    };
  }

  it("should return an empty string for a node without value", () => {
    const node: DAGNode = createNode("");
    expect(extractAttributesFromNode(node)).toBe("");
  });

  it("should extract attributes from a self-closing tag", () => {
    const node = createNode('<break time="2s" />');
    expect(extractAttributesFromNode(node)).toBe(' time="2s" ');
  });

  it("should extract attributes from a self-closing tag with multiple attributes", () => {
    const node = createNode('<break time="2s" strength="medium" />');
    expect(extractAttributesFromNode(node)).toBe(
      ' time="2s" strength="medium" '
    );
  });

  it("should extract attributes from an opening tag", () => {
    const node = createNode('<prosody rate="slow">');
    expect(extractAttributesFromNode(node)).toBe(' rate="slow"');
  });

  it("should extract attributes from an opening tag with multiple attributes", () => {
    const node = createNode('<prosody rate="slow" pitch="low">');
    expect(extractAttributesFromNode(node)).toBe(' rate="slow" pitch="low"');
  });

  it("should handle tags with no attributes", () => {
    const node = createNode("<speak>");
    expect(extractAttributesFromNode(node)).toBe("");
  });

  it("should handle self-closing tags with no attributes", () => {
    const node = createNode("<break/>");
    expect(extractAttributesFromNode(node)).toBe("");
  });

  it("should handle tags with spaces before attributes", () => {
    const node = createNode('<break    time="2s" />');
    expect(extractAttributesFromNode(node)).toBe('    time="2s" ');
  });

  it("should handle tags with spaces after attributes", () => {
    const node = createNode('<break time="2s"    />');
    expect(extractAttributesFromNode(node)).toBe(' time="2s"    ');
  });

  it("should return an empty string for invalid tags", () => {
    const node = createNode("not a tag");
    expect(extractAttributesFromNode(node)).toBe("");
  });

  it("should handle tags with hyphens in the name", () => {
    const node = createNode('<custom-tag attr="value">');
    expect(extractAttributesFromNode(node)).toBe(' attr="value"');
  });

  it("should handle tags with hyphens in the name", () => {
    const node = createNode('<custom-tag attr="value" attr2="value2">');
    expect(extractAttributesFromNode(node)).toBe(
      ' attr="value" attr2="value2"'
    );
  });

  it("should handle tags with underscores in the name", () => {
    const node = createNode('<custom_tag attr="value">');
    expect(extractAttributesFromNode(node)).toBe(' attr="value"');
  });

  it("should handle nodes of type other than element", () => {
    const textNode = createNode("Some text", "text");
    expect(extractAttributesFromNode(textNode)).toBe("");
  });

  it("should handle tags with namespace prefix", () => {
    const node = createNode('<mstts:express-as style="customerservice">');
    expect(extractAttributesFromNode(node)).toBe(' style="customerservice"');
  });

  it("should handle self-closing tags with namespace prefix", () => {
    const node = createNode('<mstts:break time="2s" />');
    expect(extractAttributesFromNode(node)).toBe(' time="2s" ');
  });

  it("should handle tags with namespace prefix and multiple attributes", () => {
    const node = createNode('<amazon:emotion name="excited" intensity="high">');
    expect(extractAttributesFromNode(node)).toBe(
      ' name="excited" intensity="high"'
    );
  });

  it("should handle attributes with namespace prefix", () => {
    const node = createNode(
      '<speak xmlns:mstts="http://www.w3.org/2001/mstts">'
    );
    expect(extractAttributesFromNode(node)).toBe(
      ' xmlns:mstts="http://www.w3.org/2001/mstts"'
    );
  });

  it("should handle complex namespace scenarios", () => {
    const node = createNode(
      '<mstts:express-as style="customerservice" role="Female" xmlns:mstts="http://example.com">'
    );
    expect(extractAttributesFromNode(node)).toBe(
      ' style="customerservice" role="Female" xmlns:mstts="http://example.com"'
    );
  });
});

describe("highlightAttributes", () => {
  const defaultOptions: HighlightOptions = {
    classes: {
      tag: "tag",
      attribute: "attr",
      attributeValue: "attr-value",
      text: "text",
    },
    indentation: 2,
  };

  function expectSuccess(result: Result<string, string>): string {
    expect(result.ok).toBe(true);
    return (result as { ok: true; value: string }).value;
  }

  it("should highlight a single attribute without value", () => {
    const result = highlightAttributes("disabled", defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe('<span class="attr">disabled</span>');
  });

  it("should highlight a single attribute with unquoted value", () => {
    const result = highlightAttributes("class=myClass", defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe(
      '<span class="attr">class</span>=<span class="attr-value">myClass</span>'
    );
  });

  it("should highlight a single attribute with double-quoted value", () => {
    const result = highlightAttributes('id="myId"', defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe(
      '<span class="attr">id</span>="<span class="attr-value">myId</span>"'
    );
  });

  it("should highlight a single attribute with single-quoted value", () => {
    const result = highlightAttributes("title='My Title'", defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe(
      '<span class="attr">title</span>=\'<span class="attr-value">My Title</span>\''
    );
  });

  it("should highlight multiple attributes", () => {
    const result = highlightAttributes(
      'class="main" id="content" data-value=42',
      defaultOptions
    );
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe(
      '<span class="attr">class</span>="<span class="attr-value">main</span>" ' +
        '<span class="attr">id</span>="<span class="attr-value">content</span>" ' +
        '<span class="attr">data-value</span>=<span class="attr-value">42</span>'
    );
  });

  it("should handle attributes with spaces", () => {
    const result = highlightAttributes('  class = "spaced"  ', defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe(
      '  <span class="attr">class</span> = "<span class="attr-value">spaced</span>"  '
    );
  });

  it("should handle attributes with special characters in values", () => {
    const result = highlightAttributes(
      'data-content="<p>Hello & Goodbye</p>"',
      defaultOptions
    );
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe(
      '<span class="attr">data-content</span>="<span class="attr-value">&lt;p&gt;Hello &amp; Goodbye&lt;/p&gt;</span>"'
    );
  });

  it("should handle empty attributes string", () => {
    const result = highlightAttributes("", defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe("");
  });

  it("should handle attributes with only spaces", () => {
    const result = highlightAttributes("   ", defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe("   ");
  });

  it("should handle invalid attribute syntax", () => {
    const result = highlightAttributes('class="unclosed', defaultOptions);
    const highlighted = expectSuccess(result);
    expect(highlighted).toBe(
      '<span class="attr">class</span>=<span class="attr-value">&quot;unclosed</span>'
    );
  });
});
