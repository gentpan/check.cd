# CheckCC | Network and Browser Environment Checks

[English](README.en.md) | [中文](README.md)

[check.cd](https://check.cd) records the network exit reaching this site and browser-reported settings and capabilities. It also provides optional location confirmation, public eligibility checks and Claude's official service status. It does not access Claude accounts, certify account safety or predict suspension probability.

Upstream: [yacuo/check-cc](https://github.com/yacuo/check-cc). Images in `docs/images/` show historical interfaces and are not evidence of current features or accuracy.

## Reading the results

- **Coverage**: the proportion of currently enabled checks that returned data, not a pass rate, accuracy measurement or account safety score.
- **Observed**: values from this connection or reported by the browser, describing this sampling session.
- **Inferred**: IP geolocation, font hints and platform comparisons have source and capability limits; they do not prove physical location or account eligibility.
- **Unknown**: unconfigured intelligence, fields unavailable under a plan, permissions, timeouts and conflicting sources stay unknown, never clean or zero risk.

The enabled configuration in `src/detection/config/signals.ts` determines the check count. Language, fonts, timezone, screen size, low core counts, touch, software graphics, blocked Canvas/audio and empty plugin lists are not evidence of suspension risk. Do not change language, disguise timezone or weaken privacy to improve a result.

See the [detection accuracy and testing guide](docs/detection-accuracy.md) for data acquisition, limitations, regression tests and real-browser acceptance. Passing automated tests does not measure real-world geolocation accuracy or suspension prediction.

## Scope and data sources

| Area | Acquisition and limits |
| --- | --- |
| Visit exit | The actual connection or an explicitly configured trusted proxy header identifies the public address reaching this site. If unknown, it remains unavailable rather than using the server's own exit. |
| IP intelligence | The server uses IPinfo's authorized API. Lite supplies basic country and ASN data; other fields are used only when the licensed plan and response supply them. Without a token, a confirmed exit remains available and intelligence stays unknown. |
| WebRTC | Configured STUN services yield candidate addresses and sampling states. Different addresses can result from dual-stack networking, NAT, split routing or other paths; they are not automatically leaks. No candidates do not prove that no other path exists. |
| Browser and device | Local UA, available UA-CH, languages, Intl, timezone, CSS screen pixels, logical processors, approximate memory and touch. Fonts and Emoji are heuristic hints; Canvas, WebGL and offline audio diagnose capabilities. |
| Runtime and comparisons | Explicit automation markers, permissions and storage state. Dependent probes finish before comparisons run. Differences are technical observations, not account decisions. |
| Actual location | Requested only after a click and permission. Coordinates are matched against local country boundaries inside the page. Coarse, border-adjacent and unmatched readings stay uncertain. |
| Eligibility context | A skippable questionnaire compares user answers with public regional, product, payment and verification conditions. The browser cannot reconstruct registration history or suspension causes. |
| Official status | Public Claude status data. A normal service status does not guarantee personal access and is not a browser-to-Claude connectivity test. |

The current IPinfo integration supplies no site-defined purity score, suspension probability or AI subscription eligibility certification. Missing fields are not invented. Regional rules retain source, product and effective-date distinctions; automatic news updates do not change eligibility rules.

## Stack and pages

TanStack Start / TanStack Router, React, TypeScript, Vite / Nitro for Node.js, Tailwind CSS and pnpm. The default build is not static-only; other hosting targets require a configured and verified Nitro adapter.

- `/`: environment checks and optional location and eligibility context.
- `/articles`: regional, payment, verification, network and usage explainers.
- `/news` and `/news/<id>`: sources, publication dates and known effective dates.
- `/status` and `/status/<id>`: official Claude components, incidents and timelines.
- `/admin`: news publication, drafts and update settings.
- `/api/news-refresh`: protected POST endpoint for an external scheduler, requiring `Authorization: Bearer <ADMIN_TOKEN>`. GET does not trigger an update.

The interface uses white/orange and black/orange themes. Buttons, labels and cards use native `corner-shape: squircle`, falling back to ordinary corners at `0.54 × --sq-r`. Copy resources cover Simplified Chinese, Cantonese, Russian and English; the current routes determine exposed language entries.

## Local development and validation

Requires **Node.js 22.18+** and pnpm.

```bash
cp .env.example .env.local
pnpm install --frozen-lockfile
pnpm dev
```

Open [localhost:3000](http://localhost:3000). A loopback connection may provide no confirmed public visitor exit; unknown exit/intelligence is expected locally, while browser sampling can still run.

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

`pnpm dev` and `pnpm start` load `.env.local`; production can inject environment variables directly. Output is `.output`, with entry point `.output/server/index.mjs`. Never prefix server secrets with `VITE_` or commit `.env.local`.

## Server configuration

| Variable | Purpose |
| --- | --- |
| `IPINFO_TOKEN` | Optional token for IPinfo's authorized API. Without it, no intelligence request is made; a confirmed exit remains available. |
| `IPINFO_TIER` | Defaults to `lite`. Accepts `lite`, `core`, `plus`, `max`; must match the authorized plan. Missing country, type or flag fields stay unknown. |
| `TRUST_PROXY_HEADER` | Empty by default, trusting only the actual connection. Set `x-real-ip`, `cf-connecting-ip` or `x-forwarded-for` only when the sole trusted ingress overwrites it and direct origin access is blocked. |
| `ANTHROPIC_API_KEY` | Optional model access for manual technical summaries/annotations and enabled news/status processing. Without it, no model call is made; rule explanations are distinguished from AI. |
| `ANTHROPIC_MODEL` | Model identifier; see `.env.example` for the default and choose a model actually available to the deployment account. |
| `ADMIN_TOKEN` | Random value of at least 32 characters for administration and protected updates. |
| `NEWS_AUTO_UPDATE` | Initial automatic-news setting; saved admin settings take precedence afterward. |
| `NEWS_DATA_PATH` | News store path, default `data/news.json`; use persistent storage in production. |

A trusted ingress must **replace** client-supplied headers with exactly one confirmed public address. The application does not pick a public entry from an arbitrary forwarded chain; comma-separated chains are rejected. Enabling header trust does not authenticate a proxy. Firewall rules, listener binding and reverse-proxy configuration must enforce the trust boundary. With Cloudflare, the ingress must validate official proxy ranges before forwarding the real client address.

## Docker and VPS deployment

The project includes `Dockerfile` and `compose.yaml`:

```bash
docker compose up -d --build
docker compose logs --tail=100 checkcd
```

Compose reads `.env.local`, binds the application to host `127.0.0.1:3000` and persists the news store in the `news-data` volume. Expose it through an HTTPS reverse proxy. Configure `TRUST_PROXY_HEADER` for the actual ingress; do not present Docker or private proxy addresses as the visitor's public exit.

The existing VPS layout uses a dedicated systemd service and Caddy. `deploy/checkcd.caddy` is a template; verify ingress trust before using it.

- Service: `/etc/systemd/system/checkcd.service`.
- Server configuration: `/etc/checkcd.env`, administrator-readable only.
- Releases: `/opt/checkcd/releases`; `/opt/checkcd/current/.output` selects the active build.
- Persistent data: `/var/lib/checkcd/news.json`, writable by the `checkcd` service user.
- Node: `/opt/checkcd/node/bin/node`.
- Existing Caddy site configuration: `/etc/caddy/ip-projects-ogden.caddy`.

Place a new `.output` in a separate release, switch the `current` symlink and restart `checkcd`. Keep credentials and news outside releases. After deployment, check pages, health, visitor-address provenance and unknown/error handling. Source changes do not imply a production deployment.

## News and service status

The persistent Node process checks the news schedule every minute. The default interval is 24 hours; administration supports 6–168 hours. External schedulers can use the protected POST endpoint. Search and drafting require a configured model; non-official sources enter review and failures preserve published content. Titles open local detail pages with original sources at the end. Search coverage is not the entire web.

Persist the news store and keep one Node process responsible for writing. Multiple instances, serverless or sleeping hosts need shared storage and an external scheduler. Local timers do not continue while the application is stopped.

`/status` queries official `status.claude.com` APIs with caching and concurrent-request merging, refreshing while the page is visible. Failed refreshes mark historical data stale; an initial failure stays unknown. Chinese translations persist in `status-translations.json` beside the news store. Translation failures are disclosed and original sources remain available.

## Privacy

Basic browser sampling needs no Claude login and reads no chats, passwords or account cookies. Configured IPinfo requests send the queried public address to that provider; WebRTC contacts STUN services. Geolocation runs only after a click and permission, with coordinates matched locally, never sent to this server or AI or persisted.

Technical summaries and individual AI annotations run **only after the corresponding button is clicked**. They submit relevant technical findings, excluding optional answers, location coordinates and account credentials. AI can explain existing evidence, not fill missing measurements or verify account availability. Summaries may be cached in the browser for 24 hours; optional answers remain in page memory and clear on reload. Deployment operators manage and disclose server/hosting logs.

## Attribution and license

Resource support: [tokenplan.vip](https://tokenplan.vip).

MIT License, Copyright © yacuo / CheckCC. Retain original copyright, license notices and source attribution when using, modifying or redistributing: [yacuo/check-cc](https://github.com/yacuo/check-cc). Public deployments are encouraged to keep a footer source link.
