import test from 'node:test';
import assert from 'node:assert/strict';
import {templateSummary} from '../src/lib/summary-template.ts';
import {validateSummaryPayload} from '../src/lib/input-validation.ts';
const payload = {locale:'zh',envScore:0,riskLabel:'无计分项',matchedRegion:null,access:'unknown',purity:null,hits:[],total:3,quality:{available:1,unknown:2,pending:0},unknownLabels:['IP','WebGL']};
test('zero score with unavailable checks reports missing evidence, never an all-clear',()=>{
  const summary=templateSummary(payload);
  assert.match(summary,/1 项已取得数据，2 项未取得/);
  assert.match(summary,/未取得：IP、WebGL/);
  assert.doesNotMatch(summary,/全部正常|整体干净|安全概率/);
});
test('coverage must reconcile with total before paid summary generation',()=>{
  assert.deepEqual(validateSummaryPayload(payload),payload);
  assert.throws(()=>validateSummaryPayload({...payload,quality:{available:3,unknown:2,pending:0}}));
  assert.throws(()=>validateSummaryPayload({...payload,quality:{available:1.5,unknown:1.5,pending:0}}));
});
test('an absent provider score stays absent in validation and summary',()=>{
  const value={...payload,purity:{ip:'8.8.8.8',score:null,grade:null,location:'',type:null,marks:[],ai:null}};
  assert.equal(validateSummaryPayload(value).purity.score,null);
  assert.match(templateSummary(value),/未提供声誉评分/);
});
test('Russian fallback never recommends aligning language and timezone with an IP',()=>{
  assert.doesNotMatch(templateSummary({...payload,locale:'ru'}),/Держите IP/);
  assert.match(templateSummary({...payload,locale:'ru'}),/недоступно 2/);
});
