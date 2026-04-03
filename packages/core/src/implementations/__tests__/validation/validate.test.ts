import { describe, expect, it } from "vitest";
import { validateSSML } from "../../validation";

describe("validateSSML", () => {
  it("Azure profile で許可される構造はエラーにしない", () => {
    const diagnostics = validateSSML(
      '<speak version="1.0" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><emphasis level="moderate">こんにちは</emphasis></voice></speak>',
      {
        profile: "azure",
      }
    );

    expect(diagnostics).toEqual([]);
  });

  it("Azure profile で speak 直下の text を検出する", () => {
    const diagnostics = validateSSML("<speak>Hello</speak>", {
      profile: "azure",
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "text-not-allowed",
        tagName: "speak",
      }),
    ]);
  });

  it("provider 非対応タグを検出する", () => {
    const diagnostics = validateSSML(
      '<speak><voice name="ja-JP-NanamiNeural"><mark name="timepoint"/></voice></speak>',
      {
        profile: "azure",
      }
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "unsupported-tag",
        tagName: "mark",
      }),
      expect.objectContaining({
        code: "invalid-nesting",
        tagName: "mark",
      }),
    ]);
  });

  it("不正な属性名と属性値を検出する", () => {
    const diagnostics = validateSSML(
      '<speak version="1.0" xml:lang="ja-JP"><voice foo="bar"><break strength="loud"/></voice></speak>',
      {
        profile: "azure",
      }
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-attribute",
        tagName: "voice",
        attributeName: "foo",
      }),
      expect.objectContaining({
        code: "invalid-attribute-value",
        tagName: "break",
        attributeName: "strength",
      }),
    ]);
  });

  it("Google profile の media timing value を検証する", () => {
    const diagnostics = validateSSML(
      '<speak><par><media begin="soon"><speak>hello</speak></media></par></speak>',
      {
        profile: "google",
      }
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-attribute-value",
        tagName: "media",
        attributeName: "begin",
      }),
    ]);
  });

  it("閉じタグの不整合を検出する", () => {
    const diagnostics = validateSSML("<speak><voice></speak></voice>", {
      profile: "generic",
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-nesting",
        tagName: "speak",
      }),
      expect.objectContaining({
        code: "unclosed-tag",
        tagName: "voice",
      }),
      expect.objectContaining({
        code: "unexpected-closing-tag",
        tagName: "voice",
      }),
    ]);
  });
});
