export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  body?: string[];
  url: string;
  source: string;
  publishedAt: string;
  effectiveAt?: string | null;
  discoveredAt: string;
  category: "policy" | "product" | "security";
  evidence: "official" | "reported";
  status: "published" | "draft" | "hidden";
};
export const seedNews: NewsItem[] = [
  {
    id: "usage-policy-november",
    body: ["Anthropic 已公布新一轮使用政策调整，公告日期为 2026 年 10 月 8 日，政策生效日期为 11 月 12 日。两个日期含义不同，公告发布并不意味着新规则已经开始执行。", "核对 Claude 使用条件时，应查看当时有效的政策版本。本站将新闻更新与检查规则维护分开处理，并保留官方公告链接，方便读者核对。"],
    title: "使用政策更新已公布：11 月 12 日生效",
    summary:
      "Anthropic 于 10 月 8 日公布使用政策更新，生效日期为 11 月 12 日。公告发布与政策生效应分别记录，检查规则仍需按当前有效版本核对。",
    url: "https://www.anthropic.com/news/2026-usage-policy-update",
    source: "Anthropic",
    publishedAt: "2026-10-08",
    effectiveAt: "2026-11-12",
    discoveredAt: "2026-10-14",
    category: "policy",
    evidence: "official",
    status: "published",
  },
  {
    id: "haiku-55",
    body: ["Anthropic 于 2026 年 10 月 7 日发布 Claude Haiku 5.5。这一型号面向分类、提取、路由和其他重视吞吐量与响应速度的任务。", "开发者接入时应核对官方模型标识、接口能力和账户权限。模型更新并不改变用户需要遵守的地区政策或其他使用条件。"],
    title: "Haiku 5.5 发布：小模型与 API 能力更新",
    summary:
      "Anthropic 发布 Haiku 5.5。接入时应使用正式 API 模型标识，产品可用性仍需按地区政策核对。",
    url: "https://www.anthropic.com/claude-haiku-5-5",
    source: "Anthropic",
    publishedAt: "2026-10-07",
    discoveredAt: "2026-10-14",
    category: "product",
    evidence: "official",
    status: "published",
  },
  {
    id: "identity-verification",
    body: ["Claude 官方帮助中心说明，部分功能、平台完整性检查或合规流程可能要求个人或企业完成身份验证。这不是所有用户都会同时遇到的统一注册步骤。", "收到核验提示时，应在官方提供的流程中完成验证；核验待办与账号停用需要分别处理。本站只整理相关说明，不收集证件、自拍或验证码。"],
    title: "Claude 身份验证：部分场景需要完成官方核验",
    summary:
      "官方说明部分功能或平台完整性检查可能要求身份或企业验证。出现核验提示不等于账号已经被封禁，应在官方流程完成核验。",
    url: "https://support.claude.com/en/articles/14328960-identity-verification-on-claude",
    source: "Claude 帮助中心",
    publishedAt: "2026-08-11",
    discoveredAt: "2026-10-14",
    category: "security",
    evidence: "official",
    status: "published",
  },
  {
    id: "supported-regions-2026",
    body: ["Anthropic 的地区政策涉及用户实际所在地，也涉及组织的注册地、总部及多数所有权或控制关系。该政策覆盖 Claude、Claude Code、API 及指定渠道。", "网络出口国家只是技术线索。即便 IP 属于支持地区，也不能据此确认个人或组织的使用资格；应结合真实情况核对官方地区清单及例外。"],
    title: "地区政策：实际所在地与组织资格都需要核对",
    summary:
      "当前地区政策适用于 Claude、Claude Code、API 及指定渠道。支持地区的网络出口并不能单独证明个人或组织符合使用资格。",
    url: "https://www.anthropic.com/legal/supported-regions",
    source: "Anthropic",
    publishedAt: "2026-05-12",
    discoveredAt: "2026-10-14",
    category: "policy",
    evidence: "official",
    status: "published",
  },
];
