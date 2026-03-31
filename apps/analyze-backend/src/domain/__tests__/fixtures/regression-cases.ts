import type { UniDicPartOfSpeech, UniDicRawToken } from "@ssml-utilities/accent-ir";

export interface ComparableToken {
  surface: string;
  reading?: string;
  pronunciation?: string;
  lemma?: string;
  partOfSpeech: UniDicPartOfSpeech;
  accentType?: string;
  azurePhoneme?: string;
  azureSubAlias?: string;
}

export interface AnalyzeRegressionCase {
  id: string;
  description: string;
  rawTokens: readonly UniDicRawToken[];
  expectedOverrideTokens: readonly ComparableToken[];
  expectedAzureSSMLBody: string;
}

const NOUN_GENERAL = {
  level1: "名詞",
  level2: "普通名詞",
  level3: "一般",
} as const satisfies UniDicPartOfSpeech;

const NOUN_SAHEN = {
  level1: "名詞",
  level2: "普通名詞",
  level3: "サ変可能",
} as const satisfies UniDicPartOfSpeech;

const NOUN_NUMERIC = {
  level1: "名詞",
  level2: "数詞",
} as const satisfies UniDicPartOfSpeech;

const NOUN_COUNTER = {
  level1: "名詞",
  level2: "普通名詞",
  level3: "助数詞可能",
} as const satisfies UniDicPartOfSpeech;

const INTERJECTION = {
  level1: "感動詞",
  level2: "一般",
} as const satisfies UniDicPartOfSpeech;

const VERB_GENERAL = {
  level1: "動詞",
  level2: "一般",
} as const satisfies UniDicPartOfSpeech;

const AUXILIARY = {
  level1: "助動詞",
} as const satisfies UniDicPartOfSpeech;

const PARTICLE_CASE = {
  level1: "助詞",
  level2: "格助詞",
} as const satisfies UniDicPartOfSpeech;

const SYMBOL_GENERAL = {
  level1: "補助記号",
  level2: "一般",
} as const satisfies UniDicPartOfSpeech;

const phoneme = (text: string, value: string): string =>
  `<phoneme alphabet="sapi" ph="${value}">${text}</phoneme>`;

const rawToken = (input: {
  surface: string;
  reading?: string;
  pronunciation?: string;
  lemma?: string;
  partOfSpeech: UniDicPartOfSpeech;
  accentType?: string;
}): UniDicRawToken => ({
  surface: input.surface,
  ...(input.reading ? { reading: input.reading } : {}),
  ...(input.pronunciation ? { pronunciation: input.pronunciation } : {}),
  ...(input.lemma ? { lemma: input.lemma } : {}),
  partOfSpeech: input.partOfSpeech,
  ...(input.accentType ? { accent: { accentType: input.accentType } } : {}),
});

export const toComparableToken = (token: UniDicRawToken): ComparableToken => ({
  surface: token.surface,
  ...(token.reading ? { reading: token.reading } : {}),
  ...(token.pronunciation ? { pronunciation: token.pronunciation } : {}),
  ...(token.lemma ? { lemma: token.lemma } : {}),
  partOfSpeech: token.partOfSpeech,
  ...(token.accent?.accentType ? { accentType: token.accent.accentType } : {}),
  ...(token.ttsHints?.azurePhoneme?.value
    ? { azurePhoneme: token.ttsHints.azurePhoneme.value }
    : {}),
  ...(token.ttsHints?.azureSubAlias
    ? { azureSubAlias: token.ttsHints.azureSubAlias }
    : {}),
});

