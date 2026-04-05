# @ssml-utilities/tag-remover

SSML (Speech Synthesis Markup Language) からタグを削除してプレーンテキストを抽出するためのユーティリティライブラリです。

## 特徴

- ✅ **DAG ベースの高精度解析** - @ssml-utilities/core の強力なパーサーを使用
- ✅ **カスタム SSML タグサポート** - 独自タグを動的に追加・管理
- ✅ **詳細な処理結果** - 削除されたタグ、保持された要素の詳細情報
- ✅ **有効な SSML タグのみ削除** - HTML タグや無効なタグは自動的に保持
- ✅ **シンプル API** - 基本的な用途向けの簡単な関数
- ✅ **高機能 API** - 高度な制御が可能なクラスベース API
- ✅ **カスタマイズ可能な出力オプション** - 改行・空白・トリムの制御
- ✅ **TypeScript 完全対応** - 型安全な開発体験

## インストール

```bash
pnpm add @ssml-utilities/tag-remover
```

## 使用方法

### 🚀 高機能版 API（推奨）

詳細な情報とカスタマイズが必要な場合は、高機能版を使用してください：

```typescript
import { SSMLTextExtractor } from "@ssml-utilities/tag-remover";

// 基本的な使用
const extractor = new SSMLTextExtractor();
const result = extractor.extract(
  '<speak><voice name="ja-JP">こんにちは</voice></speak>'
);

console.log(result.text); // "こんにちは"
console.log(result.removedTags); // ["speak", "voice"]
console.log(result.parseSuccess); // true
```

#### カスタム SSML タグの使用

```typescript
const extractor = new SSMLTextExtractor({
  customSSMLTags: ["my-tag", "company-voice"],
});

const ssml =
  "<speak>音声<my-tag>削除される</my-tag><div>保持される</div></speak>";
const result = extractor.extract(ssml);

console.log(result.text); // "音声削除される<div>保持される</div>"
console.log(result.removedTags); // ["speak", "my-tag"]
console.log(result.preservedElements); // ["<div>", "</div>"]
```

#### 動的なタグ管理

```typescript
const extractor = new SSMLTextExtractor();

// タグを追加
extractor.updateSSMLTags(["custom-emotion"]);

// 現在のタグ一覧を確認
console.log(extractor.getSSMLTags()); // ["speak", "voice", ..., "custom-emotion"]
```

### 🔧 シンプル API（基本用途）

シンプルな用途には従来通りの関数 API も利用できます：

```typescript
import { removeSSMLTags } from "@ssml-utilities/tag-remover";

const ssml =
  '<speak><voice name="ja-JP-NanamiNeural">こんにちは、世界！</voice></speak>';
const plainText = removeSSMLTags(ssml);
console.log(plainText); // "こんにちは、世界！"
```

#### オプション付きでの使用

```typescript
import { removeSSMLTags } from "@ssml-utilities/tag-remover";

const ssml = "<speak>  こんにちは\n世界  </speak>";
const plainText = removeSSMLTags(ssml, {
  preserveNewlines: false, // 改行を削除
  normalizeSpaces: true, // 複数の空白を正規化
  trim: true, // 先頭・末尾の空白を削除
});
console.log(plainText); // "こんにちは 世界"
```

### 特定のタグのみを削除

```typescript
import { removeSpecificTags } from "@ssml-utilities/tag-remover";

const ssml =
  '<speak><voice name="test">こんにちは</voice><prosody rate="slow">世界</prosody></speak>';
const result = removeSpecificTags(ssml, ["voice"]);
console.log(result); // '<speak>こんにちは<prosody rate="slow">世界</prosody></speak>'
```

### 特定のタグ内のテキストを抽出

```typescript
import { extractTextFromTag } from "@ssml-utilities/tag-remover";

const ssml =
  '<speak><voice name="a">第一</voice>と<voice name="b">第二</voice></speak>';
const voices = extractTextFromTag(ssml, "voice");
console.log(voices); // ['第一', '第二']
```

