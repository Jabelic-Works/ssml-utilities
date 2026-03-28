import { describe, expect, it } from "vitest";
import { emitAzureSSML } from "../index";
import { adaptUniDicTokensToAccentIR } from "../unidic-adapter";
import { azureFirstEvaluationCases } from "./fixtures/evaluation-cases";

describe("Azure-first evaluation cases", () => {
  for (const testCase of azureFirstEvaluationCases) {
    it(`${testCase.description}: UniDic adapter -> AccentIR`, () => {
      const result = adaptUniDicTokensToAccentIR({
        tokens: testCase.tokens,
      });

      expect(result.warnings).toEqual(testCase.expectedAdapterWarnings);
      expect(result.accentIR).toEqual(testCase.expectedAccentIR);
    });

    it(`${testCase.description}: AccentIR -> Azure SSML`, () => {
      const result = emitAzureSSML(
        testCase.expectedAccentIR,
        testCase.azureOptions
      );

      expect(result.ssml).toBe(testCase.expectedAzureSSML);
      expect(result.warnings).toEqual(testCase.expectedAzureWarnings);
    });
  }
});
