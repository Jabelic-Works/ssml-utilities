import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AnalyzeErrorResponse } from "@ssml-utilities/analyze-contract";
import { handleAnalyzeRoute } from "./routes/analyze.js";
import type { JsonRouteResponse } from "./routes/http.js";
import { handleHealthRequest } from "./routes/health.js";

const DEFAULT_PORT = 8080;
const port = Number(process.env.PORT ?? DEFAULT_PORT);

const server = createServer(async (request, response) => {
  const routeResponse = await routeRequest(request);
  writeJsonResponse(response, routeResponse);
});

server.listen(port, () => {
  console.log(
    `ssml-utilities-analyze-backend container listening on http://0.0.0.0:${port}`
  );
});

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0);
  });
});

const routeRequest = async (
  request: IncomingMessage
): Promise<JsonRouteResponse> => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://127.0.0.1");

  if (url.pathname === "/health") {
    return handleHealthRequest();
  }

  if (url.pathname === "/analyze") {
    try {
      const payload = await readJsonBody(request);
      return handleAnalyzeRoute(method, payload);
    } catch {
      return {
        status: 400,
        body: {
          error: {
            code: "BAD_REQUEST",
            message: "Request body must be valid JSON.",
          },
        } satisfies AnalyzeErrorResponse,
      };
    }
  }

  return {
    status: 404,
    body: {
      error: {
        code: "NOT_FOUND",
        message: "Not Found",
      },
    } satisfies AnalyzeErrorResponse,
  };
};

const readJsonBody = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Uint8Array[] = [];

  for await (const chunk of request) {
    if (typeof chunk === "string") {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    chunks.push(chunk);
  }

  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as unknown;
};

const writeJsonResponse = (
  response: ServerResponse,
  routeResponse: JsonRouteResponse
): void => {
  response.statusCode = routeResponse.status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(routeResponse.body));
};
