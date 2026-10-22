import { checkEvidence } from "@/lib/check-evidence";
import {useEffect,useRef,useState} from 'react';
import {fetchCardAnnotations} from '@/lib/card-annotations';
import type { DetectorLocaleText } from '@/detection/locale';
import type { SignalView } from '@/detection/client-engine';
import type { CardAnnotation } from '@/lib/card-annotations-validation';
import {CheckIcon} from './CheckIcon';

const actions:Record<string,string> = {
  country:'如需核对实际所在地，使用上方的可选定位；使用资格另按官方支持地区确认。',
  ipAddress:'这是当前网络出口地址；仅在网络切换后需要确认出口时重新检测。',
  ipType:'若线路类型与运营商不符，向网络提供方核对；无需仅因线路分类更换网络。',
  ipMarks:'有代理或滥用标记时，先核对正在使用的网络及提供方；无标记则无需处理。',
  aiSubscription:'此项来自第三方 IP 情报；订阅失败时检查实际付款报错与官方支付要求。',
  proxyCountry:'同地区 IPv4 / IPv6 通常无需处理；出口不同时检查网络分流配置。',
  clientProfile:'如识别与实际设备不符，先核对浏览器版本和扩展；正确则无需修改。',
  userAgent:'浏览器信息正确时无需修改；若版本识别异常，检查浏览器更新与扩展。',
  language:'语言按你的阅读习惯保留，无需为了 IP 归属地修改。',
  languageVariant:'保留习惯使用的文字设置，无需更改简繁体。',
  locale:'地区格式影响日期和数字展示；显示符合习惯时无需调整。',
  timezone:'本地时间不正确时检查系统自动时区；时间正确则保持当前设置。',
  timezoneOffset:'结合系统时区及夏令时核对；本地时间正确时无需修改。',
  emojiStyle:'这是系统与字体的渲染差异，表情显示正常时无需处理。',
  screen:'这是浏览器报告的 CSS 像素值；如需核对物理分辨率，请查看系统显示设置。',
  viewport:'窗口和工具栏会改变可用尺寸；页面显示完整时无需处理。',
  hardware:'处理器为逻辑数量、内存为近似值；精确硬件配置请查看系统信息。',
  touch:'无触屏设备显示 0 点触控属正常，无需更改。',
  chineseFonts:'已安装的中文字体无需删除；只在文字显示缺失时检查字体。',
  vendorFonts:'未检出厂商字体也无需安装；只在文字渲染有问题时检查字体配置。',
  canvasFp:'绘图功能正常则无需处理；绘图报错时检查站点权限及扩展影响。',
  webgl:'渲染正常则无需修改；失败时检查浏览器硬件加速及显卡驱动。',
  audioFp:'音频测试正常则无需处理；失败时核对浏览器音频支持与扩展影响。',
  automation:'若检测到非预期自动化，核对启动方式与扩展；正常浏览器无需处理。',
  permissions:'按功能需要逐项授权；拒绝非必要权限可以保留。',
  plugins:'PDF 能正常打开则无需处理；无法打开时检查内置 PDF 查看器。',
  storage:'功能正常则无需处理；无法保存设置时检查本站存储权限。',
  langTz:'语言与时区可以不同，保留个人习惯；仅在本地时间错误时修正系统时区。',
  tzIp:'旅行或远程出口可能造成差异；核对实际网络，不要将系统时区改成出口地区。',
  uaPlatform:'如两项不符，核对浏览器版本与扩展；不要手动伪造平台信息。',
  glOs:'渲染器识别异常时核对硬件加速与驱动；使用虚拟机时结合实际配置判断。',
};
export function SignalCard({signal,text,locale}: {signal:SignalView;text:DetectorLocaleText;locale:string}) {
  const [annotation,setAnnotation] = useState<CardAnnotation | null>(null);
  const [open,setOpen] = useState(false);
  const [methodOpen,setMethodOpen] = useState(false);
  const [aiLoading,setAiLoading] = useState(false);
  const [failed,setFailed] = useState(false);
  const requestId = useRef(0);
  useEffect(()=>{
    requestId.current++;
    setAnnotation(null); setOpen(false); setMethodOpen(false); setAiLoading(false); setFailed(false);
    return ()=>{requestId.current++;};
  },[signal.id,signal.value,signal.verdict,signal.source,locale]);
  const explain = async () => {
    if(annotation) {setOpen(value=>!value);return;}
    const id = ++requestId.current;
    setOpen(true);setAiLoading(true);setFailed(false);
    try {
      const result = await fetchCardAnnotations({data:{locale,checks:[{id:signal.id,label:signal.label,value:(signal.value ?? '').slice(0,1200),verdict:signal.verdict,source:signal.source}]}});
      if(requestId.current !== id) return;
      if(result.source === 'ai' && result.notes[signal.id]) setAnnotation(result.notes[signal.id]);
      else setFailed(true);
    } catch {if(requestId.current === id) setFailed(true);}
    finally {if(requestId.current === id) setAiLoading(false);}
  };
  const pending = signal.verdict === 'pending';
  const attention = signal.verdict === 'hit' || signal.verdict === 'warn';
  const unknown = signal.verdict === 'unknown';
  const zh = locale === 'zh' || locale === 'zh-HK';
  const ru = locale === 'ru';
  const status = signal.evidence === "inferred" && !pending && !unknown ? (zh ? "推断信息" : ru ? "Предположение" : "Inferred") : zh && !pending ? (unknown ? '未取得结果' : attention ? '需注意' : signal.verdict === 'info' ? '技术信息' : '未见异常') : pending ? text.pending : unknown ? text.unknown : attention ? text.ui.statusWarn : signal.verdict === 'info' ? text.ui.statusInfo : text.ui.statusClear;
  const fallback:CardAnnotation = {
    observation:zh ? (unknown ? `${signal.label}未取得有效数据，暂时无法解读。` : attention ? `${signal.label}命中本项技术观察规则，请核对上方结果。` : `${signal.label}结果已列在上方。`) : ru ? (unknown ? 'Данные этой проверки недоступны.' : 'Измеренный результат показан выше.') : (unknown ? 'No usable data was obtained for this check.' : 'The measured result is shown above.'),
    action:zh ? (unknown ? `可重新检测此项。${actions[signal.id] ?? '检查浏览器与网络是否正常。'}` : actions[signal.id] ?? '保持当前设置，仅在实际功能异常时排查。') : ru ? (unknown ? 'Повторите проверку; при повторном сбое проверьте браузер и сеть.' : 'Не меняйте настройки без проблем с соответствующей функцией.') : (unknown ? 'Retry this check; if it fails again, inspect the browser and network.' : 'Keep your settings unless this specific function is not working.'),
  };
  const note = annotation ?? fallback;
  const evidence = checkEvidence(signal.id, locale);
  // Approximate rendered width rather than treating CJK text as narrow Latin.
  // Short fields share a row; raw values and expanded explanations stay intact.
  const valueWidth = Array.from(signal.value ?? "").reduce((width, character) => width + (/[^\x00-\xff]/.test(character) ? 2 : 1), 0);
  const wide = signal.id === "userAgent" || valueWidth > 112 || (signal.value?.includes("\n") ?? false) || open || methodOpen;
  return <li data-check-id={signal.id} className={`signal-card squircle${wide ? ' signal-card-wide' : ''}${attention || unknown ? ' signal-card-attention' : ''}`}>
    <div className="signal-card-header">
      <div className="signal-card-title">
        <span className="squircle result-icon"><CheckIcon id={signal.id} className="size-4" /></span>
        <h5 className="signal-card-label">{signal.label}</h5>
      </div>
      <div className="signal-card-actions">
        <span className={`squircle result-status text-xs ${attention || unknown ? 'bg-warn-bg text-warn' : 'bg-surface-muted text-muted'}`}>{status}</span>
      </div>
    </div>
    <p className="signal-card-value">{pending ? '—' : signal.value || text.unknown}</p>
    <div className={`signal-card-footer${methodOpen ? ' signal-card-footer-open' : ''}`}>
      <details className="signal-method" open={methodOpen} onToggle={event => setMethodOpen(event.currentTarget.open)}>
        <summary>{zh ? "来源与局限" : ru ? "Источник и ограничения" : "Source & limitations"}<span>{signal.source === "server" ? (zh ? "请求 / 第三方" : "Request / provider") : signal.source === "combined" ? (zh ? "交叉对照" : "Cross-check") : (zh ? "浏览器" : "Browser")}</span></summary>
        <div><p>{evidence.method}</p><p>{evidence.limitation}</p><p>{evidence.permission}</p><a href={evidence.url} target="_blank" rel="noreferrer">{zh ? "查看技术依据" : "Technical reference"} ↗</a></div>
      </details>
      <button type="button" title={zh ? "按需将本项结果发送给已配置的 AI；未配置时显示规则说明" : "Send this check to the configured AI on request; local rules are used when unavailable"} onClick={()=>void explain()} disabled={pending || aiLoading} aria-expanded={open} aria-controls={`annotation-${signal.id}`} className="squircle signal-annotation-button disabled:cursor-not-allowed disabled:opacity-50">
        <CheckIcon id="aiSubscription" className="size-3.5" />{aiLoading ? (zh ? '解释中…' : ru ? 'Генерация…' : 'Explaining…') : open && annotation ? (zh ? '收起注释' : ru ? 'Скрыть' : 'Hide annotation') : failed ? (zh ? '重试 AI 注释' : ru ? 'Повторить' : 'Retry AI annotation') : (zh ? 'AI 注释' : ru ? 'Комментарий ИИ' : 'AI annotation')}
      </button>
    </div>
    {open ? <div id={`annotation-${signal.id}`} className="squircle signal-card-annotation">
      <p className="flex items-center gap-2 text-sm font-medium text-accent"><CheckIcon id="aiSubscription" className="size-4" />{annotation ? (zh ? 'AI 注释' : ru ? 'Комментарий ИИ' : 'AI annotation') : pending ? (zh ? '等待检测结果' : ru ? 'Ожидание результата' : 'Awaiting result') : aiLoading ? (zh ? 'AI 注释生成中…' : ru ? 'ИИ готовит комментарий…' : 'Generating AI annotation…') : (zh ? '规则说明 · AI 暂不可用' : ru ? 'Пояснение правил · ИИ недоступен' : 'Rule explanation · AI unavailable')}</p>
      {pending || (aiLoading && !annotation) ? <p className="mt-2 text-sm leading-6 text-muted">{zh ? (pending ? '此项结果将在检测完成后显示。' : '正在结合本项实测值生成解释及处理建议。') : ru ? 'Подготавливается пояснение результата.' : 'Preparing advice based on this measured result.'}</p> : <div className="signal-annotation-content text-sm leading-6 text-muted">
        <p className="flex items-start gap-2"><svg aria-hidden="true" viewBox="0 0 24 24" className="mt-1 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="8"/><path d="M12 7v6m0 3v1"/></svg><span><strong className="font-medium text-ink">{zh ? '结果解读：' : ru ? 'Результат: ' : 'Finding: '}</strong>{note.observation}</span></p>
        <p className="flex items-start gap-2"><svg aria-hidden="true" viewBox="0 0 24 24" className="mt-1 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="m4 12 5 5L20 6"/></svg><span><strong className="font-medium text-ink">{zh ? '处理建议：' : ru ? 'Действие: ' : 'Action: '}</strong>{note.action}</span></p>
      </div>}
    </div> : null}
  </li>;
}
