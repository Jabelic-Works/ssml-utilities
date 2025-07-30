import { describe, it, expect } from "vitest";
import { buildDAGFromTokens } from "../../dag/builder";
import { Token } from "../../parser/types";
import { parseAttributes } from "../../dag/builder";

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

describe("parseAttributes", () => {
  it("通常の属性を正しくパースする", () => {
    const tagContent = 'lang="ja-JP" rate="slow" volume="loud"';
    const attributes = parseAttributes(tagContent);

    expect(attributes).toHaveLength(3);
    expect(attributes[0]).toEqual({ name: "lang", value: "ja-JP" });
    expect(attributes[1]).toEqual({ name: "rate", value: "slow" });
    expect(attributes[2]).toEqual({ name: "volume", value: "loud" });
  });

  it("コロンを含む名前空間付き属性を正しくパースする", () => {
    const tagContent =
      'xml:lang="ja-JP" xmlns:ssml="http://www.w3.org/2001/10/synthesis"';
    const attributes = parseAttributes(tagContent);

    expect(attributes).toHaveLength(2);
    expect(attributes[0]).toEqual({ name: "xml:lang", value: "ja-JP" });
    expect(attributes[1]).toEqual({
      name: "xmlns:ssml",
      value: "http://www.w3.org/2001/10/synthesis",
    });
  });

  it("不正な形式の属性をスキップする", () => {
    const tagContent = 'valid="ok" :invalid="bad" 123="wrong" valid-two="good"';
    const attributes = parseAttributes(tagContent);

    expect(attributes).toHaveLength(2);
    expect(attributes[0]).toEqual({ name: "valid", value: "ok" });
    expect(attributes[1]).toEqual({ name: "valid-two", value: "good" });
  });

  it("シングルクォートとダブルクォートの両方をサポートする", () => {
    const tagContent = "single='value' double=\"value\"";
    const attributes = parseAttributes(tagContent);

    expect(attributes).toHaveLength(2);
    expect(attributes[0]).toEqual({ name: "single", value: "value" });
    expect(attributes[1]).toEqual({ name: "double", value: "value" });
  });
});
