import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { inspectCarScannerLongCsv, parseCarScannerLongRecords } from "../lib/telemetry/inventory.ts";

const fixtureUrl = new URL("./fixtures/carscanner.inventory.synthetic.csv", import.meta.url);

test("preserves valid long records and quoted semicolons", async () => {
  const text = await readFile(fixtureUrl, "utf8");
  const records = parseCarScannerLongRecords(text);
  assert.equal(records.length, 11);
  assert.equal(records.at(-1)?.pid, "Unknown; quoted PID");
  assert.equal(records[0].canonicalField, "speedKph");
  assert.equal(records[0].unitMatchesCatalog, true);
});

test("reports invalid rows and empirical capabilities", async () => {
  const text = await readFile(fixtureUrl, "utf8");
  const inventory = inspectCarScannerLongCsv(text);
  assert.equal(inventory.rowCount, 12);
  assert.equal(inventory.validNumericRows, 11);
  assert.equal(inventory.invalidRows, 1);
  assert.equal(inventory.capabilities.speed.status, "available");
  assert.equal(inventory.capabilities.gasoline.status, "available");
  assert.equal(inventory.capabilities.hvEnergy.status, "insufficient");
  assert.equal(inventory.capabilities.regeneration.status, "insufficient");
  assert.equal(inventory.capabilities.gpsRoute.status, "insufficient");
  assert.deepEqual(inventory.warnings, ["HV_SIGNAL_COVERAGE_INSUFFICIENT", "GPS_COORDINATES_MISSING"]);
});

test("rejects files that do not implement the long Car Scanner contract", () => {
  assert.throws(
    () => inspectCarScannerLongCsv('"time";"name";"reading"\n"0";"speed";"10"'),
    /SECONDS, PID y VALUE/,
  );
});
