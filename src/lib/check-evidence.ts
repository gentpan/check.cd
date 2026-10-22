export type CheckEvidence = { method: string; limitation: string; permission: string; url: string };
type Entry = [string, string, string];
const browserDoc = "https://developer.mozilla.org/en-US/docs/Web/API/";
const entries: Record<string, Entry> = {
  country: ["使用可信入口 IP 查询第三方国家与地区数据库。", "网络出口的位置估计，不是人的实际所在地；地区政策另按当前产品规则核对。", "https://ipinfo.io/developers"],
  ipAddress: ["读取服务端连接地址，或部署时明确配置的可信反向代理头。", "代理必须覆盖该头；本地开发或无法确认公网地址时保留未知，不以服务器地址替代。", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For"],
  ipType: ["使用 IP 情报供应商返回的网络分类。", "住宅、机房和移动网络是供应商分类，可能过时；不代表账号可用性。", "https://ipinfo.io/developers"],
  ipMarks: ["读取供应商明确返回的 VPN、代理、Tor 和滥用标记。", "未提供字段为未知；没有标记不能证明没有代理。不同供应商可能不一致。", "https://ipinfo.io/developers"],
  aiSubscription: ["仅在供应商明确提供该字段时展示。", "当前情报源不提供 Anthropic 订阅资格判断；不得用网络类型或自造分数代替。", "https://ipinfo.io/developers"],
  proxyCountry: ["通过 WebRTC ICE / STUN 收集浏览器可见的公网候选地址。", "不请求摄像头或麦克风。无候选、超时和禁用均不能证明无泄漏；IPv4/IPv6 差异可能是双栈。", browserDoc + "RTCIceCandidate/type"],
  clientProfile: ["根据 User-Agent、平台报告值与触控能力推测浏览器、系统和设备。", "浏览器报告值可被缩减或修改，不能证明物理设备身份。", browserDoc + "Navigator/userAgent"],
  userAgent: ["读取 navigator.userAgent。", "可能是兼容字符串、被缩减或被修改；不能单独准确识别全部设备。", browserDoc + "Navigator/userAgent"],
  language: ["读取 navigator.languages / navigator.language。", "仅表示浏览器语言偏好，不用于推断所在地或账号风险。", browserDoc + "Navigator/languages"],
  languageVariant: ["根据浏览器语言标签区分文字偏好。", "不是对用户国籍、实际所在地或所输入文字的识别。", browserDoc + "Navigator/languages"],
  locale: ["读取 Intl.DateTimeFormat().resolvedOptions().locale。", "表示格式化偏好，可能与界面语言或所在地不同。", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions"],
  timezone: ["读取 Intl 报告的时区标识。", "系统设置、旅行及隐私保护会影响结果；不等于当前物理位置。", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/resolvedOptions"],
  timezoneOffset: ["读取本次采样日期的本地 UTC 偏移。", "偏移随夏令时和日期变化，同一偏移对应多个国家。", "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset"],
  emojiStyle: ["根据 User-Agent 与平台识别结果推测常见 Emoji 风格，未比较 Emoji 像素。", "自定义字体与渲染引擎可能与系统默认不同；仅作推测，不计风险。", browserDoc + "Navigator/userAgent"],
  screen: ["读取 Screen 的 CSS 像素值、像素比和色深。", "不是面板物理分辨率；缩放、外接显示器及隐私策略会改变报告值。", browserDoc + "Screen"],
  viewport: ["读取当前窗口的布局视口尺寸。", "窗口大小、工具栏、缩放和旋转都会影响结果。", browserDoc + "Window/innerWidth"],
  hardware: ["读取可用的逻辑处理器数量和近似设备内存。", "浏览器可能降低或不提供数值，不能当作精确硬件配置。", browserDoc + "Navigator/hardwareConcurrency"],
  touch: ["读取 navigator.maxTouchPoints。", "桌面模式、混合设备及浏览器策略会影响报告值。", browserDoc + "Navigator/maxTouchPoints"],
  chineseFonts: ["比较候选字体和回退字体的文字宽度。", "字体别名、相同字宽或回退可造成误判；不证明位置，不要求安装或删除字体。", browserDoc + "CanvasRenderingContext2D/measureText"],
  vendorFonts: ["比较厂商字体与回退字体的测量结果。", "只能作为字体可见性线索；未检出是正常情况，不是异常。", browserDoc + "CanvasRenderingContext2D/measureText"],
  canvasFp: ["在本地 Canvas 绘制并读取测试图像。", "隐私模式可限制或随机化读取；不可用保留未知，不判账号风险。", browserDoc + "Canvas_API"],
  webgl: ["尝试建立 WebGL 上下文并读取允许公开的渲染信息。", "软件渲染、遮蔽厂商信息和关闭加速均可由正常策略造成。", browserDoc + "WebGL_API"],
  audioFp: ["使用离线音频上下文处理本地测试信号。", "不使用麦克风；不可用可能是浏览器策略。采样率和耗时不是设备身份证明。", browserDoc + "OfflineAudioContext"],
  automation: ["读取标准 WebDriver 状态和已暴露的自动化线索。", "自动化可能是用户正常测试行为；未暴露线索不证明没有自动化。", browserDoc + "Navigator/webdriver"],
  permissions: ["查询浏览器支持查询的权限状态。", "不主动申请权限；prompt、denied 和不支持是不同状态，不能互相替代。", browserDoc + "Permissions/query"],
  plugins: ["读取浏览器公开的插件 / PDF 能力信息。", "现代浏览器会固定或隐藏插件列表；空列表不能当成自动化证据。", browserDoc + "Navigator/plugins"],
  storage: ["读取 Cookie 开关、写入并清理 localStorage 测试键，检查 IndexedDB API 是否存在。", "Cookie 开关和 IndexedDB API 存在不等于实际读写成功；站点策略、隐私模式或配额会限制能力，不清空用户其他数据。", browserDoc + "Web_Storage_API"],
  langTz: ["并列展示浏览器语言与时区。", "两个设置可独立选择，不据此判断国籍、所在地或账号风险。", browserDoc + "Navigator/languages"],
  tzIp: ["按当前日期，将报告的时区偏移与 IP 国家对应的 IANA 时区交叉比较。", "国家可能跨时区；旅行、远程出口和数据库误差均可导致差异，只作待核对线索。", "https://www.iana.org/time-zones"],
  uaPlatform: ["比较 User-Agent、Client Hints 及平台报告值。", "兼容模式和 iPad 桌面模式会改变值；差异不证明伪造。", browserDoc + "Navigator/userAgentData"],
  glOs: ["将浏览器报告的渲染器与平台信息作启发式对照。", "Apple GPU、软件渲染、虚拟机及外接 GPU 均可跨设备使用；不计账号风险。", browserDoc + "WebGL_API"],
};

export const evidenceEntries = entries;
export function checkEvidence(id: string, locale: string): CheckEvidence {
  const entry = entries[id];
  const zh = locale === "zh" || locale === "zh-HK";
  return {
    method: zh ? entry?.[0] ?? "读取浏览器或服务端返回的本次观察。" : id === "proxyCountry" ? "Collect browser-visible public WebRTC ICE / STUN candidates." : id.startsWith("ip") || id === "country" ? "Read trusted request metadata or configured IP intelligence." : "Read the browser API for this check at the time of measurement.",
    limitation: zh ? entry?.[1] ?? "未取得数据时保持未知。" : "Browser policies, privacy protections and provider data can limit this result. Missing data is unknown; inferences do not establish location, account eligibility or safety.",
    permission: id === "proxyCountry" ? (zh ? "联系 STUN 服务，不请求摄像头或麦克风权限；可见的额外公网候选会交由已配置的 IPinfo 查询。" : "Contacts STUN without media permissions. Additional public candidates may be queried through configured IPinfo.") : ["country", "ipType", "ipMarks", "aiSubscription"].includes(id) ? (zh ? "仅在服务端已配置 IPinfo 时，将公网出口 IP 发给该供应商；不请求设备权限。" : "Sends the public exit IP to IPinfo only when configured on the server. No device permission is requested.") : zh ? "不主动申请设备权限；自动采样在本地进行。点击 AI 注释后，本项值会发送给已配置的 AI 服务。" : "No device permission is requested; automatic sampling is local. Requesting an AI annotation sends this check's value to the configured AI service.",
    url: entry?.[2] ?? browserDoc,
  };
}
