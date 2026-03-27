# @ssml-utilities/accent-ir

`AccentIR` を正本にして、Azure TTS / Google TTS 向けの `SSML` を生成するパッケージです。

## インストール

```bash
pnpm add @ssml-utilities/accent-ir
```

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

## メモ

- `Google` は `phoneme alphabet="yomigana"` に `^` / `!` を付けてアクセントを表現します。
- `Azure` は `azurePhoneme` hint が無い場合、最初は `sub alias` にフォールバックし、`warnings` を返します。
