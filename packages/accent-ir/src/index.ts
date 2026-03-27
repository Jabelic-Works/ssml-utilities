export type AccentIREmphasis = "strong" | "moderate" | "reduced";

export type AccentIRBreakStrength =
  | "none"
  | "x-weak"
  | "weak"
  | "medium"
  | "strong"
  | "x-strong";

export interface AccentIR {
  locale?: string;
  segments: AccentIRSegment[];
}

export type AccentIRSegment = AccentIRTextSegment | AccentIRBreakSegment;

export interface AccentIRTextSegment {
  type: "text";
  text: string;
  reading?: string;
  accent?: JapanesePitchAccent;
  emphasis?: AccentIREmphasis;
  hints?: {
    googleYomigana?: string;
    azurePhoneme?: {
      alphabet: "sapi" | "ipa";
      value: string;
    };
  };
}

export interface AccentIRBreakSegment {
  type: "break";
  time?: string;
  strength?: AccentIRBreakStrength;
}

export interface JapanesePitchAccent {
  phraseStart?: boolean;
  downstep?: number | null;
}

export type AccentIREmitWarningCode =
  | "MISSING_READING"
  | "INVALID_DOWNSTEP"
  | "AZURE_ACCENT_FALLBACK";

export interface AccentIREmitWarning {
  code: AccentIREmitWarningCode;
  message: string;
  segmentIndex: number;
}

export interface AccentIREmitResult {
  ssml: string;
  warnings: AccentIREmitWarning[];
}

export interface AccentIREmitOptions {
  locale?: string;
  voice?: string;
}

const SMALL_KANA =
  /[ぁぃぅぇぉゃゅょゎゕゖァィゥェォャュョヮヵヶ]/u;
const PROLONGED_SOUND_MARK = "ー";
const DEFAULT_LOCALE = "ja-JP";

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

export const buildGoogleYomigana = (
  reading: string,
  accent?: JapanesePitchAccent
): string => {
  const normalized = toHiragana(reading);
  const moras = splitKanaIntoMoras(normalized);

  if (moras.length === 0) {
    return normalized;
  }

  const phraseStart = accent?.phraseStart ?? true;
  const downstep = accent?.downstep;

  if (downstep === null || downstep === undefined) {
    return `${phraseStart ? "^" : ""}${moras.join("")}`;
  }

  if (downstep < 1 || downstep > moras.length) {
    throw new Error(
      `downstep must be between 1 and ${moras.length}, received ${downstep}`
    );
  }

  const prefix = phraseStart ? "^" : "";
  const beforeDrop = moras.slice(0, downstep).join("");
  const afterDrop = moras.slice(downstep).join("");
  return `${prefix}${beforeDrop}!${afterDrop}`;
};

export const emitGoogleSSML = (
  accentIR: AccentIR,
  options: AccentIREmitOptions = {}
): AccentIREmitResult => {
  const warnings: AccentIREmitWarning[] = [];
  const content = accentIR.segments
    .map((segment, segmentIndex) =>
      serializeSegmentForGoogle(segment, segmentIndex, warnings)
    )
    .join("");

  return {
    ssml: wrapSpeak(content, {
      locale: accentIR.locale ?? options.locale ?? DEFAULT_LOCALE,
      voice: options.voice,
      includeNamespace: false,
    }),
    warnings,
  };
};

export const emitAzureSSML = (
  accentIR: AccentIR,
  options: AccentIREmitOptions = {}
): AccentIREmitResult => {
  const warnings: AccentIREmitWarning[] = [];
  const content = accentIR.segments
    .map((segment, segmentIndex) =>
      serializeSegmentForAzure(segment, segmentIndex, warnings)
    )
    .join("");

  return {
    ssml: wrapSpeak(content, {
      locale: accentIR.locale ?? options.locale ?? DEFAULT_LOCALE,
      voice: options.voice,
      includeNamespace: true,
    }),
    warnings,
  };
};

