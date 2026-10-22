import assert from "node:assert/strict";
import test from "node:test";
import { isPublicIp } from "../src/lib/public-ip.ts";
import { isLikelyDualStack } from "../src/lib/network-observation.ts";

test("dual-stack observations are not automatically classified as leaks", () => {
  assert.equal(isLikelyDualStack({ip:"2001:4860::1",countryCode:"UZ"},{ip:"8.8.8.8",countryCode:"UZ"}),true);
  assert.equal(isLikelyDualStack({ip:"2001:4860::1",countryCode:"UZ"},{ip:"8.8.8.8",countryCode:"US"}),false);
  assert.equal(isLikelyDualStack({ip:"2001:4860::1",countryCode:null},{ip:"8.8.8.8",countryCode:null}),false);
  assert.equal(isLikelyDualStack({ip:"1.1.1.1",countryCode:"UZ"},{ip:"8.8.8.8",countryCode:"UZ"}),false);
});
import {
  validateSummaryPayload,
  validateIpRequest,
  validateAddressRequest,
} from "../src/lib/input-validation.ts";

test("accept public IPv4 and IPv6 literals", () => {
  for (const ip of [
    "8.8.8.8",
    "1.1.1.1",
    "2606:4700:4700::1111",
    "2001:4860:4860:0000:0000:0000:0000:8888",
  ])
    assert.equal(isPublicIp(ip), true, ip);
});

test("reject malformed and non-public addresses", () => {
  for (const ip of [
    "999.1.1.1",
    "1.2.3",
    "1..2.3",
    " 8.8.8.8",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "127.0.0.1",
    "100.64.0.1",
    "169.254.1.1",
    "224.0.0.1",
    "255.255.255.255",
    "192.0.2.1",
    "198.51.100.1",
    "203.0.113.1",
    "198.18.0.1",
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "fe80::1",
    "fd00::1",
    "2001:db8::1",
    "2001:::1",
    "2001::1::2",
    "2001:xyz::1",
    "2001:12345::1",
  ])
    assert.equal(isPublicIp(ip), false, ip);
});

const payload = () => ({
  locale: "zh",
  envScore: 10,
  riskLabel: "待核对",
  matchedRegion: null,
  access: "unknown",
  purity: null,
  hits: [{ label: "出口", value: "测试", contribution: 10 }],
  total: 33,
});

test("validate summary and discard unexpected fields", () => {
  const input = { ...payload(), extra: "do not send" };
  assert.deepEqual(validateSummaryPayload(input), payload());
  assert.equal(
    validateSummaryPayload({
      ...payload(),
      purity: {
        score: 80,
        grade: "A",
        location: "test",
        ip: "8.8.8.8",
        type: null,
        marks: [],
        ai: null,
      },
    }).purity.score,
    80,
  );
});

test("reject invalid values before calling paid AI", () => {
  for (const input of [
    null,
    {},
    { ...payload(), locale: "invalid" },
    { ...payload(), envScore: NaN },
    { ...payload(), envScore: 101 },
    { ...payload(), hits: "wrong" },
    { ...payload(), total: 0 },
    { ...payload(), riskLabel: "x".repeat(257) },
    {
      ...payload(),
      hits: Array.from({ length: 33 }, () => ({
        label: "x",
        value: "x".repeat(1024),
        contribution: 1,
      })),
    },
  ])
    assert.throws(() => validateSummaryPayload(input));
});

test("IP requests require known locales and bounded address strings", () => {
  assert.deepEqual(validateIpRequest({ locale: "en", extra: 1 }), {
    locale: "en",
  });
  assert.deepEqual(validateAddressRequest({ locale: "zh", ip: "8.8.8.8" }), {
    locale: "zh",
    ip: "8.8.8.8",
  });
  for (const input of [
    null,
    { locale: "invalid" },
    { locale: "zh", ip: 10 },
    { locale: "zh", ip: "a".repeat(46) },
  ])
    assert.throws(() => validateAddressRequest(input));
});
