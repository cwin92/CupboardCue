import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  formatISO,
  isValid,
  startOfMonth,
  startOfWeek
} from "date-fns";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type {
  CalendarEntry,
  LookupOption,
  MenuItem,
  PlannerDay,
  Profile,
  SearchableIngredientGroup,
  ShoppingIngredient,
  ShoppingListGroup
} from "@/lib/types";
import { sortMealTypes, sortMenuItemsByMealType } from "@/lib/utils";

const itemSelect = `
  id,
  name,
  image_url,
  recipes,
  notes,
  is_current,
  created_at,
  updated_at,
  meal_type_id,
  cooking_time_id,
  meal_type:meal_types(id, name, sort_order, user_id),
  cooking_time:cooking_times(id, name, sort_order, user_id)
`;

export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
});

export async function getLookupOptions() {
  const user = await getSessionUser();
  if (!user) return { mealTypes: [] as LookupOption[], cookingTimes: [] as LookupOption[], ingredientUnits: [] as LookupOption[] };

  const supabase = await createClient();
  const [mealTypesResponse, cookingTimesResponse, ingredientUnitsResponse] = await Promise.all([
    supabase
      .from("meal_types")
      .select("id, name, sort_order, user_id")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("cooking_times")
      .select("id, name, sort_order, user_id")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("ingredient_units")
      .select("id, name, sort_order, user_id")
      .or(`user_id.is.null,user_id.eq.${user.id}`)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
  ]);

  return {
    mealTypes: sortMealTypes((mealTypesResponse.data ?? []) as LookupOption[]),
    cookingTimes: (cookingTimesResponse.data ?? []) as LookupOption[],
    ingredientUnits: (ingredientUnitsResponse.data ?? []) as LookupOption[]
  };
}

export async function getCurrentMenu(filterMealTypeId?: string, search?: string) {
  const user = await getSessionUser();
  if (!user) return [] as MenuItem[];

  const supabase = await createClient();
  let query = supabase
    .from("menu_items")
    .select(`${itemSelect}, ingredients(id, menu_item_id, name, quantity, unit_label, on_shopping_list, created_at)`)
    .eq("user_id", user.id)
    .eq("is_current", true)
    .order("updated_at", { ascending: false });

  if (filterMealTypeId) query = query.eq("meal_type_id", filterMealTypeId);
  if (search) query = query.ilike("name", `%${search}%`);

  const { data } = await query;
  return sortMenuItemsByMealType((data ?? []) as unknown as MenuItem[]);
}

export async function getLibrary(search?: string) {
  const user = await getSessionUser();
  if (!user) return [] as MenuItem[];

  const supabase = await createClient();
  let query = supabase
    .from("menu_items")
    .select(itemSelect)
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  if (search) query = query.ilike("name", `%${search}%`);

  const { data } = await query;
  return sortMenuItemsByMealType((data ?? []) as unknown as MenuItem[]);
}

export async function getMenuItemsForSelect(currentOnly = false) {
  const user = await getSessionUser();
  if (!user) return [] as MenuItem[];

  const supabase = await createClient();
  let query = supabase
    .from("menu_items")
    .select("id, name, image_url, is_current, created_at, updated_at, meal_type_id, cooking_time_id")
    .eq("user_id", user.id);

  if (currentOnly) query = query.eq("is_current", true);

  const { data } = await query.order("name", { ascending: true });

  return sortMenuItemsByMealType((data ?? []) as unknown as MenuItem[]);
}

export async function getMenuItem(id: string) {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_items")
    .select(
      `${itemSelect},
      ingredients(id, menu_item_id, name, quantity, unit_label, on_shopping_list, created_at)
    `
    )
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  return data as unknown as MenuItem | null;
}

export async function getShoppingList(search?: string) {
  const user = await getSessionUser();
  if (!user) return [] as ShoppingListGroup[];

  const supabase = await createClient();
  const query = supabase
    .from("ingredients")
    .select("id, menu_item_id, name, quantity, unit_label, on_shopping_list, created_at, menu_item:menu_items(id, name, image_url)")
    .eq("user_id", user.id)
    .eq("on_shopping_list", true)
    .order("name", { ascending: true });

  const { data } = await query;
  const grouped = groupIngredientRows((data ?? []) as unknown as ShoppingIngredient[])
    .filter((item) => item.on_shopping_list)
    .sort((a, b) => a.name.localeCompare(b.name));
  if (!search) return grouped;

  const normalized = search.toLowerCase();
  return grouped.filter(
    (item) =>
      item.name.toLowerCase().includes(normalized) ||
      item.key.toLowerCase().includes(normalized) ||
      item.source_menu_names.some((name) => name.toLowerCase().includes(normalized))
  );
}

