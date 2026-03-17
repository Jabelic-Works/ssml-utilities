import { SSMLEditor } from "@ssml-utilities/editor-react";
import { useState } from "react";

function App() {
  const [ssml, setSSML] = useState("<speak>Hello, world!</speak>");

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
      <div style={{ width: "100%", maxWidth: "800px", height: "400px", margin: "0 auto" }}>
        <SSMLEditor
          initialValue="<speak>Hello, world!</speak>"
          onChange={setSSML}
          width="100%"
          height="400px"
        />
      </div>
      <div style={{ width: "100%", maxWidth: "800px", margin: "24px auto 0" }}>
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
