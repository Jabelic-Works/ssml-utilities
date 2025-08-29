import { describe, it, expect } from "vitest";
import {
  removeSSMLTags,
  removeSpecificTags,
  extractTextFromTag,
  isValidSSMLStructure,
  DEFAULT_REMOVAL_OPTIONS,
} from "./index";
import { DEFAULT_VALIDATION_OPTIONS } from "@ssml-utilities/core";

describe("removeSSMLTags", () => {
  it("基本的なSSMLタグを削除する", () => {
    const ssml = "<speak>こんにちは、世界！</speak>";
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは、世界！");
  });

  it("複数のタグを削除する", () => {
    const ssml =
      '<speak><voice name="ja-JP-NanamiNeural">こんにちは</voice><break time="500ms"/>さようなら</speak>';
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちはさようなら");
  });

  it("属性付きタグを削除する", () => {
    const ssml =
      '<prosody rate="slow" pitch="high">ゆっくりと高い声で</prosody>';
    const result = removeSSMLTags(ssml);
    expect(result).toBe("ゆっくりと高い声で");
  });

  it("自己完結タグを削除する", () => {
    const ssml = 'こんにちは<break time="1s"/>世界';
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは世界");
  });

  it("XMLコメントを削除する", () => {
    const ssml = "<speak><!-- これはコメント -->こんにちは</speak>";
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは");
  });

  it("CDATAセクションの内容を保持する", () => {
    const ssml = '<speak><![CDATA[<script>alert("test")</script>]]></speak>';
    const result = removeSSMLTags(ssml);
    expect(result).toBe('<script>alert("test")</script>');
  });

  it("処理命令を削除する", () => {
    const ssml = '<?xml version="1.0"?><speak>こんにちは</speak>';
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは");
  });

  it("複数の空白を正規化する", () => {
    const ssml = "<speak>こんにちは    世界</speak>";
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは 世界");
  });

  it("改行を保持する（デフォルト）", () => {
    const ssml = "<speak>こんにちは\n世界</speak>";
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは\n世界");
  });

  it("改行を削除するオプション", () => {
    const ssml = "<speak>こんにちは\n世界</speak>";
    const result = removeSSMLTags(ssml, { preserveNewlines: false });
    expect(result).toBe("こんにちは 世界");
  });

  it("空白の正規化を無効にする", () => {
    const ssml = "<speak>こんにちは    世界</speak>";
    const result = removeSSMLTags(ssml, { normalizeSpaces: false });
    expect(result).toBe("こんにちは    世界");
  });

  it("トリムを無効にする", () => {
    const ssml = "<speak>  こんにちは  </speak>";
    const result = removeSSMLTags(ssml, {
      trim: false,
      normalizeSpaces: false,
    });
    expect(result).toBe("  こんにちは  ");
  });

  it("空文字列を処理する", () => {
    const result = removeSSMLTags("");
    expect(result).toBe("");
  });

  it("null/undefinedを処理する", () => {
    const result1 = removeSSMLTags(null as any);
    const result2 = removeSSMLTags(undefined as any);
    expect(result1).toBe("");
    expect(result2).toBe("");
  });

  it("タグのないテキストをそのまま返す", () => {
    const text = "これはプレーンテキストです";
    const result = removeSSMLTags(text);
    expect(result).toBe(text);
  });

  it("無効なタグは削除せずそのまま保持する", () => {
    const ssml = "<speak>こんにちは</speak><hoge>無効なタグ</hoge>世界";
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは<hoge>無効なタグ</hoge>世界");
  });

  it("HTMLタグは削除せずそのまま保持する", () => {
    const ssml =
      "<speak>こんにちは</speak><div>HTMLタグ</div><span>スパン</span>";
    const result = removeSSMLTags(ssml);
    expect(result).toBe("こんにちは<div>HTMLタグ</div><span>スパン</span>");
  });

  it("有効なSSMLタグと無効なタグが混在している場合", () => {
    const ssml =
      '<speak><voice name="test">有効</voice><custom>無効</custom></speak>';
    const result = removeSSMLTags(ssml);
    expect(result).toBe("有効<custom>無効</custom>");
  });
});

describe("removeSpecificTags", () => {
  it("指定したタグのみを削除する", () => {
    const ssml =
      '<speak><voice name="test">こんにちは</voice><prosody rate="slow">世界</prosody></speak>';
    const result = removeSpecificTags(ssml, ["voice"]);
    expect(result).toBe(
      '<speak>こんにちは<prosody rate="slow">世界</prosody></speak>'
    );
  });

  it("複数のタグを指定して削除する", () => {
    const ssml =
      '<speak><voice name="test">こんにちは</voice><prosody rate="slow">世界</prosody><break/></speak>';
    const result = removeSpecificTags(ssml, ["voice", "break"]);
    expect(result).toBe(
      '<speak>こんにちは<prosody rate="slow">世界</prosody></speak>'
    );
  });

  it("自己完結タグを削除する", () => {
    const ssml = 'こんにちは<break time="1s"/>世界<pause time="500ms"/>！';
    const result = removeSpecificTags(ssml, ["break"]);
    expect(result).toBe('こんにちは世界<pause time="500ms"/>！');
  });

  it("存在しないタグを指定しても安全", () => {
    const ssml = "<speak>こんにちは</speak>";
    const result = removeSpecificTags(ssml, ["notexist"]);
    expect(result).toBe(ssml);
  });

  it("空のタグ配列で何も削除しない", () => {
    const ssml = "<speak>こんにちは</speak>";
    const result = removeSpecificTags(ssml, []);
    expect(result).toBe(ssml);
  });

  it("特殊文字を含むタグ名を正しく処理する", () => {
    const ssml =
      '<speak><mstts:express-as style="cheerful">テスト</mstts:express-as></speak>';
    const result = removeSpecificTags(ssml, ["mstts:express-as"]);
    expect(result).toBe("<speak>テスト</speak>");
  });

  it("無効なタグ名を指定しても安全（無効なタグ名は無視される）", () => {
    const ssml = "<speak>こんにちは</speak><custom>テスト</custom>";
    const result = removeSpecificTags(ssml, ["custom", "voice"]);
    expect(result).toBe("<speak>こんにちは</speak><custom>テスト</custom>");
  });

  it("有効なタグと無効なタグ名を混在して指定", () => {
    const ssml =
      '<speak><voice name="test">こんにちは</voice><custom>テスト</custom></speak>';
    const result = removeSpecificTags(ssml, ["voice", "custom", "invalid"]);
    expect(result).toBe("<speak>こんにちは<custom>テスト</custom></speak>");
  });
});

