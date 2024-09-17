import React, { useState, useEffect, useRef } from "react";
import { ssmlHighlighter, HighlightOptions } from "@ssml-utilities/core";

interface SSMLEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
}

export const SSMLEditor: React.FC<SSMLEditorProps> = ({
  initialValue = "",
  onChange,
}) => {
  const [ssml, setSSML] = useState(initialValue);
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const highlightOptions: HighlightOptions = {
    classes: {
      tag: "ssml-tag",
      attribute: "ssml-attribute",
      attributeValue: "ssml-attribute-value",
      text: "ssml-text",
    },
    indentation: 2,
  };

  useEffect(() => {
    const highlighted = ssmlHighlighter.highlight(ssml, highlightOptions);
    setHighlightedHtml(highlighted);
    console.log(highlighted);
    onChange && onChange(ssml);
    syncScroll();
  }, [ssml, onChange]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSSML(e.target.value);
  };

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = ssml.substring(0, start) + "  " + ssml.substring(end);
      setSSML(newValue);
      // カーソル位置を更新
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const commonStyles: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "1.5",
    padding: "10px",
    margin: "0",
    border: "1px solid #ddd",
    borderRadius: "4px",
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    overflow: "auto",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    textAlign: "left",
  };

  return (
    <div style={{ position: "relative", height: "300px", width: "400px" }}>
      <div
        ref={highlightRef}
        style={{
          ...commonStyles,
          backgroundColor: "#f5f5f5",
          pointerEvents: "none",
        }}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
      <textarea
        ref={textareaRef}
        value={ssml}
        onChange={handleInput}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        style={{
          ...commonStyles,
          backgroundColor: "transparent",
          color: "transparent",
          caretColor: "black",
          resize: "none",
          zIndex: 1,
        }}
        spellCheck="false"
      />
      <style>{`
        .ssml-tag { color: #000fff; }
        .ssml-attribute { color: #FFA500; }
        .ssml-attribute-value { color: #008000; }
        .ssml-text { color: #000; }
        
        /* Ensure left alignment for all span elements */
        div[dangerouslySetInnerHTML] span {
          text-align: left;
          display: inline;
        }
      `}</style>
    </div>
  );
};
