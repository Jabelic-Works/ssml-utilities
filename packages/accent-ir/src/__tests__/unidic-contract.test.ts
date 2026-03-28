import { describe, expect, it } from "vitest";
import { mockUniDicRawTokens } from "../unidic-contract.mock";

describe("UniDic contract", () => {
  it("mock UniDic tokens を export する", () => {
    expect(mockUniDicRawTokens).toHaveLength(3);
    expect(mockUniDicRawTokens[0]).toMatchObject({
      surface: "箸",
      reading: "ハシ",
      partOfSpeech: {
        level1: "名詞",
      },
      source: {
        dictionary: "unidic",
      },
    });
  });
});
