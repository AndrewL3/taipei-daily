import type { ParkingRoadSegment } from "../api/types";

export function getAvailabilityColor(segment: ParkingRoadSegment): string {
  if (segment.totalSpaces === 0) return "#9ca3af"; // gray
  const ratio = segment.availableSpaces / segment.totalSpaces;
  if (ratio >= 0.5) return "#22c55e"; // green
  if (ratio >= 0.1) return "#f59e0b"; // amber
  return "#ef4444"; // red
}
