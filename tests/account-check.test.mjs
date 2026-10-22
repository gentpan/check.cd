import fs from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
const regions = fs
  .readFileSync(
    new URL("../src/lib/claude-regions.ts", import.meta.url),
    "utf8",
  )
  .replace(
    'import countries from "@/i18n/countries.json";',
    `const countries=${fs.readFileSync(new URL("../src/i18n/countries.json", import.meta.url), "utf8")};`,
  );
const source = fs
  .readFileSync(new URL("../src/lib/account-check.ts", import.meta.url), "utf8")
  .replace('import { claudeAccess } from "./claude-regions";', regions);
const code = ts.transpile(source, {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
});
const { evaluateAccount } = await import(
  "data:text/javascript;base64," + Buffer.from(code).toString("base64")
);
const rule = (answers, id) => evaluateAccount(answers).find((r) => r.id === id);
test("unanswered dropdown is unknown, never a regional violation", () =>
  assert.equal(
    rule({ stage: "register", actualCountry: "unknown" }, "actualCountry")
      .state,
    "unknown",
  ));
test("actual location is checked independently from registration IP", () =>
  assert.equal(
    rule(
      { stage: "use", actualCountry: "CN", registrationIpCountry: "US" },
      "actualCountry",
    ).state,
    "attention",
  ));
test("supported region with Chinese device settings stays eligible", () =>
  assert.equal(
    rule(
      {
        stage: "use",
        actualCountry: "UZ",
        language: "zh-CN",
        font: "PingFang SC",
      },
      "actualCountry",
    ).state,
    "ok",
  ));
test("unsupported registration remains a finding after a supported move", () =>
  assert.equal(
    rule(
      { stage: "use", actualCountry: "UZ", registrationCountry: "CN" },
      "registrationCountry",
    ).state,
    "attention",
  ));
test("unanswered payment countries stay unknown", () =>
  assert.equal(
    rule(
      {
        stage: "pay",
        paymentChannel: "web",
        cardCountry: "unknown",
        billingCountry: "unknown",
      },
      "billingCountries",
    ).state,
    "unknown",
  ));
test("card origin and billing country mismatch is a payment finding", () =>
  assert.equal(
    rule(
      {
        stage: "pay",
        paymentChannel: "web",
        cardCountry: "US",
        billingCountry: "GB",
      },
      "billingCountries",
    ).state,
    "attention",
  ));
test("app-store billing does not get website card rules", () => {
  const r = evaluateAccount({ stage: "pay", paymentChannel: "apple" });
  assert.ok(r.some((x) => x.id === "storeBilling"));
  assert.ok(!r.some((x) => x.id === "billingCountries"));
});
test("virtual cards are not automatically treated as a violation", () =>
  assert.equal(
    rule(
      { stage: "pay", paymentChannel: "web", cardType: "virtual" },
      "cardType",
    ).state,
    "info",
  ));
test("explicit Ukrainian region exception is retained", () =>
  assert.equal(
    rule(
      { stage: "use", actualCountry: "UA", uaRegion: "excluded" },
      "regionException",
    ).state,
    "attention",
  ));
test("API usage is evaluated separately from consumer age rules", () =>
  assert.equal(
    rule({ stage: "use", usage: "api", age: "no" }, "age").state,
    "info",
  ));
const signals = ts.transpile(
  fs.readFileSync(
    new URL("../src/detection/config/signals.ts", import.meta.url),
    "utf8",
  ),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
);
const { signalConfig } = await import(
  "data:text/javascript;base64," + Buffer.from(signals).toString("base64")
);
test("ordinary language, fonts and hardware have no ban-risk weight", () => {
  for (const id of [
    "language",
    "languageVariant",
    "timezone",
    "timezoneOffset",
    "locale",
    "emojiStyle",
    "chineseFonts",
    "vendorFonts",
    "touch",
    "screen",
    "hardware",
    "langTz",
  ])
    assert.equal(signalConfig[id].weight, 0, id);
});
