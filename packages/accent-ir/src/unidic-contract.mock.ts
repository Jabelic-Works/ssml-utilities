import type { UniDicRawToken } from "./unidic-contract";

// Mock tokens for contract design and tests only.
// These are illustrative fixtures, not the output of a real UniDic runtime.
export const mockUniDicRawTokens = [
  {
    surface: "箸",
    lemma: "箸",
    orthBase: "箸",
    reading: "ハシ",
    pronunciation: "ハシ",
    partOfSpeech: {
      level1: "名詞",
      level2: "普通名詞",
      level3: "一般",
    },
    inflection: {
      type: "*",
      form: "*",
    },
    accent: {
      accentType: "1",
      accentConnectionType: "C3",
      accentModificationType: "*",
    },
    source: {
      dictionary: "unidic",
      rawFeatures: ["名詞", "普通名詞", "一般", "*", "*", "*"],
    },
  },
  {
    surface: "を",
    lemma: "を",
    orthBase: "を",
    reading: "ヲ",
    pronunciation: "オ",
    partOfSpeech: {
      level1: "助詞",
      level2: "格助詞",
    },
    inflection: {
      type: "*",
      form: "*",
    },
    source: {
      dictionary: "unidic",
      rawFeatures: ["助詞", "格助詞", "*", "*", "*", "*"],
    },
  },
  {
    surface: "持つ",
    lemma: "持つ",
    orthBase: "持つ",
    reading: "モツ",
    pronunciation: "モツ",
    partOfSpeech: {
      level1: "動詞",
      level2: "一般",
    },
    inflection: {
      type: "五段-タ行",
      form: "終止形-一般",
    },
    accent: {
      accentType: "1",
      accentConnectionType: "C1",
      accentModificationType: "*",
    },
    source: {
      dictionary: "unidic",
      rawFeatures: ["動詞", "一般", "*", "*", "五段-タ行", "終止形-一般"],
    },
  },
] as const satisfies readonly UniDicRawToken[];
