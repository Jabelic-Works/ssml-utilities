import { AnalyzeContainer } from "./container";

const DEFAULT_INSTANCE_NAME = "default";

interface AnalyzeWorkerEnv {
  ANALYZE_CONTAINER: DurableObjectNamespace<AnalyzeContainer>;
}

const worker = {
  async fetch(request: Request, env: AnalyzeWorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health" || url.pathname === "/analyze") {
      return env.ANALYZE_CONTAINER.getByName(DEFAULT_INSTANCE_NAME).fetch(request);
    }

    return Response.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Not Found",
        },
      },
      { status: 404 }
    );
  },
} satisfies ExportedHandler<AnalyzeWorkerEnv>;

export default worker;
export { AnalyzeContainer };
