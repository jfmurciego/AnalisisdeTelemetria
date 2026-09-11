import type { RoutePoint, VehicleProfile, WaypointRecommendation } from "../domain/types.ts";

export const RECOMMENDATION_MODEL_VERSION = "0.1.0";

export function recommendWaypoints(route: RoutePoint[], vehicle: VehicleProfile, efficientSpeedKph = 115): WaypointRecommendation[] {
  return route
    .filter((point) => point.gradePct !== undefined && point.gradePct >= 2.5)
    .filter((point, index, selected) => index === 0 || point.distanceM - selected[index - 1].distanceM >= 1000)
    .map((point) => ({
      distanceM: point.distanceM,
      latitude: point.latitude,
      longitude: point.longitude,
      action: vehicle.transmission === "manual" ? "downshift" : "prepare_climb",
      targetSpeedKph: efficientSpeedKph,
      evidence: [`Pendiente suavizada: ${point.gradePct?.toFixed(1)} %`, "Umbral provisional: 2,5 %"],
      confidence: "provisional",
      modelVersion: RECOMMENDATION_MODEL_VERSION,
    }));
}
