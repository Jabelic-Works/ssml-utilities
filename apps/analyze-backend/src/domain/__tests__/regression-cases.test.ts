import { adaptUniDicTokensToAccentIR, emitAzureSSML } from "@ssml-utilities/accent-ir";
import { describe, expect, it } from "vitest";
import { applyTokenOverrides } from "../token-overrides/index.js";
import {
  regressionCases,
  toComparableToken,
} from "./fixtures/regression-cases.js";

const wrapAzureSSML = (body: string): string =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural">${body}</voice></speak>`;

describe("analyze-backend regression cases", () => {
  for (const testCase of regressionCases) {
    it(`${testCase.description}: token overrides`, () => {
      const overriddenTokens = applyTokenOverrides(testCase.rawTokens);

      expect(overriddenTokens.map(toComparableToken)).toEqual(
        testCase.expectedOverrideTokens
      );
    });

    it(`${testCase.description}: Azure SSML`, () => {
      const overriddenTokens = applyTokenOverrides(testCase.rawTokens);
      const adapted = adaptUniDicTokensToAccentIR({
        locale: "ja-JP",
        tokens: overriddenTokens,
      });
      const emitted = emitAzureSSML(adapted.accentIR, {
        locale: "ja-JP",
        voice: "ja-JP-NanamiNeural",
      });

      expect(adapted.warnings).toEqual([]);
      expect(emitted.warnings).toEqual([]);
      expect(emitted.ssml).toBe(wrapAzureSSML(testCase.expectedAzureSSMLBody));
    });
  }
});
