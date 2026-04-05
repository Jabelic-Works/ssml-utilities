import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SSMLEditor } from "../src/SSMLEditor";

const { highlightDetailedMock } = vi.hoisted(() => ({
  highlightDetailedMock: vi.fn(),
}));

vi.mock("@ssml-utilities/highlighter", () => ({
  ssmlHighlighter: {
    highlightDetailed: highlightDetailedMock,
  },
}));

const azureDiagnostic = {
  code: "unsupported-tag" as const,
  severity: "error" as const,
  message: "Tag <mark> is not supported by the selected validation profile.",
  span: {
    start: { offset: 7, line: 1, column: 8 },
    end: { offset: 13, line: 1, column: 14 },
  },
  tagName: "mark",
};

describe("SSMLEditor", () => {
  beforeEach(() => {
    highlightDetailedMock.mockReset();
    highlightDetailedMock.mockImplementation(
      (_ssml: string, options: { profile?: string | false }) => ({
        ok: true as const,
        value: {
          html: "<div>mock highlight</div>",
          diagnostics: options.profile === "azure" ? [azureDiagnostic] : [],
        },
      })
    );
  });

  it("validationProfile 未指定時は off を使い diagnostics snapshot を通知する", async () => {
    const onDiagnosticsChange = vi.fn();
    const onChange = vi.fn();

    render(
      <SSMLEditor
        initialValue="<speak>Hello</speak>"
        onChange={onChange}
        onDiagnosticsChange={onDiagnosticsChange}
      />
    );

    const textarea = screen.getByRole("textbox");

    await waitFor(() => {
      expect(onDiagnosticsChange).toHaveBeenCalled();
    });

    expect(highlightDetailedMock).toHaveBeenCalledWith(
      "<speak>Hello</speak>",
      expect.objectContaining({ profile: "off" })
    );
    expect(onDiagnosticsChange.mock.lastCall?.[0]).toMatchObject({
      ssml: "<speak>Hello</speak>",
      diagnostics: [],
      highlightOk: true,
    });

    fireEvent.change(textarea, { target: { value: "<speak>Updated</speak>" } });

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith("<speak>Updated</speak>");
      expect(onDiagnosticsChange.mock.lastCall?.[0]).toMatchObject({
        ssml: "<speak>Updated</speak>",
        diagnostics: [],
        highlightOk: true,
      });
    });

    expect(highlightDetailedMock).toHaveBeenLastCalledWith(
      "<speak>Updated</speak>",
      expect.objectContaining({ profile: "off" })
    );
  });

  it("validationProfile を highlighter に渡し diagnostics を親へ返す", async () => {
    const onDiagnosticsChange = vi.fn();

    render(
      <SSMLEditor
        initialValue={'<speak><mark name="timepoint" /></speak>'}
        validationProfile="azure"
        onDiagnosticsChange={onDiagnosticsChange}
      />
    );

    await waitFor(() => {
      expect(onDiagnosticsChange).toHaveBeenCalled();
    });

    expect(highlightDetailedMock).toHaveBeenCalledWith(
      "<speak><mark name=\"timepoint\" /></speak>",
      expect.objectContaining({ profile: "azure" })
    );
    expect(onDiagnosticsChange.mock.lastCall?.[0]).toMatchObject({
      diagnostics: [expect.objectContaining({ code: "unsupported-tag" })],
      highlightOk: true,
    });
  });

  it("onWrapTag で受け取った関数が選択範囲をタグで囲む", async () => {
    const onChange = vi.fn();
    let wrapTag:
      | ((
          tagName: string,
          attributes?: Record<string, string>,
          selfClosing?: boolean
        ) => void)
      | undefined;

    render(
      <SSMLEditor
        initialValue="hello"
        onChange={onChange}
        onWrapTag={(wrapFn) => {
          wrapTag = wrapFn;
        }}
      />
    );

    await waitFor(() => {
      expect(wrapTag).toBeDefined();
    });

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(0, 5);

    act(() => {
      wrapTag?.("prosody", { rate: "slow" });
    });

    expect(textarea).toHaveValue('<prosody rate="slow">hello</prosody>');
    expect(onChange).toHaveBeenLastCalledWith(
      '<prosody rate="slow">hello</prosody>'
    );
  });

  it("onInsertPhrase で受け取った関数がカーソル位置へ文字列を挿入する", async () => {
    const onChange = vi.fn();
    let insertPhrase: ((text: string) => void) | undefined;

    render(
      <SSMLEditor
        initialValue="<speak></speak>"
        onChange={onChange}
        onInsertPhrase={(insertFn) => {
          insertPhrase = insertFn;
        }}
      />
    );

    await waitFor(() => {
      expect(insertPhrase).toBeDefined();
    });

    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange("<speak>".length, "<speak>".length);

    act(() => {
      insertPhrase?.("hello");
    });

    expect(textarea).toHaveValue("<speak>hello</speak>");
    expect(onChange).toHaveBeenLastCalledWith("<speak>hello</speak>");
  });
});