export const regressionCases: readonly AnalyzeRegressionCase[] = [
  {
    id: "lexicon-hatsuon",
    description: "lexicon: 発音の pronunciation を補正する",
    rawTokens: [
      rawToken({
        surface: "発音",
        reading: "ハツオン",
        pronunciation: "ハツオン",
        partOfSpeech: NOUN_GENERAL,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "発音",
        reading: "ハツオン",
        pronunciation: "ハツ+オン+",
        partOfSpeech: NOUN_GENERAL,
        azurePhoneme: "ハツ+オン+",
      },
    ],
    expectedAzureSSMLBody: phoneme("発音", "ハツ+オン+"),
  },
  {
    id: "lexicon-moshi",
    description: "lexicon: 模試の pronunciation を補正する",
    rawTokens: [
      rawToken({
        surface: "模試",
        reading: "モシ",
        pronunciation: "モシ",
        partOfSpeech: NOUN_GENERAL,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "模試",
        reading: "モシ",
        pronunciation: "モシ+",
        partOfSpeech: NOUN_GENERAL,
        azurePhoneme: "モシ+",
      },
    ],
    expectedAzureSSMLBody: phoneme("模試", "モシ+"),
  },
  {
    id: "lexicon-yokuyo",
    description: "lexicon: 抑揚の pronunciation を補正する",
    rawTokens: [
      rawToken({
        surface: "抑揚",
        reading: "ヨクヨウ",
        pronunciation: "ヨクヨウ",
        partOfSpeech: NOUN_GENERAL,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "抑揚",
        reading: "ヨクヨウ",
        pronunciation: "ヨクヨ+ウ",
        partOfSpeech: NOUN_GENERAL,
        azurePhoneme: "ヨクヨ+ウ",
      },
    ],
    expectedAzureSSMLBody: phoneme("抑揚", "ヨクヨ+ウ"),
  },
  {
    id: "phrase-ohayo-gozaimasu",
    description: "phrase: おはようございます を 1 発話単位に束ねる",
    rawTokens: [
      rawToken({
        surface: "おはよう",
        reading: "オハヨウ",
        pronunciation: "オハヨー",
        partOfSpeech: INTERJECTION,
      }),
      rawToken({
        surface: "ござい",
        reading: "ゴザイ",
        pronunciation: "ゴザイ",
        partOfSpeech: VERB_GENERAL,
      }),
      rawToken({
        surface: "ます",
        reading: "マス",
        pronunciation: "マス",
        partOfSpeech: AUXILIARY,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "おはようございます",
        reading: "おはようございます",
        pronunciation: "オハヨーゴザイマス",
        partOfSpeech: INTERJECTION,
      },
    ],
    expectedAzureSSMLBody: "おはようございます",
  },
  {
    id: "phrase-sahen-shuryo-shimasu",
    description: "phrase: サ変名詞 + します を 1 発話単位に束ねる",
    rawTokens: [
      rawToken({
        surface: "終了",
        reading: "シュウリョウ",
        pronunciation: "シューリョー",
        partOfSpeech: NOUN_SAHEN,
      }),
      rawToken({
        surface: "し",
        reading: "シ",
        pronunciation: "シ",
        lemma: "為る",
        partOfSpeech: VERB_GENERAL,
      }),
      rawToken({
        surface: "ます",
        reading: "マス",
        pronunciation: "マス",
        partOfSpeech: AUXILIARY,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "終了します",
        reading: "シュウリョウシマス",
        pronunciation: "シューリョーシマス",
        partOfSpeech: VERB_GENERAL,
      },
    ],
    expectedAzureSSMLBody: "終了します",
  },
  {
    id: "numeric-current-time-930",
    description: "numeric: 9時30分 を時間表現としてまとめる",
    rawTokens: [
      rawToken({
        surface: "9",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "時",
        reading: "ジ",
        pronunciation: "ジ",
        partOfSpeech: NOUN_COUNTER,
      }),
      rawToken({
        surface: "3",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "0",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "分",
        reading: "フン",
        pronunciation: "フン",
        partOfSpeech: NOUN_COUNTER,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "9時",
        reading: "クジ",
        pronunciation: "クジ'",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
        },
      },
      {
        surface: "30",
        reading: "サンジュッ",
        pronunciation: "サン+ジュッ",
        partOfSpeech: {
          level1: "名詞",
          level2: "数詞",
        },
      },
      {
        surface: "分",
        reading: "プン",
        pronunciation: "プ'ン",
        partOfSpeech: NOUN_COUNTER,
      },
    ],
    expectedAzureSSMLBody: "9時30分",
  },
  {
    id: "numeric-temperature-22-5",
    description: "numeric: 22.5度 の小数 pronunciation を固定する",
    rawTokens: [
      rawToken({
        surface: "2",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "2",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: ".",
        partOfSpeech: SYMBOL_GENERAL,
      }),
      rawToken({
        surface: "5",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "度",
        reading: "ド",
        pronunciation: "ド",
        partOfSpeech: NOUN_COUNTER,
        accentType: "0",
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "2",
        reading: "ニジュウ",
        pronunciation: "ニ'ジュウ",
        partOfSpeech: {
          level1: "名詞",
          level2: "数詞",
        },
      },
      {
        surface: "2.5度",
        reading: "ニテンゴド",
        pronunciation: "ニー'テンゴド",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
        },
      },
    ],
    expectedAzureSSMLBody: "22.5度",
  },
  {
    id: "numeric-percent-30",
    description: "numeric: 30パーセント を数読み + 単位に補正する",
    rawTokens: [
      rawToken({
        surface: "3",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "0",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "パーセント",
        reading: "パーセント",
        pronunciation: "パーセント",
        partOfSpeech: NOUN_GENERAL,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "30",
        reading: "サンジュッ",
        pronunciation: "サンジュッ",
        partOfSpeech: {
          level1: "名詞",
          level2: "数詞",
        },
      },
      {
        surface: "パーセント",
        reading: "パーセント",
        pronunciation: "パーセン'ト",
        partOfSpeech: NOUN_GENERAL,
      },
    ],
    expectedAzureSSMLBody: "30パーセント",
  },
  {
    id: "numeric-currency-yen-1280",
    description: "numeric: 1,280円 をまとまった通貨表現として読む",
    rawTokens: [
      rawToken({
        surface: "1,2",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "80",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "円",
        reading: "エン",
        pronunciation: "エン",
        partOfSpeech: NOUN_COUNTER,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "1,280円",
        reading: "センニヒャクハチジュウエン",
        pronunciation: "センニヒャクハチジュウエン",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
        },
      },
    ],
    expectedAzureSSMLBody: "1,280円",
  },
  {
    id: "numeric-currency-yen-1280-separated-comma",
    description: "numeric: 分離されたカンマ付き 1,280円 もまとめて読む",
    rawTokens: [
      rawToken({
        surface: "1",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: ",",
        partOfSpeech: SYMBOL_GENERAL,
      }),
      rawToken({
        surface: "280",
        partOfSpeech: NOUN_NUMERIC,
      }),
      rawToken({
        surface: "円",
        reading: "エン",
        pronunciation: "エン",
        partOfSpeech: NOUN_COUNTER,
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "1,280円",
        reading: "センニヒャクハチジュウエン",
        pronunciation: "センニヒャクハチジュウエン",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
        },
      },
    ],
    expectedAzureSSMLBody: "1,280円",
  },
  {
    id: "particle-insho-ga-kawaru",
    description: "particle: 印象が は前語と結合しない",
    rawTokens: [
      rawToken({
        surface: "印象",
        reading: "インショウ",
        pronunciation: "インショー",
        partOfSpeech: NOUN_GENERAL,
        accentType: "0",
      }),
      rawToken({
        surface: "が",
        reading: "ガ",
        pronunciation: "ガ",
        partOfSpeech: PARTICLE_CASE,
      }),
      rawToken({
        surface: "変わる",
        reading: "カワル",
        pronunciation: "カワル",
        partOfSpeech: VERB_GENERAL,
        accentType: "0",
      }),
    ],
    expectedOverrideTokens: [
      {
        surface: "印象",
        reading: "インショウ",
        pronunciation: "インショー",
        partOfSpeech: NOUN_GENERAL,
        accentType: "0",
      },
      {
        surface: "が",
        reading: "ガ",
        pronunciation: "ガ",
        partOfSpeech: PARTICLE_CASE,
      },
      {
        surface: "変わる",
        reading: "カワル",
        pronunciation: "カワル",
        partOfSpeech: VERB_GENERAL,
        accentType: "0",
      },
    ],
    expectedAzureSSMLBody:
      "印象" + "が" + "変わる",
  },
] as const;
