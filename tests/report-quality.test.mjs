import test from 'node:test';
import assert from 'node:assert/strict';
import {signalVerdict, reportQuality} from '../src/lib/report-quality.ts';

const signal = overrides => ({id:'webgl',label:'WebGL',value:'Blocked',score:1,weight:5,contribution:5,source:'browser',category:'device',...overrides});
test('a blocked or unavailable browser API is unknown, even with a legacy positive contribution',()=>{
  assert.equal(signalVerdict(signal({availability:'unavailable'}),true,true),'unknown');
  assert.equal(signalVerdict(undefined,true,true),'unknown');
  assert.equal(signalVerdict(signal({value:null}),true,true),'unknown');
});
test('a heuristic is information rather than a confirmed fault',()=>{
  assert.equal(signalVerdict(signal({evidence:'inferred'}),true,true),'info');
  assert.equal(signalVerdict(signal({evidence:'observed'}),true,true),'hit');
});
test('coverage does not count missing or unfinished data as a success',()=>{
  const values=['clear','info','unknown','unknown','pending'].map(verdict=>signal({verdict}));
  assert.deepEqual(reportQuality(values),{total:5,available:2,pending:1,unknown:2,attention:0,inferred:0,coverage:40});
  assert.equal(reportQuality([]).coverage,0);
  assert.equal(signalVerdict(signal({}),false,false),'pending');
});
