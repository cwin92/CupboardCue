"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { DraftIngredient } from "@/lib/types";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const itemSchema = z.object({
  name: z.string().min(1, "Name is required."),
  meal_type_id: z.string().optional(),
  cooking_time_id: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  recipes: z.string().optional(),
  notes: z.string().optional(),
  is_current: z.boolean()
});

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

async function getImageValue(formData: FormData) {
  const file = formData.get("image_file");
  if (file instanceof File && file.size > 0) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
  }

  const directUrl = formData.get("image_url")?.toString() || "";
  if (directUrl) return directUrl;

  return formData.get("existing_image_url")?.toString() || "";
}

async function resolveLookupId(
  table: "meal_types" | "cooking_times" | "ingredient_units",
  selectedId: string | undefined,
  customName: string | null,
  userId: string
) {
  const supabase = await createClient();
  if (customName && customName.trim()) {
    const { data, error } = await supabase
      .from(table)
      .insert({
        user_id: userId,
        name: customName.trim(),
        sort_order: 999
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  if (selectedId === "__custom__") return null;
  return selectedId || null;
}

async function saveDraftIngredients(itemId: string, userId: string, rawDrafts: string | null) {
  if (!rawDrafts) return;

  let drafts: DraftIngredient[] = [];
  try {
    drafts = JSON.parse(rawDrafts) as DraftIngredient[];
  } catch {
    return;
  }

  const cleaned = drafts
    .map((draft) => ({
      name: draft.name?.trim(),
      quantity: Number(draft.quantity) || 1,
      unit_label: draft.unit_label?.trim() || "unit"
    }))
    .filter((draft) => draft.name);

  if (!cleaned.length) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("ingredients")
    .select("name")
    .eq("user_id", userId)
    .eq("menu_item_id", itemId);

  const existingNames = new Set((existing ?? []).map((entry) => entry.name.trim().toLowerCase()));
  const inserts = cleaned.filter((draft) => !existingNames.has(draft.name!.toLowerCase()));

  if (!inserts.length) return;

  const { error } = await supabase.from("ingredients").insert(
    inserts.map((draft) => ({
      user_id: userId,
      menu_item_id: itemId,
      name: draft.name,
      quantity: draft.quantity > 0 ? draft.quantity : 1,
      unit_label: draft.unit_label,
      on_shopping_list: false
    }))
  );

  if (error) throw error;
}

export async function signInAction(formData: FormData) {
  const supabase = await createClient();
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/login?error=Please+enter+a+valid+email+and+password.");
  }

  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app");
}

export async function signUpAction(formData: FormData) {
  const supabase = await createClient();
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    redirect("/signup?error=Please+use+a+valid+email+and+password+with+6%2B+characters.");
  }

  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/app");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function saveMenuItemAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const itemId = formData.get("item_id")?.toString();
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    meal_type_id: formData.get("meal_type_id")?.toString() || undefined,
    cooking_time_id: formData.get("cooking_time_id")?.toString() || undefined,
    image_url: await getImageValue(formData),
    recipes: formData.get("recipes")?.toString() || "",
    notes: formData.get("notes")?.toString() || "",
    is_current: formData.get("is_current") === "on"
  });

  if (!parsed.success) {
    const target = itemId ? `/app/items/${itemId}/edit` : "/app/items/new";
    redirect(`${target}?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Unable to save item.")}`);
  }

  const mealTypeId = await resolveLookupId(
    "meal_types",
    parsed.data.meal_type_id,
    formData.get("custom_meal_type")?.toString() ?? null,
    user.id
  );
  const cookingTimeId = await resolveLookupId(
    "cooking_times",
    parsed.data.cooking_time_id,
    formData.get("custom_cooking_time")?.toString() ?? null,
    user.id
  );

  const payload = {
    user_id: user.id,
    name: parsed.data.name.trim(),
    meal_type_id: mealTypeId,
    cooking_time_id: cookingTimeId,
    image_url: parsed.data.image_url || null,
    recipes: parsed.data.recipes || null,
    notes: parsed.data.notes || null,
    is_current: parsed.data.is_current
  };

  if (itemId) {
    const { error } = await supabase.from("menu_items").update(payload).eq("id", itemId).eq("user_id", user.id);
    if (error) {
      redirect(`/app/items/${itemId}/edit?error=${encodeURIComponent(getErrorMessage(error, "Unable to save changes."))}`);
    }

    await saveDraftIngredients(itemId, user.id, formData.get("draft_ingredients")?.toString() ?? null);
    revalidatePath(`/app/items/${itemId}`);
    revalidatePath(`/app/items/${itemId}/edit`);
    revalidatePath("/app");
    revalidatePath("/app/library");
    revalidatePath("/app/planner");
    revalidatePath("/app/shopping-list");
    redirect(`/app/items/${itemId}`);
  }

  const { data, error } = await supabase.from("menu_items").insert(payload).select("id").single();
  if (error) {
    redirect(`/app/items/new?error=${encodeURIComponent(error.message)}`);
  }

  await saveDraftIngredients(data.id, user.id, formData.get("draft_ingredients")?.toString() ?? null);
  revalidatePath("/app");
  revalidatePath("/app/library");
  revalidatePath("/app/planner");
  revalidatePath("/app/shopping-list");
  redirect(`/app/items/${data.id}`);
}

