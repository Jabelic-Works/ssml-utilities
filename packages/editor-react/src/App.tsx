import { useRef, useState } from "react";
import { SSMLEditor } from "./SSMLEditor";

function App() {
  const [ssml, setSSML] = useState("");
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
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          padding: "0px",
          margin: "0px",
          backgroundColor: "#f0f0f0",
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
                { value: "山田", label: "山田" },
                { value: "田中", label: "田中" },
                { value: "佐藤", label: "佐藤" },
              ],
            },
          ]}
        />
      </div>
    </>
  );
}

export default App;
