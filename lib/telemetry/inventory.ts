import { KIA_PID_CATALOG_VERSION, resolvePid, type CanonicalTelemetryField, type SignalSource } from "./catalog.ts";

export interface CarScannerRecord {
  seconds: number;
  pid: string;
  value: number;
  units: string;
  canonicalField?: CanonicalTelemetryField;
  source?: SignalSource;
  unitMatchesCatalog?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface PidInventory {
  pid: string;
  canonicalField?: CanonicalTelemetryField;
  rows: number;
  units: string[];
  minimum: number;
  maximum: number;
  firstSecond: number;
  lastSecond: number;
  unitMismatchRows: number;
}

export type CapabilityStatus = "available" | "provisional" | "insufficient";

export interface TelemetryCapability {
  status: CapabilityStatus;
  evidence: string[];
}

export interface TelemetryInventory {
  contractVersion: "carscanner-long-v0.2.0";
  catalogVersion: string;
  rowCount: number;
  validNumericRows: number;
  invalidRows: number;
  startSecond?: number;
  endSecond?: number;
  pidCount: number;
  pids: PidInventory[];
  capabilities: {
    speed: TelemetryCapability;
    gasoline: TelemetryCapability;
    hvEnergy: TelemetryCapability;
    regeneration: TelemetryCapability;
    gpsRoute: TelemetryCapability;
  };
  warnings: string[];
}

function* parseSemicolonRows(text: string): Generator<string[]> {
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ";" && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some((value) => value !== "")) yield row;
      row = [];
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.trim());
    if (row.some((value) => value !== "")) yield row;
  }
}

function finiteNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function headerIndex(headers: string[]): Record<string, number> {
  return Object.fromEntries(headers.map((header, index) => [header.trim().toUpperCase(), index]));
}

export function parseCarScannerLongRecords(text: string): CarScannerRecord[] {
  const records: CarScannerRecord[] = [];
  scanCarScannerLongCsv(text, (record) => records.push(record));
  return records;
}

function scanCarScannerLongCsv(text: string, onRecord: (record: CarScannerRecord) => void): { rowCount: number; validRows: number; invalidRows: number } {
  const rows = parseSemicolonRows(text);
  const header = rows.next();
  const index = headerIndex(header.done ? [] : header.value);
  if (index.SECONDS === undefined || index.PID === undefined || index.VALUE === undefined) {
    throw new Error("El CSV no contiene las columnas SECONDS, PID y VALUE.");
  }
  const longitudeIndex = index.LONGITUDE ?? index.LONGTITUDE;
  let rowCount = 0;
  let validRows = 0;

  for (const row of rows) {
    rowCount += 1;
    const seconds = finiteNumber(row[index.SECONDS]);
    const value = finiteNumber(row[index.VALUE]);
    const pid = row[index.PID]?.trim();
    if (seconds === undefined || value === undefined || !pid) continue;
    const definition = resolvePid(pid);
    const units = row[index.UNITS]?.trim() ?? "";
    validRows += 1;
    onRecord({
      seconds,
      pid,
      value,
      units,
      canonicalField: definition?.canonicalField,
      source: definition?.source,
      unitMatchesCatalog: definition ? definition.expectedUnits.includes(units) : undefined,
      latitude: index.LATITUDE === undefined ? undefined : finiteNumber(row[index.LATITUDE]),
      longitude: longitudeIndex === undefined ? undefined : finiteNumber(row[longitudeIndex]),
    });
  }
  return { rowCount, validRows, invalidRows: rowCount - validRows };
}

function capability(status: CapabilityStatus, ...evidence: string[]): TelemetryCapability {
  return { status, evidence };
}

