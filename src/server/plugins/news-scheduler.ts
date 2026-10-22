import { definePlugin } from "nitro";
import { scheduledNewsTick } from "../news";
export default definePlugin((app) => {
  // One Node process, persistent data volume. External cron can call the same refresh endpoint.
  const tick = () => {
    void scheduledNewsTick().catch(() =>
      console.warn("News update failed; see admin status."),
    );
  };
  const timer = setInterval(tick, 60_000);
  timer.unref();
  app.hooks.hook("close", () => {
    clearInterval(timer);
  });
});
