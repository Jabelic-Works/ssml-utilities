import { SSMLEditor } from "@ssml-utilities/editor-react";
import { useRef } from "react";

type TagAttributes = Record<string, string>;
type WrapTagFn = (
  tagName: string,
  attributes?: TagAttributes,
  selfClosing?: boolean
) => void;
type InsertPhraseFn = (text: string) => void;

const initialSSML = `<speak>
  こんにちは、<emphasis level="moderate">世界</emphasis>。
</speak>`;

function App() {
  const wrapWithTagRef = useRef<WrapTagFn>();
  const insertPhraseRef = useRef<InsertPhraseFn>();

  const handleWrapButtonClick = () => {
    wrapWithTagRef.current?.("prosody", { rate: "120%", pitch: "+2st" });
  };

  const handleInsertNamePrompt = () => {
    insertPhraseRef.current?.(
      "申し訳ありません。もう一度お名前をお願いします。"
    );
  };

  const handleInsertThanks = () => {
    insertPhraseRef.current?.("ご利用ありがとうございました。");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        padding: "32px",
        margin: "0px",
        backgroundColor: "#f0f0f0",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            marginBottom: "20px",
          }}
        >
          <button onClick={handleWrapButtonClick}>Wrap with prosody</button>
          <button onClick={handleInsertNamePrompt}>名前確認</button>
          <button onClick={handleInsertThanks}>お礼</button>
        </div>

        <SSMLEditor
          initialValue={initialSSML}
          width="100%"
          height="320px"
          onWrapTag={(wrapFn) => {
            wrapWithTagRef.current = wrapFn;
          }}
          onInsertPhrase={(insertFn) => {
            insertPhraseRef.current = insertFn;
          }}
          wrapTagShortCuts={[
            {
              tagName: "speak",
              shortcut: (event) =>
                event.key === "s" &&
                event.shiftKey &&
                (event.ctrlKey || event.metaKey),
            },
            {
              tagName: "break",
              shortcut: (event) =>
                event.key === "." &&
                event.shiftKey &&
                (event.ctrlKey || event.metaKey),
              attributes: {
                time: "200ms",
              },
              selfClosing: true,
            },
            {
              tagName: "emphasis",
              shortcut: (event) =>
                event.key === "e" &&
                event.shiftKey &&
                (event.ctrlKey || event.metaKey),
              attributes: {
                level: "moderate",
              },
            },
            {
              tagName: "prosody",
              shortcut: (event) =>
                event.key === "p" &&
                event.shiftKey &&
                (event.ctrlKey || event.metaKey),
              attributes: {
                rate: "120%",
                pitch: "+2st",
              },
            },
          ]}
          embeddeds={[
            {
              id: "intensity",
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
      </div>
    </div>
  );
}

export default App;
