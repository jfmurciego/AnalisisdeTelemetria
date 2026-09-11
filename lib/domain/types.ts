export type Provenance = "measured" | "derived" | "external";
export type Transmission = "automatic" | "manual";

export interface VehicleProfile {
  id: string;
  label: string;
  transmission: Transmission;
  fuel: "gasoline" | "diesel" | "phev" | "bev";
  referenceTorqueNm?: number;
}

export interface TelemetrySample {
  seconds: number;
  speedKph?: number;
  rpm?: number;
  fuelRateLph?: number;
  latitude?: number;
  longitude?: number;
  altitudeM?: number;
  hvVoltageV?: number;
  hvCurrentA?: number;
  socPct?: number;
  engineTorquePct?: number;
  acceleratorPct?: number;
  brakeActive?: boolean;
  qualityFlags: string[];
}

export interface RoutePoint {
  distanceM: number;
  latitude: number;
  longitude: number;
  elevationM: number;
  gradePct?: number;
}

export interface WaypointRecommendation {
  distanceM: number;
  latitude: number;
  longitude: number;
  action: "hold" | "reduce_speed" | "prepare_climb" | "downshift";
  targetSpeedKph?: number;
  targetGear?: number;
  evidence: string[];
  confidence: "insufficient" | "provisional" | "validated";
  modelVersion: string;
}