export async function removeFromCurrentAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const itemId = formData.get("item_id")?.toString();
  const redirectTo = formData.get("redirect_to")?.toString() || "/app";

  if (!user || !itemId) redirect("/app");

  const { error } = await supabase.from("menu_items").update({ is_current: false }).eq("id", itemId).eq("user_id", user.id);
  if (error) {
    redirect(`/app?error=${encodeURIComponent(getErrorMessage(error, "Unable to update Current Menu."))}`);
  }

  revalidatePath("/app");
  revalidatePath("/app/library");
  revalidatePath("/app/planner");
  revalidatePath(`/app/items/${itemId}`);
  redirect(redirectTo);
}

export async function deleteMenuItemAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const itemId = formData.get("item_id")?.toString();

  if (!user || !itemId) redirect("/app");

  const { error } = await supabase.from("menu_items").delete().eq("id", itemId).eq("user_id", user.id);
  if (error) {
    redirect(`/app/items/${itemId}?error=${encodeURIComponent(getErrorMessage(error, "Unable to delete item."))}`);
  }

  revalidatePath("/app");
  revalidatePath("/app/library");
  revalidatePath("/app/shopping-list");
  revalidatePath("/app/planner");
  redirect("/app/library");
}

export async function toggleCurrentAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const itemId = formData.get("item_id")?.toString();
  const isCurrent = formData.get("is_current") === "true";

  if (!user || !itemId) redirect("/app/library");

  const { error } = await supabase
    .from("menu_items")
    .update({ is_current: !isCurrent })
    .eq("id", itemId)
    .eq("user_id", user.id);
  if (error) {
    redirect(`${formData.get("redirect_to")?.toString() || "/app/library"}?error=${encodeURIComponent(getErrorMessage(error, "Unable to update Current Menu."))}`);
  }

  revalidatePath("/app");
  revalidatePath("/app/library");
  revalidatePath("/app/planner");
  revalidatePath(`/app/items/${itemId}`);
  redirect(formData.get("redirect_to")?.toString() || "/app/library");
}

export async function addIngredientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const itemId = formData.get("item_id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const redirectTo = formData.get("redirect_to")?.toString() || `/app/items/${itemId}`;
  const quantity = Number(formData.get("quantity") || 1);
  const unitLabel = formData.get("unit_label")?.toString().trim() || "unit";

  if (!user || !itemId || !name) redirect(`${redirectTo}?error=Enter+an+ingredient+name.`);

  const { data: existingIngredient } = await supabase
    .from("ingredients")
    .select("id")
    .eq("user_id", user.id)
    .eq("menu_item_id", itemId)
    .ilike("name", name)
    .maybeSingle();

  if (existingIngredient) {
    redirect(`${redirectTo}?error=${encodeURIComponent("That ingredient already exists on this item.")}`);
  }

  const { error } = await supabase.from("ingredients").insert({
    user_id: user.id,
    menu_item_id: itemId,
    name,
    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
    unit_label: unitLabel,
    on_shopping_list: false
  });
  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(getErrorMessage(error, "Unable to add ingredient."))}`);
  }

  revalidatePath(`/app/items/${itemId}`);
  revalidatePath(`/app/items/${itemId}/ingredients`);
  redirect(redirectTo);
}

export async function deleteIngredientAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const ingredientId = formData.get("ingredient_id")?.toString();
  const itemId = formData.get("item_id")?.toString();
  const redirectTo = formData.get("redirect_to")?.toString() || `/app/items/${itemId}`;

  if (!user || !ingredientId || !itemId) redirect("/app");

  const { error } = await supabase.from("ingredients").delete().eq("id", ingredientId).eq("user_id", user.id);
  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(getErrorMessage(error, "Unable to delete ingredient."))}`);
  }

  revalidatePath(`/app/items/${itemId}`);
  revalidatePath(`/app/items/${itemId}/ingredients`);
  revalidatePath("/app/shopping-list");
  redirect(redirectTo);
}

