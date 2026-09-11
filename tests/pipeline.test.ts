import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseCarScannerLongCsv } from "../lib/telemetry/parser.ts";
import { applyQualityRules } from "../lib/telemetry/quality.ts";
import { integrateEnergy } from "../lib/telemetry/metrics.ts";
import { calculateWindowedGrade } from "../lib/route/gradient.ts";

test("parses the long Car Scanner contract and preserves coordinates", async () => {
  const text = await readFile(new URL("./fixtures/carscanner.synthetic.csv", import.meta.url), "utf8");
  const samples = parseCarScannerLongCsv(text);
  assert.equal(samples.length, 2);
  assert.equal(samples[0].speedKph, 100);
  assert.equal(samples[0].longitude, -4);
});

test("invalid fuel flow becomes missing, never zero", async () => {
  const text = await readFile(new URL("./fixtures/carscanner.synthetic.csv", import.meta.url), "utf8");
  const samples = applyQualityRules(parseCarScannerLongCsv(text));
  assert.equal(samples[1].fuelRateLph, undefined);
  assert.ok(samples[1].qualityFlags.includes("FUEL_RATE_IMPOSSIBLE"));
  assert.equal(integrateEnergy(samples).fuelLitres, 0);
});

test("gradient window remains configurable", () => {
  const route = [0, 250, 500, 750, 1000].map((distanceM) => ({ distanceM, latitude: 40, longitude: -4, elevationM: 600 + distanceM * 0.02 }));
  const result = calculateWindowedGrade(route, 500);
  assert.equal(result[2].gradePct, 2);
});
