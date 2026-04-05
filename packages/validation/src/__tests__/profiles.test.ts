import {
  KNOWN_SSML_TAGS,
  SELF_CONTAINED_SSML_TAGS,
  TEXT_ONLY_SSML_TAGS,
} from "@ssml-utilities/core";
import { describe, expect, it } from "vitest";
import {
  AZURE_SSML_PROFILE,
  GENERIC_SSML_PROFILE,
  GOOGLE_SSML_PROFILE,
} from "../index";

describe("GENERIC_SSML_PROFILE", () => {
  it("core の shared tag metadata をそのまま使う", () => {
    expect(Object.keys(GENERIC_SSML_PROFILE.supportedTags)).toEqual(KNOWN_SSML_TAGS);

    for (const tagName of TEXT_ONLY_SSML_TAGS) {
      expect(GENERIC_SSML_PROFILE.supportedTags[tagName]).toMatchObject({
        allowText: true,
        allowedChildren: [],
        textOnly: true,
      });
    }

    for (const tagName of SELF_CONTAINED_SSML_TAGS) {
      expect(GENERIC_SSML_PROFILE.supportedTags[tagName]).toMatchObject({
        allowText: false,
        allowedChildren: [],
        selfContained: true,
      });
    }

    expect(GENERIC_SSML_PROFILE.supportedTags.voice).toMatchObject({
      allowText: true,
      allowedChildren: "any",
    });
  });
});

describe("AZURE_SSML_PROFILE", () => {
  it("speak の namespace attribute pattern と動的 child 制約を持つ", () => {
    expect(AZURE_SSML_PROFILE.supportedTags.speak.attributePatterns).toEqual([
      expect.objectContaining({
        pattern: /^xmlns:/,
      }),
    ]);

    expect(AZURE_SSML_PROFILE.supportedTags.voice.allowedChildren).not.toContain(
      "mstts:backgroundaudio"
    );
    expect(AZURE_SSML_PROFILE.supportedTags.voice.allowedChildren).not.toContain(
      "speak"
    );
    expect(AZURE_SSML_PROFILE.supportedTags.lang.allowedChildren).not.toContain(
      "voice"
    );
  });
});

describe("GOOGLE_SSML_PROFILE", () => {
  it("composite timing tags と voice attributes を定義している", () => {
    expect(GOOGLE_SSML_PROFILE.supportedTags.par).toMatchObject({
      allowText: false,
      allowedChildren: ["media", "par", "seq"],
    });
    expect(GOOGLE_SSML_PROFILE.supportedTags.media).toMatchObject({
      allowText: false,
      allowedChildren: ["audio", "speak"],
    });
    expect(GOOGLE_SSML_PROFILE.supportedTags.voice.attributes).toEqual(
      expect.objectContaining({
        language: expect.any(Object),
        gender: expect.any(Object),
      })
    );
  });
});
