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

`MeCab` や辞書のロード自体は行いませんが、すでに正規化された `UniDicRawToken[]` から `AccentIR` を組み立てる MVP adapter は提供します。

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

```typescript
import { adaptUniDicTokensToAccentIR } from "@ssml-utilities/accent-ir";

const result = adaptUniDicTokensToAccentIR({ tokens });
```

### 境界

- `AccentIR` には `text`, `reading`, `accent`, `break`, `emphasis` など provider 非依存の意味だけを持たせます。
- `UniDic` 固有の品詞階層、活用情報、生のアクセント表記、feature 配列は `UniDicRawToken` 側に閉じ込めます。
- `mockUniDicRawTokens` は contract 設計用の mock fixture で、将来の adapter / test の土台として使えます。
- 現在の `adaptUniDicTokensToAccentIR()` は MVP で、名詞、固有名詞、助詞連結、文末 pause などの最小範囲のみを対象にします。
- Azure 向けの `azurePhoneme` hint は、`pronunciation` / `reading` / `accentType` から組み立てるヒューリスティックな MVP です。

## メモ

- `Google` は `phoneme alphabet="yomigana"` に `^` / `!` を付けてアクセントを表現します。
- `Azure` は次の優先順位で出力します: `azurePhoneme` -> `sub alias` -> `plain text`。
- `AZURE_FALLBACK_TO_SUB_ALIAS`: `azurePhoneme` hint が無く、`reading` を使って `sub alias` へ落ちたケースです。
- `AZURE_FALLBACK_TO_PLAIN_TEXT`: `azurePhoneme` と `reading` の両方が無く、plain text へ落ちたケースです。
- 共有の評価ケースは `src/__tests__/fixtures/evaluation-cases.ts` に置き、まずは `UniDic -> AccentIR -> Azure SSML` の回帰を固定します。
- Google 向けの比較期待値は、後続の follow-up で同じ fixture に追加できるようにしています。
