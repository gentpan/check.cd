import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/news-refresh")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { requireAdmin } = await import("@/server/admin-auth");
          requireAdmin(
            (request.headers.get("authorization") ?? "").replace(
              /^Bearer /,
              "",
            ),
          );
          const { refreshNews } = await import("@/server/news");
          return Response.json(await refreshNews());
        } catch (error) {
          const unauthorized =
            error instanceof Error && error.message === "ADMIN_UNAUTHORIZED";
          return Response.json(
            {
              error: unauthorized
                ? "Unauthorized"
                : "News refresh failed; check admin status.",
            },
            { status: unauthorized ? 401 : 502 },
          );
        }
      },
    },
  },
});