export async function toggleIngredientShoppingAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const ingredientId = formData.get("ingredient_id")?.toString();
  const ingredientIds = formData
    .get("ingredient_ids")
    ?.toString()
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const itemId = formData.get("item_id")?.toString();
  const nextValue = formData.get("next_value") === "true";
  const redirectTo = formData.get("redirect_to")?.toString() || `/app/items/${itemId}`;

  if (!user || (!ingredientId && !ingredientIds?.length)) redirect("/app");

  let updateQuery = supabase.from("ingredients").update({ on_shopping_list: nextValue }).eq("user_id", user.id);
  if (ingredientIds?.length) {
    updateQuery = updateQuery.in("id", ingredientIds);
  } else if (ingredientId) {
    updateQuery = updateQuery.eq("id", ingredientId);
  }

  const { error } = await updateQuery;
  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(getErrorMessage(error, "Unable to update shopping list."))}`);
  }

  if (itemId) {
    revalidatePath(`/app/items/${itemId}`);
    revalidatePath(`/app/items/${itemId}/ingredients`);
  }
  revalidatePath("/app/shopping-list");
  redirect(redirectTo);
}

export async function updateShoppingGroupAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const ingredientIds = formData
    .get("ingredient_ids")
    ?.toString()
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const quantity = Number(formData.get("quantity") || 1);
  const unitLabel = formData.get("unit_label")?.toString().trim() || "unit";
  const redirectTo = formData.get("redirect_to")?.toString() || "/app/shopping-list";

  if (!user || !ingredientIds?.length) redirect(redirectTo);

  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  const count = ingredientIds.length;
  const base = Math.floor((safeQuantity / count) * 100) / 100;
  const remainder = Math.round((safeQuantity - base * (count - 1)) * 100) / 100;

  const results = await Promise.all(
    ingredientIds.map((id, index) =>
      supabase
        .from("ingredients")
        .update({
          quantity: index === count - 1 ? remainder : base,
          unit_label: unitLabel
        })
        .eq("id", id)
        .eq("user_id", user.id)
    )
  );

  const updateError = results.find((result) => result.error)?.error;
  if (updateError) {
    redirect(`${redirectTo}?error=${encodeURIComponent(getErrorMessage(updateError, "Unable to update shopping item."))}`);
  }

  revalidatePath("/app/shopping-list");
  redirect(redirectTo);
}

export async function addCalendarEntryAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const menuItemId = formData.get("menu_item_id")?.toString();
  const plannedDate = formData.get("planned_date")?.toString();
  const redirectTo = formData.get("redirect_to")?.toString() || (plannedDate ? `/app/planner?mode=week&date=${plannedDate}` : "/app/planner");

  if (!user || !menuItemId || !plannedDate) redirect(redirectTo);

  const { error } = await supabase.from("calendar_entries").insert({
    user_id: user.id,
    menu_item_id: menuItemId,
    planned_date: plannedDate
  });
  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(getErrorMessage(error, "Unable to add item to plan."))}`);
  }

  revalidatePath("/app/planner");
  revalidatePath(`/app/items/${menuItemId}`);
  redirect(redirectTo);
}

export async function deleteCalendarEntryAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const entryId = formData.get("entry_id")?.toString();
  const redirectTo = formData.get("redirect_to")?.toString() || "/app/planner";

  if (!user || !entryId) redirect(redirectTo);

  const { error } = await supabase.from("calendar_entries").delete().eq("id", entryId).eq("user_id", user.id);
  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(getErrorMessage(error, "Unable to remove planned item."))}`);
  }

  revalidatePath("/app/planner");
  redirect(redirectTo);
}

export async function createLookupAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const table = formData.get("table")?.toString();
  const name = formData.get("name")?.toString().trim();

  if (!user || !name || !table || !["meal_types", "cooking_times", "ingredient_units"].includes(table)) {
    redirect("/app/settings?error=Unable+to+create+option.");
  }

  const { error } = await supabase.from(table).insert({
    user_id: user.id,
    name,
    sort_order: 999
  });

  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(getErrorMessage(error, "Unable to create option."))}`);
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/items/new");
  redirect("/app/settings");
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const fullName = formData.get("full_name")?.toString().trim() || null;

  if (!user) redirect("/login");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email || null,
    full_name: fullName
  });

  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(getErrorMessage(error, "Unable to save profile."))}`);
  }

  revalidatePath("/app/settings");
  redirect("/app/settings");
}

export async function deleteLookupAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const table = formData.get("table")?.toString();
  const id = formData.get("id")?.toString();

  if (!user || !id || !table || !["meal_types", "cooking_times", "ingredient_units"].includes(table)) {
    redirect("/app/settings");
  }

  const { error } = await supabase.from(table).delete().eq("id", id).eq("user_id", user.id);
  if (error) {
    redirect(`/app/settings?error=${encodeURIComponent(getErrorMessage(error, "Unable to delete option."))}`);
  }

  revalidatePath("/app/settings");
  revalidatePath("/app/items/new");
  redirect("/app/settings");
}
