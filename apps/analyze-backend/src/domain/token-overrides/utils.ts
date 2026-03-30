import type { UniDicRawToken } from "@ssml-utilities/accent-ir";

export const GENERIC_NOUN_PART_OF_SPEECH = {
  level1: "名詞",
  level2: "普通名詞",
} as const;

export const NUMERIC_PART_OF_SPEECH = {
  level1: "名詞",
  level2: "数詞",
} as const;

export const createSyntheticToken = (input: {
  surface: string;
  reading: string;
  pronunciation: string;
  sourceTokens: readonly UniDicRawToken[];
  partOfSpeech: UniDicRawToken["partOfSpeech"];
}): UniDicRawToken => ({
  surface: input.surface,
  reading: input.reading,
  pronunciation: input.pronunciation,
  partOfSpeech: input.partOfSpeech,
  source: {
    dictionary: "unidic",
    rawFeatures: input.sourceTokens.flatMap(
      (token) => token.source?.rawFeatures ?? [token.surface]
    ),
  },
});

export const normalizeKanaReading = (
  reading?: string | null
): string | undefined => (reading && reading !== "*" ? reading : undefined);
