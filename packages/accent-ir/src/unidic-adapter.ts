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
  UniDicAzureHintMode,
  UniDicRawToken,
} from "./unidic-contract";
import { toHiragana } from "./kana";
import { appendAzureHintToSegment } from "./unidic-azure-hints";

// MVP adapter only. This does not execute MeCab or load UniDic dictionaries.
// It converts already-normalized UniDicRawToken arrays into AccentIR.

const SENTENCE_ENDING_PUNCTUATION = new Set(["。", "！", "!", "？", "?"]);
const ATTACHABLE_PARTICLE_SURFACES = new Set([
  "を",
  "に",
  "へ",
  "で",
  "と",
  "の",
  "は",
  "も",
  "や",
  "か",
  "な",
  "ね",
  "よ",
  "まで",
  "より",
  "から",
  "だけ",
  "しか",
  "ほど",
  "くらい",
  "など",
  "って",
  "たり",
  "ば",
  "し",
  "ながら",
  "けれど",
]);

export const adaptUniDicTokensToAccentIR = (
  input: UniDicAccentIRAdapterInput
): UniDicAccentIRAdapterResult => {
  const warnings: UniDicAccentIRAdapterWarning[] = [];
  const segments: AccentIRSegment[] = [];
  const azureHintMode = input.azureHintMode ?? "auto";

  for (const [tokenIndex, token] of input.tokens.entries()) {
    if (isSentenceEndingPauseToken(token, tokenIndex, input.tokens)) {
      segments.push({
        type: "break",
        strength: "strong",
      });
      continue;
    }

    if (
      isAttachableParticle(token) &&
      isLastSegmentText(segments) &&
      canMergeAttachableParticleIntoSegment(
        segments[segments.length - 1] as AccentIRTextSegment
      )
    ) {
      const lastSegment = segments[segments.length - 1] as AccentIRTextSegment;
      mergeParticleIntoSegment(lastSegment, token, azureHintMode);
      continue;
    }

    const segment = createTextSegmentFromToken(
      token,
      tokenIndex,
      warnings,
      azureHintMode
    );
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
  warnings: UniDicAccentIRAdapterWarning[],
  azureHintMode: UniDicAzureHintMode
): AccentIRTextSegment => {
  const accent = parseAccent(token, tokenIndex, warnings);
  const segment: AccentIRTextSegment = {
    type: "text",
    text: token.surface,
    reading: normalizeReading(token.reading),
    accent,
  };

  applyAzureHintsToSegment(segment, token, azureHintMode);

  return segment;
};

const mergeParticleIntoSegment = (
  segment: AccentIRTextSegment,
  token: UniDicRawToken,
  azureHintMode: UniDicAzureHintMode
): void => {
  segment.text += token.surface;

  const normalizedReading = normalizeReading(token.reading);
  if (!normalizedReading) {
    if (shouldAppendAutomaticAzureHint(segment, azureHintMode)) {
      appendAzureHintToSegment(segment, token);
    }
    return;
  }

  segment.reading = `${segment.reading ?? ""}${normalizedReading}`;

  if (segment.hints?.azureSubAlias) {
    segment.hints = {
      ...segment.hints,
      azureSubAlias: `${segment.hints.azureSubAlias}${normalizedReading}`,
    };
    return;
  }

  if (shouldAppendAutomaticAzureHint(segment, azureHintMode)) {
    appendAzureHintToSegment(segment, token);
  }
};

const applyAzureHintsToSegment = (
  segment: AccentIRTextSegment,
  token: UniDicRawToken,
  azureHintMode: UniDicAzureHintMode
): void => {
  const explicitAzurePhoneme = token.ttsHints?.azurePhoneme;
  const explicitAzureSubAlias = token.ttsHints?.azureSubAlias;
  const explicitAzureTrailingSubAlias = token.ttsHints?.azureTrailingSubAlias;
  const preventParticleMerge = token.ttsHints?.preventParticleMerge;

  if (
    explicitAzurePhoneme ||
    explicitAzureSubAlias ||
    explicitAzureTrailingSubAlias ||
    preventParticleMerge
  ) {
    const normalizedAlias =
      normalizeReading(explicitAzureSubAlias) ?? explicitAzureSubAlias;
    const normalizedTrailingAlias =
      normalizeReading(explicitAzureTrailingSubAlias) ??
      explicitAzureTrailingSubAlias;

    segment.hints = {
      ...segment.hints,
      ...(explicitAzurePhoneme
        ? { azurePhoneme: explicitAzurePhoneme }
        : {}),
      ...(normalizedAlias ? { azureSubAlias: normalizedAlias } : {}),
      ...(normalizedTrailingAlias
        ? { azureTrailingSubAlias: normalizedTrailingAlias }
        : {}),
      ...(preventParticleMerge ? { preventParticleMerge: true } : {}),
    };
    return;
  }

  if (azureHintMode !== "explicit-only") {
    appendAzureHintToSegment(segment, token);
  }
};

const shouldAppendAutomaticAzureHint = (
  segment: AccentIRTextSegment,
  azureHintMode: UniDicAzureHintMode
): boolean => Boolean(segment.hints?.azurePhoneme) || azureHintMode !== "explicit-only";

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
  token.partOfSpeech.level1 === "助詞" &&
  ATTACHABLE_PARTICLE_SURFACES.has(token.surface);

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

const canMergeAttachableParticleIntoSegment = (
  segment: AccentIRTextSegment
): boolean =>
  segment.text.length > 0 &&
  !segment.hints?.azureTrailingSubAlias &&
  !segment.hints?.preventParticleMerge;

const normalizeReading = (reading?: string | null): string | undefined => {
  if (!reading || reading === "*") {
    return undefined;
  }

  return toHiragana(reading);
};
