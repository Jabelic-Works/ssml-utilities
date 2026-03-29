import type {
  AccentIR,
  AccentIREmitWarning,
  UniDicRawToken,
} from "@ssml-utilities/accent-ir";

export interface AnalyzeRequest {
  text: string;
  locale?: string;
  voice?: string;
  includeDebug?: boolean;
}

export type AnalyzeErrorCode =
  | "BAD_REQUEST"
  | "METHOD_NOT_ALLOWED"
  | "NOT_FOUND"
  | "UNIDIC_NOT_CONFIGURED"
  | "MECAB_EXECUTION_FAILED"
  | "ANALYZE_BACKEND_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface AnalyzeSuccessResponse {
  text: string;
  locale: string;
  accentIR: AccentIR;
  azureSSML: string;
  warnings: AccentIREmitWarning[];
  debug?: {
    rawTokens?: UniDicRawToken[];
  };
}

export interface AnalyzeErrorResponse {
  error: {
    code: AnalyzeErrorCode;
    message: string;
  };
}
