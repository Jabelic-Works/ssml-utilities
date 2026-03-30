import type { UniDicRawToken } from "@ssml-utilities/accent-ir";
import type { TokenOverrideMatch } from "./types.js";
import { createSyntheticToken, normalizeKanaReading } from "./utils.js";

export const matchSahenVerbExpression = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const nounToken = tokens[index];
  const verbToken = tokens[index + 1];

  if (
    !nounToken ||
    !verbToken ||
    nounToken.partOfSpeech.level1 !== "名詞" ||
    nounToken.partOfSpeech.level2 !== "普通名詞" ||
    nounToken.partOfSpeech.level3 !== "サ変可能" ||
    verbToken.lemma !== "為る"
  ) {
    return undefined;
  }

  const sourceTokens = [nounToken, verbToken];
  let nextIndex = index + 2;

  while (tokens[nextIndex]?.partOfSpeech.level1 === "助動詞") {
    sourceTokens.push(tokens[nextIndex]!);
    nextIndex += 1;
  }

  return {
    tokens: [
      createSyntheticToken({
        surface: sourceTokens.map((token) => token.surface).join(""),
        reading: sourceTokens
          .map((token) => normalizeKanaReading(token.reading) ?? token.surface)
          .join(""),
        pronunciation: sourceTokens
          .map((token) => token.pronunciation ?? token.reading ?? token.surface)
          .join(""),
        sourceTokens,
        partOfSpeech: {
          level1: "動詞",
          level2: "一般",
        },
      }),
    ],
    nextIndex,
  };
};
