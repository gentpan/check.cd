// CheckCC 的检测模块本地化工具，用于定义检测文案结构并按语言展示地区、信号、信号组和风险修复建议。
import type { LocaleCode } from "@/i18n/messages";
import type { SignalCategory } from "./types";
import type { RegionCode } from "./types";

export type TargetRegion = RegionCode | "hk";

export type CategoryMeta = { name: string; desc: string };

export type DetectorLocaleText = {
  pending: string;
  unknown: string;
  signalLabels: Record<string, string>;
  signalValues: Record<string, string>;
  categories: Record<SignalCategory, CategoryMeta>;
  stages: Record<SignalCategory, string>;
  fixes: Record<string, string>;
  ui: {
    all: string;
    hits: string;
    expand: string;
    weight: string;
    contribution: string;
    statusHit: string;
    statusWarn: string;
    statusClear: string;
    statusInfo: string;
    noFix: string;
    clean: string;
  };
  ipMetricLabels: Record<string, string>;
  regions: Record<TargetRegion, string>;
  status: Record<string, string>;
  risk: { waiting: string; checking: string; supported: string; blocked: string; high: string; light: string };
  valueMap: Record<string, string>;
  confidence: { high: string; medium: string; low: string; safe: string; highRiskRegion: string; supportedRegion: string };
};

export function localizeLocation(value: string, locale: LocaleCode) {
  if (locale !== "ru") return value;
  return value.replace(/日本/g, "Япония").replace(/东京都/g, "Токио").replace(/东京/g, "Токио").replace(/中国大陆/g, "материковый Китай").replace(/中国/g, "Китай");
}

const zhCategories: Record<SignalCategory, CategoryMeta> = {
  network: { name: "网络与出口", desc: "本站请求出口、供应商网络分类与 WebRTC 可见路径" },
  browser: { name: "浏览器身份", desc: "User-Agent、语言、Intl 区域、时区与 Emoji 渲染" },
  device: { name: "设备技术信息", desc: "浏览器报告值，可能被近似或限制；不证明物理硬件、所在地或账号安全" },
  runtime: { name: "运行时与自动化", desc: "自动化标记、权限状态、存储与内置 PDF 能力" },
  consistency: { name: "一致性校验", desc: "比较浏览器报告与网络情报，差异结合实际情况核对" },
};

const zhFixes: Record<string, string> = {
  country: "核对真实所在地及官方地区政策。只改变网络出口不能证明使用资格。",
  ipType: "核对实际网络类型。住宅、移动和机房标记均不能单独预测封禁。",
  ipMarks: "第三方代理或滥用标记可能误判，可向网络服务商确认；不是官方风控结论。",
  aiSubscription: "第三方 AI 订阅标签不能证明 Claude 账号或支付可用。",
  proxyCountry: "另一条地址可能来自双栈或路由差异。核对实际网络路径，不能直接断定真实 IP 泄漏。",
  language: "浏览器首选语言可以与所在地不同，无需为检测分数更改。",
  languageVariant: "这是语言偏好线索，不证明所在地、账号风险或使用资格，无需更改。",
  locale: "系统区域设置是用户偏好，不证明真实所在地或使用资格。",
  timezone: "系统时区可以与网络出口不同；结合旅行、远程网络等实际情况核对。",
  timezoneOffset: "这是当前日期的系统 UTC 偏移，不代表真实所在地。",
  emojiStyle: "这是基于浏览器识别结果的风格推测，未验证 Emoji 像素，不需要更换设备或设置。",
  screen: "屏幕与视口是浏览器提供的 CSS 像素读数，受缩放、外接显示器与隐私设置影响。",
  hardware: "这是浏览器报告的逻辑处理器数量及近似内存，并非精确硬件规格。",
  touch: "触摸屏电脑、平板桌面模式和外设均可报告触摸能力，属于正常兼容性信息。",
  chineseFonts: "中文字体只能说明设备安装了相关字体，不能证明所在地，无需为使用 Claude 删除字体。",
  vendorFonts: "厂商字体属于兼容性线索，不能证明设备所在地或账号风险。",
  canvasFp: "检查浏览器兼容性。读取受限不能证明封禁风险，无需为分数关闭隐私保护。",
  webgl: "软件渲染可能由驱动、远程桌面或设置导致，不是封禁证据。",
  audioFp: "音频读取限制属于兼容性线索，不是账号封禁证据。",
  automation: "核对实际使用方式及官方条款。API 和明确许可的自动化另有规则。",
  permissions: "权限受浏览器、站点策略和隐私设置影响；通知权限 API 差异不能证明自动化。",
  plugins: "现代插件列表主要反映内置 PDF 支持，列表为空不证明无头浏览器，也不是扩展清单。",
  langTz: "语言没有固定时区；多语言、移居和旅行都很常见，这一项只展示设置。",
  tzIp: "差异可能来自旅行、远程网络或数据库误差。核对实际情况，无需伪装时区。",
  uaPlatform: "平台 API 可以为兼容或隐私返回不同平台；差异是启发式线索，不能证明伪装。",
  glOs: "GPU 厂商不限定操作系统；远程桌面、驱动和隐私限制会改变报告值，不据此判断账号风险。",
};

