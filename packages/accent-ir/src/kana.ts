const SMALL_KANA =
  /[ぁぃぅぇぉゃゅょゎゕゖァィゥェォャュョヮヵヶ]/u;
const PROLONGED_SOUND_MARK = "ー";

// Shared kana helpers for mora splitting and script normalization.
// Keep these internal unless a public consumer specifically needs them.

export const splitKanaIntoMoras = (reading: string): string[] => {
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

export const toHiragana = (value: string): string =>
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

export const toKatakana = (value: string): string =>
  Array.from(value)
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
