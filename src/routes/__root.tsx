import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import appCss from "@/styles/app.css?url";

const themeBoot = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Claude 使用条件检查｜check.cd" },
      { name: "description", content: "核对 Claude 公开使用条件、注册与支付信息，观察当前网络与浏览器技术线索。" },
    ],
    links: [
      { rel: "preload", href: "/fonts/anthropic-sans.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "preload", href: "/fonts/anthropic-serif.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg?v=eight-rays" },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <HeadContent />
      </head>
      <body className="min-h-full bg-canvas font-sans text-ink" suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <main className="tool-site landing-site grid min-h-screen place-items-center bg-canvas px-6 text-ink">
      <div className="squircle sq-card not-found-card text-center">
        <p className="font-serif text-5xl">404</p>
        <a href="/" className="primary-btn squircle mt-6">返回 check.cd</a>
      </div>
    </main>
  );
}
