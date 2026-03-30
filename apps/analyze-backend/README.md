# @ssml-utilities/analyze-backend

`MeCab + UniDic` を使って自由入力テキストを解析し、`AccentIR` と `Azure SSML` を返す backend app です。

## 役割

- `POST /analyze`
  - request: `text`, optional `locale`, optional `voice`, optional `includeDebug`
  - response: `accentIR`, `azureSSML`, `warnings`, optional `debug.rawTokens`
- `GET /health`
  - health check 用 endpoint

request / response の shape は `docs/azure-analyze-api-contract.md` を参照してください。

## Scripts

```bash
pnpm --filter @ssml-utilities/analyze-backend build
pnpm --filter @ssml-utilities/analyze-backend test
pnpm --filter @ssml-utilities/analyze-backend lint
pnpm --filter @ssml-utilities/analyze-backend type-check
pnpm --filter @ssml-utilities/analyze-backend preview
```

## ローカル起動

`wrangler dev` でも起動できますが、Apple Silicon 環境では Cloudflare Containers の local dev が不安定なことがあります。  
まずは Docker 直起動で確認するのを推奨します。

### 1. backend を build

repo root で実行します。

```bash
pnpm --filter @ssml-utilities/analyze-backend build
```

### 2. Docker image を作成

```bash
docker build -t ssml-utilities-analyze-backend-local -f apps/analyze-backend/Dockerfile apps/analyze-backend
```

### 3. backend を起動

```bash
docker run --rm -p 8789:8080 ssml-utilities-analyze-backend-local
```

これで backend は `http://localhost:8789` で待ち受けます。

## 動作確認

### health check

```bash
curl -i http://localhost:8789/health
```

`200 OK` が返れば起動は成功です。

### analyze API

```bash
curl -s http://localhost:8789/analyze \
  -H "content-type: application/json" \
  -d '{"text":"価格は1,280円です。現在は9時30分です。気温は22.5度です。印象が変わる。","includeDebug":true}'
```

返り値に `accentIR` と `azureSSML` が入っていれば解析は成功です。  
`includeDebug: true` を付けると `debug.rawTokens` も返ります。

## tts-playground から繋ぐ

`packages/tts-playground/.dev.vars` に次を設定します。

```dotenv
ANALYZE_API_BASE_URL=http://localhost:8789
# ANALYZE_API_TOKEN=optional-shared-token
```

次に `tts-playground` を Worker 経由で起動します。

```bash
pnpm --filter @ssml-utilities/tts-playground build
pnpm --filter @ssml-utilities/tts-playground exec wrangler dev --port 8790
```

ブラウザで `http://localhost:8790` を開くと、`/api/analyze` が local backend に proxy されます。

## メモ

- `packages/tts-playground` の `dev` は Vite 開発サーバーです。`/api/analyze` を通した確認には Worker 起動を使ってください。
- `8789` や `8790` が埋まっている場合は、空いている port に変更してください。
- Cloudflare Containers の local dev を試す場合は `pnpm --filter @ssml-utilities/analyze-backend preview` でも起動できますが、Docker 直起動の方が切り分けしやすいです。
