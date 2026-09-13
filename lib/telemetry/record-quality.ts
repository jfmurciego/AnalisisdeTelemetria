import type { CanonicalTelemetryField } from "./catalog.ts";
import type { CarScannerRecord } from "./inventory.ts";

export const LONG_RECORD_QUALITY_VERSION = "long-record-quality-v0.3.0";

export interface RejectedRecordSummary {
  field: CanonicalTelemetryField;
  reason: string;
  rows: number;
}

export interface LongRecordQualityResult {
  version: typeof LONG_RECORD_QUALITY_VERSION;
  records: CarScannerRecord[];
  rejectedRows: number;
  rejected: RejectedRecordSummary[];
}

type Range = readonly [minimum: number, maximum: number];

const VALID_RANGES: Partial<Record<CanonicalTelemetryField, Range>> = {
  speedKph: [0, 250],
  rpm: [0, 8_000],
  fuelRateLph: [0, 50],
  fuelUsedL: [0, Number.POSITIVE_INFINITY],
  distanceKm: [0, Number.POSITIVE_INFINITY],
  hvVoltageV: [250, 450],
  hvCurrentA: [-300, 300],
  socPct: [0, 100],
  engineTorquePct: [-100, 200],
  acceleratorPct: [0, 100],
  coolantTempC: [-40, 150],
};

export function applyLongRecordQuality(records: CarScannerRecord[]): LongRecordQualityResult {
  const accepted: CarScannerRecord[] = [];
  const rejected = new Map<string, RejectedRecordSummary>();
  for (const record of records) {
    const field = record.canonicalField;
    const range = field === undefined ? undefined : VALID_RANGES[field];
    if (field === undefined || range === undefined || (record.value >= range[0] && record.value <= range[1])) {
      accepted.push(record);
      continue;
    }
    const reason = `${field.toUpperCase()}_OUT_OF_RANGE`;
    const key = `${field}:${reason}`;
    const current = rejected.get(key);
    if (current) current.rows += 1;
    else rejected.set(key, { field, reason, rows: 1 });
  }
  const rejectedRows = records.length - accepted.length;
  return { version: LONG_RECORD_QUALITY_VERSION, records: accepted, rejectedRows, rejected: [...rejected.values()] };
}
