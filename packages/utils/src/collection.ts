export type CollectionType = "garbage" | "recycling" | "foodScraps";

export interface CollectionDays {
  garbageDays: boolean[];
  recyclingDays: boolean[];
  foodscrapsDays: boolean[];
}

export function getCollectsToday(
  days: CollectionDays,
  dayOfWeek: number,
): CollectionType[] {
  const types: CollectionType[] = [];
  if (days.garbageDays[dayOfWeek]) types.push("garbage");
  if (days.recyclingDays[dayOfWeek]) types.push("recycling");
  if (days.foodscrapsDays[dayOfWeek]) types.push("foodScraps");
  return types;
}
