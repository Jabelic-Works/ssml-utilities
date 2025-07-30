import { describe, it, expect } from "vitest";
import {
  // isValidTag,
  isValidTagName,
  isValidAttribute,
  //   isValidElementNesting,
  isTextOnlyElement,
  isSelfContainedElement,
  STANDARD_SSML_TAGS,
  DEFAULT_VALIDATION_OPTIONS,
} from "../../tag/validate";

describe("SSML Validation", () => {
  describe("isValidTagName", () => {
    it("標準SSMLタグ名を正しく認識する", () => {
      expect(isValidTagName("speak")).toBe(true);
      expect(isValidTagName("prosody")).toBe(true);
      expect(isValidTagName("break")).toBe(true);
      expect(isValidTagName("say-as")).toBe(true);
      expect(isValidTagName("/speak")).toBe(true); // 終了タグ
    });

    it("Microsoft SSML要素を認識する", () => {
      expect(isValidTagName("bookmark")).toBe(true);
      expect(isValidTagName("lexicon")).toBe(true);
      expect(isValidTagName("mstts:express-as")).toBe(true);
      expect(isValidTagName("mstts:backgroundaudio")).toBe(true);
      expect(isValidTagName("mstts:viseme")).toBe(true);
    });

    it("日本語文字を含むカスタムタグ名を認識する", () => {
      const allowJapaneseOptions = {
        allowMode: "ALLOW_JAPANESE" as const,
      };
      expect(isValidTagName("customTag", allowJapaneseOptions)).toBe(true);
      expect(isValidTagName("ああ", allowJapaneseOptions)).toBe(true);
      expect(isValidTagName("日本語", allowJapaneseOptions)).toBe(true);
      expect(isValidTagName("声優", allowJapaneseOptions)).toBe(true);
    });

    it("無効なタグ名を拒否する", () => {
      expect(isValidTagName("")).toBe(false);
      expect(isValidTagName(" ")).toBe(false);
      expect(isValidTagName(" a")).toBe(false);
      expect(isValidTagName("　")).toBe(false);
      expect(isValidTagName("　a")).toBe(false);
      expect(isValidTagName("123")).toBe(false);
      expect(isValidTagName("-invalid")).toBe(false);
    });

    it("strictModeで標準タグのみを許可する", () => {
      const strictOptions = { ...DEFAULT_VALIDATION_OPTIONS, strictMode: true };
      expect(isValidTagName("speak", strictOptions)).toBe(true);
      expect(isValidTagName("mstts:express-as", strictOptions)).toBe(true);
      expect(isValidTagName("ああ", strictOptions)).toBe(false);
      expect(isValidTagName("customTag", strictOptions)).toBe(false);
    });
  });

  describe("isValidAttribute", () => {
    it("有効な属性を認識する", () => {
      expect(isValidAttribute("")).toBe(true); // 空の属性
      expect(isValidAttribute("pitch='high'")).toBe(true);
      expect(isValidAttribute('time="500ms"')).toBe(true);
      expect(isValidAttribute("interpret-as=characters")).toBe(true);
      expect(isValidAttribute("xml:lang=en")).toBe(true); // 名前空間
    });

    it("無効な属性を拒否する", () => {
      expect(isValidAttribute("123invalid=value")).toBe(false);
      expect(isValidAttribute("=value")).toBe(false);
    });
  });

  // describe("isValidTag", () => {
  //   it("単純なタグを正しく認識する", () => {
  //     expect(isValidTag("<speak>")).toBe(true);
  //     expect(isValidTag("</speak>")).toBe(true);
  //     expect(isValidTag("<break/>")).toBe(true);
  //   });

  //   it("Microsoft SSML要素を認識する", () => {
  //     expect(isValidTag("<bookmark/>")).toBe(true);
  //     expect(isValidTag("<mstts:express-as>")).toBe(true);
  //     expect(isValidTag("</mstts:backgroundaudio>")).toBe(true);
  //     expect(isValidTag("<mstts:viseme/>")).toBe(true);
  //   });

  //   it("属性付きタグを正しく認識する", () => {
  //     expect(isValidTag("<prosody pitch='high'>")).toBe(true);
  //     expect(isValidTag('<break time="500ms"/>')).toBe(true);
  //     expect(isValidTag("<say-as interpret-as='characters'>")).toBe(true);
  //   });

  //   it("日本語タグ名を正しく認識する", () => {
  //     const allowJapaneseOptions = {
  //       allowMode: "ALLOW_JAPANESE" as const,
  //     };
  //     expect(isValidTag("<ああ>", allowJapaneseOptions)).toBe(true);
  //     expect(isValidTag("</ああ>", allowJapaneseOptions)).toBe(true);
  //     expect(isValidTag("<日本語/>", allowJapaneseOptions)).toBe(true);
  //   });

  //   it("無効なタグを拒否する", () => {
  //     expect(isValidTag("")).toBe(false);
  //     expect(isValidTag("speak")).toBe(false); // < > なし
  //     expect(isValidTag("<>")).toBe(false); // タグ名なし
  //     expect(isValidTag("< speak>")).toBe(false); // 空白で始まる
  //   });

  //   it("strictModeでカスタムタグを拒否する", () => {
  //     const strictOptions = { ...DEFAULT_VALIDATION_OPTIONS, strictMode: true };
  //     expect(isValidTag("<speak>", strictOptions)).toBe(true);
  //     expect(isValidTag("<mstts:express-as>", strictOptions)).toBe(true);
  //     expect(isValidTag("<ああ>", strictOptions)).toBe(false);
  //     expect(isValidTag("<customTag>", strictOptions)).toBe(false);
  //   });
  // });

  describe("isTextOnlyElement", () => {
    it("子要素にテキストのみを持つ要素を正しく認識する", () => {
      expect(isTextOnlyElement("phoneme")).toBe(true);
      expect(isTextOnlyElement("say-as")).toBe(true);
      expect(isTextOnlyElement("sub")).toBe(true);
      expect(isTextOnlyElement("prosody")).toBe(false);
      expect(isTextOnlyElement("emphasis")).toBe(false);
    });
  });

  describe("isSelfContainedElement", () => {
    it("子要素を持たない要素を正しく認識する", () => {
      expect(isSelfContainedElement("break")).toBe(true);
      expect(isSelfContainedElement("bookmark")).toBe(true);
      expect(isSelfContainedElement("mstts:silence")).toBe(true);
      expect(isSelfContainedElement("mstts:viseme")).toBe(true);
      expect(isSelfContainedElement("prosody")).toBe(false);
      expect(isSelfContainedElement("emphasis")).toBe(false);
    });
  });

  describe("STANDARD_SSML_TAGS", () => {
    it("Microsoft SSML標準タグが定義されている", () => {
      expect(STANDARD_SSML_TAGS).toContain("speak");
      expect(STANDARD_SSML_TAGS).toContain("prosody");
      expect(STANDARD_SSML_TAGS).toContain("break");
      expect(STANDARD_SSML_TAGS).toContain("say-as");
      expect(STANDARD_SSML_TAGS).toContain("bookmark");
      expect(STANDARD_SSML_TAGS).toContain("mstts:express-as");
      expect(STANDARD_SSML_TAGS).toContain("mstts:backgroundaudio");
      expect(STANDARD_SSML_TAGS).toContain("mstts:viseme");
    });
  });
});
