import type { UniDicRawToken } from "@ssml-utilities/accent-ir";
import type { ParsedNumericSpan, TokenOverrideMatch } from "./types.js";
import {
  createSyntheticToken,
  GENERIC_NOUN_PART_OF_SPEECH,
  NUMERIC_PART_OF_SPEECH,
} from "./utils.js";

const NUMERIC_UNIT_SURFACES = new Set(["度", "パーセント", "％", "%"]);
const CURRENCY_SURFACES = new Set(["円"]);
const PERCENT_SURFACES = new Set(["パーセント", "％", "%"]);
const DECIMAL_POINT_SURFACES = new Set([".", "．"]);
const GROUPING_SEPARATOR_SURFACES = new Set([",", "，"]);

const SPECIAL_HOUR_READINGS = new Map<
  number,
  { reading: string; pronunciation: string }
>([
  [0, { reading: "レイジ", pronunciation: "レイジ" }],
  [4, { reading: "ヨジ", pronunciation: "ヨジ" }],
  [7, { reading: "シチジ", pronunciation: "シチジ" }],
  [9, { reading: "クジ", pronunciation: "クジ'" }],
]);

const DIGIT_READINGS = [
  "ゼロ",
  "イチ",
  "ニ",
  "サン",
  "ヨン",
  "ゴ",
  "ロク",
  "ナナ",
  "ハチ",
  "キュウ",
] as const;

const INTEGER_DIGIT_READINGS = [
  "",
  "イチ",
  "ニ",
  "サン",
  "ヨン",
  "ゴ",
  "ロク",
  "ナナ",
  "ハチ",
  "キュウ",
] as const;

const LARGE_NUMBER_UNITS = ["", "マン", "オク", "チョウ"] as const;

export const matchHourExpression = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const span = parseNumericSpan(tokens, index);
  if (!span || span.fractionalPart) {
    return undefined;
  }

  const unitToken = tokens[span.nextIndex];
  if (unitToken?.surface !== "時") {
    return undefined;
  }

  const hour = Number.parseInt(span.integerPart, 10);
  if (!Number.isInteger(hour) || hour < 0 || hour > 24) {
    return undefined;
  }

  const reading = SPECIAL_HOUR_READINGS.get(hour) ?? {
    reading: `${convertIntegerToJapaneseReading(span.integerPart)}ジ`,
    pronunciation: `${convertIntegerToJapaneseReading(span.integerPart)}ジ`,
  };

  return {
    tokens: [
      createSyntheticToken({
        surface: `${span.originalText}${unitToken.surface}`,
        reading: reading.reading,
        pronunciation: reading.pronunciation,
        sourceTokens: tokens.slice(index, span.nextIndex + 1),
        partOfSpeech: GENERIC_NOUN_PART_OF_SPEECH,
      }),
    ],
    nextIndex: span.nextIndex + 1,
  };
};

export const matchMinuteExpression = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const span = parseNumericSpan(tokens, index);
  if (!span || span.fractionalPart) {
    return undefined;
  }

  const unitToken = tokens[span.nextIndex];
  if (unitToken?.surface !== "分") {
    return undefined;
  }

  const minute = Number.parseInt(span.integerPart, 10);
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
    return undefined;
  }

  const minuteReading = buildMinuteReading(minute);

  return {
    tokens: [
      createSyntheticToken({
        surface: span.originalText,
        reading: minuteReading.numberReading,
        pronunciation: minuteReading.numberPronunciation,
        sourceTokens: tokens.slice(index, span.nextIndex),
        partOfSpeech: NUMERIC_PART_OF_SPEECH,
      }),
      createSyntheticToken({
        surface: unitToken.surface,
        reading: minuteReading.unitReading,
        pronunciation: minuteReading.unitPronunciation,
        sourceTokens: [unitToken],
        partOfSpeech: unitToken.partOfSpeech ?? GENERIC_NOUN_PART_OF_SPEECH,
      }),
    ],
    nextIndex: span.nextIndex + 1,
  };
};

