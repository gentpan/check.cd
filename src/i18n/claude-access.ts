// Claude 支持范围和访客 IP 判断的界面文案。
import type { LocaleCode } from "@/i18n/messages";

export type ClaudeAccessCopy = {
  footerTitle: string;
  blockedTitle: string;
  allowedTitle: string;
  ukraine: string;
  note: string;
  source: string;
  visitorIp: string;
  allowed: string;
  blocked: string;
  unknown: string;
  leakTitle: string;
  leakLoading: string;
  leakSame: string;
  leakNone: string;
  leakExposed: string;
};

const zh: ClaudeAccessCopy = {
  footerTitle: "Claude 支持的国家",
  blockedTitle: "未列入已核对的支持清单",
  allowedTitle: "列入已核对的支持清单",
  ukraine: "乌克兰须按产品核对地区例外；现行 API 文档与未来公告的例外不同，本站对不确定地区显示待核对。",
  note: "资料核对于 2026-10-17。2026-11-12 生效的公告单独记录，未提前套用；来源存在差异的地区显示待核对。清单不代表账号资格或实际访问成功。",
  source: "查看来源",
  visitorIp: "访客 IP",
  allowed: "IP 归属国家在支持清单（不证明实际所在地）",
  blocked: "IP 归属国家未列入已核对清单（不证明实际所在地）",
  unknown: "地区资料不足或来源存在差异，待核对",
  leakTitle: "本次浏览器可观察的网络路径",
  leakLoading: "正在核对浏览器还会交出的地址",
  leakSame: "本次 STUN 地址与访问本站的地址一致，不能证明 Claude 看到相同路径。",
  leakNone: "本次未观察到额外地址；也可能被浏览器或网络限制。",
  leakExposed: "检测到另一条公网地址，请核对双栈与路由差异",
};

const zht: ClaudeAccessCopy = {
  ...zh,
  footerTitle: "Claude 支援的國家",
  blockedTitle: "未列入已核對的支援清單",
  allowedTitle: "列入已核對的支援清單",
  ukraine: "烏克蘭須按產品核對地區例外；現行 API 文件與未來公告的例外不同，不確定地區顯示待核對。",
  note: "資料核對於 2026-10-17。2026-11-12 生效的公告獨立記錄，未提前套用；來源存在差異的地區顯示待核對。清單不代表帳號資格或實際存取成功。",
  source: "查看來源",
  visitorIp: "訪客 IP",
  allowed: "IP 歸屬國家在支援清單（不證明實際所在地）",
  blocked: "IP 歸屬國家未列入已核對清單（不證明實際所在地）",
  unknown: "地區資料不足或來源存在差異，待核對",
  leakTitle: "本次瀏覽器可觀察的網路路徑",
  leakLoading: "正在核對瀏覽器還會交出的地址",
  leakSame: "本次 STUN 與存取本站的地址相同，不能證明 Claude 看到相同路徑。",
  leakNone: "本次未觀察到額外地址；也可能被瀏覽器或網路限制。",
  leakExposed: "觀察到另一條公網地址，請核對雙棧與路由差異",
};

const ru: ClaudeAccessCopy = {
  footerTitle: "Страны, где доступен Claude",
  blockedTitle: "Нет в проверенном списке",
  allowedTitle: "Есть в проверенном списке",
  ukraine: "Исключения для регионов Украины зависят от продукта. Текущая документация API и будущее объявление различаются; спорные случаи требуют проверки.",
  note: "Проверено 17.10.2026. Объявление с датой вступления 12.11.2026 учтено отдельно и не применяется заранее. При расхождениях требуется проверка. Список не подтверждает право аккаунта или успешный доступ.",
  source: "Источник",
  visitorIp: "IP посетителя",
  allowed: "Страна IP есть в списке; это не доказывает фактическое местоположение",
  blocked: "Страны IP нет в проверенном списке; это не доказывает местоположение",
  unknown: "Данных недостаточно или источники различаются; требуется проверка",
  leakTitle: "Наблюдаемые сетевые пути браузера",
  leakLoading: "Проверяем, отдает ли браузер еще один адрес",
  leakSame: "Адреса STUN и сайта совпали. Это не устанавливает путь, видимый Claude.",
  leakNone: "Дополнительный адрес не обнаружен; возможны ограничения браузера или сети.",
  leakExposed: "Обнаружен другой публичный адрес; проверьте двойной стек и маршрутизацию.",
};

const en: ClaudeAccessCopy = {
  footerTitle: "Countries where Claude is available",
  blockedTitle: "Not on the reviewed list",
  allowedTitle: "On the reviewed list",
  ukraine: "Check Ukrainian regional exceptions per product. Current API documentation and the future announcement differ; unresolved cases need review.",
  note: "Reviewed 2026-10-17. The announcement effective 2026-11-12 is recorded separately and is not applied early. Source conflicts need review. A listing does not establish account eligibility or successful access.",
  source: "View source",
  visitorIp: "Visitor IP",
  allowed: "IP country is listed; this does not establish physical location",
  blocked: "IP country is not on the reviewed list; this does not establish physical location",
  unknown: "Insufficient data or conflicting sources; review needed",
  leakTitle: "Observed browser network paths",
  leakLoading: "Checking whether the browser reveals another address",
  leakSame: "The observed STUN and site addresses match. This does not establish the path seen by Claude.",
  leakNone: "No extra address was observed; browser or network restrictions may apply.",
  leakExposed: "Another public address was observed. Check dual-stack and routing differences.",
};

export const claudeAccessCopy: Record<LocaleCode, ClaudeAccessCopy> = {
  zh,
  "zh-HK": zht,
  ru,
  en,
};
