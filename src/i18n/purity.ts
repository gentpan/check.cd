// IP 情报文案：查询时间与供应商数据库更新时间不同；缺失项目保持未知。
import type { LocaleCode } from "@/i18n/messages";

export type IpPurityFlag = "vpn" | "proxy" | "residentialProxy" | "tor" | "datacenter" | "mobile" | "abuser";

export type PurityCopy = {
  title: string;
  envTitle: string;
  loading: string;
  failed: string;
  source: string;
  unavailableScore: string;
  unknownFlags: string;
  sourceStatuses: Record<"live" | "cached" | "unconfigured" | "error", string>;
  sourceErrors: Record<string, string>;
  higherCleaner: string;
  higherRisk: string;
  recheck: string;
  place: string;
  device: string;
  noHits: string;
  location: string;
  network: string;
  type: string;
  native: string;
  cleanFlags: string;
  marks: string;
  ai: string;
  summary: (score: number) => string;
  flags: Record<IpPurityFlag, string>;
  aiLevels: Record<"safe" | "caution" | "risk", string>;
  dimensions: Record<"identity" | "anonymity" | "abuse" | "blacklist" | "attack" | "local", string>;
  ipTypes: Record<string, string>;
  nativeLabels: Record<string, string>;
};

const zh: PurityCopy = {
  title: "IP 网络情报",
  envTitle: "技术观察分",
  loading: "正在核对当前访问 IP",
  failed: "未取得可信的访问 IP，请核对代理配置",
  source: "IPinfo 提供 IP 归属与套餐可用的匿名标记。查询时间不代表数据库更新时间；结果不能证明实际位置、访问资格或账号安全。",
  unavailableScore: "供应商未提供评分",
  unknownFlags: "匿名与滥用标记未完整提供，无法排除代理或滥用",
  sourceStatuses: { live: "本次查询", cached: "5 分钟内缓存", unconfigured: "情报服务未配置", error: "情报查询失败" },
  sourceErrors: { unconfigured: "IPinfo 配置未完成，请核对 API token 与套餐名称；已确认的访问 IP 仍会保留。", "provider-auth": "IPinfo 凭据或套餐权限不可用。", "provider-rate-limit": "IPinfo 请求额度已用尽，稍后再试。", "provider-unavailable": "IPinfo 暂时不可用，未使用过期结果。", "provider-invalid": "IPinfo 返回的数据未通过地址与格式核验。", timeout: "IPinfo 查询超时，情报保持未知。" },
  higherCleaner: "越高越干净",
  higherRisk: "非封禁概率",
  recheck: "重新检测",
  place: "地区与语言",
  device: "设备与系统",
  noHits: "这组信号没有明显命中",
  location: "位置",
  network: "网络",
  type: "类型",
  native: "线路",
  cleanFlags: "供应商未标记 VPN、代理或 Tor（不保证不存在）",
  marks: "标记",
  ai: "AI 订阅",
  summary: (score) => `第三方 IP 声誉评分 ${score}/100，不能证明访问资格或账号安全。`,
  flags: { vpn: "VPN", proxy: "代理", residentialProxy: "住宅代理", tor: "Tor", datacenter: "机房", mobile: "移动网络", abuser: "滥用记录" },
  aiLevels: { safe: "供应商低风险标记", caution: "供应商谨慎标记", risk: "供应商风险标记" },
  dimensions: { identity: "身份", anonymity: "匿名", abuse: "滥用", blacklist: "黑名单", attack: "攻击", local: "本地声誉" },
  ipTypes: { IDC: "机房", Residential: "住宅", Mobile: "移动", VPN: "VPN", Proxy: "代理", Tor: "Tor" },
  nativeLabels: { "Broadcast IP": "广播 IP", "Native IP": "原生 IP" },
};

