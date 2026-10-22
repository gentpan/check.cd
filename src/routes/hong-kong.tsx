import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/hong-kong")({
  beforeLoad: () => { throw redirect({ to: "/", statusCode: 301 }); },
});
