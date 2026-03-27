import { mealTypeTone } from "@/lib/utils";

export function MealTypePill({ name }: { name?: string | null }) {
  if (!name) return null;

  return (
    <span className="meal-type-pill" data-tone={mealTypeTone(name)}>
      {name}
    </span>
  );
}
