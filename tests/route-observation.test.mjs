import test from 'node:test';
import assert from 'node:assert/strict';
import { routeObservationMessage } from '../src/lib/route-observation.ts';
const copy={leakSame:'same',leakExposed:'additional',leakLoading:'loading',leakNone:'none observed'};

test('a candidate without a trusted reference IP is not described as no observed addresses',()=>{
  const message=routeObservationMessage({status:'unknown',reason:'visitor-ip-unavailable',ips:['8.8.8.8']},'zh',copy);
  assert.match(message,/1 个公网候选/);
  assert.match(message,/无法比较/);
  assert.doesNotMatch(message,/未观察到/);
});
test('partial, failed and empty-completed WebRTC measurements retain distinct descriptions',()=>{
  assert.match(routeObservationMessage({status:'unknown',ips:['8.8.8.8'],reason:'timeout'},'en',copy),/did not complete/);
  assert.match(routeObservationMessage({status:'unknown',reason:'unsupported'},'en',copy),/unavailable/);
  assert.equal(routeObservationMessage({status:'none',ips:[]},'en',copy),'none observed');
  assert.equal(routeObservationMessage({status:'same'},'en',copy),'same');
  assert.match(routeObservationMessage({status:'dual-stack'},'en',copy),/not proof of a leak/);
});
