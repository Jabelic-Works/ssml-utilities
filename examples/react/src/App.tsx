import { SSMLEditor } from "@ssml-utilities/editor-react";
import { useState } from "react";
function App() {
  const [ssml, setSSML] = useState("<speak>Hello, world!</speak>");

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        padding: "0px",
        margin: "0px",
        backgroundColor: "#f0f0f0",
      }}
    >
      <div style={{ width: "800px", height: "400px" }}>
        <SSMLEditor
          initialValue={ssml}
          onChange={(value) => setSSML(value)}
          width="800px"
          height="400px"
        />
      </div>
      <div style={{ marginTop: "40px" }}>{ssml}</div>
    </div>
  );
}
export default App;
