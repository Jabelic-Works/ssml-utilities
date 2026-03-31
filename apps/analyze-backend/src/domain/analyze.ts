import type {
  AnalyzeErrorResponse,
  AnalyzeRequest,
  AnalyzeSuccessResponse,
} from "@ssml-utilities/analyze-contract";
import {
  adaptUniDicTokensToAccentIR,
  emitAzureSSML,
} from "@ssml-utilities/accent-ir";
import {
  analyzeTextWithMeCab,
  MeCabExecutionError,
  UniDicConfigurationError,
} from "./mecab.js";
import { applyTokenOverrides } from "./token-overrides/index.js";

const DEFAULT_LOCALE = "ja-JP";
const DEFAULT_VOICE = "ja-JP-NanamiNeural";

interface AnalyzeRequestOk {
  ok: true;
  request: AnalyzeRequest;
}

interface AnalyzeRequestError {
  ok: false;
  status: number;
  error: AnalyzeErrorResponse;
}

type AnalyzeRequestParseResult = AnalyzeRequestOk | AnalyzeRequestError;

interface AnalyzeExecutionOk {
  ok: true;
  response: AnalyzeSuccessResponse;
}

interface AnalyzeExecutionError {
  ok: false;
  status: number;
  error: AnalyzeErrorResponse;
}

export type AnalyzeExecutionResult = AnalyzeExecutionOk | AnalyzeExecutionError;

export const validateAnalyzeRequest = (
  payload: unknown
): AnalyzeRequestParseResult => {
  if (!isRecord(payload)) {
    return {
      ok: false,
      status: 400,
      error: {
        error: {
          code: "BAD_REQUEST",
          message: "Request body must be a JSON object.",
        },
      },
    };
  }

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) {
    return {
      ok: false,
      status: 400,
      error: {
        error: {
          code: "BAD_REQUEST",
          message: "text is required.",
        },
      },
    };
  }

  return {
    ok: true,
    request: {
      text,
      locale: typeof payload.locale === "string" ? payload.locale : DEFAULT_LOCALE,
      voice: typeof payload.voice === "string" ? payload.voice : undefined,
      includeDebug: Boolean(payload.includeDebug),
    },
  };
};

export const buildAnalyzeUnavailableError = (): AnalyzeErrorResponse => ({
  error: {
    code: "ANALYZE_BACKEND_UNAVAILABLE",
    message:
      "Analyze backend scaffold is deployed, but MeCab + UniDic integration is not implemented yet.",
  },
});

export const analyzeRequest = async (
  request: AnalyzeRequest
): Promise<AnalyzeExecutionResult> => {
  try {
    const locale = request.locale ?? DEFAULT_LOCALE;
    const voice = request.voice ?? DEFAULT_VOICE;
    const rawTokens = await analyzeTextWithMeCab(request.text);
    const analysisTokens = applyTokenOverrides(rawTokens);
    const adapted = adaptUniDicTokensToAccentIR({
      locale,
      tokens: analysisTokens,
      azureHintMode: "explicit-only",
    });
    const emitted = emitAzureSSML(adapted.accentIR, {
      locale,
      voice,
      azureReadingFallback: "plainText",
    });

    if (adapted.warnings.length > 0) {
      console.warn(
        `UniDic adapter warnings: ${JSON.stringify(adapted.warnings, null, 2)}`
      );
    }

    return {
      ok: true,
      response: {
        text: request.text,
        locale,
        accentIR: adapted.accentIR,
        azureSSML: emitted.ssml,
        warnings: emitted.warnings,
        ...(request.includeDebug ? { debug: { rawTokens } } : {}),
      },
    };
  } catch (error) {
    if (error instanceof UniDicConfigurationError) {
      return {
        ok: false,
        status: 500,
        error: {
          error: {
            code: "UNIDIC_NOT_CONFIGURED",
            message: error.message,
          },
        },
      };
    }

    if (error instanceof MeCabExecutionError) {
      return {
        ok: false,
        status: 500,
        error: {
          error: {
            code: "MECAB_EXECUTION_FAILED",
            message: error.message,
          },
        },
      };
    }

    return {
      ok: false,
      status: 500,
      error: {
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Unexpected analyze backend error.",
        },
      },
    };
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
