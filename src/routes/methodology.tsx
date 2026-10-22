import { createFileRoute } from "@tanstack/react-router";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { detectionConfig, signalCategoryOrder } from "@/detection/config";
import { detectorLocaleText } from "@/detection/locale";
import { checkEvidence } from "@/lib/check-evidence";
import { CLAUDE_REGION_POLICY } from "@/lib/claude-regions";

export const Route = createFileRoute("/methodology")({
  head: () => ({ meta: [{ title: "检测方法、数据来源与准确性边界｜check.cd" }, { name: "description", content: "每项环境检查如何获取、如何验证、为什么缺失不等于正常，以及 IP、浏览器和账号条件各自的判断边界。" }] }),
  component: Methodology,
});

function Methodology() {
  const text = detectorLocaleText.zh;
  const enabled = Object.entries(detectionConfig.signals).filter(([, config]) => config.enabled).sort(([, a], [, b]) => a.order - b.order);
  return <SiteFrame><main className="page-content methodology-page">
    <div className="eyebrow">HOW WE MEASURE</div><h1 className="page-title">每一个结果，都有边界。</h1><p className="page-description">检查的目标是记录可验证的技术事实。我们不预测封禁，不以语言、字体或设备特征推断真实所在地，也不把缺失数据换算成安全分。</p>
    <div className="method-principles">{[["01", "实测与推断分开", "浏览器 API 报告的是本次软件可见值；字体、平台及地区交叉对照只是推断。"], ["02", "未知也是结果", "无权限、不支持、超时、供应商缺字段都会保留未知。数据覆盖率只表示取得了多少项。"], ["03", "来源与时间可追溯", "记录采样时间、可信出口来源、供应商查询与缓存状态；查询时间不是数据库更新时间。"]].map(([number, title, body]) => <article className="squircle method-principle" key={number}><span>{number}</span><h2>{title}</h2><p>{body}</p></article>)}</div>
    <section className="method-section"><div className="landing-section-heading"><span className="landing-eyebrow">CHECK INVENTORY</span><h2>本次检查，具体获取什么？</h2><p>当前启用 {enabled.length} 项。点击任意一项，查看采样方式、权限和可能的误差。</p></div>
      <div className="method-categories">{signalCategoryOrder.map(category => <section className="squircle method-category" key={category}><h3>{text.categories[category].name}</h3><p>{text.categories[category].desc}</p>{enabled.filter(([, config]) => config.category === category).map(([id]) => { const evidence = checkEvidence(id, "zh"); return <details className="method-check" key={id}><summary>{text.signalLabels[id]}<span aria-hidden="true">＋</span></summary><dl><div><dt>如何获取</dt><dd>{evidence.method}</dd></div><div><dt>权限与外部请求</dt><dd>{evidence.permission}</dd></div><div><dt>不能据此判断</dt><dd>{evidence.limitation}</dd></div></dl><a href={evidence.url} target="_blank" rel="noreferrer">查看技术依据 ↗</a></details>; })}</section>)}</div>
    </section>
    <section className="squircle method-verification"><span className="landing-eyebrow">VERIFY, THEN CONCLUDE</span><h2>怎样让检测更可靠？</h2><ol><li><strong>先建立已知事实。</strong>用你实际使用的设备、运营商、VPN 配置和可信边缘日志作为对照。不要拿 IP 数据库自己验证自己。</li><li><strong>一次只改变一个条件。</strong>分别测试浏览器、隐私模式、IPv4 / IPv6、VPN 开关与分流策略，重复采样并记录差异。</li><li><strong>按字段核对来源。</strong>IPinfo Lite 只提供国家和 ASN 等基本信息。匿名网络标记需要相应套餐；未提供的评分、滥用或订阅资格不自行推算。</li><li><strong>把不可判断的情况保留下来。</strong>没有 WebRTC 候选不保证没有其他出口，官方服务状态正常不保证你的账号或当前链路可用。</li></ol><p>本项目的回归测试验证代码规则和错误处理。真实网络、运营商与供应商标签的准确率，需要人工标注的对照样本，当前不提供未经验证的准确率百分比。</p></section>
    <section className="method-section"><h2>还有哪些事情，网页无法替你确认？</h2><p>当前不测量 DNS 泄漏、TLS / HTTP 指纹、实际丢包和吞吐，不读取 Claude 账号、付款卡、身份材料或终端配置。Claude Code 终端可能走另一条代理链，网页出口不能代替终端出口。账号条件可在首页的可选问卷中自述核对。</p><p>可选浏览器定位只在点击后请求授权，并在本页用国家边界做粗略匹配；坐标不会发给 AI。边界附近、低精度或无授权时保持不确定。</p></section>
    <section className="squircle method-policy"><h2>地区规则按产品与生效日核对</h2><p>审核快照：{CLAUDE_REGION_POLICY.checkedAt}。消费者服务与 API 的来源分别记录。已公布的 {CLAUDE_REGION_POLICY.announced.effectiveAt} 政策不会提前或自动代替已审核的现行规则；来源冲突的地区保留待核对。</p><div><a href={CLAUDE_REGION_POLICY.currentSources.claude} target="_blank" rel="noreferrer">Claude 消费者服务 ↗</a><a href={CLAUDE_REGION_POLICY.currentSources.api} target="_blank" rel="noreferrer">API 支持地区 ↗</a><a href={CLAUDE_REGION_POLICY.announced.source} target="_blank" rel="noreferrer">未来政策公告 ↗</a></div></section>
    <a href="/#checker" className="primary-btn squircle mt-8">返回环境检测 ↗</a>
  </main><SiteFooter /></SiteFrame>;
}
