import type {LocaleCode} from './messages';
const zh = {
  description:'一键查看 IP、网络与浏览器环境，按需获取单项 AI 解读，关注 Claude 服务状态、新闻与政策动态。',
  menuTitle:'检测与资讯',helpTitle:'使用帮助',environment:'环境检测',articles:'基础文章',news:'新闻与政策动态',status:'Claude 服务状态',regions:'支持国家与地区',guide:'如何理解检测结果',faq:'常见问题',privacy:'隐私与数据使用',languages:'语言',legal:'check.cd · 独立环境检查工具 · 非 Anthropic 官方服务',
};
export const footerCopy:Record<LocaleCode,typeof zh> = {
  zh,'zh-HK':zh,
  en:{description:'Check your IP, network and browser environment, request AI explanations for individual results, and follow Claude service status, news and policy updates.',menuTitle:'Tools & updates',helpTitle:'Help',environment:'Environment check',articles:'Articles',news:'News & policy updates',status:'Claude service status',regions:'Supported regions',guide:'Understanding results',faq:'FAQ',privacy:'Privacy & data use',languages:'Languages',legal:'check.cd · Independent environment checker · Not an Anthropic service'},
  ru:{description:'Проверяйте IP, сеть и браузер, запрашивайте пояснения ИИ для отдельных результатов и следите за статусом Claude, новостями и изменениями правил.',menuTitle:'Проверка и новости',helpTitle:'Помощь',environment:'Проверка среды',articles:'Статьи',news:'Новости и правила',status:'Статус Claude',regions:'Поддерживаемые регионы',guide:'Как читать результаты',faq:'Частые вопросы',privacy:'Конфиденциальность и данные',languages:'Языки',legal:'check.cd · Независимая проверка среды · Не является сервисом Anthropic'},
};