export const matchDegreeExpression = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const span = parseNumericSpan(tokens, index);
  if (!span) {
    return undefined;
  }

  const unitToken = tokens[span.nextIndex];
  if (unitToken?.surface !== "度") {
    return undefined;
  }

  const reading = span.fractionalPart
    ? `${convertDecimalToJapaneseReading(span.integerPart, span.fractionalPart)}ド`
    : `${convertIntegerToJapaneseReading(span.integerPart)}ド`;
  const pronunciation = span.fractionalPart
    ? `${convertDecimalToJapanesePronunciation(
        span.integerPart,
        span.fractionalPart
      )}ド`
    : `${convertIntegerToJapaneseReading(span.integerPart)}ド`;

  return {
    tokens: [
      createSyntheticToken({
        surface: `${span.originalText}${unitToken.surface}`,
        reading,
        pronunciation,
        sourceTokens: tokens.slice(index, span.nextIndex + 1),
        partOfSpeech: GENERIC_NOUN_PART_OF_SPEECH,
      }),
    ],
    nextIndex: span.nextIndex + 1,
  };
};

export const matchCurrencyExpression = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const span = parseNumericSpan(tokens, index);
  if (!span) {
    return undefined;
  }

  const unitToken = tokens[span.nextIndex];
  if (!CURRENCY_SURFACES.has(unitToken?.surface ?? "")) {
    return undefined;
  }

  const reading = span.fractionalPart
    ? `${convertDecimalToJapaneseReading(span.integerPart, span.fractionalPart)}エン`
    : `${convertIntegerToJapaneseReading(span.integerPart)}エン`;
  const pronunciation = span.fractionalPart
    ? `${convertDecimalToJapanesePronunciation(
        span.integerPart,
        span.fractionalPart
      )}エン`
    : `${convertIntegerToJapaneseReading(span.integerPart)}エン`;

  return {
    tokens: [
      createSyntheticToken({
        surface: `${span.originalText}${unitToken.surface}`,
        reading,
        pronunciation,
        sourceTokens: tokens.slice(index, span.nextIndex + 1),
        partOfSpeech: GENERIC_NOUN_PART_OF_SPEECH,
      }),
    ],
    nextIndex: span.nextIndex + 1,
  };
};

export const matchGenericNumber = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const span = parseNumericSpan(tokens, index);
  if (!span) {
    return undefined;
  }

  const shouldMerge =
    span.tokenCount > 1 ||
    Boolean(span.fractionalPart) ||
    isFollowedByNumericUnit(tokens, span.nextIndex) ||
    hasGroupingSeparator(span.originalText);

  if (!shouldMerge) {
    return undefined;
  }

  const reading = span.fractionalPart
    ? convertDecimalToJapaneseReading(span.integerPart, span.fractionalPart)
    : convertIntegerToJapaneseReading(span.integerPart);

  return {
    tokens: [
      createSyntheticToken({
        surface: span.originalText,
        reading,
        pronunciation: span.fractionalPart
          ? convertDecimalToJapanesePronunciation(
              span.integerPart,
              span.fractionalPart
            )
          : reading,
        sourceTokens: tokens.slice(index, span.nextIndex),
        partOfSpeech: NUMERIC_PART_OF_SPEECH,
      }),
    ],
    nextIndex: span.nextIndex,
  };
};

export const matchPercentExpression = (
  tokens: readonly UniDicRawToken[],
  index: number
): TokenOverrideMatch | undefined => {
  const span = parseNumericSpan(tokens, index);
  if (!span) {
    return undefined;
  }

  const unitToken = tokens[span.nextIndex];
  if (!PERCENT_SURFACES.has(unitToken?.surface ?? "")) {
    return undefined;
  }

  const reading = span.fractionalPart
    ? convertDecimalToJapaneseReading(span.integerPart, span.fractionalPart)
    : convertCounterStyleIntegerReading(span.integerPart);

  const unitSurface = unitToken?.surface === "パーセント" ? "パーセント" : "%";

  return {
    tokens: [
      createSyntheticToken({
        surface: span.originalText,
        reading,
        pronunciation: span.fractionalPart
          ? convertDecimalToJapanesePronunciation(
              span.integerPart,
              span.fractionalPart
            )
          : reading,
        sourceTokens: tokens.slice(index, span.nextIndex),
        partOfSpeech: NUMERIC_PART_OF_SPEECH,
      }),
      createSyntheticToken({
        surface: unitSurface,
        reading: "パーセント",
        pronunciation: "パーセン'ト",
        sourceTokens: unitToken ? [unitToken] : [],
        partOfSpeech: unitToken?.partOfSpeech ?? GENERIC_NOUN_PART_OF_SPEECH,
      }),
    ],
    nextIndex: span.nextIndex + 1,
  };
};