export const detectorLocaleText: Record<LocaleCode, DetectorLocaleText> = {
  zh: {
    pending: "等待检测",
    unknown: "未知",
    signalLabels: {
      country: "网络出口地区", ipAddress: "访问 IP", ipType: "IP 线路类型", ipMarks: "供应商网络标记", aiSubscription: "订阅资格（无法自动验证）", proxyCountry: "WebRTC 可见路径",
      clientProfile: "客户端画像", userAgent: "User-Agent", language: "浏览器语言", languageVariant: "语言文字特征", locale: "Intl 区域设置", timezone: "系统时区", timezoneOffset: "时区偏移", emojiStyle: "Emoji 风格推测（基于 UA）",
      screen: "浏览器报告的屏幕", viewport: "当前视口", hardware: "逻辑处理器 / 近似内存", touch: "触摸能力", chineseFonts: "中文字体线索", vendorFonts: "厂商字体线索", canvasFp: "Canvas 图像读取", webgl: "WebGL 渲染器", audioFp: "离线音频渲染",
      automation: "自动化框架痕迹", permissions: "权限状态", plugins: "插件与 PDF", storage: "存储能力",
      langTz: "语言 × 时区", tzIp: "时区 × IP 归属", uaPlatform: "UA × 平台 API", glOs: "渲染器 × 系统",
    },
    signalValues: {
      unknown: "未知", noBrands: "无 UA-CH brands", noLanguageVariant: "未命中重点语言文字", simplifiedChinese: "中文简体", traditionalChinese: "中文繁体", scFonts: "简体中文字体", tcFonts: "中文繁体字体", noFonts: "未命中重点地区字体", vendorFonts: "设备厂商字体", noVendorFonts: "未命中设备厂商字体", noDevice: "未命中重点设备特征", unknownBrowser: "未知浏览器", unknownSystem: "未知系统", wechatBrowser: "微信内置浏览器", androidDevice: "Android 设备", linuxDevice: "Linux 设备", appleEmoji: "Apple Emoji 风格", androidEmoji: "Android / 厂商 Emoji 风格", windowsEmoji: "Windows Emoji 风格", unknownEmoji: "未知 Emoji 风格", read: "已读取",
      cores: "{n} 个逻辑处理器", memoryUnknown: "内存未知", touchPoints: "最多 {n} 点触控", touchCoarse: "触屏优先", touchFine: "指针优先",
      canvasSize: "Canvas 图像编码长度 {n}", canvasBlocked: "Canvas 读取不可用或受限", webglNone: "未取得 WebGL 渲染器", softwareRenderer: "软件渲染", audioRate: "离线测试采样率 {n}Hz（由测试指定）", audioLatency: "延迟 {n}s", audioBlocked: "音频渲染不可用",
      automationFound: "发现痕迹", automationClean: "未发现自动化痕迹", notificationPermission: "通知权限", permissionUnknown: "权限状态未知", pluginsEmpty: "插件列表为空",
      consistent: "一致", inconsistent: "矛盾", waitingIp: "等待 IP 情报…", platformApiUnknown: "平台 API 不可用",
    },
    categories: zhCategories,
    stages: { network: "网络与出口", browser: "浏览器身份", device: "设备指纹", runtime: "运行时与自动化", consistency: "一致性校验" },
    fixes: zhFixes,
    ui: { all: "全部", hits: "仅看命中", expand: "查看详情", weight: "权重", contribution: "风险贡献", statusHit: "命中", statusWarn: "关注", statusClear: "干净", statusInfo: "信息", noFix: "这是一项信息项，无需处理。", clean: "未发现计分异常" },
    ipMetricLabels: { ipAddress: "IP 地址", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "ASN 所有者", company: "企业", longitude: "经度", latitude: "纬度", ipType: "IP 类型", risk: "风控值", isp: "ISP" },
    regions: { auto: "自动检测", cn: "中国大陆", hk: "香港", ru: "俄罗斯", ir: "伊朗" },
    status: { restricted: "需核对技术线索", possibly_supported: "需要进一步确认", unsupported: "不支持", supported: "未发现计分异常", unknown: "未确认" },
    risk: { waiting: "等待检测", checking: "检测中", supported: "未发现计分异常", blocked: "较多技术异常", high: "需核对技术线索", light: "存在技术线索" },
    valueMap: { "中国大陆 IP": "中国大陆 IP", "访问和订阅风险极高": "访问和订阅风险极高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "仅供核对，不能确认", highRiskRegion: "高风险地区", supportedRegion: "官方支持地区" },
  },
  "zh-HK": {
    pending: "等待檢測",
    unknown: "未知",
    signalLabels: {
      country: "網絡出口地區", ipAddress: "訪問 IP", ipType: "IP 線路類型", ipMarks: "供應商網絡標記", aiSubscription: "訂閱資格（無法自動驗證）", proxyCountry: "WebRTC 可见路径",
      clientProfile: "客戶端畫像", userAgent: "User-Agent", language: "瀏覽器語言", languageVariant: "語言文字特徵", locale: "Intl 區域設定", timezone: "系統時區", timezoneOffset: "時區偏移", emojiStyle: "Emoji 風格推測（基於 UA）",
      screen: "屏幕與色深", viewport: "目前視窗", hardware: "CPU 與記憶體", touch: "觸摸能力", chineseFonts: "字體地區特徵", vendorFonts: "廠商字體線索", canvasFp: "Canvas 圖像讀取", webgl: "WebGL 渲染器", audioFp: "離線音頻渲染",
      automation: "自動化框架痕跡", permissions: "權限狀態", plugins: "外掛與 PDF", storage: "儲存能力",
      langTz: "語言 × 時區", tzIp: "時區 × IP 歸屬", uaPlatform: "UA × 平台 API", glOs: "渲染器 × 系統",
    },
    signalValues: {
      unknown: "未知", noBrands: "無 UA-CH brands", noLanguageVariant: "未命中重點語言文字", simplifiedChinese: "中文簡體", traditionalChinese: "中文繁體", scFonts: "中國內地字體", tcFonts: "中文繁體字體", noFonts: "未命中重點地區字體", vendorFonts: "設備廠商字體", noVendorFonts: "未命中設備廠商字體", noDevice: "未命中重點設備特徵", unknownBrowser: "未知瀏覽器", unknownSystem: "未知系統", wechatBrowser: "微信內置瀏覽器", androidDevice: "Android 設備", linuxDevice: "Linux 設備", appleEmoji: "Apple Emoji 風格", androidEmoji: "Android / 廠商 Emoji 風格", windowsEmoji: "Windows Emoji 風格", unknownEmoji: "未知 Emoji 風格", read: "已讀取",
      cores: "{n} 个逻辑处理器", memoryUnknown: "記憶體未知", touchPoints: "最多 {n} 點觸控", touchCoarse: "觸屏優先", touchFine: "指針優先",
      canvasSize: "Canvas 圖像編碼長度 {n}", canvasBlocked: "Canvas 讀取不可用或受限", webglNone: "未取得 WebGL 渲染器", softwareRenderer: "軟體渲染", audioRate: "離線測試取樣率 {n}Hz（由測試指定）", audioLatency: "延遲 {n}s", audioBlocked: "音頻渲染不可用",
      automationFound: "發現痕跡", automationClean: "未發現自動化痕跡", notificationPermission: "通知權限", permissionUnknown: "權限狀態未知", pluginsEmpty: "外掛列表為空",
      consistent: "一致", inconsistent: "矛盾", waitingIp: "等待 IP 情報…", platformApiUnknown: "平台 API 不可用",
    },
    categories: {
      network: { name: "網絡與出口", desc: "訪問 IP 歸屬、線路類型、風險標記與 WebRTC 洩漏" },
      browser: { name: "瀏覽器身份", desc: "User-Agent、語言、Intl 區域、時區與 Emoji 渲染" },
      device: { name: "設備指紋", desc: "屏幕、硬件、字體、Canvas、WebGL 與音頻指紋" },
      runtime: { name: "運行時與自動化", desc: "自動化標記、權限、儲存同內置 PDF 能力" },
      consistency: { name: "一致性校驗", desc: "比較瀏覽器報告同網絡資料，差異按實際情況核對" },
    },
    stages: { network: "網絡與出口", browser: "瀏覽器身份", device: "設備指紋", runtime: "運行時與自動化", consistency: "一致性校驗" },
    fixes: {
      country: "核對實際所在地同當前官方產品規則；只換出口唔證明使用資格。", ipType: "網絡類型只係供應商線索，住宅、移動或機房均唔能單獨預測封禁。", ipMarks: "代理或濫用標記可能有誤差，請按實際網絡核對，唔係官方帳號判定。", aiSubscription: "第三方標記唔能證明 Claude 帳號或支付可用，未提供就保持未知。", proxyCountry: "其他地址可能來自雙棧或路由差異，唔能自動斷定真實 IP 洩漏。",
      language: "語言係閱讀偏好，毋須為出口國家更改。", languageVariant: "文字變體唔證明所在地或帳號風險，毋須更改。", locale: "系統區域係偏好，唔證明實際所在地或使用資格。", timezone: "旅行同遠程網絡可以同系統時區不同，請按實際情況核對。", timezoneOffset: "呢個係當前日期嘅系統 UTC 偏移，唔代表實際所在地。", emojiStyle: "Emoji 風格係按 UA 估計，唔係實際渲染鑑定。",
      screen: "CSS 像素讀數會受縮放、顯示器同私隱設定影響，唔係硬件鑑定。", hardware: "呢啲係瀏覽器報告嘅邏輯處理器同近似記憶體，唔係精確規格。", touch: "觸摸屏電腦、平板桌面模式同外設都可報告觸摸，屬正常能力資料。", chineseFonts: "字體匹配只係近似線索，唔代表所在地，毋須刪除中文字體。", vendorFonts: "廠商字體唔能證明設備所在地或帳號風險。", canvasFp: "Canvas 不可用可能係相容或私隱限制，毋須為結果關閉私隱保護。", webgl: "軟件渲染可能來自驅動、遠程桌面或設定，唔係封禁證據。", audioFp: "離線音頻可能不支援、受限或逾時，唔證明帳號風險。",
      automation: "標記只描述當前會話，請按實際用途同產品官方條款核對。", permissions: "權限受瀏覽器、站點策略同私隱設定影響，API 差異唔證明自動化。", plugins: "現代列表主要反映內置 PDF 支援，空列表唔代表無頭瀏覽器，亦唔係擴充功能清單。",
      langTz: "語言冇固定時區；多語言同旅行都正常，呢項只展示設定。", tzIp: "旅行、遠程網絡同資料庫誤差都可能造成差異，毋須偽裝時區。", uaPlatform: "平台 API 可因相容或私隱而回報不同平台；差異唔證明偽裝。", glOs: "GPU 廠商跨作業系統，遠程桌面同驅動亦會影響回報值，唔據此判帳號風險。",
    },
    ui: { all: "全部", hits: "僅睇命中", expand: "查看詳情", weight: "權重", contribution: "風險貢獻", statusHit: "命中", statusWarn: "關注", statusClear: "乾淨", statusInfo: "資訊", noFix: "這是一項資訊項，無需處理。", clean: "未發現風險" },
    ipMetricLabels: { ipAddress: "IP 地址", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "ASN 擁有者", company: "企業", longitude: "經度", latitude: "緯度", ipType: "IP 類型", risk: "風控值", isp: "ISP" },
    regions: { auto: "自動檢測", cn: "中國內地", hk: "香港", ru: "俄羅斯", ir: "伊朗" },
    status: { restricted: "技術觀察需要核對", possibly_supported: "需要進一步確認", unsupported: "不支援", supported: "未發現計分異常", unknown: "未確認" },
    risk: { waiting: "等待檢測", checking: "檢測中", supported: "未發現計分異常", blocked: "技術異常", high: "需核對技術線索", light: "輕度風險" },
    valueMap: { "中国大陆 IP": "中國內地 IP", "访问和订阅风险极高": "訪問和訂閱風險極高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "僅供核對，無法確認", highRiskRegion: "高風險地區", supportedRegion: "官方支援地區" },
  },
  ru: {
    pending: "Ожидание проверки",
    unknown: "Неизвестно",
    signalLabels: {
      country: "Сетевой выход", ipAddress: "IP визита", ipType: "Тип линии IP", ipMarks: "Отметки риска IP", aiSubscription: "Условия подписки (не проверяются)", proxyCountry: "Наблюдаемый маршрут WebRTC",
      clientProfile: "Профиль клиента", userAgent: "User-Agent", language: "Язык браузера", languageVariant: "Языковые признаки", locale: "Intl locale", timezone: "Часовой пояс", timezoneOffset: "Смещение времени", emojiStyle: "Предполагаемый стиль Emoji (UA)",
      screen: "Экран и цвет", viewport: "Текущее окно", hardware: "CPU и память", touch: "Сенсорный ввод", chineseFonts: "Региональные шрифты", vendorFonts: "Шрифты производителя", canvasFp: "Чтение Canvas", webgl: "WebGL-рендерер", audioFp: "Офлайн-рендеринг аудио",
      automation: "Признаки автоматизации", permissions: "Состояние прав", plugins: "Плагины и PDF", storage: "Хранилище",
      langTz: "Язык × часовой пояс", tzIp: "Часовой пояс × IP", uaPlatform: "UA × платформа API", glOs: "Рендерер × система",
    },
    signalValues: {
      unknown: "Неизвестно", noBrands: "Нет UA-CH brands", noLanguageVariant: "Ключевые языковые признаки не найдены", simplifiedChinese: "Упрощенный китайский", traditionalChinese: "Традиционный китайский", scFonts: "Китайские шрифты", tcFonts: "Традиционные китайские шрифты", noFonts: "Ключевые региональные шрифты не найдены", vendorFonts: "Шрифты производителя", noVendorFonts: "Шрифты производителя не найдены", noDevice: "Ключевые признаки устройства не найдены", unknownBrowser: "Неизвестный браузер", unknownSystem: "Неизвестная система", wechatBrowser: "Встроенный браузер WeChat", androidDevice: "Android-устройство", linuxDevice: "Linux-устройство", appleEmoji: "Стиль Apple Emoji", androidEmoji: "Стиль Android / производителя", windowsEmoji: "Стиль Windows Emoji", unknownEmoji: "Неизвестный стиль Emoji", read: "Считано",
      cores: "{n} ядер", memoryUnknown: "память неизвестна", touchPoints: "касаний: до {n}", touchCoarse: "сенсорный ввод", touchFine: "указатель",
      canvasSize: "длина кодировки Canvas {n}", canvasBlocked: "Чтение Canvas заблокировано", webglNone: "Рендерер WebGL недоступен", softwareRenderer: "программный рендеринг", audioRate: "частота офлайн-теста {n}Гц (задана тестом)", audioLatency: "задержка {n}с", audioBlocked: "Аудио недоступно",
      automationFound: "найдены признаки", automationClean: "признаков автоматизации нет", notificationPermission: "Уведомления", permissionUnknown: "права неизвестны", pluginsEmpty: "Список плагинов пуст",
      consistent: "совпадает", inconsistent: "конфликт", waitingIp: "Ждем сведения об IP…", platformApiUnknown: "платформа API недоступна",
    },
    categories: {
      network: { name: "Сеть и выход", desc: "Страна IP, тип линии, отметки риска и утечки WebRTC" },
      browser: { name: "Личность браузера", desc: "User-Agent, язык, Intl, часовой пояс и стиль Emoji" },
      device: { name: "Отпечаток устройства", desc: "Экран, железо, шрифты, Canvas, WebGL и аудио" },
      runtime: { name: "Среда и автоматизация", desc: "Маркеры автоматизации, права, хранилище и встроенный PDF" },
      consistency: { name: "Согласованность", desc: "Сравнение сообщаемых значений с учётом реального контекста" },
    },
    stages: { network: "Сеть и выход", browser: "Личность браузера", device: "Отпечаток устройства", runtime: "Среда и автоматизация", consistency: "Согласованность" },
    fixes: {
      country: "Сверьте фактическое местоположение и текущие правила продукта. Смена сетевого выхода не подтверждает право доступа.", ipType: "Тип сети — сведения поставщика. Жилой, мобильный или серверный адрес сам по себе не предсказывает блокировку.", ipMarks: "Отметки прокси и злоупотреблений могут ошибаться; сверяйте реальную сеть. Это не официальное решение об аккаунте.", aiSubscription: "Метка поставщика не подтверждает доступность аккаунта или платежа. Отсутствующие данные остаются неизвестными.", proxyCountry: "Другой адрес может быть следствием двойного стека или маршрутизации и не доказывает утечку.",
      language: "Язык — предпочтение пользователя; подгонять его под страну IP не требуется.", languageVariant: "Языковой вариант не доказывает местоположение или риск аккаунта; менять его не нужно.", locale: "Региональные настройки — предпочтение, а не доказательство местоположения или права доступа.", timezone: "Поездки и удалённые сети могут отличаться от системного часового пояса. Сверьте реальную ситуацию.", timezoneOffset: "Это текущее системное смещение UTC, а не доказательство местоположения.", emojiStyle: "Стиль Emoji предполагается по UA, а не измеряется по реальному изображению.",
      screen: "CSS-пиксели зависят от масштаба, мониторов и приватности; это не проверка физического оборудования.", hardware: "Это сообщаемые логические процессоры и приблизительная память, а не точные характеристики.", touch: "Сенсорные компьютеры, планшеты и периферия могут нормально сообщать сенсорный ввод.", chineseFonts: "Совпадения шрифтов приблизительны и не определяют местоположение. Удалять шрифты не требуется.", vendorFonts: "Шрифты производителя не доказывают местоположение или риск аккаунта.", canvasFp: "Canvas может быть недоступен из-за совместимости или приватности. Не отключайте защиту ради результата.", webgl: "Программный рендеринг может быть вызван драйверами, удалённым сеансом или настройками, а не нарушением.", audioFp: "Офлайн-аудио может не поддерживаться, ограничиваться или завершаться тайм-аутом. Это не риск аккаунта.",
      automation: "Маркер описывает текущий сеанс. Сверяйте реальный способ использования с официальными правилами продукта.", permissions: "Права зависят от браузера, политики сайта и приватности. Различия API не доказывают автоматизацию.", plugins: "Современный список в основном отражает встроенный PDF. Пустой список не доказывает headless и не является списком расширений.",
      langTz: "У языка нет фиксированного часового пояса; несколько языков и поездки нормальны.", tzIp: "Различие возможно из-за поездки, удалённой сети или базы данных. Подменять часовой пояс не требуется.", uaPlatform: "Для совместимости и приватности API может сообщать другую платформу. Различие не доказывает подмену.", glOs: "Производители GPU работают с разными ОС; драйверы и удалённые сеансы влияют на данные. Это не основание оценивать аккаунт.",
    },
    ui: { all: "Все", hits: "Только совпадения", expand: "Подробнее", weight: "Вес", contribution: "Вклад в риск", statusHit: "Совпало", statusWarn: "Внимание", statusClear: "Чисто", statusInfo: "Инфо", noFix: "Это информационный пункт, ничего делать не нужно.", clean: "Рисков не обнаружено" },
    ipMetricLabels: { ipAddress: "IP-адрес", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "Владелец ASN", company: "Компания", longitude: "Долгота", latitude: "Широта", ipType: "Тип IP", risk: "Риск", isp: "ISP" },
    regions: { auto: "Автоопределение", cn: "Китай", hk: "Гонконг", ru: "Россия", ir: "Иран" },
    status: { restricted: "Наблюдения требуют проверки", possibly_supported: "Нужно уточнение", unsupported: "Не поддерживается", supported: "Нет оцененных аномалий", unknown: "Не подтверждено" },
    risk: { waiting: "Ожидание", checking: "Проверка", supported: "Нет оцененных аномалий", blocked: "Технические наблюдения", high: "Высокий риск", light: "Низкий риск" },
    valueMap: { "中国大陆 IP": "IP материкового Китая", "访问和订阅风险极高": "Очень высокий риск доступа и подписки" },
    confidence: { high: "Высокая вероятность", medium: "Возможные признаки", low: "Небольшое совпадение", safe: "Недостаточно для подтверждения:", highRiskRegion: "регион высокого риска", supportedRegion: "поддерживаемый регион" },
  },
  en: {
    pending: "Waiting",
    unknown: "Unknown",
    signalLabels: {
      country: "Network exit region", ipAddress: "Visit IP", ipType: "IP line type", ipMarks: "Provider network flags", aiSubscription: "Subscription eligibility (not verified)", proxyCountry: "WebRTC visible routes",
      clientProfile: "Client profile", userAgent: "User-Agent", language: "Browser language", languageVariant: "Language variant", locale: "Intl locale", timezone: "System timezone", timezoneOffset: "Timezone offset", emojiStyle: "Estimated Emoji style (from UA)",
      screen: "Screen and color", viewport: "Current viewport", hardware: "CPU and memory", touch: "Touch capability", chineseFonts: "Regional fonts", vendorFonts: "Vendor fonts", canvasFp: "Canvas image readout", webgl: "WebGL renderer", audioFp: "Offline audio rendering",
      automation: "Automation traces", permissions: "Permission state", plugins: "Plugins and PDF", storage: "Storage capability",
      langTz: "Language × timezone", tzIp: "Timezone × IP region", uaPlatform: "UA × platform API", glOs: "Renderer × system",
    },
    signalValues: {
      unknown: "Unknown", noBrands: "No UA-CH brands", noLanguageVariant: "No key language variant detected", simplifiedChinese: "Simplified Chinese", traditionalChinese: "Traditional Chinese", scFonts: "Simplified Chinese fonts", tcFonts: "Traditional Chinese fonts", noFonts: "No key regional fonts detected", vendorFonts: "Vendor fonts", noVendorFonts: "No vendor fonts detected", noDevice: "No key device traits detected", unknownBrowser: "Unknown browser", unknownSystem: "Unknown system", wechatBrowser: "WeChat in-app browser", androidDevice: "Android device", linuxDevice: "Linux device", appleEmoji: "Apple Emoji style", androidEmoji: "Android / vendor Emoji style", windowsEmoji: "Windows Emoji style", unknownEmoji: "Unknown Emoji style", read: "Read",
      cores: "{n} cores", memoryUnknown: "memory unknown", touchPoints: "up to {n} touch points", touchCoarse: "touch-first", touchFine: "pointer-first",
      canvasSize: "Canvas image encoding length {n}", canvasBlocked: "Canvas read unavailable or restricted", webglNone: "WebGL renderer unavailable", softwareRenderer: "software rendering", audioRate: "offline test rate {n}Hz (requested by test)", audioLatency: "latency {n}s", audioBlocked: "Audio rendering unavailable",
      automationFound: "traces found", automationClean: "no automation traces", notificationPermission: "Notification permission", permissionUnknown: "permission state unknown", pluginsEmpty: "Plugin list is empty",
      consistent: "consistent", inconsistent: "conflict", waitingIp: "Waiting for IP intel…", platformApiUnknown: "platform API unavailable",
    },
    categories: {
      network: { name: "Network and exit", desc: "Visit IP ownership, line type, risk marks and WebRTC leaks" },
      browser: { name: "Browser identity", desc: "User-Agent, language, Intl, timezone and Emoji rendering" },
      device: { name: "Device fingerprint", desc: "Screen, hardware, fonts, Canvas, WebGL and audio" },
      runtime: { name: "Runtime and automation", desc: "Automation markers, permissions, storage and built-in PDF" },
      consistency: { name: "Consistency checks", desc: "Compare reported values in the context of the actual setup" },
    },
    stages: { network: "Network and exit", browser: "Browser identity", device: "Device fingerprint", runtime: "Runtime and automation", consistency: "Consistency checks" },
    fixes: {
      country: "Check actual location and current product rules. Changing a network exit alone does not establish eligibility.", ipType: "Network type is provider intelligence. Residential, mobile or datacenter labels alone cannot predict suspension.", ipMarks: "Provider proxy and abuse labels may be wrong. Verify the actual network; this is not an official account decision.", aiSubscription: "A provider label cannot establish Claude account or payment eligibility. Missing data stays unknown.", proxyCountry: "Another address may reflect dual-stack networking or routing differences, not a confirmed leak.",
      language: "Language is a user preference and does not establish location or account eligibility.", languageVariant: "Script and language preferences are informational; no changes are needed.", locale: "Locale is a user preference, not evidence of location or eligibility.", timezone: "Travel and remote networks can legitimately differ from the system timezone.", timezoneOffset: "This is the current system UTC offset, not proof of physical location.", emojiStyle: "Emoji style is estimated from UA, not measured from actual rendering.",
      screen: "Screen values are reported CSS pixels and vary with zoom, monitors and privacy settings.", hardware: "These are reported logical processors and approximate memory, not exact physical specifications.", touch: "Touch-enabled computers, tablets in desktop mode and peripherals can legitimately report touch capability.", chineseFonts: "Font matches are approximate and do not establish location. There is no need to delete fonts.", vendorFonts: "Font matches do not establish physical location or account risk.", canvasFp: "Unavailable Canvas reads indicate compatibility or privacy limits, not account risk. Keep privacy protections enabled.", webgl: "Software rendering may result from drivers, settings or remote sessions. It is not evidence of account risk.", audioFp: "Audio may be unsupported, restricted or timed out; this does not establish account risk.",
      automation: "An automation marker describes the current session. Check the actual use against the official product rules.", permissions: "Browser policy and context affect permissions; API differences do not establish automation.", plugins: "Modern plugin lists primarily describe built-in PDF support. Empty does not imply automation.",
      langTz: "Languages do not have a fixed timezone; multilingual use and travel are normal.", tzIp: "Travel, remote networks and database errors can cause differences. There is no need to disguise the timezone.", uaPlatform: "Platform reports can vary for privacy and compatibility. Differences are heuristic observations, not proof of spoofing.", glOs: "GPU vendors span operating systems. Remote graphics, drivers and privacy settings affect reported values.",
    },
    ui: { all: "All", hits: "Hits only", expand: "Details", weight: "Weight", contribution: "Risk contribution", statusHit: "Hit", statusWarn: "Watch", statusClear: "Clean", statusInfo: "Info", noFix: "This is an informational item. Nothing to do.", clean: "No risks detected" },
    ipMetricLabels: { ipAddress: "IP address", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "ASN owner", company: "Company", longitude: "Longitude", latitude: "Latitude", ipType: "IP type", risk: "Risk score", isp: "ISP" },
    regions: { auto: "Auto detect", cn: "Mainland China", hk: "Hong Kong", ru: "Russia", ir: "Iran" },
    status: { restricted: "Review observations / possibly restricted", possibly_supported: "Needs confirmation", unsupported: "Unsupported", supported: "No scored anomalies", unknown: "Unconfirmed" },
    risk: { waiting: "Waiting", checking: "Checking", supported: "No scored anomalies", blocked: "Technical observations", high: "Review observations", light: "Light risk" },
    valueMap: { "中国大陆 IP": "Mainland China IP", "访问和订阅风险极高": "Very high access and subscription risk" },
    confidence: { high: "Highly likely", medium: "Likely", low: "Lightly matched", safe: "Not enough to establish", highRiskRegion: "high-risk region", supportedRegion: "officially supported region" },
  },
};
