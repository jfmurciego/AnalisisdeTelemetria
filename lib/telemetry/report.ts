import type { CanonicalTelemetryField } from "./catalog.ts";
import type { CarScannerRecord, CapabilityStatus } from "./inventory.ts";
import type { ContinuitySegment, ReconstructedTimeline, TimelineFrame } from "./timeline.ts";

export const SEGMENT_REPORT_VERSION = "segment-report-v0.3.0";
export const METRIC_FORMULA_VERSION = "telemetry-metrics-v0.3.0";

export interface SignalCoverage {
  field: CanonicalTelemetryField;
  observations: number;
  firstSecond?: number;
  lastSecond?: number;
  medianIntervalSeconds?: number;
  maximumIntervalSeconds?: number;
  coveredSeconds: number;
  coverageRatio: number;
}

export interface DerivedMetric {
  status: CapabilityStatus;
  value?: number;
  unit: string;
  formulaId: string;
  formulaVersion: typeof METRIC_FORMULA_VERSION;
  inputs: CanonicalTelemetryField[];
  evidence: string[];
}

export interface SegmentReport {
  reportVersion: typeof SEGMENT_REPORT_VERSION;
  timelineContractVersion: string;
  segment: ContinuitySegment;
  coverage: SignalCoverage[];
  metrics: {
    distanceKm: DerivedMetric;
    fuelLitres: DerivedMetric;
    fuelConsumptionLPer100Km: DerivedMetric;
    batteryDischargeKwh: DerivedMetric;
    batteryChargeKwh: DerivedMetric;
  };
  warnings: string[];
}

const FIELD_LIST: CanonicalTelemetryField[] = [
  "speedKph", "rpm", "fuelRateLph", "fuelUsedL", "distanceKm", "hvVoltageV",
  "hvCurrentA", "socPct", "engineTorquePct", "acceleratorPct", "coolantTempC",
];

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 === 0 ? (ordered[middle - 1] + ordered[middle]) / 2 : ordered[middle];
}

function recordsForField(records: CarScannerRecord[], segment: ContinuitySegment, field: CanonicalTelemetryField): CarScannerRecord[] {
  return records
    .filter((record) => record.canonicalField === field && record.seconds >= segment.startSecond && record.seconds <= segment.endSecond)
    .sort((left, right) => left.seconds - right.seconds);
}

function signalCoverage(records: CarScannerRecord[], segment: ContinuitySegment, field: CanonicalTelemetryField, maximumGap: number): SignalCoverage {
  const observations = recordsForField(records, segment, field);
  const intervals: number[] = [];
  let coveredSeconds = 0;
  for (let index = 1; index < observations.length; index += 1) {
    const interval = observations[index].seconds - observations[index - 1].seconds;
    if (interval > 0) intervals.push(interval);
    if (interval > 0 && interval <= maximumGap) coveredSeconds += interval;
  }
  return {
    field,
    observations: observations.length,
    firstSecond: observations[0]?.seconds,
    lastSecond: observations.at(-1)?.seconds,
    medianIntervalSeconds: median(intervals),
    maximumIntervalSeconds: intervals.length > 0 ? Math.max(...intervals) : undefined,
    coveredSeconds,
    coverageRatio: segment.durationSeconds > 0 ? Math.min(coveredSeconds / segment.durationSeconds, 1) : Number(observations.length > 0),
  };
}

function metric(status: CapabilityStatus, unit: string, formulaId: string, inputs: CanonicalTelemetryField[], evidence: string[], value?: number): DerivedMetric {
  return { status, value, unit, formulaId, formulaVersion: METRIC_FORMULA_VERSION, inputs, evidence };
}

function accumulatorEndpointDelta(readings: CarScannerRecord[]): { value?: number; decreases: number } {
  if (readings.length < 2) return { decreases: 0 };
  let decreases = 0;
  for (let index = 1; index < readings.length; index += 1) {
    const gap = readings[index].seconds - readings[index - 1].seconds;
    if (!(gap > 0)) continue;
    const delta = readings[index].value - readings[index - 1].value;
    if (delta < 0) decreases += 1;
  }
  const first = readings[0];
  const last = readings.at(-1)!;
  const value = last.value - first.value;
  return { value: value >= 0 ? value : undefined, decreases };
}

