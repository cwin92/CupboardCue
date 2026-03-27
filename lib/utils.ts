import { format } from "date-fns";

import type { LookupOption, MenuItem } from "@/lib/types";

export const APP_NAME = "CupboardCue";
export const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80";
export const FIXED_MEAL_TYPE_ORDER = ["Drink", "Snack", "Breakfast", "Lunch", "Dinner", "Dessert"] as const;

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatShortDate(value: Date | string) {
  return format(new Date(value), "EEE, MMM d");
}

export function formatMonthLabel(value: Date | string) {
  return format(new Date(value), "MMMM yyyy");
}

export function truncate(value: string, length = 18) {
  if (value.length <= length) return value;
  return `${value.slice(0, length - 1)}…`;
}

export function mealTypeRank(name?: string | null) {
  const index = FIXED_MEAL_TYPE_ORDER.findIndex((entry) => entry.toLowerCase() === (name || "").toLowerCase());
  return index === -1 ? FIXED_MEAL_TYPE_ORDER.length + 1 : index;
}

export function sortMealTypes(options: LookupOption[]) {
  return [...options].sort((a, b) => {
    const rankDiff = mealTypeRank(a.name) - mealTypeRank(b.name);
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name);
  });
}

export function sortMenuItemsByMealType(items: MenuItem[]) {
  return [...items].sort((a, b) => {
    const rankDiff = mealTypeRank(a.meal_type?.name) - mealTypeRank(b.meal_type?.name);
    if (rankDiff !== 0) return rankDiff;
    return a.name.localeCompare(b.name);
  });
}

export function groupMenuItems(items: MenuItem[]) {
  const grouped = new Map<string, MenuItem[]>();

  sortMenuItemsByMealType(items).forEach((item) => {
    const key = item.meal_type?.name || "Other";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push(item);
  });

  return Array.from(grouped.entries()).sort(([a], [b]) => mealTypeRank(a) - mealTypeRank(b));
}

export function mealTypeTone(name?: string | null) {
  switch ((name || "").toLowerCase()) {
    case "drink":
      return "drink";
    case "snack":
      return "snack";
    case "breakfast":
      return "breakfast";
    case "lunch":
      return "lunch";
    case "dinner":
      return "dinner";
    case "dessert":
      return "dessert";
    default:
      return "default";
  }
}
