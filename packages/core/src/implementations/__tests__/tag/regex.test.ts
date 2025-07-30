import {
  CUSTOM_TAG_PATTERN,
  ATTRIBUTE_NAME_PATTERN,
  ATTRIBUTE_VALUE_PATTERN,
} from "../../tag/regex";

describe("正規表現パターンのテスト", () => {
  describe("CUSTOM_TAG_PATTERN", () => {
    it("有効なカスタムタグ名パターンを認識する", () => {
      // 英字から始まる
      expect(CUSTOM_TAG_PATTERN.test("customTag")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("a")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("A")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("tag123")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("tag-name")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("tag_name")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("my-custom-tag")).toBe(true);

      // ひらがなから始まる
      expect(CUSTOM_TAG_PATTERN.test("あ")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("ああ")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("あいうえお")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("あ123")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("あ-")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("あ_")).toBe(true);

      // カタカナから始まる
      expect(CUSTOM_TAG_PATTERN.test("ア")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("アア")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("アイウエオ")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("ア123")).toBe(true);

      // 漢字から始まる
      expect(CUSTOM_TAG_PATTERN.test("日")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("日本")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("日本語")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("声優")).toBe(true);
      expect(CUSTOM_TAG_PATTERN.test("音声123")).toBe(true);
    });

    it("無効なカスタムタグ名パターンを拒否する", () => {
      // 数字から始まる
      expect(CUSTOM_TAG_PATTERN.test("1tag")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("123")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("0test")).toBe(false);

      // 記号から始まる
      expect(CUSTOM_TAG_PATTERN.test("-tag")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("_tag")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("@tag")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("#tag")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("$tag")).toBe(false);

      // 空文字・空白
      expect(CUSTOM_TAG_PATTERN.test("")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test(" ")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("　")).toBe(false);

      // 無効な文字を含む
      expect(CUSTOM_TAG_PATTERN.test("tag with space")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("tag@invalid")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("tag#invalid")).toBe(false);
      expect(CUSTOM_TAG_PATTERN.test("tag!")).toBe(false);
    });
  });

  describe("ATTRIBUTE_NAME_PATTERN", () => {
    it("有効な属性名パターンを認識する", () => {
      // 英字から始まる
      expect(ATTRIBUTE_NAME_PATTERN.test("attr")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("a")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("A")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("attribute123")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("attr-name")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("attr_name")).toBe(true);

      // アンダースコアから始まる
      expect(ATTRIBUTE_NAME_PATTERN.test("_attr")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("_")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("_123")).toBe(true);

      // 名前空間付き
      expect(ATTRIBUTE_NAME_PATTERN.test("xml:lang")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("mstts:express")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("ns:attr")).toBe(true);
      expect(ATTRIBUTE_NAME_PATTERN.test("_ns:_attr")).toBe(true);
    });

    it("無効な属性名パターンを拒否する", () => {
      // 数字から始まる
      expect(ATTRIBUTE_NAME_PATTERN.test("1attr")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test("123")).toBe(false);

      // 記号から始まる（アンダースコア以外）
      expect(ATTRIBUTE_NAME_PATTERN.test("-attr")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test("@attr")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test("#attr")).toBe(false);

      // 空文字・空白
      expect(ATTRIBUTE_NAME_PATTERN.test("")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test(" ")).toBe(false);

      // 無効な文字を含む
      expect(ATTRIBUTE_NAME_PATTERN.test("attr with space")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test("attr@invalid")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test("attr!")).toBe(false);

      // 無効な名前空間形式
      expect(ATTRIBUTE_NAME_PATTERN.test(":attr")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test("ns:")).toBe(false);
      expect(ATTRIBUTE_NAME_PATTERN.test("ns::attr")).toBe(false);
    });
  });

  describe("ATTRIBUTE_VALUE_PATTERN", () => {
    it("有効な属性値パターンを認識する", () => {
      // ダブルクオート付き
      expect(ATTRIBUTE_VALUE_PATTERN.test('"value"')).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test('""')).toBe(true); // 空文字
      expect(ATTRIBUTE_VALUE_PATTERN.test('"hello world"')).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test('"123"')).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test('"special-chars_123"')).toBe(true);

      // シングルクオート付き
      expect(ATTRIBUTE_VALUE_PATTERN.test("'value'")).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test("''")).toBe(true); // 空文字
      expect(ATTRIBUTE_VALUE_PATTERN.test("'hello world'")).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test("'123'")).toBe(true);

      // クオートなし
      expect(ATTRIBUTE_VALUE_PATTERN.test("value")).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test("123")).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test("value123")).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test("special-chars_123")).toBe(true);
      expect(ATTRIBUTE_VALUE_PATTERN.test("http://example.com")).toBe(true);
    });

    it("無効な属性値パターンを拒否する", () => {
      // 閉じられていないクオート
      expect(ATTRIBUTE_VALUE_PATTERN.test('"unclosed')).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test("'unclosed")).toBe(false);

      // 混合クオート
      expect(ATTRIBUTE_VALUE_PATTERN.test("\"mixed'")).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test("'\"mixed")).toBe(false);

      // 無効な文字を含む（クオートなしの場合）
      expect(ATTRIBUTE_VALUE_PATTERN.test("value with space")).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test('value"invalid')).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test("value'invalid")).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test("value=invalid")).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test("value<invalid")).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test("value>invalid")).toBe(false);
      expect(ATTRIBUTE_VALUE_PATTERN.test("value`invalid")).toBe(false);

      // 空文字（パターン的には空文字はマッチしない）
      expect(ATTRIBUTE_VALUE_PATTERN.test("")).toBe(false);
    });
  });
});
