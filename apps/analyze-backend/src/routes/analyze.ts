import type { AnalyzeErrorResponse } from "@ssml-utilities/analyze-contract";
import {
  buildAnalyzeUnavailableError,
  validateAnalyzeRequest,
} from "../domain/analyze.js";
import type { JsonRouteResponse } from "./http.js";

export const handleAnalyzeRoute = (
  method: string,
  payload: unknown
): JsonRouteResponse => {
  if (method !== "POST") {
    return {
      status: 405,
      body: {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST is supported.",
        },
      } satisfies AnalyzeErrorResponse,
    };
  }

  const parsed = validateAnalyzeRequest(payload);
  if (!parsed.ok) {
    return {
      status: parsed.status,
      body: parsed.error,
    };
  }

  return {
    status: 503,
    body: buildAnalyzeUnavailableError(),
  };
};
