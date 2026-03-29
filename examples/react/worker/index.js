export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
            "User-Agent": "ssml-utilities-demo",
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
        service: "ssml-utilities-demo",
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "Not Found",
        },
        { status: 404 },
      );
    }

    return env.ASSETS.fetch(request);
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
