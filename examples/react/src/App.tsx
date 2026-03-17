import { SSMLEditor } from "@ssml-utilities/editor-react";
import { useState } from "react";


function App() {
  const [ssml, setSSML] = useState("");

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
      <div style={{ width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ marginTop: 0, marginBottom: "12px" }}>
          SSML Editor IME / Tab Repro
        </h1>
      </div>
      <div style={{ width: "100%", maxWidth: "800px", height: "400px", margin: "0 auto" }}>
        <SSMLEditor
          initialValue={ssml}
          onChange={setSSML}
          width="100%"
          height="400px"
        />
      </div>
      <div style={{ width: "100%", maxWidth: "800px", margin: "24px auto 0" }}>
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
  );
}
export default App;
