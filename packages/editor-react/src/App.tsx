import { useRef, useState } from "react";
import { SSMLEditor } from "./SSMLEditor";

const initialSSML = `<speak>
  ここで「で」を入力して Tab 変換を試してください。
</speak>`;

const imeReproSteps = [
  "日本語 IME をオンにして、エディタ内で「で」と入力します。",
  "変換候補を開いたまま Tab を押します。",
  "文字が二重に入らず、下の親 state 表示とも一致していれば修正成功です。",
];

function App() {
  const [ssml, setSSML] = useState(initialSSML);
  const wrapWithTagRef =
    useRef<(tagName: string, attributes?: { [key: string]: string }) => void>();
  const insertPhraseRef = useRef<(text: string) => void>();

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
        <div style={{ width: "100%", maxWidth: "800px", marginBottom: "20px" }}>
          <h1 style={{ marginTop: 0, marginBottom: "12px" }}>
            SSML Editor IME / Tab Repro
          </h1>
          <ol style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.6 }}>
            {imeReproSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
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
          initialValue={ssml}
          onChange={setSSML}
          height="200px"
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
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            marginTop: "20px",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "18px" }}>
            親コンポーネントが受け取った値
          </h2>
          <pre
            style={{
              margin: 0,
              padding: "16px",
              backgroundColor: "#ffffff",
              border: "1px solid #ddd",
              borderRadius: "10px",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {ssml}
          </pre>
        </div>
      </div>
    </>
  );
}

export default App;
