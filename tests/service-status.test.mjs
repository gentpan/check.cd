import assert from "node:assert/strict";
import test from "node:test";
const summary = {page:{updated_at:"2026-10-14T15:00:00Z"},status:{indicator:"none"},components:[{id:"api",name:"Claude API",status:"operational"}],incidents:[],scheduled_maintenances:[]};
const response = value => ({ok:true,text:async()=>JSON.stringify(value)});

test("status requests share one fetch and use the freshness cache",async()=>{
  const original=globalThis.fetch;
  let calls=0;
  globalThis.fetch=async url=>{calls++;return response(url.includes("summary")?summary:{incidents:[]});};
  try {
    const {readServiceStatus}=await import("../src/server/service-status.ts?cache");
    const [first,second]=await Promise.all([readServiceStatus(),readServiceStatus()]);
    assert.equal(calls,2);assert.equal(first,second);assert.equal(first.stale,false);
    await readServiceStatus();assert.equal(calls,2);
  } finally {globalThis.fetch=original;}
});
test("an initial outage is unknown, never reported as normal",async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw new Error("network");};
  try {const {readServiceStatus}=await import("../src/server/service-status.ts?failure");const data=await readServiceStatus();assert.equal(data.indicator,"unknown");assert.equal(data.stale,true);assert.deepEqual(data.components,[]);assert.ok(data.error);}
  finally {globalThis.fetch=original;}
});
test("failed refresh preserves the last observation and marks it stale",async()=>{
  const original=globalThis.fetch;const originalNow=Date.now;
  let clock=1_800_000_000_000;let failed=false;
  Date.now=()=>clock;
  globalThis.fetch=async url=>{if(failed)throw new Error("network");return response(url.includes("summary")?summary:{incidents:[]});};
  try {const {readServiceStatus}=await import("../src/server/service-status.ts?stale");const first=await readServiceStatus();clock+=61_000;failed=true;const last=await readServiceStatus();assert.equal(last.stale,true);assert.equal(last.fetchedAt,first.fetchedAt);assert.deepEqual(last.components,first.components);assert.ok(last.error);}
  finally {globalThis.fetch=original;Date.now=originalNow;}
});
test("unavailable incident history does not hide a valid current status",async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async url=>{if(!url.includes("summary"))throw new Error("history unavailable");return response(summary);};
  try {const {readServiceStatus}=await import("../src/server/service-status.ts?history");const data=await readServiceStatus();assert.equal(data.stale,false);assert.equal(data.indicator,"none");assert.equal(data.historyError,true);}
  finally {globalThis.fetch=original;}
});

test("event detail reads the official envelope and keeps a Chinese timeline on-site",async()=>{
  const {mkdtemp,rm}=await import("node:fs/promises");const {tmpdir}=await import("node:os");const {join}=await import("node:path");
  const folder=await mkdtemp(join(tmpdir(),"checkcd-status-test-"));
  const original=globalThis.fetch;const originalKey=process.env.ANTHROPIC_API_KEY;const originalPath=process.env.STATUS_TRANSLATIONS_PATH;
  process.env.ANTHROPIC_API_KEY="test-only";process.env.STATUS_TRANSLATIONS_PATH=join(folder,"translations.json");
  globalThis.fetch=async url=>url.includes("api.anthropic.com")?{ok:true,json:async()=>({content:[{type:"text",text:JSON.stringify({title:"API 错误率升高",bodies:["问题已解决。"]})}]})}:response({incident:{id:"event123",name:"Elevated errors on Claude API",status:"resolved",components:[{name:"Claude API"}],incident_updates:[{id:"update1",status:"resolved",created_at:"2026-10-14T10:00:00Z",body:"This issue has been resolved."}]}});
  try {const {readStatusDetail}=await import("../src/server/service-status.ts?detail");const detail=await readStatusDetail("event123");assert.equal(detail.translated,true);assert.equal(detail.updates[0].body,"问题已解决。");assert.equal(detail.name,"Claude API 错误率上升");assert.equal(detail.url,"https://status.claude.com/incidents/event123");assert.equal(await readStatusDetail("../../evil"),null);}
  finally {globalThis.fetch=original;if(originalKey===undefined)delete process.env.ANTHROPIC_API_KEY;else process.env.ANTHROPIC_API_KEY=originalKey;if(originalPath===undefined)delete process.env.STATUS_TRANSLATIONS_PATH;else process.env.STATUS_TRANSLATIONS_PATH=originalPath;await rm(folder,{recursive:true,force:true});}
});
