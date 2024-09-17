import React from "react";
import "./App.css";
import { SSMLEditor } from "./SSMLEditor";

function App() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          padding: "0px",
          margin: "0px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <SSMLEditor />
      </div>
    </>
  );
}

export default App;
