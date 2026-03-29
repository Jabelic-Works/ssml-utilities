import type { AccentIRTextSegment } from "./index";
import type { UniDicRawToken } from "./unidic-contract";

export interface AzurePhonemeHint {
  alphabet: "sapi";
  value: string;
}

// MVP only. This is a lightweight heuristic that derives Azure SAPI-style
// pronunciation hints from normalized UniDic token data. It is not intended to
// be a complete or linguistically perfect converter.

export const buildAzurePhonemeHintFromUniDicToken = (
  token: UniDicRawToken
): AzurePhonemeHint | undefined => {
  const pronunciation = normalizeToKatakana(
    token.pronunciation ?? token.reading ?? undefined
  );

  if (!pronunciation) {
    return undefined;
  }

  return {
    alphabet: "sapi",
    value: applyAccentMarkers(pronunciation, token.accent?.accentType),
  };
};

export const buildAzurePhonemeHintFromUniDicTokens = (
  tokens: readonly UniDicRawToken[]
): AzurePhonemeHint | undefined => {
  const values = tokens
    .map((token) => buildAzurePhonemeHintFromUniDicToken(token)?.value)
    .filter((value): value is string => Boolean(value));

  if (values.length === 0) {
    return undefined;
  }

  return {
    alphabet: "sapi",
    value: values.join(""),
  };
};

export const appendAzureHintToSegment = (
  segment: AccentIRTextSegment,
  token: UniDicRawToken
): void => {
  const tokenHint = buildAzurePhonemeHintFromUniDicToken(token);
  if (!tokenHint) {
    return;
  }

  const existingValue = segment.hints?.azurePhoneme?.value;

  segment.hints = {
    ...segment.hints,
    azurePhoneme: {
      alphabet: "sapi",
      value: `${existingValue ?? ""}${tokenHint.value}`,
    },
  };
};

const applyAccentMarkers = (
  katakana: string,
  accentType?: string | null
): string => {
  const normalizedAccentType = accentType?.trim();

  if (!normalizedAccentType || normalizedAccentType === "*") {
    return katakana;
  }

  const moras = splitKanaIntoMoras(katakana);
  if (moras.length === 0) {
    return katakana;
  }

  if (normalizedAccentType === "0") {
    return `${moras.join("")}+`;
  }

  const accentIndex = Number.parseInt(normalizedAccentType, 10);
  if (Number.isNaN(accentIndex)) {
    return katakana;
  }

  if (accentIndex < 1 || accentIndex > moras.length) {
    return katakana;
  }

  const beforeAccent = moras.slice(0, accentIndex).join("");
  const afterAccent = moras.slice(accentIndex).join("");
  return `${beforeAccent}'${afterAccent}`;
};

const normalizeToKatakana = (value?: string): string | undefined => {
  if (!value || value === "*") {
    return undefined;
  }

  return Array.from(value)
    .map((char) => {
      const codePoint = char.codePointAt(0);

      if (!codePoint) {
        return char;
      }

      if (codePoint >= 0x3041 && codePoint <= 0x3096) {
        return String.fromCodePoint(codePoint + 0x60);
      }

      return char;
    })
    .join("");
};

const SMALL_KANA =
  /[ぁぃぅぇぉゃゅょゎゕゖァィゥェォャュョヮヵヶ]/u;
const PROLONGED_SOUND_MARK = "ー";

const splitKanaIntoMoras = (reading: string): string[] => {
  const moras: string[] = [];

  for (const char of Array.from(reading)) {
    if (
      moras.length > 0 &&
      (SMALL_KANA.test(char) || char === PROLONGED_SOUND_MARK)
    ) {
      moras[moras.length - 1] += char;
      continue;
    }

    moras.push(char);
  }

  return moras;
};
