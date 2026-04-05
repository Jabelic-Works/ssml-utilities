import {
  KNOWN_SSML_TAGS,
  SELF_CONTAINED_SSML_TAGS,
  TEXT_ONLY_SSML_TAGS,
} from "@ssml-utilities/core";
import {
  SSMLProvider,
  SSMLValidationProfile,
  ValidationAttributeRule,
  ValidationTagRule,
} from "./types";

type AttributeRuleMap = Record<string, ValidationAttributeRule>;

const BREAK_STRENGTH_VALUES = [
  "x-weak",
  "weak",
  "medium",
  "strong",
  "x-strong",
] as const;

const GOOGLE_BREAK_STRENGTH_VALUES = [...BREAK_STRENGTH_VALUES, "none"] as const;

const EMPHASIS_LEVEL_VALUES = [
  "strong",
  "moderate",
  "none",
  "reduced",
] as const;

const TIME_VALUE_PATTERN = /^\d+(?:\.\d+)?(?:ms|s|min|h)$/i;
const NUMBER_VALUE_PATTERN = /^\d+(?:\.\d+)?$/;
const SOUND_LEVEL_PATTERN = /^[+-]?\d+(?:\.\d+)?dB$/i;
const BCP47_PATTERN = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;
const GOOGLE_SYNCBASE_PATTERN =
  /^\s*(?:[+-]?\d+(?:\.\d+)?(?:h|min|s|ms)?|[-_#\p{L}\p{N}]+\.(?:begin|end)\s*[+-]\s*\d+(?:\.\d+)?(?:h|min|s|ms)?)\s*$/u;

const isNonEmpty = (value: string): boolean => value.trim().length > 0;
const isTimeValue = (value: string): boolean => TIME_VALUE_PATTERN.test(value);
const isNumberValue = (value: string): boolean =>
  NUMBER_VALUE_PATTERN.test(value);
const isSoundLevelValue = (value: string): boolean =>
  SOUND_LEVEL_PATTERN.test(value);
const isBCP47 = (value: string): boolean => BCP47_PATTERN.test(value);
const isGoogleSyncbaseOrTime = (value: string): boolean =>
  GOOGLE_SYNCBASE_PATTERN.test(value);

function createTextOnlyTag(attributes: AttributeRuleMap = {}): ValidationTagRule {
  return {
    attributes,
    allowText: true,
    allowedChildren: [],
    textOnly: true,
  };
}

function createSelfContainedTag(
  attributes: AttributeRuleMap = {}
): ValidationTagRule {
  return {
    attributes,
    allowText: false,
    allowedChildren: [],
    selfContained: true,
  };
}

const GENERIC_TEXT_ONLY_TAG_SET = new Set(TEXT_ONLY_SSML_TAGS);
const GENERIC_SELF_CONTAINED_TAG_SET = new Set(SELF_CONTAINED_SSML_TAGS);

export const GENERIC_SSML_PROFILE: SSMLValidationProfile = {
  provider: "generic",
  supportedTags: KNOWN_SSML_TAGS.reduce<Record<string, ValidationTagRule>>(
    (supportedTags, tagName) => {
      supportedTags[tagName] = GENERIC_TEXT_ONLY_TAG_SET.has(tagName)
        ? createTextOnlyTag()
        : GENERIC_SELF_CONTAINED_TAG_SET.has(tagName)
          ? createSelfContainedTag()
          : {
              allowText: true,
              allowedChildren: "any",
            };

      return supportedTags;
    },
    {}
  ),
};

const azureTags: Record<string, ValidationTagRule> = {
  speak: {
    allowText: false,
    allowedChildren: ["mstts:backgroundaudio", "voice"],
    attributes: {
      version: { validateValue: isNonEmpty },
      "xml:lang": { validateValue: isBCP47 },
      xmlns: { validateValue: isNonEmpty },
    },
    attributePatterns: [{ pattern: /^xmlns:/, rule: { validateValue: isNonEmpty } }],
  },
  voice: {
    allowText: true,
    allowedChildren: "any",
    attributes: {
      name: { validateValue: isNonEmpty },
      effect: { validateValue: isNonEmpty },
    },
  },
  audio: {
    allowText: true,
    allowedChildren: ["audio", "break", "p", "s", "phoneme", "prosody", "say-as", "sub"],
    attributes: {
      src: { validateValue: isNonEmpty },
    },
  },
  bookmark: createSelfContainedTag({
    mark: { validateValue: isNonEmpty },
  }),
  break: createSelfContainedTag({
    strength: { allowedValues: BREAK_STRENGTH_VALUES },
    time: { validateValue: isTimeValue },
  }),
  emphasis: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
    ],
    attributes: {
      level: { allowedValues: EMPHASIS_LEVEL_VALUES },
    },
  },
  lang: {
    allowText: true,
    allowedChildren: "any",
    attributes: {
      "xml:lang": { validateValue: isBCP47 },
    },
  },
  lexicon: createSelfContainedTag({
    uri: { validateValue: isNonEmpty },
  }),
  math: {
    allowText: true,
    allowedChildren: "any",
    allowUnknownChildren: true,
  },
  "mstts:audioduration": createSelfContainedTag({
    value: { validateValue: isTimeValue },
  }),
  "mstts:backgroundaudio": createSelfContainedTag({
    src: { validateValue: isNonEmpty },
    volume: { validateValue: isNonEmpty },
    fadein: { validateValue: isTimeValue },
    fadeout: { validateValue: isTimeValue },
  }),
  "mstts:voiceconversion": createSelfContainedTag({
    url: { validateValue: isNonEmpty },
  }),
  "mstts:ttsembedding": createSelfContainedTag({
    speakerProfileId: { validateValue: isNonEmpty },
  }),
  "mstts:embedding": {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
    ],
  },
  "mstts:express-as": {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
    ],
    attributes: {
      style: { validateValue: isNonEmpty },
      styledegree: { validateValue: isNumberValue },
      role: { validateValue: isNonEmpty },
    },
  },
  "mstts:silence": createSelfContainedTag({
    type: { validateValue: isNonEmpty },
    value: { validateValue: isTimeValue },
  }),
  "mstts:viseme": createSelfContainedTag({
    type: { validateValue: isNonEmpty },
  }),
  p: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
      "mstts:express-as",
      "s",
    ],
  },
  phoneme: createTextOnlyTag({
    alphabet: { validateValue: isNonEmpty },
    ph: { validateValue: isNonEmpty },
  }),
  prosody: {
    allowText: true,
    allowedChildren: ["audio", "break", "p", "phoneme", "prosody", "say-as", "sub", "s"],
    attributes: {
      pitch: { validateValue: isNonEmpty },
      contour: { validateValue: isNonEmpty },
      range: { validateValue: isNonEmpty },
      rate: { validateValue: isNonEmpty },
      volume: { validateValue: isNonEmpty },
    },
  },
  s: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "phoneme",
      "prosody",
      "say-as",
      "mstts:express-as",
      "sub",
    ],
  },
  "say-as": createTextOnlyTag({
    "interpret-as": { validateValue: isNonEmpty },
    format: { validateValue: isNonEmpty },
    detail: { validateValue: isNonEmpty },
  }),
  sub: createTextOnlyTag({
    alias: { validateValue: isNonEmpty },
  }),
};