function trapezoid(readings: CarScannerRecord[], maximumGap: number, convert: (average: number, seconds: number) => number): { value: number; coveredSeconds: number } {
  let value = 0;
  let coveredSeconds = 0;
  for (let index = 1; index < readings.length; index += 1) {
    const previous = readings[index - 1];
    const current = readings[index];
    const gap = current.seconds - previous.seconds;
    if (!(gap > 0 && gap <= maximumGap)) continue;
    value += convert((previous.value + current.value) / 2, gap);
    coveredSeconds += gap;
  }
  return { value, coveredSeconds };
}

function integrateHvFrames(frames: TimelineFrame[], maximumGap: number): { discharge: number; charge: number; coveredSeconds: number } {
  let discharge = 0;
  let charge = 0;
  let coveredSeconds = 0;
  for (let index = 1; index < frames.length; index += 1) {
    const previous = frames[index - 1];
    const current = frames[index];
    const gap = current.second - previous.second;
    if (!(gap > 0 && gap <= maximumGap)) continue;
    const values = [previous.signals.hvVoltageV?.value, previous.signals.hvCurrentA?.value, current.signals.hvVoltageV?.value, current.signals.hvCurrentA?.value];
    if (values.some((value) => value === undefined)) continue;
    const previousPowerKw = (values[0]! * values[1]!) / 1000;
    const currentPowerKw = (values[2]! * values[3]!) / 1000;
    const energyKwh = ((previousPowerKw + currentPowerKw) / 2) * gap / 3600;
    if (energyKwh >= 0) discharge += energyKwh;
    else charge += Math.abs(energyKwh);
    coveredSeconds += gap;
  }
  return { discharge, charge, coveredSeconds };
}

function hasCoverage(item: SignalCoverage | undefined): boolean {
  return item !== undefined && item.observations >= 2 && item.coverageRatio >= 0.8;
}

function reconciles(primary: number, independent: number, absoluteTolerance: number, relativeTolerance = 0.05): boolean {
  return Math.abs(primary - independent) <= Math.max(absoluteTolerance, Math.abs(primary) * relativeTolerance);
}

