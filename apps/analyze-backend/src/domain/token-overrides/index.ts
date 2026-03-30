import type { UniDicRawToken } from "@ssml-utilities/accent-ir";
import { matchPhraseOverride, matchSurfaceOverride } from "./lexicon.js";
import {
  matchGenericNumber,
  matchHourExpression,
  matchMinuteExpression,
  matchPercentExpression,
} from "./numeric-rules.js";
import { matchStandaloneParticle } from "./particle-rules.js";
import { matchSahenVerbExpression } from "./phrase-rules.js";
import type { TokenOverrideMatch } from "./types.js";

const TOKEN_OVERRIDE_RULES = [
  matchPhraseOverride,
  matchSurfaceOverride,
  matchStandaloneParticle,
  matchSahenVerbExpression,
  matchHourExpression,
  matchMinuteExpression,
  matchPercentExpression,
  matchGenericNumber,
] as const;

export const applyTokenOverrides = (
  tokens: readonly UniDicRawToken[]
): UniDicRawToken[] => {
  const nextTokens: UniDicRawToken[] = [];

  for (let index = 0; index < tokens.length; ) {
    const override = TOKEN_OVERRIDE_RULES.reduce<TokenOverrideMatch | undefined>(
      (matched, rule) => matched ?? rule(tokens, index),
      undefined
    );

    if (!override) {
      nextTokens.push(tokens[index]!);
      index += 1;
      continue;
    }

    nextTokens.push(...override.tokens);
    index = override.nextIndex;
  }

  return nextTokens;
};
