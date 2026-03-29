import type { AccentIR, AccentIREmitOptions, AccentIREmitWarning } from "../../index";
import type { UniDicRawToken } from "../../unidic-contract";

export interface AzureFirstEvaluationCase {
  id: string;
  description: string;
  tokens: readonly UniDicRawToken[];
  expectedAccentIR: AccentIR;
  expectedAdapterWarnings: readonly [];
  azureOptions: AccentIREmitOptions;
  expectedAzureSSML: string;
  expectedAzureWarnings: readonly AccentIREmitWarning[];
}

const DEFAULT_AZURE_OPTIONS: AccentIREmitOptions = {
  voice: "ja-JP-NanamiNeural",
};

// Shared Azure-first fixtures. Google-specific expectations can be added later
// without changing the adapter-side token contracts or AccentIR expectations.
export const azureFirstEvaluationCases: readonly AzureFirstEvaluationCase[] = [
  {
    id: "hashi-chopsticks",
    description: "最小対立語: 箸",
    tokens: [
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
    ],
    expectedAccentIR: {
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
    },
    expectedAdapterWarnings: [],
    azureOptions: DEFAULT_AZURE_OPTIONS,
    expectedAzureSSML:
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><phoneme alphabet="sapi" ph="ハ\'シ">箸</phoneme></voice></speak>',
    expectedAzureWarnings: [],
  },
  {
    id: "hashi-bridge",
    description: "最小対立語: 橋",
    tokens: [
      {
        surface: "橋",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "2",
        },
      },
    ],
    expectedAccentIR: {
      locale: "ja-JP",
      segments: [
        {
          type: "text",
          text: "橋",
          reading: "はし",
          accent: { downstep: 2 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ'",
            },
          },
        },
      ],
    },
    expectedAdapterWarnings: [],
    azureOptions: DEFAULT_AZURE_OPTIONS,
    expectedAzureSSML:
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><phoneme alphabet="sapi" ph="ハシ\'">橋</phoneme></voice></speak>',
    expectedAzureWarnings: [],
  },
  {
    id: "hashi-edge",
    description: "最小対立語: 端",
    tokens: [
      {
        surface: "端",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "0",
        },
      },
    ],
    expectedAccentIR: {
      locale: "ja-JP",
      segments: [
        {
          type: "text",
          text: "端",
          reading: "はし",
          accent: { downstep: null },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ+",
            },
          },
        },
      ],
    },
    expectedAdapterWarnings: [],
    azureOptions: DEFAULT_AZURE_OPTIONS,
    expectedAzureSSML:
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><phoneme alphabet="sapi" ph="ハシ+">端</phoneme></voice></speak>',
    expectedAzureWarnings: [],
  },
  {
    id: "tokyo-proper-noun",
    description: "固有名詞: 東京",
    tokens: [
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
    ],
    expectedAccentIR: {
      locale: "ja-JP",
      segments: [
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
      ],
    },
    expectedAdapterWarnings: [],
    azureOptions: DEFAULT_AZURE_OPTIONS,
    expectedAzureSSML:
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><phoneme alphabet="sapi" ph="トーキョー+">東京</phoneme></voice></speak>',
    expectedAzureWarnings: [],
  },
  {
    id: "hashi-wo-motsu",
    description: "助詞連結: 箸を持つ",
    tokens: [
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
    ],
    expectedAccentIR: {
      locale: "ja-JP",
      segments: [
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
      ],
    },
    expectedAdapterWarnings: [],
    azureOptions: DEFAULT_AZURE_OPTIONS,
    expectedAzureSSML:
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><phoneme alphabet="sapi" ph="ハ\'シオ">箸を</phoneme><phoneme alphabet="sapi" ph="モ\'ツ">持つ</phoneme></voice></speak>',
    expectedAzureWarnings: [],
  },
  {
    id: "motsu-sentence-end",
    description: "文末 pause: 持つ。",
    tokens: [
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
    ],
    expectedAccentIR: {
      locale: "ja-JP",
      segments: [
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
      ],
    },
    expectedAdapterWarnings: [],
    azureOptions: DEFAULT_AZURE_OPTIONS,
    expectedAzureSSML:
      '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><phoneme alphabet="sapi" ph="モ\'ツ">持つ</phoneme><break strength="strong"/></voice></speak>',
    expectedAzureWarnings: [],
  },
] as const;
