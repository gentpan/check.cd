import { createHash, timingSafeEqual } from "node:crypto";
export function requireAdmin(token: string) {
  const expected = process.env.ADMIN_TOKEN;
  if (
    !expected ||
    expected.length < 32 ||
    typeof token !== "string" ||
    token.length > 256
  )
    throw new Error("ADMIN_UNAUTHORIZED");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(token), digest(expected)))
    throw new Error("ADMIN_UNAUTHORIZED");
}
