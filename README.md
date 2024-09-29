# SSML Utilities

SSML Utilities は、Speech Synthesis Markup Language (SSML) を扱うための包括的なツールキットです。このプロジェクトは、SSML の編集、ハイライト表示、および関連機能を提供し、開発者が SSML を効率的に操作できるようサポートします。

## パッケージ

SSML Utilities は以下のパッケージを提供しています：

- [@ssml-utilities/editor-react](#ssml-utilitieseditor-react)
- [@ssml-utilities/highlighter](#ssml-utilitieshighlighter)
- [@ssml-utilities/core](#ssml-utilitiescore)

<!-- 各パッケージは個別にインストールして使用することができます。

## インストール

各パッケージを個別にインストールするには、以下のコマンドを使用します：

```bash
npm install @ssml-utilities/highlighter
npm install @ssml-utilities/editor
```

## 使用方法

### @ssml-utilities/highlighter

SSML Highlighter は、SSML テキストを構文ハイライトされた HTML に変換します。

```javascript
import { ssmlHighlighter } from "@ssml-utilities/highlighter";

const ssml = "<speak>Hello <emphasis>world</emphasis>!</speak>";
const highlighted = ssmlHighlighter.highlight(ssml, {
  classes: {
    tag: "ssml-tag",
    attribute: "ssml-attribute",
    attributeValue: "ssml-attribute-value",
    text: "ssml-text",
  },
});

console.log(highlighted);
```

### @ssml-utilities/editor

SSML Editor は、SSML テキストを編集するための React コンポーネントを提供します。

```jsx
import React from "react";
import { SSMLEditor } from "@ssml-utilities/editor";

function App() {
  const [ssml, setSSML] = React.useState("<speak>Hello, world!</speak>");

  return <SSMLEditor value={ssml} onChange={setSSML} highlightEnabled={true} />;
}
```

### API ドキュメント

詳細な API ドキュメントは各パッケージの README を参照してください：

- [@ssml-utilities/highlighter API]()
- [@ssml-utilities/editor API]()

### 貢献

プロジェクトへの貢献を歓迎します。バグ報告、機能リクエスト、プルリクエストなど、どんな形式の貢献も大歓迎です。

貢献する前に、CONTRIBUTING.md をお読みください。

### ライセンス

このプロジェクトは MIT ライセンス の下で公開されています。

### サポート

問題や質問がある場合は、GitHub の Issue トラッカーを使用してください。

SSML Utilities を使用していただきありがとうございます。このツールキットが SSML の操作をより簡単かつ効率的にすることを願っています。
-->
