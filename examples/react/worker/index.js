export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
