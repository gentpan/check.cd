import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCardAnnotationInput,validateCardAnnotationOutput} from '../src/lib/card-annotations-validation.ts';
const check = {id:'country',label:'IP 归属地',value:'未知',verdict:'unknown',source:'server'};
test('annotation input strips extra fields including location coordinates',()=>{
  const result = validateCardAnnotationInput({locale:'zh',latitude:34,checks:[{...check,longitude:100}]});
  assert.deepEqual(result,{locale:'zh',checks:[check]});
});
test('annotation input rejects duplicates, oversized data and unfinished checks',()=>{
  for(const checks of [[check,check],[{...check,value:'x'.repeat(1201)}],[{...check,verdict:'pending'}]]) assert.throws(()=>validateCardAnnotationInput({locale:'zh',checks}));
});
test('AI output must match every requested card exactly once',()=>{
  assert.deepEqual(validateCardAnnotationOutput({notes:[{id:'country',observation:'未取得结果，无法判断。',action:'重新检测网络出口。'}]},['country']),{country:{observation:'未取得结果，无法判断。',action:'重新检测网络出口。'}});
  for(const notes of [[],[{id:'other',observation:'异常',action:'核对数据'}],[{id:'country',observation:'正常',action:'无需修改'},{id:'country',observation:'重复',action:'无需修改'}],[{id:'country',observation:'',action:'重试'}]]) assert.throws(()=>validateCardAnnotationOutput({notes},['country']));
});

test('annotations require an actionable field, not a single generic text',()=>{assert.throws(()=>validateCardAnnotationOutput({notes:[{id:'country',observation:'位置未知',action:''}]},['country']));assert.throws(()=>validateCardAnnotationOutput({notes:[{id:'country',text:'仅供参考'}]},['country']));});

test('card AI accepts only one selected check per request',()=>{assert.throws(()=>validateCardAnnotationInput({locale:'zh',checks:[check,{...check,id:'ipAddress'}]}));});
