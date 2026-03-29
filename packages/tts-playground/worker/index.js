/**
 * @typedef {import("@ssml-utilities/accent-ir").AccentIR} AccentIR
 * @typedef {import("@ssml-utilities/accent-ir").AccentIREmitWarning} AccentIREmitWarning
 */

/**
 * @typedef {{
 *   surface: string
 *   reading?: string
 *   pronunciation?: string
 *   partOfSpeech?: Record<string, string>
 *   accent?: Record<string, string>
 * }} AnalyzeDebugToken
 */

/**
 * @typedef {{
 *   text: string
 *   locale?: string
 *   voice?: string
 *   includeDebug?: boolean
 * }} AnalyzeRequest
 */

/**
 * @typedef {{
 *   text: string
 *   locale: string
 *   accentIR: AccentIR
 *   azureSSML: string
 *   warnings: AccentIREmitWarning[]
 *   debug?: {
 *     rawTokens?: AnalyzeDebugToken[]
 *   }
 * }} AnalyzeSuccessResponse
 */

/**
 * @typedef {{
 *   error: {
 *     code: string
 *     message: string
 *   }
 * }} AnalyzeErrorResponse
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/analyze") {
      if (request.method === "OPTIONS") {
        return withCors(
          new Response(null, {
            status: 204,
            headers: {
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          })
        );
      }

      if (request.method !== "POST") {
        return withCors(
          Response.json(
            {
              error: {
                code: "METHOD_NOT_ALLOWED",
                message: "Only POST is supported.",
              },
            },
            { status: 405 }
          )
        );
      }

      const payload = await request.json();
      const text = typeof payload.text === "string" ? payload.text.trim() : "";
      const locale = typeof payload.locale === "string" ? payload.locale : "ja-JP";
      const voice =
        typeof payload.voice === "string" && payload.voice
          ? payload.voice
          : "ja-JP-NanamiNeural";
      const includeDebug = Boolean(payload.includeDebug);

      if (!text) {
        return withCors(
          Response.json(
            {
              error: {
                code: "BAD_REQUEST",
                message: "text is required.",
              },
            },
            { status: 400 }
          )
        );
      }

      return withCors(
        Response.json(createAnalyzeResponse({ text, locale, voice, includeDebug }))
      );
    }

    if (url.pathname === "/api/azure/synthesize") {
      if (request.method === "OPTIONS") {
        return withCors(
          new Response(null, {
            status: 204,
            headers: {
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          })
        );
      }

      if (request.method !== "POST") {
        return withCors(
          Response.json(
            {
              error: "Method Not Allowed",
            },
            { status: 405 }
          )
        );
      }

      const payload = await request.json();
      const subscriptionKey =
        typeof payload.subscriptionKey === "string" ? payload.subscriptionKey : "";
      const region = typeof payload.region === "string" ? payload.region : "";
      const ssml = typeof payload.ssml === "string" ? payload.ssml : "";
      const outputFormat =
        typeof payload.outputFormat === "string" && payload.outputFormat
          ? payload.outputFormat
          : "audio-24khz-48kbitrate-mono-mp3";

      if (!subscriptionKey || !region || !ssml) {
        return withCors(
          Response.json(
            {
              error: "Bad Request",
              details: "subscriptionKey, region, ssml are required.",
            },
            { status: 400 }
          )
        );
      }

      const upstream = await fetch(
        `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": subscriptionKey,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": outputFormat,
            "User-Agent": "ssml-utilities-tts-playground",
          },
          body: ssml,
        }
      );

      if (!upstream.ok) {
        const details = await upstream.text();
        return withCors(
          Response.json(
            {
              error: "Azure synthesis failed",
              details,
            },
            { status: upstream.status }
          )
        );
      }

      const headers = new Headers();
      headers.set(
        "Content-Type",
        upstream.headers.get("content-type") || "audio/mpeg"
      );
      headers.set("Cache-Control", "no-store");

      return withCors(
        new Response(upstream.body, {
          status: upstream.status,
          headers,
        })
      );
    }

    if (url.pathname === "/api/health") {
      return Response.json({
        status: "ok",
        service: "ssml-utilities-tts-playground",
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "Not Found",
        },
        { status: 404 }
      );
    }

    return env.ASSETS.fetch(request);
  },
};

/**
 * Contract-aligned mock response builder for the Azure-first free-text flow.
 * This remains a mock until the real UniDic backend is connected.
 *
 * @param {{ text: string; locale: string; voice: string; includeDebug: boolean }} input
 * @returns {AnalyzeSuccessResponse}
 */
