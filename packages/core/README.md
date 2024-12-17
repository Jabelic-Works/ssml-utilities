# @ssml-utilities/core

SSMLユーティリティの中核機能を提供するパッケージです。SSML（Speech Synthesis Markup Language）の解析、DAG（有向非巡回グラフ）の構築、および基本的なユーティリティ機能を提供します。

## インストール

```bash
npm install @ssml-utilities/core
```

または

```bash
pnpm add @ssml-utilities/core
```

## 主な機能

- SSMLの解析
- DAG（有向非巡回グラフ）の構築と操作
- Result型を使用したエラーハンドリング

## 使用方法

### SSMLの解析

```typescript
import { parseSSML } from "@ssml-utilities/core";

const ssml = "<speak>Hello <emphasis>world</emphasis>!</speak>";
const result = parseSSML(ssml);

if (result.ok) {
  const dag = result.value;
  // DAGを使用した処理
}
```

### DAGの操作

```typescript
import { SSMLDAG } from "@ssml-utilities/core";

const dag = new SSMLDAG();
const nodeResult = dag.createNode("element", "speak", "<speak>");

if (nodeResult.ok) {
  const node = nodeResult.value;
  // ノードを使用した処理
}
```

## API

### DAGNode型

DAGのノードを表す型です：

```typescript
interface DAGNode {
  id: string;
  type: "root" | "element" | "text" | "attribute";
  name?: string;
  value?: string;
  children: Set<string>;
  parents: Set<string>;
}
```

### Result型

エラーハンドリングのための型を提供します：

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

## デバッグ

DAGの構造を確認するためのデバッグ機能を提供しています：

```typescript
import { debugParseSSML } from "@ssml-utilities/core";

const debug = debugParseSSML("<speak>Hello, world!</speak>");
console.log(debug); // DAG構造を表示
```


## ライセンス

MITライセンスの下で公開されています。詳細は[LICENSE](https://github.com/Jabelic-Works/ssml-utilities/blob/master/LICENCE)ファイルを参照してください。

## 関連パッケージ

- [@ssml-utilities/editor-react](https://github.com/Jabelic-Works/ssml-utilities/tree/master/packages/editor-react)
- [@ssml-utilities/highlighter](https://github.com/Jabelic-Works/ssml-utilities/tree/master/packages/highlighter)
