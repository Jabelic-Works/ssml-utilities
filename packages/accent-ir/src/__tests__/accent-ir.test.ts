import { describe, expect, it } from "vitest";
import {
  buildGoogleYomigana,
  emitAzureSSML,
  emitGoogleSSML,
  splitKanaIntoMoras,
  type AccentIR,
} from "../index";

describe("AccentIR emitters", () => {
  describe("splitKanaIntoMoras", () => {
    it("拗音と長音を mora 単位で分割する", () => {
      expect(splitKanaIntoMoras("きょう")).toEqual(["きょ", "う"]);
      expect(splitKanaIntoMoras("スーパー")).toEqual(["スー", "パー"]);
    });
  });

  describe("buildGoogleYomigana", () => {
    it("Google TTS の yomigana 記法を生成する", () => {
      expect(buildGoogleYomigana("はし")).toBe("^はし");
      expect(buildGoogleYomigana("はし", { downstep: 1 })).toBe("^は!し");
      expect(buildGoogleYomigana("はし", { downstep: 2 })).toBe("^はし!");
    });

    it("不正な downstep を拒否する", () => {
      expect(() => buildGoogleYomigana("はし", { downstep: 3 })).toThrow(
        "downstep must be between 1 and 2"
      );
    });
  });

  describe("emitGoogleSSML", () => {
    it("AccentIR から Google SSML を生成する", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "箸",
            reading: "はし",
            accent: { downstep: 1 },
          },
          {
            type: "break",
            time: "250ms",
          },
          {
            type: "text",
            text: "橋",
            reading: "はし",
            accent: { downstep: 2 },
            emphasis: "strong",
          },
        ],
      };

      const result = emitGoogleSSML(accentIR, {
        voice: "ja-JP-Standard-A",
      });

      expect(result.warnings).toEqual([]);
      expect(result.ssml).toBe(
        '<speak xml:lang="ja-JP"><voice name="ja-JP-Standard-A"><phoneme alphabet="yomigana" ph="^は!し">箸</phoneme><break time="250ms"/><emphasis level="strong"><phoneme alphabet="yomigana" ph="^はし!">橋</phoneme></emphasis></voice></speak>'
      );
    });

    it("reading が無い accent 指定は warning に落とす", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "箸",
            accent: { downstep: 1 },
          },
        ],
      };

      const result = emitGoogleSSML(accentIR);

      expect(result.ssml).toBe('<speak xml:lang="ja-JP">箸</speak>');
      expect(result.warnings).toEqual([
        {
          code: "MISSING_READING",
          message:
            "Google SSML でアクセントを表現するには reading か googleYomigana hint が必要です。",
          segmentIndex: 0,
        },
      ]);
    });
  });

  describe("emitAzureSSML", () => {
    it("reading を sub alias にフォールバックして Azure SSML を生成する", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "箸",
            reading: "はし",
            accent: { downstep: 1 },
          },
        ],
      };

      const result = emitAzureSSML(accentIR, {
        voice: "ja-JP-NanamiNeural",
      });

      expect(result.ssml).toBe(
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><sub alias="はし">箸</sub></voice></speak>'
      );
      expect(result.warnings).toEqual([
        {
          code: "AZURE_FALLBACK_TO_SUB_ALIAS",
          message:
            "Azure SSML は azurePhoneme hint が無いため、sub alias にフォールバックしました。",
          segmentIndex: 0,
        },
      ]);
    });

    it("azurePhoneme hint があれば phoneme で出力する", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "箸",
            hints: {
              azurePhoneme: {
                alphabet: "sapi",
                value: "ハ'シ",
              },
            },
          },
        ],
      };

      const result = emitAzureSSML(accentIR);

      expect(result.warnings).toEqual([]);
      expect(result.ssml).toBe(
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><phoneme alphabet="sapi" ph="ハ\'シ">箸</phoneme></speak>'
      );
    });

    it("azureSubAlias hint があれば sub alias で出力する", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "9時",
            hints: {
              azureSubAlias: "くじ",
            },
          },
        ],
      };

      const result = emitAzureSSML(accentIR);

      expect(result.warnings).toEqual([]);
      expect(result.ssml).toBe(
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><sub alias="くじ">9時</sub></speak>'
      );
    });

    it("reading があるが hint が無い場合は sub alias warning を返す", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "東京",
            reading: "とうきょう",
          },
        ],
      };

      const result = emitAzureSSML(accentIR);

      expect(result.ssml).toBe(
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><sub alias="とうきょう">東京</sub></speak>'
      );
      expect(result.warnings).toEqual([
        {
          code: "AZURE_FALLBACK_TO_SUB_ALIAS",
          message:
            "Azure SSML は azurePhoneme hint が無いため、sub alias にフォールバックしました。",
          segmentIndex: 0,
        },
      ]);
    });

    it("accent だけがある場合は plain text warning を返す", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "箸",
            accent: { downstep: 1 },
          },
        ],
      };

      const result = emitAzureSSML(accentIR);

      expect(result.ssml).toBe(
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">箸</speak>'
      );
      expect(result.warnings).toEqual([
        {
          code: "AZURE_FALLBACK_TO_PLAIN_TEXT",
          message:
            "Azure SSML は azurePhoneme hint と reading の両方が無いため、plain text にフォールバックしました。",
          segmentIndex: 0,
        },
      ]);
    });

    it("plainText fallback を指定した場合は reading があっても plain text を優先する", () => {
      const accentIR: AccentIR = {
        segments: [
          {
            type: "text",
            text: "東京",
            reading: "とうきょう",
          },
        ],
      };

      const result = emitAzureSSML(accentIR, {
        azureReadingFallback: "plainText",
      });

      expect(result.ssml).toBe(
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP">東京</speak>'
      );
      expect(result.warnings).toEqual([]);
    });
  });
});
