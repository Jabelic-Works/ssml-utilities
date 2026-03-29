import { describe, expect, it } from "vitest";
import { adaptUniDicTokensToAccentIR } from "../unidic-adapter";
import type { UniDicRawToken } from "../unidic-contract";

describe("UniDic adapter", () => {
  it("名詞 token を AccentIR の text segment に変換する", () => {
    const tokens: UniDicRawToken[] = [
      {
        surface: "箸",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "1",
        },
      },
    ];

    const result = adaptUniDicTokensToAccentIR({ tokens });

    expect(result.warnings).toEqual([]);
    expect(result.accentIR).toEqual({
      locale: "ja-JP",
      segments: [
        {
          type: "text",
          text: "箸",
          reading: "はし",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハ'シ",
            },
          },
        },
      ],
    });
  });

  it("固有名詞 token も MVP 範囲として扱う", () => {
    const tokens: UniDicRawToken[] = [
      {
        surface: "東京",
        reading: "トウキョウ",
        pronunciation: "トーキョー",
        partOfSpeech: {
          level1: "名詞",
          level2: "固有名詞",
          level3: "地名",
        },
        accent: {
          accentType: "0",
        },
      },
    ];

    const result = adaptUniDicTokensToAccentIR({ tokens });

    expect(result.warnings).toEqual([]);
    expect(result.accentIR.segments).toEqual([
      {
        type: "text",
        text: "東京",
        reading: "とうきょう",
        accent: { downstep: null },
        hints: {
          azurePhoneme: {
            alphabet: "sapi",
            value: "トーキョー+",
          },
        },
      },
    ]);
  });

  it("助詞を前の text segment に連結する", () => {
    const tokens: UniDicRawToken[] = [
      {
        surface: "箸",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "1",
        },
      },
      {
        surface: "を",
        reading: "ヲ",
        pronunciation: "オ",
        partOfSpeech: {
          level1: "助詞",
          level2: "格助詞",
        },
      },
      {
        surface: "持つ",
        reading: "モツ",
        pronunciation: "モツ",
        partOfSpeech: {
          level1: "動詞",
          level2: "一般",
        },
        accent: {
          accentType: "1",
        },
      },
    ];

    const result = adaptUniDicTokensToAccentIR({ tokens });

    expect(result.accentIR.segments).toEqual([
      {
        type: "text",
        text: "箸を",
        reading: "はしを",
        accent: { downstep: 1 },
        hints: {
          azurePhoneme: {
            alphabet: "sapi",
            value: "ハ'シオ",
          },
        },
      },
      {
        type: "text",
        text: "持つ",
        reading: "もつ",
        accent: { downstep: 1 },
        hints: {
          azurePhoneme: {
            alphabet: "sapi",
            value: "モ'ツ",
          },
        },
      },
    ]);
  });

  it("文末の句点を break segment に変換する", () => {
    const tokens: UniDicRawToken[] = [
      {
        surface: "持つ",
        reading: "モツ",
        pronunciation: "モツ",
        partOfSpeech: {
          level1: "動詞",
          level2: "一般",
        },
        accent: {
          accentType: "1",
        },
      },
      {
        surface: "。",
        partOfSpeech: {
          level1: "補助記号",
          level2: "句点",
        },
      },
    ];

    const result = adaptUniDicTokensToAccentIR({ tokens });

    expect(result.accentIR.segments).toEqual([
      {
        type: "text",
        text: "持つ",
        reading: "もつ",
        accent: { downstep: 1 },
        hints: {
          azurePhoneme: {
            alphabet: "sapi",
            value: "モ'ツ",
          },
        },
      },
      {
        type: "break",
        strength: "strong",
      },
    ]);
  });
});
