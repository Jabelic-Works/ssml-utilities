import type { JsonRouteResponse } from "./http.js";

export const handleHealthRequest = (): JsonRouteResponse => ({
  status: 200,
  body: {
    status: "ok",
    service: "ssml-utilities-analyze-backend",
    runtime: "container",
  },
});
