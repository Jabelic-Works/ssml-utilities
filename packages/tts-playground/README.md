# @ssml-utilities/tts-playground

Azure TTS 向けの BYO-credential verification surface を提供する workspace package です。

## 開発

```bash
pnpm --filter @ssml-utilities/tts-playground dev
```

## ビルド

```bash
pnpm --filter @ssml-utilities/tts-playground build
```

## Worker 経由の確認

Azure TTS verification surface は Worker 経由で `/api/azure/synthesize` に送信します。

```bash
pnpm --filter @ssml-utilities/tts-playground preview:worker
```

## Credential の扱い

- Azure の `subscription key` と `region` は `sessionStorage` のみを使って保持します。
- Worker は request ごとの転送にのみ使い、credential を保存しません。
- Google 対応はまだ含みません。これは `#133` へ統合可能な Azure-first の smaller slice です。

## Free-text roadmap

本物の `UniDic` を使う自由入力モードは、Cloudflare front とは別の analyze backend を前提にします。配置方針は [docs/azure-unidic-backend.md](../../docs/azure-unidic-backend.md) を参照してください。

自由入力 request / response の contract は [docs/azure-analyze-api-contract.md](../../docs/azure-analyze-api-contract.md) を参照してください。
