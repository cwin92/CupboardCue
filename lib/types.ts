export type Id = string;

export type LookupOption = {
  id: Id;
  name: string;
  sort_order: number | null;
  user_id: Id | null;
};

export type Profile = {
  id: Id;
  email: string | null;
  full_name?: string | null;
};

export type Ingredient = {
  id: Id;
  menu_item_id: Id;
  name: string;
  quantity: number | null;
  unit_label: string | null;
  on_shopping_list: boolean;
  created_at: string;
};

export type MenuItem = {
  id: Id;
  name: string;
  image_url: string | null;
  recipes: string | null;
  notes: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  meal_type_id: Id | null;
  cooking_time_id: Id | null;
  meal_type: LookupOption | null;
  cooking_time: LookupOption | null;
  ingredients?: Ingredient[];
};

export type ShoppingIngredient = Ingredient & {
  menu_item: Pick<MenuItem, "id" | "name" | "image_url"> | null;
};

export type ShoppingListGroup = {
  key: string;
  name: string;
  quantity: number | null;
  unit_label: string | null;
  ingredient_ids: string[];
  source_menu_names: string[];
};

export type SearchableIngredientGroup = ShoppingListGroup & {
  on_shopping_list: boolean;
};

export type CalendarEntry = {
  id: Id;
  planned_date: string;
  menu_item_id: Id;
  menu_item: (Pick<MenuItem, "id" | "name" | "image_url"> & { meal_type?: LookupOption | null }) | null;
};

export type DraftIngredient = {
  name: string;
  quantity: number;
  unit_label: string;
};

export type PlannerDay = {
  date: Date;
  entries: CalendarEntry[];
};
