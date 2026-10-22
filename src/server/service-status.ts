import { chineseTitle, chineseIncident } from "./status-chinese.ts";
const SOURCE = "https://status.claude.com";
type Component = { id: string; name: string; status: string };
type Incident = { id: string; name: string; status: string; impact: string; updatedAt: string; scheduledFor: string; scheduledUntil: string; url: string };
export type ServiceStatus = { indicator: string; components: Component[]; incidents: Incident[]; history: Incident[]; maintenances: Incident[]; updatedAt: string; fetchedAt: string; stale: boolean; error: string | null; historyError: boolean };
let cached: ServiceStatus | null = null;
let nextFetch = 0;
let pending: Promise<ServiceStatus> | null = null;
function string(value: unknown, max = 200) { return typeof value === "string" ? value.slice(0,max) : ""; }
function incident(value: any): Incident {
  const id = string(value.id,80);
  return { id, name:chineseTitle(string(value.name)) || "Claude 服务事件（查看中文详情）", status:string(value.status,40), impact:string(value.impact,40), updatedAt:string(value.updated_at || value.scheduled_for,40), scheduledFor:string(value.scheduled_for,40), scheduledUntil:string(value.scheduled_until,40), url:/^[a-zA-Z0-9]+$/.test(id) ? `${SOURCE}/incidents/${id}` : SOURCE };
}
export async function statusJson(path: string) {
  const response = await fetch(`${SOURCE}/api/v2/${path}.json`, { signal:AbortSignal.timeout(8000), headers:{accept:"application/json"} });
  if (!response.ok) throw new Error(response.status===404 ? "STATUS_NOT_FOUND" : "Status unavailable");
  const body = await response.text();
  if (body.length > 1_000_000) throw new Error("Status response too large");
  return JSON.parse(body);
}
export async function readServiceStatus(): Promise<ServiceStatus> {
  if (cached && Date.now() < nextFetch) return cached;
  if (pending) return pending;
  pending = (async () => {
    try {
      const [summary, history] = await Promise.allSettled([statusJson("summary"),statusJson("incidents")]);
      if (summary.status !== "fulfilled" || !Array.isArray(summary.value.components) || typeof summary.value.status?.indicator !== "string") throw new Error("Invalid status");
      const data = summary.value;
      cached = { indicator:string(data.status.indicator,40), components:data.components.filter((c:any)=>!c.group).slice(0,30).map((c:any)=>({id:string(c.id,80),name:string(c.name),status:string(c.status,40)})), incidents:(Array.isArray(data.incidents)?data.incidents:[]).slice(0,15).map(incident), maintenances:(Array.isArray(data.scheduled_maintenances)?data.scheduled_maintenances:[]).slice(0,10).map(incident), history:history.status === "fulfilled" && Array.isArray(history.value.incidents) ? history.value.incidents.filter((i:any)=>i.status === "resolved" || i.status === "postmortem").slice(0,8).map(incident) : [], updatedAt:string(data.page?.updated_at,40), fetchedAt:new Date().toISOString(), stale:false,error:null,historyError:history.status !== "fulfilled" || !Array.isArray(history.value.incidents) };
      if (process.env.ANTHROPIC_API_KEY) {
        const events=[...(data.incidents || []),...(data.scheduled_maintenances || []),...(history.status === "fulfilled" ? history.value.incidents || [] : [])];
        const visible=new Set([...cached!.incidents,...cached!.maintenances,...cached!.history].map(i=>i.id));
        const unknown=events.filter((i:any)=>visible.has(i.id) && !chineseTitle(string(i.name))).slice(0,3);
        await Promise.all(unknown.map(async(i:any)=>{const text=await chineseIncident(string(i.name),[]);if(text) for(const item of [...cached!.incidents,...cached!.maintenances,...cached!.history]) if(item.id===i.id)item.name=text.title;}));
      }
      nextFetch = Date.now()+60_000;
      return cached;
    } catch {
      cached = cached ? {...cached,stale:true,error:"官方状态暂时无法更新，以下是上次取得的信息。"} : {indicator:"unknown",components:[],incidents:[],history:[],maintenances:[],updatedAt:"",fetchedAt:"",stale:true,error:"暂时无法取得 Claude 官方状态，请稍后刷新或查看官方状态页。",historyError:false};
      nextFetch=Date.now()+20_000;
      return cached;
    } finally { pending=null; }
  })();
  return pending;
}

const detailCache = new Map<string,{expires:number;data:StatusDetail}>();
const detailPending = new Map<string,Promise<StatusDetail | null>>();
export type StatusDetail = Incident & { originalName:string; components:string[]; updates:{id:string;status:string;createdAt:string;body:string}[]; translated:boolean; fetchedAt:string; stale:boolean };
export async function readStatusDetail(id:string): Promise<StatusDetail | null> {
  if (!/^[a-zA-Z0-9]{1,80}$/.test(id)) return null;
  const previous=detailCache.get(id);
  if (previous && Date.now()<previous.expires) return previous.data;
  if (detailPending.has(id)) return detailPending.get(id)!;
  const work=(async()=>{
    try {
      const envelope=await statusJson(`incidents/${id}`);
      const raw=envelope.incident;
      if(!raw) return null;
      if(raw.id!==id || typeof raw.name!=="string" || !Array.isArray(raw.incident_updates)) return null;
      const updates=raw.incident_updates.slice(0,12);
      const translated=await chineseIncident(raw.name,updates.map((u:any)=>string(u.body,2000)));
      const data:StatusDetail={...incident(raw),name:chineseTitle(raw.name) || translated?.title || "Claude 服务事件",originalName:string(raw.name),components:(raw.components || []).map((c:any)=>string(c.name)),updates:updates.map((u:any,index:number)=>({id:string(u.id,80),status:string(u.status,40),createdAt:string(u.display_at || u.created_at,40),body:translated?.bodies[index] || "中文整理暂时不可用，请稍后刷新，或在页面末尾查看官方原文。"})),translated:!!translated,fetchedAt:new Date().toISOString(),stale:false};
      detailCache.set(id,{expires:Date.now()+(translated?60_000:20_000),data});return data;
    } catch(error) {if(previous)return {...previous.data,stale:true};if(error instanceof Error && error.message==="STATUS_NOT_FOUND")return null;throw new Error("STATUS_DETAIL_UNAVAILABLE");}
    finally {detailPending.delete(id);}
  })(); detailPending.set(id,work);return work;
}
