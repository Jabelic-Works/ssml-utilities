import {
  KNOWN_SSML_TAGS,
  SELF_CONTAINED_SSML_TAGS,
  TEXT_ONLY_SSML_TAGS,
} from "@ssml-utilities/core";
import { describe, expect, it } from "vitest";
import { GENERIC_SSML_PROFILE } from "../index";

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
