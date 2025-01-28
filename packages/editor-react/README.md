# SSML Editor

SSML Editor は、Speech Synthesis Markup Language (SSML)を編集するための React コンポーネントです。シンタックスハイライトと編集機能を提供します。

## インストール

```bash
npm install @ssml-utilities/editor-react
```

## 使用方法

```tsx
import { SSMLEditor } from "@ssml-utilities/editor-react";

function App() {
  const [ssml, setSSML] = useState("<speak>Hello, world!</speak>");

  return (
    <SSMLEditor
      initialValue={ssml}
      onChange={(value) => setSSML(value)}
      width="800px"
      height="400px"
    />
  );
}
```

## プロパティ

| プロパティ名 | 型                      | 必須   | デフォルト値 | 説明                                                      |
| ------------ | ----------------------- | ------ | ------------ | --------------------------------------------------------- |
| initialValue | string                  | いいえ | `''`         | エディタの初期値として表示される SSML テキスト            |
| onChange     | (value: string) => void | いいえ | -            | SSML テキストが変更された時に呼び出されるコールバック関数 |
| width        | string                  | いいえ | `'600px'`    | エディタの幅                                              |
| height       | string                  | いいえ | `'300px'`    | エディタの高さ                                            |
| onWrapTag | (wrapFn: (tagName: string, attributes?: TagAttributes) => void) => void | いいえ | - | タグでテキストを囲む関数を受け取るコールバック |
| wrapTagShortCuts | { tagName: string; shortcut: (e: KeyboardEvent) => boolean; attributes?: TagAttributes }[] | いいえ | - | キーボードショートカットの設定 |

## 機能

- リアルタイムのシンタックスハイライト
- SSML タグの自動補完
- エラー表示
- カスタマイズ可能なスタイリング
- キーボードショートカット
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
        },
        {
          tagName: "prosody",
          shortcut: (e) => e.key === "p" && e.shiftKey && (e.ctrlKey || e.metaKey),
          attributes: { rate: "120%", pitch: "+2st" },
        }
      ]}
    />
```

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
