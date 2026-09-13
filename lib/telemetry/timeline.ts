import type { CanonicalTelemetryField } from "./catalog.ts";
import type { CarScannerRecord } from "./inventory.ts";

export const TIMELINE_CONTRACT_VERSION = "telemetry-timeline-v0.3.0";

export interface TimelineConfig {
  gridSeconds: number;
  discontinuitySeconds: number;
  defaultMaxAgeSeconds: number;
  maxAgeSeconds?: Partial<Record<CanonicalTelemetryField, number>>;
}

export interface AlignedSignal {
  value: number;
  units: string;
  observedAtSecond: number;
  ageSeconds: number;
}

export interface TimelineFrame {
  segmentId: string;
  second: number;
  signals: Partial<Record<CanonicalTelemetryField, AlignedSignal>>;
}

export interface ContinuitySegment {
  id: string;
  startSecond: number;
  endSecond: number;
  durationSeconds: number;
  recordCount: number;
  gapBeforeSeconds?: number;
}

export interface ReconstructedTimeline {
  contractVersion: typeof TIMELINE_CONTRACT_VERSION;
  config: TimelineConfig;
  segments: ContinuitySegment[];
  frames: TimelineFrame[];
  warnings: string[];
}

export const DEFAULT_TIMELINE_CONFIG: TimelineConfig = {
  gridSeconds: 1,
  discontinuitySeconds: 30,
  defaultMaxAgeSeconds: 2,
  maxAgeSeconds: { socPct: 5 },
};

interface IndexedSegment {
  segment: ContinuitySegment;
  records: CarScannerRecord[];
}

function validateConfig(config: TimelineConfig): void {
  if (!(config.gridSeconds > 0)) throw new Error("gridSeconds debe ser mayor que cero.");
  if (!(config.discontinuitySeconds > config.gridSeconds)) {
    throw new Error("discontinuitySeconds debe ser mayor que gridSeconds.");
  }
  if (!(config.defaultMaxAgeSeconds >= 0)) throw new Error("defaultMaxAgeSeconds no puede ser negativo.");
}

function splitByContinuity(records: CarScannerRecord[], discontinuitySeconds: number): IndexedSegment[] {
  const ordered = records
    .filter((record) => Number.isFinite(record.seconds))
    .sort((left, right) => left.seconds - right.seconds);
  if (ordered.length === 0) return [];

  const groups: CarScannerRecord[][] = [];
  let current: CarScannerRecord[] = [];
  let previousSecond: number | undefined;
  for (const record of ordered) {
    const gap = previousSecond === undefined ? undefined : record.seconds - previousSecond;
    if (gap !== undefined && gap > discontinuitySeconds && current.length > 0) {
      groups.push(current);
      current = [];
    }
    current.push(record);
    previousSecond = record.seconds;
  }
  groups.push(current);

  return groups.map((group, index) => {
    const startSecond = group[0].seconds;
    const endSecond = group.at(-1)?.seconds ?? startSecond;
    const previousEnd = index === 0 ? undefined : groups[index - 1].at(-1)?.seconds;
    return {
      records: group,
      segment: {
        id: `segment-${String(index + 1).padStart(3, "0")}`,
        startSecond,
        endSecond,
        durationSeconds: endSecond - startSecond,
        recordCount: group.length,
        gapBeforeSeconds: previousEnd === undefined ? undefined : startSecond - previousEnd,
      },
    };
  });
}

function frameTimes(segment: ContinuitySegment, gridSeconds: number): number[] {
  const times: number[] = [];
  for (let second = segment.startSecond; second <= segment.endSecond + Number.EPSILON; second += gridSeconds) {
    times.push(Number(second.toFixed(9)));
  }
  if (times.length === 0 || segment.endSecond - (times.at(-1) ?? segment.startSecond) > 1e-6) {
    times.push(segment.endSecond);
  }
  return times;
}

function reconstructSegment(indexed: IndexedSegment, config: TimelineConfig): TimelineFrame[] {
  const latest = new Map<CanonicalTelemetryField, CarScannerRecord>();
  const records = indexed.records.filter((record) => record.canonicalField !== undefined);
  const frames: TimelineFrame[] = [];
  let cursor = 0;
  for (const second of frameTimes(indexed.segment, config.gridSeconds)) {
    while (cursor < records.length && records[cursor].seconds <= second) {
      const record = records[cursor];
      if (record.canonicalField !== undefined) latest.set(record.canonicalField, record);
      cursor += 1;
    }
    const signals: TimelineFrame["signals"] = {};
    for (const [field, record] of latest) {
      const ageSeconds = second - record.seconds;
      const maxAge = config.maxAgeSeconds?.[field] ?? config.defaultMaxAgeSeconds;
      if (ageSeconds < -1e-9 || ageSeconds > maxAge) continue;
      signals[field] = { value: record.value, units: record.units, observedAtSecond: record.seconds, ageSeconds };
    }
    frames.push({ segmentId: indexed.segment.id, second, signals });
  }
  return frames;
}

export function reconstructTimeline(records: CarScannerRecord[], overrides: Partial<TimelineConfig> = {}): ReconstructedTimeline {
  const config: TimelineConfig = {
    ...DEFAULT_TIMELINE_CONFIG,
    ...overrides,
    maxAgeSeconds: { ...DEFAULT_TIMELINE_CONFIG.maxAgeSeconds, ...overrides.maxAgeSeconds },
  };
  validateConfig(config);
  const indexed = splitByContinuity(records, config.discontinuitySeconds);
  return {
    contractVersion: TIMELINE_CONTRACT_VERSION,
    config,
    segments: indexed.map(({ segment }) => segment),
    frames: indexed.flatMap((segment) => reconstructSegment(segment, config)),
    warnings: indexed.length > 1 ? ["ACQUISITION_DISCONTINUITIES_SPLIT"] : [],
  };
}