const serializeSegmentForGoogle = (
  segment: AccentIRSegment,
  segmentIndex: number,
  warnings: AccentIREmitWarning[]
): string => {
  if (segment.type === "break") {
    return serializeBreak(segment);
  }

  const hint = segment.hints?.googleYomigana;
  let content = escapeXmlText(segment.text);

  if (hint) {
    content = `<phoneme alphabet="yomigana" ph="${escapeXmlAttribute(hint)}">${content}</phoneme>`;
  } else if (segment.reading) {
    try {
      const yomigana = buildGoogleYomigana(segment.reading, segment.accent);
      content = `<phoneme alphabet="yomigana" ph="${escapeXmlAttribute(yomigana)}">${content}</phoneme>`;
    } catch (error) {
      warnings.push({
        code: "INVALID_DOWNSTEP",
        message:
          error instanceof Error ? error.message : "invalid accent information",
        segmentIndex,
      });
    }
  } else if (segment.accent) {
    warnings.push({
      code: "MISSING_READING",
      message:
        "Google SSML でアクセントを表現するには reading か googleYomigana hint が必要です。",
      segmentIndex,
    });
  }

  return applyEmphasis(content, segment.emphasis);
};

const serializeSegmentForAzure = (
  segment: AccentIRSegment,
  segmentIndex: number,
  warnings: AccentIREmitWarning[]
): string => {
  if (segment.type === "break") {
    return serializeBreak(segment);
  }

  const text = escapeXmlText(segment.text);
  let content = text;

  if (segment.hints?.azurePhoneme) {
    const { alphabet, value } = segment.hints.azurePhoneme;
    content = `<phoneme alphabet="${alphabet}" ph="${escapeXmlAttribute(value)}">${text}</phoneme>`;
  } else if (segment.reading) {
    content = `<sub alias="${escapeXmlAttribute(segment.reading)}">${text}</sub>`;

    if (segment.accent) {
      warnings.push({
        code: "AZURE_ACCENT_FALLBACK",
        message:
          "Azure SSML は accent 情報を直接表現せず、reading を sub alias にフォールバックしました。azurePhoneme hint を渡すと精密化できます。",
        segmentIndex,
      });
    }
  } else if (segment.accent) {
    warnings.push({
      code: "AZURE_ACCENT_FALLBACK",
      message:
        "Azure SSML では accent 情報だけを直接表現できないため、plain text にフォールバックしました。",
      segmentIndex,
    });
  }

  return applyEmphasis(content, segment.emphasis);
};

const serializeBreak = (segment: AccentIRBreakSegment): string => {
  const attributes: string[] = [];

  if (segment.time) {
    attributes.push(`time="${escapeXmlAttribute(segment.time)}"`);
  }

  if (segment.strength) {
    attributes.push(`strength="${escapeXmlAttribute(segment.strength)}"`);
  }

  return attributes.length > 0
    ? `<break ${attributes.join(" ")}/>`
    : "<break/>";
};

const applyEmphasis = (
  content: string,
  emphasis?: AccentIREmphasis
): string => {
  if (!emphasis) {
    return content;
  }

  return `<emphasis level="${emphasis}">${content}</emphasis>`;
};

const wrapSpeak = (
  content: string,
  options: {
    locale: string;
    voice?: string;
    includeNamespace: boolean;
  }
): string => {
  const speakOpen = options.includeNamespace
    ? `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${escapeXmlAttribute(
        options.locale
      )}">`
    : `<speak xml:lang="${escapeXmlAttribute(options.locale)}">`;

  if (!options.voice) {
    return `${speakOpen}${content}</speak>`;
  }

  return `${speakOpen}<voice name="${escapeXmlAttribute(
    options.voice
  )}">${content}</voice></speak>`;
};

const escapeXmlText = (value: string): string =>
  value.replace(/[&<>]/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      default:
        return char;
    }
  });

const escapeXmlAttribute = (value: string): string =>
  escapeXmlText(value).replace(/"/g, "&quot;");

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
