import { describe, it, expect } from "vitest";
import { tokenize, determineTagType } from "../../parser/tokenizer";
import { Token } from "../../parser/types";

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
      expect(tokenize(input)).toEqual(expected);
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
      expect(tokenize(input)).toEqual(expected);
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
      expect(tokenize(input)).toEqual(expected);
    });
  });
  it("say-asタグを含むSSMLをトークン化する", () => {
    const input = "<say-as>Hello, world!</say-as>";
    const expected: Token[] = [
      { type: "openTag", value: "<say-as>" },
      { type: "text", value: "Hello, world!" },
      { type: "closeTag", value: "</say-as>" },
    ];
    expect(tokenize(input)).toEqual(expected);
  });
});

describe("tokenize: white editing", () => {
  it("<", () => {
    const input = "<";
    const expected: Token[] = [{ type: "text", value: "<" }];
    expect(tokenize(input)).toEqual(expected);
  });
  it("<<a", () => {
    const input = "<<a";
    const expected: Token[] = [
      { type: "text", value: "<" },
      { type: "text", value: "<a" },
    ];
    expect(tokenize(input)).toEqual(expected);
  });
  it("<が続く場合は、<をテキストとして認識する", () => {
    const input = "<<a>";
    const expected: Token[] = [
      { type: "text", value: "<" },
      { type: "openTag", value: "<a>" },
    ];
    expect(tokenize(input)).toEqual(expected);
  });
});
