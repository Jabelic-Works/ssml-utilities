import { useRef, useState } from "react";
import { SSMLEditor, type SSMLEditorDiagnosticsSnapshot } from "./SSMLEditor";

function App() {
  const wrapWithTagRef =
    useRef<(tagName: string, attributes?: { [key: string]: string }) => void>();
  const insertPhraseRef = useRef<(text: string) => void>();
  const [diagnosticsSnapshot, setDiagnosticsSnapshot] =
    useState<SSMLEditorDiagnosticsSnapshot | null>(null);

  const handleWrapButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (wrapWithTagRef.current) {
      wrapWithTagRef.current("prosody", { rate: "120%", pitch: "+2st" });
    }
  };

  const handleInsertPhrase1 = () => {
    insertPhraseRef.current?.(
      "申し訳ありません。もう一度お名前をお願いします。"
    );
  };

  const handleInsertPhrase2 = () => {
    insertPhraseRef.current?.("ご利用ありがとうございました。");
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          width: "100vw",
          padding: "24px",
          margin: "0px",
          backgroundColor: "#f0f0f0",
          boxSizing: "border-box",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <button
            onClick={handleWrapButtonClick}
            style={{ marginRight: "10px" }}
          >
            Wrap with prosody
          </button>
          <button onClick={handleInsertPhrase1} style={{ marginRight: "10px" }}>
            名前確認
          </button>
          <button onClick={handleInsertPhrase2}>お礼</button>
        </div>
        <SSMLEditor
          initialValue="<speak>Hello, world!</speak>"
          height="200px"
          validationProfile="azure"
          onDiagnosticsChange={setDiagnosticsSnapshot}
          onWrapTag={(wrapFn) => {
            wrapWithTagRef.current = wrapFn;
          }}
          onInsertPhrase={(insertFn) => {
            insertPhraseRef.current = insertFn;
          }}
          wrapTagShortCuts={[
            {
              tagName: "speak",
              shortcut: (e) =>
                e.key === "s" && e.shiftKey && (e.ctrlKey || e.metaKey),
            },
            {
              tagName: "break",
              shortcut: (e) =>
                e.key === "." && e.shiftKey && (e.ctrlKey || e.metaKey),
              attributes: {
                time: "200ms",
              },
              selfClosing: true,
            },
            {
              tagName: "emphasis",
              shortcut: (e) =>
                e.key === "e" && e.shiftKey && (e.ctrlKey || e.metaKey),
              attributes: {
                level: "moderate",
              },
            },
            {
              tagName: "prosody",
              shortcut: (e) =>
                e.key === "p" && e.shiftKey && (e.ctrlKey || e.metaKey),
              attributes: {
                rate: "120%",
                pitch: "+2st",
              },
            },
            {
              tagName: "phoneme",
              shortcut: (e) =>
                e.key === "f" && e.shiftKey && (e.ctrlKey || e.metaKey),
            },
          ]}
          embeddeds={[
            {
              id: "name",
              startKey: "{{",
              endKey: "}}",
              recommends: [
                {
                  value: "low",
                  label: "低",
                },
                {
                  value: "middle",
                  label: "中",
                },
                {
                  value: "high",
                  label: "高",
                },
              ],
            },
          ]}
        />
        {diagnosticsSnapshot && (
          <div
            style={{
              width: "100%",
              maxWidth: "720px",
              marginTop: "16px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              backgroundColor: "#fff",
              padding: "12px 16px",
              fontFamily: "monospace",
              fontSize: "12px",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "8px" }}>
              Validation（onDiagnosticsChange）:{" "}
              {diagnosticsSnapshot.diagnostics.length} 件
              {!diagnosticsSnapshot.highlightOk && (
                <span style={{ color: "#b42318", marginLeft: "8px" }}>
                  highlight エラー: {diagnosticsSnapshot.highlightError}
                </span>
              )}
            </div>
            {diagnosticsSnapshot.diagnostics.length === 0 ? (
              <div style={{ color: "#475467" }}>問題なし</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: "18px" }}>
                {diagnosticsSnapshot.diagnostics.map((d, index) => (
                  <li
                    key={`${d.code}-${d.span.start.offset}-${index}`}
                    style={{
                      color: d.severity === "error" ? "#b42318" : "#b54708",
                      marginBottom:
                        index + 1 === diagnosticsSnapshot.diagnostics.length
                          ? 0
                          : "6px",
                    }}
                  >
                    <strong>{d.severity.toUpperCase()}</strong>: {d.message}{" "}
                    (L{d.span.start.line}:C{d.span.start.column})
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
