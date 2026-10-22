import { createServerFn } from "@tanstack/react-start";
export const getNews = createServerFn({ method: "GET" }).handler(async () =>
  (await import("@/server/news")).publicNews(),
);
export const getNewsArticle = createServerFn({ method: "GET" })
  .validator((value: unknown) => {
    if (!value || typeof value !== "object") throw new Error("Invalid request");
    const id = (value as Record<string, unknown>).id;
    if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,64}$/.test(id)) throw new Error("Invalid news id");
    return {id};
  })
  .handler(async ({data}) => (await import("@/server/news")).publicNewsArticle(data.id));
function adminInput(value: unknown) {
  if (!value || typeof value !== "object") throw new Error("Invalid request");
  const data = value as Record<string, unknown>;
  if (typeof data.token !== "string" || data.token.length > 256)
    throw new Error("Invalid token");
  return data as Record<string, unknown> & { token: string };
}
export const getAdminState = createServerFn({ method: "POST" })
  .validator(adminInput)
  .handler(async ({ data }) => {
    (await import("@/server/admin-auth")).requireAdmin(data.token);
    return (await import("@/server/news")).adminNews();
  });
export const refreshAdminNews = createServerFn({ method: "POST" })
  .validator(adminInput)
  .handler(async ({ data }) => {
    (await import("@/server/admin-auth")).requireAdmin(data.token);
    return (await import("@/server/news")).refreshNews();
  });
export const saveNewsSettings = createServerFn({ method: "POST" })
  .validator((value: unknown) => {
    const data = adminInput(value);
    if (
      typeof data.enabled !== "boolean" ||
      typeof data.autoPublish !== "boolean" ||
      typeof data.intervalHours !== "number" ||
      !Number.isInteger(data.intervalHours) ||
      data.intervalHours < 6 ||
      data.intervalHours > 168
    )
      throw new Error("Invalid settings");
    return {
      token: data.token,
      enabled: data.enabled,
      autoPublish: data.autoPublish,
      intervalHours: data.intervalHours,
    };
  })
  .handler(async ({ data }) => {
    (await import("@/server/admin-auth")).requireAdmin(data.token);
    await (await import("@/server/news")).updateNewsSettings(data);
    return { ok: true };
  });
export const moderateNews = createServerFn({ method: "POST" })
  .validator((value: unknown) => {
    const data = adminInput(value);
    if (
      typeof data.id !== "string" ||
      data.id.length > 64 ||
      (data.status !== "published" &&
        data.status !== "draft" &&
        data.status !== "hidden")
    )
      throw new Error("Invalid status");
    return {
      token: data.token,
      id: data.id,
      status: data.status as "published" | "draft" | "hidden",
    };
  })
  .handler(async ({ data }) => {
    (await import("@/server/admin-auth")).requireAdmin(data.token);
    await (await import("@/server/news")).setNewsStatus(data.id, data.status);
    return { ok: true };
  });
