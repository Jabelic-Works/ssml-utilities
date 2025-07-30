import { describe, it, expect } from "vitest";
import { buildDAGFromTokens } from "../../dag/builder";
import { Token } from "../../parser/types";

describe("buildDAGFromTokens", () => {
  it("単純なSSMLトークンからDAGを正しく構築する", () => {
    const tokens: Token[] = [
      { type: "openTag", value: "<speak>" },
      { type: "text", value: "こんにちは" },
      { type: "closeTag", value: "</speak>" },
    ];

    const result = buildDAGFromTokens(tokens);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const dag = result.value;
      expect(dag.nodes.size).toBe(4); // root, speak, テキスト, speak
    }
  });

  it("属性を持つ要素を正しく処理する", () => {
    const tokens: Token[] = [
      { type: "openTag", value: "<speak lang='ja-JP'>" },
      { type: "text", value: "こんにちは" },
      { type: "closeTag", value: "</speak>" },
    ];

    const result = buildDAGFromTokens(tokens);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const dag = result.value;
      expect(dag.nodes.size).toBe(5); // root, speak, 属性, テキスト, speak
    }
  });

  it("自己閉じタグを正しく処理する", () => {
    const tokens: Token[] = [
      { type: "openTag", value: "<speak>" },
      { type: "selfClosingTag", value: "<break time='500ms'>" },
      { type: "closeTag", value: "</speak>" },
    ];
    const result = buildDAGFromTokens(tokens);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const dag = result.value;
      expect(dag.nodes.size).toBe(5); // root, speak, break, 属性, speak
    }
  });

  it("ネストしたSSMLを正しく処理する", () => {
    const tokens: Token[] = [
      { type: "openTag", value: "<speak>" },
      { type: "selfClosingTag", value: "<break time='500ms' />" },
      { type: "text", value: "こんにちは" },
      { type: "openTag", value: '<prosody rate="slow" pitch="-2st">' },
      { type: "openTag", value: '<sub alias="World Wide Web Consortium">' },
      { type: "text", value: "W3C" },
      { type: "closeTag", value: "</sub>" },
      { type: "closeTag", value: "</prosody>" },
      { type: "closeTag", value: "</speak>" },
    ];
    const result = buildDAGFromTokens(tokens);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const dag = result.value;
      expect(dag.nodes.size).toBe(14); // root, speak, break, 属性, テキスト, prosody, 属性, 属性, sub, 属性, テキスト, /sub, /prosoby, /speak
    }
  });
});
describe("buildDAGFromTokens: white editing", () => {
  it("", () => {
    const tokens: Token[] = [
      { type: "openTag", value: "<speak>" },
      { type: "openTag", value: "<a>" },
      { type: "text", value: "<" },
      { type: "closeTag", value: "</a>" },
      { type: "closeTag", value: "</speak>" },
    ];
    const result = buildDAGFromTokens(tokens);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const dag = result.value;
      expect(dag.nodes.size).toBe(6); // root, speak, a, テキスト, a, speak
    }
  });
});
