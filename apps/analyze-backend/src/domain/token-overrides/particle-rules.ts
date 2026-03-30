import type { UniDicRawToken } from "@ssml-utilities/accent-ir";
import type { TokenOverrideMatch } from "./types.js";
import { createSyntheticToken, normalizeKanaReading } from "./utils.js";

const STANDALONE_PARTICLE_SURFACES = new Set(["が"]);

export const matchStandaloneParticle = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const token = tokens[index];
  if (
    !token ||
    token.partOfSpeech.level1 !== "助詞" ||
    !STANDALONE_PARTICLE_SURFACES.has(token.surface)
  ) {
    return undefined;
  }

  return {
    tokens: [
      createSyntheticToken({
        surface: token.surface,
        reading: normalizeKanaReading(token.reading) ?? token.surface,
        pronunciation: token.pronunciation ?? token.reading ?? token.surface,
        sourceTokens: [token],
        partOfSpeech: {
          level1: "その他",
          level2: "助詞",
        },
      }),
    ],
    nextIndex: index + 1,
  };
};
