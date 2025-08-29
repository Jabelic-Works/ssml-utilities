import { describe, it, expect } from "vitest";
import {
  SSMLTextExtractor,
  createSSMLExtractor,
  extractTextAdvanced,
  DEFAULT_EXTRACT_OPTIONS,
} from "./extractor";
import { DEFAULT_VALIDATION_OPTIONS } from "@ssml-utilities/core";

describe("SSMLTextExtractor", () => {
  describe("基本機能", () => {
    it("シンプルなSSMLタグを削除する", () => {
      const extractor = new SSMLTextExtractor();
      const result = extractor.extract("<speak>こんにちは、世界！</speak>");

      expect(result.text).toBe("こんにちは、世界！");
      expect(result.parseSuccess).toBe(true);
      expect(result.removedTags).toContain("speak");
      expect(result.preservedElements).toEqual([]);
    });

    it("無効なタグは保持する", () => {
      const extractor = new SSMLTextExtractor();
      const result = extractor.extract(
        "<speak>こんにちは</speak><custom>保持</custom>"
      );

      expect(result.text).toBe("こんにちは<custom>保持</custom>");
      expect(result.removedTags).toContain("speak");
      expect(result.removedTags).not.toContain("custom");
    });

    it("ネストしたSSMLタグを処理する", () => {
      const extractor = new SSMLTextExtractor();
      const ssml =
        '<speak><voice name="ja-JP">こんにちは<emphasis>世界</emphasis></voice></speak>';
      const result = extractor.extract(ssml);

      expect(result.text).toBe("こんにちは世界");
      expect(result.removedTags).toContain("speak");
      expect(result.removedTags).toContain("voice");
      expect(result.removedTags).toContain("emphasis");
    });
  });

  describe("詳細な結果情報", () => {
    it("ExtractResultに詳細な情報が含まれる", () => {
      const extractor = new SSMLTextExtractor();
      const ssml =
        '<speak><voice name="test">テスト</voice><custom>保持</custom></speak>';
      const result = extractor.extract(ssml);

      expect(result).toHaveProperty("text");
      expect(result).toHaveProperty("preservedElements");
      expect(result).toHaveProperty("removedTags");
      expect(result).toHaveProperty("processedNodes");
      expect(result).toHaveProperty("parseSuccess");

      expect(result.processedNodes).toBeGreaterThan(0);
      expect(result.parseSuccess).toBe(true);
    });

    it("削除されたSSMLタグを正確にトラッキングする", () => {
      const extractor = new SSMLTextExtractor();
      const ssml =
        '<speak><voice name="test">A</voice><prosody rate="slow">B</prosody></speak>';
      const result = extractor.extract(ssml);

      expect(result.removedTags).toContain("speak");
      expect(result.removedTags).toContain("voice");
      expect(result.removedTags).toContain("prosody");
      expect(result.removedTags.length).toBe(3);
    });

    it("保持された要素を正確にトラッキングする", () => {
      const extractor = new SSMLTextExtractor();
      const ssml =
        "<speak>A</speak><div>保持される</div><span>これも保持</span>";
      const result = extractor.extract(ssml);

      expect(result.text).toBe("A<div>保持される</div><span>これも保持</span>");
      expect(result.preservedElements.length).toBeGreaterThan(0);
    });
  });

  describe("カスタムSSMLタグサポート", () => {
    it("カスタムSSMLタグを追加できる", () => {
      const extractor = new SSMLTextExtractor({
        customSSMLTags: ["custom-ssml"],
      });

      const result = extractor.extract(
        "<speak>A</speak><custom-ssml>削除</custom-ssml><other>保持</other>"
      );

      expect(result.text).toBe("A削除<other>保持</other>");
      expect(result.removedTags).toContain("custom-ssml");
      expect(result.removedTags).not.toContain("other");
    });

    it("動的にSSMLタグを更新できる", () => {
      const extractor = new SSMLTextExtractor();

      // 初期状態
      let result = extractor.extract("<dynamic>初期は保持</dynamic>");
      expect(result.text).toBe("<dynamic>初期は保持</dynamic>");

      // タグを追加
      extractor.updateSSMLTags(["dynamic"]);
      result = extractor.extract("<dynamic>今度は削除</dynamic>");
      expect(result.text).toBe("今度は削除");
      expect(result.removedTags).toContain("dynamic");
    });

    it("SSMLタグ一覧を取得できる", () => {
      const extractor = new SSMLTextExtractor({
        customSSMLTags: ["test1", "test2"],
      });

      const tags = extractor.getSSMLTags();
      expect(tags).toContain("speak");
      expect(tags).toContain("test1");
      expect(tags).toContain("test2");
    });
  });

  describe("オプション設定", () => {
    it("改行を削除するオプション", () => {
      const extractor = new SSMLTextExtractor();
      const ssml = "<speak>こんにちは\n世界</speak>";
      const result = extractor.extract(ssml, { preserveNewlines: false });

      expect(result.text).toBe("こんにちは 世界");
    });

    it("空白の正規化を無効にする", () => {
      const extractor = new SSMLTextExtractor();
      const ssml = "<speak>こんにちは    世界</speak>";
      const result = extractor.extract(ssml, { normalizeSpaces: false });

      expect(result.text).toBe("こんにちは    世界");
    });

    it("トリムを無効にする", () => {
      const extractor = new SSMLTextExtractor();
      const ssml = "<speak>  こんにちは  </speak>";
      const result = extractor.extract(ssml, {
        trim: false,
        normalizeSpaces: false,
      });

      expect(result.text).toBe("  こんにちは  ");
    });
  });

  describe("複雑なSSML構造", () => {
    it("Microsoft SSML拡張タグを処理する", () => {
      const extractor = new SSMLTextExtractor();
      const ssml =
        '<speak><mstts:express-as style="cheerful">嬉しい</mstts:express-as></speak>';
      const result = extractor.extract(ssml);

      expect(result.text).toBe("嬉しい");
      expect(result.removedTags).toContain("mstts:express-as");
    });

    it("自己完結タグを処理する", () => {
      const extractor = new SSMLTextExtractor();
      const ssml = 'こんにちは<break time="1s"/>世界';
      const result = extractor.extract(ssml);

      expect(result.text).toBe("こんにちは世界");
      expect(result.removedTags).toContain("break");
    });

    it("混在したタグ構造を正しく処理する", () => {
      const extractor = new SSMLTextExtractor();
      const ssml = `
        <speak>
          <div class="content">
            <voice name="test">SSML音声</voice>
            <custom-tag>保持される</custom-tag>
            <p>これも保持<emphasis>削除対象</emphasis></p>
          </div>
        </speak>
      `;

      const result = extractor.extract(ssml, { normalizeSpaces: true });

      expect(result.text).toContain("SSML音声");
      expect(result.text).toContain("保持される");
      expect(result.text).toContain("これも保持削除対象");
      expect(result.text).toContain("<div");
      expect(result.text).toContain("<custom-tag>");

      expect(result.removedTags).toContain("speak");
      expect(result.removedTags).toContain("voice");
      expect(result.removedTags).toContain("emphasis");
      expect(result.removedTags).not.toContain("div");
      expect(result.removedTags).not.toContain("custom-tag");
    });
  });

  describe("エラーハンドリング", () => {
    it("無効なSSMLでもフォールバック処理で継続する", () => {
      const extractor = new SSMLTextExtractor();
      const invalidSSML = "<speak>未閉じタグ<voice>テスト</speak>";
      const result = extractor.extract(invalidSSML);

      // DAGパーサーは堅牢で、多くの場合パースが成功する
      // パース成功時もフォールバック処理を想定した結果となる
      expect(result.parseSuccess).toBe(true);
      expect(result.text).toBeDefined();
      expect(result.text).toContain("テスト");
    });

    it("空文字列を適切に処理する", () => {
      const extractor = new SSMLTextExtractor();
      const result = extractor.extract("");

      expect(result.text).toBe("");
      expect(result.removedTags).toEqual([]);
      expect(result.preservedElements).toEqual([]);
    });

    it("null/undefinedを適切に処理する", () => {
      const extractor = new SSMLTextExtractor();
      const result1 = extractor.extract(null as any);
      const result2 = extractor.extract(undefined as any);

      expect(result1.text).toBe("");
      expect(result2.text).toBe("");
    });
  });

  describe("デバッグ機能", () => {
    it("デバッグ情報を取得できる", () => {
      const extractor = new SSMLTextExtractor();
      const debug = extractor.debugParse("<speak>テスト</speak>");

      expect(debug).toBeDefined();
      expect(typeof debug).toBe("string");
    });

    it("パースエラー時のデバッグ情報", () => {
      const extractor = new SSMLTextExtractor();
      const debug = extractor.debugParse("<speak>未閉じ");

      // DAGパーサーは堅牢で、多くの場合パースが成功する
      // デバッグ情報としてノード構造が返される
      expect(debug).toBeDefined();
      expect(typeof debug).toBe("string");
      expect(debug).toContain("Node");
    });
  });
});

