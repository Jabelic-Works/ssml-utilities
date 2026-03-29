import {
  emitAzureSSML,
  type AccentIR,
  type AccentIREmitWarning,
  type UniDicRawToken,
} from "@ssml-utilities/accent-ir";
import type {
  AnalyzeErrorResponse,
  AnalyzeSuccessResponse,
} from "@ssml-utilities/analyze-contract";

export const DEFAULT_VOICE = "ja-JP-NanamiNeural";
export const DEFAULT_OUTPUT_FORMAT = "audio-24khz-48kbitrate-mono-mp3";

export const SESSION_KEYS = {
  subscriptionKey: "azure-subscription-key",
  region: "azure-region",
  voice: "azure-voice",
  outputFormat: "azure-output-format",
} as const;

export interface AccentIRSample {
  id: string;
  label: string;
  accentIR: AccentIR;
}

export const SAMPLE_CASES: readonly AccentIRSample[] = [
  {
    id: "hashi-chopsticks",
    label: "箸 (1型)",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "箸",
          reading: "はし",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハ'シ",
            },
          },
        },
      ],
    },
  },
  {
    id: "hashi-bridge",
    label: "橋 (2型)",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "橋",
          reading: "はし",
          accent: { downstep: 2 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ'",
            },
          },
        },
      ],
    },
  },
  {
    id: "hashi-edge",
    label: "端 (平板)",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "端",
          reading: "はし",
          accent: { downstep: null },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ+",
            },
          },
        },
      ],
    },
  },
  {
    id: "hashi-wo-motsu",
    label: "箸を持つ",
    accentIR: {
      segments: [
        {
          type: "text",
          text: "箸を",
          reading: "はしを",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハ'シオ",
            },
          },
        },
        {
          type: "text",
          text: "持つ",
          reading: "もつ",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "モ'ツ",
            },
          },
        },
      ],
    },
  },
] as const;

export const readSessionValue = (key: string, fallback = ""): string => {
  if (typeof window === "undefined") {
    return fallback;
  }

  return window.sessionStorage.getItem(key) ?? fallback;
};

export const writeSessionValue = (key: string, value: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.sessionStorage.setItem(key, value);
    return;
  }

  window.sessionStorage.removeItem(key);
};

export const buildSampleSSML = (
  sampleId: string,
  voice: string
): { ssml: string; warnings: AccentIREmitWarning[] } => {
  const sample =
    SAMPLE_CASES.find((candidate) => candidate.id === sampleId) ?? SAMPLE_CASES[0];

  const result = emitAzureSSML(sample.accentIR, {
    voice: voice || DEFAULT_VOICE,
  });

  return {
    ssml: result.ssml,
    warnings: result.warnings,
  };
};

export const readErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as
      | AnalyzeErrorResponse
      | { error?: string; details?: string };

    if (typeof payload.error === "string") {
      return "details" in payload && typeof payload.details === "string"
        ? `${payload.error}: ${payload.details}`
        : payload.error;
    }

    if (isRecord(payload.error) && typeof payload.error.message === "string") {
      return typeof payload.error.code === "string"
        ? `${payload.error.code}: ${payload.error.message}`
        : payload.error.message;
    }

    return response.statusText;
  }

  const text = await response.text();
  return text || response.statusText;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const readAnalyzeResponse = (
  payload: unknown
): {
  accentIR: AccentIR;
  azureSSML: string;
  warnings: AccentIREmitWarning[];
  rawTokens: UniDicRawToken[] | null;
} => {
  if (!isRecord(payload)) {
    throw new Error("Analyze API response must be an object.");
  }

  const response = payload as Partial<AnalyzeSuccessResponse>;

  const accentIR = response.accentIR;
  if (!accentIR) {
    throw new Error("Analyze API response is missing accentIR.");
  }

  const azureSSML =
    typeof response.azureSSML === "string" ? response.azureSSML : "";
  if (!azureSSML) {
    throw new Error("Analyze API response is missing azureSSML.");
  }

  const warnings = Array.isArray(response.warnings)
    ? (response.warnings as AccentIREmitWarning[])
    : [];

  const debug = isRecord(response.debug) ? response.debug : undefined;
  const rawTokens = Array.isArray(debug?.rawTokens)
    ? (debug.rawTokens.filter(isRecord) as UniDicRawToken[])
    : null;

  return {
    accentIR,
    azureSSML,
    warnings,
    rawTokens,
  };
};
