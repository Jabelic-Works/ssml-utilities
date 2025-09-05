// https://github.com/component/textarea-caret-position

// カーソル位置計算のための座標インターフェース
export interface CaretCoordinates {
  top: number;
  left: number;
  height: number;
}

// オプションのインターフェース
export interface CaretOptions {
  debug?: boolean;
}

/**
 * テキストエリア内のカーソル位置を計算する関数
 * @param element 対象のテキストエリアまたは入力要素
 * @param position カーソル位置（selectionStart）
 * @param options オプション
 * @returns カーソル位置の座標
 */
export function getCaretCoordinates(
  element: HTMLInputElement | HTMLTextAreaElement,
  position: number,
  options: CaretOptions = {}
): CaretCoordinates {
  // コピーする必要のあるCSSプロパティのリスト
  const properties = [
    "direction",
    "boxSizing",
    "width",
    "height",
    "overflowX",
    "overflowY",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "borderStyle",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "fontStyle",
    "fontVariant",
    "fontWeight",
    "fontStretch",
    "fontSize",
    "fontSizeAdjust",
    "lineHeight",
    "fontFamily",
    "textAlign",
    "textTransform",
    "textIndent",
    "textDecoration",
    "letterSpacing",
    "wordSpacing",
    "tabSize",
    "MozTabSize",
  ];

  // ブラウザとFirefoxの検出
  const isFirefox =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).mozInnerScreenX !== undefined; // FIXME: types

  if (typeof window === "undefined") {
    throw new Error(
      "textarea-caret-position#getCaretCoordinates should only be called in a browser"
    );
  }

  const debug = options.debug || false;
  if (debug) {
    const el = document.querySelector(
      "#input-textarea-caret-position-mirror-div"
    );
    if (el) el.parentNode?.removeChild(el);
  }

  // テキストエリアのスタイルを複製するミラー要素を作成
  const div = document.createElement("div");
  div.id = "input-textarea-caret-position-mirror-div";
  document.body.appendChild(div);

  const style = div.style;
  const computed = window.getComputedStyle
    ? window.getComputedStyle(element)
    : // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (element as any).currentStyle; // IE < 9用
  const isInput = element.nodeName === "INPUT";

  // デフォルトのテキストエリアスタイル
  style.whiteSpace = "pre-wrap";
  if (!isInput) style.wordWrap = "break-word"; // テキストエリアにのみ適用

  // 画面外に配置
  style.position = "absolute";
  if (!debug) style.visibility = "hidden";

  // 要素のプロパティをdivに転送
  properties.forEach(function (prop) {
    if (isInput && prop === "lineHeight") {
      // <input>の特別な場合の処理（テキストが中央表示される）
      if (computed.boxSizing === "border-box") {
        const height = parseInt(computed.height);
        const outerHeight =
          parseInt(computed.paddingTop) +
          parseInt(computed.paddingBottom) +
          parseInt(computed.borderTopWidth) +
          parseInt(computed.borderBottomWidth);
        const targetHeight = outerHeight + parseInt(computed.lineHeight);
        if (height > targetHeight) {
          style.lineHeight = height - outerHeight + "px";
        } else if (height === targetHeight) {
          style.lineHeight = computed.lineHeight;
        } else {
          style.lineHeight = "0";
        }
      } else {
        style.lineHeight = computed.height;
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style[prop as any] = computed[prop];
    }
  });

  if (isFirefox) {
    // Firefoxのテキストエリアのオーバーフロー表示の問題に対応
    if (element.scrollHeight > parseInt(computed.height))
      style.overflowY = "scroll";
  } else {
    style.overflow = "hidden";
  }

  div.textContent = element.value.substring(0, position);
  // input type="text"の特別処理：スペースを非改行スペースに置き換え
  if (isInput) div.textContent = div.textContent.replace(/\s/g, "\u00a0");

  const span = document.createElement("span");
  // カーソル位置以降のテキストをspan内に配置
  span.textContent = element.value.substring(position) || ".";
  div.appendChild(span);

  const coordinates: CaretCoordinates = {
    top: span.offsetTop + parseInt(computed.borderTopWidth) - element.scrollTop,
    left:
      span.offsetLeft + parseInt(computed.borderLeftWidth) - element.scrollLeft,
    height: parseInt(computed.lineHeight),
  };

  if (debug) {
    span.style.backgroundColor = "#aaa";
  } else {
    document.body.removeChild(div);
  }

  return coordinates;
}
