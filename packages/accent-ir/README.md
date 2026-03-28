# @ssml-utilities/accent-ir

`AccentIR` を正本にして、Azure TTS / Google TTS 向けの `SSML` を生成するパッケージです。

## ステータス

この package はまだ未リリースです。

そのため、現時点では npm / pnpm からインストールする前提ではなく、workspace 内での開発対象として扱います。

## 使用例

```typescript
import { emitAzureSSML, emitGoogleSSML, type AccentIR } from "@ssml-utilities/accent-ir";

const accentIR: AccentIR = {
  segments: [
    { type: "text", text: "箸", reading: "はし", accent: { downstep: 1 } },
    { type: "break", time: "250ms" },
    { type: "text", text: "橋", reading: "はし", accent: { downstep: 2 } },
  ],
};

const azure = emitAzureSSML(accentIR, { voice: "ja-JP-NanamiNeural" });
const google = emitGoogleSSML(accentIR, { voice: "ja-JP-Standard-A" });
```

## UniDic contract

`UniDic` を最初の解析 backend として扱うために、`@ssml-utilities/accent-ir` では raw token contract と adapter interface も公開します。

この時点では `UniDic` の実 adapter はまだ未実装です。ここで提供しているのは contract と mock fixture だけです。

```typescript
import type {
  UniDicAccentIRAdapter,
  UniDicRawToken,
} from "@ssml-utilities/accent-ir";

const tokens: UniDicRawToken[] = [
  {
    surface: "箸",
    reading: "ハシ",
    pronunciation: "ハシ",
    partOfSpeech: { level1: "名詞", level2: "普通名詞", level3: "一般" },
    accent: { accentType: "1" },
  },
];
```

### 境界

- `AccentIR` には `text`, `reading`, `accent`, `break`, `emphasis` など provider 非依存の意味だけを持たせます。
- `UniDic` 固有の品詞階層、活用情報、生のアクセント表記、feature 配列は `UniDicRawToken` 側に閉じ込めます。
- `mockUniDicRawTokens` は contract 設計用の mock fixture で、将来の adapter / test の土台として使えます。

## メモ

- `Google` は `phoneme alphabet="yomigana"` に `^` / `!` を付けてアクセントを表現します。
- `Azure` は `azurePhoneme` hint が無い場合、最初は `sub alias` にフォールバックし、`warnings` を返します。
