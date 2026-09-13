import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseCarScannerLongRecords } from "../lib/telemetry/inventory.ts";
import { buildSegmentReports } from "../lib/telemetry/report.ts";
import { applyLongRecordQuality } from "../lib/telemetry/record-quality.ts";
import { reconstructTimeline } from "../lib/telemetry/timeline.ts";

const fixtureUrl = new URL("./fixtures/carscanner.timeline.synthetic.csv", import.meta.url);

test("splits acquisition discontinuities and never carries values across them", async () => {
  const records = parseCarScannerLongRecords(await readFile(fixtureUrl, "utf8"));
  const timeline = reconstructTimeline(records, { discontinuitySeconds: 30 });
  assert.equal(timeline.segments.length, 2);
  assert.equal(timeline.segments[1].gapBeforeSeconds, 36.8);
  assert.ok(timeline.warnings.includes("ACQUISITION_DISCONTINUITIES_SPLIT"));
  const firstFrameAfterGap = timeline.frames.find((frame) => frame.segmentId === "segment-002");
  assert.equal(firstFrameAfterGap?.signals.hvVoltageV, undefined);
});

test("aligns only prior observations and exposes their age", async () => {
  const records = parseCarScannerLongRecords(await readFile(fixtureUrl, "utf8"));
  const timeline = reconstructTimeline(records);
  const frame = timeline.frames.find((candidate) => candidate.segmentId === "segment-001" && candidate.second === 1);
  assert.equal(frame?.signals.speedKph?.value, 36);
  assert.equal(frame?.signals.fuelUsedL?.value, 0);
  assert.equal(frame?.signals.fuelUsedL?.observedAtSecond, 0.2);
  assert.ok(Math.abs((frame?.signals.fuelUsedL?.ageSeconds ?? 0) - 0.8) < 1e-9);
});

test("derives segment metrics from continuous accumulators and blocks sparse HV", async () => {
  const records = parseCarScannerLongRecords(await readFile(fixtureUrl, "utf8"));
  const reports = buildSegmentReports(records, reconstructTimeline(records));
  assert.equal(reports.length, 2);
  assert.ok(Math.abs((reports[0].metrics.distanceKm.value ?? 0) - 0.03) < 1e-9);
  assert.ok(Math.abs((reports[0].metrics.fuelLitres.value ?? 0) - 0.003) < 1e-9);
  assert.ok(Math.abs((reports[0].metrics.fuelConsumptionLPer100Km.value ?? 0) - 10) < 1e-9);
  assert.equal(reports[0].metrics.batteryDischargeKwh.status, "insufficient");
  assert.equal(reports[0].metrics.batteryDischargeKwh.value, undefined);
});

test("rejects temporal settings that could hide a discontinuity", async () => {
  const records = parseCarScannerLongRecords(await readFile(fixtureUrl, "utf8"));
  assert.throws(() => reconstructTimeline(records, { gridSeconds: 30, discontinuitySeconds: 30 }), /debe ser mayor/);
});

test("uses accumulator endpoints instead of summing oscillating positive steps", () => {
  const records = parseCarScannerLongRecords([
    '"SECONDS";"PID";"VALUE";"UNITS";',
    '"0";"Distance travelled";"0";"km";',
    '"1";"Distance travelled";"1";"km";',
    '"1.1";"Distance travelled";"0";"km";',
    '"2";"Distance travelled";"2";"km";',
    '"0";"Fuel used";"0";"L";',
    '"1";"Fuel used";"0.1";"L";',
    '"1.1";"Fuel used";"0";"L";',
    '"2";"Fuel used";"0.2";"L";',
  ].join("\n"));
  const report = buildSegmentReports(records, reconstructTimeline(records))[0];
  assert.equal(report.metrics.distanceKm.value, 2);
  assert.equal(report.metrics.fuelLitres.value, 0.2);
  assert.ok(report.warnings.includes("DISTANCE_ACCUMULATOR_NON_MONOTONIC"));
});

test("removes impossible long-record values without replacing them with zero", () => {
  const records = parseCarScannerLongRecords([
    '"SECONDS";"PID";"VALUE";"UNITS";',
    '"0";"Vehicle speed";"100";"km/h";',
    '"1";"Vehicle speed";"999";"km/h";',
    '"1";"Unknown PID";"999";"x";',
  ].join("\n"));
  const quality = applyLongRecordQuality(records);
  assert.equal(quality.records.length, 2);
  assert.equal(quality.rejectedRows, 1);
  assert.equal(quality.rejected[0].reason, "SPEEDKPH_OUT_OF_RANGE");
  assert.equal(quality.records.some((record) => record.canonicalField === "speedKph" && record.value === 0), false);
});
