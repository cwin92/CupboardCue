"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { LookupOption } from "@/lib/types";
import { sortMealTypes } from "@/lib/utils";

export function MealTypeFilter({ options }: { options: LookupOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeValue = searchParams.get("mealType") ?? "";

  const orderedOptions = useMemo(() => {
    const labelMap = new Map<string, string>([["Drink", "Drinks"]]);

    return sortMealTypes(options).map((option) => ({
      ...option,
      displayName: labelMap.get(option.name) || option.name
    }));
  }, [options]);

  function updateFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("mealType", value);
    } else {
      params.delete("mealType");
    }
    router.replace(`/app${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="meal-filter-strip" role="tablist" aria-label="Filter current menu by meal type">
      <button
        type="button"
        className={activeValue ? "meal-filter-chip" : "meal-filter-chip active"}
        onClick={() => updateFilter("")}
        aria-pressed={!activeValue}
      >
        All
      </button>
      {orderedOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          className={activeValue === option.id ? "meal-filter-chip active" : "meal-filter-chip"}
          onClick={() => updateFilter(option.id)}
          aria-pressed={activeValue === option.id}
        >
          {option.displayName}
        </button>
      ))}
    </div>
  );
}
