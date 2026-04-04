import { describe, it, expect } from "vitest";
import { tokenize, determineTagType } from "../../lexer";
import { Token } from "../../parser/types";

function stripSourceSpan(tokens: Token[]): Array<Pick<Token, "type" | "value">> {
  return tokens.map(({ type, value }) => ({ type, value }));
}

describe("tokenizer", () => {
  describe("determineTagType", () => {
    it("閉じタグを正しく識別する", () => {
      expect(determineTagType("</speak>")).toBe("closeTag");
    });

    it("自己閉じタグを正しく識別する", () => {
      expect(determineTagType("<break/>")).toBe("selfClosingTag");
    });

    it("開始タグを正しく識別する", () => {
      expect(determineTagType("<speak>")).toBe("openTag");
    });
  });

  describe("tokenize", () => {
    it("単純なSSMLをトークン化する", () => {
      const input = "<speak>こんにちは、世界！</speak>";
      const expected: Token[] = [
        { type: "openTag", value: "<speak>" },
        { type: "text", value: "こんにちは、世界！" },
        { type: "closeTag", value: "</speak>" },
      ];
      expect(stripSourceSpan(tokenize(input))).toEqual(expected);
    });

    it("自己閉じタグを含むSSMLをトークン化する", () => {
      const input = '<speak>こんにちは<break time="500ms"/>世界！</speak>';
      const expected: Token[] = [
        { type: "openTag", value: "<speak>" },
        { type: "text", value: "こんにちは" },
        { type: "selfClosingTag", value: '<break time="500ms"/>' },
        { type: "text", value: "世界！" },
        { type: "closeTag", value: "</speak>" },
      ];
      expect(stripSourceSpan(tokenize(input))).toEqual(expected);
    });

    it("入れ子のタグを含むSSMLをトークン化する", () => {
      const input =
        '<speak>こんにちは<prosody pitch="high">世界！</prosody></speak>';
      const expected: Token[] = [
        { type: "openTag", value: "<speak>" },
        { type: "text", value: "こんにちは" },
        { type: "openTag", value: '<prosody pitch="high">' },
        { type: "text", value: "世界！" },
        { type: "closeTag", value: "</prosody>" },
        { type: "closeTag", value: "</speak>" },
      ];
      expect(stripSourceSpan(tokenize(input))).toEqual(expected);
    });

    it("say-asタグを含むSSMLをトークン化する", () => {
      const input = "<say-as>Hello, world!</say-as>";
      const expected: Token[] = [
        { type: "openTag", value: "<say-as>" },
        { type: "text", value: "Hello, world!" },
        { type: "closeTag", value: "</say-as>" },
      ];
      expect(stripSourceSpan(tokenize(input))).toEqual(expected);
    });

    it("日本語タグ名を未知タグとして保持する", () => {
      const input = "{{あああ<ああ>}}";
      const expected: Token[] = [
        { type: "text", value: "{{あああ" },
        { type: "openTag", value: "<ああ>" },
        { type: "text", value: "}}" },
      ];
      expect(stripSourceSpan(tokenize(input))).toEqual(expected);
    });

    it("英語タグ名と日本語の両方を構文要素として扱える", () => {
      const input1 = "{{あああ<sub>}}";
      const expected1: Token[] = [
        { type: "text", value: "{{あああ" },
        { type: "openTag", value: "<sub>" },
        { type: "text", value: "}}" },
      ];
      expect(stripSourceSpan(tokenize(input1))).toEqual(expected1);

      const input2 = "{{あああ<ああ>}}";
      const expected2: Token[] = [
        { type: "text", value: "{{あああ" },
        { type: "openTag", value: "<ああ>" },
        { type: "text", value: "}}" },
      ];
      expect(stripSourceSpan(tokenize(input2))).toEqual(expected2);
    });

    it("引用符内の > を含む属性値を壊さない", () => {
      const input = '<speak><sub alias="a > b">x</sub></speak>';
      expect(stripSourceSpan(tokenize(input))).toEqual([
        { type: "openTag", value: "<speak>" },
        { type: "openTag", value: '<sub alias="a > b">' },
        { type: "text", value: "x" },
        { type: "closeTag", value: "</sub>" },
        { type: "closeTag", value: "</speak>" },
      ]);
    });
  });
});

describe("tokenize: white editing", () => {
  it("<", () => {
    const input = "<";
    const expected: Token[] = [{ type: "text", value: "<" }];
    expect(stripSourceSpan(tokenize(input))).toEqual(expected);
  });
  it("<<p", () => {
    const input = "<<p";
    const expected: Token[] = [
      { type: "text", value: "<" },
      { type: "text", value: "<p" },
    ];
    expect(stripSourceSpan(tokenize(input))).toEqual(expected);
  });
  it("<が続く場合は、<をテキストとして認識する", () => {
    const input = "<<p>";
    const expected: Token[] = [
      { type: "text", value: "<" },
      { type: "openTag", value: "<p>" },
    ];
    expect(stripSourceSpan(tokenize(input))).toEqual(expected);
  });
  it("<が3回続く場合は、<をテキストとして認識する", () => {
    const input = "<<<p>";
    const expected: Token[] = [
      { type: "text", value: "<" },
      { type: "text", value: "<" },
      { type: "openTag", value: "<p>" },
    ];
    expect(stripSourceSpan(tokenize(input))).toEqual(expected);
  });

  it("sourceSpan を各 token に付与する", () => {
    const [openTag, text, closeTag] = tokenize("<speak>\nA</speak>");

    expect(openTag.sourceSpan).toEqual({
      start: { offset: 0, line: 1, column: 1 },
      end: { offset: 7, line: 1, column: 8 },
    });
    expect(text.sourceSpan).toEqual({
      start: { offset: 7, line: 1, column: 8 },
      end: { offset: 9, line: 2, column: 2 },
    });
    expect(closeTag.sourceSpan).toEqual({
      start: { offset: 9, line: 2, column: 2 },
      end: { offset: 17, line: 2, column: 10 },
    });
  });
});