const createAnalyzeResponse = ({ text, locale, voice, includeDebug }) => {
  const sample = SAMPLE_RESPONSES[text];

  if (sample) {
    return {
      text,
      locale,
      accentIR: sample.accentIR,
      azureSSML: wrapWithVoice(sample.azureBody, locale, voice),
      warnings: sample.warnings,
      ...(includeDebug ? { debug: { rawTokens: sample.rawTokens } } : {}),
    };
  }

  const plainTextSSML = wrapWithVoice(escapeXml(text), locale, voice);

  return {
    text,
    locale,
    accentIR: {
      locale,
      segments: [
        {
          type: "text",
          text,
        },
      ],
    },
    azureSSML: plainTextSSML,
    warnings: [
      {
        code: "ANALYZE_MOCK_FALLBACK",
        message:
          "現在の /api/analyze は contract 準拠の mock 実装です。未登録テキストは plain text fallback で返します。",
        segmentIndex: 0,
      },
    ],
    ...(includeDebug ? { debug: { rawTokens: [] } } : {}),
  };
};

const wrapWithVoice = (body, locale, voice) =>
  `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}"><voice name="${voice}">${body}</voice></speak>`;

const escapeXml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const SAMPLE_RESPONSES = {
  "箸": {
    accentIR: {
      locale: "ja-JP",
      segments: [
        {
          type: "text",
          text: "箸",
          reading: "はし",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハ'シ",
            },
          },
        },
      ],
    },
    azureBody: `<phoneme alphabet="sapi" ph="ハ'シ">箸</phoneme>`,
    warnings: [],
    rawTokens: [
      {
        surface: "箸",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "1",
        },
      },
    ],
  },
  "橋": {
    accentIR: {
      locale: "ja-JP",
      segments: [
        {
          type: "text",
          text: "橋",
          reading: "はし",
          accent: { downstep: 2 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ'",
            },
          },
        },
      ],
    },
    azureBody: `<phoneme alphabet="sapi" ph="ハシ'">橋</phoneme>`,
    warnings: [],
    rawTokens: [
      {
        surface: "橋",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "2",
        },
      },
    ],
  },
  "端": {
    accentIR: {
      locale: "ja-JP",
      segments: [
        {
          type: "text",
          text: "端",
          reading: "はし",
          accent: { downstep: null },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハシ+",
            },
          },
        },
      ],
    },
    azureBody: `<phoneme alphabet="sapi" ph="ハシ+">端</phoneme>`,
    warnings: [],
    rawTokens: [
      {
        surface: "端",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "0",
        },
      },
    ],
  },
  "箸を持つ。": {
    accentIR: {
      locale: "ja-JP",
      segments: [
        {
          type: "text",
          text: "箸を",
          reading: "はしを",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "ハ'シオ",
            },
          },
        },
        {
          type: "text",
          text: "持つ",
          reading: "もつ",
          accent: { downstep: 1 },
          hints: {
            azurePhoneme: {
              alphabet: "sapi",
              value: "モ'ツ",
            },
          },
        },
        {
          type: "break",
          strength: "strong",
        },
      ],
    },
    azureBody:
      `<phoneme alphabet="sapi" ph="ハ'シオ">箸を</phoneme>` +
      `<phoneme alphabet="sapi" ph="モ'ツ">持つ</phoneme>` +
      `<break strength="strong"/>`,
    warnings: [],
    rawTokens: [
      {
        surface: "箸",
        reading: "ハシ",
        pronunciation: "ハシ",
        partOfSpeech: {
          level1: "名詞",
          level2: "普通名詞",
          level3: "一般",
        },
        accent: {
          accentType: "1",
        },
      },
      {
        surface: "を",
        reading: "ヲ",
        pronunciation: "オ",
        partOfSpeech: {
          level1: "助詞",
          level2: "格助詞",
        },
      },
      {
        surface: "持つ",
        reading: "モツ",
        pronunciation: "モツ",
        partOfSpeech: {
          level1: "動詞",
          level2: "一般",
        },
        accent: {
          accentType: "1",
        },
      },
      {
        surface: "。",
        partOfSpeech: {
          level1: "補助記号",
          level2: "句点",
        },
      },
    ],
  },
};

const withCors = (response) => {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
