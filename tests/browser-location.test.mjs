import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { locateCountry } from "../src/lib/browser-location.ts";
const data=JSON.parse(readFileSync(new URL("../public/country-boundaries.json",import.meta.url),"utf8"));
test("local boundary matching covers known locations without an IP fallback",()=>{
  assert.equal(locateCountry(41.31,69.28,50,data)?.countryCode,"UZ");
  assert.equal(locateCountry(39.9,116.4,50,data)?.countryCode,"CN");
  assert.equal(locateCountry(48.85,2.35,50,data)?.countryCode,"FR");
  assert.equal(locateCountry(0,0,50,data),null);
});
test("coarse or border-adjacent readings remain uncertain",()=>{
  assert.equal(locateCountry(41.31,69.28,20000,data)?.uncertain,true);
  assert.equal(locateCountry(22.55,114.05,50,data)?.uncertain,true);
});
test("invalid coordinates do not produce a country",()=>{
  assert.equal(locateCountry(NaN,69,10,data),null);
  assert.equal(locateCountry(91,69,10,data),null);
  assert.equal(locateCountry(41,69,-1,data),null);
});
