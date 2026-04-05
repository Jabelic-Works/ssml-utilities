import { describe, expect, it } from "vitest";
import { validateSSML } from "../index";

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

  it("Azure profile で speak の xmlns:* 属性を許可する", () => {
    const diagnostics = validateSSML(
      '<speak version="1.0" xml:lang="ja-JP" xmlns:mstts="https://www.w3.org/2001/mstts"><voice name="ja-JP-NanamiNeural">こんにちは</voice></speak>',
      {
        profile: "azure",
      }
    );

    expect(diagnostics).toEqual([]);
  });

  it("Azure profile で voice 配下の backgroundaudio をネスト違反にする", () => {
    const diagnostics = validateSSML(
      '<speak version="1.0" xml:lang="ja-JP"><voice name="ja-JP-NanamiNeural"><mstts:backgroundaudio src="bgm.mp3" /></voice></speak>',
      {
        profile: "azure",
      }
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-nesting",
        tagName: "mstts:backgroundaudio",
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

  it("Google profile で par 直下の text を検出する", () => {
    const diagnostics = validateSSML("<speak><par>hello</par></speak>", {
      profile: "google",
    });

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "text-not-allowed",
        tagName: "par",
      }),
    ]);
  });

  it("Google profile で audio 配下の子タグをネスト違反にする", () => {
    const diagnostics = validateSSML(
      '<speak><audio src="https://example.com/a.mp3"><break time="1s" /></audio></speak>',
      {
        profile: "google",
      }
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-nesting",
        tagName: "break",
      }),
    ]);
  });

  it("Google profile で voice language の不正な BCP47 値を検出する", () => {
    const diagnostics = validateSSML(
      '<speak><voice language="ja_JP">hello</voice></speak>',
      {
        profile: "google",
      }
    );

    expect(diagnostics).toEqual([
      expect.objectContaining({
        code: "invalid-attribute-value",
        tagName: "voice",
        attributeName: "language",
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

  it("profile が off のときは diagnostics を返さない", () => {
    const azureErrors = validateSSML("<speak>Hello</speak>", {
      profile: "azure",
    });
    expect(azureErrors.length).toBeGreaterThan(0);

    expect(
      validateSSML("<speak>Hello</speak>", { profile: "off" })
    ).toEqual([]);
    expect(
      validateSSML("<speak>Hello</speak>", { profile: false })
    ).toEqual([]);
  });
});