const zht: PurityCopy = {
  ...zh,
  title: "IP 網絡情報",
  envTitle: "技術觀察分",
  loading: "正在核對目前存取 IP",
  failed: "未取得可信的存取 IP，請核對代理設定",
  source: "IPinfo 提供 IP 歸屬與方案可用的匿名標記。查詢時間不代表資料庫更新時間；結果不能證明實際位置、存取資格或帳號安全。",
  unavailableScore: "供應商未提供評分",
  unknownFlags: "匿名與濫用標記未完整提供，無法排除代理或濫用",
  sourceStatuses: { live: "本次查詢", cached: "5 分鐘內快取", unconfigured: "情報服務未設定", error: "情報查詢失敗" },
  sourceErrors: { unconfigured: "IPinfo 設定未完成，請核對 API token 與方案名稱；已確認的存取 IP 仍會保留。", "provider-auth": "IPinfo 憑據或方案權限不可用。", "provider-rate-limit": "IPinfo 請求額度已用盡，請稍後再試。", "provider-unavailable": "IPinfo 暫時不可用，未使用過期結果。", "provider-invalid": "IPinfo 回傳資料未通過位址與格式核驗。", timeout: "IPinfo 查詢逾時，情報保持未知。" },
  higherCleaner: "越高越乾淨",
  higherRisk: "非封禁概率",
  recheck: "重新檢測",
  place: "地區與語言",
  device: "設備與系統",
  noHits: "這組信號沒有明顯命中",
  location: "位置",
  network: "網絡",
  type: "類型",
  native: "線路",
  cleanFlags: "供應商未標記 VPN、代理或 Tor（不保證不存在）",
  marks: "標記",
  ai: "AI 訂閱",
  summary: (score) => `第三方 IP 聲譽評分 ${score}/100，不代表存取資格或帳號安全。`,
  flags: { vpn: "VPN", proxy: "代理", residentialProxy: "住宅代理", tor: "Tor", datacenter: "機房", mobile: "移動網絡", abuser: "濫用紀錄" },
  aiLevels: { safe: "供應商低風險標記", caution: "供應商謹慎標記", risk: "供應商風險標記" },
  dimensions: { identity: "身份", anonymity: "匿名", abuse: "濫用", blacklist: "黑名單", attack: "攻擊", local: "本地聲譽" },
  ipTypes: { IDC: "機房", Residential: "住宅", Mobile: "移動", VPN: "VPN", Proxy: "代理", Tor: "Tor" },
};

const ru: PurityCopy = {
  title: "Сетевые данные IP",
  envTitle: "Технические наблюдения",
  loading: "Проверяем IP текущего подключения",
  failed: "Надёжный IP подключения недоступен. Проверьте настройки прокси.",
  source: "IPinfo предоставляет геолокацию IP и доступные по тарифу признаки анонимизации. Время запроса не равно времени обновления базы. Данные не подтверждают местоположение, право доступа или безопасность аккаунта.",
  unavailableScore: "Поставщик не предоставил оценку",
  unknownFlags: "Данные об анонимизации и жалобах неполные; исключить прокси и злоупотребления нельзя",
  sourceStatuses: { live: "Текущий запрос", cached: "Кэш до 5 минут", unconfigured: "Сервис не настроен", error: "Запрос не выполнен" },
  sourceErrors: { unconfigured: "IPinfo не настроен: проверьте токен API и название тарифа. Подтверждённый IP сохраняется.", "provider-auth": "Токен или права тарифа IPinfo недоступны.", "provider-rate-limit": "Лимит запросов IPinfo исчерпан. Повторите позже.", "provider-unavailable": "IPinfo временно недоступен. Устаревшие данные не использованы.", "provider-invalid": "Ответ IPinfo не прошёл проверку IP или формата.", timeout: "Время ожидания IPinfo истекло; данные неизвестны." },
  higherCleaner: "Чем выше, тем чище",
  higherRisk: "Не вероятность блокировки",
  recheck: "Проверить снова",
  place: "Регион и язык",
  device: "Устройство и система",
  noHits: "В этой группе нет явных совпадений",
  location: "Локация",
  network: "Сеть",
  type: "Тип",
  native: "Линия",
  cleanFlags: "Поставщик не отметил VPN, прокси или Tor; отсутствие не гарантировано",
  marks: "Отметки",
  ai: "Подписка AI",
  summary: (score) => `Оценка репутации IP третьей стороной: ${score}/100. Не подтверждает право доступа или безопасность аккаунта.`,
  flags: { vpn: "VPN", proxy: "Прокси", residentialProxy: "Резидентный прокси", tor: "Tor", datacenter: "Дата-центр", mobile: "Мобильная сеть", abuser: "Жалобы" },
  aiLevels: { safe: "Низкий риск по данным поставщика", caution: "Осторожно по данным поставщика", risk: "Риск по данным поставщика" },
  dimensions: { identity: "Личность", anonymity: "Анонимность", abuse: "Злоупотребления", blacklist: "Черные списки", attack: "Атаки", local: "Локальная репутация" },
  ipTypes: { IDC: "Дата-центр", Residential: "Резидентный", Mobile: "Мобильный", VPN: "VPN", Proxy: "Прокси", Tor: "Tor" },
  nativeLabels: { "Broadcast IP": "Широковещательный IP", "Native IP": "Нативный IP" },
};

