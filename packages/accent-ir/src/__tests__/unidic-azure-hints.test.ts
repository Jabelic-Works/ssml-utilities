import { describe, expect, it } from "vitest";
import {
  buildAzurePhonemeHintFromUniDicToken,
  buildAzurePhonemeHintFromUniDicTokens,
} from "../index";
import type { UniDicRawToken } from "../unidic-contract";

describe("UniDic Azure hints", () => {
  it("accentType 付き token から sapi hint を組み立てる", () => {
    const token: UniDicRawToken = {
      surface: "箸",
      reading: "ハシ",
      pronunciation: "ハシ",
      partOfSpeech: {
        level1: "名詞",
        level2: "普通名詞",
      },
      accent: {
        accentType: "1",
      },
    };

    expect(buildAzurePhonemeHintFromUniDicToken(token)).toEqual({
      alphabet: "sapi",
      value: "ハ'シ",
    });
  });

  it("accentType 0 は heiban marker を末尾に付ける", () => {
    const token: UniDicRawToken = {
      surface: "端",
      reading: "ハシ",
      pronunciation: "ハシ",
      partOfSpeech: {
        level1: "名詞",
        level2: "普通名詞",
      },
      accent: {
        accentType: "0",
      },
    };

    expect(buildAzurePhonemeHintFromUniDicToken(token)).toEqual({
      alphabet: "sapi",
      value: "ハシ+",
    });
  });

  it("token 列から連結済み sapi hint を組み立てる", () => {
    const tokens: UniDicRawToken[] = [
      {
        surface: "箸",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
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
    ];

    expect(buildAzurePhonemeHintFromUniDicTokens(tokens)).toEqual({
      alphabet: "sapi",
      value: "ハ'シオ",
    });
  });
});
