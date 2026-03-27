"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, Check, Minus, Plus, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { removeFromCurrentAction } from "@/lib/data/actions";
import type { MenuItem } from "@/lib/types";
import { MealTypePill } from "@/components/ui/meal-type-pill";
import { DEFAULT_IMAGE } from "@/lib/utils";

type CurrentMenuSectionsProps = {
  sections: Array<[string, MenuItem[]]>;
};

export function CurrentMenuSections({ sections }: CurrentMenuSectionsProps) {
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [ingredientPickerItem, setIngredientPickerItem] = useState<MenuItem | null>(null);
  const [addedIngredientIds, setAddedIngredientIds] = useState<string[]>([]);
  const [ingredientPickerError, setIngredientPickerError] = useState("");
  const orderedItems = sections.flatMap(([, items]) => items);

  return (
    <>
      <div className="stack-lg current-menu-stack">
        <div className="menu-grid">
          {orderedItems.map((item) => (
            <div key={item.id} className="menu-card-frame">
              <div className="menu-card">
                <Link href={`/app/items/${item.id}`} className="menu-card-image-link">
                  <img src={item.image_url || DEFAULT_IMAGE} alt={item.name} className="menu-card-image" />
                  <div className="menu-card-overlay" />
                  <div className="menu-card-copy">
                    <h3>{item.name}</h3>
                    <MealTypePill name={item.meal_type?.name} />
                  </div>
                </Link>
                <button className="menu-card-badge" type="button" onClick={() => setPendingItem(item)} aria-label="Remove from current menu">
                  <Minus size={14} />
                </button>
              </div>

              <Link href={`/app/planner?quickAdd=${item.id}`} className="menu-card-plan-button" aria-label={`Plan ${item.name}`}>
                <CalendarPlus size={15} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {pendingItem ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card stack-md">
            <div className="modal-head">
              <h3>Remove from Current Menu?</h3>
              <button type="button" className="ghost-icon-button" onClick={() => setPendingItem(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="muted-copy">Before you remove {pendingItem.name}, add anything you&apos;ll need later.</p>
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setIngredientPickerItem(pendingItem);
                setAddedIngredientIds([]);
                setIngredientPickerError("");
                setPendingItem(null);
              }}
            >
              Choose ingredients first
            </button>
            <form action={removeFromCurrentAction}>
              <input type="hidden" name="item_id" value={pendingItem.id} />
              <input type="hidden" name="redirect_to" value="/app" />
              <button className="button button-secondary modal-full-button" type="submit">
                No, just remove it
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {ingredientPickerItem ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card stack-md">
            <div className="modal-head">
              <h3>{ingredientPickerItem.name}</h3>
              <button type="button" className="ghost-icon-button" onClick={() => setIngredientPickerItem(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="muted-copy">Add what you&apos;ll need later, then remove this from your menu.</p>
            {ingredientPickerItem.ingredients?.length ? (
              <div className="stack-sm">
                {ingredientPickerItem.ingredients.map((ingredient) => (
                  <div key={ingredient.id} className="ingredient-inline-row">
                    <span>{ingredient.name}</span>
                    <span className="ingredient-line-separator">·</span>
                    <span className="muted-copy">
                      {ingredient.quantity ?? 1} {ingredient.unit_label || "unit"}
                    </span>
                    <button
                      className={addedIngredientIds.includes(ingredient.id) ? "icon-mini-button active" : "icon-mini-button"}
                      type="button"
                      aria-label={`Add ${ingredient.name}`}
                      onClick={async () => {
                        try {
                          setIngredientPickerError("");
                          const supabase = createClient();
                          const { error } = await supabase.from("ingredients").update({ on_shopping_list: true }).eq("id", ingredient.id);
                          if (error) throw error;
                          setAddedIngredientIds((current) => (current.includes(ingredient.id) ? current : [...current, ingredient.id]));
                        } catch {
                          setIngredientPickerError("Could not add that ingredient right now.");
                        }
                      }}
                    >
                      {addedIngredientIds.includes(ingredient.id) ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted-copy">No ingredients to pull into your list.</p>
            )}

            {ingredientPickerError ? <p className="form-error">{ingredientPickerError}</p> : null}

            <form action={removeFromCurrentAction}>
              <input type="hidden" name="item_id" value={ingredientPickerItem.id} />
              <input type="hidden" name="redirect_to" value="/app" />
              <button className="button button-secondary modal-full-button" type="submit">
                Remove From Current Menu
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
