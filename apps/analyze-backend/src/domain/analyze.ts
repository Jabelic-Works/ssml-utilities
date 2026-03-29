import type {
  AnalyzeErrorResponse,
  AnalyzeRequest,
} from "@ssml-utilities/analyze-contract";

const DEFAULT_LOCALE = "ja-JP";

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
