# SSML Utilities React Example

`examples/react` は `@ssml-utilities/editor-react` の利用例に加えて、Azure TTS 向けの最小 verification surface を含むサンプルです。

## 開発

```bash
pnpm install
pnpm --filter react dev
```

## ビルド

```bash
pnpm --filter react build
```

## プレビュー

```bash
pnpm --filter react preview
```

## Worker 経由の確認

Azure TTS verification surface は Worker 経由で `/api/azure/synthesize` に送信します。

```bash
pnpm --filter react preview:worker
```

## Credential の扱い

- Azure の `subscription key` と `region` は `sessionStorage` のみを使って保持します。
- Worker は request ごとの転送にのみ使い、credential を保存しません。