const parseNumericSpan = (
  tokens: readonly UniDicRawToken[],
  startIndex: number
): ParsedNumericSpan | undefined => {
  let index = startIndex;
  let originalText = "";
  let normalizedText = "";
  let tokenCount = 0;
  let hasDigit = false;
  let hasDecimalPoint = false;

  while (index < tokens.length) {
    const token = tokens[index]!;
    const normalizedSurface = normalizeNumericSurface(token.surface);

    if (normalizedSurface && isAsciiDigits(normalizedSurface)) {
      hasDigit = true;
      tokenCount += 1;
      originalText += token.surface;
      normalizedText += normalizedSurface;
      index += 1;
      continue;
    }

    if (
      GROUPING_SEPARATOR_SURFACES.has(token.surface) &&
      hasDigit &&
      isNumericToken(tokens[index + 1])
    ) {
      originalText += token.surface;
      index += 1;
      continue;
    }

    if (
      DECIMAL_POINT_SURFACES.has(token.surface) &&
      hasDigit &&
      !hasDecimalPoint &&
      isNumericToken(tokens[index + 1])
    ) {
      hasDecimalPoint = true;
      tokenCount += 1;
      originalText += token.surface;
      normalizedText += ".";
      index += 1;
      continue;
    }

    break;
  }

  if (!hasDigit || normalizedText.endsWith(".")) {
    return undefined;
  }

  const [integerPart, fractionalPart] = normalizedText.split(".");

  return {
    originalText,
    normalizedText,
    integerPart,
    fractionalPart,
    nextIndex: index,
    tokenCount,
  };
};

const buildMinuteReading = (minute: number) => {
  const tens = Math.floor(minute / 10);
  const ones = minute % 10;

  const unitReading = usesPReadingForMinutes(minute) ? "プン" : "フン";
  const unitPronunciation = usesPReadingForMinutes(minute) ? "プ'ン" : "フ'ン";

  if (minute === 0) {
    return {
      numberReading: "ゼロ",
      numberPronunciation: "ゼロ",
      unitReading,
      unitPronunciation,
    };
  }

  if (ones === 0) {
    if (minute === 10) {
      return {
        numberReading: "ジュッ",
        numberPronunciation: "ジュッ",
        unitReading,
        unitPronunciation,
      };
    }

    const prefix = convertIntegerToJapaneseReading(String(tens));
    return {
      numberReading: `${prefix}ジュッ`,
      numberPronunciation: `${prefix}+ジュッ`,
      unitReading,
      unitPronunciation,
    };
  }

  const suffixOverride = new Map<number, string>([
    [1, "イッ"],
    [6, "ロッ"],
    [8, "ハッ"],
  ]);

  const suffix = suffixOverride.get(ones);
  if (suffix) {
    const prefix =
      tens > 0 ? convertIntegerToJapaneseReading(String(tens * 10)) : "";
    return {
      numberReading: `${prefix}${suffix}`,
      numberPronunciation: `${prefix}${suffix}`,
      unitReading,
      unitPronunciation,
    };
  }

  return {
    numberReading: convertIntegerToJapaneseReading(String(minute)),
    numberPronunciation: convertIntegerToJapaneseReading(String(minute)),
    unitReading,
    unitPronunciation,
  };
};

const usesPReadingForMinutes = (minute: number): boolean => {
  const normalizedMinute = Math.abs(minute);
  return (
    normalizedMinute === 0 ||
    normalizedMinute % 10 === 1 ||
    normalizedMinute % 10 === 3 ||
    normalizedMinute % 10 === 4 ||
    normalizedMinute % 10 === 6 ||
    normalizedMinute % 10 === 8 ||
    normalizedMinute % 10 === 0
  );
};

const convertDecimalToJapaneseReading = (
  integerPart: string,
  fractionalPart: string
): string =>
  `${convertIntegerToJapaneseReading(integerPart)}テン${Array.from(
    fractionalPart
  )
    .map((digit) => DIGIT_READINGS[Number.parseInt(digit, 10)] ?? digit)
    .join("")}`;

