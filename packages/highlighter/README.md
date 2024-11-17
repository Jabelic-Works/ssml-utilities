# SSML Highlighter

SSML Highlighter は、Speech Synthesis Markup Language (SSML)のシンタックスハイライトを提供するパッケージです。

## インストール

```bash
npm install @ssml-utilities/highlighter
```

## 使用方法

```typescript
import { ssmlHighlighter } from "@ssml-utilities/highlighter";
const ssml = "<speak>Hello <emphasis>world</emphasis>!</speak>";
const options = {
  classes: {
    tag: "ssml-tag",
    attribute: "ssml-attribute",
    attributeValue: "ssml-attribute-value",
    text: "ssml-text",
  },
};
const result = ssmlHighlighter.highlight(ssml, options);

if (result.ok) {
  console.log(result.value);
}
```

## オプション

`HighlightOptions`インターフェースで以下のオプションを設定できます：

```typescript
interface HighlightOptions {
  classes: {
    tag: string; // タグ要素の CSS クラス名
    attribute: string; // 属性名の CSS クラス名
    attributeValue: string; // 属性値の CSS クラス名
    text: string; // テキストコンテンツの CSS クラス名
  };
}
```

## デフォルトのスタイル

以下のような CSS を適用することで、基本的なハイライトスタイルを設定できます：

```css
.ssml-tag {
  color: #000fff;
}
.ssml-attribute {
  color: #ffa500;
}
.ssml-attribute-value {
  color: #008000;
}
.ssml-text {
  color: #000;
}
```

## 機能

- SSML タグのシンタックスハイライト
- 属性と属性値の区別
- HTML エスケープ処理
- エラーハンドリング

## エラーハンドリング

highlight メソッドは`Result`型を返します：

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

エラーが発生した場合は、`ok: false`と`error`メッセージが返されます。

## 使用例

ネストされた SSML のハイライト：

```typescript
const complexSSML = (
  <speak>
    {" "}
    <prosody rate="slow" pitch="+2st">
      {" "}
      こんにちは、 <emphasis level="strong">世界</emphasis>！{" "}
    </prosody>
  </speak>
);
const result = ssmlHighlighter.highlight(complexSSML, options);
```

MIT ライセンスの下で公開されています。詳細は[LICENSE](https://github.com/Jabelic-Works/ssml-utilities/blob/master/LICENCE)ファイルを参照してください。
