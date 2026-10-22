# CheckCC｜网络与浏览器环境检查

[中文](README.md) | [English](README.en.md)

[check.cd](https://check.cd) 记录本次访问本站的网络出口、浏览器报告的设置与能力，并提供可选的所在地确认、公开使用条件核对和 Claude 官方状态。它不读取 Claude 账号，不提供账号安全认证，也不预测封禁概率。

项目来源：[yacuo/check-cc](https://github.com/yacuo/check-cc)。原有截图位于 `docs/images/`，属于历史界面，不能作为当前功能或准确性的依据。

## 怎样读结果

- **数据覆盖率**：当前启用检测中取得结果的比例，不是通过率、准确率或账号安全分。
- **实测**：本次连接与浏览器自报值，只说明这轮采样。
- **推断**：IP 归属、字体与平台比较等有来源和能力限制，不证明真实所在地或账号资格。
- **未知**：未配置情报、套餐不提供字段、权限限制、超时和来源冲突保留未知，不补成正常或零风险。

检测项数量由 `src/detection/config/signals.ts` 的启用配置决定。语言、中文字体、时区、屏幕、低核数、触摸、软件 GPU、Canvas/音频限制和空插件列表，不据此推导封禁风险。无需为检测结果修改语言、伪装时区或关闭隐私保护。

完整的数据来源、获取方式、误差、自动回归和真实浏览器验收见 [检测准确性手册](docs/detection-accuracy.md)。自动测试通过不代表现实世界定位准确率或封禁预测能力。

## 检测范围与数据获取

| 范围 | 获取方式与边界 |
| --- | --- |
| 网络出口 | 从实际连接或明确配置的可信代理头识别访问本站的公网地址。无法确认时显示未知，不查询服务器自己的出口代替访客。 |
| IP 情报 | 服务端使用 IPinfo 授权 API。Lite 提供国家、ASN 等基础字段；其它字段仅在套餐和响应确实提供时使用。未配置 token 时保留已确认出口，情报字段未知。 |
| WebRTC | 通过配置的 STUN 服务观察本轮候选地址与状态。不同地址可能来自双栈、NAT、分流或不同路由，不自动判定为泄漏；无候选不证明没有其它路径。 |
| 浏览器与设备 | 本地读取 UA、可用 UA-CH、语言、Intl、时区、屏幕 CSS 像素、逻辑处理器、近似内存和触摸；字体与 Emoji 属于启发式线索，Canvas、WebGL、离线音频用于能力诊断。 |
| 运行时与一致性 | 记录明确自动化标记、权限和存储状态；等待依赖探针完成后再比较自报值。差异仅是技术观察，不是账号判定。 |
| 实际所在地 | 只有用户点击并授权后请求定位；坐标仅在本页与本地国家边界比较。精度不足、边界附近、无法匹配保持不确定。 |
| 使用条件 | 可跳过问卷，按公开地区、产品、支付与核验规则核对用户自述；不从浏览器还原注册历史或停用原因。 |
| 官方状态 | 获取 Claude 官方公开服务状态。官方服务正常不保证个人可登录，也不是浏览器到 Claude 的连通测试。 |

当前 IPinfo 接口不提供本站所需的“纯净度分”“封禁概率”或“AI 订阅资格”认证，缺失字段不会自行编造。地区资料区分来源、产品和生效日期；新闻自动更新不会自动改写检查规则。

## 技术栈与页面

TanStack Start / TanStack Router、React、TypeScript、Vite / Nitro Node.js 服务端、Tailwind CSS、pnpm。默认构建不是纯静态网站；其它托管目标需自行配置并验证对应 Nitro 适配器。

- `/`：环境检查、可选所在地与使用条件核对。
- `/articles`：地区、支付、身份验证、网络与使用规则等基础文章。
- `/news` 与 `/news/<id>`：新闻来源、发布日期及已知生效日期。
- `/status` 与 `/status/<id>`：Claude 官方组件、事件与时间线。
- `/admin`：新闻管理、发布状态与自动更新设置。
- `/api/news-refresh`：外部定时任务 POST 接口，需 `Authorization: Bearer <ADMIN_TOKEN>`；GET 不触发更新。

界面采用白橙与黑橙主题。按钮、标签和卡片使用原生 `corner-shape: squircle`，不支持时使用 `0.54 × --sq-r` 普通圆角降级。语言资料包含简体中文、粤语、俄语与英语；实际语言入口以当前路由为准。

## 本地运行与检查

需要 Node.js **22.18+** 和 pnpm。

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

打开 [本地页面](http://localhost:3000)。本地回环连接没有可确认的访客公网出口时，出口与情报显示未知，这是预期行为；浏览器采样仍可运行。

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

`pnpm dev` 和 `pnpm start` 加载 `.env.local`；生产环境也可直接注入变量。构建输出为 `.output`，入口为 `.output/server/index.mjs`。不要将服务端密钥加上 `VITE_` 前缀或提交 `.env.local`。

## 服务端配置

| 变量 | 用途 |
| --- | --- |
| `IPINFO_TOKEN` | 可选，IPinfo 授权 API token。未配置不调用情报服务，已确认出口仍保留。 |
| `IPINFO_TIER` | 默认 `lite`；可用 `lite` / `core` / `plus` / `max`，必须匹配实际授权套餐。未返回的国家、类型或标记保持未知。 |
| `TRUST_PROXY_HEADER` | 默认空，仅信任实际连接地址。只有可信入口会覆盖该头且源站禁止绕过入口直连时，才明确设置 `x-real-ip`、`cf-connecting-ip` 或 `x-forwarded-for`。 |
| `ANTHROPIC_API_KEY` | 可选，用于手动技术摘要、单项注释及已启用的新闻/状态内容处理。未配置时不会调用模型；界面区分规则解读与 AI。 |
| `ANTHROPIC_MODEL` | 模型标识，默认见 `.env.example`；须为部署账号实际可用的模型。 |
| `ADMIN_TOKEN` | 至少 32 字符的随机值，用于管理后台和受保护更新接口。 |
| `NEWS_AUTO_UPDATE` | 首次初始化是否启用自动新闻；之后以后台保存设置为准。 |
| `NEWS_DATA_PATH` | 新闻库路径，默认 `data/news.json`；生产应放在持久化目录。 |

可信代理必须**覆盖**客户端传入头，并向选定头写入恰好一个已确认公网地址。应用不从任意转发链中挑选第一个公网 IP；逗号分隔链会被拒绝。启用头信任本身不会认证代理，网络防火墙、监听地址和反向代理配置必须共同保证可信边界。Cloudflare 回源须在入口验证官方代理地址段，再转交真实客户端地址。

## Docker 与 VPS 部署

项目提供 `Dockerfile` 和 `compose.yaml`：

```bash
docker compose up -d --build
docker compose logs --tail=100 checkcd
```

Compose 从 `.env.local` 读取变量，将应用端口绑定到宿主机 `127.0.0.1:3000`，新闻库保存在 `news-data` 持久卷。由 HTTPS 反向代理暴露服务。按实际入口设置 `TRUST_PROXY_HEADER`，不要把 Docker 或私网代理地址当作访客公网出口。

现有 VPS 部署采用独立 systemd 服务与 Caddy；`deploy/checkcd.caddy` 是模板，接入前应核对入口的可信代理配置。

- 服务：`/etc/systemd/system/checkcd.service`。
- 服务端配置：`/etc/checkcd.env`，仅管理员可读。
- 应用版本：`/opt/checkcd/releases`，`/opt/checkcd/current/.output` 指向当前版本。
- 持久数据：`/var/lib/checkcd/news.json`，由 `checkcd` 服务用户写入。
- Node：`/opt/checkcd/node/bin/node`。
- 现有 Caddy 站点：`/etc/caddy/ip-projects-ogden.caddy`。

更新时在独立 release 放入新 `.output`，切换 `current` 链接并重启 `checkcd`。密钥和新闻库留在 release 外；发布后检查页面、健康状态、访客地址来源和未知降级。源码改动不代表已经部署到线上。

## 新闻与服务状态

常驻 Node 服务每分钟检查新闻更新计划，默认间隔 24 小时，后台可设置 6–168 小时；外部定时任务也可调用受保护的 POST 接口。搜索与整理依赖配置的模型服务；非官方来源进入审核，失败保留已有发布内容。标题链接进入本站详情，原始来源放在文末。不要将检索覆盖理解为全网覆盖。

新闻库必须持久保存，并保持单个 Node 进程负责写入。多实例、无服务器或会休眠的主机应改用共享数据库与外部定时器。应用关闭时，本地定时器不会继续运行。

`/status` 获取 `status.claude.com` 官方接口，缓存并合并并发请求；页面可见时定期刷新。失败时历史数据标记过期，首次失败保持未知。中文翻译缓存于新闻库同目录的 `status-translations.json`，跨发布保留；翻译失败明确提示，原始来源仍可核对。

## 隐私

基础浏览器采样不需要 Claude 登录，不读取聊天、密码或账号 Cookie。已配置 IPinfo 时，服务端会向供应商提交查询的公网地址；WebRTC 会联系 STUN。定位仅在按钮触发并授权后运行，坐标本地匹配，不上传本站服务器或 AI，不持久保存。

技术总结和单项 AI 注释**仅在点击对应按钮后**触发；发送相应技术结果，不包含可选问卷、定位坐标或账号凭据。AI 只能解释现有证据，不能补齐缺失数据或验证账号可用性。技术总结可在浏览器缓存 24 小时；可选问卷仅保存在页面内存，刷新清除。服务器及托管日志由部署者说明与管理。

## 项目来源与许可

资源支持：全球 AI Token 综合对比 [tokenplan.vip](https://tokenplan.vip)。

MIT License，Copyright © yacuo / CheckCC。使用、修改或再分发时保留原始版权与许可声明及项目来源：[yacuo/check-cc](https://github.com/yacuo/check-cc)。公开部署建议保留页脚来源，方便访问者找到原项目。
