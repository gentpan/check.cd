import test from 'node:test';
import assert from 'node:assert/strict';
import { networkSignals } from '../src/lib/network-signals.ts';
import { mapIpInfoReport } from '../src/server/ip-purity.ts';
import { evidenceEntries, checkEvidence } from '../src/lib/check-evidence.ts';
import { signalConfig } from '../src/detection/config/signals.ts';

const wording = { partial:'some flags unavailable', clear:'not flagged by provider', anonymous:'anonymous classification' };
const marks = report => networkSignals(report, {}, 'unknown', {}, wording).find(signal=>signal.id==='ipMarks');
const report = data => mapIpInfoReport({ip:'8.8.8.8',...data},'8.8.8.8','socket',Date.now());

test('missing privacy data is unknown and never converted to a clean classification',()=>{
  const result=marks(report({country_code:'US'}));
  assert.equal(result.availability,'unavailable');
  assert.equal(result.contribution,0);
});
test('an explicit anonymous classification retains the observation when all subtype fields are missing',()=>{
  const result=marks(report({is_anonymous:true}));
  assert.equal(result.availability,'available');
  assert.match(result.value,/anonymous classification/);
  assert.match(result.value,/unavailable/);
  assert.equal(result.contribution,1);
});
test('explicit false classifications remain distinct from missing classifications',()=>{
  const base=report({});
  const result=marks({...base,anonymous:false,flagChecks:Object.fromEntries(Object.keys(base.flagChecks).map(key=>[key,false]))});
  assert.equal(result.value,wording.clear);
  assert.equal(result.availability,'available');
  assert.equal(result.contribution,0);
});
test('every enabled check has a documented method and primary reference',()=>{
  for(const [id,config] of Object.entries(signalConfig)) {
    if(!config.enabled) continue;
    assert.ok(evidenceEntries[id],id);
    const evidence=checkEvidence(id,'zh');
    assert.ok(evidence.method.length>5,id);
    assert.ok(evidence.limitation.length>5,id);
    assert.match(evidence.url,/^https:\/\//);
  }
  assert.match(checkEvidence('proxyCountry','zh').permission,/STUN/);
  assert.match(checkEvidence('country','zh').permission,/IPinfo/);
});
