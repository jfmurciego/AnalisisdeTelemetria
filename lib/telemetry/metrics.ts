import type { TelemetrySample } from "../domain/types.ts";

export interface EnergySummary {
  fuelLitres: number;
  batteryDischargeKwh: number;
  batteryChargeKwh: number;
  coveredSeconds: number;
}

export function electricPowerKw(sample: TelemetrySample): number | undefined {
  if (sample.hvVoltageV === undefined || sample.hvCurrentA === undefined) return undefined;
  return (sample.hvVoltageV * sample.hvCurrentA) / 1000;
}

export function integrateEnergy(samples: TelemetrySample[], maxGapSeconds = 3): EnergySummary {
  const result: EnergySummary = { fuelLitres: 0, batteryDischargeKwh: 0, batteryChargeKwh: 0, coveredSeconds: 0 };
  for (let i = 1; i < samples.length; i += 1) {
    const previous = samples[i - 1];
    const current = samples[i];
    const dt = current.seconds - previous.seconds;
    if (!(dt > 0 && dt <= maxGapSeconds)) continue;
    result.coveredSeconds += dt;
    if (previous.fuelRateLph !== undefined && current.fuelRateLph !== undefined) {
      result.fuelLitres += ((previous.fuelRateLph + current.fuelRateLph) / 2) * dt / 3600;
    }
    const p0 = electricPowerKw(previous);
    const p1 = electricPowerKw(current);
    if (p0 === undefined || p1 === undefined) continue;
    const energy = ((p0 + p1) / 2) * dt / 3600;
    if (energy >= 0) result.batteryDischargeKwh += energy;
    else result.batteryChargeKwh += Math.abs(energy);
  }
  return result;
}
