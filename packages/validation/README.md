# @ssml-utilities/validation

SSML Utilities の provider-aware validation を提供するパッケージです。`@ssml-utilities/core` の tolerant parser / source span を使いながら、Azure / Google / generic profile に基づく diagnostics を生成します。

## インストール

```bash
npm install @ssml-utilities/validation @ssml-utilities/core
```

または

```bash
pnpm add @ssml-utilities/validation @ssml-utilities/core
```

## 使用方法

```typescript
import { validateSSML } from "@ssml-utilities/validation";

const diagnostics = validateSSML("<speak>Hello</speak>", {
  profile: "azure",
});

console.log(diagnostics);
```

`profile` に `"off"` または `false` を指定すると validation を実行せず、diagnostics は空配列になります。

## エクスポート

- `validateSSML`
- `getValidationProfile`
- `GENERIC_SSML_PROFILE`
- `AZURE_SSML_PROFILE`
- `GOOGLE_SSML_PROFILE`
- `SSMLValidationProfile`
- `SSMLValidationOptions`
- `SSMLDiagnostic`

## 関連パッケージ

- `@ssml-utilities/core`
- `@ssml-utilities/highlighter`
- `@ssml-utilities/editor-react`
