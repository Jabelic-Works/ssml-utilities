# @ssml-utilities/core

SSML ユーティリティの中核機能を提供するパッケージです。SSML（Speech Synthesis Markup Language）の解析、DAG（有向非巡回グラフ）の構築、および基本的なユーティリティ機能を提供します。

## インストール

```
npm install @ssml-utilities/core
```

## 主な機能

- SSML の解析
- DAG（有向非巡回グラフ）の構築と操作
- 結果型（Result）を使用したエラーハンドリング
- SSML タグのインターフェース定義

## 使用方法

### SSML の解析

```ts
import { parseSSML } from "@ssml-utilities/core";
const ssml = "<speak>Hello <emphasis>world</emphasis>!</speak>";
const result = parseSSML(ssml);
if (result.ok) {
  const dag = result.value;
  // DAGを使用した処理
}
```

### DAG の操作

```ts
import { SSMLDAG } from "@ssml-utilities/core";
const dag = new SSMLDAG();
const nodeResult = dag.createNode("element", "speak", "<speak>");
if (nodeResult.ok) {
  const node = nodeResult.value;
  // ノードを使用した処理
}
```

## インターフェース

### Speech

SSML タグの基本インターフェースを提供します：

```ts
interface Speech {
  say(text: string): string;
  pause(time: string): string;
  emphasis(level: "strong" | "moderate" | "reduced", text: string): string;
  prosody(options: ProsodyOptions, text: string): string;
}
```

### Result 型

エラーハンドリングのための型を提供します：

```ts
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

## ライセンス

MIT ライセンスの下で公開されています。詳細は[LICENSE](https://github.com/Jabelic-Works/ssml-utilities/blob/master/LICENCE)ファイルを参照してください。
