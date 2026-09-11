import type { TelemetrySample } from "../domain/types.ts";

const PID_MAP: Record<string, keyof TelemetrySample> = {
  "vehicle speed": "speedKph",
  revoluciones: "rpm",
  "engine rpm": "rpm",
  "engine fuel rate": "fuelRateLph",
  "caudal combustible motor": "fuelRateLph",
  "altitude (gps)": "altitudeM",
  "hybrid/ev battery system voltage": "hvVoltageV",
  "hybrid/ev battery system current": "hvCurrentA",
  "hybrid/ev battery pack remaining charge": "socPct",
  "actual engine - percent torque": "engineTorquePct",
  "accelerator pedal position": "acceleratorPct",
};

function splitSemicolon(line: string): string[] {
  return line.split(";").map((cell) => cell.trim().replace(/^"|"$/g, ""));
}

export function parseCarScannerLongCsv(text: string): TelemetrySample[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitSemicolon(lines[0]).map((value) => value.toUpperCase());
  const index = Object.fromEntries(header.map((name, position) => [name, position]));
  if (index.SECONDS === undefined || index.PID === undefined || index.VALUE === undefined) {
    throw new Error("El CSV no contiene las columnas SECONDS, PID y VALUE.");
  }

  const buckets = new Map<number, TelemetrySample>();
  for (const line of lines.slice(1)) {
    const cells = splitSemicolon(line);
    const seconds = Number(cells[index.SECONDS]);
    const value = Number(cells[index.VALUE]);
    if (!Number.isFinite(seconds) || !Number.isFinite(value)) continue;
    const key = Math.round(seconds * 2) / 2;
    const sample = buckets.get(key) ?? { seconds: key, qualityFlags: [] };
    const field = PID_MAP[cells[index.PID]?.toLowerCase()];
    if (field) (sample as unknown as Record<string, number>)[field] = value;
    if (index.LATITUDE !== undefined) {
      const latitude = Number(cells[index.LATITUDE]);
      if (Number.isFinite(latitude)) sample.latitude = latitude;
    }
    const longitudeIndex = index.LONGITUDE ?? index.LONGTITUDE;
    if (longitudeIndex !== undefined) {
      const longitude = Number(cells[longitudeIndex]);
      if (Number.isFinite(longitude)) sample.longitude = longitude;
    }
    buckets.set(key, sample);
  }
  return [...buckets.values()].sort((a, b) => a.seconds - b.seconds);
}
