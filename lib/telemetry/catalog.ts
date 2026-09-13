export type CanonicalTelemetryField =
  | "speedKph"
  | "rpm"
  | "fuelRateLph"
  | "fuelUsedL"
  | "distanceKm"
  | "hvVoltageV"
  | "hvCurrentA"
  | "socPct"
  | "engineTorquePct"
  | "acceleratorPct"
  | "coolantTempC";

export type SignalSource = "measured" | "application-derived";

export interface PidDefinition {
  canonicalField: CanonicalTelemetryField;
  canonicalPid: string;
  aliases: string[];
  expectedUnits: string[];
  source: SignalSource;
}

export const KIA_PID_CATALOG_VERSION = "0.3.0";

export const KIA_PID_CATALOG: PidDefinition[] = [
  { canonicalField: "speedKph", canonicalPid: "Vehicle speed", aliases: [], expectedUnits: ["km/h"], source: "measured" },
  { canonicalField: "rpm", canonicalPid: "Engine RPM", aliases: ["Revoluciones"], expectedUnits: ["rpm"], source: "measured" },
  { canonicalField: "fuelRateLph", canonicalPid: "Engine fuel rate", aliases: ["Caudal combustible motor", "Calculated instant fuel rate"], expectedUnits: ["L/h"], source: "measured" },
  { canonicalField: "fuelUsedL", canonicalPid: "Fuel used", aliases: [], expectedUnits: ["L"], source: "application-derived" },
  { canonicalField: "distanceKm", canonicalPid: "Distance travelled", aliases: [], expectedUnits: ["km"], source: "application-derived" },
  { canonicalField: "hvVoltageV", canonicalPid: "Hybrid/EV Battery System Voltage", aliases: [], expectedUnits: ["V"], source: "measured" },
  { canonicalField: "hvCurrentA", canonicalPid: "Hybrid/EV Battery System Current", aliases: [], expectedUnits: ["A"], source: "measured" },
  { canonicalField: "socPct", canonicalPid: "Hybrid/EV Battery Pack Remaining Charge", aliases: ["BMS State of Charge", "SOC BMS"], expectedUnits: ["%"], source: "measured" },
  { canonicalField: "engineTorquePct", canonicalPid: "Actual engine - percent torque", aliases: [], expectedUnits: ["%"], source: "measured" },
  { canonicalField: "acceleratorPct", canonicalPid: "Accelerator pedal position", aliases: ["Throttle position"], expectedUnits: ["%"], source: "measured" },
  { canonicalField: "coolantTempC", canonicalPid: "Engine coolant temperature", aliases: [], expectedUnits: ["℃", "°C"], source: "measured" },
];

const normalizedCatalog = new Map(
  KIA_PID_CATALOG.flatMap((definition) =>
    [definition.canonicalPid, ...definition.aliases].map((name) => [normalizePid(name), definition] as const),
  ),
);

export function normalizePid(pid: string): string {
  return pid.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function resolvePid(pid: string): PidDefinition | undefined {
  return normalizedCatalog.get(normalizePid(pid));
}