describe("ファクトリー関数とユーティリティ", () => {
  it("createSSMLExtractor が正しく動作する", () => {
    const extractor = createSSMLExtractor(["custom1", "custom2"]);

    const tags = extractor.getSSMLTags();
    expect(tags).toContain("custom1");
    expect(tags).toContain("custom2");
    expect(tags).toContain("speak");
  });

  it("extractTextAdvanced が正しく動作する", () => {
    const result = extractTextAdvanced(
      "<speak>テスト</speak><custom>保持</custom>",
      {
        normalizeSpaces: true,
      }
    );

    expect(result.text).toBe("テスト<custom>保持</custom>");
    expect(result.removedTags).toContain("speak");
  });
});

describe("DEFAULT_EXTRACT_OPTIONS", () => {
  it("デフォルトオプションが正しく設定されている", () => {
    expect(DEFAULT_EXTRACT_OPTIONS).toEqual({
      preserveNewlines: true,
      normalizeSpaces: true,
      trim: true,
      validationOptions: DEFAULT_VALIDATION_OPTIONS,
      customSSMLTags: [],
    });
  });
});

describe("パフォーマンステスト", () => {
  it("大きなSSMLドキュメントを処理できる", () => {
    const extractor = new SSMLTextExtractor();

    // 大きなSSMLドキュメントを生成
    let largeSSML = "<speak>";
    for (let i = 0; i < 100; i++) {
      largeSSML += `<voice name="test${i}">テキスト${i}</voice>`;
      largeSSML += `<custom${i}>保持${i}</custom${i}>`;
    }
    largeSSML += "</speak>";

    const startTime = Date.now();
    const result = extractor.extract(largeSSML);
    const endTime = Date.now();

    expect(result.text).toBeDefined();
    expect(result.processedNodes).toBeGreaterThan(100);
    expect(endTime - startTime).toBeLessThan(1000); // 1秒以内
  });
});
