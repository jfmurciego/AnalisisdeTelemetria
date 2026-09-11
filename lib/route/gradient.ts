import type { RoutePoint } from "../domain/types.ts";

export function calculateWindowedGrade(points: RoutePoint[], windowM: number): RoutePoint[] {
  if (windowM < 100) throw new Error("La ventana de pendiente debe ser al menos de 100 m.");
  return points.map((point, index) => {
    let before = index;
    let after = index;
    while (before > 0 && point.distanceM - points[before].distanceM < windowM / 2) before -= 1;
    while (after < points.length - 1 && points[after].distanceM - point.distanceM < windowM / 2) after += 1;
    const distance = points[after].distanceM - points[before].distanceM;
    if (distance <= 0) return { ...point, gradePct: undefined };
    return { ...point, gradePct: ((points[after].elevationM - points[before].elevationM) / distance) * 100 };
  });
}
