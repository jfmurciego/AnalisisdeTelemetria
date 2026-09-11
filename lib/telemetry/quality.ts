import type { TelemetrySample } from "../domain/types.ts";

export const QUALITY_RULESET_VERSION = "0.1.0";

export function applyQualityRules(samples: TelemetrySample[]): TelemetrySample[] {
  return samples.map((source) => {
    const sample = { ...source, qualityFlags: [...source.qualityFlags] };
    if (sample.fuelRateLph !== undefined && sample.fuelRateLph > 50) {
      sample.qualityFlags.push("FUEL_RATE_IMPOSSIBLE");
      sample.fuelRateLph = undefined;
    }
    if (sample.speedKph !== undefined && (sample.speedKph < 0 || sample.speedKph > 250)) {
      sample.qualityFlags.push("SPEED_OUT_OF_RANGE");
      sample.speedKph = undefined;
    }
    if (sample.hvVoltageV !== undefined && (sample.hvVoltageV < 250 || sample.hvVoltageV > 450)) {
      sample.qualityFlags.push("HV_VOLTAGE_OUT_OF_RANGE");
      sample.hvVoltageV = undefined;
    }
    return sample;
  });
}