export function buildSegmentReports(records: CarScannerRecord[], timeline: ReconstructedTimeline, maximumGap = 3): SegmentReport[] {
  return timeline.segments.map((segment) => {
    const coverage = FIELD_LIST.map((field) => signalCoverage(records, segment, field, maximumGap));
    const byField = new Map(coverage.map((item) => [item.field, item]));
    const distanceAccumulator = accumulatorEndpointDelta(recordsForField(records, segment, "distanceKm"));
    const distanceFromSpeed = trapezoid(recordsForField(records, segment, "speedKph"), maximumGap, (average, seconds) => average * seconds / 3600);
    const distanceReconciles = distanceAccumulator.value !== undefined && hasCoverage(byField.get("speedKph"))
      ? reconciles(distanceAccumulator.value, distanceFromSpeed.value, 0.05)
      : undefined;
    const distance = hasCoverage(byField.get("distanceKm")) && distanceAccumulator.value !== undefined
      ? metric(distanceReconciles === false ? "provisional" : "available", "km", "distance-accumulator-endpoint-delta", ["distanceKm"], [`coverage=${byField.get("distanceKm")?.coverageRatio.toFixed(4)}`, `decreasing_steps_observed=${distanceAccumulator.decreases}`, `speed_integration_km=${distanceFromSpeed.value.toFixed(6)}`, `independent_reconciliation=${distanceReconciles ?? "unavailable"}`], distanceAccumulator.value)
      : hasCoverage(byField.get("speedKph"))
        ? metric("provisional", "km", "trapezoidal-speed-integration", ["speedKph"], [`coverage=${byField.get("speedKph")?.coverageRatio.toFixed(4)}`, `covered_seconds=${distanceFromSpeed.coveredSeconds.toFixed(3)}`], distanceFromSpeed.value)
        : metric("insufficient", "km", "distance-unavailable", ["distanceKm", "speedKph"], ["Insufficient continuous distance and speed coverage"]);

    const fuelAccumulator = accumulatorEndpointDelta(recordsForField(records, segment, "fuelUsedL"));
    const fuelFromRate = trapezoid(recordsForField(records, segment, "fuelRateLph"), maximumGap, (average, seconds) => average * seconds / 3600);
    const fuelReconciles = fuelAccumulator.value !== undefined && hasCoverage(byField.get("fuelRateLph"))
      ? reconciles(fuelAccumulator.value, fuelFromRate.value, 0.005)
      : undefined;
    const fuel = hasCoverage(byField.get("fuelUsedL")) && fuelAccumulator.value !== undefined
      ? metric(fuelReconciles === false ? "provisional" : "available", "L", "fuel-accumulator-endpoint-delta", ["fuelUsedL"], [`coverage=${byField.get("fuelUsedL")?.coverageRatio.toFixed(4)}`, `decreasing_steps_observed=${fuelAccumulator.decreases}`, `fuel_rate_integration_l=${fuelFromRate.value.toFixed(6)}`, `independent_reconciliation=${fuelReconciles ?? "unavailable"}`], fuelAccumulator.value)
      : hasCoverage(byField.get("fuelRateLph"))
        ? metric("provisional", "L", "trapezoidal-fuel-rate-integration", ["fuelRateLph"], [`coverage=${byField.get("fuelRateLph")?.coverageRatio.toFixed(4)}`, `covered_seconds=${fuelFromRate.coveredSeconds.toFixed(3)}`], fuelFromRate.value)
        : metric("insufficient", "L", "fuel-unavailable", ["fuelUsedL", "fuelRateLph"], ["Insufficient continuous fuel coverage"]);

    const consumption = fuel.value !== undefined && distance.value !== undefined && distance.value > 0
      ? metric(fuel.status === "available" && distance.status === "available" ? "available" : "provisional", "L/100km", "fuel-litres-divided-by-distance-times-100", [...fuel.inputs, ...distance.inputs], [`fuel_litres=${fuel.value.toFixed(6)}`, `distance_km=${distance.value.toFixed(6)}`], fuel.value / distance.value * 100)
      : metric("insufficient", "L/100km", "fuel-consumption-unavailable", ["fuelUsedL", "distanceKm"], ["Fuel and positive distance are required"]);

    const segmentFrames = timeline.frames.filter((frame) => frame.segmentId === segment.id);
    const hv = integrateHvFrames(segmentFrames, Math.max(timeline.config.gridSeconds * 1.5, maximumGap));
    const hvCoverageRatio = segment.durationSeconds > 0 ? hv.coveredSeconds / segment.durationSeconds : 0;
    const hvStatus: CapabilityStatus = hvCoverageRatio >= 0.8 ? "provisional" : "insufficient";
    const hvEvidence = [`simultaneous_covered_seconds=${hv.coveredSeconds.toFixed(3)}`, `segment_coverage=${hvCoverageRatio.toFixed(4)}`, "Current sign convention requires vehicle-specific calibration"];
    const discharge = metric(hvStatus, "kWh", "trapezoidal-voltage-current-integration-positive", ["hvVoltageV", "hvCurrentA"], hvEvidence, hvStatus === "insufficient" ? undefined : hv.discharge);
    const charge = metric(hvStatus, "kWh", "trapezoidal-voltage-current-integration-negative", ["hvVoltageV", "hvCurrentA"], hvEvidence, hvStatus === "insufficient" ? undefined : hv.charge);
    const warnings: string[] = [];
    if (distance.status === "insufficient") warnings.push("DISTANCE_INSUFFICIENT");
    if (fuel.status === "insufficient") warnings.push("FUEL_INSUFFICIENT");
    if (distanceAccumulator.decreases > 0) warnings.push("DISTANCE_ACCUMULATOR_NON_MONOTONIC");
    if (fuelAccumulator.decreases > 0) warnings.push("FUEL_ACCUMULATOR_NON_MONOTONIC");
    if (distanceReconciles === false) warnings.push("DISTANCE_RECONCILIATION_FAILED");
    if (fuelReconciles === false) warnings.push("FUEL_RECONCILIATION_FAILED");
    if (hvStatus === "insufficient") warnings.push("HV_ENERGY_INSUFFICIENT");
    if (segment.gapBeforeSeconds !== undefined) warnings.push("SEGMENT_AFTER_ACQUISITION_GAP");
    return { reportVersion: SEGMENT_REPORT_VERSION, timelineContractVersion: timeline.contractVersion, segment, coverage, metrics: { distanceKm: distance, fuelLitres: fuel, fuelConsumptionLPer100Km: consumption, batteryDischargeKwh: discharge, batteryChargeKwh: charge }, warnings };
  });
}
