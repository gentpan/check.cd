// CheckCC 的多语言文案配置，用于集中维护中文、繁体中文、俄文和英文页面内容。
export type LocaleCode = "zh" | "zh-HK" | "ru" | "en";
export type LocaleSlug = "hong-kong" | "russia" | "en";

export type Messages = {
  nav: { projects: string; faq: string; detect: string; menu: string; close: string; language: string; theme: string };
  hero: { title: string; subtitle: string; badges: string[] };
  logic: { eyebrow: string; title: string; desc: string; items: Array<[string, string, string]> };
  signals: { eyebrow: string; title: string; desc: string; checks: Array<[string, string]> };
  regionsTitle: string;
  regions: Array<{ name: string; risk: string; desc: string }>;
  privacy: { eyebrow: string; title: string; desc: string; items: Array<[string, string]> };
  faq: { title: string; items: Array<[string, string]> };
  footer: { title: string; desc: string; infoTitle: string; domain: string; feature: string; note: string };
  detector: {
    title: string;
    signalCount: (count: number, done: boolean) => string;
    loadingText: string;
    idleReport: string;
    browserZh: string;
    browserRu: string;
    browserClear: string;
    hit: string;
    miss: string;
    verdictTitle: string;
    copyReport: string;
    copied: string;
    copyFail: string;
    disclaimer: string;
  };
  aiSummary: { title: string; loading: string; regenerate: string; cached: string; error: string; footnote: string };
};

export const defaultLocale: LocaleCode = "zh";

export const localeRoutes: Record<LocaleCode, { slug: LocaleSlug | ""; label: string; lang: string }> = {
  zh: { slug: "", label: "简体中文", lang: "中文" },
  "zh-HK": { slug: "hong-kong", label: "廣東話", lang: "廣東話" },
  ru: { slug: "russia", label: "Русский", lang: "Русский" },
  en: { slug: "en", label: "English", lang: "English" },
};

export const slugToLocale: Record<LocaleSlug, LocaleCode> = {
  "hong-kong": "zh-HK",
  russia: "ru",
  en: "en",
};