export function inspectCarScannerLongCsv(text: string): TelemetryInventory {
  const groups = new Map<string, PidInventory & { unitSet: Set<string> }>();
  const fieldCounts = new Map<CanonicalTelemetryField, number>();
  let coordinateRows = 0;
  let startSecond: number | undefined;
  let endSecond: number | undefined;
  const scan = scanCarScannerLongCsv(text, (record) => {
    startSecond = startSecond === undefined ? record.seconds : Math.min(startSecond, record.seconds);
    endSecond = endSecond === undefined ? record.seconds : Math.max(endSecond, record.seconds);
    if (record.canonicalField) fieldCounts.set(record.canonicalField, (fieldCounts.get(record.canonicalField) ?? 0) + 1);
    if (record.latitude !== undefined && record.longitude !== undefined) coordinateRows += 1;
    const current = groups.get(record.pid);
    if (current) {
      current.rows += 1;
      current.minimum = Math.min(current.minimum, record.value);
      current.maximum = Math.max(current.maximum, record.value);
      current.firstSecond = Math.min(current.firstSecond, record.seconds);
      current.lastSecond = Math.max(current.lastSecond, record.seconds);
      current.unitSet.add(record.units);
      current.unitMismatchRows += Number(record.unitMatchesCatalog === false);
    } else {
      groups.set(record.pid, {
        pid: record.pid,
        canonicalField: record.canonicalField,
        rows: 1,
        units: [],
        unitSet: new Set([record.units]),
        minimum: record.value,
        maximum: record.value,
        firstSecond: record.seconds,
        lastSecond: record.seconds,
        unitMismatchRows: Number(record.unitMatchesCatalog === false),
      });
    }
  });
  const pids = [...groups.values()].map(({ unitSet, ...pid }) => ({ ...pid, units: [...unitSet].sort() })).sort((a, b) => a.pid.localeCompare(b.pid));
  const count = (field: CanonicalTelemetryField) => fieldCounts.get(field) ?? 0;
  const speedCount = count("speedKph");
  const fuelAccumulatorCount = count("fuelUsedL");
  const fuelRateCount = count("fuelRateLph");
  const voltageCount = count("hvVoltageV");
  const currentCount = count("hvCurrentA");
  const warnings: string[] = [];
  if (voltageCount < 2 || currentCount < 2) warnings.push("HV_SIGNAL_COVERAGE_INSUFFICIENT");
  if (coordinateRows < 2) warnings.push("GPS_COORDINATES_MISSING");
  if (pids.some((pid) => pid.unitMismatchRows > 0)) warnings.push("PID_UNIT_MISMATCH");

  const gasoline = fuelAccumulatorCount >= 2
    ? capability("available", "Fuel used accumulator has at least two observations")
    : fuelRateCount >= 2
      ? capability("provisional", "Engine fuel rate can be integrated with gap controls")
      : capability("insufficient", "Neither Fuel used nor Engine fuel rate has sufficient observations");
  const hvStatus: CapabilityStatus = voltageCount >= 2 && currentCount >= 2 ? "provisional" : "insufficient";
  const hvEvidence = hvStatus === "provisional"
    ? ["HV voltage and current are present; sign convention still requires calibration"]
    : [`HV voltage observations: ${voltageCount}`, `HV current observations: ${currentCount}`];

  return {
    contractVersion: "carscanner-long-v0.2.0",
    catalogVersion: KIA_PID_CATALOG_VERSION,
    rowCount: scan.rowCount,
    validNumericRows: scan.validRows,
    invalidRows: scan.invalidRows,
    startSecond,
    endSecond,
    pidCount: pids.length,
    pids,
    capabilities: {
      speed: speedCount >= 2 ? capability("available", `${speedCount} speed observations`) : capability("insufficient", `${speedCount} speed observations`),
      gasoline,
      hvEnergy: capability(hvStatus, ...hvEvidence),
      regeneration: capability(hvStatus, ...hvEvidence),
      gpsRoute: coordinateRows >= 2 ? capability("available", `${coordinateRows} georeferenced observations`) : capability("insufficient", "No continuous GPS coordinates in the CSV"),
    },
    warnings,
  };
}
