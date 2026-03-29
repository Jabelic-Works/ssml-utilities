import type {
  AccentIR,
  AccentIRBreakSegment,
  AccentIRSegment,
  AccentIRTextSegment,
  JapanesePitchAccent,
} from "./index";
import type {
  UniDicAccentIRAdapter,
  UniDicAccentIRAdapterInput,
  UniDicAccentIRAdapterResult,
  UniDicAccentIRAdapterWarning,
  UniDicRawToken,
} from "./unidic-contract";
import { appendAzureHintToSegment } from "./unidic-azure-hints";

// MVP adapter only. This does not execute MeCab or load UniDic dictionaries.
// It converts already-normalized UniDicRawToken arrays into AccentIR.

const SENTENCE_ENDING_PUNCTUATION = new Set(["。", "！", "!", "？", "?"]);

export const adaptUniDicTokensToAccentIR = (
  input: UniDicAccentIRAdapterInput
): UniDicAccentIRAdapterResult => {
  const warnings: UniDicAccentIRAdapterWarning[] = [];
  const segments: AccentIRSegment[] = [];

  for (const [tokenIndex, token] of input.tokens.entries()) {
    if (isSentenceEndingPauseToken(token, tokenIndex, input.tokens)) {
      segments.push({
        type: "break",
        strength: "strong",
      });
      continue;
    }

    if (isAttachableParticle(token) && isLastSegmentText(segments)) {
      const lastSegment = segments[segments.length - 1] as AccentIRTextSegment;
      mergeParticleIntoSegment(lastSegment, token);
      continue;
    }

    const segment = createTextSegmentFromToken(token, tokenIndex, warnings);
    segments.push(segment);
  }

  return {
    accentIR: {
      locale: input.locale ?? "ja-JP",
      segments,
    },
    warnings,
  };
};

export const uniDicAccentIRAdapter: UniDicAccentIRAdapter = {
  fromUniDic: adaptUniDicTokensToAccentIR,
};

const createTextSegmentFromToken = (
  token: UniDicRawToken,
  tokenIndex: number,
  warnings: UniDicAccentIRAdapterWarning[]
): AccentIRTextSegment => {
  const accent = parseAccent(token, tokenIndex, warnings);
  const segment: AccentIRTextSegment = {
    type: "text",
    text: token.surface,
    reading: normalizeReading(token.reading),
    accent,
  };

  appendAzureHintToSegment(segment, token);

  return segment;
};

const mergeParticleIntoSegment = (
  segment: AccentIRTextSegment,
  token: UniDicRawToken
): void => {
  segment.text += token.surface;

  const normalizedReading = normalizeReading(token.reading);
  if (!normalizedReading) {
    appendAzureHintToSegment(segment, token);
    return;
  }

  segment.reading = `${segment.reading ?? ""}${normalizedReading}`;
  appendAzureHintToSegment(segment, token);
};

const parseAccent = (
  token: UniDicRawToken,
  tokenIndex: number,
  warnings: UniDicAccentIRAdapterWarning[]
): JapanesePitchAccent | undefined => {
  const accentType = token.accent?.accentType?.trim();

  if (!accentType || accentType === "*" || accentType === "") {
    return undefined;
  }

  if (accentType === "0") {
    return { downstep: null };
  }

  const downstep = Number.parseInt(accentType, 10);
  if (Number.isNaN(downstep)) {
    warnings.push({
      code: "UNIDIC_INVALID_ACCENT_TYPE",
      message: `Could not parse accentType '${accentType}' from UniDic token.`,
      tokenIndex,
    });
    return undefined;
  }

  return { downstep };
};

const isAttachableParticle = (token: UniDicRawToken): boolean =>
  token.partOfSpeech.level1 === "助詞";

const isSentenceEndingPauseToken = (
  token: UniDicRawToken,
  tokenIndex: number,
  tokens: readonly UniDicRawToken[]
): boolean =>
  token.partOfSpeech.level1 === "補助記号" &&
  SENTENCE_ENDING_PUNCTUATION.has(token.surface) &&
  tokenIndex === tokens.length - 1;

const isLastSegmentText = (
  segments: readonly AccentIRSegment[]
): segments is readonly [...AccentIRSegment[], AccentIRTextSegment] =>
  segments.length > 0 && segments[segments.length - 1]?.type === "text";

const normalizeReading = (reading?: string | null): string | undefined => {
  if (!reading || reading === "*") {
    return undefined;
  }

  return toHiragana(reading);
};

const toHiragana = (value: string): string =>
  Array.from(value)
    .map((char) => {
      const codePoint = char.codePointAt(0);

      if (!codePoint) {
        return char;
      }

      if (codePoint >= 0x30a1 && codePoint <= 0x30f6) {
        return String.fromCodePoint(codePoint - 0x60);
      }

      return char;
    })
    .join("");