const en: PurityCopy = {
  title: "IP intelligence",
  envTitle: "Technical observations",
  loading: "Checking the IP you are using",
  failed: "A trusted visitor IP is unavailable. Check the proxy configuration.",
  source: "IPinfo supplies IP geolocation and plan-dependent privacy flags. Query time is not the database update time. Results do not establish physical location, eligibility, or account safety.",
  unavailableScore: "No score supplied by the provider",
  unknownFlags: "Privacy and abuse coverage is incomplete; proxy use and abuse cannot be ruled out",
  sourceStatuses: { live: "Current query", cached: "Cached for up to 5 minutes", unconfigured: "Intelligence not configured", error: "Intelligence unavailable" },
  sourceErrors: { unconfigured: "IPinfo configuration is incomplete. Check the API token and tier name. A confirmed visitor IP is retained.", "provider-auth": "IPinfo credentials or plan permissions are unavailable.", "provider-rate-limit": "The IPinfo request quota is exhausted. Try again later.", "provider-unavailable": "IPinfo is temporarily unavailable. Expired data was not used.", "provider-invalid": "The IPinfo response failed address or format validation.", timeout: "IPinfo timed out. Intelligence remains unknown." },
  higherCleaner: "Higher is cleaner",
  higherRisk: "Not a ban probability",
  recheck: "Check again",
  place: "Region and language",
  device: "Device and system",
  noHits: "No strong hits in this group",
  location: "Location",
  network: "Network",
  type: "Type",
  native: "Route",
  cleanFlags: "Provider did not flag VPN, proxy, or Tor; absence is not guaranteed",
  marks: "Marks",
  ai: "AI subscription",
  summary: (score) => `Third-party IP reputation: ${score}/100. Does not establish eligibility or account safety.`,
  flags: { vpn: "VPN", proxy: "Proxy", residentialProxy: "Residential proxy", tor: "Tor", datacenter: "Datacenter", mobile: "Mobile", abuser: "Abuse reports" },
  aiLevels: { safe: "Provider: lower risk", caution: "Provider: caution", risk: "Provider: risk" },
  dimensions: { identity: "Identity", anonymity: "Anonymity", abuse: "Abuse", blacklist: "Blacklists", attack: "Attacks", local: "Local reputation" },
  ipTypes: { IDC: "Datacenter", Residential: "Residential", Mobile: "Mobile", VPN: "VPN", Proxy: "Proxy", Tor: "Tor" },
  nativeLabels: { "Broadcast IP": "Broadcast IP", "Native IP": "Native IP" },
};

export const purityCopy: Record<LocaleCode, PurityCopy> = {
  zh,
  "zh-HK": zht,
  ru,
  en,
};
