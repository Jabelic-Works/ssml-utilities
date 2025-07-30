import { describe, it, expect } from "vitest";
import {
  extractTagName,
  parseTagStructure,
  parseAttributesFromString,
  isMatchingTagPair,
  areMatchingTagPair,
} from "../../tag/tag-parser";

describe("extractTagName", () => {
  describe("正常ケース", () => {
    it("基本的な開始タグからタグ名を抽出", () => {
      expect(extractTagName("<speak>")).toBe("speak");
      expect(extractTagName("<voice>")).toBe("voice");
      expect(extractTagName("<break>")).toBe("break");
    });

    it("基本的な終了タグからタグ名を抽出", () => {
      expect(extractTagName("</speak>")).toBe("speak");
      expect(extractTagName("</voice>")).toBe("voice");
      expect(extractTagName("</break>")).toBe("break");
    });

    it("セルフクロージングタグからタグ名を抽出", () => {
      expect(extractTagName("<break/>")).toBe("break");
      expect(extractTagName("<audio/>")).toBe("audio");
    });

    it("属性付きタグからタグ名を抽出", () => {
      expect(extractTagName('<break time="500ms"/>')).toBe("break");
      expect(extractTagName('<voice name="ja-JP-Ayumi">')).toBe("voice");
      expect(extractTagName('<prosody rate="slow" pitch="high">')).toBe(
        "prosody"
      );
    });

    it("名前空間付きタグからタグ名を抽出", () => {
      expect(extractTagName("<mstts:express-as>")).toBe("mstts:express-as");
      expect(extractTagName("</mstts:express-as>")).toBe("mstts:express-as");
      expect(extractTagName('<mstts:express-as style="cheerful"/>')).toBe(
        "mstts:express-as"
      );
    });

    it("ハイフン付きタグからタグ名を抽出", () => {
      expect(extractTagName("<say-as>")).toBe("say-as");
      expect(extractTagName("</say-as>")).toBe("say-as");
    });

    it("アンダースコア付きタグからタグ名を抽出", () => {
      expect(extractTagName("<custom_tag>")).toBe("custom_tag");
      expect(extractTagName("</custom_tag>")).toBe("custom_tag");
    });
  });

  describe("異常ケース", () => {
    it("無効な入力でnullを返す", () => {
      expect(extractTagName("")).toBe(null);
      expect(extractTagName("speak")).toBe(null);
      expect(extractTagName("<speak")).toBe(null);
      expect(extractTagName("speak>")).toBe(null);
      expect(extractTagName("<>")).toBe(null);
    });

    it("形式に関わらずタグ名を抽出", () => {
      expect(extractTagName("<123tag>")).toBe("123tag"); // 数字で始まる
      expect(extractTagName("<-tag>")).toBe("-tag"); // ハイフンで始まる
      expect(extractTagName("< speak>")).toBe(null); // スペースで始まる → 空文字
    });

    it("nullまたはundefinedでnullを返す", () => {
      expect(extractTagName(null as any)).toBe(null);
      expect(extractTagName(undefined as any)).toBe(null);
    });
  });
});

describe("parseTagStructure", () => {
  describe("正常ケース - 開始タグ", () => {
    it("基本的な開始タグを解析", () => {
      const result = parseTagStructure("<speak>");
      expect(result).toEqual({
        tagName: "speak",
        attributes: [],
        isSelfClosing: false,
        isClosingTag: false,
        rawContent: "speak",
      });
    });

    it("属性付き開始タグを解析", () => {
      const result = parseTagStructure('<voice name="ja-JP-Ayumi">');
      expect(result).toEqual({
        tagName: "voice",
        attributes: [{ name: "name", value: "ja-JP-Ayumi" }],
        isSelfClosing: false,
        isClosingTag: false,
        rawContent: 'voice name="ja-JP-Ayumi"',
      });
    });

    it("複数属性付き開始タグを解析", () => {
      const result = parseTagStructure('<prosody rate="slow" pitch="high">');
      expect(result).toEqual({
        tagName: "prosody",
        attributes: [
          { name: "rate", value: "slow" },
          { name: "pitch", value: "high" },
        ],
        isSelfClosing: false,
        isClosingTag: false,
        rawContent: 'prosody rate="slow" pitch="high"',
      });
    });
  });

  describe("正常ケース - 終了タグ", () => {
    it("基本的な終了タグを解析", () => {
      const result = parseTagStructure("</speak>");
      expect(result).toEqual({
        tagName: "speak",
        attributes: [],
        isSelfClosing: false,
        isClosingTag: true,
        rawContent: "/speak",
      });
    });

    it("名前空間付き終了タグを解析", () => {
      const result = parseTagStructure("</mstts:express-as>");
      expect(result).toEqual({
        tagName: "mstts:express-as",
        attributes: [],
        isSelfClosing: false,
        isClosingTag: true,
        rawContent: "/mstts:express-as",
      });
    });
  });

  describe("正常ケース - セルフクロージングタグ", () => {
    it("基本的なセルフクロージングタグを解析", () => {
      const result = parseTagStructure("<break/>");
      expect(result).toEqual({
        tagName: "break",
        attributes: [],
        isSelfClosing: true,
        isClosingTag: false,
        rawContent: "break/",
      });
    });

    it("属性付きセルフクロージングタグを解析", () => {
      const result = parseTagStructure('<break time="500ms"/>');
      expect(result).toEqual({
        tagName: "break",
        attributes: [{ name: "time", value: "500ms" }],
        isSelfClosing: true,
        isClosingTag: false,
        rawContent: 'break time="500ms"/',
      });
    });

    it("スペースありセルフクロージングタグを解析", () => {
      const result = parseTagStructure('<audio src="sound.wav" />');
      expect(result).toEqual({
        tagName: "audio",
        attributes: [{ name: "src", value: "sound.wav" }],
        isSelfClosing: true,
        isClosingTag: false,
        rawContent: 'audio src="sound.wav" /',
      });
    });
  });

  describe("異常ケース", () => {
    it("無効な入力でnullを返す", () => {
      expect(parseTagStructure("")).toBe(null);
      expect(parseTagStructure("speak")).toBe(null);
      expect(parseTagStructure("<speak")).toBe(null);
      expect(parseTagStructure("speak>")).toBe(null);
      expect(parseTagStructure("<>")).toBe(null);
    });

    it("スペースで始まる内容でnullを返す", () => {
      expect(parseTagStructure("< speak>")).toBe(null);
      expect(parseTagStructure("<　speak>")).toBe(null); // 全角スペース
    });

    it("形式に関わらずタグ構造を解析（パーサーはバリデーションしない）", () => {
      expect(parseTagStructure("<123tag>")).toEqual({
        tagName: "123tag",
        attributes: [],
        isSelfClosing: false,
        isClosingTag: false,
        rawContent: "123tag",
      });
      expect(parseTagStructure("<-tag>")).toEqual({
        tagName: "-tag",
        attributes: [],
        isSelfClosing: false,
        isClosingTag: false,
        rawContent: "-tag",
      });
    });
  });
});

