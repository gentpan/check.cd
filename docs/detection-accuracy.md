# 检测准确性、数据获取与验收手册

资料核对日期：2026-10-17。适用项目：CheckCC / check.cd。本文把现有能力、准确性边界和仍需执行的真实环境测试分别记录；测试方案不等于已经完成实测。

## 1. 产品应回答什么

网站可以回答：本次访问本站的出口、浏览器报告的设置与能力、用户可选确认的实际所在地、公开规则中需要核对的条件，以及官方公开的服务状态。不能把它们转换成“封禁概率”“账号安全认证”或“Claude 一定看到这个 IP”。Anthropic 公开列举停用原因和申诉入口，但没有在这些页面公开可供本项目校准的封禁模型、内部权重或个体概率。[官方停用与申诉说明](https://support.claude.com/en/articles/8241253-safeguards-warnings-and-appeals)

准确性的优先顺序是：数据来源正确、失败如实显示、结论不超出证据、再提高覆盖率。不要通过收集更多设备指纹来制造“测得更准”的印象。

每项结果都应能回答五个问题：

1. 测到了什么原始事实？
2. 数据来自浏览器、本站服务器、第三方情报还是用户自述？
3. 是否取得了结果，何时取得，是否使用缓存？
4. 这个事实能证明什么，哪些推断仍然未知？
5. 下一步在哪里核对，是否真的需要用户采取行动？

## 2. 应测项目与获取方式

| 项目 | 当前获取方式 / 相关位置 | 权限与对外通信 | 合理结论与主要误差 |
| --- | --- | --- | --- |
| 访问本站的公网 IP | 默认读取实际连接地址；仅在明确配置可信代理头时读覆盖后的单个转发地址；`src/lib/network-observation.ts` | 无浏览器弹窗；配置情报供应商时把目标 IP 交给 IPinfo | 仅表示本次访问本站的路径。不能当作实际所在地、Claude 或终端出口。源站若能绕过可信代理直连，客户端可伪造转发头。 |
| IP 国家、ASN、运营商、网络类型 | IPinfo Lite 或订阅套餐响应；`src/server/ip-purity.ts` | 第三方网络请求；需要服务端 token | Lite 提供国家与基本 ASN；城市和更细信息依套餐及响应。VPN、漫游、移动网络、数据库滞后会造成差异；城市不能定位个人住址。 |
| VPN / Proxy / Tor / 机房 / 移动网络 | IPinfo `anonymous` / `is_anonymous` / `is_hosting` / `is_mobile`，仅展示响应确实提供的字段 | 同上 | `true` / `false` / 未提供必须区分。Lite 没有的能力保留未知；匿名总标记不自动填补 VPN/Tor 子标记。未接入的滥用标签保持未知。 |
| IP 分、黑名单/攻击分、原生 IP 和 AI 订阅标签 | 当前 IPinfo 接口未提供；字段保持 `null` | 不另造请求或推断 | 当前版本不编造“纯净度”“AI 适宜度”与封禁概率，也不把未知分数填成 0 或 100。 |
| WebRTC 可观察公网地址 | `RTCPeerConnection` + STUN；`src/detection/leak-ip.ts` | 无麦克风或摄像头授权；会联系配置的 STUN 服务 | 内部区分 host/srflx/prflx 公网候选，排除 TURN relay；返回完成/超时/不可用/失败状态与时间。另一地址可能来自双栈、分流、NAT 或代理路径；零候选不等于没有额外网络路径。 |
| 实际所在地（可选） | 用户点击后调用 Geolocation；坐标在本页匹配 `public/country-boundaries.json` | 明确定位授权；需要安全上下文；系统定位供应商有自己的处理方式 | 保留 `accuracy`；精度不足、边界附近或无法匹配时显示不确定。不能用出口国家静默替代定位。 |
| 地区支持资料 | 审核后的版本化官方清单；`src/lib/claude-regions.ts` | 无权限；查看来源是外链 | 资料清单中的国家条目，不证明完整资格；未知代码、未建模领土或来源冲突显示待核对。按产品、公告日和生效日区分。 |
| 浏览器与系统 | UA、可用的 UA-CH `brands/platform/mobile` | 通常无弹窗；本地读取 | 浏览器自报、可能精简或兼容伪装。iPad 桌面 UA、iOS 的 CriOS/FxiOS、内嵌浏览器需专门回归。UA-CH 缺失不是异常。 |
| 语言、Locale、时区与偏移 | `navigator.languages`、Intl、`getTimezoneOffset()` | 本地读取 | 用户设置，不是国籍或地理证明。中文用户旅居海外、系统设固定时区均属正常使用。 |
| 屏幕、视口、CPU、内存、触摸 | `screen`、视口、`hardwareConcurrency`、`deviceMemory`、`maxTouchPoints` | 本地读取；支持情况因浏览器而异 | 报告值可能被近似、限制或隐私保护修改。CSS 像素不同于面板物理分辨率；CPU/内存不是硬件鉴定。 |
| 字体、Emoji 风格 | 字体宽度比较；Emoji 风格当前主要按 UA 推断 | 本地读取 | 字体探测有替代字体、缺字和隐私限制误差；UA 推断的 Emoji 必须称为估计，不称实际渲染鉴定。不据此判断所在地或风险。 |
| Canvas / WebGL / 音频能力 | 离屏绘制、WebGL 上下文与 renderer、OfflineAudioContext | 本地读取；不采集麦克风音频 | 只用于解释能力和限制。被阻止、返回通用 GPU、软件渲染或隐私噪声都不能证明恶意或封禁风险。 |
| 自动化标记 | `navigator.webdriver` 与已知全局对象 | 本地读取 | 标记说明当前会话可能受自动化控制。无标记不证明没有自动化，有标记也不证明违反目标服务规则。 |
| 权限、Cookie、存储、PDF 能力 | Permissions API、临时 localStorage 写入、相关 API 状态 | 不主动申请通知权限；本地读写测试值 | 用于兼容性排查；权限查询失败、隐私模式、插件列表为空不等于风险。`IndexedDB` 对象存在不等于真实读写成功。 |
| 语言/时区、时区/IP、UA/平台、GPU/OS 差异 | 对上述自报值进行比较 | 无新增权限 | 仅提供差异解释。旅行、远程桌面、虚拟机、隐私模式和不同路由都可形成正常差异。不能根据语言要求改系统时区。 |
| 注册、支付、身份核验、账号提示 | 可跳过问卷；`src/lib/account-check.ts` | 用户自述；不索要密码、卡号、CVV、证件或完整地址 | 只核对用户填报与公开规则。区分官网支付、应用商店支付、额度限制、核验待办和停用；不能从当前浏览器还原注册历史。 |
| Claude 官方服务状态 | `status.claude.com` 官方接口；`src/server/service-status.ts` | 本站服务器获取；不是浏览器到 Claude 的连通测试 | 显示来源时间、抓取时间与过期状态。官方事件与个人故障可能不同，状态正常也不保证个人能登录。 |

IP 定位的能力边界可参考[MaxMind 官方准确性说明](https://support.maxmind.com/knowledge-base/articles/maxmind-geolocation-accuracy)；引用它是说明此类技术限制，不表示本项目已接入 MaxMind，或可以继承其供应商准确率。

Geolocation 的 `accuracy` 是以米报告的 95% 置信精度指标，且调用需要用户授权。[W3C Geolocation 规范](https://www.w3.org/TR/geolocation/)

ICE 候选的 `host`、`srflx`、`prflx`、`relay` 表示不同获取方式，不是四种账号风险等级。[W3C WebRTC 规范](https://www.w3.org/TR/webrtc/)

## 3. 不应据此打封禁风险分

语言、中文字体、Locale、时区、正常设备型号、屏幕大小、低核数、触摸能力、Emoji、Canvas/音频不可用、软件 GPU、PDF/插件缺失、隐私模式，以及单独的 UA/平台差异，都没有足够依据推导封禁概率。第三方 IP 分和公开地区条目也不能单独推导账号是否安全。

Safari 会对某些 Canvas 读回引入隐私噪声；Firefox 也会限制或降低部分指纹信号的识别能力。因此“读不到/不稳定”应解释为受限或未知。[WebKit 官方说明](https://webkit.org/blog/15697/)、[Firefox 指纹保护说明](https://www.firefox.com/en-CA/features/block-fingerprinting/)

`navigator.webdriver === true` 在标准里表示用户代理受远程控制，不能直接翻译成“高风险设备”。[W3C WebDriver 接口定义](https://www.w3.org/TR/webdriver2/#interface)

当前报告改用“已取得 / 未取得 / 等待中 / 需要核对”统计，不展示账号安全分。内部兼容字段仍可能带有旧的启发式权重，不能将其重新包装成封禁概率；AI 解释和后续功能也遵守这个边界。

### 覆盖率、推断与手动 AI 解读

`src/lib/report-quality.ts` 将缺行、无值和 `availability: unavailable` 视为未知；仍未结束的行视为等待中。已取得数包含有值的说明、观察与推断，因此“已取得 / 总项数”表示报告有数据的覆盖程度，不是全部检查通过，更不是验证了物理设备、真实位置或账号资格。推断项单独标记为 `evidence: inferred`，不会仅因有值就当成实测命中。

首页的检测会运行技术采样；AI 总结由用户点击后请求。缺少模型配置时返回规则说明；AI 和规则说明都只能解释现有摘要，不能补齐情报供应商缺失字段或读取 Claude 账号。摘要缓存与新采样不同，应在界面区分 AI、规则模板、缓存和本次数据。复制报告由用户主动触发，分享前应确认 IP 和设备明细是否需要脱敏。

IP 情报保留 `ipSource`（连接地址、可信代理头或用户输入）和 `source`（供应商、实时/缓存/未配置/错误、查询时间与缓存到期时间）。`source.fetchedAt` 是本站取得响应的时间，不是供应商数据库的更新时间。当前有效响应缓存 5 分钟；失败不填充成功缓存。没有 token 仍可保留已确认的访问地址，国家、ASN与匿名标记等供应商字段继续未知。

## 4. 地区规则必须保留时间和产品

本次发现一个会直接影响结论的资料问题：2026-10-17 打开原 supported-countries 地址，会跳到标明 **2026-11-12 生效**的新地区政策。不能把未来公告当作今天已经生效的规则。

代码中的 `CLAUDE_REGION_POLICY` 记录：

- 审核日期与版本 `2026-10-17-reviewed`。
- 当前 Claude Help Center 与 API Platform 两个独立来源。
- 未来公告的版本、`effectiveAt` 和 `announced` 状态。
- 来源存在差异的国家代码，暂时给出 `unknown`。

本次将 `CF / CD / ER / ET / LY / ML / NI / SO / SS / SD` 设为待核对；通用入口不把乌克兰地区例外作为确定的跨产品结论。明确指定 API 时，当前 API 文档列出的三个地区排除可以单独判断。未来公告不会仅因系统日期变化自动晋升为审核版，生效前后仍需人工比对并更新代码与测试。

官方来源：[当前 Claude 地区说明](https://support.claude.com/en/articles/8461763-where-can-i-access-claude)、[当前 API 地区说明](https://platform.claude.com/docs/en/api/supported-regions)、[标明生效日期的新政策](https://www.anthropic.com/legal/supported-regions)。公开资料本身也可能不同步，本站应保留冲突，而不是选一个结论伪装成确定事实。

## 5. 怎样让检测更准

### 5.1 先固定数据口径

建议每条观测具备 `status`、`source`、`observedAt`、`value`、`durationMs`、`reason` 和规则版本。`status` 至少区分成功、超时、不可用、权限拒绝和解析失败。未取得结果不填 0，不称“通过”；取消或重新检测后，旧请求不能覆盖新一轮结果。

IP 情报已校验响应 IP 与请求地址规范化后的匹配，并保留供应商、目标地址和查询时间；供应商数据库时间只有在接口提供时才能额外记录。无 token、鉴权错误、限流、超时、无效 JSON 或 IP 不匹配都有相应未知/失败状态，不能让空字段默认为“低风险”。公网地址校验须使用正反样本验证 IPv4、IPv6、保留段和畸形字符串。

### IPinfo 服务端配置规范

`.env.example` 中定义了 `IPINFO_TOKEN`、`IPINFO_TIER` 和 `TRUST_PROXY_HEADER`。token 只进入服务器环境，不使用 `VITE_` 前缀，不写入报告或前端。

```dotenv
IPINFO_TOKEN=
IPINFO_TIER=lite
TRUST_PROXY_HEADER=
```

填写通过供应商正规渠道取得的 token；`IPINFO_TIER` 可为 `lite / core / plus / max`，实际信息仍由账户套餐及响应决定。Lite 查询指定 IP 的正式接口为 `/lite/{IP}`，其它配置使用 `/lookup/{IP}`；本项目不会从服务端调用 `/me` 来冒充访客地址。[IPinfo Lite 官方文档](https://ipinfo.io/developers/lite-api)、[IPinfo Core 官方文档](https://ipinfo.io/developers/core-api)、[IPinfo Plus 官方文档](https://ipinfo.io/developers/plus-api)

`TRUST_PROXY_HEADER` 留空只认实际连接地址。代理部署时，仅当唯一入口会覆盖该头、源站直连已被限制，才配置为 `x-real-ip`、`cf-connecting-ip` 或 `x-forwarded-for` 中一个。选定头必须恰好是一个公网地址；不从逗号链中挑选看似有效的地址。配置不存在或值异常时保持未知；不要为了在 localhost 显示结果而伪造访客请求头。

反向代理应覆盖客户端自带的访客 IP 头，并限制源站访问。Cloudflare 官方解释了 `CF-Connecting-IP` 的含义及特殊链路行为；真正的可信边界仍需由部署配置保证。[Cloudflare 官方 HTTP 请求头说明](https://developers.cloudflare.com/fundamentals/reference/http-headers/)

### 5.2 用独立参照验证，而不是用另一个聚合网站当真值

- **IP 地址**：用自己控制的 HTTPS 回显端点和代理日志核对，分别检查 IPv4、IPv6；不要在公开截图中展示完整访客 IP。
- **IP 国家与 ASN**：选已知路由出口的样本，保留运营商、测试地点和网络类型。第二情报源用于发现分歧；两个供应商一致不等于绝对正确。若接入第二源，需先落实正式 API/许可、隐私披露和成本。
- **代理路径**：对照已知的直连、浏览器代理、系统隧道和分流配置，检查 HTTP 与 STUN 路径。只描述观测差异，不指导绕过服务规则。
- **位置**：经测试者同意在已知地点实测，记录浏览器报告精度。海域、低精度、边界、飞地和跨日期变更线须单独测试。坐标在本地比较，反馈默认只保留国家与精度区间。
- **浏览器采样**：对照同一浏览器开发者工具可见的原值；分别测普通、无痕、严格隐私设置。不要通过关闭隐私保护来让分数“变好”。
- **政策**：保存来源、抓取日、原页面写明的生效日、产品与审核结论。新闻自动更新不能自动改写资格规则。

### 5.3 暂未测量的项目，要以独立模块增加

当前项目不能直接读取“Claude 内部对你的判定”、终端机器的实际出口、账号历史、银行实际账单记录或隐藏的封禁原因。

若后续需要 DNS 检测，应部署自有测试域名与权威 DNS 日志，为每轮分配短期随机子域名，再把解析器观测与浏览器会话关联；它仍不证明所有应用使用相同解析器。现有页面没有这个测量链路，不能先展示“DNS 无泄漏”。

若后续需要延迟、抖动或连通性测试，应提供受控测量端点、采样次数、超时及统计口径，并标明测试目标。服务器到 Claude 的请求只表示服务器路径；浏览器跨域失败也可能只是 CORS。`no-cors` 的 opaque 响应不能读取真实 HTTP 状态，不能将其一律标记为“Claude 连接成功”。[WHATWG Fetch 标准](https://fetch.spec.whatwg.org/)

## 6. 自动化与真实环境测试矩阵

### 6.1 每次改动都运行的回归检查

在项目根目录，使用 Node.js 22.18+ 与固定的 pnpm 12.11.2。测试直接导入 TypeScript，最低版本按默认启用类型剥离的运行时确定。

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` 按顺序运行 `test`、`typecheck` 和 `build`，任意一步失败立即停止；仍可分别运行原来的三个命令。新增路由时先通过开发服务或构建更新 `src/routeTree.gen.ts`，否则类型检查会提示路由注册尚未生成。

本次地区规则的定向回归：

```sh
node --test tests/claude-regions.test.mjs tests/account-check.test.mjs tests/network-accuracy.test.mjs tests/report-quality.test.mjs tests/summary-quality.test.mjs
```

现有 12 个测试文件覆盖如下。文件内使用确定性输入与模拟外部响应验证实际模块，没有拿真实账户停用结果作预测校准：

| 文件 | 已实现的自动回归范围 |
| --- | --- |
| `tests/browser-detection.test.mjs` | iOS/桌面浏览器识别、iPad桌面UA、中文变体、受限getter、Intl缺失、Apple/软件GPU、日期相关时区、图形/音频受限与超时、权限/PDF、明确WebDriver、插件依赖/超时/部分失败、真实增量进度、只调和网络而不重复采样 |
| `tests/network-accuracy.test.mjs` | 公网地址/保留段/IPv6规范化、可信代理和部署样例、双栈、IPinfo套餐/布尔值/目标校验、未配置/鉴权/限流/超时/错误响应、缓存隔离/过期/去重/重试，以及WebRTC候选解析/无API/超时/资源清理 |
| `tests/network-signals.test.mjs` | 匿名总标记和子标记、明确false与缺失值的区别、全部启用检测项的方法及主要来源元数据 |
| `tests/claude-regions.test.mjs` | 未知国家码与未建模领土、资料冲突、产品特有地区例外、公告生效日与历史日期 |
| `tests/browser-location.test.mjs` | 本地国家边界匹配、低精度和近边界不确定性、无效坐标；无IP替代 |
| `tests/account-check.test.mjs` | 未填问卷、实际/注册/出口国家区分、普通语言字体无风险权重、官网/商店支付分支、支付国家差异、虚拟卡、地区例外和API年龄口径 |
| `tests/report-quality.test.mjs` | 受限API显示未知、推断不当作实测风险、覆盖率不计缺失/未完成项 |
| `tests/route-observation.test.mjs` | 无可信请求出口但已有候选、部分采样、无API、空结果及双栈的描述各不混淆 |
| `tests/summary-quality.test.mjs` | 数据缺失时不称全部正常、覆盖数与总数校验、缺失分数不补0、俄文规则说明不要求语言时区匹配IP |
| `tests/card-annotations.test.mjs` | 注释输入剔除坐标等额外字段、数据上限/重复/未完成校验、单项AI请求与完整结构化输出 |
| `tests/service-status.test.mjs` | 官方状态请求去重和缓存、初次失败未知、刷新失败标过期、历史失败不隐藏当前信息、事件详情响应结构 |
| `tests/validation.test.mjs` | 双栈、公网IPv4/IPv6与无效字面值、摘要/查询输入边界和额外字段剔除 |

这些测试验证规则、采样适配与错误处理，不代表现实世界定位准确率、正式账户可用性或封禁预测能力。真实浏览器的原生弹窗、焦点、页面视觉、真实STUN路由和有权限的供应商实测另行记录。

### 持续集成入口

`.github/workflows/check.yml` 在 `push`、`pull_request` 和手动触发时运行最小回归：Ubuntu、Node.js 22.x、pnpm 12.11.2、冻结锁文件安装，再执行 `pnpm check`。工作流只申请代码读取权限，不读取任何服务密钥，不部署、不发布、不推送；同一分支新任务会取消旧任务。pnpm版本也声明在 `package.json` 的 `packageManager`，与现有Docker构建一致。

当前已在本地校验工作流结构与命令入口。只有提交后实际在 GitHub Actions 成功运行，才能标记为“CI 已通过”；不能把本地通过写成远程工作流已运行。工作流与测试可使用模拟响应完成，不需要 Anthropic、IPinfo 或管理后台密钥。

应持续补充的确定性边界：

| 测试组 | 必测输入 / 变化 | 通过条件 |
| --- | --- | --- |
| 网络与第三方情报 | 正常、拒绝、超时、空 JSON、结构变化、分数缺失/越界、错误 IP、国家未知 | 缺失与失败明确显示；不会出现假正常、NaN、错误的实际所在地 |
| WebRTC | 同地址、同国异地址、IPv4/IPv6、异国、无API、超时、候选错误、STUN阻断 | 不把双栈直接称泄漏；无候选不声称安全；资源关闭 |
| 插件 | 正常、抛错、永不完成、慢响应、部分API缺失 | 其它项可继续；每项有终态；进度不会永久卡住 |
| 重测与取消 | 连点、切页、第二轮先完成、网络切换 | 当前轮次结果不被旧请求覆盖；清理计时器和音频/WebRTC资源 |
| 浏览器识别 | Chrome、Edge、Firefox、Safari、CriOS、FxiOS、iPad桌面UA、WebView | 能识别则说明自报来源；无法确定则未知，不强行填Mac或Chrome |
| 定位 | 拒绝、超时、不可用、低精度、海域、边界、错误边界文件 | 没有授权不请求；未知不回填IP；坐标不进入AI或持久化 |
| 政策 | UZ、CN、ZZ、PR、冲突国家、乌克兰子地区、公告生效日前后 | 来源和产品一致；未来规则不提前生效；未知数据不成违规 |
| 交互与主题 | 白橙/黑橙、键盘、窄屏、长文本、200%缩放 | 焦点可见、内容不溢出、标题和值有层级、状态可读 |

### 6.2 发布前的真实浏览器检查

自动化浏览器会带入自己的自动化标记和虚拟 GPU。它适合检查采样、降级、交互和异常流程，不能替代正常浏览器的设备结果。Playwright 的 WebKit 运行时检查也不能写成“真实 Safari 已测”。

最低建议矩阵如下，未执行的格子明确写“待测”：

| 实际环境 | 网络 | 模式 | 重点 |
| --- | --- | --- | --- |
| macOS Chrome 稳定版 | 固定宽带 IPv4/IPv6 | 普通、无痕 | UA-CH、Apple GPU、原生 squircle、重测 |
| macOS Safari 稳定版 | 同一网络 | 普通、私密 | API缺失/隐私保护、普通圆角降级、定位授权 |
| 桌面 Firefox 稳定版 | 同一网络 | 标准、严格保护 | 指纹限制、字体/Canvas/API未知状态 |
| Windows Edge 或 Chrome | 固定宽带 | 普通 | Windows GPU、缩放、长列表和键盘 |
| iPhone Safari | Wi-Fi、移动网络 | 普通、私密 | 触摸、窄屏、定位拒绝/授权、双栈 |
| iPad Safari 桌面网站模式 | Wi-Fi | 普通 | Mac兼容UA不当作真实Mac硬件 |
| Android Chrome | Wi-Fi、移动网络 | 普通 | 内存近似、触摸、移动网络归属 |

网络场景至少包括：直连 IPv4、可用双栈、企业代理或已知分流、系统隧道、阻断 UDP/STUN、离线和高延迟。没有访问到的网络不能标为通过。每个测试组合连续重复 5 次，并记录每次结果；间隔与运行时长足以让同一轮请求结束，避免把重复请求当五个独立样本。

视觉验收覆盖：首页、展开的全部结果、账号问卷、IP详情、文章/新闻/状态列表与详情、FAQ/隐私、后台登录。每页检查白橙与黑橙、桌面与手机。圆角使用 `CSS.supports("corner-shape", "squircle")` 判断能力；支持时验原生形状，不支持时验 `0.54 × --sq-r` 的降级。浏览器版本必须实际记录，不沿用历史支持结论。[Chrome 139 官方发布说明](https://developer.chrome.com/release-notes/139)、[CSS Borders Level 4 定义](https://www.w3.org/TR/css-borders-4/)

## 7. 衡量质量，而不是只数测试条数

以下是建议的发布门槛，不是已经达到的测量结果：

- 所有确定性回归通过，类型检查与生产构建通过。
- 受支持的真实浏览器矩阵中没有检测永久卡住、重测结果串线、未授权定位或移动端横向溢出。
- 未取得数据、权限拒绝、数据源故障与来源冲突样本，全部显示未知/受限，不显示正常或确定违规。
- 普通语言、字体、设备和隐私保护样本，不输出封禁风险结论。
- 关键页面两种主题的标题、长值、状态标签、超椭圆阴影和键盘焦点均人工看过。
- 脱敏报告包含采样时间、规则版本与来源；不含坐标、卡号、密钥、Cookie或账号凭据。

采样可用率 = 成功返回预期结构的次数 / 发起次数；超时率、失败原因和耗时 P50/P95 分开统计。IP 国家准确率只能在有独立已知出口标签的样本上计算，同时报告样本量、网络类型和未知比例；不能排除失败样本后声称整体准确。

误报率应针对清晰定义的事实判断，例如“将正常隐私模式判为恶意”或“将双栈差异称真实地址泄漏”。如果没有独立账号结果、授权样本和长期校准，不计算封禁概率，也不把志愿者自述当官方停用原因。

## 8. 实测记录模板

```text
日期时间 / 时区：
应用提交或版本：
规则版本 / 来源核对日：
设备 / 系统 / 浏览器完整版本：
窗口尺寸 / 缩放 / 白橙或黑橙：
普通 / 无痕 / 严格隐私模式：
网络类型 / IPv4或IPv6 / 已知代理或分流（不含凭据）：
测试动作与预期：
实际观测 / 状态 / 耗时：
独立参照与可信程度：
重复次数 / 不一致次数：
截图或报告（已脱敏）：
通过 / 失败 / 待测：
```

此记录用于维护可复现的事实。每次修复后只重跑受影响项及必要回归；政策或供应商结构变化时，更新审核快照和对应测试，再发布新的规则版本。
