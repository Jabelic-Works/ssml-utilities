import { describe, expect, it } from "vitest";
import { exampleUniDicRawTokens } from "../unidic";

describe("UniDic contract", () => {
  it("illustrative UniDic tokens を export する", () => {
    expect(exampleUniDicRawTokens).toHaveLength(3);
    expect(exampleUniDicRawTokens[0]).toMatchObject({
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