azureTags.voice.allowedChildren = Object.keys(azureTags).filter(
  (tagName) => !["mstts:backgroundaudio", "speak"].includes(tagName)
);
azureTags.lang.allowedChildren = Object.keys(azureTags).filter(
  (tagName) => !["mstts:backgroundaudio", "voice", "speak"].includes(tagName)
);

export const AZURE_SSML_PROFILE: SSMLValidationProfile = {
  provider: "azure",
  supportedTags: azureTags,
};

const googleTags: Record<string, ValidationTagRule> = {
  speak: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "mark",
      "media",
      "p",
      "par",
      "phoneme",
      "prosody",
      "s",
      "say-as",
      "seq",
      "sub",
      "voice",
    ],
    attributes: {
      xmlns: { validateValue: isNonEmpty },
    },
    attributePatterns: [{ pattern: /^xmlns:/, rule: { validateValue: isNonEmpty } }],
  },
  break: createSelfContainedTag({
    strength: { allowedValues: GOOGLE_BREAK_STRENGTH_VALUES },
    time: { validateValue: isTimeValue },
  }),
  "say-as": createTextOnlyTag({
    "interpret-as": { validateValue: isNonEmpty },
    format: { validateValue: isNonEmpty },
    detail: { validateValue: isNonEmpty },
    "google:style": { validateValue: isNonEmpty },
  }),
  audio: createTextOnlyTag({
    src: { validateValue: isNonEmpty },
    clipBegin: { validateValue: isTimeValue },
    clipEnd: { validateValue: isTimeValue },
    speed: { validateValue: isNumberValue },
    repeatCount: { validateValue: isNumberValue },
    repeatDur: { validateValue: isTimeValue },
    soundLevel: { validateValue: isSoundLevelValue },
  }),
  p: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "mark",
      "phoneme",
      "prosody",
      "s",
      "say-as",
      "sub",
      "voice",
    ],
  },
  s: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "mark",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
      "voice",
    ],
  },
  sub: createTextOnlyTag({
    alias: { validateValue: isNonEmpty },
  }),
  mark: createSelfContainedTag({
    name: { validateValue: isNonEmpty },
  }),
  prosody: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "mark",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
      "voice",
    ],
    attributes: {
      pitch: { validateValue: isNonEmpty },
      rate: { validateValue: isNonEmpty },
      volume: { validateValue: isNonEmpty },
    },
  },
  emphasis: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "mark",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
      "voice",
    ],
    attributes: {
      level: { allowedValues: EMPHASIS_LEVEL_VALUES },
    },
  },
  par: {
    allowText: false,
    allowedChildren: ["media", "par", "seq"],
  },
  seq: {
    allowText: false,
    allowedChildren: ["media", "par", "seq"],
  },
  media: {
    allowText: false,
    allowedChildren: ["audio", "speak"],
    attributes: {
      "xml:id": { validateValue: isNonEmpty },
      begin: { validateValue: isGoogleSyncbaseOrTime },
      end: { validateValue: isGoogleSyncbaseOrTime },
      repeatCount: { validateValue: isNumberValue },
      repeatDur: { validateValue: isTimeValue },
      soundLevel: { validateValue: isSoundLevelValue },
      fadeInDur: { validateValue: isTimeValue },
      fadeOutDur: { validateValue: isTimeValue },
    },
  },
  phoneme: createTextOnlyTag({
    alphabet: { allowedValues: ["ipa", "x-sampa", "yomigana"] },
    ph: { validateValue: isNonEmpty },
  }),
  voice: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "mark",
      "phoneme",
      "prosody",
      "s",
      "say-as",
      "sub",
      "voice",
    ],
    attributes: {
      name: { validateValue: isNonEmpty },
      language: { validateValue: isBCP47 },
      gender: { allowedValues: ["male", "female", "neutral"] },
      variant: { validateValue: isNonEmpty },
      required: { validateValue: isNonEmpty },
      ordering: { validateValue: isNonEmpty },
    },
  },
  lang: {
    allowText: true,
    allowedChildren: [
      "audio",
      "break",
      "emphasis",
      "lang",
      "mark",
      "phoneme",
      "prosody",
      "say-as",
      "sub",
      "voice",
    ],
    attributes: {
      "xml:lang": { validateValue: isBCP47 },
    },
  },
};

export const GOOGLE_SSML_PROFILE: SSMLValidationProfile = {
  provider: "google",
  supportedTags: googleTags,
};

export function getValidationProfile(
  profile: SSMLProvider | SSMLValidationProfile = "generic"
): SSMLValidationProfile {
  if (typeof profile !== "string") {
    return profile;
  }

  switch (profile) {
    case "azure":
      return AZURE_SSML_PROFILE;
    case "google":
      return GOOGLE_SSML_PROFILE;
    default:
      return GENERIC_SSML_PROFILE;
  }
}
