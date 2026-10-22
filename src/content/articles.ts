export type Article = {
  slug: string;
  title: string;
  description: string;
  category: string;
  updatedAt: string;
  sections: Array<{ title: string; body: string }>;
  sources: Array<{ title: string; url: string }>;
};
export const articles: Article[] = [
  {
    slug: "eligibility",
    title: "先核对使用资格，再看 IP",
    description: "实际所在地、注册地区与组织资格，应当分别确认。",
    category: "地区与注册",
    updatedAt: "2026-10-14",
    sections: [
      {
        title: "地区政策看什么",
        body: "Anthropic 的地区政策涉及个人实际所在地，以及企业的注册地、总部和多数所有权或控制关系。浏览器请求的 IP 国家只是网络线索，不能替代真实所在地。",
      },
      {
        title: "注册历史为什么重要",
        body: "官方列出的停用原因包括从不支持地区创建账号。现在换到另一条网络，不能证明注册历史符合要求。检查时应允许用户填写当时的实际地区和网络出口地区；不知道时保留未知。",
      },
      {
        title: "如何理解检查结果",
        body: "本项目核对公开使用条件，不提供官方许可、不测量封禁概率。支持国家仍有部分地区例外；地区清单应标注核对日期。",
      },
    ],
    sources: [
      {
        title: "Supported Regions Policy",
        url: "https://www.anthropic.com/legal/supported-regions",
      },
      {
        title: "Warnings and appeals",
        url: "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals",
      },
    ],
  },
  {
    slug: "payment",
    title: "订阅支付：发卡地区、账单地址与验证",
    description: "拒付是支付问题，不能直接当作封号。",
    category: "订阅与支付",
    updatedAt: "2026-10-14",
    sections: [
      {
        title: "先选择支付渠道",
        body: "官网信用卡或借记卡支付、Apple App Store 和 Google Play 的账单流程不同。商店订阅应在对应商店管理支付与收据。",
      },
      {
        title: "官网支付核对项",
        body: "核对支付来源国家与账单国家是否符合支持范围，账单国家应与卡片来源国家匹配；地址应与银行记录一致。交易要求 3DS 时需完成验证，并检查余额与银行拒付原因。",
      },
      {
        title: "不要根据卡片名称做保证",
        body: "公开规则没有证明所有虚拟卡都会导致封禁，也没有证明某个品牌的卡保证订阅成功。本项目只询问卡片类型、发卡国家和验证状态，不收集卡号、CVV 或完整地址。",
      },
    ],
    sources: [
      {
        title: "Why was my card declined?",
        url: "https://support.claude.com/en/articles/9402418-why-was-my-card-declined",
      },
      {
        title: "Paid plan billing FAQs",
        url: "https://support.claude.com/en/articles/8325618-paid-plan-billing-faqs",
      },
    ],
  },
  {
    slug: "network",
    title: "IP 与浏览器检测能说明什么",
    description: "网络情报有价值，但住宅 IP、字体与时区不能证明账号安全。",
    category: "网络与环境",
    updatedAt: "2026-10-17",
    sections: [
      {
        title: "第三方情报的边界",
        body: "IP 归属国家、ASN 及套餐提供的网络标记来自 IPinfo 授权 API，可能过期或误判。未配置授权时保留已确认出口；没有提供的字段保持未知。当前接口不提供本站所需的纯净度评分或 AI 订阅资格，不自行推算，也不当成 Anthropic 内部风控结论。",
      },
      {
        title: "语言与字体不应增加封禁分",
        body: "中文语言、系统字体、Emoji、内存大小和触摸屏主要描述设备设置。海外中文用户和正常手机都可能命中这些条件，因此这些项目仅供信息展示。",
      },
      {
        title: "WebRTC 的边界",
        body: "STUN 返回另一条地址只说明存在另一条可观察网络路径。IPv4 与 IPv6 双栈、移动网络和路由差异也可能造成地址不同；没有得到额外地址也不能保证没有泄漏。",
      },
      {
        title: "网页无法代替 Claude Code 检查",
        body: "本网站看到的是访问本网站的浏览器与网络，不能读取终端的出口、认证方式或服务端路由。使用 Claude Code 或 API 时，需要额外核对实际运行机器。",
      },
    ],
    sources: [
      {
        title: "Claude error troubleshooting",
        url: "https://support.claude.com/en/articles/12466728-troubleshoot-claude-error-messages",
      },
      {
        title: "Supported Regions Policy",
        url: "https://www.anthropic.com/legal/supported-regions",
      },
    ],
  },
  {
    slug: "identity",
    title: "手机号、年龄和身份验证",
    description: "填写验证状态即可，证件应仅在官方核验流程提交。",
    category: "账号与验证",
    updatedAt: "2026-10-14",
    sections: [
      {
        title: "账号资料与年龄",
        body: "消费者条款要求正确、当前且完整的账号资料，以及至少 18 岁或当地更高的最低同意年龄。本人账号与共享或购买账号应区别核对。",
      },
      {
        title: "手机号",
        body: "官方手机号验证要求支持地区、可收短信的号码；VoIP、Google Voice、应用生成号码及固话不被接受。历史账号是否曾被要求验证，按实际注册流程填写。",
      },
      {
        title: "身份核验提示",
        body: "部分功能、平台完整性或合规检查可能要求身份或企业核验。待验证与已封禁是不同状态，应通过官方核验流程处理。本网站不收集证件图片、自拍或验证码。",
      },
    ],
    sources: [
      {
        title: "Consumer Terms",
        url: "https://www.anthropic.com/legal/consumer-terms",
      },
      {
        title: "Phone verification",
        url: "https://support.claude.com/en/articles/8287232-verify-your-phone-number",
      },
      {
        title: "Identity verification",
        url: "https://support.claude.com/en/articles/14328960-identity-verification-on-claude",
      },
    ],
  },
  {
    slug: "usage-and-appeals",
    title: "Claude Code、API、订阅与账号受限",
    description: "按实际使用入口和官方通知排查，不从浏览器推测停用原因。",
    category: "使用与排查",
    updatedAt: "2026-10-14",
    sections: [
      {
        title: "区分使用入口",
        body: "Claude 网页、官方 Claude Code、API key 与第三方工具的认证和授权范围不同。不要把 API 正常程序调用误判成违规浏览器自动化；第三方工具须按实际认证方式与最新官方规则核对。",
      },
      {
        title: "区分受限状态",
        body: "支付失败、额度耗尽、地区提示、身份核验与账号停用分别走不同的排查路径。官方列出的停用原因包括反复违反使用政策、从不支持地区注册和违反服务条款；不能靠现在的 IP 推断具体停用原因。",
      },
      {
        title: "受限后的处理",
        body: "如果账号被错误停用，应登录官方账号访问申诉流程，提供真实且相关的信息。不要把重新注册或修改设备特征当作恢复原账号的方法。",
      },
      {
        title: "政策日期",
        body: "核对资料时需区分公告日期和生效日期。2026 年 10 月公布、11 月 12 日才生效的使用政策，在生效前不能作为当前规则执行。自动新闻更新也不应自动修改检查规则。",
      },
    ],
    sources: [
      {
        title: "Login and third-party access",
        url: "https://support.claude.com/en/articles/13189465-log-in-to-your-claude-account",
      },
      {
        title: "Warnings and appeals",
        url: "https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals",
      },
      {
        title: "Currently effective Usage Policy",
        url: "https://www.anthropic.com/legal/archive/22742366-2ef0-4c7a-a833-6523f10d3944",
      },
    ],
  },
];
