import { useMemo, useState } from "react";
import { evaluateAccount, type AccountAnswers } from "@/lib/account-check";
import countries from "@/i18n/countries.json";
const countryOptions = [["unknown", "不确定 / 跳过"], ...Object.entries(countries.zh)];
const scenes = [
  { id: "register", label: "注册问题", rules: ["actualCountry", "registrationCountry", "ownership"] },
  { id: "pay", label: "支付问题", rules: ["paymentChannel", "storeBilling", "billingCountries"] },
  { id: "restricted", label: "账号受限", rules: ["accountStatus", "usage", "registrationCountry"] },
];
export function AccountCheck() {
  const [scene, setScene] = useState("register");
  const [answers, setAnswers] = useState<AccountAnswers>({ stage: "use" });
  const [finished, setFinished] = useState(false);
  const active = scenes.find(item => item.id === scene)!;
  const results = useMemo(() => evaluateAccount(answers).filter(item => active.rules.includes(item.id)), [answers, active]);
  const field = (id: string, label: string, options: string[][]) => <label className="form-field" key={id}><span>{label}</span><select className="squircle account-select" value={answers[id] ?? "unknown"} onChange={event => { setAnswers(previous => ({...previous, [id]: event.target.value})); setFinished(false); }}>{options.map(([value, title]) => <option key={value} value={value}>{title}</option>)}</select></label>;
  return <div className="pt-5">
    <div className="mb-5 flex flex-wrap gap-2">{scenes.map(item => <button key={item.id} className={`tab-btn squircle ${scene === item.id ? "tab-btn-active" : ""}`} onClick={() => { setScene(item.id); setAnswers({stage: item.id === "pay" ? "pay" : "use"}); setFinished(false); }}>{item.label}</button>)}</div>
    <div className="grid gap-4 sm:grid-cols-3">
      {scene === "register" && <>{field("actualCountry", "现在实际在哪个国家？", countryOptions)}{field("registrationCountry", "注册时实际在哪个国家？", countryOptions)}{field("ownership", "账号从哪里获得？", [["unknown","不确定 / 跳过"],["self","本人注册"],["purchased","购买 / 代注册"],["shared","共享账号"]])}</>}
      {scene === "pay" && <>{field("paymentChannel", "在哪里付款？", [["unknown","不确定 / 跳过"],["web","Claude 官网"],["apple","Apple App Store"],["google","Google Play"]])}{answers.paymentChannel === "web" && <>{field("cardCountry", "发卡国家", countryOptions)}{field("billingCountry", "账单国家", countryOptions)}</>}</>}
      {scene === "restricted" && <>{field("status", "看到什么提示？", [["unknown","不确定 / 跳过"],["banned","账号停用"],["identity","身份核验"],["region","地区不支持"],["quota","额度 / 速率限制"]])}{field("usage", "通过什么使用 Claude？", [["unknown","不确定 / 跳过"],["official","官方网页 / 客户端 / Claude Code"],["api","API key"],["thirdparty-subscription","第三方工具使用订阅凭据"]])}{field("registrationCountry", "注册时实际所在国家", countryOptions)}</>}
    </div>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted">最多 3 个问题，任何一项都可以跳过。不上传回答。</p><button className="primary-btn squircle" onClick={() => setFinished(true)}>查看建议</button></div>
    {finished && <div className="account-results" aria-live="polite"><p className="text-xs leading-6 text-muted">以下仅核对本项自述与公开资料，不验证账号、银行记录或完整使用资格。</p>{results.map(item => <article key={item.id} className="squircle account-result-card"><h3 className="text-sm font-medium">{item.title} <span className="squircle result-status bg-surface-muted ml-2 text-xs text-muted">{item.state === "unknown" ? "信息不足" : item.state === "attention" ? "需要核对" : item.state === "ok" ? "本项自述匹配" : "说明"}</span></h3><p className="mt-2 text-sm leading-7 text-muted">{item.detail}</p><a href={item.source} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-accent">查看官方依据 ↗</a></article>)}</div>}
  </div>;
}