### SSML の構造検証

```typescript
import { isValidSSMLStructure } from "@ssml-utilities/tag-remover";

const validSSML = '<speak><voice name="test">こんにちは</voice></speak>';
const invalidSSML = '<speak><voice name="test">こんにちは</speak>'; // voiceタグが閉じられていない

console.log(isValidSSMLStructure(validSSML)); // true
console.log(isValidSSMLStructure(invalidSSML)); // false
```

## API リファレンス

### 🚀 高機能版 API

#### SSMLTextExtractor

##### コンストラクタ

```typescript
new SSMLTextExtractor(options?: {
  customSSMLTags?: string[];
  validationOptions?: ValidationOptions;
})
```

- `customSSMLTags` - 独自の SSML タグを指定
- `validationOptions` - SSML タグの検証オプション

##### extract(ssml, options?)

SSML を解析してテキストを抽出し、詳細な結果を返します。

```typescript
extract(ssml: string, options?: ExtractOptions): ExtractResult
```

**パラメータ:**

- `ssml: string` - 処理する SSML 文字列
- `options?: ExtractOptions` - 抽出オプション

**戻り値 (ExtractResult):**

```typescript
{
  text: string;              // 抽出されたテキスト
  removedTags: string[];     // 削除されたSSMLタグ一覧
  preservedElements: string[]; // 保持されたHTML要素一覧
  processedNodes: number;    // 処理されたノード数
  parseSuccess: boolean;     // パース成功フラグ
}
```

##### その他のメソッド

- `updateSSMLTags(tags: string[])` - SSML タグを動的に追加
- `getSSMLTags(): string[]` - 現在の SSML タグ一覧を取得
- `debugParse(ssml: string): string` - デバッグ情報を取得

#### ユーティリティ関数

```typescript
// ファクトリー関数
createSSMLExtractor(customTags?: string[]): SSMLTextExtractor

// 高機能版のシンプルなラッパー
extractTextAdvanced(ssml: string, options?: ExtractOptions): ExtractResult
```

### 🔧 シンプル API（後方互換性）

#### removeSSMLTags(ssml, options?)

すべての SSML タグを削除してプレーンテキストを返します。

**パラメータ:**

- `ssml: string` - 処理する SSML 文字列
- `options?: TagRemovalOptions` - オプション設定

**戻り値:**

- `string` - タグが削除されたプレーンテキスト

#### removeSpecificTags(ssml, tagNames, options?)

指定したタグのみを削除します。

**パラメータ:**

- `ssml: string` - 処理する SSML 文字列
- `tagNames: string[]` - 削除するタグ名の配列
- `options?: TagRemovalOptions` - オプション設定

**戻り値:**

- `string` - 指定したタグが削除された SSML 文字列

#### extractTextFromTag(ssml, tagName)

指定したタグ内のテキストのみを抽出します。

**パラメータ:**

- `ssml: string` - 処理する SSML 文字列
- `tagName: string` - 抽出するタグ名

**戻り値:**

- `string[]` - 抽出されたテキストの配列

#### isValidSSMLStructure(ssml)

SSML の基本的な構造が有効かチェックします。

**パラメータ:**

- `ssml: string` - チェックする SSML 文字列

**戻り値:**

- `boolean` - 有効な構造かどうか

## オプション設定

### 🚀 高機能版のオプション

#### ExtractOptions

```typescript
interface ExtractOptions {
  /** 改行を保持するかどうか（デフォルト: true） */
  preserveNewlines?: boolean;
  /** 複数の空白を単一スペースに変換するかどうか（デフォルト: true） */
  normalizeSpaces?: boolean;
  /** 先頭と末尾の空白を削除するかどうか（デフォルト: true） */
  trim?: boolean;
  /** SSMLタグ検証オプション */
  validationOptions?: ValidationOptions;
}
```

#### ExtractResult

