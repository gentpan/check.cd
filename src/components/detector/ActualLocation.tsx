import { useEffect, useRef, useState } from "react";
import { locateCountry, type CountryBoundary } from "@/lib/browser-location";
import { countryName, claudeAccess } from "@/lib/claude-regions";
export function ActualLocation({ipCountry}:{ipCountry:string|null}) {
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<ReturnType<typeof locateCountry>>(null);
  const [error,setError]=useState("");
  const request=useRef(0);
  useEffect(()=>()=>{request.current++;},[]);
  const locate=async()=>{
    const id=++request.current;setBusy(true);setError("");setResult(null);
    try {
      if(!window.isSecureContext || !navigator.geolocation) throw new Error("当前浏览器不支持安全定位。");
      const position=await new Promise<GeolocationPosition>((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:15000,maximumAge:0}));
      if(id!==request.current)return;
      const response=await fetch("/country-boundaries.json",{signal:AbortSignal.timeout(12000)});
      if(!response.ok) throw new Error("国家边界数据暂时无法加载。");
      const boundaries=await response.json() as CountryBoundary[];
      const found=locateCountry(position.coords.latitude,position.coords.longitude,position.coords.accuracy,boundaries);
      if(id!==request.current)return;
      if(!found) throw new Error("定位点暂时无法对应国家，可能位于海域或边界附近。请按实际情况核对。");
      setResult(found);
    } catch(e) {
      if(id!==request.current)return;
      const code=(e as {code?:number}).code;
      setError(code===1?"定位权限被拒绝，实际所在地仍未确认。":code===3?"定位超时，请稍后重试。":code===2?"浏览器暂时无法提供位置。":e instanceof Error && /[\u4e00-\u9fff]/.test(e.message)?e.message:"定位失败或边界数据无法加载，实际所在地仍未确认。");
    } finally {if(id===request.current)setBusy(false);}
  };
  return <section className="actual-location"><div className="section-heading"><div><h3 className="text-base font-medium">实际所在地 · 可选确认</h3><p className="mt-2 text-sm leading-7 text-muted">IP 归属地不是实际位置。点击后由浏览器请求授权；本站仅在本页处理坐标，不上传或保存，也不发送给 AI。浏览器或系统定位服务的处理方式由其提供方决定。</p></div><button className="tab-btn squircle" onClick={()=>void locate()} disabled={busy}>{busy?"正在定位…":result?"重新定位":"确认实际所在地"}</button></div>{error?<p role="status" className="mt-3 text-sm text-warn">{error}</p>:null}{result?<div className="mt-4 text-sm leading-7"><p>浏览器定位参考：<strong>{countryName(result.countryCode,"zh")}</strong> · 报告精度约 {result.accuracy>=1000?`${(result.accuracy/1000).toFixed(1)} 千米`:`${Math.ceil(result.accuracy)} 米`}</p><p className="text-muted">IP 国家：{ipCountry?countryName(ipCountry,"zh"):"未取得"}。{result.uncertain?"定位精度不足或靠近边界，国家匹配不确定。":ipCountry && ipCountry!==result.countryCode?"两种信息不同，可能与网络出口、定位误差或系统设置有关。":"定位与 IP 归属地分别记录。"}</p>{!result.uncertain?<p className={claudeAccess(result.countryCode)==="allowed"?"text-muted":"text-warn"}>{claudeAccess(result.countryCode)==="allowed"?"匹配国家列于官方支持名单；仍需核对地区例外与账号条件。":claudeAccess(result.countryCode)==="unknown"?"该地区的产品规则或资料尚待核对，暂不作支持与否的结论。":"匹配国家未列于当前审核名单，请核对对应产品的官方条件。"}</p>:null}<p className="text-xs text-muted">定位可能受系统、网络、模拟位置和边界数据误差影响，不构成位置证明。刷新页面后清除。</p></div>:null}</section>;
}
