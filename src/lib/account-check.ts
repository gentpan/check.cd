import { claudeAccess } from "./claude-regions";
export type AccountAnswers = Record<string, string>;
export type RuleResult = {
  id: string;
  title: string;
  state: "ok" | "attention" | "unknown" | "info";
  detail: string;
  source: string;
  basis: "official" | "technical" | "self-reported";
};
export function evaluateAccount(a: AccountAnswers): RuleResult[] {
  a = Object.fromEntries(
    Object.entries(a).filter(([, value]) => value && value !== "unknown"),
  );
  const rows: RuleResult[] = [];
  const add = (
    id: string,
    title: string,
    state: RuleResult["state"],
    detail: string,
    source: string,
    basis: RuleResult["basis"] = "official",
  ) => rows.push({ id, title, state, detail, source, basis });
  const regions = a.usage === "api" ? "https://platform.claude.com/docs/en/api/supported-regions" : "https://support.claude.com/en/articles/8461763-where-can-i-access-claude-ai",
    terms = "https://www.anthropic.com/legal/consumer-terms",
    payment =
      "https://support.claude.com/en/articles/9402418-why-was-my-card-declined";
  for (const [id, title] of [
    ["actualCountry", "当前实际所在地"],
    ["registrationCountry", "注册时实际所在地"],
  ]) {
    if (a.stage === "register" && id === "registrationCountry") continue;
    const code = a[id];
    const verdict = claudeAccess(code, a[id + "Region"], { product: a.usage === "api" ? "api" : "claude" });
    add(
      id,
      title,
      verdict === "blocked"
        ? "attention"
        : verdict === "allowed"
          ? "ok"
          : "unknown",
      verdict === "blocked"
        ? "用户填写的地区不在当前支持范围。网络出口不能替代实际所在地。"
        : verdict === "allowed"
          ? "填写的国家在支持清单；仍需核对地区例外及组织资格。"
          : code ? "地区资料或产品规则尚待核对，暂不作使用资格结论。" : "未提供实际地区，无法判断使用资格。",
      regions,
      "self-reported",
    );
  }
  if (a.actualCountry === "UA" || a.registrationCountry === "UA")
    add(
      "regionException",
      "乌克兰地区例外",
      a.uaRegion === "excluded"
        ? "attention"
        : a.uaRegion === "other"
          ? "ok"
          : "unknown",
      "乌克兰部分地区有产品与版本差异。API 的现行名单与消费者服务资料应分别核对，未来公告不提前适用。用户自述涉及例外时，需补充具体地区后再确认。",
      regions,
    );
  add(
    "age",
    "最低年龄",
    a.usage === "api"
      ? "info"
      : a.age === "yes"
        ? "ok"
        : a.age === "no"
          ? "attention"
          : "unknown",
    a.usage === "api"
      ? "API 应按商业条款与实际组织资格核对，不能直接套用消费者账号检查。"
      : "消费者服务要求至少 18 岁，或当地更高的最低同意年龄。",
    a.usage === "api"
      ? "https://www.anthropic.com/legal/commercial-terms"
      : terms,
    "self-reported",
  );
  add(
    "ownership",
    "账号来源与共享",
    a.ownership === "self"
      ? "ok"
      : a.ownership && a.ownership !== "unknown"
        ? "attention"
        : "unknown",
    "账号资料应真实，消费者账号不得共享或向他人开放；购买账号需要核对来源及所有权。",
    terms,
    "self-reported",
  );
  add(
    "phone",
    "手机号验证",
    a.phone === "sms"
      ? "ok"
      : a.phone === "voip"
        ? "attention"
        : a.phone === "not-requested"
          ? "info"
          : "unknown",
    "要求验证时，应使用支持地区、能收短信的号码。VoIP、应用生成号码和固话不被接受。",
    "https://support.claude.com/en/articles/8287232-verify-your-phone-number",
    "self-reported",
  );
  if (a.identity && a.identity !== "not-requested")
    add(
      "identity",
      "身份核验",
      a.identity === "complete"
        ? "ok"
        : a.identity === "pending" || a.identity === "failed"
          ? "attention"
          : "unknown",
      "出现官方核验提示时，通过官方流程完成或联系支持；核验待办不等于已封禁。",
      "https://support.claude.com/en/articles/14328960-identity-verification-on-claude",
      "self-reported",
    );
  if (a.stage === "pay" || (a.paymentChannel && a.paymentChannel !== "none")) {
    if (a.paymentChannel === "apple" || a.paymentChannel === "google")
      add(
        "storeBilling",
        "应用商店账单",
        "info",
        "在 Apple App Store 或 Google Play 核对支付、地区和订阅收据；官网卡片检查不直接适用于此渠道。",
        "https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs",
      );
    else if (a.paymentChannel === "web") {
      const known = a.cardCountry && a.billingCountry;
      const valid =
        known &&
        claudeAccess(a.cardCountry) === "allowed" &&
        claudeAccess(a.billingCountry) === "allowed" &&
        a.cardCountry === a.billingCountry;
      add(
        "billingCountries",
        "发卡国家与账单国家",
        known ? (valid ? "ok" : "attention") : "unknown",
        "核对支持范围及发卡国家与账单国家的匹配；本网站无法验证银行的实际卡片记录。",
        payment,
        "self-reported",
      );
      add(
        "billingAddress",
        "账单地址匹配",
        a.addressMatches === "yes"
          ? "ok"
          : a.addressMatches === "no"
            ? "attention"
            : "unknown",
        "请自行确认填写地址与银行记录一致，无需向本站提供完整地址。",
        payment,
        "self-reported",
      );
      add(
        "threeDS",
        "3DS 验证",
        a.threeDS === "complete"
          ? "ok"
          : a.threeDS === "pending" || a.threeDS === "failed"
            ? "attention"
            : a.threeDS === "not-requested"
              ? "info"
              : "unknown",
        "仅在交易要求时完成 3DS。失败时核对银行通知或联系银行。",
        payment,
        "self-reported",
      );
      add(
        "cardType",
        "支付方式",
        a.cardType === "paypal" ? "attention" : "info",
        "官网接受信用卡和借记卡，不接受 PayPal/Venmo；没有公开依据认定所有虚拟卡必然导致封禁。",
        payment,
      );
    } else
      add(
        "paymentChannel",
        "支付渠道",
        "unknown",
        "先确认通过官网、Apple 还是 Google 支付，再选择对应排查路径。",
        payment,
      );
  }
  if (a.plan === "organization")
    add(
      "organization",
      "组织地区与控制关系",
      a.organizationEligible === "yes"
        ? "ok"
        : a.organizationEligible === "no"
          ? "attention"
          : "unknown",
      "核对注册地、总部及多数所有权或控制关系；成员的出口 IP 不能代替组织资格。",
      regions,
      "self-reported",
    );
  add(
    "usage",
    "使用入口与认证",
    a.usage === "thirdparty-subscription"
      ? "attention"
      : a.usage === "official" || a.usage === "api"
        ? "info"
        : "unknown",
    "官方客户端、Claude Code、API 与第三方订阅认证的授权范围不同，请核对最新官方说明。",
    "https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account",
    "self-reported",
  );
  if (a.status && a.status !== "normal")
    add(
      "accountStatus",
      "当前账号状态",
      "attention",
      a.status === "banned"
        ? "账号停用应走官方申诉；当前网络检测不能推断停用原因。"
        : a.status === "payment"
          ? "支付失败优先排查账单、银行与交易验证，不等同于封禁。"
          : a.status === "quota"
            ? "额度或速率限制应查看套餐与重置时间，不等同于封禁。"
            : "按官方提示核对验证、地区或使用政策；未知提示应联系官方支持。",
      "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals",
      "self-reported",
    );
  if (a.registrationIpCountry || a.registrationNetwork)
    add(
      "registrationNetwork",
      "注册网络记录",
      "info",
      "历史出口国家与网络类型仅作排查记录。当前浏览器无法还原历史 IP 或证明住宅网络更安全。",
      regions,
      "technical",
    );
  add(
    "behavior",
    "使用行为与政策",
    a.policyWarning === "yes"
      ? "attention"
      : a.policyWarning === "no"
        ? "info"
        : "unknown",
    "反复违反使用政策、恶意多账号协调或绕过封禁可能导致停用；本站不会读取对话或证明使用行为合规。",
    "https://www.anthropic.com/legal/archive/22742366-2ef0-4c7a-a833-6523f10d3944",
    "self-reported",
  );
  return rows;
}
