import { describe, expect, it } from "vitest";
import { ssmlHighlighter } from "../../index";

const defaultOptions = {
  classes: {
    tag: "tag",
    attribute: "attr",
    attributeValue: "attr-value",
    text: "text",
    unsupportedTag: "unsupported",
    invalidAttribute: "invalid-attribute",
    invalidAttributeValue: "invalid-attribute-value",
    invalidNesting: "invalid-nesting",
    invalidText: "invalid-text",
  },
};

describe("ssmlHighlighter.highlightDetailed", () => {
  it("provider 非対応タグに diagnostics と CSS class を付与する", () => {
    const result = ssmlHighlighter.highlightDetailed(
      '<speak><voice name="ja-JP-NanamiNeural"><mark name="timepoint"/></voice></speak>',
      {
        ...defaultOptions,
        profile: "azure",
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.diagnostics).toEqual([
        expect.objectContaining({
          code: "unsupported-tag",
          tagName: "mark",
        }),
        expect.objectContaining({
          code: "invalid-nesting",
          tagName: "mark",
        }),
      ]);
      expect(result.value.html).toMatch(
        /class="tag [^"]*unsupported[^"]*invalid-nesting[^"]*"/
      );
    }
  });

  it("不正な attribute value を専用 class で強調する", () => {
    const result = ssmlHighlighter.highlightDetailed(
      '<speak version="1.0" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><break strength="loud"/></voice></speak>',
      {
        ...defaultOptions,
        profile: "azure",
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.diagnostics).toEqual([
        expect.objectContaining({
          code: "invalid-attribute-value",
          tagName: "break",
          attributeName: "strength",
        }),
      ]);
      expect(result.value.html).toContain(
        '<span class="attr-value invalid-attribute-value">loud</span>'
      );
    }
  });

  it("text-not-allowed を text span に反映する", () => {
    const result = ssmlHighlighter.highlightDetailed("<speak>Hello</speak>", {
      ...defaultOptions,
      profile: "azure",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.diagnostics).toEqual([
        expect.objectContaining({
          code: "text-not-allowed",
          tagName: "speak",
        }),
      ]);
      expect(result.value.html).toContain(
        '<span class="text invalid-text">Hello</span>'
      );
    }
  });
});
