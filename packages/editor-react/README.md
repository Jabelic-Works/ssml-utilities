# SSML Editor

SSML Editor は、Speech Synthesis Markup Language (SSML)を編集するための React コンポーネントです。シンタックスハイライトと編集機能を提供します。

## インストール

```bash
npm install @ssml-utilities/editor-react
```

## 使用方法

```tsx
import { SSMLEditor } from "@ssml-utilities/editor-react";
import { useState } from "react";

function App() {
  const initialSSML = "<speak>Hello, world!</speak>";
  const [latestSSML, setLatestSSML] = useState(initialSSML);

  return (
    <>
      <SSMLEditor
        initialValue={initialSSML}
        onChange={setLatestSSML}
        width="800px"
        height="400px"
      />
      <pre>{latestSSML}</pre>
    </>
  );
}
```

`initialValue` はマウント時の初期値としてのみ使われます。編集中の最新値を受け取りたい場合は `onChange` を利用してください。

## プロパティ

| プロパティ名 | 型 | 必須 | デフォルト値 | 説明 |
| ------------ | --- | ---- | ------------ | ---- |
| initialValue | string | いいえ | `''` | マウント時の初期値として表示される SSML テキスト |
| onChange | (value: string) => void | いいえ | - | SSML テキストが変更された時に呼び出されるコールバック関数 |
| width | string | いいえ | `'600px'` | エディタの幅 |
| height | string | いいえ | `'500px'` | エディタの高さ |
| onWrapTag | (wrapFn: (tagName: string, attributes?: TagAttributes, selfClosing?: boolean) => void) => void | いいえ | - | タグでテキストを囲む関数を受け取るコールバック |
| wrapTagShortCuts | { tagName: string; shortcut: (e: KeyboardEvent) => boolean; attributes?: TagAttributes; selfClosing?: boolean }[] | いいえ | - | キーボードショートカットの設定 |
| showLineNumbers | boolean | いいえ | `false` | 行番号を表示するかどうか |
| onInsertPhrase | (insertFn: (text: string) => void) => void | いいえ | - | 定型文を挿入する関数を受け取るコールバック |
| embeddeds | { id: string; startKey: string; endKey: string; recommends: { value: string; label: string }[] }[] | いいえ | `[]` | 埋め込み候補の補完設定 |
| autoExpand | boolean | いいえ | - | 内容に応じて高さを自動調整するかどうか |
| minHeight | string | いいえ | - | `autoExpand` 時の最小高さ |
| maxHeight | string | いいえ | - | `autoExpand` 時の最大高さ |

## 機能

- リアルタイムのシンタックスハイライト
- SSML タグの自動補完
- エラー表示
- カスタマイズ可能なスタイリング
- キーボードショートカット
- 日本語 IME 変換中は `Tab` / `Enter` / 矢印キーの既定動作を優先
- タグ属性のサポート

## 例

```tsx
import { SSMLEditor } from "@ssml-utilities/editor-react";

function App() {
  return (
    <SSMLEditor
      initialValue={`<speak>
        <prosody rate="slow" pitch="+2st">
          こんにちは、世界！
        </prosody>
      </speak>`}
      width="100%"
      height="500px"
    />
  );
}
```

## キーボードショートカットの例
```tsx
<SSMLEditor
    wrapTagShortCuts={[
        {
          tagName: "speak",
          shortcut: (e) => e.key === "s" && e.shiftKey && (e.ctrlKey || e.metaKey),
        },
        {
          tagName: "break",
          shortcut: (e) => e.key === "b" && e.shiftKey && (e.ctrlKey || e.metaKey),
          attributes: { time: "200ms" },
          selfClosing: true,
        },
        {
          tagName: "prosody",
          shortcut: (e) => e.key === "p" && e.shiftKey && (e.ctrlKey || e.metaKey),
          attributes: { rate: "120%", pitch: "+2st" },
        }
      ]}
    />
```

IME 変換中はショートカットや補完候補のキー操作よりも、日本語入力側の `Tab` / `Enter` / 矢印キー操作が優先されます。

## タグ属性の使用例
```tsx
function App() {
  const wrapWithTagRef = useRef<(tagName: string, attributes?: TagAttributes) => void>();
  const handleWrapButtonClick = () => {
    wrapWithTagRef.current?.("prosody", {
      rate: "120%",
      pitch: "+2st"
    });
  };
  return (
    <>
      <button onClick={handleWrapButtonClick}>Wrap with prosody</button>
      <SSMLEditor
        onWrapTag={(wrapFn) => {
          wrapWithTagRef.current = wrapFn;
        }}
      />
    </>
  );
}
```

## ライセンス

MIT ライセンスの下で公開されています。詳細は[LICENSE](../../LICENSE)ファイルを参照してください。
