import type { AccentIR } from "./index";

// Contract only. This file does not implement real UniDic parsing or loading.
// It only defines the shape that a future UniDic adapter should normalize into.

export interface UniDicPartOfSpeech {
  level1: string;
  level2?: string | null;
  level3?: string | null;
  level4?: string | null;
}

export interface UniDicInflection {
  type?: string | null;
  form?: string | null;
}

export interface UniDicAccentMetadata {
  accentType?: string | null;
  accentConnectionType?: string | null;
  accentModificationType?: string | null;
}

export interface UniDicTokenSource {
  dictionary: "unidic";
  rawFeatures?: readonly string[];
}

export interface UniDicTextToSpeechHints {
  azurePhoneme?: {
    alphabet: "sapi" | "ipa";
    value: string;
  };
  azureSubAlias?: string;
}

export interface UniDicRawToken {
  surface: string;
  lemma?: string | null;
  orthBase?: string | null;
  reading?: string | null;
  pronunciation?: string | null;
  partOfSpeech: UniDicPartOfSpeech;
  inflection?: UniDicInflection;
  accent?: UniDicAccentMetadata;
  source?: UniDicTokenSource;
  ttsHints?: UniDicTextToSpeechHints;
}

export type UniDicAzureHintMode = "auto" | "explicit-only";

export interface UniDicAccentIRAdapterInput {
  locale?: string;
  tokens: readonly UniDicRawToken[];
  azureHintMode?: UniDicAzureHintMode;
}

export interface UniDicAccentIRAdapterWarning {
  code: string;
  message: string;
  tokenIndex: number;
}

export interface UniDicAccentIRAdapterResult {
  accentIR: AccentIR;
  warnings: UniDicAccentIRAdapterWarning[];
}

export interface UniDicAccentIRAdapter {
  fromUniDic(input: UniDicAccentIRAdapterInput): UniDicAccentIRAdapterResult;
}
