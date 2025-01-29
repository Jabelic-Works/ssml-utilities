import React, { useState, useEffect, useRef } from "react";
import { ssmlHighlighter, HighlightOptions } from "@ssml-utilities/highlighter";

interface SSMLEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  width?: string;
  height?: string;
  onWrapTag?: (
    wrapFn: (tagName: string, attributes?: TagAttributes) => void
  ) => void;
  wrapTagShortCuts?: {
    tagName: string;
    shortcut: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
    attributes?: TagAttributes;
  }[];
  showLineNumbers?: boolean;
}

interface TagAttributes {
  [key: string]: string;
}

export const SSMLEditor: React.FC<SSMLEditorProps> = ({
  initialValue = "",
  onChange,
  width = "600px",
  height = "500px",
  onWrapTag,
  wrapTagShortCuts,
  showLineNumbers = false,
}) => {
  const [ssml, setSSML] = useState(initialValue);
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // タグをラップする関数を受け取る
  useEffect(() => {
    if (onWrapTag) onWrapTag(wrapSelectionWithTag);
  }, [onWrapTag]);

  // ハイライトを更新する
  useEffect(() => {
    const options: HighlightOptions = {
      classes: {
        tag: "ssml-tag",
        attribute: "ssml-attribute",
        attributeValue: "ssml-attribute-value",
        text: "ssml-text",
      },
      indentation: 2,
    };

    const highlightResult = ssmlHighlighter.highlight(ssml, options);

    if (highlightResult.ok) {
      setHighlightedHtml(highlightResult.value);
    } else {
      console.error("Error highlighting SSML:", highlightResult.error);
      setHighlightedHtml(
        `<span class="error">Error: ${highlightResult.error}</span>`
      );
    }

    // 実際の改行のみを使用して行番号を生成
    const lines = ssml.split("\n");
    setLineNumbers(lines.map((_, i) => (i + 1).toString()));
  }, [ssml]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSSML(e.target.value);
    onChange && onChange(e.target.value);
  };

  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current && lineNumbersRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const wrapSelectionWithTag = (
    tagName: string,
    attributes?: TagAttributes
  ) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = ssml.substring(start, end);

      // 属性文字列の生成
      const attributesStr = attributes
        ? Object.entries(attributes)
            .map(([key, value]) => ` ${key}="${value}"`)
            .join("")
        : "";

      const openTag = `<${tagName}${attributesStr}>`;
      const closeTag = `</${tagName}>`;
      const newValue =
        ssml.substring(0, start) +
        openTag +
        selectedText +
        closeTag +
        ssml.substring(end);

      setSSML(newValue);
      onChange?.(newValue);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start + openTag.length;
          textareaRef.current.selectionEnd = end + openTag.length;
        }
        textareaRef.current?.focus();
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // ショートカットの処理を最初に行う
    const shortcutMatch = wrapTagShortCuts?.find((wrapTagShortCut) =>
      wrapTagShortCut.shortcut(e)
    );

    if (shortcutMatch) {
      e.preventDefault();
      wrapSelectionWithTag(shortcutMatch.tagName, shortcutMatch.attributes);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = ssml.substring(0, start) + "  " + ssml.substring(end);
      setSSML(newValue);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 2;
        }
        textareaRef.current?.focus();
      });
    }
  };

  const commonStyles: React.CSSProperties = {
    fontFamily: "monospace",
    fontSize: "14px",
    lineHeight: "1.5",
    padding: "10px",
    margin: "0",
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    border: "none",
    textAlign: "left",
  };

  return (
    <div style={{ position: "relative", height, width }}>
      {showLineNumbers && (
        <div
          ref={lineNumbersRef}
          style={{
            width: "auto",
            borderRight: "none",
            paddingLeft: "auto",
            marginLeft: "auto",
            textAlign: "right",
            color: "#6b6b6b",
            border: "1px solid #ddd",
            borderRadius: "10px 0px 0px 10px",
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "1.5",
            padding: "10px",
            margin: "0",
            position: "absolute",
            top: "0",
            left: "0",
            height: "100%",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
          }}
        >
          {lineNumbers.map((num) => (
            <div
              key={num}
              style={{
                display: "block",
                minHeight: "1.5em",
              }}
            >
              {num}
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          left: showLineNumbers ? "30px" : "0",
          top: "0",
          right: "0",
          bottom: "0",
        }}
      >
        <div
          ref={highlightRef}
          style={{
            ...commonStyles,
            backgroundColor: "#f5f5f5",
            pointerEvents: "none",
            whiteSpace: "pre-wrap",
            left: "0",
            border: "1px solid #ddd",
            borderRadius: "0px 10px 10px 0px",
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
            left: "0",
            outline: "none",
          }}
          spellCheck="false"
        />
      </div>
      <style>{`
        .ssml-tag { color: #000fff; }
        .ssml-attribute { color: #FFA500; }
        .ssml-attribute-value { color: #008000; }
        .ssml-text { color: #000; }
        
        div[dangerouslySetInnerHTML] span {
          text-align: left;
          display: inline;
        }
      `}</style>
    </div>
  );
};
