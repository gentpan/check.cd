import {createFileRoute} from '@tanstack/react-router';
import {useEffect,useState} from 'react';
import {SiteFrame} from '@/components/layout/SiteFrame';
export const Route = createFileRoute('/design')({
  head:()=>({meta:[{title:'组件样式验收｜check.cd'},{name:'robots',content:'noindex, nofollow'}]}),
  component:LoadingPreview,
});
function Spinner({size=24}:{size?:number}) {
  return <img src="/logo-loading.svg" width={size} height={size} alt="" aria-hidden="true" />;
}
function LoadingPreview() {
  const [loading,setLoading] = useState(false);
  useEffect(()=>{if(!loading) return;const timer=window.setTimeout(()=>setLoading(false),2400);return ()=>window.clearTimeout(timer);},[loading]);
  return <SiteFrame><main className="site-container py-12">
    <a href="/" className="text-sm text-muted hover:text-accent">← 返回检测页面</a>
    <section className="squircle shape-validation mt-8 border border-line bg-surface p-6">
      <h1 className="text-2xl font-medium">原生超椭圆与兼容降级</h1>
      <p className="mt-3 text-sm leading-7 text-muted"><span className="shape-status-native">当前浏览器支持 corner-shape，使用原生 squircle。</span><span className="shape-status-fallback">当前浏览器不支持 corner-shape，使用 0.54 倍普通圆角。</span></p>
      <div className="mt-6 flex flex-wrap items-center gap-6"><span className="squircle shape-validation-button">48px · r22</span><div className="squircle shape-validation-card"><span className="squircle shape-validation-inner">外层 r22 · 间距 8 · 内层 r14</span></div></div>
      <p className="mt-5 text-xs leading-6 text-muted">检查边框、阴影和键盘焦点是否完整；同一页面可切换白橙与黑橙主题。</p>
    </section>
    <h2 className="mt-8 text-3xl font-semibold">Logo Loading 样式</h2>
    <p className="mt-3 text-base leading-7 text-muted">八段短线，一段橙色依次点亮；每秒顺时针转一圈。</p>
    <div className="mt-8 grid gap-5 md:grid-cols-3">
      <section className="squircle sq-card border border-line bg-surface p-6">
        <h2 className="text-base font-medium">旋转图标</h2>
        <div className="flex min-h-40 items-center justify-center"><Spinner size={80}/></div>
        <p className="text-sm leading-6 text-muted">左侧箭头拆成三段短线，与原来的五条光芒组成八段。</p>
      </section>
      <section className="squircle sq-card border border-line bg-surface p-6">
        <h2 className="text-base font-medium">按钮预览</h2>
        <div className="flex min-h-40 items-center justify-center">
          <button type="button" onClick={()=>setLoading(true)} disabled={loading} aria-busy={loading} className="squircle sq-large-button inline-flex h-12 min-w-40 items-center justify-center gap-2 border border-accent px-5 text-base text-accent hover:bg-accent-bg disabled:cursor-wait">
            {loading ? <Spinner size={24}/> : <img src="/logo.svg" width="24" height="24" alt=""/>}
            <span aria-live="polite">{loading ? '加载中…' : '点击预览'}</span>
          </button>
        </div>
        <p className="text-sm leading-6 text-muted">点击按钮体验约两秒的 Loading 动画。</p>
      </section>
      <section className="squircle sq-card border border-line bg-surface p-6">
        <h2 className="text-base font-medium">不同尺寸</h2>
        <div className="flex min-h-40 items-center justify-center gap-7">{[16,24,40].map(size=><div key={size} className="flex flex-col items-center gap-4"><Spinner size={size}/><span className="text-xs text-muted">{size}px</span></div>)}</div>
        <p className="text-sm leading-6 text-muted">适用于单项 AI 解读、检测按钮和加载状态。</p>
      </section>
    </div>
  </main></SiteFrame>;
}
