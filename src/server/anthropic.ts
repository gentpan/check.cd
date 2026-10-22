export const haikuModel = () =>
  process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";
export type AnthropicBlock = {
  type: string;
  text?: string;
  content?: AnthropicBlock[];
  url?: string;
  title?: string;
  citations?: Array<{ url?: string; title?: string }>;
};
export async function anthropicMessage(body: Record<string, unknown>) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("AI_NOT_CONFIGURED");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: haikuModel(), ...(haikuModel() === "claude-haiku-5-5" ? {thinking:{type:"disabled"}} : {}), ...body }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) throw new Error(`ANTHROPIC_HTTP_${response.status}`);
  const data = (await response.json()) as {
    content: AnthropicBlock[];
    stop_reason?: string;
  };
  if (!Array.isArray(data.content)) throw new Error("SEARCH_UNAVAILABLE");
  return data;
}
let budget = { start: Date.now(), count: 0, active: 0 };
export async function withAiBudget<T>(work: () => Promise<T>): Promise<T> {
  if (Date.now() - budget.start > 3600_000)
    budget = { start: Date.now(), count: 0, active: budget.active };
  if (budget.count >= 100 || budget.active >= 3) throw new Error("AI_BUSY");
  budget.count++;
  budget.active++;
  try {
    return await work();
  } finally {
    budget.active--;
  }
}
