import type { UniDicRawToken } from "@ssml-utilities/accent-ir";
import type { TokenOverrideMatch } from "./types.js";
import { createSyntheticToken } from "./utils.js";

interface SurfaceOverride {
  reading: string;
  pronunciation: string;
  azurePhoneme?: string;
  azureTrailingSubAlias?: string;
}

interface PhraseOverride {
  surfaces: readonly string[];
  reading: string;
  pronunciation: string;
  partOfSpeech: UniDicRawToken["partOfSpeech"];
}

const SURFACE_OVERRIDES = new Map<string, SurfaceOverride>([
  [
    "発音",
    {
      reading: "ハツオン",
      pronunciation: "ハツ+オン+",
    },
  ],
  [
    "模試",
    {
      reading: "モシ",
      pronunciation: "モシ+",
    },
  ],
  [
    "要件",
    {
      reading: "ヨウケン",
      pronunciation: "ヨ+ウケ'ン",
      azurePhoneme: "ヨ+++ウケ'",
      azureTrailingSubAlias: "ん",
    },
  ],
  [
    "用件",
    {
      reading: "ヨウケン",
      pronunciation: "ヨ+ウケ'ン",
      azurePhoneme: "ヨ+++ウケ'",
      azureTrailingSubAlias: "ん",
    },
  ],
  [
    "抑揚",
    {
      reading: "ヨクヨウ",
      pronunciation: "ヨクヨ+ウ",
    },
  ],
]);

const PHRASE_OVERRIDES: readonly PhraseOverride[] = [
  {
    surfaces: ["おはよう", "ござい", "ます"],
    reading: "おはようございます",
    pronunciation: "オハヨーゴザイマス",
    partOfSpeech: {
      level1: "感動詞",
      level2: "一般",
    },
  },
  {
    surfaces: ["ありがとう", "ござい", "ます"],
    reading: "ありがとうございます",
    pronunciation: "アリガトーゴザイマス",
    partOfSpeech: {
      level1: "感動詞",
      level2: "一般",
    },
  },
] as const;

export const matchPhraseOverride = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  for (const override of PHRASE_OVERRIDES) {
    const matches = override.surfaces.every(
      (surface, offset) => tokens[index + offset]?.surface === surface
    );

    if (!matches) {
      continue;
    }

    return {
      tokens: [
        createSyntheticToken({
          surface: override.surfaces.join(""),
          reading: override.reading,
          pronunciation: override.pronunciation,
          sourceTokens: tokens.slice(index, index + override.surfaces.length),
          partOfSpeech: override.partOfSpeech,
        }),
      ],
      nextIndex: index + override.surfaces.length,
    };
  }

  return undefined;
};

export const matchSurfaceOverride = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const token = tokens[index];
  if (!token) {
    return undefined;
  }

  const override = SURFACE_OVERRIDES.get(token.surface);
  if (!override) {
    return undefined;
  }

  return {
    tokens: [
      createSyntheticToken({
        surface: token.surface,
        reading: override.reading,
        pronunciation: override.pronunciation,
        sourceTokens: [token],
        partOfSpeech: token.partOfSpeech,
        azurePhoneme: override.azurePhoneme ?? override.pronunciation,
        azureTrailingSubAlias: override.azureTrailingSubAlias,
      }),
    ],
    nextIndex: index + 1,
  };
};