```typescript
interface ExtractResult {
  /** 抽出されたテキスト */
  text: string;
  /** 削除されたSSMLタグの一覧 */
  removedTags: string[];
  /** 保持されたHTML要素の一覧 */
  preservedElements: string[];
  /** 処理されたノード数 */
  processedNodes: number;
  /** パース成功フラグ */
  parseSuccess: boolean;
}
```

#### デフォルト設定（高機能版）

```typescript
export const DEFAULT_EXTRACT_OPTIONS: ExtractOptions = {
  preserveNewlines: true,
  normalizeSpaces: true,
  trim: true,
  validationOptions: DEFAULT_VALIDATION_OPTIONS,
};
```

### 🔧 シンプル API のオプション

#### TagRemovalOptions

```typescript
interface TagRemovalOptions {
  /** 改行を保持するかどうか（デフォルト: true） */
  preserveNewlines?: boolean;
  /** 複数の空白を単一スペースに変換するかどうか（デフォルト: true） */
  normalizeSpaces?: boolean;
  /** 先頭と末尾の空白を削除するかどうか（デフォルト: true） */
  trim?: boolean;
  /** SSMLタグ検証オプション（デフォルト: STRICT） */
  validationOptions?: ValidationOptions;
}
```

#### デフォルト設定（シンプル API）

```typescript
export const DEFAULT_REMOVAL_OPTIONS: TagRemovalOptions = {
  preserveNewlines: true,
  normalizeSpaces: true,
  trim: true,
  validationOptions: DEFAULT_VALIDATION_OPTIONS,
};
```

## 対応する SSML タグ

### 📋 標準 SSML タグ

このライブラリは`@ssml-utilities/core`のパーサーを使用して、以下の SSML 要素を正確に認識・処理します：

<!--
#### 🎯 基本タグ

- `<speak>` - ルート要素
- `<voice>` - 音声の選択
- `<prosody>` - 韻律制御（速度、音程、音量）
- `<emphasis>` - 強調
- `<break>` - 一時停止
- `<p>`, `<s>` - 段落と文

#### 🔧 高度なタグ

- `<sub>` - 置換読み
- `<phoneme>` - 音素指定
- `<say-as>` - 読み方指定
- `<audio>` - 音声ファイル再生
- `<mark>` - マーク挿入
- `<lang>` - 言語切り替え

#### 🌐 プロバイダー固有タグ

- **Microsoft Azure**: `<mstts:*>`, `<voice>` with Azure voices
- **Amazon Polly**: `<amazon:*>`, `<prosody>` extensions
- **Google Cloud**: Polly-compatible extensions -->

### ⚙️ 特殊処理

- **XML コメント** (`<!-- -->`) - 自動削除
- **CDATA セクション** (`<![CDATA[...]]>`) - 内容を保持してタグを削除
- **処理命令** (`<?xml ... ?>`) - 自動削除
- **自己完結タグ** (`<break/>`, `<mark/>`) - 正確な認識と削除

### 🎨 カスタムタグサポート

```typescript
const extractor = new SSMLTextExtractor({
  customSSMLTags: [
    "my-company-voice", // 独自音声
    "custom-effect", // 独自エフェクト
    "brand-emotion", // ブランド固有の感情表現
  ],
});
```

### 🛡️ HTML/XML タグの保護

SSML タグ以外のタグ（HTML、XML など）は自動的に保持されます：

```typescript
// HTMLタグは保持される
"<speak>音声</speak><div>HTMLコンテンツ</div>";
// → "音声<div>HTMLコンテンツ</div>"

// 無効なタグも保持される
"<speak>音声</speak><invalid-tag>保持</invalid-tag>";
// → "音声<invalid-tag>保持</invalid-tag>"
```

## ライセンス

MIT

## クレジット

Developed with contributions from @Jabelic

## 関連パッケージ

- [@ssml-utilities/core](../core) - SSML 解析基盤
- [@ssml-utilities/validation](../validation) - provider-aware validation
