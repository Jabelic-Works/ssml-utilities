import type { AnalyzeErrorResponse } from "@ssml-utilities/analyze-contract";
import {
  analyzeRequest,
  validateAnalyzeRequest,
} from "../domain/analyze.js";
import type { JsonRouteResponse } from "./http.js";

export const handleAnalyzeRoute = (
  method: string,
  payload: unknown
): Promise<JsonRouteResponse> => {
  if (method !== "POST") {
    return Promise.resolve({
      status: 405,
      body: {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Only POST is supported.",
        },
      } satisfies AnalyzeErrorResponse,
    });
  }

  const parsed = validateAnalyzeRequest(payload);
  if (!parsed.ok) {
    return Promise.resolve({
      status: parsed.status,
      body: parsed.error,
    });
  }

  return analyzeRequest(parsed.request).then((result) =>
    result.ok
      ? {
          status: 200,
          body: result.response,
        }
      : {
          status: result.status,
          body: result.error,
        }
  );
};
