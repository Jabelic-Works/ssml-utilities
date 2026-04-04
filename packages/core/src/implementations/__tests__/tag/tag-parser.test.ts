import { describe, it, expect } from "vitest";
import {
  extractTagName,
  parseTagStructure,
  parseAttributesFromString,
  isMatchingTagPair,
  areMatchingTagPair,
} from "../../tag/tag-parser";

describe("extractTagName", () => {
  it("開始タグ・終了タグ・自己閉じタグからタグ名を抽出できる", () => {
    expect(extractTagName("<speak>")).toBe("speak");
    expect(extractTagName("</speak>")).toBe("speak");
    expect(extractTagName("<break/>")).toBe("break");
    expect(extractTagName('<mstts:express-as style="cheerful"/>')).toBe(
      "mstts:express-as"
    );
    expect(extractTagName("<ああ>")).toBe("ああ");
  });

  it("構文的に無効なタグでは null を返す", () => {
    expect(extractTagName("")).toBe(null);
    expect(extractTagName("speak")).toBe(null);
    expect(extractTagName("<speak")).toBe(null);
    expect(extractTagName("<>")).toBe(null);
    expect(extractTagName("<123tag>")).toBe(null);
    expect(extractTagName("<-tag>")).toBe(null);
    expect(extractTagName("< speak>")).toBe(null);
  });
});

describe("parseTagStructure", () => {
  it("開始タグを range 付きで解析する", () => {
    const result = parseTagStructure('<voice name="ja-JP-Ayumi">');

    expect(result).toMatchObject({
      tagName: "voice",
      isSelfClosing: false,
      isClosingTag: false,
      rawContent: 'voice name="ja-JP-Ayumi"',
      rawAttributes: ' name="ja-JP-Ayumi"',
      tagNameRange: { start: 1, end: 6 },
      attributeSourceRange: { start: 6, end: 25 },
      invalidFragments: [],
    });
    expect(result?.attributes).toHaveLength(1);
    expect(result?.attributes[0]).toMatchObject({
      name: "name",
      value: "ja-JP-Ayumi",
      raw: 'name="ja-JP-Ayumi"',
      hasExplicitValue: true,
      sourceRange: { start: 7, end: 25 },
      nameRange: { start: 7, end: 11 },
      valueRange: { start: 13, end: 24 },
    });
  });

  it("終了タグと自己閉じタグを解析する", () => {
    expect(parseTagStructure("</speak>")).toMatchObject({
      tagName: "speak",
      attributes: [],
      isSelfClosing: false,
      isClosingTag: true,
      rawContent: "/speak",
    });

    expect(parseTagStructure('<break time="500ms"/>')).toMatchObject({
      tagName: "break",
      isSelfClosing: true,
      isClosingTag: false,
      rawContent: 'break time="500ms"/',
      rawAttributes: ' time="500ms"',
    });
  });

  it("不正な属性断片を invalidFragments に残す", () => {
    const result = parseTagStructure('<break time="500ms" invalid=>');
    expect(result?.invalidFragments).toEqual([{ start: 20, end: 28 }]);
  });

  it("構文的に無効なタグでは null を返す", () => {
    expect(parseTagStructure("")).toBe(null);
    expect(parseTagStructure("< speak>")).toBe(null);
    expect(parseTagStructure("<123tag>")).toBe(null);
    expect(parseTagStructure("<-tag>")).toBe(null);
  });
});

describe("parseAttributesFromString", () => {
  it("属性一覧を span 付きで解析する", () => {
    const result = parseAttributesFromString(
      'prosody rate="slow" pitch="high"'
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      name: "rate",
      value: "slow",
      hasExplicitValue: true,
      sourceRange: { start: 8, end: 19 },
      nameRange: { start: 8, end: 12 },
      valueRange: { start: 14, end: 18 },
    });
    expect(result[1]).toMatchObject({
      name: "pitch",
      value: "high",
      sourceRange: { start: 20, end: 32 },
      nameRange: { start: 20, end: 25 },
      valueRange: { start: 27, end: 31 },
    });
  });

  it("値なし属性も保持する", () => {
    const result = parseAttributesFromString("disabled");
    expect(result).toEqual([
      {
        name: "disabled",
        value: "",
        raw: "disabled",
        hasExplicitValue: false,
        sourceRange: { start: 0, end: 8 },
        nameRange: { start: 0, end: 8 },
      },
    ]);
  });

  it("無効な形式の属性は無視する", () => {
    const result = parseAttributesFromString('valid="value" invalid=');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: "valid",
      value: "value",
    });
  });
});

describe("isMatchingTagPair", () => {
  describe("正常ケース", () => {
    it("一致するタグ名でtrueを返す", () => {
      expect(isMatchingTagPair("speak", "speak")).toBe(true);
      expect(isMatchingTagPair("voice", "voice")).toBe(true);
      expect(isMatchingTagPair("mstts:express-as", "mstts:express-as")).toBe(
        true
      );
    });
  });

  describe("異常ケース", () => {
    it("一致しないタグ名でfalseを返す", () => {
      expect(isMatchingTagPair("speak", "voice")).toBe(false);
      expect(isMatchingTagPair("break", "audio")).toBe(false);
    });
  });
});

describe("areMatchingTagPair", () => {
  it("一致するタグペアで true を返す", () => {
    expect(areMatchingTagPair("<speak>", "</speak>")).toBe(true);
    expect(areMatchingTagPair('<voice name="ja-JP-Ayumi">', "</voice>")).toBe(
      true
    );
  });

  it("一致しない、または構文的に無効なタグで false を返す", () => {
    expect(areMatchingTagPair("<speak>", "</voice>")).toBe(false);
    expect(areMatchingTagPair("speak", "</speak>")).toBe(false);
    expect(areMatchingTagPair("<123invalid>", "</123invalid>")).toBe(false);
  });
});