export async function getShoppingCatalog() {
  const user = await getSessionUser();
  if (!user) return [] as SearchableIngredientGroup[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredients")
    .select("id, menu_item_id, name, quantity, unit_label, on_shopping_list, created_at, menu_item:menu_items(id, name, image_url)")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return groupIngredientRows((data ?? []) as unknown as ShoppingIngredient[]).sort((a, b) => a.name.localeCompare(b.name));
}

function groupIngredientRows(items: ShoppingIngredient[]) {
  const groups = new Map<string, SearchableIngredientGroup>();

  for (const item of items) {
    const key = `${item.name.trim().toLowerCase()}::${(item.unit_label || "unit").trim().toLowerCase()}`;
    const quantity = item.quantity ?? 1;

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        name: item.name,
        quantity,
        unit_label: item.unit_label || "unit",
        ingredient_ids: [item.id],
        source_menu_names: item.menu_item?.name ? [item.menu_item.name] : [],
        on_shopping_list: item.on_shopping_list
      });
      continue;
    }

    const existing = groups.get(key)!;
    existing.quantity = (existing.quantity ?? 0) + quantity;
    existing.ingredient_ids.push(item.id);
    existing.on_shopping_list = existing.on_shopping_list || item.on_shopping_list;
    if (item.menu_item?.name && !existing.source_menu_names.includes(item.menu_item.name)) {
      existing.source_menu_names.push(item.menu_item.name);
    }
  }

  return Array.from(groups.values());
}

export async function getIngredientSuggestions() {
  const user = await getSessionUser();
  if (!user) return [] as string[];

  const supabase = await createClient();
  const { data } = await supabase
    .from("ingredients")
    .select("name, unit_label")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return Array.from(new Set((data ?? []).map((row) => row.name.trim()).filter(Boolean)));
}

export async function getProfile() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, email, full_name").eq("id", user.id).maybeSingle();
  const profile = data as Profile | null;

  return {
    id: user.id,
    email: profile?.email || user.email || null,
    full_name: profile?.full_name || (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null)
  } as Profile;
}

export async function getPlannerData(mode: "week" | "month", focusDateInput?: string) {
  const user = await getSessionUser();
  if (!user) return { days: [] as PlannerDay[], focusDate: new Date() };

  const requestedDate = focusDateInput ? new Date(focusDateInput) : new Date();
  const focusDate = isValid(requestedDate) ? requestedDate : new Date();
  const rangeStart =
    mode === "week" ? startOfWeek(focusDate, { weekStartsOn: 1 }) : startOfWeek(startOfMonth(focusDate), { weekStartsOn: 1 });
  const rangeEnd =
    mode === "week"
      ? endOfWeek(focusDate, { weekStartsOn: 1 })
      : endOfWeek(endOfMonth(focusDate), { weekStartsOn: 1 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_entries")
    .select("id, planned_date, menu_item_id, menu_item:menu_items(id, name, image_url, meal_type:meal_types(id, name))")
    .eq("user_id", user.id)
    .gte("planned_date", formatISO(rangeStart, { representation: "date" }))
    .lte("planned_date", formatISO(rangeEnd, { representation: "date" }))
    .order("planned_date", { ascending: true });

  const entries = (data ?? []) as unknown as CalendarEntry[];
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((date) => {
    const iso = formatISO(date, { representation: "date" });
    return {
      date,
      entries: entries.filter((entry) => entry.planned_date === iso)
    };
  });

  return { days, focusDate, nextDate: addDays(focusDate, mode === "week" ? 7 : 31), prevDate: addDays(focusDate, mode === "week" ? -7 : -31) };
}

export async function getUpcomingCalendarDatesForItem(menuItemId: string) {
  const user = await getSessionUser();
  if (!user) return [] as string[];

  const today = new Date().toISOString().slice(0, 10);
  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_entries")
    .select("planned_date")
    .eq("user_id", user.id)
    .eq("menu_item_id", menuItemId)
    .gte("planned_date", today)
    .order("planned_date", { ascending: true });

  return (data ?? []).map((entry) => entry.planned_date as string);
}
