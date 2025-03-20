import React, { useState, useEffect, useRef } from "react";
import { ssmlHighlighter, HighlightOptions } from "@ssml-utilities/highlighter";
import { getCaretCoordinates } from "./textareaCaretPosition";

interface SSMLEditorProps {
  initialValue?: string;
  onChange?: (value: string) => void;
  width?: string;
  height?: string;
  onWrapTag?: (
    wrapFn: (
      tagName: string,
      attributes?: TagAttributes,
      selfClosing?: boolean
    ) => void
  ) => void;
  wrapTagShortCuts?: {
    tagName: string;
    shortcut: (e: React.KeyboardEvent<HTMLTextAreaElement>) => boolean;
    attributes?: TagAttributes;
    selfClosing?: boolean;
  }[];
  showLineNumbers?: boolean;
  onInsertPhrase?: (insertFn: (text: string) => void) => void;
  embeddeds?: {
    id: string;
    startKey: string;
    endKey: string;
    recommends: {
      value: string;
      label: string;
    }[];
  }[];
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
  onInsertPhrase,
  embeddeds = [],
}) => {
  const [ssml, setSSML] = useState(initialValue);
  const [highlightedHtml, setHighlightedHtml] = useState("");
  const [lineNumbers, setLineNumbers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<
    { value: string; label: string }[]
  >([]);
  const [suggestionPosition, setSuggestionPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

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

  // 定型文挿入関数を受け取る
  useEffect(() => {
    if (onInsertPhrase) onInsertPhrase(insertPhrase);
  }, [onInsertPhrase]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setSSML(newValue);
    onChange && onChange(newValue);
    checkForEmbeddedCompletion(newValue);
  };

  const checkForEmbeddedCompletion = (value: string) => {
    if (textareaRef.current && embeddeds.length > 0) {
      const pos = textareaRef.current.selectionStart;
      const textBeforeCursor = value.slice(0, pos);
      for (const embed of embeddeds) {
        const { startKey, endKey, recommends } = embed;
        const startIndex = textBeforeCursor.lastIndexOf(startKey);
        if (
          startIndex !== -1 &&
          textBeforeCursor.indexOf(endKey, startIndex) === -1
        ) {
          const currentPrefix = textBeforeCursor.slice(
            startIndex + startKey.length
          );
          const filtered = recommends.filter((candidate) =>
            candidate.value.startsWith(currentPrefix)
          );
          if (filtered.length > 0) {
            // カーソル位置の座標を取得
            const caretCoords = getCaretCoordinates(textareaRef.current, pos);
            const textRect = textareaRef.current.getBoundingClientRect();
            const parentRect =
              textareaRef.current.parentElement?.getBoundingClientRect() || {
                top: 0,
                left: 0,
              };

            // テキストエリア内のカーソル位置を画面上の座標に変換
            const top =
              textRect.top -
              parentRect.top +
              caretCoords.top +
              caretCoords.height;
            const left = textRect.left - parentRect.left + caretCoords.left;

            setSuggestionPosition({ top, left });
            setSuggestions(filtered);
            setActiveSuggestionIndex(0);
            return;
          }
        }
      }
    }
    setSuggestions([]);
    setSuggestionPosition(null);
  };

  const applySuggestion = (candidate: { value: string; label: string }) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBeforeCursor = ssml.slice(0, pos);
    for (const embed of embeddeds) {
      const { startKey, endKey } = embed;
      const startIndex = textBeforeCursor.lastIndexOf(startKey);
      if (
        startIndex !== -1 &&
        textBeforeCursor.indexOf(endKey, startIndex) === -1
      ) {
        const newValue =
          ssml.slice(0, startIndex + startKey.length) +
          candidate.value +
          endKey +
          ssml.slice(pos);
        setSSML(newValue);
        onChange && onChange(newValue);
        setSuggestions([]);
        setSuggestionPosition(null);
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart =
              textareaRef.current.selectionEnd =
                startIndex + startKey.length + candidate.value.length;
            textareaRef.current.focus();
          }
        }, 0);
        return;
      }
    }
  };

  const syncScroll = () => {
    requestAnimationFrame(() => {
      if (textareaRef.current && highlightRef.current) {
        highlightRef.current.scrollTop = textareaRef.current.scrollTop;
        highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
      }
    });
  };

  const wrapSelectionWithTag = (
    tagName: string,
    attributes?: TagAttributes,
    selfClosing?: boolean
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

      if (selfClosing) {
        // 自己閉じタグの場合
        const tag = `<${tagName}${attributesStr}/>`;
        const newValue = ssml.substring(0, start) + tag + ssml.substring(end);

        setSSML(newValue);
        onChange?.(newValue);

        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart =
              textareaRef.current.selectionEnd = start + tag.length;
          }
          textareaRef.current?.focus();
        });
      } else {
        // 通常のタグの場合（既存のロジック）
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
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) =>
          prev + 1 < suggestions.length ? prev + 1 : prev
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        applySuggestion(suggestions[activeSuggestionIndex]);
        return;
      }
    }

    const shortcutMatch = wrapTagShortCuts?.find((wrapTagShortCut) =>
      wrapTagShortCut.shortcut(e)
    );

    if (shortcutMatch) {
      e.preventDefault();
      wrapSelectionWithTag(
        shortcutMatch.tagName,
        shortcutMatch.attributes,
        shortcutMatch.selfClosing
      );
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

  const insertPhrase = (text: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const newValue = ssml.substring(0, start) + text + ssml.substring(start);

      setSSML(newValue);
      onChange?.(newValue);

      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newPosition = start + text.length;
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = newPosition;
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
    scrollBehavior: "revert",
    border: "none",
    textAlign: "left",
    whiteSpace: "pre-wrap",
    overflow: "auto",
  };

  return (
    <div
      style={{
        position: "relative",
        height,
        width,
      }}
    >
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
                lineHeight: "1.5",
                padding: "0 5px",
              }}
            >
              {num}
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          position: "relative",
          height: "100%",
          marginLeft: showLineNumbers ? "30px" : "0",
        }}
      >
        <div
          ref={highlightRef}
          style={{
            ...commonStyles,
            backgroundColor: "#f5f5f5",
            pointerEvents: "none",
            border: "1px solid #ddd",
            borderRadius: showLineNumbers ? "0px 10px 10px 0px" : "10px",
          }}
          onScroll={(e) => {
            requestAnimationFrame(() => {
              if (textareaRef.current && e.currentTarget) {
                textareaRef.current.scrollTop = e.currentTarget.scrollTop;
                textareaRef.current.scrollLeft = e.currentTarget.scrollLeft;
                if (lineNumbersRef.current) {
                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }
            });
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
      {suggestions.length > 0 && suggestionPosition && (
        <div
          style={{
            position: "absolute",
            top: suggestionPosition.top,
            left: suggestionPosition.left,
            background: "white",
            border: "1px solid #ccc",
            zIndex: 1000,
          }}
        >
          {suggestions.map((s, index) => (
            <div
              key={s.value}
              style={{
                padding: "4px 8px",
                background: index === activeSuggestionIndex ? "#eee" : "white",
                cursor: "pointer",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(s);
              }}
            >
              {s.label}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .ssml-tag { color: #000fff; }
        .ssml-attribute { color: #FFA500; }
        .ssml-attribute-value { color: #008000; }
        .ssml-text { color: #000; }
        
        div[dangerouslySetInnerHTML] span {
          text-align: left;
          display: inline;
        }
        textarea::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