describe("parseAttributesFromString", () => {
  describe("正常ケース", () => {
    it("単一属性を解析", () => {
      const result = parseAttributesFromString('voice name="ja-JP-Ayumi"');
      expect(result).toEqual([{ name: "name", value: "ja-JP-Ayumi" }]);
    });

    it("複数属性を解析", () => {
      const result = parseAttributesFromString(
        'prosody rate="slow" pitch="high"'
      );
      expect(result).toEqual([
        { name: "rate", value: "slow" },
        { name: "pitch", value: "high" },
      ]);
    });

    it("シングルクォート属性を解析", () => {
      const result = parseAttributesFromString("voice name='ja-JP-Ayumi'");
      expect(result).toEqual([{ name: "name", value: "ja-JP-Ayumi" }]);
    });

    it("名前空間付き属性を解析", () => {
      const result = parseAttributesFromString('tag xml:lang="ja-JP"');
      expect(result).toEqual([{ name: "xml:lang", value: "ja-JP" }]);
    });

    it("アンダースコア付き属性を解析", () => {
      const result = parseAttributesFromString('tag custom_attr="value"');
      expect(result).toEqual([{ name: "custom_attr", value: "value" }]);
    });

    it("数値を含む属性値を解析", () => {
      const result = parseAttributesFromString('break time="500ms"');
      expect(result).toEqual([{ name: "time", value: "500ms" }]);
    });

    it("空の属性値を解析", () => {
      const result = parseAttributesFromString('tag attr=""');
      expect(result).toEqual([{ name: "attr", value: "" }]);
    });
  });

  describe("境界ケース", () => {
    it("属性なしの場合は空配列を返す", () => {
      expect(parseAttributesFromString("speak")).toEqual([]);
      expect(parseAttributesFromString("break/")).toEqual([]);
      expect(parseAttributesFromString("")).toEqual([]);
    });

    it("不正な形式の属性は無視", () => {
      const result = parseAttributesFromString(
        'tag valid="value" invalid=value'
      );
      expect(result).toEqual([{ name: "valid", value: "value" }]);
    });

    it("コロンを含む複雑な属性名", () => {
      const result = parseAttributesFromString(
        'tag xmlns:mstts="http://example.com"'
      );
      expect(result).toEqual([
        { name: "xmlns:mstts", value: "http://example.com" },
      ]);
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
  describe("正常ケース", () => {
    it("一致するタグペアでtrueを返す", () => {
      expect(areMatchingTagPair("<speak>", "</speak>")).toBe(true);
      expect(areMatchingTagPair('<voice name="ja-JP-Ayumi">', "</voice>")).toBe(
        true
      );
      expect(
        areMatchingTagPair("<mstts:express-as>", "</mstts:express-as>")
      ).toBe(true);
    });
  });

  describe("異常ケース", () => {
    it("一致しないタグペアでfalseを返す", () => {
      expect(areMatchingTagPair("<speak>", "</voice>")).toBe(false);
      expect(areMatchingTagPair("<break>", "</audio>")).toBe(false);
    });

    it("無効なタグでfalseを返す", () => {
      expect(areMatchingTagPair("speak", "</speak>")).toBe(false);
      expect(areMatchingTagPair("<speak>", "speak")).toBe(false);
      expect(areMatchingTagPair("", "")).toBe(false);
    });

    it("形式に関わらずタグ名でマッチング（パーサーはバリデーションしない）", () => {
      expect(areMatchingTagPair("<123invalid>", "</123invalid>")).toBe(true);
      expect(areMatchingTagPair("<-tag>", "</-tag>")).toBe(true);
    });

    it("タグ名が抽出できない場合はfalseを返す", () => {
      expect(areMatchingTagPair("<>", "</>")).toBe(false);
    });
  });
});
