import { describe, it, expect } from "vitest";
import { buildDAGFromTokens } from "../../parser/dagBuilder";
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
      console.log(dag.debugPrint());
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

  it("無効なトークンシーケンスに対してエラーを返す", () => {
    const tokens: Token[] = [
      { type: "closeTag", value: "</speak>" }, // 開始タグなしで閉じタグ
    ];

    const result = buildDAGFromTokens(tokens);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Failed to");
    }
  });
});