const convertDecimalToJapanesePronunciation = (
  integerPart: string,
  fractionalPart: string
): string =>
  `${convertDecimalIntegerPronunciation(integerPart)}テン${Array.from(
    fractionalPart
  )
    .map((digit) => DIGIT_READINGS[Number.parseInt(digit, 10)] ?? digit)
    .join("")}`;

const convertDecimalIntegerPronunciation = (integerPart: string): string => {
  const reading = convertIntegerToJapaneseReading(integerPart);
  const lastDigit = integerPart.at(-1);

  switch (lastDigit) {
    case "2":
      return `${reading}ー`;
    case "5":
      return reading.replace(/ゴ$/u, "ゴー");
    case "9":
      return reading.replace(/キュウ$/u, "キュー");
    default:
      return reading;
  }
};

const convertCounterStyleIntegerReading = (value: string): string => {
  const plainReading = convertIntegerToJapaneseReading(value);

  if (plainReading.endsWith("ジュウ")) {
    return plainReading.replace(/ジュウ$/u, "ジュッ");
  }

  return plainReading;
};

const convertIntegerToJapaneseReading = (value: string): string => {
  const normalized = value.replace(/^0+(?=\d)/u, "");

  if (!normalized || /^0+$/u.test(normalized)) {
    return "ゼロ";
  }

  const groups: string[] = [];
  for (let cursor = normalized.length; cursor > 0; cursor -= 4) {
    groups.unshift(normalized.slice(Math.max(0, cursor - 4), cursor));
  }

  return groups
    .map((group, groupIndex) => {
      const reading = convertFourDigitGroup(group.padStart(4, "0"));
      if (!reading) {
        return "";
      }

      const unitIndex = groups.length - groupIndex - 1;
      return `${reading}${LARGE_NUMBER_UNITS[unitIndex] ?? ""}`;
    })
    .join("");
};

const convertFourDigitGroup = (group: string): string => {
  const [thousands, hundreds, tens, ones] = Array.from(group).map((digit) =>
    Number.parseInt(digit, 10)
  );

  return [
    convertThousandsDigit(thousands),
    convertHundredsDigit(hundreds),
    convertTensDigit(tens),
    convertOnesDigit(ones),
  ].join("");
};

const convertThousandsDigit = (digit: number): string => {
  switch (digit) {
    case 0:
      return "";
    case 1:
      return "セン";
    case 3:
      return "サンゼン";
    case 8:
      return "ハッセン";
    default:
      return `${INTEGER_DIGIT_READINGS[digit] ?? ""}セン`;
  }
};

const convertHundredsDigit = (digit: number): string => {
  switch (digit) {
    case 0:
      return "";
    case 1:
      return "ヒャク";
    case 3:
      return "サンビャク";
    case 6:
      return "ロッピャク";
    case 8:
      return "ハッピャク";
    default:
      return `${INTEGER_DIGIT_READINGS[digit] ?? ""}ヒャク`;
  }
};

const convertTensDigit = (digit: number): string => {
  if (digit === 0) {
    return "";
  }

  if (digit === 1) {
    return "ジュウ";
  }

  return `${INTEGER_DIGIT_READINGS[digit] ?? ""}ジュウ`;
};

const convertOnesDigit = (digit: number): string =>
  INTEGER_DIGIT_READINGS[digit] ?? "";

const isFollowedByNumericUnit = (
  tokens: readonly UniDicRawToken[],
  index: number
): boolean => NUMERIC_UNIT_SURFACES.has(tokens[index]?.surface ?? "");

const isNumericToken = (token?: UniDicRawToken): boolean => {
  if (!token) {
    return false;
  }

  const normalizedSurface = normalizeNumericSurface(token.surface);
  return Boolean(normalizedSurface && isAsciiDigits(normalizedSurface));
};

const normalizeNumericSurface = (surface: string): string | undefined => {
  const normalized = Array.from(surface)
    .map((char) => {
      const codePoint = char.codePointAt(0);
      if (!codePoint) {
        return char;
      }

      if (codePoint >= 0xff10 && codePoint <= 0xff19) {
        return String.fromCodePoint(codePoint - 0xfee0);
      }

      return char;
    })
    .join("")
    .replace(/[,\uFF0C]/gu, "");

  return normalized;
};

const isAsciiDigits = (value: string): boolean => /^\d+$/u.test(value);

const hasGroupingSeparator = (value: string): boolean => /[,\uFF0C]/u.test(value);