describe("extractTextFromTag", () => {
  it("指定したタグ内のテキストを抽出する", () => {
    const ssml = '<speak><voice name="test">こんにちは</voice>世界</speak>';
    const result = extractTextFromTag(ssml, "voice");
    expect(result).toEqual(["こんにちは"]);
  });

  it("複数の同じタグからテキストを抽出する", () => {
    const ssml =
      '<speak><voice name="a">第一</voice>と<voice name="b">第二</voice></speak>';
    const result = extractTextFromTag(ssml, "voice");
    expect(result).toEqual(["第一", "第二"]);
  });

  it("ネストしたタグを含むテキストを抽出する", () => {
    const ssml =
      '<speak><voice name="test">こんにちは<break/>世界</voice></speak>';
    const result = extractTextFromTag(ssml, "voice");
    expect(result).toEqual(["こんにちは世界"]);
  });

  it("存在しないタグで空配列を返す", () => {
    const ssml = "<speak>こんにちは</speak>";
    const result = extractTextFromTag(ssml, "voice");
    expect(result).toEqual([]);
  });

  it("空のタグ内容をスキップする", () => {
    const ssml =
      '<speak><voice name="test"></voice><voice name="test2">内容あり</voice></speak>';
    const result = extractTextFromTag(ssml, "voice");
    expect(result).toEqual(["内容あり"]);
  });

  it("無効なタグ名を指定した場合は空配列を返す", () => {
    const ssml = "<speak><custom>テスト</custom></speak>";
    const result = extractTextFromTag(ssml, "custom");
    expect(result).toEqual([]);
  });

  it("無効なタグは抽出対象外", () => {
    const ssml =
      '<speak><voice name="test">有効</voice></speak><voice>属性なしでも有効</voice>';
    const result = extractTextFromTag(ssml, "voice");
    expect(result).toEqual(["有効", "属性なしでも有効"]);
  });
});

describe("isValidSSMLStructure", () => {
  it("有効なSSML構造を検証する", () => {
    const ssml = '<speak><voice name="test">こんにちは</voice></speak>';
    expect(isValidSSMLStructure(ssml)).toBe(true);
  });

  it("自己完結タグを含む有効な構造", () => {
    const ssml = '<speak>こんにちは<break time="1s"/>世界</speak>';
    expect(isValidSSMLStructure(ssml)).toBe(true);
  });

  it("ネストしたタグの有効な構造", () => {
    const ssml =
      '<speak><voice name="test"><prosody rate="slow">ゆっくり</prosody></voice></speak>';
    expect(isValidSSMLStructure(ssml)).toBe(true);
  });

  it("タグが閉じられていない無効な構造", () => {
    const ssml = '<speak><voice name="test">こんにちは</speak>';
    expect(isValidSSMLStructure(ssml)).toBe(false);
  });

  it("余分な終了タグがある無効な構造", () => {
    const ssml = "<speak>こんにちは</voice></speak>";
    expect(isValidSSMLStructure(ssml)).toBe(false);
  });

  it("タグの順序が間違っている無効な構造", () => {
    const ssml =
      '<speak><voice name="test"><prosody rate="slow">テスト</voice></prosody></speak>';
    expect(isValidSSMLStructure(ssml)).toBe(false);
  });

  it("空文字列は無効", () => {
    expect(isValidSSMLStructure("")).toBe(false);
  });

  it("null/undefinedは無効", () => {
    expect(isValidSSMLStructure(null as any)).toBe(false);
    expect(isValidSSMLStructure(undefined as any)).toBe(false);
  });

  it("タグのないテキストは有効", () => {
    expect(isValidSSMLStructure("これはプレーンテキストです")).toBe(true);
  });

  it("無効なタグが含まれていても有効なSSMLタグの構造をチェック", () => {
    const ssml = "<speak>こんにちは</speak><custom>無効なタグ</invalid>";
    expect(isValidSSMLStructure(ssml)).toBe(true);
  });

  it("有効なSSMLタグの中に無効なタグがある場合", () => {
    const ssml = "<speak><custom>無効なタグ</custom>こんにちは</speak>";
    expect(isValidSSMLStructure(ssml)).toBe(true);
  });

  it("有効なSSMLタグが不正な構造の場合", () => {
    const ssml =
      '<speak><voice name="test">こんにちは</speak></voice><custom>無効</custom>';
    expect(isValidSSMLStructure(ssml)).toBe(false);
  });
});

describe("DEFAULT_REMOVAL_OPTIONS", () => {
  it("デフォルトオプションが正しく設定されている", () => {
    expect(DEFAULT_REMOVAL_OPTIONS).toEqual({
      preserveNewlines: true,
      normalizeSpaces: true,
      trim: true,
      validationOptions: DEFAULT_VALIDATION_OPTIONS,
    });
  });
});
