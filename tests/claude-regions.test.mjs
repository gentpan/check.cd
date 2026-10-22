import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/claude-regions.ts", import.meta.url), "utf8")
  .replace('import countries from "@/i18n/countries.json";', `const countries = ${readFileSync(new URL("../src/i18n/countries.json", import.meta.url), "utf8")};`);
const code = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const { claudeAccess, CLAUDE_ALLOWED, CLAUDE_REGION_POLICY, orderedCountries } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

test("unrecognized, malformed and unmodeled territory codes stay unknown", () => {
  for (const code of [null, undefined, "", "unknown", "ZZ", "XX", "USA", " UZ", "UZ ", "US\n", "PR", "MP", 100]) {
    assert.equal(claudeAccess(code), "unknown", String(code));
  }
});

test("reviewed common supported and unsupported countries stay distinct", () => {
  for (const code of ["UZ", "US", "GB", "JP", "TW", "uz"]) assert.equal(claudeAccess(code), "allowed", code);
  for (const code of ["CN", "HK", "RU", "IR"]) assert.equal(claudeAccess(code), "blocked", code);
});

test("source conflicts never become definite decisions or footer allow-list entries", () => {
  assert.equal(CLAUDE_REGION_POLICY.checkedAt, "2026-10-17");
  for (const code of CLAUDE_REGION_POLICY.conflictCodes) {
    assert.equal(claudeAccess(code), "unknown", code);
    assert.equal(claudeAccess(code, null, { product: "api" }), "unknown", code);
    assert.equal(CLAUDE_ALLOWED.has(code), false, code);
    assert.equal(orderedCountries("zh").includes(code), false, code);
  }
});

test("Ukrainian regional exclusions require a current product-specific source", () => {
  assert.equal(claudeAccess("UA", "Kyiv"), "allowed");
  for (const region of ["Crimea", "Donetsk", "Luhansk", "克里米亚", "Донецк"]) {
    assert.equal(claudeAccess("UA", region), "unknown", region);
    assert.equal(claudeAccess("UA", region, { product: "claude" }), "unknown", region);
    assert.equal(claudeAccess("UA", region, { product: "api" }), "blocked", region);
  }
  for (const region of ["Kherson", "Zaporizhzhia", "赫尔松", "Запорожье"]) {
    assert.equal(claudeAccess("UA", region, { product: "api" }), "unknown", region);
  }
});

test("future announcement has an effective date and never auto-promotes to reviewed policy", () => {
  assert.equal(CLAUDE_REGION_POLICY.announced.effectiveAt, "2026-11-12");
  assert.equal(CLAUDE_REGION_POLICY.announced.status, "announced");
  for (const asOf of ["2026-10-17", "2026-11-11", "2026-11-12", "2026-12-01"]) {
    assert.equal(claudeAccess("CD", null, { asOf }), "unknown", asOf);
    assert.equal(claudeAccess("UA", "Kherson", { product: "api", asOf }), "unknown", asOf);
    assert.equal(claudeAccess("UZ", null, { asOf }), "allowed", asOf);
  }
});

test("historical and invalid dates cannot claim current snapshot validity", () => {
  for (const asOf of ["2026-03-15", "not-a-date", new Date(NaN)]) {
    assert.equal(claudeAccess("UZ", null, { asOf }), "unknown", String(asOf));
  }
  assert.equal(claudeAccess("UZ", null, { asOf: new Date("2026-10-17T12:00:00Z") }), "allowed");
});