export const messages: Record<LocaleCode, Messages> = {
  "zh": {
    "nav": {
      "projects": "基础文章",
      "faq": "常见问题",
      "detect": "开始检查",
      "menu": "菜单",
      "close": "关闭",
      "language": "语言",
      "theme": "切换外观"
    },
    "hero": {
      "title": "一键检查你的 Claude 使用环境",
      "subtitle": "先看本次网络与浏览器的实测结果，再分清需要核对的推断和未知项。",
      "badges": [
        "无需登录",
        "按需定位",
        "实测与推断分开"
      ]
    },
    "logic": {
      "eyebrow": "怎么读",
      "title": "看数据覆盖，再看每项证据",
      "desc": "覆盖率表示当前启用项目中取得了多少结果，不是通过率、准确率或账号安全分。实测、推断、未知分开呈现。",
      "items": [
        [
          "实测",
          "本次连接与浏览器报告",
          "访问本站的出口与浏览器自报值，仅说明这次采样。"
        ],
        [
          "推断",
          "结合来源核对",
          "IP 国家、字体和平台差异都有局限；语言和时区不证明实际所在地。"
        ],
        [
          "未知",
          "缺失不算通过",
          "超时、权限限制、未配置情报和来源冲突保留未知，不补成正常。"
        ]
      ]
    },
    "signals": {
      "eyebrow": "检测范围",
      "title": "五组技术观察",
      "desc": "检测明细按当前启用配置展示。浏览器技术信息与第三方情报用于排查，不计算封禁概率。",
      "checks": [
        [
          "网络与出口",
          "识别访问本站的出口；已配置时查询 IPinfo 的国家、ASN 及授权套餐提供的标记。WebRTC 记录可见路由差异。"
        ],
        [
          "浏览器身份",
          "记录 UA、可用的 UA-CH、语言、Intl 与时区。Emoji 风格按 UA 估计，不能证明所在地。"
        ],
        [
          "设备技术信息",
          "浏览器报告的 CSS 像素、逻辑处理器、近似内存与触摸；字体是线索，Canvas、WebGL、离线音频是能力测试。"
        ],
        [
          "运行时与自动化",
          "观察 WebDriver、已知框架对象、权限、存储及内置 PDF 能力；不可用或空列表不等于恶意。"
        ],
        [
          "一致性观察",
          "比较时区与 IP、UA 与平台等报告值。旅行、远程网络和隐私设置均可能造成正常差异。"
        ]
      ]
    },
    "regionsTitle": "地区信息分开核对",
    "regions": [
      {
        "name": "本次出口",
        "risk": "网络观测",
        "desc": "仅代表访问本站的路径，不代表 Claude 或终端机器看到的地址。"
      },
      {
        "name": "实际所在地",
        "risk": "可选确认",
        "desc": "授权定位或用户自述单独呈现，不能用语言、字体或出口静默替代。"
      },
      {
        "name": "公开地区资料",
        "risk": "需要核对",
        "desc": "区分产品、资料版本和生效日期；未知或来源冲突不判断为违规。"
      }
    ],
    "privacy": {
      "eyebrow": "隐私",
      "title": "由你决定额外提供哪些信息",
      "desc": "基础采样在本页运行；情报查询、STUN 与手动 AI 操作按下述方式联系外部服务。",
      "items": [
        [
          "需要 Claude 账号或问卷吗？",
          "不需要 Claude 登录，不读取聊天、密码或账号 Cookie。可选问卷只在本页内存，刷新即清除，不提交服务器或 AI。"
        ],
        [
          "IP 情报发给谁？",
          "配置 IPINFO_TOKEN 后，服务端通过 IPinfo 授权 API 查询已确认出口及本轮 WebRTC 观测到的公网地址。未配置时保留已确认出口，第三方情报保持未知。WebRTC 会联系配置的 STUN 服务。"
        ],
        [
          "AI 会自动运行吗？",
          "不会。点击生成总结或单项 AI 注释才提交相应技术结果给本站服务器；配置模型服务后由 Anthropic 处理。不包含问卷回答、定位坐标，也不证明账号可用。"
        ],
        [
          "哪些内容会缓存？",
          "手动生成的技术总结可在浏览器缓存 24 小时；IP 情报可短暂缓存在服务器。问卷不持久保存。"
        ],
        [
          "浏览器定位会上传吗？",
          "仅点击并授权后请求。坐标只在本页匹配国家边界，不交给本站服务器或 AI，不持久保存。系统定位服务由其提供方处理。"
        ],
        [
          "网站会统计访问吗？",
          "项目未接入访问统计；服务器与托管平台日志由部署方管理。"
        ]
      ]
    },
    "faq": {
      "title": "常见问题",
      "items": [
        [
          "数据覆盖率越高，账号越安全吗？",
          "不是。覆盖率只统计当前启用检测中取得了多少数据，不是通过率或准确率。拿到完整数据也不能证明账号安全或可用。"
        ],
        [
          "中文、字体和时区能证明我在哪吗？",
          "不能。这些是设备设置。旅行、多语言、远程连接或隐私保护都可能产生差异，无需为检测结果伪装语言或时区。"
        ],
        [
          "为什么有出口 IP，却没有国家或风险标记？",
          "出口识别与第三方情报是两步。IPinfo 未配置授权、套餐不提供某字段或请求失败时，该字段保持未知；不填成零风险。"
        ],
        [
          "WebRTC 出现另一个地址就是泄漏吗？",
          "不能这样判断。双栈、NAT、分流和不同路由都可能产生多个地址；无候选也不能证明没有其它路径。"
        ],
        [
          "AI 总结能确认 Claude 可用吗？",
          "不能。AI 由按钮手动触发，仅解释技术结果，不读取问卷、账号或定位坐标，不是 Anthropic 的账号判定。"
        ],
        [
          "发现未知或差异后怎么做？",
          "先看来源、采样状态和具体功能；必要时复测并与已知网络或官方提示核对。不要为分数关闭隐私保护、删字体或更改语言。"
        ]
      ]
    },
    "footer": {
      "title": "关于 check.cd",
      "desc": "记录本次网络与浏览器技术观察，分开核对实际所在地和公开使用条件。",
      "infoTitle": "站点",
      "domain": "域名：check.cd",
      "feature": "实测、推断与未知分开呈现",
      "note": "不提供账号安全认证或封禁概率；公开资料可能变化。"
    },
    "detector": {
      "title": "检测明细",
      "signalCount": (count, done) => done ? `需核对 ${count} 项` : `当前启用 ${count} 项`,
      "loadingText": "正在采样本次连接与浏览器",
      "idleReport": "开始后查看实测结果、推断和未知项。覆盖率不等于通过率。",
      "browserZh": "中文设置仅是用户偏好，不证明所在地或账号资格。",
      "browserRu": "俄语设置仅是用户偏好，不证明所在地或账号资格。",
      "browserClear": "浏览器设置不能证明实际所在地或账号安全。",
      "hit": "需核对",
      "miss": "已观测",
      "verdictTitle": "本次观察",
      "copyReport": "复制检测报告",
      "copied": "已复制到剪贴板",
      "copyFail": "复制失败，请手动选择文本",
      "disclaimer": "技术观察不证明账号可用，不是官方结论或封禁概率。"
    },
    "aiSummary": {
      "title": "AI 技术总结",
      "loading": "正在生成技术总结…",
      "regenerate": "重新生成",
      "cached": "来自缓存",
      "error": "总结生成失败，请稍后重试",
      "footnote": "点击后才生成；仅解释技术结果，不包含问卷或定位坐标，不证明账号可用。"
    }
  },
  "zh-HK": {
    "nav": {
      "projects": "基礎文章",
      "faq": "常見問題",
      "detect": "立即檢測",
      "menu": "選單",
      "close": "關閉",
      "language": "語言",
      "theme": "切換外觀"
    },
    "hero": {
      "title": "一鍵檢查你嘅 Claude 使用環境",
      "subtitle": "先睇今次網絡同瀏覽器實測，再分清要核對嘅推斷同未知項。",
      "badges": [
        "毋須登入",
        "按需定位",
        "實測同推斷分開"
      ]
    },
    "logic": {
      "eyebrow": "點樣睇",
      "title": "先睇資料覆蓋，再睇每項證據",
      "desc": "覆蓋率只計目前啟用項目有幾多取得資料，唔係通過率、準確率或帳號安全分。",
      "items": [
        [
          "實測",
          "今次連線同瀏覽器報告",
          "出口地址同瀏覽器自報值，只描述今次採樣。"
        ],
        [
          "推斷",
          "連同來源核對",
          "IP 國家、字體同平台差異都有局限；語言同時區唔代表身在邊度。"
        ],
        [
          "未知",
          "冇資料唔算通過",
          "逾時、權限限制、未配置情報同來源衝突都保留未知。"
        ]
      ]
    },
    "signals": {
      "eyebrow": "檢測範圍",
      "title": "五組技術觀察",
      "desc": "明細按目前啟用配置顯示。技術資料用嚟排查，唔計算封禁概率。",
      "checks": [
        [
          "網絡同出口",
          "識別訪問本站嘅出口；配置後由 IPinfo 提供國家、ASN 同授權方案支援嘅標記。WebRTC 記錄可見路由差異。"
        ],
        [
          "瀏覽器身份",
          "記錄 UA、可用 UA-CH、語言、Intl 同時區。Emoji 風格係按 UA 估計，唔代表所在地。"
        ],
        [
          "設備技術資料",
          "瀏覽器報告嘅 CSS 像素、邏輯處理器、近似記憶體同觸摸；字體係線索，Canvas、WebGL 同離線音頻係能力測試。"
        ],
        [
          "運行時同自動化",
          "觀察 WebDriver、已知框架物件、權限、儲存同內置 PDF；功能受限或列表空白唔代表惡意。"
        ],
        [
          "一致性觀察",
          "比較時區同 IP、UA 同平台報告；旅行、遠程網絡同私隱設定可以造成正常差異。"
        ]
      ]
    },
    "regionsTitle": "地區資料分開核對",
    "regions": [
      {
        "name": "今次出口",
        "risk": "網絡觀察",
        "desc": "只代表訪問本站嘅路徑，唔代表 Claude 或終端出口。"
      },
      {
        "name": "實際所在地",
        "risk": "可選確認",
        "desc": "授權定位或自述獨立顯示，唔用語言、字體或出口代替。"
      },
      {
        "name": "公開地區資料",
        "risk": "需要核對",
        "desc": "分清產品、資料版本同生效日期；未知同來源衝突唔等於違規。"
      }
    ],
    "privacy": {
      "eyebrow": "私隱",
      "title": "額外資料由你決定",
      "desc": "基礎採樣喺本頁運行；情報查詢、STUN 同手動 AI 操作按以下方式聯絡外部服務。",
      "items": [
        [
          "需要帳號或問卷嗎？",
          "毋須 Claude 登入，唔讀取聊天、密碼或帳號 Cookie。可選問卷只喺本頁記憶體，重新載入即清除，唔提交伺服器或 AI。"
        ],
        [
          "IP 資料交畀邊個？",
          "配置 IPINFO_TOKEN 後，伺服器用 IPinfo 授權 API 查已確認出口同今輪 WebRTC 見到嘅公網地址。未配置就保留已確認出口，情報保持未知。WebRTC 會聯絡配置嘅 STUN。"
        ],
        [
          "AI 會自動運行嗎？",
          "唔會。撳生成摘要或單項 AI 註釋先提交相關技術結果畀本站；配置模型服務後由 Anthropic 處理。唔包括問卷或定位座標，亦唔證明帳號可用。"
        ],
        [
          "會保存乜嘢？",
          "手動生成嘅技術摘要可喺瀏覽器緩存 24 小時；IP 情報可喺伺服器短暫緩存。問卷唔持久保存。"
        ],
        [
          "定位會上傳嗎？",
          "撳掣同授權後先請求定位。座標只喺本頁匹配國家邊界，唔交畀本站或 AI，唔持久保存；系統定位由供應方處理。"
        ],
        [
          "有訪問統計嗎？",
          "項目冇接入訪問統計；伺服器同託管日誌由部署方管理。"
        ]
      ]
    },
    "faq": {
      "title": "常見問題",
      "items": [
        [
          "覆蓋率高，係咪帳號安全？",
          "唔係。只計啟用檢測中取得幾多資料，唔係通過率或準確率。資料齊全亦唔證明帳號安全或可用。"
        ],
        [
          "語言、字體同時區代表所在地嗎？",
          "唔代表。呢啲係設備設定；旅行、多語言同遠程連線可以有正常差異，毋須偽裝語言或時區。"
        ],
        [
          "點解有 IP，但冇國家或標記？",
          "出口識別同第三方情報係兩步。IPinfo 未配置授權、方案冇嗰個欄位或請求失敗時會保持未知，唔補成零風險。"
        ],
        [
          "WebRTC 有另一地址就係洩漏？",
          "唔可以咁判斷。雙棧、NAT、分流同路由可以有多個地址；冇候選亦唔證明冇其他路徑。"
        ],
        [
          "AI 可唔可以確認 Claude 可用？",
          "唔可以。AI 由按鈕手動觸發，只解釋技術結果，唔讀取問卷、帳號或座標，唔係官方帳號判定。"
        ],
        [
          "見到未知或差異點算？",
          "先睇來源、狀態同實際功能；有需要再測並核對已知網絡或官方提示。唔使為分數關私隱保護、刪字體或改語言。"
        ]
      ]
    },
    "footer": {
      "title": "關於 check.cd",
      "desc": "記錄今次網絡同瀏覽器技術觀察，分開核對實際所在地同公開使用條件。",
      "infoTitle": "網站",
      "domain": "域名：check.cd",
      "feature": "實測、推斷同未知分開顯示",
      "note": "唔提供帳號安全認證或封禁概率；公開資料可能改變。"
    },
    "detector": {
      "title": "檢測明細",
      "signalCount": (count, done) => done ? `需核對 ${count} 項` : `目前啟用 ${count} 項`,
      "loadingText": "採樣今次連線同瀏覽器",
      "idleReport": "開始後睇實測、推斷同未知項。覆蓋率唔等於通過率。",
      "browserZh": "中文設定係用戶偏好，唔代表所在地或帳號資格。",
      "browserRu": "俄語設定係用戶偏好，唔代表所在地或帳號資格。",
      "browserClear": "瀏覽器設定唔證明所在地或帳號安全。",
      "hit": "需核對",
      "miss": "已觀察",
      "verdictTitle": "今次觀察",
      "copyReport": "複製報告",
      "copied": "已複製",
      "copyFail": "複製失敗，請手動選取",
      "disclaimer": "技術觀察唔證明帳號可用，唔係官方結論或封禁概率。"
    },
    "aiSummary": {
      "title": "AI 技術摘要",
      "loading": "生成技術摘要中…",
      "regenerate": "重新生成",
      "cached": "來自緩存",
      "error": "生成失敗，請稍後再試",
      "footnote": "撳掣後先生成；只解釋技術結果，唔包括問卷或定位座標，唔證明帳號可用。"
    }
  },
  "ru": {
    "nav": {
      "projects": "Статьи",
      "faq": "Вопросы",
      "detect": "Проверить",
      "menu": "Меню",
      "close": "Закрыть",
      "language": "Язык",
      "theme": "Тема"
    },
    "hero": {
      "title": "Проверьте среду для работы с Claude",
      "subtitle": "Наблюдения о текущем подключении и браузере — отдельно от предположений и неизвестных данных.",
      "badges": [
        "Без входа в аккаунт",
        "Геолокация по запросу",
        "Факты отдельно от выводов"
      ]
    },
    "logic": {
      "eyebrow": "Как читать",
      "title": "Сначала полнота данных, затем доказательства",
      "desc": "Полнота — доля включённых проверок, для которых получены данные. Это не доля успешных проверок, точность или оценка безопасности аккаунта.",
      "items": [
        [
          "Факт",
          "Подключение и данные браузера",
          "Адрес визита и значения, сообщаемые браузером, описывают только этот замер."
        ],
        [
          "Вывод",
          "Проверяйте источник",
          "Страна IP, шрифты и платформа имеют ограничения; язык и часовой пояс не доказывают местоположение."
        ],
        [
          "Неизвестно",
          "Нет данных — нет подтверждения",
          "Тайм-аут, ограничения API, отсутствие настройки и конфликт источников остаются неизвестными."
        ]
      ]
    },
    "signals": {
      "eyebrow": "Проверки",
      "title": "Пять групп технических наблюдений",
      "desc": "Список зависит от включённых проверок. Данные помогают диагностике, но не вычисляют вероятность блокировки.",
      "checks": [
        [
          "Сеть и выход",
          "Адрес подключения к этому сайту; при настройке IPinfo — страна, ASN и признаки, доступные по лицензированному тарифу. WebRTC показывает наблюдаемые различия маршрутов."
        ],
        [
          "Браузер",
          "UA, доступные UA-CH, язык, Intl и часовой пояс. Стиль Emoji предполагается по UA и не определяет местоположение."
        ],
        [
          "Устройство",
          "CSS-пиксели, логические процессоры, приблизительная память и сенсорный ввод по данным браузера; шрифты — подсказка, Canvas, WebGL и офлайн-аудио — проверки возможностей."
        ],
        [
          "Среда и автоматизация",
          "WebDriver, известные объекты автоматизации, права, хранилище и встроенный PDF. Ограничения API и пустой список не доказывают злоупотребление."
        ],
        [
          "Сопоставление",
          "Сравнение часового пояса с IP и UA с платформой. Поездки, удалённые сети и приватность могут давать нормальные различия."
        ]
      ]
    },
    "regionsTitle": "Разделяйте сведения о регионе",
    "regions": [
      {
        "name": "Выход этого визита",
        "risk": "Наблюдение",
        "desc": "Путь к этому сайту не обязательно совпадает с адресом, видимым Claude или терминалом."
      },
      {
        "name": "Фактическое место",
        "risk": "По желанию",
        "desc": "Геолокация с разрешением и ответы пользователя показаны отдельно от языка, шрифтов и IP."
      },
      {
        "name": "Публичные правила",
        "risk": "Нужна сверка",
        "desc": "Учитывайте продукт, версию и дату вступления правил в силу. Неизвестное и конфликт источников не означают нарушение."
      }
    ],
    "privacy": {
      "eyebrow": "Конфиденциальность",
      "title": "Дополнительные данные — по вашему выбору",
      "desc": "Базовые замеры выполняются в странице. Внешние обращения описаны ниже.",
      "items": [
        [
          "Нужны ли аккаунт и анкета?",
          "Вход в Claude не нужен. Чаты, пароли и Cookie аккаунта не читаются. Необязательная анкета остаётся в памяти страницы, очищается при перезагрузке и не передаётся серверу или AI."
        ],
        [
          "Куда передаётся IP?",
          "При настройке IPINFO_TOKEN сервер обращается к лицензированному API IPinfo для подтверждённого выхода и публичных адресов WebRTC этой проверки. Без настройки выход сохраняется, сведения остаются неизвестными. WebRTC обращается к настроенным STUN-сервисам."
        ],
        [
          "AI запускается автоматически?",
          "Нет. Только кнопки резюме и пояснения отправляют соответствующие технические результаты серверу сайта и, при настройке модели, Anthropic. Анкета и координаты не передаются. AI не подтверждает доступность аккаунта."
        ],
        [
          "Что сохраняется?",
          "Созданное по кнопке резюме может храниться в браузере 24 часа, сведения об IP кратковременно кешируются сервером. Анкета не сохраняется постоянно."
        ],
        [
          "Передаются ли координаты?",
          "Геолокация запрашивается только по кнопке и с разрешением. Координаты сопоставляются с границами стран в странице, не передаются серверу или AI и не сохраняются. Системная геолокация обрабатывается её поставщиком."
        ],
        [
          "Есть ли аналитика?",
          "В проекте нет аналитики посещений. Журналы сервера и хостинга управляются оператором."
        ]
      ]
    },
    "faq": {
      "title": "Вопросы",
      "items": [
        [
          "Высокая полнота означает безопасность?",
          "Нет. Она показывает лишь наличие данных по включённым проверкам, а не успешность или точность. Полный набор данных не подтверждает безопасность или доступность аккаунта."
        ],
        [
          "Язык, шрифты и время определяют страну?",
          "Нет. Это настройки устройства. Поездки, несколько языков и удалённое подключение нормальны; подменять язык и часовой пояс не требуется."
        ],
        [
          "Почему есть IP, но нет страны или отметок?",
          "Определение выхода и сведения провайдера — разные этапы. Нет токена IPinfo, поле недоступно тарифу или запрос завершился ошибкой — значение остаётся неизвестным, а не нулевым риском."
        ],
        [
          "Другой адрес WebRTC — это утечка?",
          "Не обязательно: IPv4/IPv6, NAT, раздельная маршрутизация и прокси могут давать несколько адресов. Отсутствие кандидатов тоже не доказывает отсутствие других путей."
        ],
        [
          "AI подтверждает доступ к Claude?",
          "Нет. Он запускается вручную и объясняет технические результаты без анкеты, данных аккаунта и координат. Это не официальное решение Anthropic."
        ],
        [
          "Что делать с различиями и неизвестным?",
          "Сверьте источник, состояние замера и реальную работу функции; при необходимости повторите и сравните с известной сетью или официальной подсказкой. Не отключайте приватность и не меняйте язык ради оценки."
        ]
      ]
    },
    "footer": {
      "title": "О check.cd",
      "desc": "Технические наблюдения о текущей сети и браузере отдельно от местоположения и публичных условий использования.",
      "infoTitle": "Сайт",
      "domain": "Домен: check.cd",
      "feature": "Факты, предположения и неизвестное отдельно",
      "note": "Не сертифицирует безопасность и не вычисляет вероятность блокировки. Публичные правила меняются."
    },
    "detector": {
      "title": "Подробности проверки",
      "signalCount": (count, done) => done ? `Нужна сверка: ${count}` : `Включено: ${count}`,
      "loadingText": "Измеряем подключение и браузер",
      "idleReport": "Запустите проверку, чтобы увидеть факты, предположения и неизвестное. Полнота не означает успешность.",
      "browserZh": "Китайский язык — предпочтение, а не доказательство местоположения или права доступа.",
      "browserRu": "Русский язык — предпочтение, а не доказательство местоположения или права доступа.",
      "browserClear": "Настройки браузера не подтверждают местоположение или безопасность аккаунта.",
      "hit": "Нужна сверка",
      "miss": "Получено",
      "verdictTitle": "Наблюдения",
      "copyReport": "Скопировать отчёт",
      "copied": "Скопировано",
      "copyFail": "Не удалось скопировать; выделите текст вручную",
      "disclaimer": "Замеры не подтверждают доступность аккаунта и не являются официальным решением или вероятностью блокировки."
    },
    "aiSummary": {
      "title": "Техническое AI-резюме",
      "loading": "Готовим техническое резюме…",
      "regenerate": "Создать снова",
      "cached": "Из кеша",
      "error": "Не удалось создать резюме; повторите позже",
      "footnote": "Только по кнопке, по техническим данным без анкеты и координат. Не подтверждает доступность аккаунта."
    }
  },
  "en": {
    "nav": {
      "projects": "Articles",
      "faq": "Questions",
      "detect": "Check now",
      "menu": "Menu",
      "close": "Close",
      "language": "Language",
      "theme": "Theme"
    },
    "hero": {
      "title": "Check your environment for Claude",
      "subtitle": "See observations from this connection and browser, with inferences and missing data kept separate.",
      "badges": [
        "No account login",
        "Location on request",
        "Facts and inferences apart"
      ]
    },
    "logic": {
      "eyebrow": "How to read",
      "title": "Check coverage, then inspect the evidence",
      "desc": "Coverage is the share of enabled checks that returned data. It is not a pass rate, accuracy measurement or account safety score.",
      "items": [
        [
          "Observed",
          "This connection and browser reports",
          "The visit address and browser-reported values describe this sampling session."
        ],
        [
          "Inferred",
          "Read alongside the source",
          "IP geolocation, fonts and platform comparisons have limits. Language and timezone do not prove location."
        ],
        [
          "Unknown",
          "Missing is not a pass",
          "Timeouts, restricted APIs, unconfigured intelligence and conflicting sources stay unknown."
        ]
      ]
    },
    "signals": {
      "eyebrow": "Scope",
      "title": "Five groups of technical observations",
      "desc": "Details follow the currently enabled configuration. These checks help diagnosis; they do not calculate suspension probability.",
      "checks": [
        [
          "Network and exit",
          "The address reaching this site; when configured, IPinfo country, ASN and fields available under the authorized plan. WebRTC records observable routing differences."
        ],
        [
          "Browser identity",
          "UA, available UA-CH, languages, Intl and timezone. Emoji style is estimated from UA and does not establish location."
        ],
        [
          "Device information",
          "Browser-reported CSS pixels, logical processors, approximate memory and touch. Fonts are hints; Canvas, WebGL and offline audio test capabilities."
        ],
        [
          "Runtime and automation",
          "WebDriver, known automation objects, permissions, storage and built-in PDF. Restricted capabilities or an empty list do not prove abuse."
        ],
        [
          "Consistency observations",
          "Compare timezone with IP and UA with platform reports. Travel, remote networking and privacy settings can cause legitimate differences."
        ]
      ]
    },
    "regionsTitle": "Keep regional evidence separate",
    "regions": [
      {
        "name": "This visit’s exit",
        "risk": "Network observation",
        "desc": "The path to this site may differ from the address seen by Claude or a terminal application."
      },
      {
        "name": "Actual location",
        "risk": "Optional confirmation",
        "desc": "Authorized geolocation and user answers are separate from language, fonts and the network exit."
      },
      {
        "name": "Public regional rules",
        "risk": "Needs review",
        "desc": "Check the product, source version and effective date. Missing or conflicting data is not a violation."
      }
    ],
    "privacy": {
      "eyebrow": "Privacy",
      "title": "You choose which extra information to provide",
      "desc": "Basic sampling runs in this page. External intelligence, STUN and manual AI actions work as described below.",
      "items": [
        [
          "Do I need an account or questionnaire?",
          "No Claude login is needed. Chats, passwords and account cookies are not read. Optional answers stay in page memory, clear on reload and are not submitted to the server or AI."
        ],
        [
          "Where is the IP sent?",
          "With IPINFO_TOKEN configured, the server queries IPinfo’s authorized API for the confirmed exit and public addresses observed by WebRTC in this run. Without it, the confirmed exit remains available and intelligence stays unknown. WebRTC contacts configured STUN services."
        ],
        [
          "Does AI run automatically?",
          "No. Summary and annotation buttons submit the corresponding technical results to this server and, when a model service is configured, Anthropic. Answers and location coordinates are excluded. AI cannot confirm account availability."
        ],
        [
          "What is cached?",
          "A manually generated technical summary may be cached in the browser for 24 hours; IP intelligence is briefly cached on the server. Questionnaire answers are not persisted."
        ],
        [
          "Are coordinates uploaded?",
          "Geolocation runs only after a click and permission. Coordinates are matched to country boundaries inside this page, are not sent to this server or AI and are not persisted. System location services are handled by their provider."
        ],
        [
          "Are analytics enabled?",
          "The project has no visit analytics. Server and hosting logs are managed by the operator."
        ]
      ]
    },
    "faq": {
      "title": "Questions",
      "items": [
        [
          "Does high coverage mean my account is safe?",
          "No. It counts enabled checks with data, not passes or accuracy. Even complete data cannot confirm account safety or availability."
        ],
        [
          "Do language, fonts or timezone prove location?",
          "No. They are device settings. Travel, multiple languages and remote connections are normal; there is no need to disguise language or timezone."
        ],
        [
          "Why is the IP known but country or flags missing?",
          "Exit identification and third-party intelligence are separate. An unconfigured IPinfo token, a plan without that field or a failed request leaves the field unknown, never zero risk."
        ],
        [
          "Is another WebRTC address a leak?",
          "Not automatically. Dual-stack networking, NAT, split routing and proxies can expose different addresses. No candidates also cannot prove that no other path exists."
        ],
        [
          "Can the AI summary confirm access to Claude?",
          "No. It runs manually and explains technical results without questionnaire answers, account data or coordinates. It is not an official Anthropic account decision."
        ],
        [
          "What should I do with unknowns or differences?",
          "Inspect the source, sampling state and actual function; retry if useful and compare with a known network or official guidance. Do not weaken privacy or change language to improve a score."
        ]
      ]
    },
    "footer": {
      "title": "About check.cd",
      "desc": "Technical observations about this connection and browser, separate from actual location and public eligibility conditions.",
      "infoTitle": "Site",
      "domain": "Domain: check.cd",
      "feature": "Observed, inferred and unknown kept separate",
      "note": "No account safety certification or suspension probability. Public rules can change."
    },
    "detector": {
      "title": "Check details",
      "signalCount": (count, done) => done ? `${count} to review` : `${count} enabled`,
      "loadingText": "Sampling this connection and browser",
      "idleReport": "Start to see observations, inferences and unknowns. Coverage is not a pass rate.",
      "browserZh": "Chinese settings are a preference, not proof of location or eligibility.",
      "browserRu": "Russian settings are a preference, not proof of location or eligibility.",
      "browserClear": "Browser settings cannot establish physical location or account safety.",
      "hit": "Review",
      "miss": "Observed",
      "verdictTitle": "This run’s observations",
      "copyReport": "Copy report",
      "copied": "Copied",
      "copyFail": "Copy failed; select the text manually",
      "disclaimer": "Technical observations do not confirm account availability and are not an official verdict or suspension probability."
    },
    "aiSummary": {
      "title": "AI technical summary",
      "loading": "Generating technical summary…",
      "regenerate": "Regenerate",
      "cached": "From cache",
      "error": "Summary failed; please retry later",
      "footnote": "Generated only on click, from technical results without answers or coordinates. It cannot confirm account availability."
    }
  }
};

export function getLocaleBySlug(slug?: string): LocaleCode | null {
  if (!slug) return defaultLocale;
  return slug === "hong-kong" || slug === "russia" || slug === "en" ? slugToLocale[slug] : null;
}
