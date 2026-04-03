import { describe, it, expect } from "vitest";
import {
  ATTRIBUTE_TOKEN_PATTERN,
  extractTagName,
  parseTagStructure,
  parseAttributesFromString,
  isMatchingTagPair,
  areMatchingTagPair,
  SYNTAX_TAG_NAME_PATTERN,
} from "../../tag/tag-parser";

describe("SYNTAX_TAG_NAME_PATTERN", () => {
  it("parser grammar として許可するタグ名を認識する", () => {
    expect(SYNTAX_TAG_NAME_PATTERN.test("speak")).toBe(true);
    expect(SYNTAX_TAG_NAME_PATTERN.test("_private-tag")).toBe(true);
    expect(SYNTAX_TAG_NAME_PATTERN.test("custom.tag")).toBe(true);
    expect(SYNTAX_TAG_NAME_PATTERN.test("ns:custom.tag-name_1")).toBe(true);
    expect(SYNTAX_TAG_NAME_PATTERN.test("ああ")).toBe(true);
  });

  it("parser grammar として不正なタグ名を拒否する", () => {
    expect(SYNTAX_TAG_NAME_PATTERN.test("123tag")).toBe(false);
    expect(SYNTAX_TAG_NAME_PATTERN.test("-tag")).toBe(false);
    expect(SYNTAX_TAG_NAME_PATTERN.test("tag with space")).toBe(false);
    expect(SYNTAX_TAG_NAME_PATTERN.test("")).toBe(false);
  });
});

describe("ATTRIBUTE_TOKEN_PATTERN", () => {
  const collectMatches = (source: string): string[] => {
    const regex = new RegExp(
      ATTRIBUTE_TOKEN_PATTERN.source,
      ATTRIBUTE_TOKEN_PATTERN.flags
    );

    return Array.from(source.matchAll(regex), (match) => match[0]);
  };

  it("namespaced attribute や unquoted value を token として拾える", () => {
    expect(collectMatches(' xml:lang="ja-JP" data-id=42')).toEqual([
      ' xml:lang="ja-JP"',
      " data-id=42",
    ]);
  });

  it("quoted value 内の > を保持する", () => {
    expect(collectMatches(' alias="a > b"')).toEqual([' alias="a > b"']);
  });

  it("値なし属性も token として拾える", () => {
    expect(collectMatches(" disabled")).toEqual([" disabled"]);
  });

  it("不正な suffix があっても valid-looking な prefix までは token として拾う", () => {
    expect(collectMatches(' valid="ok" invalid= foo==bar')).toEqual([
      ' valid="ok"',
      " invalid= foo",
    ]);
  });
});

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

  it("dot や underscore を含む構文上有効なタグ名を抽出できる", () => {
    expect(extractTagName("<custom.tag>")).toBe("custom.tag");
    expect(extractTagName("<_private-tag>")).toBe("_private-tag");
    expect(extractTagName("<ns:custom.tag-name_1>")).toBe(
      "ns:custom.tag-name_1"
    );
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

  it("dot や namespace を含むタグと quoted value を解析する", () => {
    const result = parseTagStructure('<ns:custom.tag data-id="42" alias="a > b">');

    expect(result).toMatchObject({
      tagName: "ns:custom.tag",
      isSelfClosing: false,
      isClosingTag: false,
      rawAttributes: ' data-id="42" alias="a > b"',
      invalidFragments: [],
    });
    expect(result?.attributes).toEqual([
      expect.objectContaining({
        name: "data-id",
        value: "42",
      }),
      expect.objectContaining({
        name: "alias",
        value: "a > b",
      }),
    ]);
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

  it("full tag 文字列から namespaced attribute と unquoted value を解析する", () => {
    const result = parseAttributesFromString(
      '<voice xml:lang="ja-JP" data-id=42>'
    );

    expect(result).toEqual([
      expect.objectContaining({
        name: "xml:lang",
        value: "ja-JP",
        sourceRange: { start: 7, end: 23 },
      }),
      expect.objectContaining({
        name: "data-id",
        value: "42",
        sourceRange: { start: 24, end: 34 },
      }),
    ]);
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

  it("quoted value 内の > を保持する", () => {
    const result = parseAttributesFromString('alias="a > b"');
    expect(result).toEqual([
      expect.objectContaining({
        name: "alias",
        value: "a > b",
      }),
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

  it("不正な属性名や余計な = を含む属性を無視する", () => {
    const result = parseAttributesFromString(
      'valid="value" 1invalid="x" foo==bar'
    );
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
